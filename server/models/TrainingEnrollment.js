import mongoose from 'mongoose';

const trainingEnrollmentSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingCourse', required: true, index: true },
    status: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed'],
      default: 'enrolled',
      index: true,
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    dueDate: { type: Date, default: null },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

trainingEnrollmentSchema.index({ employee: 1, course: 1 }, { unique: true });

export const TrainingEnrollment = mongoose.model('TrainingEnrollment', trainingEnrollmentSchema);