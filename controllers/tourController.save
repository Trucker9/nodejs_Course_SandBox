const Tour = require('../models/tourModel');

exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};

class APIFeatures {
  constructor(mongooseQuery, expressQueryStr) {
    this.mongooseQuery = mongooseQuery;
    this.expressQueryStr = expressQueryStr;
  }

  // From here I created next file!
}

exports.getAllTours = async (req, res) => {
  try {
    // 1A) Filtering
    // Removing unwanted options in query object.
    const queryObj = { ...req.query };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced Filtering
    // Example: Converting "gte" in query object to "$gte"
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (matched) => `$${matched}`
    );
    let findMethodRes = Tour.find(JSON.parse(queryString));

    // 2) Sorting
    // if sort exists in query
    if (req.query.sort) {
      // Converting "field1,field2" to "field1 field2"
      const sortBy = req.query.sort.split(',').join(' ');
      findMethodRes = findMethodRes.sort(sortBy);
    } else {
      // default sorting (reverse time)
      findMethodRes.sort('-createdAt');
    }

    // 3) Field Limiting (used when there is heavy process on server)
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');

      findMethodRes = findMethodRes.select(fields);
    } else {
      findMethodRes.select('-__v'); // "-" -> excludes __v in all responses.
    }

    // 4) Pagination
    const page = req.query.page * 1 || 1; // converting to number and setting the default to 1;
    const limit = req.query.limit * 1 || 100; // converting to number and setting the default to 100;
    const howManySkip = (page - 1) * limit;
    findMethodRes = findMethodRes.skip(howManySkip).limit(limit);
    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (howManySkip > numTours) throw new Error('This page does mot exist.');
    }
    // Tour.find( {filterObj} ) returns a Query. we do all of our chains and then we await the result of the query.
    // now our query is like : Tour.find().sort().select().skip().limit()
    // awaiting the result Query:
    const tours = await findMethodRes;
    // Sending back results.
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: tours.length,
      data: { tours: tours },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  // req.params returns an object of values of the variables in the url
  // console.log(req.params);
  // const tour = tours.find((el) => el.id === req.params.id * 1);
  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     tour: tour,
  //   },
  // });

  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour: tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
exports.createTour = async (req, res) => {
  // // because we used middleware
  // // console.log(req.body);
  // const newID = tours[tours.length - 1].id + 1;
  // const newTour = Object.assign({ id: newID }, req.body);
  // tours.push(newTour);
  // fs.writeFile(
  //   `${__dirname}/dev-data/data/tours-simple.json`,
  //   JSON.stringify(tours),
  //   (err) => {
  //   }
  // );

  // old school:
  // const newTour = new Tour({});
  // newTour.save();
  // New:
  try {
    // if any error happens, this promise will be rejected and the result will be available at the catch block.
    const newTour = await Tour.create(req.body);

    res.status(201).send({
      status: 'success',
      data: {
        tours: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    // https://mongoosejs.com/docs/api/model.html#model_Model.findByIdAndUpdate
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour: tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    // https://mongoosejs.com/docs/api/model.html#model_Model.findByIdAndUpdate
    await Tour.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour: null,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

// ############################ Checking for validation in express. (param middleware)
// exports.checkID = (req, res, next, val) => {
//   // const id = req.params.id * 1;
//   // if (id > tours.length) {
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: 'Invalid ID',
//   //   });
//   //   return;
//   // }
//   next(); // If return gets executed, next(); will be neutralized.
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price! ',
//     });
//   }

//   next();
// };
