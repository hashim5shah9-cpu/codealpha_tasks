import React, { useState } from 'react';
import { X, Plus, Calendar, AlertCircle } from 'lucide-react';

export default function NewTaskModal({ 
  columns = [], 
  members = [], 
  defaultColumnId, 
  onClose, 
  onCreateTask 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId || (columns[0] ? columns[0].id : ''));
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);

  const handleToggleAssignee = (memberId) => {
    if (selectedAssignees.includes(memberId)) {
      setSelectedAssignees(prev => prev.filter(id => id !== memberId));
    } else {
      setSelectedAssignees(prev => [...prev, memberId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !columnId) return;

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      column_id: parseInt(columnId),
      priority,
      due_date: dueDate || null,
      assignees: selectedAssignees
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Create New Task Card</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>TASK TITLE</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Implement WebSocket Realtime Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>COLUMN / STATUS</label>
              <select className="input" value={columnId} onChange={(e) => setColumnId(e.target.value)}>
                {columns.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>PRIORITY</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>DUE DATE</label>
              <input
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>ASSIGN TO MEMBERS</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {members.map(m => {
                const isSelected = selectedAssignees.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleToggleAssignee(m.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.775rem',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-input)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="avatar avatar-sm" style={{ backgroundColor: m.avatar_color || 'var(--accent-primary)', width: '18px', height: '18px', fontSize: '0.6rem' }}>
                      {m.name.charAt(0)}
                    </div>
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>DESCRIPTION</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Task details and acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Task Card</button>
          </div>
        </form>
      </div>
    </div>
  );
}
