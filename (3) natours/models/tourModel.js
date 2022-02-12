const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// Creating schema
const schemaOptions = {
  toJSON: {
    virtuals: true, // show virtual properties when sending back result as JSON
  },
  toObject: {
    virtuals: true,
  },
};
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
      // validate: {
      //   validator: validator.isAlpha, // value will be passed to function
      //   message: 'Tour name must only contain characters',
      // },
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Custom validator
      validate: {
        // val -> input value!
        validator: function (val) {
          // this only points to current doc on NEW document creation (NOT ON UPDATE)
          return val < this.price;
        },
        // ({VALUE}) -> mongoose shit
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  schemaOptions
);

// ############################## Virtual Properties
// These properties wont be saved in DB, but will be calculated each time we get documents.
// NOTE: since these properties are not a part of the database, we can not use them in queries. one trick is to use them in controllers, but its not a good practice. these two must stay separate.
// FAT models and thin controllers bitch.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// ############################## DB MIDDLEWARE

// ########## Document MIDDLEWARE
// runs before .save() and .create() (NOT FOR UPDATE)
tourSchema.pre('save', function (next) {
  // this -> current document that is being saved. so slug will be saved to the document!
  this.slug = slugify(this.name, { lower: true });
  // It will stuck in POST if we dont call next();
  next();
});

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// ########## QUERY MIDDLEWARE
// only works for find(); :
// tourSchema.pre('find', function(next) {
// works for all find methods :
tourSchema.pre(/^find/, function (next) {
  // Here we can chain a query method like what we do in the controller. basically we use this when we need to hide some data. it applies to all requests of DB.
  // this will be the first Query method.
  this.find({ secretTour: { $ne: true } });

  // Adding time.
  this.start = Date.now();
  next();
});
// After document saved.
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// ########## AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  // this.pipeline() -> array that we passed to Model.aggregate();
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

// Creating model out of schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
