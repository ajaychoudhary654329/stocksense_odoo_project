const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }
    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const { code, name, unitCost } = req.body;

    const existing = await Product.findOne({ code });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'PRODUCT_EXISTS', message: 'Product with this code already exists' },
      });
    }

    const product = await Product.create({ code, name, unitCost });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
  try {
    const { code, name, unitCost } = req.body;

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    if (code && code !== product.code) {
      const existing = await Product.findOne({ code });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { code: 'PRODUCT_EXISTS', message: 'Product code already in use' },
        });
      }
    }

    product.code = code !== undefined ? code : product.code;
    product.name = name !== undefined ? name : product.name;
    product.unitCost = unitCost !== undefined ? unitCost : product.unitCost;

    await product.save();

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }
    return res.status(200).json({
      success: true,
      data: { message: 'Product removed successfully' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
