const express = require('express');
const router = express.Router();
const {
    register,
    login,
    forgotPassword,
    resetPassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware'); // ✅ FIXED

router.post('/signup', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.get('/profile', protect, (req, res) => {
    res.json({ msg: 'Welcome!', user: req.user });
});


module.exports = router;
