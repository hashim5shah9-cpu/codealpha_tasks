const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProjectDetails);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/members', projectController.addMember);
router.delete('/:id/members/:userId', projectController.removeMember);
router.get('/:id/activity', projectController.getActivityLogs);

module.exports = router;
