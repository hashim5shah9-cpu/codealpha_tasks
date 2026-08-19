import React from 'react';

export default function CalendarView({ tasks = [], onOpenTaskModal }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Group tasks by due date
  const tasksByDate = {};
  tasks.forEach(t => {
    if (t.due_date) {
      if (!tasksByDate[t.due_date]) tasksByDate[t.due_date] = [];
      tasksByDate[t.due_date].push(t);
    }
  });

  // Generate 28 calendar grid days for August 2026
  const gridDays = Array.from({ length: 28 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-08-${dayNum < 10 ? '0' + dayNum : dayNum}`;
    return { dayNum, dateStr, tasks: tasksByDate[dateStr] || [] };
  });

  return (
    <div className="glass-panel" style={{
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      background: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.1rem' }}>August 2026 - Task Schedule</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
        {days.map(d => (
          <div key={d} style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>
            {d}
          </div>
        ))}

        {gridDays.map(item => (
          <div
            key={item.dateStr}
            style={{
              minHeight: '90px',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>
              {item.dayNum}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
              {item.tasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => onOpenTaskModal(t)}
                  style={{
                    padding: '0.2rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={t.title}
                >
                  {t.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
