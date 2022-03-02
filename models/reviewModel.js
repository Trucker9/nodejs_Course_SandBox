const mongoose = require('mongoose');
const Tour = require('./tourModel');

const schemaOptions = {
  toJSON: {
    virtuals: true, // show virtual properties when sending back result as JSON
  },
  toObject: {
    virtuals: true,
  },
};

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'You have not entered any reviews yet!'],
      maxlength: [1000, 'Review too long!'],
    },
    rating: {
      type: Number,
      max: 5,
      min: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A tour need an author.'],
    },
  },
  schemaOptions
);

// #################################################### Preventing more than one reviews from one user.
// What we want here is that the combination of user and tour, always be unique. in other words, no duplicate
// user ID and tour ID. we can do it by indexes like this:
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.pre(/^find/, function (next) {
  // // Limiting populated fields.
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  // We want to remove the population of the tour on reviews. ( When getting tours data, we populate for reviews. the
  // in reviews we populate for tour, and user, this is too much, so we just keep a reference(objectID) to the tour
  // and won't populate it.
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// ################################################################# Calculating ratingsAverage on saving a review.
// We want to call .aggregate() in the current model, so we have to use static methods of the model because the this
// keyword points to the current model in static methods.
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // In static model methods, the "this" keyword points to the current model, so we can call .aggregate() on it.
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      // Grouping by tour.
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);

  // ----------- Inserting to Tour
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review that is being saved. "this.tour" = ID of the tour.
  this.constructor.calcAverageRatings(this.tour);
});

// ############################################ Calculate review statistics when a review gets updated or deleted using
// methods: findByIdAndUpdate findByIdAndDelete
// Here we are creating a query middleware.
// Difference between query middleware and document middleware :
// https://stackoverflow.com/questions/63091182/what-is-the-difference-between-document-middleware-model-middleware-aggregate
// "this" points to the current query not the current document. in order to get the current document, we execute the
// query with findOne() and that gives us the current document. we save it as "r" in "this" (passing a data from pre
// middleware to post middleware).
// IF U DON'T UNDERSTAND WTF IS GOING ON, WATCH 11-023-13:55
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
