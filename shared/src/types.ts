/**
 * Shared types for Kanban-AI
 */

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  assignee?: string;
  branch?: string;
  createdAt: Date;
  updatedAt: Date;
  requirements?: string;
  tests?: TestConfig;
}

export type TicketStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface TestConfig {
  command: string;
  timeout?: number;
}

export interface Column {
  id: string;
  title: string;
  status: TicketStatus;
  order: number;
}

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  currentTicketId?: string;
  lastActive: Date;
}

export type AgentStatus = 'IDLE' | 'WORKING' | 'ERROR';

export interface AgentTask {
  id: string;
  ticketId: string;
  agentId?: string;
  status: TaskStatus;
  branch: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  logs: string[];
}

export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface Settings {
  lmStudioUrl: string;
  lmStudioModel: string;
  gitRemote: string;
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
  testCommand: string;
  testTimeout: number;
  openRouterUrl?: string;
  openRouterKey?: string;
  openRouterModel?: string;
  useOpenRouter?: boolean;
}

export interface BoardState {
  tickets: Ticket[];
  columns: Column[];
  agents: Agent[];
  tasks: AgentTask[];
}

// API Request/Response types
export interface CreateTicketRequest {
  title: string;
  description: string;
  requirements?: string;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: TicketStatus;
  requirements?: string;
}

export interface MoveTicketRequest {
  ticketId: string;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
}

export interface CreateAgentRequest {
  name: string;
}

export interface UpdateSettingsRequest {
  lmStudioUrl?: string;
  lmStudioModel?: string;
  gitRemote?: string;
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
  testCommand?: string;
  testTimeout?: number;
  openRouterUrl?: string;
  openRouterKey?: string;
  openRouterModel?: string;
  useOpenRouter?: boolean;
}

// WebSocket events
export interface WSEvent {
  type: WSEventType;
  payload: unknown;
  timestamp: Date;
}

export type WSEventType =
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'TICKET_MOVED'
  | 'TICKET_DELETED'
  | 'AGENT_STATUS_CHANGED'
  | 'TASK_STATUS_CHANGED'
  | 'SETTINGS_UPDATED';
