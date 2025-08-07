const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, required: true },   // Embedded ID (from user's serviceDetails)
    packageId: { type: mongoose.Schema.Types.ObjectId },                   // Embedded ID (from user's packages)
    date: { type: Date, required: true },
    time: [{ type: String, required: true }], // Array of time slots
    address: { type: String, required: true },
    paymentType: { type: String, enum: ['credit_card', 'cash', 'advance', 'full'], default: 'cash' },
    paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    bookingType: { type: String, enum: ['booking', 'availability'], default: 'booking' },
    status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' } // Added 'rejected'
}, { timestamps: true });

// Index for efficient time slot conflict checks
bookingSchema.index({ vendorId: 1, date: 1, time: 1, bookingType: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);