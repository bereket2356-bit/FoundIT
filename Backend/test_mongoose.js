const mongoose = require("mongoose");
const ItemSchema = new mongoose.Schema({
  date: Date
});
const Item = mongoose.model("Item", ItemSchema);
const item = new Item({ date: "" });
item.validate().then(() => console.log("OK")).catch(e => console.error(e.message));
