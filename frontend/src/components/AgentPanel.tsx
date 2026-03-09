import type { Agent, AgentTask } from 'shared';

interface AgentPanelProps {
  agents: Agent[];
  tasks: AgentTask[];
}

export function AgentPanel({ agents, tasks }: AgentPanelProps) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-white mb-4">AI Agents</h2>

      {/* Agents List */}
      <div className="space-y-3 mb-6">
        {agents.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-4">
            No agents configured
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-slate-700 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{agent.name}</span>
                <StatusBadge status={agent.status} />
              </div>
              {agent.currentTicketId ? (
                <div className="text-xs text-slate-400">
                  Working on: {agent.currentTicketId.slice(0, 8)}...
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  Idle - Ready for work
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
              <TaskStatusBadge status={task.status} />
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
