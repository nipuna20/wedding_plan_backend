const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, default: '', trim: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['customer', 'vendor'], required: true },
    password: { type: String, required: true },

    invitationSetting: {
        weddingDate: String, // Changed to String
        sendBeforeDays: Number,
        brideName: String,
        groomName: String,
        time: String,
        venue: String,
        message: String,
        template: String
    },

    unavailableDates: {
        type: [Date],
        default: []
    },

    serviceDetails: [
        {
            serviceName: String,
            serviceType: String,
            description: String,
            paymentPolicy: String,
            mediaUrls: [String]
        }
    ],

    packages: [
        {
            packageName: String,
            packagePrice: Number,
            description: String,
            serviceId: {
                type: mongoose.Schema.Types.ObjectId,
                // ref: 'Service'
            }
        }
    ],

    businessName: { type: String, default: '' },
    address: { type: String, default: '' },
    mediaUrls: [{ type: String }],
    socialLinks: {
        instagram: { type: String, default: '' },
        facebook: { type: String, default: '' },
        youtube: { type: String, default: '' }
    },

    tasks: [
        {
            name: String,
            timeline: String,
            deadline: Date,
            subtasks: [
                {
                    title: String,
                    completed: {
                        type: Boolean,
                        default: false
                    }
                }
            ]
        }
    ],

    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', userSchema);