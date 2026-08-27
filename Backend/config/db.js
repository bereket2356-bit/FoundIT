const mongoose = require("mongoose");
const dns = require("dns");

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {}

const DIRECT_URI =
  "mongodb://FoundIT:333221@ac-qwpjbsj-shard-00-00.hapnrhs.mongodb.net:27017,ac-qwpjbsj-shard-00-01.hapnrhs.mongodb.net:27017,ac-qwpjbsj-shard-00-02.hapnrhs.mongodb.net:27017/?ssl=true&replicaSet=atlas-13iucv-shard-0&authSource=admin&retryWrites=true&w=majority";

const connectDB = async () => {
  const uri = process.env.MONGO_URI || DIRECT_URI;
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected:", conn.connection.host);
  } catch (error) {
    console.log("MongoDB SRV Warning:", error.message);
    if (uri.includes("+srv")) {
      console.log("Retrying MongoDB connection with direct seedlist...");
      try {
        const conn = await mongoose.connect(DIRECT_URI, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log("MongoDB Connected (Direct):", conn.connection.host);
        return;
      } catch (err) {
        console.log("Direct MongoDB Error:", err.message);
      }
    }
    setTimeout(connectDB, 5000);
  }
};
module.exports = connectDB;
