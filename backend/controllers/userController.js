const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');

// @desc    Get all users with roles
// @route   GET /api/users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().populate('role').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system roles
// @route   GET /api/users/roles
exports.getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find();
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user (admin managed)
// @route   POST /api/users
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, roleCode, licenseNumber, phone } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const code = (roleCode || 'PHARMACIST').toUpperCase();
    let role = await Role.findOne({ code });
    if (!role) {
      role = await Role.create({
        name: code === 'ADMIN' ? 'Administrator' : code,
        code,
        permissions: ['read', 'write'],
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: password || 'PharmaCare#2026',
      role: role._id,
      roleCode: code,
      licenseNumber: licenseNumber || '',
      phone: phone || '',
    });

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'USER_CREATE',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { email: user.email, role: code },
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: 'Staff user created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { name, roleCode, licenseNumber, phone, isActive, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (licenseNumber !== undefined) user.licenseNumber = licenseNumber;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    if (roleCode && roleCode !== user.roleCode) {
      const role = await Role.findOne({ code: roleCode.toUpperCase() });
      if (role) {
        user.role = role._id;
        user.roleCode = role.code;
      }
    }

    if (password) {
      user.password = password; // pre-save hook will hash it
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
