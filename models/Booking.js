const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' }, // optional
    date: { type: Date, required: true },
    time: { type: String, required: true },
    address: { type: String, required: true },
    paymentType: { type: String, enum: ['credit_card', 'cash', 'advance', 'full'], default: 'cash' },
    paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
