const User = require('../models/User');
const packageFeatures = require('../controllers/packageFeatures');
const ChatMessage = require('../models/ChatMessage'); // <-- Don't forget this!

// Send a message (customer <-> vendor, only if vendor has chatWithCustomer enabled)
async function sendMessage(req, res) {
    try {
        const { receiverId, message } = req.body;
        const senderId = req.user._id;

        if (!receiverId || !message) {
            return res.status(400).json({ message: 'receiverId and message are required.' });
        }

        // Find sender and receiver user records
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
            return res.status(404).json({ message: 'Sender or receiver not found.' });
        }

        // Determine if vendor is involved (sender or receiver)
        const vendorUser = sender.role === 'vendor' ? sender
            : receiver.role === 'vendor' ? receiver
                : null;

        if (!vendorUser) {
            return res.status(403).json({ message: 'Chat is only allowed between vendors and customers.' });
        }

        // Check vendor package feature
        const pkg = vendorUser.vendorPackage || 'BASIC';
        if (!packageFeatures[pkg].chatWithCustomer) {
            return res.status(403).json({ message: 'This vendor cannot use chat with customer on current package.' });
        }

        // Save the message
        const chatMessage = new ChatMessage({
            senderId,
            receiverId,
            message,
        });

        await chatMessage.save();

        res.status(201).json(chatMessage);
    } catch (err) {
        res.status(500).json({ message: 'Error sending message', error: err.message });
    }
}

// Get conversation between two users
async function getConversation(req, res) {
    try {
        const userId = req.user._id;
        const { otherUserId } = req.query;

        if (!otherUserId) {
            return res.status(400).json({ message: 'otherUserId is required.' });
        }

        const messages = await ChatMessage.find({
            $or: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching conversation', error: err.message });
    }
}

module.exports = {
    sendMessage,
    getConversation
};
