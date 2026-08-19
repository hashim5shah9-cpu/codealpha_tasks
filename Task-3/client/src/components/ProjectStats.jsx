import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Users, Layers, TrendingUp } from 'lucide-react';

export default function ProjectStats({ project, tasks = [], columns = [], members = [] }) {
  const totalTasks = tasks.length;
  const completedColumn = columns.find(c => c.title.toLowerCase().includes('done') || c.title.toLowerCase().includes('completed'));
  const completedTasks = completedColumn ? tasks.filter(t => t.column_id === completedColumn.id).length : 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const urgentTasks = tasks.filter(t => t.priority === 'Urgent' || t.priority === 'High').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>Total Tasks</span>
            <Layers size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
            {totalTasks}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>Completion Rate</span>
            <TrendingUp size={18} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem', fontFamily: 'var(--font-display)', color: 'var(--accent-success)' }}>
            {completionRate}%
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
            <div style={{ width: `${completionRate}%`, height: '100%', background: 'var(--accent-success)' }}></div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>Completed</span>
            <CheckCircle2 size={18} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem', fontFamily: 'var(--font-display)' }}>
            {completedTasks} / {totalTasks}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>Urgent & High Priority</span>
            <AlertTriangle size={18} color="var(--accent-warning)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem', fontFamily: 'var(--font-display)', color: 'var(--accent-warning)' }}>
            {urgentTasks}
          </div>
        </div>
      </div>

      {/* Column Breakdown & Team Members */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Status Distribution</h3>
          {columns.map(col => {
            const count = tasks.filter(t => t.column_id === col.id).length;
            const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            return (
              <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600 }}>{col.title}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{count} tasks ({pct}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: col.color || 'var(--accent-primary)' }}></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Project Team</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div className="avatar avatar-sm" style={{ backgroundColor: m.avatar_color || 'var(--accent-primary)' }}>
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{m.project_role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
