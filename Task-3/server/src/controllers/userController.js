const { query } = require('../db/database');

async function searchUsers(req, res) {
  try {
    const q = req.query.q || '';
    const users = await query(
      `SELECT id, name, email, avatar_color, role
       FROM users
       WHERE name LIKE ? OR email LIKE ?
       LIMIT 10`,
      [`%${q}%`, `%${q}%`]
    );

    res.json(users);
  } catch (err) {
    console.error('searchUsers error:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await query('SELECT id, name, email, avatar_color, role FROM users ORDER BY name ASC');
    res.json(users);
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

module.exports = {
  searchUsers,
  getAllUsers
};
