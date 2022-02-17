const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

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
  // If protect throws error, user can't access to the next middleware which is tour controller.
  .post(tourController.createTour)
  .get(authController.protect ,tourController.getAllTours);
router
  .route('/:id')
  .get(tourController.getTour)
  .delete(tourController.deleteTour)
  .patch(tourController.updateTour);

module.exports = router;
