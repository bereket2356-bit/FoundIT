const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const User = require("../models/User");
const Setting = require("../models/Setting");
const bcrypt = require("bcryptjs");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// GET /api/admin/stats
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const lostItemsCount = await Item.countDocuments({ type: "lost" });
    const foundItemsCount = await Item.countDocuments({ type: "found" });

    // items claimed
    const claimedCount = await Item.countDocuments({ status: "claimed" });

    // claims
    const pendingClaimsCount = await Claim.countDocuments({
      status: "pending",
    });
    const rejectedClaimsCount = await Claim.countDocuments({
      status: "rejected",
    });

    res.json({
      lost: lostItemsCount,
      found: foundItemsCount,
      claimed: claimedCount,
      pending: pendingClaimsCount,
      rejected: rejectedClaimsCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/reports
router.get("/reports", protect, adminOnly, async (req, res) => {
  try {
    // 1. Items Reported Over Time (last 30 days or general grouping by month/day)
    // We'll group by YYYY-MM-DD
    const itemsOverTime = await Item.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          lost: { $sum: { $cond: [{ $eq: ["$type", "lost"] }, 1, 0] } },
          found: { $sum: { $cond: [{ $eq: ["$type", "found"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Map to expected frontend format (e.g., name, lost, found)
    const itemsReportedData = itemsOverTime.map((item) => ({
      name: item._id,
      lost: item.lost,
      found: item.found,
    }));

    // 2. Top Lost Categories
    const topCategories = await Item.aggregate([
      { $match: { type: "lost" } },
      { $group: { _id: "$category", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 5 }, // top 5
    ]);

    const topCategoriesData = topCategories.map((cat) => ({
      name: cat._id || "Uncategorized",
      value: cat.value,
    }));

    // 3. Claim Resolution Rate
    const claims = await Claim.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    let approved = 0,
      rejected = 0,
      pending = 0;
    claims.forEach((c) => {
      if (c._id === "approved") approved = c.count;
      else if (c._id === "rejected") rejected = c.count;
      else if (c._id === "pending") pending = c.count;
    });

    const claimResolutionData = [
      { name: "Approved", value: approved },
      { name: "Rejected", value: rejected },
      { name: "Pending", value: pending },
    ];

    res.json({
      itemsReportedData,
      topCategoriesData,
      claimResolutionData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/users
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const { status, role, q, sortBy, sortDir } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { studentId: { $regex: q, $options: "i" } },
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sortBy) {
      sortObj = {};
      sortObj[sortBy] = sortDir === "asc" ? 1 : -1;
    }

    const users = await User.find(filter).sort(sortObj).lean();

    // Fetch stats for users manually (items reported, claims made)
    const itemsCounts = await Item.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);
    const claimsCounts = await Claim.aggregate([
      { $group: { _id: "$claimant", count: { $sum: 1 } } },
    ]);

    const itemsMap = {};
    itemsCounts.forEach((i) => (itemsMap[i._id] = i.count));

    const claimsMap = {};
    claimsCounts.forEach((c) => (claimsMap[c._id] = c.count));

    let enrichedUsers = users.map((u) => ({
      ...u,
      itemsReported: itemsMap[u._id] || 0,
      claimsMade: claimsMap[u._id] || 0,
    }));

    // allow sorting by itemsReported or claimsMade
    if (sortBy === "itemsReported") {
      enrichedUsers.sort((a, b) =>
        sortDir === "asc"
          ? a.itemsReported - b.itemsReported
          : b.itemsReported - a.itemsReported,
      );
    } else if (sortBy === "claimsMade") {
      enrichedUsers.sort((a, b) =>
        sortDir === "asc"
          ? a.claimsMade - b.claimsMade
          : b.claimsMade - a.claimsMade,
      );
    }

    res.json(enrichedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/users (Create a user requiring signup requirements)
router.post("/users", protect, adminOnly, async (req, res) => {
  let { name, email, password, role, status, isVerified } = req.body;
  if (email) email = email.trim().toLowerCase();

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields (Name, Email, Password).",
      });
    }

    if (name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Name must be at least 2 characters long." });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole =
      role && ["admin", "user"].includes(role.toLowerCase())
        ? role.toLowerCase()
        : "user";
    const userStatus =
      status && ["Active", "Suspended"].includes(status) ? status : "Active";

    const verifiedFlag =
      isVerified !== undefined
        ? isVerified === true ||
          isVerified === "true" ||
          isVerified === "Verified"
        : true;

    const newUser = await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
      role: userRole,
      status: userStatus,
      authProvider: "local",
      isVerified: verifiedFlag,
    });

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      isVerified: newUser.isVerified,
      createdAt: newUser.createdAt,
      itemsReported: 0,
      claimsMade: 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/admin/users/:id/status
router.patch("/users/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active", "Suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = status;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/admin/users/:id/verify
router.patch("/users/:id/verify", protect, adminOnly, async (req, res) => {
  try {
    const { isVerified } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isVerified =
      isVerified !== undefined ? Boolean(isVerified) : !user.isVerified;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/settings
router.get("/settings", protect, adminOnly, async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/admin/settings
router.patch("/settings", protect, adminOnly, async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    const fields = [
      "orgName",
      "adminEmail",
      "campusLocation",
      "autoArchive",
      "publicPortal",
      "retentionPeriod",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
