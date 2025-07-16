const Booking = require('../models/Booking');
const User = require('../models/User');

// Create a booking (customer only)
exports.createBooking = async (req, res) => {
    try {
        const {
            vendorId,
            serviceId,
            packageId,
            date,
            time,
            address,
            paymentType
        } = req.body;

        // Always use JWT user as customerId
        const customerId = req.user._id;

        // Optionally: check if vendorId exists and is a vendor
        const vendor = await User.findById(vendorId);
        if (!vendor || vendor.role !== 'vendor') {
            return res.status(400).json({ success: false, message: 'Vendor not found' });
        }

        const booking = await Booking.create({
            customerId,
            vendorId,
            serviceId,
            packageId,
            date,
            time,
            address,
            paymentType
        });

        res.status(201).json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Get bookings for the current user (customer or vendor)
exports.getMyBookings = async (req, res) => {
    try {
        let bookings;
        if (req.user.role === 'customer') {
            bookings = await Booking.find({ customerId: req.user._id }).populate('vendorId');
        } else if (req.user.role === 'vendor') {
            bookings = await Booking.find({ vendorId: req.user._id }).populate('customerId');
        } else {
            return res.status(403).json({ message: 'Only vendors or customers can view bookings' });
        }
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Get all bookings for a user by query
exports.getUserBookings = async (req, res) => {
    try {
        const { userId, role } = req.query; // e.g. ?userId=...&role=customer
        let bookings;
        if (role === 'customer') {
            bookings = await Booking.find({ customerId: userId }).populate('vendorId');
        } else if (role === 'vendor') {
            bookings = await Booking.find({ vendorId: userId }).populate('customerId');
        } else {
            return res.status(400).json({ success: false, message: 'Role required (customer or vendor)' });
        }
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Get booking by ID (for customer or vendor)
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate('customerId vendorId');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const isCustomer = req.user.role === 'customer' &&
            booking.customerId && booking.customerId._id &&
            booking.customerId._id.toString() === req.user._id.toString();

        const isVendor = req.user.role === 'vendor' &&
            booking.vendorId && booking.vendorId._id &&
            booking.vendorId._id.toString() === req.user._id.toString();

        if (isCustomer || isVendor) {
            return res.json({ success: true, booking });
        }

        return res.status(403).json({ message: 'Not authorized to view this booking' });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Update booking payment status
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.bookingId,
            { paymentStatus: status },
            { new: true }
        );
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, message: 'Booking deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
