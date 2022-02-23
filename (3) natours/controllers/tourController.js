const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query); // MongooseQuery + expressQuery
  features.filter().sort().limitFields().paginate();
  // awaiting the result Query:
  const tours = await features.mongooseQuery;
  // Sending back results.
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: { tours: tours },
  });
});
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);

// Returns the function above!.
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  // https://docs.mongodb.com/v5.0/reference/operator/aggregation-pipeline/
  const stats = await Tour.aggregate([
    // Stage 1 - Filtering stuff
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    // Stage 2 - Calculating data based on groups
    {
      // We can group documents and do calculations
      $group: {
        // Shows the result of calculations below, for each value of the field that we specify here as _id.
        _id: '$difficulty',
        // Adds 1 for each document that goes through pipeLine
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    // Stage 3 - sorting the result of pipeline (result of calculations above)

    {
      $sort: { avgPrice: 1 }, // 1: ascending
    },
    // Stage 4
    {
      $match: {
        _id: { $ne: 'easy' }, // redefining _id
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});
// Go read the fucking docs
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      // creates individual copy of document for each value of startDate.
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      // if we set 0 for each value, it won't show up in results.
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
