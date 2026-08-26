const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    proof_description: {
      type: String,
      required: true,
    },
    proof_image: {
      type: String, // URL/path to the image
    },
    lost_location: {
      type: String,
    },
    lost_date: {
      type: Date,
    },
    contact_info: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Claim", claimSchema);
