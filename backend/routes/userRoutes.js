const express = require('express');
const router = express.Router();
const { getUsers, getRoles, createUser, updateUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/roles', protect, getRoles);
router.get('/', protect, authorize('ADMIN'), getUsers);
router.post('/', protect, authorize('ADMIN'), createUser);
router.put('/:id', protect, authorize('ADMIN'), updateUser);

module.exports = router;
