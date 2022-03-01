const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// If there was one image:  upload.single('image') -> Result at: req.file
// If there were multiple images with the same name:  upload.array('images', 5)-> Result at: req.files
// If there were mix of them:
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // If files were missing.
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  // For adding the name of the image to the database, we have to add the name to req.body because we update tours
  // with an update method of the factory which accepts req.body and applies the changes to the DB.
  // So we add the file name to req.body and later it will be added to DB with the factory.updateOne(Tour) method
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  // Adding image names to body (later will be updated in DB).
  req.body.images = [];

  // .map() method that we used on the images, returns an array of promises (because its callback function is async).
  // Promise.all() awaits for the result of all promises that .map() has returned.
  // then next(); will be executed. (after that the processing of the images has finished)
  // if we don't do it like this, next() will be called immediately and req.body.images will remain empty and can't
  // be processed later for DB.
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );
  // After Promise.all() is finished, everything is done and next(); will be called.

  next();
});

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

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    // NOTE: in order to geospatial queries to work, we need to attribute an index to the field that the Geospatial
    // data is stored:  .index({ <fieldName> : '2dsphere' });
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
