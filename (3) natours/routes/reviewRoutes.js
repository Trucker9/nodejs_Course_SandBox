const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

router
  .get('/', reviewController.getAllReviews)
  .post(
    '/',
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );
module.exports = router;
