const mongoose = require('mongoose');
const slugify = require('slugify');

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
      // This setter function will run each time a new value is being set.
      set: (val) => Math.round(val * 10) / 10,
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
    // --------------------------- Creating one document inside another document
    startLocation: {
      // Each of these subfields can have their own schema options.
      type: {
        type: String,
        default: 'Point',
        // We only want it to take one type of value (Point) among multiple GeoJSON types.
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // --------------------------- Embedded locations
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // --------------------------- Embedded users.
    // Customer passes the ID of user's that he wants to be marked as guide as an array, later with a pre-save middleware, we query for the actual user with those IDs and replace it with the actual user data. so at the end we have an array of users that are meant to be guide!
    // guide: Array,

    // --------------------------- Reference users.
    // Here we add these id's and later when we want to access them. then we populate them with a pre query middleware.(or we can call  .populate(<fieldName>) on the query.)
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    // // This can grow bigger and mess up our document, so instead of this we do virtual populate.
    // reviews: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Review',
    //   },
    // ],
  },
  schemaOptions
);
// ############################## Indexes
// If a field is wildly queried for, it's a good practice to add index for it. so mongoDB can easily search them and find the results faster.
// 1: ascending order. -1: descending order.
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
// ############################## Virtual Properties
// These properties wont be saved in DB, but will be calculated each time we get documents.
// NOTE: since these properties are not a part of the database, we can not use them in queries. one trick is to use them in controllers, but its not a good practice. these two must stay separate.
// FAT models and thin controllers bitch.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// VIRTUAL POPULATE: KEEPING A REFERENCE TO ALL THE CHILD DOCUMENTS ON A PARENT DOCUMENT, EVEN THOUGH WE ARE USING PARENT REFERENCING ON THE CHILDREN. THIS RESULTS TO NOT INCLUDING THE INFORMATION IN THE DATA BASE, BUT STILL HAVING ACCESS TO THEM.
// Here we have to somehow create a connection between reviews and tours.
// 'Review' is the reference that we want to query to, and in the reviewSchema, id of current document (which is tour) is called 'tour'. so foreignField: 'tour'.
// in the current document, same id exist in the field named _id. so localField :'_id'
// later we populate the result of this connection in the controller. results will be available on a field named 'reviews' as we specify down here.
// s1mple: '_id' field in the current model is called 'tour' in the review model.
// After this, we just need to populate 'reviews' field to see the final result. we do it on the query directly in this case.
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
// ########################################################################### DB MIDDLEWARES

// ########## Document MIDDLEWARE
// Defference between query middleware and document middleware : https://stackoverflow.com/questions/63091182/what-is-the-difference-between-document-middleware-model-middleware-aggregate
// runs before .save() and .create() (NOT FOR UPDATE)
tourSchema.pre('save', function (next) {
  // this -> current document that is being saved. so slug will be saved to the document!
  this.slug = slugify(this.name, { lower: true });
  // It will stuck in POST if we dont call next();

  next();
});
// // ######### Embedding Guides.
// // NOTE: by doing embedding like this, if any of the data of these guides changes, for (example email address), we have to write a function to search and see where that user is embedded and change the data there too. WE ARE NOT GONNA IMPLEMENT THAT IN THIS APP.
// tourSchema.pre('save', async function (next) {
//   const guidesIDArr = this.guides;
//   const guidesDocumentPromisesArr = guidesIDArr.map(
//     async (id) => await User.findById(id)
//   );
//   const guidesDocumentArr = await Promise.all(guidesDocumentPromisesArr);

//   this.guide = guidesDocumentArr;
//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// ########## QUERY MIDDLEWARE
// Defference between query middleware and document middleware : https://stackoverflow.com/questions/63091182/what-is-the-difference-between-document-middleware-model-middleware-aggregate
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
// Populating results with a query middleware. this runs each time there is a new query.
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

// ########## AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   // this.pipeline() -> array that we passed to Model.aggregate();
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//
//   // console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
