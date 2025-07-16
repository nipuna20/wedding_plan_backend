const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Decoded token:', decoded);
        console.log('🔍 Searching for user with ID:', decoded.id);



        // 👇 This should populate req.user
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            console.log('❌ User not found with ID:', decoded.id);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('✅ User found:', req.user);
        // 👇 This should populate req.user


        next();
    } catch (err) {
        console.error('JWT verification failed:', err);
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }
        next();
    };
};




module.exports = { protect, authorize };
