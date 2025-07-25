
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // e.g. product/vendor/booking id
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
