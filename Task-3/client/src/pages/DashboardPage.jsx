import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import KanbanBoard from '../components/KanbanBoard';
import ListView from '../components/ListView';
import CalendarView from '../components/CalendarView';
import ProjectStats from '../components/ProjectStats';
import TaskModal from '../components/TaskModal';
import ProjectModal from '../components/ProjectModal';
import AddMemberModal from '../components/AddMemberModal';
import NewTaskModal from '../components/NewTaskModal';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function DashboardPage() {
  const { token } = useAuth();
  const { socket } = useSocket();

  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectData, setProjectData] = useState({
    project: null,
    members: [],
    columns: [],
    tasks: []
  });
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState('kanban'); // 'kanban', 'list', 'calendar', 'analytics'
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Modals
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState(null);

  // Load Projects List
  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  // Load Project Details when currentProjectId changes
  useEffect(() => {
    if (currentProjectId && token) {
      fetchProjectDetails(currentProjectId);
    }
  }, [currentProjectId, token]);

  // Real-time Socket listeners for active project
  useEffect(() => {
    if (!socket || !currentProjectId) return;

    socket.emit('join_project', { projectId: currentProjectId });

    const handlePresence = ({ onlineUsers: uList }) => {
      setOnlineUsers(uList);
    };

    const handleTaskCreated = (newTask) => {
      setProjectData(prev => ({
        ...prev,
        tasks: [...prev.tasks.filter(t => t.id !== newTask.id), newTask]
      }));
    };

    const handleTaskMoved = ({ taskId, toColumnId, position, task }) => {
      setProjectData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, column_id: toColumnId, position } : t))
      }));
    };

    const handleTaskUpdated = (updatedTask) => {
      setProjectData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      }));
      if (selectedTask && selectedTask.id === updatedTask.id) {
        setSelectedTask(prev => ({ ...prev, ...updatedTask }));
      }
    };

    const handleTaskDeleted = ({ taskId }) => {
      setProjectData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId)
      }));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
    };

    const handleColumnCreated = (newCol) => {
      setProjectData(prev => ({
        ...prev,
        columns: [...prev.columns, newCol]
      }));
    };

    const handleColumnDeleted = ({ columnId }) => {
      setProjectData(prev => ({
        ...prev,
        columns: prev.columns.filter(c => c.id !== columnId),
        tasks: prev.tasks.filter(t => t.column_id !== columnId)
      }));
    };

    const handleCommentAdded = (newComment) => {
      setProjectData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === newComment.task_id ? { ...t, comment_count: (t.comment_count || 0) + 1 } : t)
      }));
    };

    socket.on('presence:update', handlePresence);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('column:created', handleColumnCreated);
    socket.on('column:deleted', handleColumnDeleted);
    socket.on('comment:added', handleCommentAdded);

    return () => {
      socket.emit('leave_project', { projectId: currentProjectId });
      socket.off('presence:update', handlePresence);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('column:created', handleColumnCreated);
      socket.off('column:deleted', handleColumnDeleted);
      socket.off('comment:added', handleCommentAdded);
    };
  }, [socket, currentProjectId, selectedTask]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !currentProjectId) {
          setCurrentProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (pId) => {
    try {
      const res = await fetch(`/api/projects/${pId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjectData({
          project: data.project,
          members: data.members,
          columns: data.columns,
          tasks: data.tasks
        });
      }
    } catch (err) {
      console.error('Failed to fetch project details:', err);
    }
  };

  // Create Project
  const handleCreateProject = async (projectDataPayload) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(projectDataPayload)
      });
      if (res.ok) {
        const newProj = await res.json();
        setProjects(prev => [newProj, ...prev]);
        setCurrentProjectId(newProj.id);
        setShowNewProjectModal(false);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  // Add Member
  const handleAddMember = async (email, role) => {
    const res = await fetch(`/api/projects/${currentProjectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ email, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add member');
    setProjectData(prev => ({ ...prev, members: [...prev.members, data] }));
  };

  // Task Actions
  const handleCreateTask = async (taskPayload) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...taskPayload, project_id: currentProjectId })
      });
      if (res.ok) {
        const newTask = await res.json();
        setProjectData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
        setShowNewTaskModal(false);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleMoveTask = async (taskId, column_id, position) => {
    // Optimistic UI update
    setProjectData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, column_id, position } : t))
    }));

    try {
      await fetch(`/api/tasks/${taskId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ column_id, position, project_id: currentProjectId })
      });
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setProjectData(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, ...updated } : t))
        }));
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => ({ ...prev, ...updated }));
        }
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProjectData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
        setSelectedTask(null);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleSetAssignees = async (taskId, assigneesArray) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/assignees`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ assignees: assigneesArray })
      });
      if (res.ok) {
        const updatedAssignees = await res.json();
        setProjectData(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, assignees: updatedAssignees } : t))
        }));
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => ({ ...prev, assignees: updatedAssignees }));
        }
      }
    } catch (err) {
      console.error('Failed to update assignees:', err);
    }
  };

  // Subtask Actions
  const handleAddSubtask = async (taskId, title) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        const newSt = await res.json();
        setProjectData(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), newSt] } : t))
        }));
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), newSt] }));
        }
      }
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleToggleSubtask = async (subtaskId, completed) => {
    try {
      const res = await fetch(`/api/tasks/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ completed })
      });
      if (res.ok) {
        const updated = await res.json();
        setProjectData(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => ({
            ...t,
            subtasks: t.subtasks ? t.subtasks.map(s => (s.id === subtaskId ? updated : s)) : []
          }))
        }));
        if (selectedTask) {
          setSelectedTask(prev => ({
            ...prev,
            subtasks: prev.subtasks ? prev.subtasks.map(s => (s.id === subtaskId ? updated : s)) : []
          }));
        }
      }
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const res = await fetch(`/api/tasks/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProjectData(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => ({
            ...t,
            subtasks: t.subtasks ? t.subtasks.filter(s => s.id !== subtaskId) : []
          }))
        }));
        if (selectedTask) {
          setSelectedTask(prev => ({
            ...prev,
            subtasks: prev.subtasks ? prev.subtasks.filter(s => s.id !== subtaskId) : []
          }));
        }
      }
    } catch (err) {
      console.error('Failed to delete subtask:', err);
    }
  };

  // Column Actions
  const handleCreateColumn = async (columnTitle) => {
    try {
      const res = await fetch('/api/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ project_id: currentProjectId, title: columnTitle })
      });
      if (res.ok) {
        const newCol = await res.json();
        setProjectData(prev => ({ ...prev, columns: [...prev.columns, newCol] }));
      }
    } catch (err) {
      console.error('Failed to create column:', err);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    try {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProjectData(prev => ({
          ...prev,
          columns: prev.columns.filter(c => c.id !== columnId),
          tasks: prev.tasks.filter(t => t.column_id !== columnId)
        }));
      }
    } catch (err) {
      console.error('Failed to delete column:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header
        currentProject={projectData.project}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenNewTask={() => {
          setNewTaskColumnId(projectData.columns[0]?.id);
          setShowNewTaskModal(true);
        }}
        onOpenNewProject={() => setShowNewProjectModal(true)}
        onOpenAddMember={() => setShowAddMemberModal(true)}
        onlineUsers={onlineUsers}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          projects={projects}
          currentProjectId={currentProjectId}
          onSelectProject={(id) => setCurrentProjectId(id)}
          onOpenNewProject={() => setShowNewProjectModal(true)}
        />

        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-primary)' }}>
          {projectData.project ? (
            <>
              {activeView === 'kanban' && (
                <KanbanBoard
                  columns={projectData.columns}
                  tasks={projectData.tasks}
                  members={projectData.members}
                  onMoveTask={handleMoveTask}
                  onOpenTaskModal={(task) => setSelectedTask(task)}
                  onOpenCreateTask={(colId) => {
                    setNewTaskColumnId(colId);
                    setShowNewTaskModal(true);
                  }}
                  onCreateColumn={handleCreateColumn}
                  onDeleteColumn={handleDeleteColumn}
                />
              )}

              {activeView === 'list' && (
                <ListView
                  tasks={projectData.tasks}
                  columns={projectData.columns}
                  onOpenTaskModal={(task) => setSelectedTask(task)}
                  onMoveTask={handleMoveTask}
                />
              )}

              {activeView === 'calendar' && (
                <CalendarView
                  tasks={projectData.tasks}
                  onOpenTaskModal={(task) => setSelectedTask(task)}
                />
              )}

              {activeView === 'analytics' && (
                <ProjectStats
                  project={projectData.project}
                  tasks={projectData.tasks}
                  columns={projectData.columns}
                  members={projectData.members}
                />
              )}
            </>
          ) : (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a project from the sidebar or create a new project.
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          columns={projectData.columns}
          members={projectData.members}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onMoveTask={handleMoveTask}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggleSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          onSetAssignees={handleSetAssignees}
        />
      )}

      {showNewProjectModal && (
        <ProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onCreateProject={handleCreateProject}
        />
      )}

      {showAddMemberModal && (
        <AddMemberModal
          onClose={() => setShowAddMemberModal(false)}
          onAddMember={handleAddMember}
        />
      )}

      {showNewTaskModal && (
        <NewTaskModal
          columns={projectData.columns}
          members={projectData.members}
          defaultColumnId={newTaskColumnId}
          onClose={() => setShowNewTaskModal(false)}
          onCreateTask={handleCreateTask}
        />
      )}
    </div>
  );
}
