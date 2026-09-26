const StockMove = require('../models/StockMove');

// @desc    Get move history
// @route   GET /api/moves
// @access  Private
const getMoves = async (req, res, next) => {
  try {
    const { search, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (type) {
      query.type = type.toUpperCase();
    }

    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [moves, total] = await Promise.all([
      StockMove.find(query)
        .populate('productId', 'code name unitCost')
        .populate('createdBy', 'loginId email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StockMove.countDocuments(query),
    ]);

    const formattedMoves = moves.map((move) => {
      const fromText = move.from ? move.from.name || move.from.type : 'Vendor';
      const toText = move.to ? move.to.name || move.to.type : 'Stock';

      return {
        id: move._id,
        reference: move.reference,
        contact: move.contact || '',
        status: move.status,
        date: move.createdAt.toISOString().split('T')[0],
        createdAt: move.createdAt,
        from: fromText,
        to: toText,
        productId: move.productId ? move.productId._id : null,
        product: move.productId ? move.productId.name : 'Unknown Product',
        productCode: move.productId ? move.productId.code : '',
        quantity: move.quantity,
        type: move.type,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedMoves,
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

// @desc    Get move by ID
// @route   GET /api/moves/:id
// @access  Private
const getMoveById = async (req, res, next) => {
  try {
    const move = await StockMove.findById(req.params.id)
      .populate('productId', 'code name unitCost')
      .populate('createdBy', 'loginId email');

    if (!move) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Stock move not found' },
      });
    }

    return res.status(200).json({
      success: true,
      data: move,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMoves,
  getMoveById,
};
