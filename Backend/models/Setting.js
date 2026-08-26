const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  orgName: { type: String, default: "State University" },
  adminEmail: { type: String, default: "admin@stateu.edu" },
  campusLocation: { type: String, default: "Main Campus - North" },
  autoArchive: { type: Boolean, default: true },
  publicPortal: { type: Boolean, default: false },
  retentionPeriod: { type: String, default: "60 Days" },
}, { timestamps: true });

module.exports = mongoose.model("Setting", settingSchema);
