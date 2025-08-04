const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const checkVendorFeature = require('../middleware/packageAccess');

const {
    updateUserProfile,
    getUserEvents,
    updateVendorSetup,
    updateVendorAvailability,
    addServiceDetails,
    getAllUserServices,
    deleteService,
    updateServiceDetails,
    getServiceById,
    addPackage,
    addMainTask,
    getTasks,
    addSubtask,
    getSubtasks,
    deleteSubtask,
    getAllPackages,
    getPackageById,
    deletePackage,
    updatePackage,
    addPackagesToService,
    deleteTask,
    selectVendorPackage // <-- make sure this is included
} = require('../controllers/userController');

// --- Placeholder handlers for features not implemented yet ---
const uploadHandler = (req, res) => {
    res.status(501).json({ message: 'Gallery upload not implemented yet.' });
};

const chatHandler = (req, res) => {
    res.status(501).json({ message: 'Chat feature not implemented yet.' });
};

// Get user profile
router.get('/profile', protect, (req, res) => {
    res.json({ user: req.user });
});

// Update base profile (name/email/phone)
router.put('/update-profile', protect, updateUserProfile);

// Update vendor-specific setup (business name, address, socials)
router.put('/vendor-setup', protect, authorize('vendor'), updateVendorSetup);

router.put('/vendor-availability', protect, authorize('vendor'), updateVendorAvailability);

router.post('/add-service', protect, authorize('vendor'), addServiceDetails);

router.get('/all-services', protect, getAllUserServices);

router.delete('/services/:serviceId', protect, authorize('vendor'), deleteService);

router.put('/services/:serviceId', protect, authorize('vendor'), updateServiceDetails);

router.get('/services/:serviceId', protect, authorize('vendor'), getServiceById);

router.post('/package', protect, authorize('vendor'), addPackage);

router.get('/packages', protect, authorize('vendor', 'customer'), getAllPackages);

router.get('/packages/:packageId', protect, authorize('vendor'), getPackageById);

router.delete('/packages/:packageId', protect, authorize('vendor'), deletePackage);

router.put('/packages/:packageId', protect, authorize('vendor'), updatePackage);

router.post('/services/:serviceId/packages', protect, authorize('vendor'), addPackagesToService);

// CUSTOMER TASK ROUTES
router.post('/task', protect, authorize('customer'), addMainTask);
router.get('/task', protect, authorize('customer'), getTasks);
router.post('/task/:taskIndex/subtask', protect, authorize('customer'), addSubtask);

router.get('/task/:taskIndex/subtasks', protect, authorize('customer'), getSubtasks);

router.delete('/task/:taskIndex/subtask/:subtaskIndex', protect, authorize('customer'), deleteSubtask);

router.put('/vendor/select-package', protect, authorize('vendor'), selectVendorPackage);

// Example: Protect gallery upload route (placeholder handler)
router.post('/vendor/gallery/upload', protect, authorize('vendor'), checkVendorFeature('galleryUpload'), uploadHandler);

// Example: Protect chat (placeholder handler)
router.post('/vendor/chat', protect, authorize('vendor'), checkVendorFeature('chatWithCustomer'), chatHandler);

// NEW TASK DELETE ROUTE
router.delete('/task/:taskIndex', protect, authorize('customer'), deleteTask);

// Optional: vendor-only route
router.get('/vendor-dashboard', protect, authorize('vendor'), (req, res) => {
    res.status(200).json({ message: `Welcome back, vendor ${req.user.email}` });
});

module.exports = router;
