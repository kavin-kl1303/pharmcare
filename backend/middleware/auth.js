const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.SESSION_SECRET || 'pharmacare_secure_jwt_and_session_secret_key_2026_xyz'
    );

    const user = await User.findById(decoded.id).populate('role');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or account has been deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token verification failed or token expired.',
    });
  }
};

/**
 * Grant access to specific role codes
 * Supported: 'ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER', 'BILLING'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRoleCode = req.user.roleCode || (req.user.role && req.user.role.code);
    if (!roles.includes(userRoleCode)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${userRoleCode}' is not authorized to access this route. Requires one of: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
