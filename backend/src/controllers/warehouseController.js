const Warehouse = require('../models/Warehouse');

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get warehouse by ID
// @route   GET /api/warehouses/:id
// @access  Private
const getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Warehouse not found' },
      });
    }
    return res.status(200).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create warehouse
// @route   POST /api/warehouses
// @access  Private
const createWarehouse = async (req, res, next) => {
  try {
    const { name, shortCode, address } = req.body;

    const existing = await Warehouse.findOne({ shortCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'WAREHOUSE_EXISTS', message: 'Warehouse with this short code already exists' },
      });
    }

    const warehouse = await Warehouse.create({ name, shortCode, address });
    return res.status(201).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private
const updateWarehouse = async (req, res, next) => {
  try {
    const { name, shortCode, address } = req.body;

    let warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Warehouse not found' },
      });
    }

    if (shortCode && shortCode !== warehouse.shortCode) {
      const existing = await Warehouse.findOne({ shortCode });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { code: 'WAREHOUSE_EXISTS', message: 'Short code already in use' },
        });
      }
    }

    warehouse.name = name !== undefined ? name : warehouse.name;
    warehouse.shortCode = shortCode !== undefined ? shortCode : warehouse.shortCode;
    warehouse.address = address !== undefined ? address : warehouse.address;

    await warehouse.save();

    return res.status(200).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
};
