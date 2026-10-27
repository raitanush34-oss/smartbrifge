import mongoose from 'mongoose';

const jobOpeningSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: 'Remote / Hybrid',
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      default: 'Full-time',
    },
    vacancies: {
      type: Number,
      default: 1,
    },
    experience: {
      type: String,
      default: '2-4 years',
    },
    salaryRange: {
      type: String,
      default: '$80,000 - $110,000',
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'closed'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

export const JobOpening = mongoose.model('JobOpening', jobOpeningSchema);
