const Receipt = require('../models/Receipt');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const { processReceiptDone } = require('../services/inventoryService');
const nextReferenceSequence = require('../services/referenceSequence');

// Helper to generate next reference string
const generateReceiptReference = async (warehouseId) => {
  let prefix = 'WH/IN/';
  if (warehouseId) {
    const warehouse = await Warehouse.findById(warehouseId);
    if (warehouse && warehouse.shortCode) {
      prefix = `${warehouse.shortCode}/IN/`;
    }
  }

  const sequence = (await nextReferenceSequence('receipts', Receipt)).toString().padStart(4, '0');
  return `${prefix}${sequence}`;
};

// @desc    Get all receipts
// @route   GET /api/receipts
// @access  Private
const getReceipts = async (req, res, next) => {
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

    const [receipts, total] = await Promise.all([
      Receipt.find(query)
        .populate('warehouseId', 'name shortCode')
        .populate('lines.productId', 'code name unitCost')
        .populate('responsibleUserId', 'loginId email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Receipt.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: receipts,
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

// @desc    Get single receipt by ID
// @route   GET /api/receipts/:id
// @access  Private
const getReceiptById = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('warehouseId', 'name shortCode address')
      .populate('lines.productId', 'code name unitCost')
      .populate('responsibleUserId', 'loginId email');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Receipt not found' },
      });
    }

    return res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new receipt
// @route   POST /api/receipts
// @access  Private
const createReceipt = async (req, res, next) => {
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
        error: { code: 'VALIDATION_ERROR', message: 'Receipt lines are required' },
      });
    }

    // Verify all products exist
    for (const line of lines) {
      const product = await Product.findById(line.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Product ${line.productId} not found` },
        });
      }
    }

    const reference = await generateReceiptReference(warehouseId);

    const receipt = await Receipt.create({
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
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update receipt details
// @route   PUT /api/receipts/:id
// @access  Private
const updateReceipt = async (req, res, next) => {
  try {
    let receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Receipt not found' },
      });
    }

    if (receipt.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Only DRAFT receipts can be modified',
        },
      });
    }

    const { warehouseId, contact, scheduledDate, responsibleUserId, lines } = req.body;

    if (warehouseId) receipt.warehouseId = warehouseId;
    if (contact) receipt.contact = contact;
    if (scheduledDate) receipt.scheduledDate = scheduledDate;
    if (responsibleUserId) receipt.responsibleUserId = responsibleUserId;
    if (lines && Array.isArray(lines)) receipt.lines = lines;

    await receipt.save();

    return res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update receipt status (State Machine: DRAFT -> READY -> DONE)
// @route   PATCH /api/receipts/:id/status
// @access  Private
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const requestedStatus = status ? status.toUpperCase() : null;

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Receipt not found' },
      });
    }

    const currentStatus = receipt.status;

    if (currentStatus === 'DONE' || currentStatus === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot change status of a ${currentStatus} receipt`,
        },
      });
    }

    // State transition rules:
    // DRAFT -> READY
    // READY -> DONE
    if (requestedStatus === 'READY') {
      if (currentStatus !== 'DRAFT') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: 'Receipt must be in DRAFT state to mark as READY',
          },
        });
      }
      receipt.status = 'READY';
      await receipt.save();
    } else if (requestedStatus === 'DONE') {
      if (currentStatus !== 'READY') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: 'Receipt must be READY before it can be completed',
          },
        });
      }

      // Execute receipt transaction logic
      await processReceiptDone(receipt, req.user._id);

      receipt.status = 'DONE';
      await receipt.save();
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid status requested. Allowed: READY, DONE',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel receipt
// @route   POST /api/receipts/:id/cancel
// @access  Private
const cancelReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Receipt not found' },
      });
    }

    if (receipt.status === 'DONE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: 'Completed receipts cannot be cancelled',
        },
      });
    }

    receipt.status = 'CANCELLED';
    await receipt.save();

    return res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Print receipt
// @route   GET /api/receipts/:id/print
// @access  Private
const printReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('warehouseId', 'name shortCode address')
      .populate('lines.productId', 'code name unitCost')
      .populate('responsibleUserId', 'loginId email');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Receipt not found' },
      });
    }

    if (receipt.status !== 'DONE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_READY_FOR_PRINT',
          message: 'Only completed receipts can be printed',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        documentType: 'RECEIPT',
        reference: receipt.reference,
        warehouse: receipt.warehouseId,
        contact: receipt.contact,
        scheduledDate: receipt.scheduledDate,
        lines: receipt.lines,
        printedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  updateStatus,
  cancelReceipt,
  printReceipt,
};
