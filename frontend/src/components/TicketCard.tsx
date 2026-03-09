import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Ticket } from 'shared';

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-slate-800 rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition-colors shadow-lg"
    >
      <h3 className="font-medium text-white mb-2">{ticket.title}</h3>
      <p className="text-sm text-slate-400 line-clamp-2 mb-3">
        {ticket.description}
      </p>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {ticket.branch && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
              🌿 {ticket.branch.split('/').pop()}
            </span>
          )}
        </div>
        {ticket.assignee && (
          <span className="text-slate-500">🤖 {ticket.assignee}</span>
        )}
      </div>

      {/* Task Status Indicator */}
      {ticket.status === 'TODO' && (
        <div className="mt-2 text-xs text-blue-400">
          ⏳ Waiting for agent...
        </div>
      )}
      {ticket.status === 'IN_PROGRESS' && (
        <div className="mt-2 text-xs text-yellow-400">
          🔧 Agent working...
        </div>
      )}
      {ticket.status === 'REVIEW' && (
        <div className="mt-2 text-xs text-green-400">
          ✅ Ready for review
        </div>
      )}
    </div>
  );
}
