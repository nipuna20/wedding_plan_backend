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

    // Check if vendorId exists and is a vendor
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(400).json({ success: false, message: 'Vendor not found' });
    }

    // Validate time slots
    if (!Array.isArray(time) || time.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one time slot is required' });
    }

    // Check for time slot conflicts
    const existingBookings = await Booking.find({
      vendorId,
      date: new Date(date),
      time: { $in: time }
    });
    if (existingBookings.length > 0) {
      return res.status(400).json({ success: false, message: 'One or more time slots are already booked' });
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
    const { userId, role } = req.query;
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

// Update booking details
exports.updateBooking = async (req, res) => {
  try {
    const { date, time, address, paymentType } = req.body;
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if the user is the customer who created the booking
    if (req.user.role === 'customer' && booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
    }

    // Validate date is in the future
    const today = new Date();
    const newDate = new Date(date);
    if (newDate < today) {
      return res.status(400).json({ success: false, message: 'Date must be in the future' });
    }

    // Validate time slots if provided
    if (time && (!Array.isArray(time) || time.length === 0)) {
      return res.status(400).json({ success: false, message: 'At least one time slot is required' });
    }

    // Check for time slot conflicts if time is updated
    if (time) {
      const existingBookings = await Booking.find({
        vendorId: booking.vendorId,
        date: date || booking.date,
        time: { $in: time },
        _id: { $ne: booking._id } // Exclude the current booking
      });
      if (existingBookings.length > 0) {
        return res.status(400).json({ success: false, message: 'One or more time slots are already booked' });
      }
    }

    // Update only provided fields
    const updateData = {};
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (address) updateData.address = address;
    if (paymentType) updateData.paymentType = paymentType;

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({ success: true, booking: updatedBooking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if the user is the customer who created the booking
    if (req.user.role === 'customer' && booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this booking' });
    }

    await Booking.findByIdAndDelete(req.params.bookingId);
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};