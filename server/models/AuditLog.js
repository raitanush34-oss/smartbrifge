import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorName: {
      type: String,
      required: true,
      default: 'System',
    },
    actorEmail: {
      type: String,
      default: '',
    },
    actorRole: {
      type: String,
      default: 'admin',
    },
    action: {
      type: String,
      required: true, // e.g. "CREATE_EMPLOYEE", "APPROVE_LEAVE", "GENERATE_PAYROLL"
    },
    entityType: {
      type: String,
      required: true, // e.g. "Employee", "Leave", "Payroll", "Attendance", "Auth"
    },
    entityId: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  {
    timestamps: true,
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
