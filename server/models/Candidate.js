import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    jobOpening: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      default: null,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    stage: {
      type: String,
      enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
      default: 'applied',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4,
    },
    experienceYears: {
      type: Number,
      default: 3,
    },
    currentCtc: {
      type: String,
      default: '12 LPA',
    },
    expectedCtc: {
      type: String,
      default: '18 LPA',
    },
    noticePeriod: {
      type: String,
      default: '30 Days',
    },
    location: {
      type: String,
      default: 'Bengaluru',
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Candidate = mongoose.model('Candidate', candidateSchema);
