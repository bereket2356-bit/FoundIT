const express = require("express");
const router = express.Router();
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const { protect, adminOnly } = require("../middleware/authMiddleware");


/*
=====================================
📌 USER: CREATE CLAIM REQUEST
=====================================
*/
router.post("/", protect, async (req, res) => {
  try {
    const { itemId, message } = req.body;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Prevent duplicate claim
    const existing = await Claim.findOne({
      item: itemId,
      claimant: req.user._id,
    });

    if (existing) {
      return res.status(400).json({ message: "You already claimed this item" });
    }

    const claim = await Claim.create({
      item: itemId,
      claimant: req.user._id,
      message,
    });

    res.status(201).json(claim);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/*
=====================================
📌 ADMIN: GET ALL CLAIMS
=====================================
*/
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate("item")
      .populate("claimant")
      .sort({ createdAt: -1 });

    res.json(claims);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/*
=====================================
📌 ADMIN: APPROVE CLAIM
=====================================
*/
router.patch("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    claim.status = "approved";
    await claim.save();

    // Update item status
    await Item.findByIdAndUpdate(claim.item, {
      status: "claimed",
    });

    res.json({ message: "Claim approved" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/*
=====================================
📌 ADMIN: REJECT CLAIM
=====================================
*/
router.patch("/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    claim.status = "rejected";
    await claim.save();

    res.json({ message: "Claim rejected" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;