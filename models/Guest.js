const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    side: {
        type: String,
        enum: ['bride', 'groom'],
        required: true,
    },
    phone: {
        type: String,
        required: false,
    },
    category: {
        type: String,
        enum: ['friends', 'colleagues', 'family'],
        required: true,
    },
    invitationSent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Guest', guestSchema);
