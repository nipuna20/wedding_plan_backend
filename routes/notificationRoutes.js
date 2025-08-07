const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Get notifications for the logged-in user
router.get('/', protect, notificationController.getNotifications);

module.exports = router;