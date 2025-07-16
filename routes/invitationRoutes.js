const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { setInvitationSetting, getInvitationSetting } = require('../controllers/invitationController');

router.post('/settings', protect, setInvitationSetting);
router.get('/settings', protect, getInvitationSetting);

router.get('/invite/:guestId', async (req, res) => {
    const { guestId } = req.params;

    try {
        const guest = await Guest.findById(guestId);
        if (!guest) {
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        res.status(200).json({
            success: true,
            invitation: `You are invited to the wedding! 🎉\n\nGuest: ${guest.name}\nSide: ${guest.side}\nCategory: ${guest.category}\n\nPlease confirm your attendance by replying to this message.`,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;