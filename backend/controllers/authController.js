const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.SESSION_SECRET || 'pharmacare_secure_jwt_and_session_secret_key_2026_xyz',
    { expiresIn: '8h' }
  );
};

// @desc    Login user & get token
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password, roleCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Optional role verification if role was chosen on the Stitch login screen
    if (roleCode && user.roleCode !== roleCode.toUpperCase()) {
      // If user is Admin, they can log in as any role view
      if (user.roleCode !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: `User is assigned to '${user.roleCode}' role, not '${roleCode.toUpperCase()}'.`,
        });
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
    });

    // Record audit log
    await AuditLog.create({
      user: user._id,
      userName: user.name,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { role: user.roleCode },
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleCode: user.roleCode,
        licenseNumber: user.licenseNumber,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, roleCode, licenseNumber, phone } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const targetCode = (roleCode || 'PHARMACIST').toUpperCase();
    let role = await Role.findOne({ code: targetCode });
    if (!role) {
      role = await Role.create({
        name: targetCode === 'ADMIN' ? 'Administrator' : targetCode,
        code: targetCode,
        permissions: ['read', 'write'],
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role._id,
      roleCode: targetCode,
      licenseNumber: licenseNumber || '',
      phone: phone || '',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        roleCode: user.roleCode,
        licenseNumber: user.licenseNumber,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleCode: user.roleCode,
        licenseNumber: user.licenseNumber,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log out user & clear cookie
// @route   POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
};
