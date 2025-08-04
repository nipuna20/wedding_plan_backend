const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');
const checkVendorReviewAccess = require('../middleware/reviewAccess'); // <-- import the middleware

// Apply protect middleware to all routes first
router.use(protect);

// Create review — only if vendor allows reviews
router.post('/', checkVendorReviewAccess, reviewController.createReview);

// Get reviews — only if vendor allows reviews
router.get('/', checkVendorReviewAccess, reviewController.getReviews);

// Update review — only the review owner or admin
router.put('/:id', authorize('user', 'admin'), reviewController.updateReview);

// Delete review — only the review owner or admin
router.delete('/:id', authorize('user', 'admin'), reviewController.deleteReview);

module.exports = router;
