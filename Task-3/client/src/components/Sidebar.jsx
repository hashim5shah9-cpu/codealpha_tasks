import React from 'react';
import { FolderPlus, Hash, Users, CheckCircle2, Clock, Activity, Layout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ 
  projects = [], 
  currentProjectId, 
  onSelectProject, 
  onOpenNewProject 
}) {
  const { user } = useAuth();

  return (
    <aside className="glass-panel" style={{
      width: '260px',
      minWidth: '260px',
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border-color)',
      borderTop: 'none',
      borderLeft: 'none',
      borderBottom: 'none',
      padding: '1.25rem 1rem'
    }}>
      {/* Sidebar Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        padding: '0 0.5rem'
      }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)'
        }}>
          Projects ({projects.length})
        </span>
        <button 
          className="btn btn-ghost btn-icon" 
          style={{ width: '28px', height: '28px' }}
          onClick={onOpenNewProject}
          title="Create New Project"
        >
          <FolderPlus size={16} color="var(--accent-primary)" />
        </button>
      </div>

      {/* Projects List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {projects.map(p => {
          const isActive = currentProjectId === p.id;
          return (
            <div
              key={p.id}
              onClick={() => onSelectProject(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', overflow: 'hidden' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: p.color || 'var(--accent-primary)',
                  flexShrink: 0
                }}></span>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {p.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {p.task_count !== undefined && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    background: isActive ? 'var(--accent-primary)' : 'var(--bg-input)',
                    color: isActive ? '#fff' : 'var(--text-muted)'
                  }}>
                    {p.task_count}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Project Action Button */}
      <button 
        className="btn btn-secondary" 
        style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
        onClick={onOpenNewProject}
      >
        <FolderPlus size={16} /> New Project
      </button>

      {/* User Footer Profile Banner */}
      {user && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div className="avatar avatar-md" style={{ backgroundColor: user.avatar_color || 'var(--accent-primary)' }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.825rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
