const express = require("express");
const router = express.Router();
const Item = require("../models/Item");

// CREATE item
router.post("/", async (req, res) => {
  try {
    const newItem = new Item(req.body);
    const savedItem = await newItem.save();
    res.json(savedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find()
      .populate("user")
      .populate("claimant")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CLAIM an item (sets claimant and status -> pending)
router.post("/:id/claim", async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.body; // expecting claimant user id from client

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.status !== "open") {
      return res
        .status(400)
        .json({ message: "Item is not available for claim" });
    }

    item.claimant = user || null;
    item.status = "pending";
    const saved = await item.save();
    const populated = await Item.findById(saved._id)
      .populate("user")
      .populate("claimant");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE item status (admin) - e.g., change to 'claimed' when approved
router.patch("/:id/status", async (req, res) => {
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