const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const StockMove = require('../models/StockMove');
const Location = require('../models/Location');

/**
 * Checks available stock for lines of products.
 * Available stock = onHand - reserved
 */
const checkStockAvailability = async (lines, locationId = null) => {
  const warnings = [];
  let allAvailable = true;

  for (const line of lines) {
    const query = { productId: line.productId };
    if (locationId) {
      query.locationId = locationId;
    }

    const invRecords = await Inventory.find(query);
    const totalOnHand = invRecords.reduce((acc, curr) => acc + (curr.onHand || 0), 0);
    const totalReserved = invRecords.reduce((acc, curr) => acc + (curr.reserved || 0), 0);
    const available = totalOnHand - totalReserved;

    if (line.quantity > available) {
      allAvailable = false;
      warnings.push({
        productId: line.productId,
        requested: line.quantity,
        available: Math.max(0, available),
        shortage: line.quantity - Math.max(0, available),
      });
    }
  }

  return {
    isAvailable: allAvailable,
    warnings,
  };
};

/**
 * Process Receipt Completion (Status READY -> DONE)
 * Increases inventory onHand for each product in lines.
 * Creates StockMove IN records.
 */
const processReceiptDone = async (receipt, userId) => {
  let session = null;
  let isTransactionStarted = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    isTransactionStarted = true;
  } catch (err) {
    // Session/Transaction not supported (standalone Mongo), fallback to non-transactional
    session = null;
  }

  try {
    // Find default location for warehouse if available
    const location = await Location.findOne({ warehouseId: receipt.warehouseId }).session(session);
    const locationId = location ? location._id : null;
    const locationName = location ? location.name : 'Stock';

    for (const line of receipt.lines) {
      // Find or create inventory record
      let inv = await Inventory.findOne({
        productId: line.productId,
        ...(locationId ? { locationId } : {}),
      }).session(session);

      if (!inv) {
        inv = new Inventory({
          productId: line.productId,
          locationId: locationId || undefined,
          onHand: line.quantity,
          reserved: 0,
        });
      } else {
        inv.onHand += line.quantity;
      }
      await inv.save({ session });

      // Create StockMove
      const stockMove = new StockMove({
        reference: receipt.reference,
        operationId: receipt._id,
        productId: line.productId,
        quantity: line.quantity,
        type: 'IN',
        from: {
          type: 'VENDOR',
          name: receipt.contact || 'Vendor',
        },
        to: {
          type: 'LOCATION',
          name: locationName,
          locationId: locationId || undefined,
        },
        status: 'DONE',
        contact: receipt.contact,
        createdBy: userId,
      });

      await stockMove.save({ session });
    }

    if (isTransactionStarted && session) {
      await session.commitTransaction();
    }
  } catch (error) {
    if (isTransactionStarted && session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * Process Delivery Completion (Status READY -> DONE)
 * Decreases inventory onHand for each product in lines.
 * Creates StockMove OUT records.
 */
const processDeliveryDone = async (delivery, userId) => {
  let session = null;
  let isTransactionStarted = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    isTransactionStarted = true;
  } catch (err) {
    session = null;
  }

  try {
    const location = await Location.findOne({ warehouseId: delivery.warehouseId }).session(session);
    const locationId = location ? location._id : null;
    const locationName = location ? location.name : 'Stock';

    // Verify stock availability again
    const availability = await checkStockAvailability(delivery.lines, locationId);
    if (!availability.isAvailable) {
      throw new Error('Insufficient stock to complete delivery');
    }

    for (const line of delivery.lines) {
      let inv = await Inventory.findOne({
        productId: line.productId,
        ...(locationId ? { locationId } : {}),
      }).session(session);

      if (!inv) {
        throw new Error(`Inventory record not found for product ${line.productId}`);
      }

      inv.onHand -= line.quantity;
      if (inv.onHand < 0) {
        throw new Error('Insufficient stock for delivery execution');
      }
      await inv.save({ session });

      // Create StockMove
      const stockMove = new StockMove({
        reference: delivery.reference,
        operationId: delivery._id,
        productId: line.productId,
        quantity: line.quantity,
        type: 'OUT',
        from: {
          type: 'LOCATION',
          name: locationName,
          locationId: locationId || undefined,
        },
        to: {
          type: 'CUSTOMER',
          name: delivery.contact || 'Customer',
        },
        status: 'DONE',
        contact: delivery.contact,
        createdBy: userId,
      });

      await stockMove.save({ session });
    }

    if (isTransactionStarted && session) {
      await session.commitTransaction();
    }
  } catch (error) {
    if (isTransactionStarted && session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * Process Manual Inventory Adjustment
 */
const processAdjustment = async (productId, locationId, quantity, reason, userId) => {
  let inv = await Inventory.findOne({ productId, locationId: locationId || null });
  if (!inv) {
    inv = new Inventory({
      productId,
      locationId: locationId || undefined,
      onHand: Math.max(0, quantity),
      reserved: 0,
    });
  } else {
    inv.onHand = Math.max(0, inv.onHand + quantity);
  }
  await inv.save();

  let locName = 'Stock';
  if (locationId) {
    const loc = await Location.findById(locationId);
    if (loc) locName = loc.name;
  }

  const stockMove = new StockMove({
    reference: `ADJ-${Date.now().toString().slice(-6)}`,
    productId,
    quantity: Math.abs(quantity),
    type: 'ADJUSTMENT',
    from: {
      type: quantity < 0 ? 'LOCATION' : 'SYSTEM',
      name: quantity < 0 ? locName : 'System Adjustment',
      locationId: locationId || undefined,
    },
    to: {
      type: quantity >= 0 ? 'LOCATION' : 'SYSTEM',
      name: quantity >= 0 ? locName : 'System Adjustment',
      locationId: locationId || undefined,
    },
    status: 'DONE',
    contact: reason || 'Inventory Adjustment',
    createdBy: userId,
  });

  await stockMove.save();

  return inv;
};

module.exports = {
  checkStockAvailability,
  processReceiptDone,
  processDeliveryDone,
  processAdjustment,
};
