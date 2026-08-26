const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const dotenv = require("dotenv");
dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const email = "admin@foundit.com";
    const existing = await User.findOne({ email });
    
    if (existing) {
      console.log("Admin already exists!");
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    await User.create({
      name: "Super Admin",
      email: email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully! (admin@foundit.com / admin123)");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();
