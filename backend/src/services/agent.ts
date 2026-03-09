import { Server as SocketIOServer } from 'socket.io';
import type { AgentTask, TaskStatus, AgentStatus } from 'shared';
import { createTask, getTaskByTicketId, updateTask, getActiveTasks } from '../database/tasks.js';
import { getTicketById, updateTicket } from '../database/tickets.js';
import { getIdleAgents, updateAgent } from '../database/agents.js';
import { getSettings } from '../database/settings.js';
import { getProjectById } from '../database/projects.js';
import { GitService } from './git.js';
import { LMStudioService } from './lmstudio.js';

export class AgentService {
  private static io: SocketIOServer;
  private static isInitialized = false;

  static initialize(io: SocketIOServer): void {
    this.io = io;
    this.isInitialized = true;
    console.log('🤖 Agent service initialized');
  }

  /**
   * Assign a ticket to an available agent when moved to TODO
   */
  static async assignTicketToAgent(ticketId: string): Promise<AgentTask | null> {
    if (!this.isInitialized) {
      throw new Error('AgentService not initialized');
    }

    const ticket = getTicketById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    // Check if there's already an active task for this ticket
    const existingTask = getTaskByTicketId(ticketId);
    if (existingTask && existingTask.status !== 'FAILED' && existingTask.status !== 'COMPLETED') {
      console.log(`Task already exists for ticket ${ticketId}`);
      return null;
    }

    // Find an idle agent
    const idleAgents = getIdleAgents();
    if (idleAgents.length === 0) {
      console.log('No idle agents available');
      return null;
    }

    const agent = idleAgents[0];

    // Create a branch for this ticket
    const branchName = `ticket/${ticketId}-${this.slugify(ticket.title)}`;

    try {
      // Get project folder path if ticket has a project
      let gitService: GitService;
      if (ticket.projectId) {
        const project = getProjectById(ticket.projectId);
        if (project?.folderPath) {
          gitService = new GitService(project.folderPath);
          console.log(`📂 Using project git repo: ${project.folderPath}`);
        } else {
          gitService = new GitService();
          console.log('📂 Project has no folder, using default repo');
        }
      } else {
        gitService = new GitService();
        console.log('📂 No project, using default repo');
      }
      
      // Create branch
      await gitService.createBranch(branchName);

      // Create the task
      const task = createTask({
        ticketId,
        branch: branchName,
        agentId: agent.id,
      });

      // Update ticket with branch info
      updateTicket(ticketId, { branch: branchName });

      // Update agent status
      updateAgent(agent.id, {
        status: 'WORKING',
        currentTicketId: ticketId,
      });

      // Notify clients
      this.io.emit('TASK_STATUS_CHANGED', {
        task,
        timestamp: new Date().toISOString(),
      });

      this.io.emit('AGENT_STATUS_CHANGED', {
        agentId: agent.id,
        status: 'WORKING',
        ticketId,
        timestamp: new Date().toISOString(),
      });

      // Start the agent work (async, don't await)
      this.executeAgentTask(task, agent.id).catch((err) => {
        console.error(`Agent task failed:`, err);
      });

      console.log(`📋 Assigned ticket ${ticketId} to agent ${agent.name} on branch ${branchName}`);
      return task;
    } catch (error) {
      console.error(`Failed to assign ticket:`, error);
      throw error;
    }
  }

