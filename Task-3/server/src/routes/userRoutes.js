const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/search', userController.searchUsers);
router.get('/', userController.getAllUsers);

module.exports = router;
