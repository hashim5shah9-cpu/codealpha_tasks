const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/task/:taskId', commentController.getComments);
router.post('/task/:taskId', commentController.addComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
