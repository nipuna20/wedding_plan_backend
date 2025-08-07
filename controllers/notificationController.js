const Notification = require('../models/Notification');

// Get notifications for the current user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(50); // Limit to recent 50 notifications
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};