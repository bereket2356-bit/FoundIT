const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const User = require("../models/User");
const Setting = require("../models/Setting");
const bcrypt = require("bcryptjs");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { generatePdfReport } = require("../utils/pdfReportGenerator");

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

// Helper to compute date range intervals
function computeDateRanges(range, customStart, customEnd) {
  const now = new Date();
  let start = null;
  let end = new Date();
  let prevStart = null;
  let prevEnd = null;
  let rangeLabel = "All Time";

  if (range === "7d") {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    prevEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    rangeLabel = "Last 7 Days";
  } else if (range === "30d" || !range) {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    prevStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    prevEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    rangeLabel = "Last 30 Days";
  } else if (range === "semester") {
    start = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
    prevStart = new Date(now.getTime() - 240 * 24 * 60 * 60 * 1000);
    prevEnd = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
    rangeLabel = "This Semester (120 Days)";
  } else if (range === "custom" && customStart && customEnd) {
    start = new Date(customStart);
    end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    const duration = end.getTime() - start.getTime();
    prevEnd = new Date(start.getTime() - 1);
    prevStart = new Date(start.getTime() - duration);
    rangeLabel = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  } else if (range === "all") {
    start = null;
    end = now;
    prevStart = null;
    prevEnd = null;
    rangeLabel = "All Time";
  }

  return { start, end, prevStart, prevEnd, rangeLabel };
}

