exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,

    data: { tours: tours },
  });
};

exports.getTour = (req, res) => {
  // req.params returns an object of values of the variables in the url
  // console.log(req.params);

  const tour = tours.find((el) => el.id === req.params.id * 1);

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
  });
};
exports.createTour = (req, res) => {
  // because we used middleware
  // console.log(req.body);
  const newID = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newID }, req.body);
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).send({
        status: 'success',
        data: {
          tours: newTour,
        },
      });
    }
  );
};
const fs = require('fs');
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

exports.updateTour = (req, res) => {
  // NOTE: Applying the change to the json file is not implemented.

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Update tour here>',
    },
  });
};

exports.deleteTour = (req, res) => {
  // NOTE: Applying the change to the json file is not implemented.

  res.status(204).json({
    status: 'success',
    data: {
      tour: null,
    },
  });
};

// ############################ Checking for validation in express. (param middleware)
exports.checkID = (req, res, next, val) => {

  const id = req.params.id * 1;

  if (id > tours.length) {
    res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
    return;
  }
  next(); // If return gets executed, next(); will be neutralized.
};

exports.checkBody = (req, res, next) =>{

  if (!req.body.hasOwnProperty("name") || !req.body.hasOwnProperty("price")) {
    res.status(400).json({
      status: "fail",
      message: "Missing name or price! "
    })
    
  }


  next();
}
