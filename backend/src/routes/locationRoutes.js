const express = require('express');
const { body } = require('express-validator');
const {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
} = require('../controllers/locationController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getLocations)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Location name is required'),
      body('shortCode').trim().notEmpty().withMessage('Short code is required'),
      body('warehouseId').notEmpty().withMessage('Warehouse ID is required'),
      validate,
    ],
    createLocation
  );

router
  .route('/:id')
  .get(getLocationById)
  .put(updateLocation);

module.exports = router;
