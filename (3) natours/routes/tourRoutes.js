const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// mounting another router on this router( if url was like "/svdvdfvdfbkdn/reviews" then use reviewRouter)
// but now one thing is missing, reviewRouter doesn't have access to the "tourId". so we need to use {mergeParams:true} in it.
router.use('/:tourId/reviews', reviewRouter);
// Custom routes
// First we mutate the request object with aliasTopTour middleware, then we pass the request to the getAllTours !
// we need to prefill the req.query with : limit=5&sort=ratingsAverage,price and send it to getAllTours middleware.
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  // If protect throws error, user can't access to the next middleware which is tour controller.
  .post(tourController.createTour)
  .get(authController.protect, tourController.getAllTours);
router
  .route('/:id')
  .get(tourController.getTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  )
  .patch(tourController.updateTour);

module.exports = router;
