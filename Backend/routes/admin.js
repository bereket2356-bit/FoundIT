const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const User = require("../models/User");
const Setting = require("../models/Setting");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// GET /api/admin/stats
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const lostItemsCount = await Item.countDocuments({ type: "lost" });
    const foundItemsCount = await Item.countDocuments({ type: "found" });
    
    // items claimed
    const claimedCount = await Item.countDocuments({ status: "claimed" });
    
    // claims
    const pendingClaimsCount = await Claim.countDocuments({ status: "pending" });
    const rejectedClaimsCount = await Claim.countDocuments({ status: "rejected" });

    res.json({
      lost: lostItemsCount,
      found: foundItemsCount,
      claimed: claimedCount,
      pending: pendingClaimsCount,
      rejected: rejectedClaimsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/users
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().lean();
    
    // Fetch stats for users manually (items reported, claims made)
    const itemsCounts = await Item.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } }
    ]);
    const claimsCounts = await Claim.aggregate([
      { $group: { _id: "$claimant", count: { $sum: 1 } } }
    ]);

    const itemsMap = {};
    itemsCounts.forEach(i => itemsMap[i._id] = i.count);
    
    const claimsMap = {};
    claimsCounts.forEach(c => claimsMap[c._id] = c.count);

    const enrichedUsers = users.map(u => ({
      ...u,
      itemsReported: itemsMap[u._id] || 0,
      claimsMade: claimsMap[u._id] || 0
    }));

    res.json(enrichedUsers);
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
    
    const fields = ["orgName", "adminEmail", "campusLocation", "autoArchive", "publicPortal", "retentionPeriod"];
    fields.forEach(field => {
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
