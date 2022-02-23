const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');

const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  // Finding tours that have a field called 'tour' and its value is equal to req.params.tourId
  let filterObj = {};
  if (req.params.tourId) filterObj = { tour: req.params.tourId };
  // Population is done in the reviewModel.
  const reviews = await Review.find(filterObj);

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: reviews.length,
    data: { reviews: reviews },
  });
});

exports.setTourUserIds = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
});
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.getReview = factory.getOne(Review);
