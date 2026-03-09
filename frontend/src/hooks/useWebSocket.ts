import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Ticket, Column, Agent, AgentTask, WSEventType } from 'shared';

const SOCKET_URL = window.location.origin;

interface BoardState {
  tickets: Ticket[];
  columns: Column[];
  agents: Agent[];
  tasks: AgentTask[];
}

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const connect = useCallback(() => {
    if (socket) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);

      // Request full state on connect
      newSocket.emit('REQUEST_STATE');
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('STATE_UPDATE', (state: BoardState) => {
      console.log('Received state update:', state);
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('board-state-update', { detail: state }));
    });

    newSocket.on('TICKET_UPDATED', (data: { ticketId: string; status: string }) => {
      console.log('Ticket updated:', data);
      window.dispatchEvent(new CustomEvent('ticket-updated', { detail: data }));
    });

    newSocket.on('AGENT_STATUS_CHANGED', (data: { agentId: string; status: string }) => {
      console.log('Agent status changed:', data);
      window.dispatchEvent(new CustomEvent('agent-status-changed', { detail: data }));
    });

    newSocket.on('TASK_STATUS_CHANGED', (data: { taskId: string; status: string }) => {
      console.log('Task status changed:', data);
      window.dispatchEvent(new CustomEvent('task-status-changed', { detail: data }));
    });

    newSocket.on('ERROR', (data: { message: string }) => {
      console.error('WebSocket error:', data);
    });

    setSocket(newSocket);
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    }
  }, [socket]);

  const moveTicket = useCallback(
    (ticketId: string, fromStatus: string, toStatus: string) => {
      if (socket) {
        socket.emit('TICKET_MOVED', { ticketId, fromStatus, toStatus });
      }
    },
    [socket]
  );

  return {
    connected,
    connect,
    disconnect,
    moveTicket,
  };
}
