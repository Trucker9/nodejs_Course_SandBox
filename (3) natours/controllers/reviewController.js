const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  // Population is done in the reviewModel.
  const reviews = await Review.find();

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: reviews.length,
    data: { reviews: reviews },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  // If anything is on the body that doesn't fit in schema, it will be ignored.
  const newReview = await Review.create(req.body);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    data: { newReview: newReview },
  });
});

