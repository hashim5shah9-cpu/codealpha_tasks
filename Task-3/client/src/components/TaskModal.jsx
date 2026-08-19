import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  User, 
  CheckSquare, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Send,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TaskModal({ 
  task, 
  columns = [], 
  members = [], 
  onClose, 
  onUpdateTask, 
  onDeleteTask,
  onMoveTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onSetAssignees 
}) {
  const { user, token } = useAuth();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 'Medium');
  const [columnId, setColumnId] = useState(task.column_id);
  const [dueDate, setDueDate] = useState(task.due_date || '');

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [task.id]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments/task/${task.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleSaveBasicInfo = () => {
    onUpdateTask(task.id, {
      title,
      description,
      priority,
      column_id: parseInt(columnId),
      due_date: dueDate || null
    });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/comments/task/${task.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newCommentText.trim() })
      });
      if (res.ok) {
        const added = await res.json();
        setComments(prev => [...prev, added]);
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleAddSubtaskSubmit = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleToggleAssignee = (memberId) => {
    const currentAssignees = task.assignees ? task.assignees.map(a => a.user_id) : [];
    let updated;
    if (currentAssignees.includes(memberId)) {
      updated = currentAssignees.filter(id => id !== memberId);
    } else {
      updated = [...currentAssignees, memberId];
    }
    onSetAssignees(task.id, updated);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveBasicInfo}
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                background: 'transparent',
                border: '1px solid transparent',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)'
              }}
            />
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginLeft: '0.5rem', marginTop: '0.25rem' }}>
              Created by {task.creator_name || 'Team member'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-danger btn-icon" onClick={() => onDeleteTask(task.id)} title="Delete Task">
              <Trash2 size={16} />
            </button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Task Property Controls Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)'
        }}>
          {/* Status Column Select */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>STATUS</label>
            <select
              className="input"
              value={columnId}
              onChange={(e) => {
                setColumnId(e.target.value);
                onMoveTask(task.id, parseInt(e.target.value), 0);
              }}
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.825rem' }}
            >
              {columns.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Priority Select */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>PRIORITY</label>
            <select
              className="input"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                onUpdateTask(task.id, { priority: e.target.value });
              }}
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.825rem' }}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Due Date Input */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>DUE DATE</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                onUpdateTask(task.id, { due_date: e.target.value || null });
              }}
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.825rem' }}
            />
          </div>
        </div>

        {/* Assignees Selector */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>ASSIGNED MEMBERS</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {members.map(m => {
              const isAssigned = task.assignees && task.assignees.some(a => a.user_id === m.id);
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
                    border: isAssigned ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: isAssigned ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)',
                    color: isAssigned ? 'var(--text-primary)' : 'var(--text-muted)',
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

        {/* Description textarea */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>DESCRIPTION</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Add a detailed description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSaveBasicInfo}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Subtasks / Checklist Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, fontSize: '0.85rem' }}>
              <CheckSquare size={16} color="var(--accent-primary)" />
              <span>Checklist Subtasks</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
            {task.subtasks && task.subtasks.map(st => (
              <div 
                key={st.id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.625rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1, fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={st.completed === 1}
                    onChange={(e) => onToggleSubtask(st.id, e.target.checked)}
                  />
                  <span style={{ textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {st.title}
                  </span>
                </label>
                <button className="btn btn-ghost btn-icon" style={{ width: '24px', height: '24px', color: 'var(--text-muted)' }} onClick={() => onDeleteSubtask(st.id)}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtaskSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="input"
              placeholder="Add checklist item..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem' }}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem' }}>
              <Plus size={15} /> Add
            </button>
          </form>
        </div>

        {/* Real-time Discussion & Comments Section */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            <MessageSquare size={16} color="var(--accent-primary)" />
            <span>Activity & Comments ({comments.length})</span>
          </div>

          {/* Comment List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.25rem' }}>
            {comments.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', italic: 'true' }}>No comments yet. Be the first to start the discussion!</div>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '0.625rem', fontSize: '0.825rem' }}>
                  <div className="avatar avatar-sm" style={{ backgroundColor: c.user_avatar || 'var(--accent-primary)', flexShrink: 0 }}>
                    {c.user_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.user_name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{c.content}</div>
                  </div>
                  {user && user.id === c.user_id && (
                    <button className="btn btn-ghost btn-icon" style={{ width: '24px', height: '24px', color: 'var(--text-muted)' }} onClick={() => handleDeleteComment(c.id)}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="input"
              placeholder="Write a comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              style={{ fontSize: '0.825rem' }}
            />
            <button type="submit" className="btn btn-primary" disabled={submittingComment}>
              <Send size={15} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
