const Event = require('../models/Event');

// Add Event
exports.addEvent = async (req, res) => {
    try {
        const { name, date } = req.body;
        const event = await Event.create({
            user: req.user.id,
            name,
            date,
        });
        res.status(201).json({ success: true, event });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Events for logged-in user
exports.getUserEvents = async (req, res) => {
    try {
        const events = await Event.find({ user: req.user.id }).sort({ date: 1 });
        res.status(200).json({ success: true, events });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
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
        res.status(500).json({ success: false, message: 'Server error' });
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
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update Event by ID
exports.updateEvent = async (req, res) => {
    try {
        const { name, date } = req.body;
        const eventId = req.params.id.trim(); // Trim just in case

        console.log("Attempting to update event with ID:", eventId);
        const test = await Event.findById(eventId);

        if (!test) {
            console.log("Event not found using findById"); // Debug log
        } else {
            console.log("Event exists:", test);
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { name, date },
            { new: true, runValidators: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            event: updatedEvent
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};








