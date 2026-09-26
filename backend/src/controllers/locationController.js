const Location = require('../models/Location');
const Warehouse = require('../models/Warehouse');

// @desc    Get all locations
// @route   GET /api/locations
// @access  Private
const getLocations = async (req, res, next) => {
  try {
    const locations = await Location.find()
      .populate('warehouseId', 'name shortCode')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get location by ID
// @route   GET /api/locations/:id
// @access  Private
const getLocationById = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id).populate('warehouseId', 'name shortCode');
    if (!location) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });
    }
    return res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create location
// @route   POST /api/locations
// @access  Private
const createLocation = async (req, res, next) => {
  try {
    const { name, shortCode, warehouseId } = req.body;

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Warehouse not found' },
      });
    }

    const existing = await Location.findOne({ shortCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'LOCATION_EXISTS', message: 'Location with this short code already exists' },
      });
    }

    const location = await Location.create({ name, shortCode, warehouseId });
    return res.status(201).json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Private
const updateLocation = async (req, res, next) => {
  try {
    const { name, shortCode, warehouseId } = req.body;

    let location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });
    }

    if (warehouseId) {
      const warehouse = await Warehouse.findById(warehouseId);
      if (!warehouse) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Warehouse not found' },
        });
      }
    }

    if (shortCode && shortCode !== location.shortCode) {
      const existing = await Location.findOne({ shortCode });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { code: 'LOCATION_EXISTS', message: 'Short code already in use' },
        });
      }
    }

    location.name = name !== undefined ? name : location.name;
    location.shortCode = shortCode !== undefined ? shortCode : location.shortCode;
    location.warehouseId = warehouseId !== undefined ? warehouseId : location.warehouseId;

    await location.save();

    return res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
};
