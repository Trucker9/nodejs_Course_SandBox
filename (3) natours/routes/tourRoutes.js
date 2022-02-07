const express = require('express');
const tourController = require('./../controllers/tourController');

const router = express.Router();

//#################### param middleware: only runs when an special parameter is present in the url
router.param('id', tourController.checkID);
router
  .route('/')
  // ###################### chaining multiple middleware functions (Can be used in access checks)
  .post(tourController.checkBody,tourController.createTour)
  .get(tourController.getAllTours);
router
  .route('/:id')
  .get(tourController.getTour)
  .delete(tourController.deleteTour)
  .patch(tourController.updateTour);

module.exports = router;
