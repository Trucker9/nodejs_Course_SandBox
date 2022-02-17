


const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFreatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  // if no tour found, we create error and pass it to next()!
  if (!tour) {
    next(new AppError(`No tour found with ${req.params.id} ID.`, 404));
    return;
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
  });
});

// exports.createTour = async (req, res) => {
//   try {
//     const newTour = await Tour.create(req.body);

//     res.status(201).send({
//       status: 'success',
//       data: {
//         tours: newTour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).send({
    status: 'success',
    data: {
      tours: newTour,
    },
  });
});
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) {
    next(new AppError(`No tour found with ${req.params.id} ID.`, 404));
    return;
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    next(new AppError(`No tour found with ${req.params.id} ID.`, 404));
    return;
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: null,
    },
  });
});

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
      // if we set 0 for each value, it wont show up in results.
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
