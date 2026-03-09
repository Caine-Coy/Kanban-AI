import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import simpleGit from 'simple-git';
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
 * Create a new project with its own git repository
 */
projectsRouter.post('/', async (req, res) => {
  try {
    const { name, description, gitRemote, githubOwner, githubRepo } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Create folder path: Projects/{project-name}/
    const slugifiedName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const projectsDir = path.join(process.cwd(), 'Projects');
    const projectFolder = path.join(projectsDir, slugifiedName);

    // Create Projects directory if it doesn't exist
    await fs.mkdir(projectsDir, { recursive: true });

    // Create project folder
    await fs.mkdir(projectFolder, { recursive: true });
    console.log(`📁 Created project folder: ${projectFolder}`);

    // Initialize git repository
    const git = simpleGit(projectFolder);
    
    // Check if already a git repo
    try {
      await git.revparse(['--git-dir']);
      console.log(`📂 Project folder is already a git repository`);
    } catch {
      // Not a git repo, initialize
      await git.init();
      console.log(`🔧 Initialized git repository in ${projectFolder}`);
      
      // Set default branch to main
      try {
        await git.branch(['-m', 'main']);
      } catch {
        // Branch might already be named main
      }
      
      // Create initial commit
      await fs.writeFile(path.join(projectFolder, 'README.md'), `# ${name}\n\n${description || 'Project created with Kanban-AI'}\n`);
      await git.add('.');
      await git.commit('Initial commit - Project created by Kanban-AI');
      console.log(`✅ Created initial commit`);
    }

    // Add remote if github configured
    if (githubOwner && githubRepo) {
      const remoteUrl = `https://github.com/${githubOwner}/${githubRepo}.git`;
      try {
        await git.addRemote('origin', remoteUrl);
        console.log(`🔗 Added remote origin: ${remoteUrl}`);
      } catch (error) {
        console.warn(`⚠️ Remote already exists or could not be added: ${error}`);
      }
    }

    // Create project in database
    const project = createProject({ 
      name, 
      description, 
      folderPath: projectFolder,
      gitRemote: gitRemote || 'origin',
      githubOwner,
      githubRepo 
    });
    
    console.log(`🎉 Project created: ${name} (${project.id})`);
    res.status(201).json(project);
  } catch (error) {
    console.error('Failed to create project:', error);
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
