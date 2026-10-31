const Notification = require('../models/Notification');
const Medicine = require('../models/Medicine');
const MedicineBatch = require('../models/MedicineBatch');

// @desc    Get system notifications (also synchronizes live alerts)
// @route   GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    // Generate fresh low stock notifications if any
    const lowStockMeds = await Medicine.find({
      isActive: true,
      $expr: { $lte: ['$totalStock', '$reorderLevel'] },
    }).limit(10);

    for (const med of lowStockMeds) {
      const exists = await Notification.findOne({
        type: 'LOW_STOCK',
        referenceId: med._id.toString(),
        isRead: false,
      });
      if (!exists) {
        await Notification.create({
          title: `Low Stock: ${med.name}`,
          message: `Current inventory is at ${med.totalStock} units (Reorder threshold: ${med.reorderLevel}).`,
          type: 'LOW_STOCK',
          severity: 'WARNING',
          referenceId: med._id.toString(),
        });
      }
    }

    // Check near-expiry batches
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);

    const nearExpiryBatches = await MedicineBatch.find({
      quantity: { $gt: 0 },
      expiryDate: { $lte: thirtyDays },
    }).populate('medicine', 'name');

    for (const b of nearExpiryBatches) {
      const isExpired = new Date(b.expiryDate) <= now;
      const type = isExpired ? 'EXPIRED' : 'EXPIRY_WARNING';
      const exists = await Notification.findOne({
        type,
        referenceId: b._id.toString(),
        isRead: false,
      });
      if (!exists) {
        await Notification.create({
          title: isExpired ? `Expired Batch: ${b.medicine?.name}` : `Expiring Soon: ${b.medicine?.name}`,
          message: isExpired
            ? `Batch ${b.batchNumber} (${b.quantity} units) expired on ${new Date(b.expiryDate).toLocaleDateString()}. Please quarantine.`
            : `Batch ${b.batchNumber} (${b.quantity} units) will expire on ${new Date(b.expiryDate).toLocaleDateString()}.`,
          type,
          severity: isExpired ? 'CRITICAL' : 'WARNING',
          referenceId: b._id.toString(),
        });
      }
    }

    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
