import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const generateTokens = (id) => {
  const accessToken = jwt.sign(
    { id },
    process.env.JWT_SECRET || 'staffsync_secret_jwt_key_2026',
    { expiresIn: '1d' }
  );
  const refreshToken = jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || 'staffsync_refresh_secret_key_2026',
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// @desc    Register a new user (Admin use or initial setup)
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { email, password, role = 'employee', firstName, lastName, department, designation } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Auto-generate employee code if employee details provided
    let employee = null;
    if (firstName && lastName) {
      const count = await Employee.countDocuments();
      const employeeCode = `EMP-${1000 + count + 1}`;
      employee = await Employee.create({
        employeeCode,
        firstName,
        lastName,
        email,
        department: department || 'Engineering',
        designation: designation || 'Associate',
        role,
      });
    }

    const user = await User.create({
      email,
      password,
      role,
      employeeId: employee ? employee._id : null,
    });

    if (employee) {
      employee.userId = user._id;
      await employee.save();
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await logAuditEvent({
      req,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      details: `User registered with role ${role} (${email})`,
      actorName: firstName ? `${firstName} ${lastName}` : email,
      actorRole: role,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employeeId: employee ? employee._id : null,
          name: employee ? `${employee.firstName} ${employee.lastName}` : email.split('@')[0],
          department: employee ? employee.department : 'General',
          avatar: employee ? employee.avatar : '',
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User does not exist.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact HR or Administrator.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    let employee = null;
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId);
    } else {
      employee = await Employee.findOne({ email: user.email });
    }

    await logAuditEvent({
      req,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      details: `Successful login as ${user.role} (${user.email})`,
      actorName: employee ? `${employee.firstName} ${employee.lastName}` : user.email,
      actorRole: user.role,
      actorEmail: user.email,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employeeId: employee ? employee._id : null,
          employeeCode: employee ? employee.employeeCode : null,
          name: employee ? `${employee.firstName} ${employee.lastName}` : user.email.split('@')[0],
          department: employee ? employee.department : 'General',
          designation: employee ? employee.designation : 'Staff',
          avatar: employee ? employee.avatar : '',
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'staffsync_refresh_secret_key_2026'
    );
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token expired or invalid' });
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let employee = null;
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId).populate('manager', 'firstName lastName email designation');
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        employee,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: '' });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
