const Guest = require('../models/Guest');
const User = require('../models/User'); // Make sure this is imported
const sendEmail = require('../utils/sendEmail'); // Import sendEmail utility

// ➕ Add a new guest
exports.addGuest = async (req, res) => {
    try {
        const { name, side, phone, category } = req.body;

        const guest = await Guest.create({
            user: req.user.id,
            name,
            side,
            phone,
            category,
        });

        const link = `${process.env.CLIENT_URL}/invite/${guest._id}`;

        res.status(201).json({
            success: true,
            guest,
            invitationLink: link
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 📥 Get all guests with invitationSent flag
exports.getGuests = async (req, res) => {
    try {
        const guests = await Guest.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, guests }); // Make sure it sends guests
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ✅ Mark selected guests as invitation sent
exports.sendInvitations = async (req, res) => {
    try {
        // Get the invitation content from the request body
        const { 
            brideName, 
            groomName, 
            weddingDate, 
            time, 
            venue, 
            message 
        } = req.body;

        // Get all guests for the user
        const guests = await Guest.find({ user: req.user.id });
        
        if (guests.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No guests found to send invitations' 
            });
        }

        // Create HTML template for the invitation
        const generateInvitationHTML = (guest) => {
            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="text-align: center; color: #4a4a4a;">Wedding Invitation</h2>
                    <p style="text-align: center; font-size: 18px;">Dear ${guest.name},</p>
                    <p style="text-align: center; font-size: 16px;">
                        We are pleased to invite you to celebrate the marriage of
                    </p>
                    <h3 style="text-align: center; color: #8a2be2;">${brideName} & ${groomName}</h3>
                    <div style="text-align: center; margin: 20px 0;">
                        <p><strong>Date:</strong> ${weddingDate}</p>
                        <p><strong>Time:</strong> ${time}</p>
                        <p><strong>Venue:</strong> ${venue}</p>
                    </div>
                    <p style="text-align: center; font-style: italic;">${message}</p>
                    <p style="text-align: center; margin-top: 20px;">
                        Please confirm your attendance by responding to this email.
                    </p>
                </div>
            `;
        };

        // Send emails to all guests
        let successCount = 0;
        const failedGuests = [];

        for (const guest of guests) {
            try {
                if (!guest.email) {
                    failedGuests.push({ name: guest.name, reason: 'No email address found' });
                    continue;
                }

                await sendEmail({
                    to: guest.email,
                    subject: `Wedding Invitation: ${brideName} & ${groomName}`,
                    html: generateInvitationHTML(guest)
                });
                
                successCount++;
            } catch (emailError) {
                console.error(`Failed to send invitation to ${guest.name}: ${emailError.message}`);
                failedGuests.push({ name: guest.name, reason: 'Email sending failed' });
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully sent ${successCount} invitations`,
            totalGuests: guests.length,
            successCount,
            failedGuests
        });

    } catch (error) {
        console.error('Error sending invitations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send invitations',
            error: error.message
        });
    }
};

// ✅ Update guest details
exports.updateGuest = async (req, res) => {
    try {
        const { guestId } = req.params;
        console.log('User ID:', req.user.id);
        console.log('Guest ID:', guestId);

        const guest = await Guest.findOne({ _id: guestId, user: req.user.id });

        if (!guest) {
            console.log('Guest not found or user mismatch');
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        // Update fields
        if (req.body.name !== undefined) guest.name = req.body.name;
        if (req.body.phone !== undefined) guest.phone = req.body.phone;
        if (req.body.side !== undefined) guest.side = req.body.side;
        if (req.body.category !== undefined) guest.category = req.body.category;

        await guest.save();
        res.status(200).json({ success: true, guest });

    } catch (error) {
        console.error('Update Guest Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
