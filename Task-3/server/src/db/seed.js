const bcrypt = require('bcryptjs');
const { run, query, getOne } = require('./database');
const { initSchema } = require('./schema');

async function seed() {
  console.log('Seeding database...');
  await initSchema();

  // Check if users already exist
  const existingUser = await getOne('SELECT id FROM users LIMIT 1');
  if (existingUser) {
    console.log('Database already contains data. Skipping seed.');
    return;
  }

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const user1 = await run(
    'INSERT INTO users (name, email, password_hash, avatar_color, role) VALUES (?, ?, ?, ?, ?)',
    ['Alex Rivera', 'alex@taskhub.com', defaultPassword, '#6366f1', 'Product Lead']
  );
  const user2 = await run(
    'INSERT INTO users (name, email, password_hash, avatar_color, role) VALUES (?, ?, ?, ?, ?)',
    ['Sarah Chen', 'sarah@taskhub.com', defaultPassword, '#ec4899', 'Senior Frontend Dev']
  );
  const user3 = await run(
    'INSERT INTO users (name, email, password_hash, avatar_color, role) VALUES (?, ?, ?, ?, ?)',
    ['David Kim', 'david@taskhub.com', defaultPassword, '#10b981', 'Backend Architect']
  );
  const user4 = await run(
    'INSERT INTO users (name, email, password_hash, avatar_color, role) VALUES (?, ?, ?, ?, ?)',
    ['Emma Watson', 'emma@taskhub.com', defaultPassword, '#f59e0b', 'Lead UX Designer']
  );

  const alexId = user1.id;
  const sarahId = user2.id;
  const davidId = user3.id;
  const emmaId = user4.id;

  // 2. Create Projects
  const proj1 = await run(
    'INSERT INTO projects (title, description, color, owner_id) VALUES (?, ?, ?, ?)',
    [
      'TaskHub Platform Launch',
      'Next-generation collaborative project workspace with real-time Kanban boards and team chat.',
      '#6366f1',
      alexId
    ]
  );
  const proj2 = await run(
    'INSERT INTO projects (title, description, color, owner_id) VALUES (?, ?, ?, ?)',
    [
      'UI/UX Design System 2.0',
      'Unified design tokens, micro-interactions, dark mode glassmorphism UI components.',
      '#ec4899',
      emmaId
    ]
  );

  const proj1Id = proj1.id;
  const proj2Id = proj2.id;

  // Project Members
  await run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [proj1Id, alexId, 'Owner']);
  await run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [proj1Id, sarahId, 'Admin']);
  await run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [proj1Id, davidId, 'Member']);
  await run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [proj1Id, emmaId, 'Member']);

  await run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [proj2Id, emmaId, 'Owner']);
  await run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [proj2Id, sarahId, 'Admin']);

  // 3. Create Board Columns for Project 1
  const col1 = await run('INSERT INTO columns (project_id, title, color, position) VALUES (?, ?, ?, ?)', [proj1Id, 'Backlog', '#94a3b8', 0]);
  const col2 = await run('INSERT INTO columns (project_id, title, color, position) VALUES (?, ?, ?, ?)', [proj1Id, 'To Do', '#3b82f6', 1]);
  const col3 = await run('INSERT INTO columns (project_id, title, color, position) VALUES (?, ?, ?, ?)', [proj1Id, 'In Progress', '#f59e0b', 2]);
  const col4 = await run('INSERT INTO columns (project_id, title, color, position) VALUES (?, ?, ?, ?)', [proj1Id, 'In Review', '#8b5cf6', 3]);
  const col5 = await run('INSERT INTO columns (project_id, title, color, position) VALUES (?, ?, ?, ?)', [proj1Id, 'Done', '#10b981', 4]);

  // Columns for Project 2
  await run('INSERT INTO columns (project_id, title, color, position) VALUES (?, ?, ?, ?)', [proj2Id, 'Discovery', '#64748b', 0]);
  await run('INSERT INTO columns (project_id, title, color, position) VALUES (?, ?, ?, ?)', [proj2Id, 'Wireframes', '#ec4899', 1]);
  await run('INSERT INTO columns (project_id, title, color, position) VALUES (?, ?, ?, ?)', [proj2Id, 'Approved', '#10b981', 2]);

  // 4. Create Tasks for Project 1
  const task1 = await run(
    `INSERT INTO tasks (project_id, column_id, title, description, priority, due_date, position, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      proj1Id,
      col3.id, // In Progress
      'Implement WebSocket Real-time Sync',
      'Set up Socket.io event listeners for task card drag movements, live comment additions, and online presence badges.',
      'Urgent',
      '2026-08-20',
      0,
      davidId
    ]
  );

  const task2 = await run(
    `INSERT INTO tasks (project_id, column_id, title, description, priority, due_date, position, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      proj1Id,
      col3.id, // In Progress
      'Kanban Board Drag & Drop Animations',
      'Build responsive HTML5 Kanban drag and drop with smooth card drop target highlights.',
      'High',
      '2026-08-19',
      1,
      sarahId
    ]
  );

  const task3 = await run(
    `INSERT INTO tasks (project_id, column_id, title, description, priority, due_date, position, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      proj1Id,
      col2.id, // To Do
      'JWT Authentication & Protected Routes',
      'Implement secure login, registration, JWT token verification, and user session context.',
      'High',
      '2026-08-22',
      0,
      alexId
    ]
  );

  const task4 = await run(
    `INSERT INTO tasks (project_id, column_id, title, description, priority, due_date, position, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      proj1Id,
      col4.id, // In Review
      'Dark / Light Theme & Glassmorphism Design System',
      'Craft beautiful CSS variables, frosted glass effects, modern typography, and dark mode switcher.',
      'Medium',
      '2026-08-18',
      0,
      emmaId
    ]
  );

  const task5 = await run(
    `INSERT INTO tasks (project_id, column_id, title, description, priority, due_date, position, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      proj1Id,
      col5.id, // Done
      'Database Schema & SQLite Migrations',
      'Initialize tables for users, projects, tasks, assignees, subtasks, comments, and activity feeds.',
      'Low',
      '2026-08-16',
      0,
      davidId
    ]
  );

  // 5. Assignees
  await run('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [task1.id, davidId]);
  await run('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [task1.id, sarahId]);

  await run('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [task2.id, sarahId]);

  await run('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [task3.id, alexId]);
  await run('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [task3.id, davidId]);

  await run('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [task4.id, emmaId]);
  await run('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [task5.id, davidId]);

  // 6. Subtasks / Checklists
  await run('INSERT INTO subtasks (task_id, title, completed, position) VALUES (?, ?, ?, ?)', [task1.id, 'Configure Socket.io server on Express port 5000', 1, 0]);
  await run('INSERT INTO subtasks (task_id, title, completed, position) VALUES (?, ?, ?, ?)', [task1.id, 'Implement project room subscription join/leave', 1, 1]);
  await run('INSERT INTO subtasks (task_id, title, completed, position) VALUES (?, ?, ?, ?)', [task1.id, 'Broadcast task:moved and comment:added events', 0, 2]);

  await run('INSERT INTO subtasks (task_id, title, completed, position) VALUES (?, ?, ?, ?)', [task2.id, 'Add card drag preview visual styling', 1, 0]);
  await run('INSERT INTO subtasks (task_id, title, completed, position) VALUES (?, ?, ?, ?)', [task2.id, 'Implement column drop zones and position recalculation', 0, 1]);

  // 7. Comments
  await run('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)', [
    task1.id,
    sarahId,
    'I have set up the frontend socket hook listener. Once you emit `task:moved`, the board state will instantly update without a page refresh!'
  ]);
  await run('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)', [
    task1.id,
    davidId,
    'Awesome! Socket server handlers are now ready. Testing broadcast across multiple browser sessions now.'
  ]);

  // 8. Notifications
  await run('INSERT INTO notifications (user_id, sender_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)', [
    sarahId,
    davidId,
    'task_assignment',
    'Assigned to Task',
    'David Kim assigned you to "Implement WebSocket Real-time Sync".',
    '/projects/' + proj1Id
  ]);
  await run('INSERT INTO notifications (user_id, sender_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)', [
    alexId,
    emmaId,
    'task_comment',
    'New Comment',
    'Emma Watson commented on "Dark / Light Theme & Glassmorphism Design System".',
    '/projects/' + proj1Id
  ]);

  // 9. Activity Logs
  await run('INSERT INTO activity_logs (project_id, task_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)', [
    proj1Id,
    task1.id,
    davidId,
    'task_moved',
    'moved task "Implement WebSocket Real-time Sync" to In Progress'
  ]);
  await run('INSERT INTO activity_logs (project_id, task_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)', [
    proj1Id,
    task2.id,
    sarahId,
    'task_created',
    'created task "Kanban Board Drag & Drop Animations"'
  ]);

  console.log('Seed completed successfully!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };
