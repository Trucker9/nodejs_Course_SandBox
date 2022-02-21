const mongoose = require('mongoose');

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
      maxlength: [100, 'Review too long!'],
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

reviewSchema.pre(/^find/, function (next) {
  // // Limiting populated fields.
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  // We want to remove the population of the tour on reviews. (When getting tours data, we populate for reviews. the in reviews we populate for tour, and user, this is too much, so we just keep a reference(objectID) to the tour and wont populate it. 
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
