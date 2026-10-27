import { Asset } from '../models/Asset.js';
import { Employee } from '../models/Employee.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const assetPopulate = (query) => query
  .populate('assignmentHistory.employee', 'firstName lastName employeeCode department designation')
  .populate('assignmentHistory.assignedBy', 'firstName lastName')
  .populate('assignmentHistory.returnedTo', 'firstName lastName');

// @route GET /api/assets/my
export const getMyAssets = async (req, res) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile linked to this user' });
    }
    const assets = await assetPopulate(Asset.find({
      assignmentHistory: { $elemMatch: { employee: req.user.employeeId, returnedAt: null } },
    })).sort({ name: 1 });
    res.status(200).json({ success: true, count: assets.length, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/assets
export const getAssets = async (req, res) => {
  try {
    const { status = 'All', category = 'All', search = '' } = req.query;
    const query = {};
    if (status !== 'All') query.status = status;
    if (category !== 'All') query.category = category;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { assetTag: new RegExp(escaped, 'i') },
        { name: new RegExp(escaped, 'i') },
        { serialNumber: new RegExp(escaped, 'i') },
        { manufacturer: new RegExp(escaped, 'i') },
      ];
    }
    const assets = await assetPopulate(Asset.find(query)).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: assets.length, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/assets
export const createAsset = async (req, res) => {
  try {
    const {
      assetTag, name, category = 'other', manufacturer = '', model = '', serialNumber = '',
      purchaseDate = null, purchaseCost = null, location = '', condition = 'good', notes = '',
    } = req.body;
    if (!assetTag?.trim() || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'Asset tag and name are required' });
    }
    const asset = await Asset.create({
      assetTag: assetTag.trim().toUpperCase(),
      name: name.trim(),
      category,
      manufacturer,
      model,
      serialNumber,
      purchaseDate: purchaseDate || null,
      purchaseCost: purchaseCost === '' || purchaseCost == null ? null : Number(purchaseCost),
      location,
      condition,
      notes,
      createdBy: req.user.employeeId || null,
    });
    await logAuditEvent({
      req,
      action: 'ASSET_CREATED',
      entityType: 'Asset',
      entityId: asset._id,
      details: `Added ${asset.assetTag} (${asset.name}) to asset inventory`,
    });
    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    const statusCode = error.code === 11000 ? 409 : 400;
    const message = error.code === 11000 ? 'An asset with this tag already exists' : error.message;
    res.status(statusCode).json({ success: false, message });
  }
};

// @route POST /api/assets/:id/assign
export const assignAsset = async (req, res) => {
  try {
    const { employeeId, dueBackAt = null, notes = '' } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: 'Employee is required' });
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    if (asset.status !== 'available') {
      return res.status(400).json({ success: false, message: `Only available assets can be assigned (current status: ${asset.status})` });
    }
    const employee = await Employee.findOne({ _id: employeeId, status: { $ne: 'deactivated' } });
    if (!employee) return res.status(404).json({ success: false, message: 'Active employee not found' });

    asset.assignmentHistory.push({
      employee: employee._id,
      assignedBy: req.user.employeeId || null,
      dueBackAt: dueBackAt || null,
      notes: notes.trim(),
    });
    asset.status = 'assigned';
    await asset.save();
    await logAuditEvent({
      req,
      action: 'ASSET_ASSIGNED',
      entityType: 'Asset',
      entityId: asset._id,
      details: `Assigned ${asset.assetTag} to ${employee.firstName} ${employee.lastName}`,
    });
    const populated = await assetPopulate(Asset.findById(asset._id));
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/assets/:id/return
export const returnAsset = async (req, res) => {
  try {
    const { returnCondition, notes = '' } = req.body;
    if (!['good', 'minor_damage', 'damaged', 'lost'].includes(returnCondition)) {
      return res.status(400).json({ success: false, message: 'Select a valid return condition' });
    }
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    const currentAssignment = [...asset.assignmentHistory].reverse().find((assignment) => !assignment.returnedAt);
    if (!currentAssignment) return res.status(400).json({ success: false, message: 'Asset has no active assignment' });

    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role?.toLowerCase());
    const isAssignedEmployee = req.user.employeeId && currentAssignment.employee.toString() === req.user.employeeId.toString();
    if (!isAdminOrManager && !isAssignedEmployee) {
      return res.status(403).json({ success: false, message: 'You are not authorized to return this asset' });
    }

    currentAssignment.returnedAt = new Date();
    currentAssignment.returnedTo = req.user.employeeId || null;
    currentAssignment.returnCondition = returnCondition;
    currentAssignment.notes = [currentAssignment.notes, notes.trim()].filter(Boolean).join(' | ');
    asset.condition = returnCondition === 'good' ? 'good' : returnCondition === 'minor_damage' ? 'fair' : 'damaged';
    asset.status = returnCondition === 'lost' ? 'lost' : returnCondition === 'damaged' ? 'maintenance' : 'available';
    await asset.save();
    await logAuditEvent({
      req,
      action: 'ASSET_RETURNED',
      entityType: 'Asset',
      entityId: asset._id,
      details: `Returned ${asset.assetTag} with condition ${returnCondition}; status is ${asset.status}`,
    });
    const populated = await assetPopulate(Asset.findById(asset._id));
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/assets/:id/status
export const updateAssetStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'maintenance', 'retired', 'lost'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid inventory status' });
    }
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    if (asset.status === 'assigned') {
      return res.status(400).json({ success: false, message: 'Return the assigned asset before changing its inventory status' });
    }
    asset.status = status;
    await asset.save();
    await logAuditEvent({
      req,
      action: 'ASSET_STATUS_UPDATED',
      entityType: 'Asset',
      entityId: asset._id,
      details: `Changed ${asset.assetTag} status to ${status}`,
    });
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};