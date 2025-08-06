const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

// All chat routes require authentication
router.use(protect);

// Anyone authenticated (vendor or customer) can send a message
router.post('/send', chatController.sendMessage);

// Get chat history (either user can access)
router.get('/conversation', chatController.getConversation);

// Get list of users who have messaged the current user
router.get('/users', chatController.getChatUsers);

module.exports = router;