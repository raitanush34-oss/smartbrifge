import mongoose from 'mongoose';

const trainingCourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    skills: { type: [String], default: [] },
    provider: { type: String, default: 'Internal Learning', trim: true },
    durationHours: { type: Number, required: true, min: 0.25 },
    format: {
      type: String,
      enum: ['self_paced', 'instructor_led', 'workshop'],
      default: 'self_paced',
    },
    courseUrl: { type: String, default: '', trim: true },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  },
  { timestamps: true }
);

export const TrainingCourse = mongoose.model('TrainingCourse', trainingCourseSchema);