  /**
   * Execute the agent's work on a ticket
   */
  private static async executeAgentTask(task: AgentTask, agentId: string): Promise<void> {
    const settings = getSettings();
    
    // Log full configuration for debugging
    console.log('🤖 === Agent Task Started ===');
    console.log(`🤖 Agent using: ${settings.useOpenRouter ? 'OpenRouter' : 'LM Studio'}`);
    console.log(`📡 OpenRouter configured: ${!!settings.openRouterKey}`);
    console.log(`🔑 API Key present: ${settings.openRouterKey ? 'Yes (' + settings.openRouterKey.substring(0, 10) + '...)' : 'No'}`);
    console.log(`🌐 OpenRouter URL: ${settings.openRouterUrl}`);
    console.log(`📦 Model: ${settings.openRouterModel}`);
    console.log('🤖 =========================');
    
    // Check if OpenRouter is selected but no API key
    if (settings.useOpenRouter && !settings.openRouterKey) {
      throw new Error('OpenRouter is selected but no API key is configured. Please add your OpenRouter API key in Settings.');
    }
    
    const lmStudio = new LMStudioService(
      settings.lmStudioUrl,
      settings.lmStudioModel,
      settings.openRouterUrl,
      settings.openRouterKey,
      settings.openRouterModel,
      settings.useOpenRouter
    );
    const gitService = new GitService();

    // Update task status to RUNNING
    updateTask(task.id, {
      status: 'RUNNING',
      startedAt: new Date(),
      logs: ['Task started'],
    });

    this.io.emit('TASK_STATUS_CHANGED', {
      taskId: task.id,
      status: 'RUNNING',
      timestamp: new Date().toISOString(),
    });

    try {
      const ticket = getTicketById(task.ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Add log
      const logs = [`Working on branch: ${task.branch}`];
      updateTask(task.id, { logs });

      // Build context for the agent
      const context = await this.buildAgentContext(ticket, gitService);

      // Send to LM Studio
      logs.push('Sending request to LM Studio...');
      updateTask(task.id, { logs });

      const result = await lmStudio.generateCode(ticket, context);

      logs.push('Received response from LM Studio');
      updateTask(task.id, { logs });

      // Apply the code changes
      if (result.changes && result.changes.length > 0) {
        logs.push('Applying code changes...');
        updateTask(task.id, { logs });

        for (const change of result.changes) {
          await gitService.writeFile(change.path, change.content);
          logs.push(`Modified: ${change.path}`);
          updateTask(task.id, { logs });
        }

        // Commit changes
        const commitMessage = result.commitMessage || `Implement: ${ticket.title}`;
        await gitService.commitChanges(commitMessage);
        logs.push('Changes committed');
        updateTask(task.id, { logs });
      }

      // Run tests
      logs.push('Running tests...');
      updateTask(task.id, { logs });

      const testResult = await gitService.runTests(settings.testCommand, settings.testTimeout);
      
      if (!testResult.passed) {
        throw new Error(`Tests failed: ${testResult.output}`);
      }

      logs.push('✅ All tests passed');
      updateTask(task.id, { logs });

      // Push branch
      logs.push('Pushing branch to remote...');
      updateTask(task.id, { logs });

      await gitService.pushBranch(task.branch);
      logs.push('Branch pushed');
      updateTask(task.id, { logs });

      // Create PR if GitHub settings are configured
      if (settings.githubToken && settings.githubOwner && settings.githubRepo) {
        logs.push('Creating pull request...');
        updateTask(task.id, { logs });

        const prUrl = await gitService.createPullRequest(
          task.branch,
          'main',
          ticket.title,
          ticket.description
        );

        logs.push(`PR created: ${prUrl}`);
        updateTask(task.id, { logs });
      }

      // Mark task as completed
      updateTask(task.id, {
        status: 'COMPLETED',
        completedAt: new Date(),
        logs,
      });

      // Update ticket status
      updateTicket(task.ticketId, { status: 'REVIEW' });

      // Release agent
      updateAgent(agentId, {
        status: 'IDLE',
        currentTicketId: undefined,
      });

      // Notify clients
      this.io.emit('TASK_STATUS_CHANGED', {
        taskId: task.id,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
      });

      this.io.emit('AGENT_STATUS_CHANGED', {
        agentId,
        status: 'IDLE',
        timestamp: new Date().toISOString(),
      });

      this.io.emit('TICKET_UPDATED', {
        ticketId: task.ticketId,
        status: 'REVIEW',
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ Agent task completed for ticket ${task.ticketId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Agent task failed:`, errorMessage);

      // Update task with error
      const logs = [`❌ Error: ${errorMessage}`];
      updateTask(task.id, {
        status: 'FAILED',
        error: errorMessage,
        completedAt: new Date(),
        logs,
      });

      // Release agent
      updateAgent(agentId, {
        status: 'IDLE',
        currentTicketId: undefined,
      });

      // Notify clients
      this.io.emit('TASK_STATUS_CHANGED', {
        taskId: task.id,
        status: 'FAILED',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      this.io.emit('AGENT_STATUS_CHANGED', {
        agentId,
        status: 'IDLE',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Build context for the agent including ticket details and repo structure
   */
  private static async buildAgentContext(
    ticket: any,
    gitService: GitService
  ): Promise<string> {
    const context: string[] = [];

    // Ticket information
    context.push(`## Ticket: ${ticket.title}`);
    context.push(`\n**Description:**\n${ticket.description}`);
    
    if (ticket.requirements) {
      context.push(`\n**Requirements:**\n${ticket.requirements}`);
    }

    // Repo structure
    const files = await gitService.getRepoStructure();
    context.push(`\n## Repository Structure:\n${files}`);

    return context.join('\n');
  }

  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
