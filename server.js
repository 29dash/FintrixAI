const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const { ensureDefaultAdmin } = require("./controllers/authController");

// Routes
const authRoutes = require("./routes/authRoutes");
const loanRoutes = require("./routes/loanRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

console.log("SERVER FILE LOADED");
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
    console.log("HOME ROUTE HIT");
    res.send("Loan Management Backend Running");
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB Connected");
        console.log("MongoDB State:", mongoose.connection.readyState);

        try {
            const adminUser = await ensureDefaultAdmin();
            if (adminUser) {
                console.log("Default admin ensured:", adminUser.email);
            }
        } catch (error) {
            console.error("Admin bootstrap error:", error.message);
        }
    })
    .catch((err) => console.error("MongoDB Error:", err));
// PORT
const PORT = process.env.PORT || 5001;

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});