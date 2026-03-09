import { BoardColumn } from './BoardColumn';
import type { Ticket, Column } from 'shared';

interface BoardProps {
  columns: Column[];
  tickets: Ticket[];
  onEditTicket: (ticket: Ticket) => void;
}

export function Board({ columns, tickets, onEditTicket }: BoardProps) {
  return (
    <div className="flex gap-6 h-full">
      {columns.map((column) => (
        <BoardColumn
          key={column.id}
          column={column}
          tickets={tickets.filter((t) => t.status === column.status)}
          onEditTicket={onEditTicket}
        />
      ))}
    </div>
  );
}
