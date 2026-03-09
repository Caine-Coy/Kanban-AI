import { Router } from 'express';
import {
  getAllTasks,
  getTaskById,
  getTaskByTicketId,
  updateTask,
} from '../database/tasks.js';

export const tasksRouter = Router();

/**
 * GET /api/tasks
 * Get all tasks
 */
tasksRouter.get('/', (_req, res) => {
  try {
    const tasks = getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/tasks/:id
 * Get a specific task
 */
tasksRouter.get('/:id', (req, res) => {
  try {
    const task = getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * GET /api/tasks/ticket/:ticketId
 * Get task by ticket ID
 */
tasksRouter.get('/ticket/:ticketId', (req, res) => {
  try {
    const task = getTaskByTicketId(req.params.ticketId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * PUT /api/tasks/:id
 * Update a task (mainly for manual intervention)
 */
tasksRouter.put('/:id', (req, res) => {
  try {
    const { status, error, logs } = req.body;
    const task = updateTask(req.params.id, { status, error, logs });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});
