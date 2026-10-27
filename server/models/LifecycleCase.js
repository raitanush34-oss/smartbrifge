import mongoose from 'mongoose';

const lifecycleTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: {
      type: String,
      enum: ['people', 'it', 'payroll', 'manager', 'employee', 'facilities', 'compliance', 'other'],
      default: 'other',
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending',
    },
    note: { type: String, default: '', trim: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const lifecycleCaseSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    type: { type: String, enum: ['onboarding', 'offboarding'], required: true, index: true },
    title: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    targetDate: { type: Date, default: null },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active', index: true },
    tasks: { type: [lifecycleTaskSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

lifecycleCaseSchema.index({ employee: 1, type: 1, status: 1 });

export const LifecycleCase = mongoose.model('LifecycleCase', lifecycleCaseSchema);