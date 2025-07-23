
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware'); // example middleware

// Apply protect middleware to all routes first
router.use(protect);

// Create review — only authenticated users
router.post('/', reviewController.createReview);

// Get reviews — only authenticated users
router.get('/', reviewController.getReviews);

// Update review — only the review owner or specific roles (example: user or admin)
router.put('/:id', authorize('user', 'admin'), reviewController.updateReview);

// Delete review — only the review owner or admin
router.delete('/:id', authorize('user', 'admin'), reviewController.deleteReview);

module.exports = router;
