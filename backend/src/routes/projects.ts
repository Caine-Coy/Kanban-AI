import { Router } from 'express';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../database/projects.js';

export const projectsRouter = Router();

/**
 * GET /api/projects
 * Get all projects
 */
projectsRouter.get('/', (_req, res) => {
  try {
    const projects = getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project
 */
projectsRouter.get('/:id', (req, res) => {
  try {
    const project = getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
projectsRouter.post('/', (req, res) => {
  try {
    const { name, description, gitRemote, githubOwner, githubRepo } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const project = createProject({ 
      name, 
      description, 
      gitRemote: gitRemote || 'origin',
      githubOwner,
      githubRepo 
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * PUT /api/projects/:id
 * Update a project
 */
projectsRouter.put('/:id', (req, res) => {
  try {
    const { name, description, gitRemote, githubOwner, githubRepo } = req.body;
    const project = updateProject(req.params.id, { 
      name, 
      description, 
      gitRemote,
      githubOwner,
      githubRepo 
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
projectsRouter.delete('/:id', (req, res) => {
  try {
    const deleted = deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});
