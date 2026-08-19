const { query, run } = require('../db/database');

async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const notifications = await query(
      `SELECT n.*, u.name as sender_name, u.avatar_color as sender_avatar
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [userId]
    );

    res.json(notifications);
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

async function markAsRead(req, res) {
  try {
    const notifId = req.params.id;
    const userId = req.user.id;

    await run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notifId, userId]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
