const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.post('/', protect, bookingController.createBooking);
router.get('/', protect, bookingController.getUserBookings);
router.get('/my', protect, bookingController.getMyBookings);
router.get('/:bookingId', protect, bookingController.getBookingById);
router.put('/:bookingId', protect, bookingController.updateBooking);
router.put('/:bookingId/status', protect, bookingController.updateBookingStatus);
router.put('/:bookingId/confirm', protect, bookingController.confirmBooking);
router.put('/:bookingId/reject', protect, bookingController.rejectBooking); // New reject route
router.delete('/:bookingId', protect, bookingController.deleteBooking);

module.exports = router;