const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');

// @desc    Get dashboard metrics
// @route   GET /api/dashboard
// @access  Private
const getDashboardMetrics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [receiptsToReceive, receiptsLate, deliveriesToDeliver, deliveriesLate, deliveriesWaiting] =
      await Promise.all([
        Receipt.countDocuments({ status: { $nin: ['DONE', 'CANCELLED'] } }),
        Receipt.countDocuments({
          status: { $nin: ['DONE', 'CANCELLED'] },
          scheduledDate: { $lt: today },
        }),
        Delivery.countDocuments({ status: { $nin: ['DONE', 'CANCELLED'] } }),
        Delivery.countDocuments({
          status: { $nin: ['DONE', 'CANCELLED'] },
          scheduledDate: { $lt: today },
        }),
        Delivery.countDocuments({ status: 'WAITING' }),
      ]);

    const totalOperations = receiptsToReceive + deliveriesToDeliver;

    return res.status(200).json({
      success: true,
      data: {
        receipts: {
          toReceive: receiptsToReceive,
          late: receiptsLate,
        },
        deliveries: {
          toDeliver: deliveriesToDeliver,
          late: deliveriesLate,
          waiting: deliveriesWaiting,
        },
        operations: totalOperations,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
};