async function getAggregatedReportData(range, customStart, customEnd) {
  const { start, end, prevStart, prevEnd, rangeLabel } = computeDateRanges(
    range,
    customStart,
    customEnd,
  );

  const itemMatch = {};
  const claimMatch = {};
  if (start && end) {
    itemMatch.createdAt = { $gte: start, $lte: end };
    claimMatch.createdAt = { $gte: start, $lte: end };
  }

  // 1. Total Items Posted (Current & Trend vs Previous Period)
  const totalItems = await Item.countDocuments(itemMatch);
  let itemsTrend = null;
  if (prevStart && prevEnd) {
    const prevItems = await Item.countDocuments({
      createdAt: { $gte: prevStart, $lte: prevEnd },
    });
    if (prevItems > 0) {
      itemsTrend = Math.round(((totalItems - prevItems) / prevItems) * 100);
    } else if (totalItems > 0) {
      itemsTrend = 100;
    } else {
      itemsTrend = 0;
    }
  }

  // 2. Total Claims Submitted (Current & Trend vs Previous Period)
  const totalClaims = await Claim.countDocuments(claimMatch);
  let claimsTrend = null;
  if (prevStart && prevEnd) {
    const prevClaims = await Claim.countDocuments({
      createdAt: { $gte: prevStart, $lte: prevEnd },
    });
    if (prevClaims > 0) {
      claimsTrend = Math.round(((totalClaims - prevClaims) / prevClaims) * 100);
    } else if (totalClaims > 0) {
      claimsTrend = 100;
    } else {
      claimsTrend = 0;
    }
  }

  // 3. Claim Resolution Data & Approval Rate (Case Insensitive)
  const claimResolutionAgg = await Claim.aggregate([
    ...(start && end ? [{ $match: claimMatch }] : []),
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  let approved = 0,
    rejected = 0,
    pending = 0;
  claimResolutionAgg.forEach((c) => {
    const s = (c._id || "").toLowerCase();
    if (s === "approved") approved += c.count;
    else if (s === "rejected") rejected += c.count;
    else pending += c.count;
  });

  const claimResolutionData = [
    { name: "Approved", value: approved },
    { name: "Rejected", value: rejected },
    { name: "Pending", value: pending },
  ];

  const resolvedClaims = approved + rejected;
  const approvalRate =
    resolvedClaims > 0
      ? Math.round((approved / resolvedClaims) * 100)
      : totalClaims > 0
        ? Math.round((approved / totalClaims) * 100)
        : 0;

  // 4. Average Time to Resolve a Claim
  const avgResolutionAgg = await Claim.aggregate([
    {
      $match: {
        status: { $in: ["approved", "rejected", "Approved", "Rejected"] },
        ...(start && end ? { updatedAt: { $gte: start, $lte: end } } : {}),
      },
    },
    {
      $project: {
        diffHours: {
          $divide: [
            { $subtract: ["$updatedAt", "$createdAt"] },
            1000 * 60 * 60,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgHours: { $avg: "$diffHours" },
      },
    },
  ]);

  let avgResolutionTime = "N/A";
  if (avgResolutionAgg.length > 0 && avgResolutionAgg[0].avgHours !== null) {
    const hours = avgResolutionAgg[0].avgHours;
    if (hours < 1) {
      avgResolutionTime = `${Math.max(1, Math.round(hours * 60))}m`;
    } else if (hours < 24) {
      avgResolutionTime = `${hours.toFixed(1)}h`;
    } else {
      avgResolutionTime = `${(hours / 24).toFixed(1)}d`;
    }
  }

  // 5. Top Categories in Period
  const topCategories = await Item.aggregate([
    ...(start && end ? [{ $match: itemMatch }] : []),
    {
      $group: {
        _id: {
          $cond: [{ $ifNull: ["$category", false] }, "$category", "General"],
        },
        value: { $sum: 1 },
      },
    },
    { $sort: { value: -1 } },
    { $limit: 6 },
  ]);

  const topCategoriesData = topCategories.map((cat) => ({
    name: cat._id
      ? cat._id.charAt(0).toUpperCase() + cat._id.slice(1)
      : "General",
    value: cat.value,
  }));

  const topCategory =
    topCategoriesData.length > 0 ? topCategoriesData[0].name : "None";
  const topCategoryCount =
    topCategoriesData.length > 0 ? topCategoriesData[0].value : 0;

  // 6. Most Common Lost/Found Location
  const topLocations = await Item.aggregate([
    {
      $match: {
        ...(start && end ? itemMatch : {}),
        location: { $exists: true, $ne: "" },
      },
    },
    { $group: { _id: "$location", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  const topLocation =
    topLocations.length > 0 && topLocations[0]._id
      ? topLocations[0]._id
      : "Campus Wide";

  // 7. Items Over Time (Case Insensitive lost/found)
  const itemsOverTime = await Item.aggregate([
    ...(start && end ? [{ $match: itemMatch }] : []),
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        lost: {
          $sum: {
            $cond: [
              { $eq: [{ $toLower: { $ifNull: ["$type", "lost"] } }, "lost"] },
              1,
              0,
            ],
          },
        },
        found: {
          $sum: {
            $cond: [
              { $eq: [{ $toLower: { $ifNull: ["$type", "found"] } }, "found"] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const itemsReportedData = itemsOverTime.map((item) => ({
    name: item._id,
    lost: item.lost,
    found: item.found,
  }));

  // 8. Breakdown items for table view
  const breakdownItems = await Item.find(itemMatch)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return {
    kpis: {
      totalItems,
      itemsTrend,
      totalClaims,
      claimsTrend,
      approvalRate,
      resolvedClaims,
      avgResolutionTime,
      topCategory,
      topCategoryCount,
      topLocation,
    },
    itemsReportedData,
    topCategoriesData,
    claimResolutionData,
    breakdownItems,
    rangeLabel,
  };
}

// GET /api/admin/reports (Enhanced with KPIs, Trends, Breakdown Table)
router.get("/reports", protect, adminOnly, async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const reportData = await getAggregatedReportData(range, startDate, endDate);
    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/reports/export-pdf (Generates downloadable PDF report)
router.get("/reports/export-pdf", protect, adminOnly, async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const reportData = await getAggregatedReportData(range, startDate, endDate);

    const safeDateStr = new Date().toISOString().split("T")[0];
    const filename = `FoundIT_Report_${range || "all"}_${safeDateStr}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    generatePdfReport(reportData, { rangeLabel: reportData.rangeLabel }, res);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: "Failed to generate PDF report." });
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
