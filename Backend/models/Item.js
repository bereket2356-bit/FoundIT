const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    enum: ["found", "lost"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: String,
  location: String,
  description: String,
  image: String,
  status: {
    type: String,
    default: "open",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Item", ItemSchema);