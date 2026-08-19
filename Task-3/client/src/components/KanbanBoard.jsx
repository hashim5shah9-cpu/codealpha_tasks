import React, { useState } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Clock, 
  MessageSquare, 
  CheckSquare, 
  Search, 
  Filter, 
  AlertCircle,
  GripVertical,
  Trash2
} from 'lucide-react';

export default function KanbanBoard({ 
  columns = [], 
  tasks = [], 
  members = [], 
  onMoveTask, 
  onOpenTaskModal, 
  onOpenCreateTask,
  onCreateColumn,
  onDeleteColumn 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'ALL' || (t.assignees && t.assignees.some(a => a.user_id === parseInt(assigneeFilter)));
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId.toString());
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    setDraggedTaskId(null);
    setDragOverColumnId(null);
    e.currentTarget.classList.remove('dragging');
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumnId(columnId);
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = parseInt(taskIdStr || draggedTaskId);
    if (taskId && targetColumnId) {
      // Calculate target position
      const columnTasks = filteredTasks.filter(t => t.column_id === targetColumnId);
      const newPos = columnTasks.length;
      onMoveTask(taskId, targetColumnId, newPos);
    }
  };

  const handleAddColumnSubmit = (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    onCreateColumn(newColumnTitle.trim());
    setNewColumnTitle('');
    setShowAddColumn(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      {/* Search & Filter Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className="input"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '0.25rem 0.5rem' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Filter size={14} />
            <span>Priority:</span>
            <select 
              className="input" 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Assignee:</span>
            <select 
              className="input" 
              value={assigneeFilter} 
              onChange={(e) => setAssigneeFilter(e.target.value)}
              style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
            >
              <option value="ALL">All Assignees</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div style={{
        display: 'flex',
        gap: '1.25rem',
        overflowX: 'auto',
        flex: 1,
        paddingBottom: '1rem',
        alignItems: 'flex-start'
      }}>
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.column_id === col.id);
          const isDropTarget = dragOverColumnId === col.id;

          return (
            <div
              key={col.id}
              className={`kanban-column ${isDropTarget ? 'drop-target' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                width: '300px',
                minWidth: '300px',
                maxHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-secondary)',
                border: isDropTarget ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Column Header */}
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: col.color || 'var(--accent-primary)'
                  }}></span>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{col.title}</h3>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.5rem',
                    borderRadius: '999px',
                    background: 'var(--bg-input)',
                    color: 'var(--text-muted)'
                  }}>
                    {colTasks.length}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <button 
                    className="btn btn-ghost btn-icon" 
                    style={{ width: '28px', height: '28px' }}
                    onClick={() => onOpenCreateTask(col.id)}
                    title="Add task to column"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
                    onClick={() => onDeleteColumn(col.id)}
                    title="Delete column"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Task Cards Column Body */}
              <div style={{
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                overflowY: 'auto',
                minHeight: '150px'
              }}>
                {colTasks.map(t => {
                  const completedSubtasks = t.subtasks ? t.subtasks.filter(s => s.completed).length : 0;
                  const totalSubtasks = t.subtasks ? t.subtasks.length : 0;

                  return (
                    <div
                      key={t.id}
                      className="glass-card kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onOpenTaskModal(t)}
                      style={{
                        padding: '1rem',
                        cursor: 'grab',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.625rem'
                      }}
                    >
                      {/* Priority Badge & Due Date */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className={`badge badge-${t.priority.toLowerCase()}`}>
                          {t.priority}
                        </span>

                        {t.due_date && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.725rem',
                            color: new Date(t.due_date) < new Date() ? 'var(--accent-danger)' : 'var(--text-muted)'
                          }}>
                            <Clock size={12} />
                            <span>{new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {t.title}
                      </div>

                      {/* Subtask Progress Bar */}
                      {totalSubtasks > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckSquare size={12} />
                              <span>{completedSubtasks}/{totalSubtasks} Checklist</span>
                            </div>
                            <span>{Math.round((completedSubtasks / totalSubtasks) * 100)}%</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                              height: '100%',
                              background: 'var(--accent-success)',
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                        </div>
                      )}

                      {/* Footer: Comments count & Assignee avatars */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '0.25rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t.comment_count > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MessageSquare size={13} />
                              <span>{t.comment_count}</span>
                            </div>
                          )}
                        </div>

                        {/* Assignee Stack */}
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Add New Column Form Button */}
        <div style={{ width: '280px', minWidth: '280px' }}>
          {showAddColumn ? (
            <form onSubmit={handleAddColumnSubmit} className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
              <input
                type="text"
                className="input"
                placeholder="Column title..."
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                autoFocus
                style={{ marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.35rem' }}>Add Column</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddColumn(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.875rem',
                justifyContent: 'center',
                borderStyle: 'dashed'
              }}
              onClick={() => setShowAddColumn(true)}
            >
              <Plus size={16} /> Add Column
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
