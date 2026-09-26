const express = require('express');
const { body } = require('express-validator');
const {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
} = require('../controllers/warehouseController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getWarehouses)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Warehouse name is required'),
      body('shortCode').trim().notEmpty().withMessage('Short code is required'),
      validate,
    ],
    createWarehouse
  );

router
  .route('/:id')
  .get(getWarehouseById)
  .put(updateWarehouse);

module.exports = router;
