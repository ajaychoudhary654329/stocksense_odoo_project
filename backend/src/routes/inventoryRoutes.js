const express = require('express');
const { body } = require('express-validator');
const {
  getInventory,
  getInventoryByProductId,
  createAdjustment,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getInventory);

router.post(
  '/adjustments',
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    validate,
  ],
  createAdjustment
);

router.get('/:productId', getInventoryByProductId);

module.exports = router;
