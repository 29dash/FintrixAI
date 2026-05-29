const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

// Routes
const authRoutes = require("./routes/authRoutes");
const loanRoutes = require("./routes/loanRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// API Routes
app.use("/api/auth", authRoutes);

app.use("/api/loan", loanRoutes);

app.use("/api/payment", paymentRoutes);

app.use("/api/admin", adminRoutes);

// Home Route
app.get("/", (req, res) => {
    res.send("Loan Management Backend Running");
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log("MongoDB Error:", err));

// PORT
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});