const mongoose = require("mongoose");
const ItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["found", "lost"], required: true },
  title: { type: String, required: true },
  category: String,
  location: String,
  date: Date,
  description: String,
  image: String,
  status: { type: String, enum: ["open", "pending", "claimed", "resolved"], default: "open" },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});
const Item = mongoose.model("Item", ItemSchema);

const item1 = new Item({
  user: new mongoose.Types.ObjectId(),
  type: "lost",
  title: "Test",
  category: "Test",
  location: "Test",
  date: "2023-10-10",
  description: "Test",
  image: "Test",
});

const item2 = new Item({
  user: new mongoose.Types.ObjectId(),
  type: "lost",
  title: "Test",
  category: "Test",
  location: "Test",
  date: "", // this is what frontend sends if left empty
  description: "Test",
  image: "Test",
});

const item3 = new Item({
  user: new mongoose.Types.ObjectId(),
  type: "lost",
  title: "Test",
  category: "Test",
  location: "Test",
  date: "not a date", // this is what frontend sends if invalid format
  description: "Test",
  image: "Test",
});

async function run() {
  try {
    await item1.validate();
    console.log("item1 (valid date string): OK");
  } catch (e) { console.log("item1 ERROR:", e.message); }
  
  try {
    await item2.validate();
    console.log("item2 (empty string date): OK");
  } catch (e) { console.log("item2 ERROR:", e.message); }

  try {
    await item3.validate();
    console.log("item3 (invalid string date): OK");
  } catch (e) { console.log("item3 ERROR:", e.message); }
}

run();
