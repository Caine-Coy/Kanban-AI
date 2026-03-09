import { useState, useEffect } from 'react';
import type { Ticket, TicketStatus, Column, Agent, AgentTask, Settings, Project } from 'shared';

const API_BASE = '/api';

export function useBoardStore() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = async (projectId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = projectId ? `?projectId=${projectId}` : '';
      const [ticketsRes, settingsRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/tickets${queryParams}`),
        fetch(`${API_BASE}/settings`),
        fetch(`${API_BASE}/projects`),
      ]);

      if (!ticketsRes.ok || !settingsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const ticketsData = await ticketsRes.json();
      const settingsData = await settingsRes.json();
      const projectsData = await projectsRes.json();

      setTickets(ticketsData);
      setSettings(settingsData);
      setProjects(projectsData);

      // Fetch agents and tasks
      const [agentsRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE}/agents`),
        fetch(`${API_BASE}/tasks`),
      ]);

      if (agentsRes.ok) {
        setAgents(await agentsRes.json());
      }
      if (tasksRes.ok) {
        setTasks(await tasksRes.json());
      }

      // Columns are fetched via WebSocket or we can create defaults
      setColumns([
        { id: 'backlog', title: 'Backlog', status: 'BACKLOG', order: 0 },
        { id: 'todo', title: 'TODO', status: 'TODO', order: 1 },
        { id: 'in-progress', title: 'In Progress', status: 'IN_PROGRESS', order: 2 },
        { id: 'review', title: 'Review', status: 'REVIEW', order: 3 },
        { id: 'done', title: 'Done', status: 'DONE', order: 4 },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const createTicket = async (data: { title: string; description: string; requirements?: string; projectId?: string }) => {
    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId: data.projectId || selectedProjectId }),
      });

      if (!res.ok) throw new Error('Failed to create ticket');

      const ticket = await res.json();
      setTickets((prev) => [ticket, ...prev]);
      return ticket;
    } catch (err) {
      throw err;
    }
  };

  const updateTicket = async (id: string, data: Partial<Ticket>) => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to update ticket');

      const ticket = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === id ? ticket : t)));
      return ticket;
    } catch (err) {
      throw err;
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete ticket');

      setTickets((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const moveTicket = async (ticketId: string, fromStatus: TicketStatus, toStatus: TicketStatus) => {
    try {
      // Optimistic update
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: toStatus } : t))
      );

      // Trigger agent assignment via API if moving to TODO
      if (toStatus === 'TODO') {
        await fetch(`${API_BASE}/tickets/${ticketId}/assign`, {
          method: 'POST',
        });
      }

      // Update via WebSocket will sync the state
    } catch (err) {
      // Revert on error
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: fromStatus } : t))
      );
      throw err;
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) throw new Error('Failed to update settings');

      const settings = await res.json();
      setSettings(settings);
      return settings;
    } catch (err) {
      throw err;
    }
  };

  const createProject = async (data: { name: string; description?: string; gitRemote: string }) => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to create project');

      const project = await res.json();
      setProjects((prev) => [project, ...prev]);
      return project;
    } catch (err) {
      throw err;
    }
  };

  const createAgent = async (name: string) => {
    try {
      const res = await fetch(`${API_BASE}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error('Failed to create agent');

      const agent = await res.json();
      setAgents((prev) => [...prev, agent]);
      return agent;
    } catch (err) {
      throw err;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/agents/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete agent');

      setAgents((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
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
    createTicket,
    updateTicket,
    deleteTicket,
    moveTicket,
    updateSettings,
    createProject,
    createAgent,
    deleteAgent,
  };
}
