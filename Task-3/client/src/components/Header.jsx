import React, { useState, useEffect } from 'react';
import { 
  Trello, 
  LayoutGrid, 
  ListTodo, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Bell, 
  Sun, 
  Moon, 
  Plus, 
  UserPlus, 
  LogOut, 
  CheckCheck,
  Activity,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';

export default function Header({ 
  currentProject, 
  activeView, 
  setActiveView, 
  onOpenNewTask, 
  onOpenNewProject,
  onOpenAddMember,
  onlineUsers = [] 
}) {
  const { user, logout, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toasts, removeToast } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token, toasts]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="glass-panel" style={{
      height: '64px',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Left section: Project Title & View Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Trello size={20} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>
            TaskHub
          </span>
        </div>

        {currentProject && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: currentProject.color || 'var(--accent-primary)'
              }}></span>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{currentProject.title}</h2>
            </div>

            {/* View Switcher Tabs */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-input)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <button
                className={`btn btn-ghost ${activeView === 'kanban' ? 'active-tab' : ''}`}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  background: activeView === 'kanban' ? 'var(--bg-secondary)' : 'transparent',
                  color: activeView === 'kanban' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
                onClick={() => setActiveView('kanban')}
              >
                <LayoutGrid size={15} /> Kanban
              </button>

              <button
                className={`btn btn-ghost ${activeView === 'list' ? 'active-tab' : ''}`}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  background: activeView === 'list' ? 'var(--bg-secondary)' : 'transparent',
                  color: activeView === 'list' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
                onClick={() => setActiveView('list')}
              >
                <ListTodo size={15} /> List
              </button>

              <button
                className={`btn btn-ghost ${activeView === 'calendar' ? 'active-tab' : ''}`}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  background: activeView === 'calendar' ? 'var(--bg-secondary)' : 'transparent',
                  color: activeView === 'calendar' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
                onClick={() => setActiveView('calendar')}
              >
                <CalendarIcon size={15} /> Calendar
              </button>

              <button
                className={`btn btn-ghost ${activeView === 'analytics' ? 'active-tab' : ''}`}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  background: activeView === 'analytics' ? 'var(--bg-secondary)' : 'transparent',
                  color: activeView === 'analytics' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
                onClick={() => setActiveView('analytics')}
              >
                <BarChart3 size={15} /> Analytics
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Section: Actions, Notifications, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Live Online Users Indicator */}
        {currentProject && onlineUsers.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.75rem',
            color: 'var(--accent-success)'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-success)',
              boxShadow: '0 0 8px var(--accent-success)'
            }}></span>
            <span>{onlineUsers.length} Online</span>
          </div>
        )}

        {currentProject && (
          <>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem' }} onClick={onOpenAddMember}>
              <UserPlus size={15} /> Invite Member
            </button>
            <button className="btn btn-primary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.825rem' }} onClick={onOpenNewTask}>
              <Plus size={16} /> New Task
            </button>
          </>
        )}

        {/* Theme Toggle */}
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-ghost btn-icon" 
            style={{ position: 'relative' }} 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'var(--accent-danger)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 6px var(--accent-danger)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div className="glass-panel" style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '340px',
              maxHeight: '400px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-secondary)'
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead} 
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                      marginBottom: '0.25rem',
                      borderLeft: n.read ? 'none' : '3px solid var(--accent-primary)'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{n.message}</div>
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Menu */}
        {user && (
          <div style={{ position: 'relative' }}>
            <div 
              className="avatar avatar-md" 
              style={{ backgroundColor: user.avatar_color || 'var(--accent-primary)', cursor: 'pointer' }}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user.name.charAt(0)}
            </div>

            {showUserMenu && (
              <div className="glass-panel" style={{
                position: 'absolute',
                top: '46px',
                right: 0,
                width: '200px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.5rem',
                zIndex: 100,
                background: 'var(--bg-secondary)'
              }}>
                <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginTop: '0.25rem' }}>{user.role}</div>
                </div>
                <button 
                  className="btn btn-ghost" 
                  style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--accent-danger)', fontSize: '0.825rem' }}
                  onClick={logout}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Real-time Toast Notifications Alert Stack */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" onClick={() => removeToast(t.id)}>
            <Activity size={18} color="var(--accent-primary)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.title}</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>{t.message}</div>
            </div>
          </div>
        ))}
      </div>
    </header>
  );
}
