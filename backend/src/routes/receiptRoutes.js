const express = require('express');
const { body } = require('express-validator');
const {
  getReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  updateStatus,
  cancelReceipt,
  printReceipt,
} = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getReceipts)
  .post(
    [
      body('warehouseId').notEmpty().withMessage('Warehouse ID is required'),
      body('contact').trim().notEmpty().withMessage('Contact is required'),
      body('scheduledDate').notEmpty().withMessage('Scheduled date is required'),
      body('lines').isArray({ min: 1 }).withMessage('At least one receipt line is required'),
      validate,
    ],
    createReceipt
  );

router.patch('/:id/status', updateStatus);
router.post('/:id/cancel', cancelReceipt);
router.get('/:id/print', printReceipt);

router
  .route('/:id')
  .get(getReceiptById)
  .put(updateReceipt);

module.exports = router;
