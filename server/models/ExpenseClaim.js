import mongoose from 'mongoose';

const expenseClaimSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['travel', 'meals', 'accommodation', 'equipment', 'communication', 'other'],
      required: true,
    },
    merchant: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'INR', enum: ['INR'] },
    expenseDate: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    receiptUrl: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'reimbursed'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    reviewerName: { type: String, default: '' },
    reviewNote: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    reimbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    reimbursedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ExpenseClaim = mongoose.model('ExpenseClaim', expenseClaimSchema);