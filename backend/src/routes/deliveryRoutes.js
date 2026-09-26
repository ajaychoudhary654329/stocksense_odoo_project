const express = require('express');
const { body } = require('express-validator');
const {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  updateStatus,
  cancelDelivery,
  printDelivery,
} = require('../controllers/deliveryController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getDeliveries)
  .post(
    [
      body('warehouseId').notEmpty().withMessage('Warehouse ID is required'),
      body('contact').trim().notEmpty().withMessage('Contact is required'),
      body('scheduledDate').notEmpty().withMessage('Scheduled date is required'),
      body('lines').isArray({ min: 1 }).withMessage('At least one delivery line is required'),
      validate,
    ],
    createDelivery
  );

router.patch('/:id/status', updateStatus);
router.post('/:id/cancel', cancelDelivery);
router.get('/:id/print', printDelivery);

router
  .route('/:id')
  .get(getDeliveryById)
  .put(updateDelivery);

module.exports = router;
