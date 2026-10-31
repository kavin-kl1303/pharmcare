const Customer = require('../models/Customer');

// @desc    Get customers with search & pagination
// @route   GET /api/customers
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ name: searchRegex }, { phone: searchRegex }, { email: searchRegex }];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create customer
// @route   POST /api/customers
exports.createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, age, gender, address } = req.body;

    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Customer with this phone number already exists', data: existing });
    }

    const customer = await Customer.create({
      name,
      phone: phone.trim(),
      email: email || '',
      age: age ? parseInt(age, 10) : undefined,
      gender: gender || 'Unspecified',
      address: address || '',
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};
