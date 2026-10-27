export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions',
      });
    }

    // Role check: support case-insensitivity
    const userRole = (req.user.role || '').toLowerCase();
    const authorized = allowedRoles.some((role) => role.toLowerCase() === userRole);

    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}]. Your current role is '${userRole}'.`,
      });
    }

    next();
  };
};
