const Event = require('../models/Event');

// Add Event
exports.addEvent = async (req, res) => {
    try {
        const { name, date } = req.body;
        if (!name || !date) {
            return res.status(400).json({ success: false, message: 'Name and date are required' });
        }
        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }
        const event = await Event.create({
            user: req.user.id,
            name,
            date: parsedDate,
        });
        res.status(201).json({ success: true, event });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Get Events for logged-in user
exports.getUserEvents = async (req, res) => {
    try {
        const events = await Event.find({ user: req.user.id }).sort({ date: 1 });
        res.status(200).json({ success: true, events });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Get Event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.status(200).json({ success: true, event });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findByIdAndDelete(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Update Event by ID
exports.updateEvent = async (req, res) => {
    try {
        const { name, date } = req.body;
        const eventId = req.params.eventId.trim();
        if (!name || !date) {
            return res.status(400).json({ success: false, message: 'Name and date are required' });
        }
        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { name, date: parsedDate },
            { new: true, runValidators: true }
        );
        if (!updatedEvent) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            event: updatedEvent,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};