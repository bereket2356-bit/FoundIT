const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// CREATE item (Public or protected based on Settings, for now let's make it protected so users can report)
router.post("/", protect, async (req, res) => {
  try {
    const newItem = new Item({ ...req.body, user: req.user._id });
    const savedItem = await newItem.save();
    res.json(savedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all items (public or protected? Usually public can see lost/found. For admin dashboard, we need all)
router.get("/", async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const items = await Item.find(filter)
      .populate("user")
      .populate("claimant")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CLAIM an item
router.post("/:id/claim", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user._id;
    const {
      proof_description,
      proof_image,
      lost_location,
      lost_date,
      contact_info,
    } = req.body;

    if (!proof_description || !contact_info) {
      return res
        .status(400)
        .json({
          code: "VALIDATION_ERROR",
          message: "Proof description and contact info are required.",
        });
    }

    const item = await Item.findById(id);
    if (!item)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Item not found" });

    const Claim = require("../models/Claim");

    const existingClaim = await Claim.findOne({
      item: id,
      claimant: user,
      status: "pending",
    });
    if (existingClaim) {
      return res
        .status(409)
        .json({
          code: "DUPLICATE_CLAIM",
          message: "You already have a pending claim for this item.",
        });
    }

    if (item.status !== "open" && item.status !== "pending") {
      return res
        .status(400)
        .json({
          code: "INVALID_STATE",
          message: "Item is not available for claim.",
        });
    }

    item.status = "pending";
    // We do NOT set item.claimant here anymore, because multiple people could submit claims if we wanted,
    // but the schema says claimant is who claimed it. The old logic set item.claimant = user.
    // We'll leave it to just status="pending" so Admin can review all Claim documents.
    if (!item.claimant) item.claimant = user;
    const saved = await item.save();

    await Claim.create({
      item: id,
      claimant: user,
      proof_description,
      proof_image: proof_image || undefined,
      lost_location: lost_location || undefined,
      lost_date: lost_date || undefined,
      contact_info,
    });

    const populated = await Item.findById(saved._id)
      .populate("user")
      .populate("claimant");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  }
});

// UPDATE item status (admin)
router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["open", "pending", "claimed", "resolved"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.status = status;
    const saved = await item.save();
    const populated = await Item.findById(saved._id)
      .populate("user")
      .populate("claimant");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
