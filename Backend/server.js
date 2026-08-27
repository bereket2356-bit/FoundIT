const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const dns = require("dns");

try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {}

const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const claimRoutes = require("./routes/claim");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/claims", claimRoutes);

// ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/items", require("./routes/items"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/notifications", require("./routes/notifications"));

app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
