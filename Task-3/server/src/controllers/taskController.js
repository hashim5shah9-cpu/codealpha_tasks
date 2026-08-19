const { query, getOne, run } = require('../db/database');

async function createTask(req, res) {
  try {
    const userId = req.user.id;
    const { project_id, column_id, title, description, priority, due_date, assignees = [], subtasks = [] } = req.body;

    if (!project_id || !column_id || !title) {
      return res.status(400).json({ error: 'project_id, column_id, and title are required' });
    }

    // Get max position in column
    const maxPosRow = await getOne('SELECT MAX(position) as maxPos FROM tasks WHERE column_id = ?', [column_id]);
    const position = (maxPosRow && maxPosRow.maxPos !== null) ? maxPosRow.maxPos + 1 : 0;

    const taskResult = await run(
      `INSERT INTO tasks (project_id, column_id, title, description, priority, due_date, position, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, column_id, title.trim(), description || '', priority || 'Medium', due_date || null, position, userId]
    );

    const taskId = taskResult.id;

    // Add Assignees
    const assignedUserDetails = [];
    if (Array.isArray(assignees)) {
      for (const aUserId of assignees) {
        await run('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [taskId, aUserId]);
        const u = await getOne('SELECT id, name, email, avatar_color FROM users WHERE id = ?', [aUserId]);
        if (u) assignedUserDetails.push(u);

        // Send notification if assigned user is not creator
        if (aUserId !== userId) {
          const sender = await getOne('SELECT name FROM users WHERE id = ?', [userId]);
          const notifResult = await run(
            `INSERT INTO notifications (user_id, sender_id, type, title, message, link)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              aUserId,
              userId,
              'task_assignment',
              'Assigned to Task',
              `${sender ? sender.name : 'Someone'} assigned you to task "${title}".`,
              `/projects/${project_id}`
            ]
          );

          const io = req.app.get('io');
          if (io) {
            io.to(`user:${aUserId}`).emit('notification:new', {
              id: notifResult.id,
              title: 'Assigned to Task',
              message: `${sender ? sender.name : 'Someone'} assigned you to task "${title}".`,
              link: `/projects/${project_id}`,
              is_read: 0,
              created_at: new Date().toISOString()
            });
          }
        }
      }
    }

    // Add Subtasks
    const createdSubtasks = [];
    if (Array.isArray(subtasks)) {
      let subPos = 0;
      for (const st of subtasks) {
        if (st.title && st.title.trim()) {
          const stRes = await run(
            'INSERT INTO subtasks (task_id, title, completed, position) VALUES (?, ?, ?, ?)',
            [taskId, st.title.trim(), st.completed ? 1 : 0, subPos++]
          );
          createdSubtasks.push({ id: stRes.id, task_id: taskId, title: st.title.trim(), completed: st.completed ? 1 : 0, position: subPos - 1 });
        }
      }
    }

    // Activity log
    await run(
      'INSERT INTO activity_logs (project_id, task_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)',
      [project_id, taskId, userId, 'task_created', `created task "${title}"`]
    );

    const task = await getOne(
      `SELECT t.*, u.name as creator_name, u.avatar_color as creator_avatar, c.title as column_title
       FROM tasks t
       JOIN users u ON t.created_by = u.id
       JOIN columns c ON t.column_id = c.id
       WHERE t.id = ?`,
      [taskId]
    );

    task.assignees = assignedUserDetails;
    task.subtasks = createdSubtasks;
    task.comment_count = 0;

    // WebSocket real-time broadcast
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${project_id}`).emit('task:created', task);
    }

    res.status(201).json(task);
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
}

async function moveTask(req, res) {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { column_id, position, project_id } = req.body;

    if (!column_id || position === undefined) {
      return res.status(400).json({ error: 'column_id and position are required' });
    }

    const taskBefore = await getOne(
      `SELECT t.*, c.title as old_column_title FROM tasks t JOIN columns c ON t.column_id = c.id WHERE t.id = ?`,
      [taskId]
    );

    if (!taskBefore) return res.status(404).json({ error: 'Task not found' });

    // Update task position and column
    await run(
      'UPDATE tasks SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [column_id, position, taskId]
    );

    const newColumn = await getOne('SELECT title FROM columns WHERE id = ?', [column_id]);
    const user = await getOne('SELECT name FROM users WHERE id = ?', [userId]);

    // Activity log if moved to a different column
    if (taskBefore.column_id !== parseInt(column_id)) {
      await run(
        'INSERT INTO activity_logs (project_id, task_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)',
        [
          project_id || taskBefore.project_id,
          taskId,
          userId,
          'task_moved',
          `moved "${taskBefore.title}" to ${newColumn ? newColumn.title : 'new status'}`
        ]
      );
    }

    const updatedTask = await getOne(
      `SELECT t.*, u.name as creator_name, u.avatar_color as creator_avatar, c.title as column_title
       FROM tasks t
       JOIN users u ON t.created_by = u.id
       JOIN columns c ON t.column_id = c.id
       WHERE t.id = ?`,
      [taskId]
    );

    // Fetch assignees and subtasks
    const assignees = await query(
      `SELECT ta.task_id, u.id as user_id, u.name, u.email, u.avatar_color
       FROM task_assignees ta JOIN users u ON ta.user_id = u.id WHERE ta.task_id = ?`,
      [taskId]
    );
    const subtasks = await query('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC', [taskId]);

    updatedTask.assignees = assignees;
    updatedTask.subtasks = subtasks;

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${taskBefore.project_id}`).emit('task:moved', {
        taskId: parseInt(taskId),
        fromColumnId: taskBefore.column_id,
        toColumnId: parseInt(column_id),
        position,
        task: updatedTask,
        movedBy: user ? user.name : 'A member'
      });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error('moveTask error:', err);
    res.status(500).json({ error: 'Failed to move task' });
  }
}

