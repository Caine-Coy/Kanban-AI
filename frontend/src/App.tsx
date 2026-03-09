import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Board } from './components/Board';
import { SettingsModal } from './components/SettingsModal';
import { TicketModal } from './components/TicketModal';
import { AgentPanel } from './components/AgentPanel';
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
    isLoading,
    error,
    fetchBoard,
    moveTicket,
    updateSettings,
  } = useBoardStore();

  const { connected, connect, disconnect } = useWebSocket();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchBoard();
    
    // Connect to WebSocket
    connect();

    return () => {
      disconnect();
    };
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const ticketId = active.id as string;
    const toStatus = over.id as TicketStatus;

    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === toStatus) return;

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

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">Kanban-AI</h1>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  connected
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-3">
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
            <AgentPanel agents={agents} tasks={tasks} />
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
        />
      </div>
    </DndContext>
  );
}

export default App;
