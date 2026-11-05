const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.ensureDefaultAdmin = async () => {
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@fintrix.local").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const normalizedEmail = adminEmail.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email: normalizedEmail });

    if (existingAdmin) {
        if (!existingAdmin.isAdmin) {
            existingAdmin.isAdmin = true;
            await existingAdmin.save();
        }
        return existingAdmin;
    }

    const adminUser = new User({
        name: "Admin",
        email: normalizedEmail,
        password: await bcrypt.hash(adminPassword, 10),
        isAdmin: true,
    });

    await adminUser.save();
    return adminUser;
};

// REGISTER USER
exports.registerUser = async (req, res) => {
    console.log("1. Register route hit");

    try {
        const { name, email, password } = req.body;

        console.log("2. Request body received");

        const existingUser = await User.findOne({ email });

        console.log("3. User lookup completed");

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("4. Password hashed");

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        console.log("5. User saved");

        res.status(201).json({
            message: "User Registered Successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
};

// LOGIN USER
exports.loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid Password"
            });
        }

        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login Successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
            }
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};

//Profile
exports.getProfile = async (req, res) => {

    try {

        const user = await User.findById(req.user.id)
            .select("-password");

        res.status(200).json(user);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching profile",
            error: error.message
        });

    }

};