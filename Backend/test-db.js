const mongoose = require("mongoose");
require("dotenv").config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require("./models/User");
  const users = await User.find({});
  console.log("USERS IN DB:", users.map(u => ({ email: u.email, passLength: u.password.length })));
  process.exit(0);
}
check().catch(console.dir);
