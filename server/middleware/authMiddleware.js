import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';

export const verifyToken = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'staffsync_secret_jwt_key_2026'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account not found or deactivated',
        });
      }

      let employee = null;
      if (user.employeeId) {
        employee = await Employee.findById(user.employeeId);
      } else {
        // Fallback: match by email
        employee = await Employee.findOne({ email: user.email });
      }

      req.user = {
        _id: user._id,
        email: user.email,
        role: user.role,
        employeeId: employee ? employee._id : null,
        employeeCode: employee ? employee.employeeCode : null,
        name: employee ? `${employee.firstName} ${employee.lastName}` : user.email.split('@')[0],
        department: employee ? employee.department : 'General',
        avatar: employee ? employee.avatar : '',
      };

      return next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is invalid or expired',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided',
    });
  }
};
