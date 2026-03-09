import { useState } from 'react';
import type { Agent, AgentTask } from 'shared';

interface AgentPanelProps {
  agents: Agent[];
  tasks: AgentTask[];
  onCreateAgent: (name: string) => Promise<void>;
  onDeleteAgent: (id: string) => Promise<void>;
  onRetryTask?: (taskId: string) => Promise<void>;
}

export function AgentPanel({ agents, tasks, onCreateAgent, onDeleteAgent, onRetryTask }: AgentPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    try {
      await onCreateAgent(newAgentName.trim());
      setNewAgentName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert('Failed to create agent. Make sure you have an OpenRouter API key configured in Settings.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete agent "${name}"?`)) return;
    
    try {
      await onDeleteAgent(id);
    } catch (error) {
      console.error('Failed to delete agent:', error);
      alert('Failed to delete agent');
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">AI Agents</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            + Add Agent
          </button>
        )}
      </div>

      {/* Create Agent Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="mb-4 p-3 bg-slate-700 rounded-lg space-y-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Agent Name
            </label>
            <input
              type="text"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="OpenRouter-Agent-1"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewAgentName('');
              }}
              className="flex-1 px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-slate-500">
            💡 Agents use OpenRouter free models when configured
          </p>
        </form>
      )}

      {/* Agents List */}
      <div className="space-y-3 mb-6">
        {agents.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-4">
            <p>No agents configured</p>
            <p className="text-xs mt-1">Click "Add Agent" to create one</p>
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-slate-700 rounded-lg p-3 group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{agent.name}</span>
                  <StatusBadge status={agent.status} />
                </div>
                <button
                  onClick={() => handleDelete(agent.id, agent.name)}
                  className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs bg-red-600/50 hover:bg-red-600 text-white rounded transition-all"
                  title="Delete agent"
                >
                  ✕
                </button>
              </div>
              {agent.currentTicketId ? (
                <div className="text-xs text-slate-400">
                  🎫 Working on: {agent.currentTicketId.slice(0, 8)}...
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  {agent.status === 'IDLE' ? '✅ Idle - Ready for work' : '⏸️ Busy'}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Active Tasks */}
      <h3 className="text-sm font-semibold text-slate-400 mb-3">Recent Tasks</h3>
      <div className="space-y-2">
        {tasks.slice(0, 5).map((task) => (
          <div
            key={task.id}
            className="bg-slate-700/50 rounded-lg p-3 text-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-300">
                {task.branch.split('/').pop()?.slice(0, 20)}...
              </span>
              <div className="flex items-center gap-2">
                <TaskStatusBadge status={task.status} />
                {task.status === 'FAILED' && onRetryTask && (
                  <button
                    onClick={() => onRetryTask(task.id)}
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    title="Retry failed task"
                  >
                    🔄 Retry
                  </button>
                )}
              </div>
            </div>
            {task.error && (
              <div className="text-xs text-red-400 mt-1">
                ⚠️ {task.error.slice(0, 50)}...
              </div>
            )}
            {task.logs.length > 0 && (
              <div className="text-xs text-slate-500 mt-1">
                Last: {task.logs[task.logs.length - 1].slice(0, 40)}...
              </div>
            )}
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-sm text-slate-500 text-center py-4">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    IDLE: 'bg-green-500/20 text-green-400',
    WORKING: 'bg-yellow-500/20 text-yellow-400',
    ERROR: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded ${colors[status as keyof typeof colors] || 'bg-slate-600'}`}>
      {status}
    </span>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const colors = {
    PENDING: 'bg-slate-500/20 text-slate-400',
    RUNNING: 'bg-yellow-500/20 text-yellow-400',
    COMPLETED: 'bg-green-500/20 text-green-400',
    FAILED: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded ${colors[status as keyof typeof colors] || 'bg-slate-600'}`}>
      {status}
    </span>
  );
}
