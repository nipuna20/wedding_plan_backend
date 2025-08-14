// bookingController.js (modified)

const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create a booking (customer or vendor for availability)
exports.createBooking = async (req, res) => {
  try {
    const {
      vendorId,
      serviceId,
      packageId,
      date,
      time,
      address,
      paymentType,
      bookingType = 'booking' // Default to 'booking'
    } = req.body;

    // Always use JWT user as customerId
    const customerId = req.user._id;

    // Check if vendorId exists and is a vendor
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(400).json({ success: false, message: 'Vendor not found or not a valid vendor' });
    }

    // For availability bookings, ensure the user is the vendor
    if (bookingType === 'availability' && customerId.toString() !== vendorId.toString()) {
      return res.status(403).json({ success: false, message: 'Only vendors can set their own availability' });
    }

    // Validate date is in the future
    const today = new Date();
    const bookingDate = new Date(date);
    if (bookingDate < today) {
      return res.status(400).json({ success: false, message: 'Booking date must be in the future' });
    }

    // Validate time slots
    if (!Array.isArray(time) || time.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one time slot is required' });
    }

    // Check for time slot conflicts with confirmed customer bookings
    const existingCustomerBookings = await Booking.find({
      vendorId,
      date: new Date(date),
      time: { $in: time },
      bookingType: 'booking',
      status: 'confirmed' // Only check confirmed bookings
    });
    if (existingCustomerBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: `One or more time slots are already booked by customers for vendor ${vendorId} on ${date}`
      });
    }

    // For availability bookings, check for existing availability to prevent duplicates
    if (bookingType === 'availability') {
      const existingAvailability = await Booking.find({
        vendorId,
        date: new Date(date),
        time: { $in: time },
        bookingType: 'availability'
      });
      if (existingAvailability.length > 0) {
        return res.status(400).json({
          success: false,
          message: `One or more time slots are already marked as available for vendor ${vendorId} on ${date}`
        });
      }
    }

    // New: Check if vendor has already reached max bookings (2) for the day (for customer bookings only)
    if (bookingType === 'booking') {
      const confirmedCount = await Booking.countDocuments({
        vendorId,
        date: new Date(date),
        bookingType: 'booking',
        status: 'confirmed'
      });
      if (confirmedCount >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Vendor has reached the maximum number of bookings (2) for this day'
        });
      }
    }

    const booking = await Booking.create({
      customerId,
      vendorId,
      serviceId,
      packageId,
      date,
      time,
      address,
      paymentType,
      bookingType,
      status: bookingType === 'booking' ? 'pending' : 'confirmed' // Set status based on booking type
    });

    // Send notification to vendor for customer bookings
    if (bookingType === 'booking') {
      const notification = await Notification.create({
        userId: vendorId,
        message: `New booking request from customer ${customerId} for ${date} at ${time.join(', ')}`,
        bookingId: booking._id, // Include bookingId for action
        createdAt: new Date()
      });
      console.log(`Notification created for vendor ${vendorId}: ${JSON.stringify(notification)}`);
    }

    console.log(`${bookingType === 'availability' ? 'Availability' : 'Booking'} created: Customer ${customerId} for vendor ${vendorId} on ${date} at ${time}`);
    res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Confirm a booking (vendor only)
exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure only the vendor can confirm the booking
    if (req.user.role !== 'vendor' || booking.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to confirm this booking' });
    }

    // Check if booking is already confirmed or rejected
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Booking is already ${booking.status}` });
    }

    // New: Check if confirming this would exceed max bookings (2) for the day
    const confirmedCount = await Booking.countDocuments({
      vendorId: booking.vendorId,
      date: booking.date,
      bookingType: 'booking',
      status: 'confirmed'
    });
    if (confirmedCount >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Cannot confirm: Vendor has reached the maximum number of bookings (2) for this day'
      });
    }

    // Update booking status to confirmed
    booking.status = 'confirmed';
    await booking.save();

    // Send notification to customer
    const customerNotification = await Notification.create({
      userId: booking.customerId,
      message: `Your booking for ${booking.date.toISOString().split('T')[0]} at ${booking.time.join(', ')} has been confirmed by the vendor.`,
      bookingId: booking._id,
      createdAt: new Date()
    });
    console.log(`Customer notification created: ${JSON.stringify(customerNotification)}`);

    // Send confirmation notification to vendor
    const vendorNotification = await Notification.create({
      userId: booking.vendorId,
      message: `You have confirmed the booking for ${booking.date.toISOString().split('T')[0]} at ${booking.time.join(', ')}.`,
      bookingId: booking._id,
      createdAt: new Date()
    });
    console.log(`Vendor notification created: ${JSON.stringify(vendorNotification)}`);

    console.log(`Booking confirmed: ID ${req.params.bookingId} for vendor ${booking.vendorId}`);
    res.json({ success: true, booking });
  } catch (err) {
    console.error('Error confirming booking:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Reject a booking (vendor only)
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure only the vendor can reject the booking
    if (req.user.role !== 'vendor' || booking.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this booking' });
    }

    // Check if booking is already confirmed or rejected
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Booking is already ${booking.status}` });
    }

    // Update booking status to rejected
    booking.status = 'rejected';
    await booking.save();

    // Send notification to customer
    const notification = await Notification.create({
      userId: booking.customerId,
      message: `Your booking for ${booking.date.toISOString().split('T')[0]} at ${booking.time.join(', ')} was not accepted by the vendor. Please find another vendor.`,
      bookingId: booking._id,
      createdAt: new Date()
    });
    console.log(`Customer notification created: ${JSON.stringify(notification)}`);

    console.log(`Booking rejected: ID ${req.params.bookingId} for vendor ${booking.vendorId}`);
    res.json({ success: true, message: 'Booking rejected' });
  } catch (err) {
    console.error('Error rejecting booking:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get bookings for the current user (customer or vendor)
exports.getMyBookings = async (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'customer') {
      bookings = await Booking.find({ customerId: req.user._id, bookingType: 'booking' }).populate('vendorId');
    } else if (req.user.role === 'vendor') {
      bookings = await Booking.find({ vendorId: req.user._id, bookingType: 'booking' }).populate('customerId');
    } else {
      return res.status(403).json({ message: 'Only vendors or customers can view bookings' });
    }
    res.json({ success: true, bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get all bookings and availability for a user by query
exports.getUserBookings = async (req, res) => {
  try {
    const { userId, role } = req.query;
    let bookings;
    if (role === 'customer') {
      bookings = await Booking.find({ customerId: userId, bookingType: 'booking' }).populate('vendorId');
    } else if (role === 'vendor') {
      bookings = await Booking.find({ vendorId: userId }).populate('customerId'); // Include both bookings and availability
    } else {
      return res.status(400).json({ success: false, message: 'Role required (customer or vendor)' });
    }
    res.json({ success: true, bookings });
  } catch (err) {
    console.error('Error fetching user bookings:', err);
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
    console.error('Error fetching booking by ID:', err);
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
    console.log(`Booking payment status updated: Booking ID ${req.params.bookingId} to status ${status}`);
    res.json({ success: true, booking });
  } catch (err) {
    console.error('Error updating booking status:', err);
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

    // Check authorization based on booking type
    if (booking.bookingType === 'booking' && req.user.role === 'customer' && 
        booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
    }
    if (booking.bookingType === 'availability' && req.user.role === 'vendor' && 
        booking.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this availability' });
    }

    // Validate date is in the future
    const today = new Date();
    const newDate = new Date(date || booking.date);
    if (newDate < today) {
      return res.status(400).json({ success: false, message: 'Date must be in the future' });
    }

    // Validate time slots if provided
    if (time && (!Array.isArray(time) || time.length === 0)) {
      return res.status(400).json({ success: false, message: 'At least one time slot is required' });
    }

    // Check for time slot conflicts if time is updated
    if (time && booking.bookingType === 'booking') {
      const existingBookings = await Booking.find({
        vendorId: booking.vendorId,
        date: date || booking.date,
        time: { $in: time },
        bookingType: 'booking',
        status: 'confirmed', // Only check confirmed bookings
        _id: { $ne: booking._id } // Exclude the current booking
      });
      if (existingBookings.length > 0) {
        return res.status(400).json({
          success: false,
          message: `One or more time slots are already booked for vendor ${booking.vendorId} on ${date || booking.date}`
        });
      }
    }

    // For availability updates, check for conflicts with confirmed customer bookings
    if (time && booking.bookingType === 'availability') {
      const existingCustomerBookings = await Booking.find({
        vendorId: booking.vendorId,
        date: date || booking.date,
        time: { $in: time },
        bookingType: 'booking',
        status: 'confirmed' // Only check confirmed bookings
      });
      if (existingCustomerBookings.length > 0) {
        return res.status(400).json({
          success: false,
          message: `One or more time slots are already booked by customers for vendor ${booking.vendorId} on ${date || booking.date}`
        });
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

    console.log(`${booking.bookingType === 'availability' ? 'Availability' : 'Booking'} updated: ID ${req.params.bookingId} for vendor ${booking.vendorId}`);
    res.json({ success: true, booking: updatedBooking });
  } catch (err) {
    console.error('Error updating booking:', err);
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

    // Check authorization based on booking type
    if (booking.bookingType === 'booking' && req.user.role === 'customer' && 
        booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this booking' });
    }
    if (booking.bookingType === 'availability' && req.user.role === 'vendor' && 
        booking.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this availability' });
    }

    await Booking.findByIdAndDelete(req.params.bookingId);
    console.log(`${booking.bookingType === 'availability' ? 'Availability' : 'Booking'} deleted: ID ${req.params.bookingId}`);
    res.json({ success: true, message: `${booking.bookingType === 'availability' ? 'Availability' : 'Booking'} deleted` });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};