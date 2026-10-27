import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    selfRating: { type: Number, min: 1, max: 5, default: null },
    managerRating: { type: Number, min: 1, max: 5, default: null },
    selfComment: { type: String, default: '', trim: true },
    managerComment: { type: String, default: '', trim: true },
  },
  { _id: true }
);

const reviewSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    cycleName: { type: String, required: true, trim: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    dueDate: { type: Date, default: null },
    goals: { type: [goalSchema], default: [] },
    employeeSummary: { type: String, default: '', trim: true },
    managerSummary: { type: String, default: '', trim: true },
    strengths: { type: String, default: '', trim: true },
    improvementAreas: { type: String, default: '', trim: true },
    overallRating: { type: Number, min: 1, max: 5, default: null },
    status: {
      type: String,
      enum: ['self_review', 'manager_review', 'completed'],
      default: 'self_review',
      index: true,
    },
    submittedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reviewSchema.index({ employee: 1, cycleName: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);