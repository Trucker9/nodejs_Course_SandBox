const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

// Custom routes
// First we mutate the request object with aliasTopTour middleware, then we pass the request to the getAllTours !
// we need to pre fill the req.query with : limit=5&sort=ratingsAverage,price and send it to getAllTours middleware.
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  // ###################### chaining multiple middleware functions (Can be used in access checks)
  .post(tourController.createTour)
  .get(tourController.getAllTours);
router
  .route('/:id')
  .get(tourController.getTour)
  .delete(tourController.deleteTour)
  .patch(tourController.updateTour);

module.exports = router;
