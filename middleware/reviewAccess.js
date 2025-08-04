// middleware/reviewAccess.js
const User = require('../models/User');
const packageFeatures = require('../controllers/packageFeatures');

// Middleware to check if reviews are enabled for the target vendor
async function checkVendorReviewAccess(req, res, next) {
    try {
        // Check vendor ID in body (for POST) or in query (for GET)
        const targetId = req.body.targetId || req.query.targetId;
        if (!targetId) {
            return res.status(400).json({ message: 'No vendor specified.' });
        }

        // Find the vendor user
        const vendor = await User.findById(targetId);
        if (!vendor || vendor.role !== 'vendor') {
            return res.status(404).json({ message: 'Vendor not found.' });
        }

        // Check the vendor's package
        const pkg = vendor.vendorPackage || 'BASIC';
        if (!packageFeatures[pkg].allowReviews) {
            return res.status(403).json({ message: 'Reviews are disabled for this vendor.' });
        }

        next();
    } catch (err) {
        res.status(500).json({ message: 'Error checking vendor review access.', error: err.message });
    }
}

module.exports = checkVendorReviewAccess;