async function updateTask(req, res) {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { title, description, priority, due_date, column_id } = req.body;

    await run(
      `UPDATE tasks
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           priority = COALESCE(?, priority),
           due_date = COALESCE(?, due_date),
           column_id = COALESCE(?, column_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, priority, due_date, column_id, taskId]
    );

    const task = await getOne(
      `SELECT t.*, u.name as creator_name, u.avatar_color as creator_avatar, c.title as column_title
       FROM tasks t
       JOIN users u ON t.created_by = u.id
       JOIN columns c ON t.column_id = c.id
       WHERE t.id = ?`,
      [taskId]
    );

    const assignees = await query(
      `SELECT ta.task_id, u.id as user_id, u.name, u.email, u.avatar_color
       FROM task_assignees ta JOIN users u ON ta.user_id = u.id WHERE ta.task_id = ?`,
      [taskId]
    );
    const subtasks = await query('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC', [taskId]);

    task.assignees = assignees;
    task.subtasks = subtasks;

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${task.project_id}`).emit('task:updated', task);
    }

    res.json(task);
  } catch (err) {
    console.error('updateTask error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
}

async function deleteTask(req, res) {
  try {
    const taskId = req.params.id;
    const task = await getOne('SELECT project_id, title FROM tasks WHERE id = ?', [taskId]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await run('DELETE FROM tasks WHERE id = ?', [taskId]);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${task.project_id}`).emit('task:deleted', { taskId: parseInt(taskId), project_id: task.project_id });
    }

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('deleteTask error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
}

async function setAssignees(req, res) {
  try {
    const taskId = req.params.id;
    const { assignees = [] } = req.body;
    const senderId = req.user.id;

    const task = await getOne('SELECT project_id, title FROM tasks WHERE id = ?', [taskId]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await run('DELETE FROM task_assignees WHERE task_id = ?', [taskId]);

    const assignedUsers = [];
    for (const uId of assignees) {
      await run('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [taskId, uId]);
      const u = await getOne('SELECT id, name, email, avatar_color FROM users WHERE id = ?', [uId]);
      if (u) assignedUsers.push(u);

      if (uId !== senderId) {
        const sender = await getOne('SELECT name FROM users WHERE id = ?', [senderId]);
        const notifResult = await run(
          `INSERT INTO notifications (user_id, sender_id, type, title, message, link)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            uId,
            senderId,
            'task_assignment',
            'Assigned to Task',
            `${sender ? sender.name : 'Someone'} assigned you to "${task.title}".`,
            `/projects/${task.project_id}`
          ]
        );

        const io = req.app.get('io');
        if (io) {
          io.to(`user:${uId}`).emit('notification:new', {
            id: notifResult.id,
            title: 'Assigned to Task',
            message: `${sender ? sender.name : 'Someone'} assigned you to "${task.title}".`,
            link: `/projects/${task.project_id}`,
            is_read: 0,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${task.project_id}`).emit('task:assignees_updated', { taskId: parseInt(taskId), assignees: assignedUsers });
    }

    res.json(assignedUsers);
  } catch (err) {
    console.error('setAssignees error:', err);
    res.status(500).json({ error: 'Failed to update assignees' });
  }
}

async function addSubtask(req, res) {
  try {
    const taskId = req.params.id;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Subtask title required' });

    const task = await getOne('SELECT project_id FROM tasks WHERE id = ?', [taskId]);
    const maxPosRow = await getOne('SELECT MAX(position) as maxPos FROM subtasks WHERE task_id = ?', [taskId]);
    const position = (maxPosRow && maxPosRow.maxPos !== null) ? maxPosRow.maxPos + 1 : 0;

    const result = await run(
      'INSERT INTO subtasks (task_id, title, completed, position) VALUES (?, ?, 0, ?)',
      [taskId, title.trim(), position]
    );

    const subtask = { id: result.id, task_id: parseInt(taskId), title: title.trim(), completed: 0, position };

    const io = req.app.get('io');
    if (io && task) {
      io.to(`project:${task.project_id}`).emit('subtask:added', subtask);
    }

    res.status(201).json(subtask);
  } catch (err) {
    console.error('addSubtask error:', err);
    res.status(500).json({ error: 'Failed to add subtask' });
  }
}

async function toggleSubtask(req, res) {
  try {
    const { subtaskId } = req.params;
    const { completed } = req.body;

    await run('UPDATE subtasks SET completed = ? WHERE id = ?', [completed ? 1 : 0, subtaskId]);
    const updated = await getOne('SELECT * FROM subtasks WHERE id = ?', [subtaskId]);

    if (updated) {
      const task = await getOne('SELECT project_id FROM tasks WHERE id = ?', [updated.task_id]);
      const io = req.app.get('io');
      if (io && task) {
        io.to(`project:${task.project_id}`).emit('subtask:updated', updated);
      }
    }

    res.json(updated);
  } catch (err) {
    console.error('toggleSubtask error:', err);
    res.status(500).json({ error: 'Failed to toggle subtask' });
  }
}

async function deleteSubtask(req, res) {
  try {
    const { subtaskId } = req.params;
    const subtask = await getOne('SELECT task_id FROM subtasks WHERE id = ?', [subtaskId]);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    const task = await getOne('SELECT project_id FROM tasks WHERE id = ?', [subtask.task_id]);

    await run('DELETE FROM subtasks WHERE id = ?', [subtaskId]);

    const io = req.app.get('io');
    if (io && task) {
      io.to(`project:${task.project_id}`).emit('subtask:deleted', { subtaskId: parseInt(subtaskId), taskId: subtask.task_id });
    }

    res.json({ message: 'Subtask deleted' });
  } catch (err) {
    console.error('deleteSubtask error:', err);
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
}

module.exports = {
  createTask,
  moveTask,
  updateTask,
  deleteTask,
  setAssignees,
  addSubtask,
  toggleSubtask,
  deleteSubtask
};
