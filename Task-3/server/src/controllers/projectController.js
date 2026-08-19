const { query, getOne, run } = require('../db/database');

async function getProjects(req, res) {
  try {
    const userId = req.user.id;
    const projects = await query(
      `SELECT p.*, pm.role as user_role, u.name as owner_name, u.avatar_color as owner_avatar,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       JOIN users u ON p.owner_id = u.id
       WHERE pm.user_id = ?
       ORDER BY p.updated_at DESC`,
      [userId]
    );

    res.json(projects);
  } catch (err) {
    console.error('getProjects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
}

async function createProject(req, res) {
  try {
    const userId = req.user.id;
    const { title, description, color } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Project title is required' });
    }

    const projectColor = color || '#6366f1';

    // Insert project
    const projResult = await run(
      'INSERT INTO projects (title, description, color, owner_id) VALUES (?, ?, ?, ?)',
      [title.trim(), description || '', projectColor, userId]
    );
    const projectId = projResult.id;

    // Add owner to members table
    await run(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, userId, 'Owner']
    );

    // Create default board columns
    const defaultCols = [
      { title: 'To Do', color: '#3b82f6', pos: 0 },
      { title: 'In Progress', color: '#f59e0b', pos: 1 },
      { title: 'In Review', color: '#8b5cf6', pos: 2 },
      { title: 'Done', color: '#10b981', pos: 3 }
    ];

    for (const col of defaultCols) {
      await run(
        'INSERT INTO columns (project_id, title, color, position) VALUES (?, ?, ?, ?)',
        [projectId, col.title, col.color, col.pos]
      );
    }

    // Log activity
    await run(
      'INSERT INTO activity_logs (project_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [projectId, userId, 'project_created', `created project "${title}"`]
    );

    const newProject = await getOne('SELECT * FROM projects WHERE id = ?', [projectId]);
    res.status(201).json(newProject);
  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
}

async function getProjectDetails(req, res) {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    // Check membership
    const member = await getOne(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    // Fetch project info
    const project = await getOne(
      `SELECT p.*, u.name as owner_name, u.avatar_color as owner_avatar
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = ?`,
      [projectId]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Members
    const members = await query(
      `SELECT u.id, u.name, u.email, u.avatar_color, u.role as user_role, pm.role as project_role, pm.joined_at
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`,
      [projectId]
    );

    // Columns
    const columns = await query(
      'SELECT * FROM columns WHERE project_id = ? ORDER BY position ASC',
      [projectId]
    );

    // Tasks with assignees & subtasks
    const tasks = await query(
      `SELECT t.*, u.name as creator_name, u.avatar_color as creator_avatar,
              c.title as column_title
       FROM tasks t
       JOIN users u ON t.created_by = u.id
       JOIN columns c ON t.column_id = c.id
       WHERE t.project_id = ?
       ORDER BY t.position ASC`,
      [projectId]
    );

    // Fetch assignees for all tasks
    const assignees = await query(
      `SELECT ta.task_id, u.id as user_id, u.name, u.email, u.avatar_color
       FROM task_assignees ta
       JOIN users u ON ta.user_id = u.id
       JOIN tasks t ON ta.task_id = t.id
       WHERE t.project_id = ?`,
      [projectId]
    );

    // Fetch subtasks for all tasks
    const subtasks = await query(
      `SELECT s.* FROM subtasks s
       JOIN tasks t ON s.task_id = t.id
       WHERE t.project_id = ?
       ORDER BY s.position ASC`,
      [projectId]
    );

    // Fetch comment count for each task
    const commentCounts = await query(
      `SELECT task_id, COUNT(*) as count FROM comments
       WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)
       GROUP BY task_id`,
      [projectId]
    );

    // Map tasks with assignees, subtasks, comment count
    const tasksWithDetails = tasks.map(t => {
      const taskAssignees = assignees.filter(a => a.task_id === t.id);
      const taskSubtasks = subtasks.filter(s => s.task_id === t.id);
      const cCountRow = commentCounts.find(c => c.task_id === t.id);
      return {
        ...t,
        assignees: taskAssignees,
        subtasks: taskSubtasks,
        comment_count: cCountRow ? cCountRow.count : 0
      };
    });

    res.json({
      project,
      members,
      columns,
      tasks: tasksWithDetails,
      user_role: member.role
    });
  } catch (err) {
    console.error('getProjectDetails error:', err);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
}

async function updateProject(req, res) {
  try {
    const projectId = req.params.id;
    const { title, description, color } = req.body;

    await run(
      `UPDATE projects
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           color = COALESCE(?, color),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, color, projectId]
    );

    const updated = await getOne('SELECT * FROM projects WHERE id = ?', [projectId]);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('project:updated', updated);
    }

    res.json(updated);
  } catch (err) {
    console.error('updateProject error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
}

async function deleteProject(req, res) {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const project = await getOne('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.owner_id !== userId) {
      return res.status(403).json({ error: 'Only the project owner can delete this project' });
    }

    await run('DELETE FROM projects WHERE id = ?', [projectId]);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('project:deleted', { projectId });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('deleteProject error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
}

async function addMember(req, res) {
  try {
    const projectId = req.params.id;
    const { email, role } = req.body;
    const senderId = req.user.id;

    if (!email) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const targetUser = await getOne('SELECT id, name, email, avatar_color FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User with this email not found' });
    }

    const existingMember = await getOne('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, targetUser.id]);
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    const memberRole = role || 'Member';
    await run(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, targetUser.id, memberRole]
    );

    const project = await getOne('SELECT title FROM projects WHERE id = ?', [projectId]);

    // Create Notification
    const notifResult = await run(
      `INSERT INTO notifications (user_id, sender_id, type, title, message, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        targetUser.id,
        senderId,
        'project_invite',
        'Added to Project',
        `You were added to project "${project ? project.title : 'Project'}" as ${memberRole}.`,
        `/projects/${projectId}`
      ]
    );

    // Activity log
    await run(
      'INSERT INTO activity_logs (project_id, user_id, action, details) VALUES (?, ?, ?, ?)',
      [projectId, senderId, 'member_added', `added ${targetUser.name} to the project`]
    );

    const newMember = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      avatar_color: targetUser.avatar_color,
      project_role: memberRole,
      joined_at: new Date().toISOString()
    };

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('project:member_added', newMember);
      io.to(`user:${targetUser.id}`).emit('notification:new', {
        id: notifResult.id,
        title: 'Added to Project',
        message: `You were added to project "${project ? project.title : 'Project'}" as ${memberRole}.`,
        link: `/projects/${projectId}`,
        is_read: 0,
        created_at: new Date().toISOString()
      });
    }

    res.status(201).json(newMember);
  } catch (err) {
    console.error('addMember error:', err);
    res.status(500).json({ error: 'Failed to add project member' });
  }
}

async function removeMember(req, res) {
  try {
    const { id: projectId, userId } = req.params;
    await run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('project:member_removed', { userId: parseInt(userId) });
    }

    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('removeMember error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
}

async function getActivityLogs(req, res) {
  try {
    const projectId = req.params.id;
    const logs = await query(
      `SELECT a.*, u.name as user_name, u.avatar_color as user_avatar, t.title as task_title
       FROM activity_logs a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN tasks t ON a.task_id = t.id
       WHERE a.project_id = ?
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [projectId]
    );

    res.json(logs);
  } catch (err) {
    console.error('getActivityLogs error:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
}

module.exports = {
  getProjects,
  createProject,
  getProjectDetails,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getActivityLogs
};
