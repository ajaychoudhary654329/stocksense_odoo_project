const mongoose = require('mongoose');

const stockMoveSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    operationId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUSTMENT'],
      required: true,
    },
    from: {
      type: { type: String, default: 'VENDOR' },
      name: { type: String, default: 'Vendor' },
      locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    },
    to: {
      type: { type: String, default: 'LOCATION' },
      name: { type: String, default: 'Stock' },
      locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    },
    status: {
      type: String,
      default: 'DONE',
    },
    contact: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('StockMove', stockMoveSchema);
