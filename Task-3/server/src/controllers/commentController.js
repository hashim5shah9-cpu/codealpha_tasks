const { query, getOne, run } = require('../db/database');

async function getComments(req, res) {
  try {
    const taskId = req.params.taskId;
    const comments = await query(
      `SELECT c.*, u.name as user_name, u.email as user_email, u.avatar_color as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [taskId]
    );

    res.json(comments);
  } catch (err) {
    console.error('getComments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
}

async function addComment(req, res) {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const task = await getOne('SELECT project_id, title FROM tasks WHERE id = ?', [taskId]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const result = await run(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [taskId, userId, content.trim()]
    );

    const newComment = await getOne(
      `SELECT c.*, u.name as user_name, u.email as user_email, u.avatar_color as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.id]
    );

    // Notify task assignees
    const assignees = await query('SELECT user_id FROM task_assignees WHERE task_id = ?', [taskId]);
    const sender = await getOne('SELECT name FROM users WHERE id = ?', [userId]);

    for (const a of assignees) {
      if (a.user_id !== userId) {
        const notifResult = await run(
          `INSERT INTO notifications (user_id, sender_id, type, title, message, link)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            a.user_id,
            userId,
            'task_comment',
            'New Comment',
            `${sender ? sender.name : 'Someone'} commented on "${task.title}".`,
            `/projects/${task.project_id}`
          ]
        );

        const io = req.app.get('io');
        if (io) {
          io.to(`user:${a.user_id}`).emit('notification:new', {
            id: notifResult.id,
            title: 'New Comment',
            message: `${sender ? sender.name : 'Someone'} commented on "${task.title}".`,
            link: `/projects/${task.project_id}`,
            is_read: 0,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // Realtime socket broadcast to project room
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${task.project_id}`).emit('comment:added', newComment);
    }

    res.status(201).json(newComment);
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await getOne('SELECT c.*, t.project_id FROM comments c JOIN tasks t ON c.task_id = t.id WHERE c.id = ?', [id]);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'Can only delete your own comments' });
    }

    await run('DELETE FROM comments WHERE id = ?', [id]);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${comment.project_id}`).emit('comment:deleted', { id: parseInt(id), taskId: comment.task_id });
    }

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('deleteComment error:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}

module.exports = {
  getComments,
  addComment,
  deleteComment
};
