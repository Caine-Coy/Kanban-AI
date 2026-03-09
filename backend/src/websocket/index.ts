import { Server as SocketIOServer } from 'socket.io';
import type { WSEventType } from 'shared';

export function setupWebSocket(io: SocketIOServer): void {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });

    // Client can request full board state on connect
    socket.on('REQUEST_STATE', async () => {
      try {
        const { getAllTickets } = await import('../database/tickets.js');
        const { getAllAgents } = await import('../database/agents.js');
        const { getAllTasks } = await import('../database/tasks.js');
        const { getDatabase } = await import('../database/index.js');

        const db = getDatabase();
        const columns = db.prepare('SELECT * FROM columns ORDER BY "order"').all();
        const tickets = getAllTickets();
        const agents = getAllAgents();
        const tasks = getAllTasks();

        socket.emit('STATE_UPDATE', {
          tickets,
          columns,
          agents,
          tasks,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to get state:', error);
        socket.emit('ERROR', { message: 'Failed to fetch state' });
      }
    });

    // Handle ticket movement (drag and drop)
    socket.on('TICKET_MOVED', async (data: { ticketId: string; fromStatus: string; toStatus: string }) => {
      try {
        const { updateTicket, getTicketById } = await import('../database/tickets.js');
        
        const ticket = getTicketById(data.ticketId);
        if (!ticket) {
          socket.emit('ERROR', { message: 'Ticket not found' });
          return;
        }

        // Update ticket status
        const updated = updateTicket(data.ticketId, { status: data.toStatus as any });
        
        if (updated) {
          // Broadcast the update
          io.emit('TICKET_UPDATED', {
            ticketId: data.ticketId,
            status: data.toStatus,
            timestamp: new Date().toISOString(),
          });

          // If moved to TODO, trigger agent assignment
          if (data.toStatus === 'TODO') {
            const { AgentService } = await import('../services/agent.js');
            AgentService.assignTicketToAgent(data.ticketId).catch((err) => {
              console.error('Failed to assign agent:', err);
            });
          }
        }
      } catch (error) {
        console.error('Failed to move ticket:', error);
        socket.emit('ERROR', { message: 'Failed to move ticket' });
      }
    });
  });

  console.log('📡 WebSocket handlers configured');
}
