import React from 'react';
import { Clock, MessageSquare, CheckSquare } from 'lucide-react';

export default function ListView({ 
  tasks = [], 
  columns = [], 
  onOpenTaskModal, 
  onMoveTask 
}) {
  return (
    <div className="glass-panel" style={{
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{
            background: 'var(--bg-input)',
            borderBottom: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <th style={{ padding: '0.875rem 1.25rem' }}>Task Title</th>
            <th style={{ padding: '0.875rem 1rem' }}>Status</th>
            <th style={{ padding: '0.875rem 1rem' }}>Priority</th>
            <th style={{ padding: '0.875rem 1rem' }}>Assignees</th>
            <th style={{ padding: '0.875rem 1rem' }}>Due Date</th>
            <th style={{ padding: '0.875rem 1rem' }}>Checklist</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => {
            const completedSubtasks = t.subtasks ? t.subtasks.filter(s => s.completed).length : 0;
            const totalSubtasks = t.subtasks ? t.subtasks.length : 0;
            const currentCol = columns.find(c => c.id === t.column_id);

            return (
              <tr 
                key={t.id}
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onClick={() => onOpenTaskModal(t)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t.title}
                </td>
                <td style={{ padding: '0.875rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                  <select
                    className="input"
                    value={t.column_id}
                    onChange={(e) => onMoveTask(t.id, parseInt(e.target.value), 0)}
                    style={{
                      width: 'auto',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.775rem',
                      borderRadius: '999px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: 'var(--accent-primary)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      fontWeight: 600
                    }}
                  >
                    {columns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <span className={`badge badge-${t.priority.toLowerCase()}`}>
                    {t.priority}
                  </span>
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <div className="avatar-stack">
                    {t.assignees && t.assignees.map(a => (
                      <div 
                        key={a.user_id} 
                        className="avatar avatar-sm" 
                        style={{ backgroundColor: a.avatar_color || 'var(--accent-primary)' }}
                        title={a.name}
                      >
                        {a.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {t.due_date ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Clock size={13} />
                      <span>{t.due_date}</span>
                    </div>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {totalSubtasks > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <CheckSquare size={13} />
                      <span>{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                  ) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
