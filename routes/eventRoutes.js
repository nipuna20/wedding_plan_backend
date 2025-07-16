const express = require('express');
const router = express.Router();
const { addEvent, getUserEvents, getEventById, deleteEvent, updateEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addEvent);
router.get('/my-events', protect, getUserEvents);
router.get('/:id', protect, getEventById);
router.delete('/delete/:eventId', protect, deleteEvent);
router.put('/update/:eventId', protect, updateEvent);   


module.exports = router;

