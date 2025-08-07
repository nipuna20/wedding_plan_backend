const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');

// Send a message (customer <-> vendor)
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

        // Ensure chat is between a vendor and a customer
        const isVendorCustomerChat = 
            (sender.role === 'vendor' && receiver.role === 'customer') ||
            (sender.role === 'customer' && receiver.role === 'vendor');

        if (!isVendorCustomerChat) {
            return res.status(403).json({ message: 'Chat is only allowed between vendors and customers.' });
        }

        // Save the message with empty readBy array
        const chatMessage = new ChatMessage({
            senderId,
            receiverId,
            message,
            timestamp: new Date(),
            readBy: [], // Initialize with empty readBy array
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

        // Mark message as read by adding userId to readBy array
        await ChatMessage.updateMany(
            {
                $or: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ],
                readBy: { $ne: userId } // Only update if userId is not already in readBy
            },
            { $addToSet: { readBy: userId } } // Add userId to readBy array
        );

        const messages = await ChatMessage.find({
            $or: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        }).sort({ timestamp: 1 });

        res.json({ messages });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching conversation', error: err.message });
    }
}

// Get list of users who have messaged the current user
async function getChatUsers(req, res) {
    try {
        const userId = req.user._id;

        // Find all messages where the user is either sender or receiver
        const messages = await ChatMessage.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        })
            .populate('senderId', 'name profileImage role')
            .populate('receiverId', 'name profileImage role')
            .sort({ timestamp: -1 });

        // Create a map to store the latest message and unread count for each user
        const userMap = new Map();
        messages.forEach((msg) => {
            const otherUserId = msg.senderId._id.toString() === userId.toString()
                ? msg.receiverId._id
                : msg.senderId._id;
            const otherUser = msg.senderId._id.toString() === userId.toString()
                ? msg.receiverId
                : msg.senderId;

            if (!userMap.has(otherUserId.toString())) {
                userMap.set(otherUserId.toString(), {
                    _id: otherUserId,
                    name: otherUser.name,
                    profileImage: otherUser.profileImage,
                    role: otherUser.role,
                    lastMessage: msg.message,
                    lastMessageTime: msg.timestamp.toISOString(),
                    unreadCount: 0, // Initialize unread count
                });
            }

            // Increment unread count for messages sent to the user that they haven't read
            if (msg.receiverId._id.toString() === userId.toString() && 
                !msg.readBy.map(id => id.toString()).includes(userId.toString())) {
                const userData = userMap.get(otherUserId.toString());
                userData.unreadCount += 1;
                userMap.set(otherUserId.toString(), userData);
            }
        });

        // Convert map to array
        const users = Array.from(userMap.values());
        // Calculate total unread messages for the current user
        const totalUnread = users.reduce((sum, user) => sum + user.unreadCount, 0);
        res.json({ users, totalUnread });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching chat users', error: err.message });
    }
}

module.exports = {
    sendMessage,
    getConversation,
    getChatUsers
};