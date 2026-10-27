import { AuditLog } from '../models/AuditLog.js';

export const logAuditEvent = async ({
  req,
  action,
  entityType,
  entityId = '',
  details = '',
  actorName = null,
  actorRole = null,
  actorEmail = null,
}) => {
  try {
    const finalActorName = actorName || (req?.user?.name) || 'System';
    const finalActorRole = actorRole || (req?.user?.role) || 'system';
    const finalActorEmail = actorEmail || (req?.user?.email) || '';
    const ipAddress = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';

    await AuditLog.create({
      actorName: finalActorName,
      actorEmail: finalActorEmail,
      actorRole: finalActorRole,
      action,
      entityType,
      entityId: String(entityId),
      details,
      ipAddress,
    });
  } catch (error) {
    // Non-blocking: log to console if audit log write fails
    console.error('Audit Logging failed:', error.message);
  }
};
