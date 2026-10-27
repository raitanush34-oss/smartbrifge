import mongoose from 'mongoose';

const assetAssignmentSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    dueBackAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    returnedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    returnCondition: {
      type: String,
      enum: ['good', 'minor_damage', 'damaged', 'lost', null],
      default: null,
    },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

const assetSchema = new mongoose.Schema(
  {
    assetTag: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['laptop', 'phone', 'accessory', 'badge', 'furniture', 'other'],
      default: 'other',
      index: true,
    },
    manufacturer: { type: String, default: '', trim: true },
    model: { type: String, default: '', trim: true },
    serialNumber: { type: String, default: '', trim: true },
    purchaseDate: { type: Date, default: null },
    purchaseCost: { type: Number, default: null, min: 0 },
    location: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['available', 'assigned', 'maintenance', 'retired', 'lost'],
      default: 'available',
      index: true,
    },
    condition: { type: String, enum: ['new', 'good', 'fair', 'damaged'], default: 'good' },
    notes: { type: String, default: '', trim: true },
    assignmentHistory: { type: [assetAssignmentSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  },
  { timestamps: true }
);

export const Asset = mongoose.model('Asset', assetSchema);