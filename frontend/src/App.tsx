import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Board } from './components/Board';
import { SettingsModal } from './components/SettingsModal';
import { TicketModal } from './components/TicketModal';
import { AgentPanel } from './components/AgentPanel';
import { ProjectModal } from './components/ProjectModal';
import { useBoardStore } from './hooks/useBoardStore';
import { useWebSocket } from './hooks/useWebSocket';
import type { Ticket, TicketStatus, Column, Agent, AgentTask } from 'shared';

function App() {
  const {
    tickets,
    columns,
    agents,
    tasks,
    settings,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    isLoading,
    error,
    fetchBoard,
    moveTicket,
    updateSettings,
    createProject,
    createAgent,
    deleteAgent,
  } = useBoardStore();

  const { connected, connect, disconnect } = useWebSocket();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [aiProviderStatus, setAiProviderStatus] = useState<{ connected: boolean; service: string } | null>(null);
  const [showProjectRequired, setShowProjectRequired] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchBoard(selectedProjectId);
    
    // Connect to WebSocket
    connect();
    
    // Test AI provider connection
    testAiProvider();

    return () => {
      disconnect();
    };
  }, [selectedProjectId]);

  useEffect(() => {
    // Check if user needs to create a project
    if (!isLoading && projects.length === 0) {
      setShowProjectRequired(true);
      setIsProjectModalOpen(true);
    } else {
      setShowProjectRequired(false);
    }
  }, [projects, isLoading]);

  const testAiProvider = async () => {
    try {
      const res = await fetch('/api/settings/test-lmstudio');
      const data = await res.json();
      setAiProviderStatus(data);
    } catch (error) {
      setAiProviderStatus({ connected: false, service: 'Unknown' });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      // Dropped outside any column - revert
      console.log('Dropped outside column, reverting');
      return;
    }

    const ticketId = active.id as string;
    const toStatus = over.id as TicketStatus;

    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === toStatus) {
      // Already in this column or ticket not found
      return;
    }

    // Validate status transition
    const validStatuses: TicketStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    if (!validStatuses.includes(toStatus)) {
      console.log('Invalid drop target, reverting');
      return;
    }

    moveTicket(ticketId, ticket.status, toStatus);
  };

  const handleCreateTicket = () => {
    setSelectedTicket(null);
    setIsTicketModalOpen(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId === 'all' ? undefined : projectId);
  };

  const handleRetryTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/retry`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to retry task');
      }
      
      // Refresh board to show updated task/ticket status
      fetchBoard(selectedProjectId);
    } catch (error) {
      console.error('Failed to retry task:', error);
      alert('Failed to retry task: ' + (error as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  // Show project required overlay if no projects exist
  if (showProjectRequired) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Welcome to Kanban-AI! 🎉</h1>
            <p className="text-slate-400 mb-6">
              To get started, you need to create your first project. Each project has its own git repository where AI agents will work on tickets.
            </p>
            <button
              onClick={() => {
                console.log('Create project button clicked');
                setIsProjectModalOpen(true);
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              + Create Your First Project
            </button>
          </div>
        </div>
        
        {/* Project Modal */}
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onCreateProject={createProject}
          isFirstProject={true}
        />
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Kanban-AI</h1>
              {/* WebSocket Status */}
              <span
                className={`px-2 py-1 text-xs rounded ${
                  connected
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
                title="WebSocket Connection"
              >
                {connected ? '📡 Connected' : '❌ Disconnected'}
              </span>
              {/* AI Provider Status */}
              {aiProviderStatus && (
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    aiProviderStatus.connected
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                  title={`${aiProviderStatus.service} Connection`}
                >
                  {aiProviderStatus.connected
                    ? `✅ ${aiProviderStatus.service}`
                    : `❌ ${aiProviderStatus.service}`}
                </span>
              )}
              {/* Project Selector */}
              <select
                value={selectedProjectId || 'all'}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
              >
                + New Project
              </button>
              <button
                onClick={handleCreateTicket}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                + New Ticket
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Kanban Board */}
          <main className="flex-1 overflow-x-auto p-6">
            <Board
              columns={columns}
              tickets={tickets}
              onEditTicket={handleEditTicket}
            />
          </main>

          {/* Agent Panel */}
          <aside className="w-80 bg-slate-800 border-l border-slate-700 overflow-y-auto">
            <AgentPanel
              agents={agents}
              tasks={tasks}
              onCreateAgent={createAgent}
              onDeleteAgent={deleteAgent}
              onRetryTask={handleRetryTask}
            />
          </aside>
        </div>

        {/* Modals */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
        />

        <TicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          ticket={selectedTicket}
          onSuccess={fetchBoard}
          projectId={selectedProjectId}
        />

        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onCreateProject={createProject}
          isFirstProject={projects.length === 0}
        />
      </div>
    </DndContext>
  );
}

export default App;
