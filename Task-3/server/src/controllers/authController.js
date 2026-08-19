const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, run, query } = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

const avatarColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#3b82f6'];

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await getOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const result = await run(
      'INSERT INTO users (name, email, password_hash, avatar_color, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), password_hash, randomColor, role || 'Member']
    );

    const user = {
      id: result.id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      avatar_color: randomColor,
      role: role || 'Member'
    };

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_color: user.avatar_color,
      role: user.role
    };

    res.json({ user: userData, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
}

async function me(req, res) {
  try {
    const user = await getOne('SELECT id, name, email, avatar_color, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, avatar_color, role } = req.body;
    await run(
      'UPDATE users SET name = COALESCE(?, name), avatar_color = COALESCE(?, avatar_color), role = COALESCE(?, role) WHERE id = ?',
      [name, avatar_color, role, req.user.id]
    );

    const updatedUser = await getOne('SELECT id, name, email, avatar_color, role FROM users WHERE id = ?', [req.user.id]);
    res.json(updatedUser);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

module.exports = {
  register,
  login,
  me,
  updateProfile
};
