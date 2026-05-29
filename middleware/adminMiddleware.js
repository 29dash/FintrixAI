const User = require("../models/User");

const adminOnly = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || user.isAdmin !== true) {
            return res.status(403).json({ message: "Admin access denied" });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = adminOnly;