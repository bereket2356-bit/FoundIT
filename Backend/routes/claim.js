const express = require("express");
const router = express.Router();
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const Notification = require("../models/Notification");
const { protect, adminOnly } = require("../middleware/authMiddleware");

/*
=====================================
📌 USER: CREATE CLAIM REQUEST
=====================================
*/
router.post("/", protect, async (req, res) => {
  try {
    const {
      itemId,
      proof_description,
      proof_image,
      lost_location,
      lost_date,
      contact_info,
      message,
    } = req.body;

    const desc = proof_description || message;
    const contact = contact_info || req.user.email;

    if (!itemId || !desc) {
      return res.status(400).json({
        message: "Item ID and proof description are required.",
      });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Prevent duplicate claim
    const existing = await Claim.findOne({
      item: itemId,
      claimant: req.user._id,
      status: "pending",
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "You already have a pending claim for this item." });
    }

    const claim = await Claim.create({
      item: itemId,
      claimant: req.user._id,
      proof_description: desc,
      proof_image: proof_image || undefined,
      lost_location: lost_location || undefined,
      lost_date: lost_date || undefined,
      contact_info: contact,
    });

    if (item.status === "open") {
      item.status = "pending";
      if (!item.claimant) item.claimant = req.user._id;
      await item.save();
    }

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
    const { status, q, sortBy, sortDir } = req.query;

    const filter = {};
    if (status) filter.status = status;

    if (q) {
      filter.$or = [
        { proof_description: { $regex: q, $options: "i" } },
        { contact_info: { $regex: q, $options: "i" } },
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sortBy) {
      sortObj = {};
      sortObj[sortBy] = sortDir === "asc" ? 1 : -1;
    }

    let claims = await Claim.find(filter)
      .populate("item")
      .populate("claimant")
      .sort(sortObj);

    if (q) {
      const lowerQ = q.toLowerCase();
      claims = claims.filter(
        (c) =>
          (c.proof_description &&
            c.proof_description.toLowerCase().includes(lowerQ)) ||
          (c.contact_info && c.contact_info.toLowerCase().includes(lowerQ)) ||
          (c.item &&
            c.item.title &&
            c.item.title.toLowerCase().includes(lowerQ)) ||
          (c.claimant &&
            c.claimant.name &&
            c.claimant.name.toLowerCase().includes(lowerQ)) ||
          (c.claimant &&
            c.claimant.email &&
            c.claimant.email.toLowerCase().includes(lowerQ)),
      );
    }

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
    const claim = await Claim.findById(req.params.id).populate("item");
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    claim.status = "approved";
    await claim.save();

    // Update item status
    await Item.findByIdAndUpdate(claim.item._id || claim.item, {
      status: "claimed",
    });

    // Create Notification for the claimant
    const itemTitle = claim.item?.title || "an item";
    await Notification.create({
      user: claim.claimant,
      title: "Claim Approved! 🎉",
      message: `Your claim for "${itemTitle}" was approved.`,
      type: "claim_approved",
      relatedId: claim._id,
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
    const claim = await Claim.findById(req.params.id).populate("item");
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    claim.status = "rejected";
    await claim.save();

    // Re-open item so another user can claim it
    await Item.findByIdAndUpdate(claim.item._id || claim.item, {
      status: "open",
    });

    // Create Notification for the claimant
    const itemTitle = claim.item?.title || "an item";
    await Notification.create({
      user: claim.claimant,
      title: "Claim Rejected",
      message: `Your claim for "${itemTitle}" was rejected.`,
      type: "claim_rejected",
      relatedId: claim._id,
    });

    res.json({ message: "Claim rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
