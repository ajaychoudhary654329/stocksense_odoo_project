const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getProducts)
  .post(
    [
      body('code').trim().notEmpty().withMessage('Product code is required'),
      body('name').trim().notEmpty().withMessage('Product name is required'),
      body('unitCost').optional().isNumeric().withMessage('Unit cost must be a number'),
      validate,
    ],
    createProduct
  );

router
  .route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
