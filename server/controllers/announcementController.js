import { Announcement } from '../models/Announcement.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import nodemailer from 'nodemailer';

// Setup optional nodemailer test transporter
const sendNotificationEmail = async (announcement) => {
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"StaffSync People Ops" <${process.env.SMTP_USER}>`,
        to: 'company-all@staffsync.internal',
        subject: `[Announcement - ${announcement.priority.toUpperCase()}] ${announcement.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #2563eb;">${announcement.title}</h2>
            <p><strong>Priority:</strong> <span style="color: red;">${announcement.priority.toUpperCase()}</span></p>
            <p><strong>Department:</strong> ${announcement.targetDepartment}</p>
            <hr />
            <p>${announcement.content}</p>
            <br />
            <small>Sent from StaffSync HRMS Platform</small>
          </div>
        `,
      });
      console.log(`[Email] Announcement broadcasted to staff: ${announcement.title}`);
    } else {
      console.log(`[Notice Board] Announcement published: "${announcement.title}" (Priority: ${announcement.priority})`);
    }
  } catch (error) {
    console.error('Email dispatch error (non-fatal):', error.message);
  }
};

// @desc    Get all announcements
// @route   GET /api/announcements
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('author', 'firstName lastName avatar department')
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create announcement (Admin/Manager)
// @route   POST /api/announcements
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority = 'medium', targetDepartment = 'All', isPinned = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      priority,
      targetDepartment,
      isPinned,
      author: req.user.employeeId || null,
      authorName: req.user.name || 'HR Operations',
    });

    // Trigger async email notification
    sendNotificationEmail(announcement);

    await logAuditEvent({
      req,
      action: 'ANNOUNCEMENT_CREATED',
      entityType: 'Announcement',
      entityId: announcement._id,
      details: `Published announcement "${title}" (Priority: ${priority})`,
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await announcement.deleteOne();

    await logAuditEvent({
      req,
      action: 'ANNOUNCEMENT_DELETED',
      entityType: 'Announcement',
      entityId: req.params.id,
      details: `Deleted announcement "${announcement.title}"`,
    });

    res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
