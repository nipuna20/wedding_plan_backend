// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

exports.register = async (req, res) => {
    try {
        const { phone, email, role, password } = req.body;

        const existing = await User.findOne({ $or: [{ phone }, { email }] });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const user = new User({ phone, email, role, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    const { phone, password } = req.body;
    try {
        const user = await User.findOne({ phone });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            msg: 'Login successful',
            token,
            user: {
                id: user._id,
                phone: user.phone,
                email: user.email,
                role: user.role,
            }
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHashed = crypto.createHash('sha256').update(resetToken).digest('hex');

        console.log('Reset token (raw):', resetToken);
        console.log('Reset token (hashed):', resetTokenHashed);

        user.resetPasswordToken = resetTokenHashed;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

        await sendEmail({
            to: user.email,
            subject: 'Password Reset',
            html: `
                <h2>Password Reset</h2>
                <p>Click the link below to reset your password:</p>
                <a href="${resetURL}">${resetURL}</a>
                <p>This link will expire in 1 hour.</p>
            `
        });

        res.status(200).json({ message: 'Reset link sent to email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('Reset endpoint received token:', token);
    console.log('Hashed token for DB lookup:', hashedToken);

    try {
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            console.log('No user found or token expired.');
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        await sendEmail({
            to: user.email,
            subject: 'Password Reset Confirmation',
            text: `Hi ${user.email}, your password has been successfully changed. If you didn't do this, please contact support.`,
        });

        res.json({ message: 'Password has been reset successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
