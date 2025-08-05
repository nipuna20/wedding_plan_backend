const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatMessageSchema = new Schema({
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    // Optionally, add a conversationId for group/threaded chat in future
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
