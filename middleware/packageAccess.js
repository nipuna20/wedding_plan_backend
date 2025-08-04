// middleware/packageAccess.js
const packageFeatures = require('../controllers/packageFeatures');

function checkVendorFeature(feature) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== 'vendor') {
            return res.status(403).json({ message: 'Only vendors can use this feature.' });
        }
        const currentPackage = req.user.vendorPackage || 'BASIC';
        if (!packageFeatures[currentPackage][feature]) {
            return res.status(403).json({ message: 'Upgrade your package to use this feature.' });
        }
        next();
    };
}

module.exports = checkVendorFeature;
