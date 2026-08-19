const { query, getOne, run } = require('../db/database');

async function createColumn(req, res) {
  try {
    const { project_id, title, color } = req.body;
    if (!project_id || !title) {
      return res.status(400).json({ error: 'Project ID and Title are required' });
    }

    const maxPosRow = await getOne('SELECT MAX(position) as maxPos FROM columns WHERE project_id = ?', [project_id]);
    const nextPos = (maxPosRow && maxPosRow.maxPos !== null) ? maxPosRow.maxPos + 1 : 0;

    const result = await run(
      'INSERT INTO columns (project_id, title, color, position) VALUES (?, ?, ?, ?)',
      [project_id, title.trim(), color || '#64748b', nextPos]
    );

    const newColumn = await getOne('SELECT * FROM columns WHERE id = ?', [result.id]);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${project_id}`).emit('column:created', newColumn);
    }

    res.status(201).json(newColumn);
  } catch (err) {
    console.error('createColumn error:', err);
    res.status(500).json({ error: 'Failed to create column' });
  }
}

async function updateColumn(req, res) {
  try {
    const columnId = req.params.id;
    const { title, color } = req.body;

    await run(
      'UPDATE columns SET title = COALESCE(?, title), color = COALESCE(?, color) WHERE id = ?',
      [title, color, columnId]
    );

    const updated = await getOne('SELECT * FROM columns WHERE id = ?', [columnId]);

    const io = req.app.get('io');
    if (io && updated) {
      io.to(`project:${updated.project_id}`).emit('column:updated', updated);
    }

    res.json(updated);
  } catch (err) {
    console.error('updateColumn error:', err);
    res.status(500).json({ error: 'Failed to update column' });
  }
}

async function deleteColumn(req, res) {
  try {
    const columnId = req.params.id;
    const column = await getOne('SELECT project_id FROM columns WHERE id = ?', [columnId]);
    if (!column) return res.status(404).json({ error: 'Column not found' });

    await run('DELETE FROM columns WHERE id = ?', [columnId]);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${column.project_id}`).emit('column:deleted', { columnId: parseInt(columnId) });
    }

    res.json({ message: 'Column deleted' });
  } catch (err) {
    console.error('deleteColumn error:', err);
    res.status(500).json({ error: 'Failed to delete column' });
  }
}

async function reorderColumns(req, res) {
  try {
    const { project_id, column_orders } = req.body; // column_orders: [{ id: 1, position: 0 }, ...]
    if (!project_id || !Array.isArray(column_orders)) {
      return res.status(400).json({ error: 'Invalid reorder data' });
    }

    for (const item of column_orders) {
      await run('UPDATE columns SET position = ? WHERE id = ? AND project_id = ?', [item.position, item.id, project_id]);
    }

    const updatedColumns = await query('SELECT * FROM columns WHERE project_id = ? ORDER BY position ASC', [project_id]);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${project_id}`).emit('columns:reordered', updatedColumns);
    }

    res.json(updatedColumns);
  } catch (err) {
    console.error('reorderColumns error:', err);
    res.status(500).json({ error: 'Failed to reorder columns' });
  }
}

module.exports = {
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns
};
