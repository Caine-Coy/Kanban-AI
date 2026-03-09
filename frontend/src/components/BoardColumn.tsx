import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TicketCard } from './TicketCard';
import type { Ticket, Column, TicketStatus } from 'shared';

interface BoardColumnProps {
  column: Column;
  tickets: Ticket[];
  onEditTicket: (ticket: Ticket) => void;
}

const statusColors: Record<TicketStatus, string> = {
  BACKLOG: 'border-slate-600',
  TODO: 'border-blue-600',
  IN_PROGRESS: 'border-yellow-600',
  REVIEW: 'border-purple-600',
  DONE: 'border-green-600',
};

const columnColors: Record<TicketStatus, string> = {
  BACKLOG: 'bg-slate-800/50',
  TODO: 'bg-blue-900/20',
  IN_PROGRESS: 'bg-yellow-900/20',
  REVIEW: 'bg-purple-900/20',
  DONE: 'bg-green-900/20',
};

export function BoardColumn({ column, tickets, onEditTicket }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
  });

  return (
    <div
      className={`flex flex-col w-80 rounded-lg ${columnColors[column.status]} border-t-4 ${statusColors[column.status]} ${
        isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="font-semibold text-white">{column.title}</h2>
        <span className="px-2 py-1 text-xs bg-slate-700 rounded-full">
          {tickets.length}
        </span>
      </div>

      {/* Tickets - Fixed height container with proper overflow handling */}
      <div 
        ref={setNodeRef} 
        className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[300px] max-h-[calc(100vh-200px)]"
        style={{ touchAction: 'none' }}
      >
        <SortableContext
          items={tickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tickets.map((ticket) => (
            <div key={ticket.id} className="touch-none">
              <TicketCard ticket={ticket} onClick={() => onEditTicket(ticket)} />
            </div>
          ))}
        </SortableContext>

        {tickets.length === 0 && (
          <div className="text-center text-slate-500 py-8 text-sm">
            No tickets
          </div>
        )}
      </div>
    </div>
  );
}
