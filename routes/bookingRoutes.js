const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware'); // <-- ADD THIS LINE

// Create a booking
router.post('/', protect, bookingController.createBooking);

// Get all bookings for user (customer/vendor)
router.get('/', protect, bookingController.getUserBookings);

// Get bookings for logged in user (customer or vendor)
router.get('/my', protect, bookingController.getMyBookings);

// Get a single booking by ID
router.get('/:bookingId', protect, bookingController.getBookingById);

// Update booking payment status
router.put('/:bookingId/status', protect, bookingController.updateBookingStatus);

// Delete a booking
router.delete('/:bookingId', protect, bookingController.deleteBooking);

module.exports = router;
