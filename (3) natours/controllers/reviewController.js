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

// // Here we need to recreate this function using factory. but it has some additional steps, so we put them into another middleware and add it to routes
// exports.createReview = catchAsync(async (req, res, next) => {
//   // Getting tourId from parameters and userId from req. In case that they were not available on request object.
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user.id;
//   console.log('#######' + req.body);
//   // If anything is on the body that doesn't fit in schema, it will be ignored.
//   const newReview = await Review.create(req.body);
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     data: { newReview: newReview },
//   });
// });
exports.setTourUserIds = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
});
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.getReview = factory.getOne(Review);