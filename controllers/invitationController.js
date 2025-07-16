const User = require('../models/User');

exports.setInvitationSetting = async (req, res) => {
    try {
        const { weddingDate, sendBeforeDays, brideName, groomName, time, venue, message, template } = req.body;

        console.log("Wedding Date:", weddingDate);
        console.log("Send Before Days:", sendBeforeDays);
        console.log("Bride Name:", brideName);
        console.log("Groom Name:", groomName);
        console.log("Time:", time);
        console.log("Venue:", venue);
        console.log("Message:", message);
        console.log("Template:", template);
        console.log("User ID:", req.user.id);

        const user = await User.findById(req.user.id);
        if (!user) {
            console.log("User not found");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.invitationSetting = { 
            weddingDate, 
            sendBeforeDays, 
            brideName, 
            groomName, 
            time, 
            venue, 
            message, 
            template 
        };
        await user.save();

        res.status(200).json({ success: true, message: 'Invitation settings saved successfully' });
    } catch (error) {
        console.error("Error in setInvitationSetting:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getInvitationSetting = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, invitation: user.invitationSetting });
    } catch (error) {
        console.error("Error in getInvitationSetting:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};