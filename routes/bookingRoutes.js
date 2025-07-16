const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.post('/', protect, bookingController.createBooking);
router.get('/', protect, bookingController.getUserBookings);
router.get('/my', protect, bookingController.getMyBookings);
router.get('/:bookingId', protect, bookingController.getBookingById);
router.put('/:bookingId/status', protect, bookingController.updateBookingStatus);
router.delete('/:bookingId', protect, bookingController.deleteBooking);

module.exports = router;
