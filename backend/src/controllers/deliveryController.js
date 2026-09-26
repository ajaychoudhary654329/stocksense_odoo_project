const Delivery = require('../models/Delivery');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const { checkStockAvailability, processDeliveryDone } = require('../services/inventoryService');
const nextReferenceSequence = require('../services/referenceSequence');

const generateDeliveryReference = async (warehouseId) => {
  let prefix = 'WH/OUT/';
  if (warehouseId) {
    const warehouse = await Warehouse.findById(warehouseId);
    if (warehouse && warehouse.shortCode) {
      prefix = `${warehouse.shortCode}/OUT/`;
    }
  }

  const sequence = (await nextReferenceSequence('deliveries', Delivery)).toString().padStart(4, '0');
  return `${prefix}${sequence}`;
};

// @desc    Get all deliveries
// @route   GET /api/deliveries
// @access  Private
const getDeliveries = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.status = status.toUpperCase();
    }

    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [deliveries, total] = await Promise.all([
      Delivery.find(query)
        .populate('warehouseId', 'name shortCode')
        .populate('lines.productId', 'code name unitCost')
        .populate('responsibleUserId', 'loginId email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Delivery.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: deliveries,
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

// @desc    Get delivery by ID
// @route   GET /api/deliveries/:id
// @access  Private
const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('warehouseId', 'name shortCode address')
      .populate('lines.productId', 'code name unitCost')
      .populate('responsibleUserId', 'loginId email');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Delivery not found' },
      });
    }

    return res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create delivery
// @route   POST /api/deliveries
// @access  Private
const createDelivery = async (req, res, next) => {
  try {
    const { warehouseId, contact, scheduledDate, responsibleUserId, lines } = req.body;

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Warehouse not found' },
      });
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Delivery lines are required' },
      });
    }

    for (const line of lines) {
      const product = await Product.findById(line.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Product ${line.productId} not found` },
        });
      }
    }

    const reference = await generateDeliveryReference(warehouseId);

    const delivery = await Delivery.create({
      reference,
      warehouseId,
      contact,
      scheduledDate,
      responsibleUserId: responsibleUserId || req.user._id,
      status: 'DRAFT',
      lines,
    });

    return res.status(201).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery details
// @route   PUT /api/deliveries/:id
// @access  Private
const updateDelivery = async (req, res, next) => {
  try {
    let delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Delivery not found' },
      });
    }

    if (delivery.status !== 'DRAFT' && delivery.status !== 'WAITING') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Only DRAFT or WAITING deliveries can be modified',
        },
      });
    }

    const { warehouseId, contact, scheduledDate, responsibleUserId, lines } = req.body;

    if (warehouseId) delivery.warehouseId = warehouseId;
    if (contact) delivery.contact = contact;
    if (scheduledDate) delivery.scheduledDate = scheduledDate;
    if (responsibleUserId) delivery.responsibleUserId = responsibleUserId;
    if (lines && Array.isArray(lines)) delivery.lines = lines;

    await delivery.save();

    return res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery status (State machine: DRAFT -> READY/WAITING -> DONE)
// @route   PATCH /api/deliveries/:id/status
// @access  Private
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const requestedStatus = status ? status.toUpperCase() : null;

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Delivery not found' },
      });
    }

    const currentStatus = delivery.status;

    if (currentStatus === 'DONE' || currentStatus === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot change status of a ${currentStatus} delivery`,
        },
      });
    }

    // Checking availability for marking READY or checking stock
    if (requestedStatus === 'READY' || requestedStatus === 'CHECK_AVAILABILITY') {
      const availability = await checkStockAvailability(delivery.lines);

      if (!availability.isAvailable) {
        delivery.status = 'WAITING';
        await delivery.save();

        return res.status(200).json({
          success: true,
          data: {
            id: delivery._id,
            reference: delivery.reference,
            status: 'WAITING',
            warnings: availability.warnings,
          },
        });
      }

      delivery.status = 'READY';
      await delivery.save();

      return res.status(200).json({
        success: true,
        data: delivery,
      });
    }

    if (requestedStatus === 'DONE') {
      if (currentStatus !== 'READY') {
        // Attempt stock check if it's currently DRAFT/WAITING
        const availability = await checkStockAvailability(delivery.lines);
        if (!availability.isAvailable) {
          delivery.status = 'WAITING';
          await delivery.save();

          return res.status(400).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: 'Delivery cannot be marked DONE due to insufficient stock',
              warnings: availability.warnings,
            },
          });
        }
      }

      // Process stock deduction & stock move
      await processDeliveryDone(delivery, req.user._id);

      delivery.status = 'DONE';
      await delivery.save();

      return res.status(200).json({
        success: true,
        data: delivery,
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATUS',
        message: 'Invalid status requested. Allowed: READY, DONE',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel delivery
// @route   POST /api/deliveries/:id/cancel
// @access  Private
const cancelDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Delivery not found' },
      });
    }

    if (delivery.status === 'DONE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: 'Completed deliveries cannot be cancelled',
        },
      });
    }

    delivery.status = 'CANCELLED';
    await delivery.save();

    return res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Print delivery slip
// @route   GET /api/deliveries/:id/print
// @access  Private
const printDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('warehouseId', 'name shortCode address')
      .populate('lines.productId', 'code name unitCost')
      .populate('responsibleUserId', 'loginId email');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Delivery not found' },
      });
    }

    if (delivery.status !== 'DONE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_READY_FOR_PRINT',
          message: 'Only completed deliveries can be printed',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        documentType: 'DELIVERY_SLIP',
        reference: delivery.reference,
        warehouse: delivery.warehouseId,
        contact: delivery.contact,
        scheduledDate: delivery.scheduledDate,
        lines: delivery.lines,
        printedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  updateStatus,
  cancelDelivery,
  printDelivery,
};
