const Review = require('../models/Review');

async function createReview(req, res) {
  try {
    const { targetId, rating, comment } = req.body;
    const userId = req.user._id;

    const newReview = new Review({ userId, targetId, rating, comment });
    await newReview.save();

    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ message: 'Error creating review', error: err.message });
  }
}

async function getReviews(req, res) {
  try {
    const { targetId } = req.query;
    const filter = targetId ? { targetId } : {};
    const reviews = await Review.find(filter).populate('userId', 'name email');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews', error: err.message });
  }
}

async function updateReview(req, res) {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (!review.userId.equals(userId)) return res.status(403).json({ message: 'Not authorized' });

    const { rating, comment } = req.body;
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Error updating review', error: err.message });
  }
}

async function deleteReview(req, res) {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (!review.userId.equals(userId)) return res.status(403).json({ message: 'Not authorized' });

    await review.remove();

    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting review', error: err.message });
  }
}

module.exports = {
  createReview,
  getReviews,
  updateReview,
  deleteReview
};
