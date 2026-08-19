const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', taskController.createTask);
router.put('/:id/move', taskController.moveTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.put('/:id/assignees', taskController.setAssignees);

router.post('/:id/subtasks', taskController.addSubtask);
router.put('/subtasks/:subtaskId', taskController.toggleSubtask);
router.delete('/subtasks/:subtaskId', taskController.deleteSubtask);

module.exports = router;
