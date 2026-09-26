const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { processAdjustment } = require('../services/inventoryService');

// @desc    Get current inventory levels
// @route   GET /api/inventory
// @access  Private
const getInventory = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ name: 1 });

    const inventoryRecords = await Inventory.find().populate('locationId', 'name shortCode');

    const result = products.map((prod) => {
      const pIdStr = prod._id.toString();
      const matchedInv = inventoryRecords.filter(
        (inv) => inv.productId.toString() === pIdStr
      );

      const totalOnHand = matchedInv.reduce((sum, item) => sum + item.onHand, 0);
      const totalReserved = matchedInv.reduce((sum, item) => sum + item.reserved, 0);

      return {
        productId: prod._id,
        product: prod.name,
        code: prod.code,
        unitCost: prod.unitCost,
        onHand: totalOnHand,
        reserved: totalReserved,
        freeToUse: Math.max(0, totalOnHand - totalReserved),
        locations: matchedInv.map((inv) => ({
          location: inv.locationId ? inv.locationId.name : 'Main Stock',
          locationId: inv.locationId ? inv.locationId._id : null,
          onHand: inv.onHand,
          reserved: inv.reserved,
          freeToUse: Math.max(0, inv.onHand - inv.reserved),
        })),
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory by Product ID
// @route   GET /api/inventory/:productId
// @access  Private
const getInventoryByProductId = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    const inventoryRecords = await Inventory.find({ productId: req.params.productId }).populate(
      'locationId',
      'name shortCode'
    );

    const totalOnHand = inventoryRecords.reduce((sum, item) => sum + item.onHand, 0);
    const totalReserved = inventoryRecords.reduce((sum, item) => sum + item.reserved, 0);

    return res.status(200).json({
      success: true,
      data: {
        productId: product._id,
        product: product.name,
        code: product.code,
        unitCost: product.unitCost,
        onHand: totalOnHand,
        reserved: totalReserved,
        freeToUse: Math.max(0, totalOnHand - totalReserved),
        records: inventoryRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create manual inventory adjustment
// @route   POST /api/inventory/adjustments
// @access  Private
const createAdjustment = async (req, res, next) => {
  try {
    const { productId, locationId, quantity, reason } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'productId and quantity are required' },
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    const inventory = await processAdjustment(
      productId,
      locationId,
      Number(quantity),
      reason,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      data: {
        message: 'Stock adjustment completed successfully',
        inventory,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getInventoryByProductId,
  createAdjustment,
};
