const mongoose = require("mongoose");
const dns = require("dns");

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI environment variable is not defined.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log("MongoDB Connected:", conn.connection.host);
  } catch (error) {
    console.error("MongoDB Connection Warning:", error.message);
    // Auto-retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
