import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Extended test fixture with Kanban-AI specific helpers
 */
export const test = base.extend<{
  createProject: (name: string, description?: string) => Promise<{ id: string; name: string; folderPath: string }>;
  selectProject: (projectId: string) => Promise<void>;
  createTicket: (title: string, description: string, requirements?: string) => Promise<void>;
  dragTicketToColumn: (ticketTitle: string, columnTitle: string) => Promise<void>;
  waitForTicketInColumn: (ticketTitle: string, columnTitle: string) => Promise<void>;
  waitForFilesInProject: (projectFolderPath: string, fileNames: string[], timeoutMs?: number) => Promise<void>;
}>({
  page: async ({ page }, use) => {
    // Before each test
    await page.goto('/');
    await use(page);
    // After each test - cleanup could go here
  },

  createProject: async ({ page }, use) => {
    const createProject = async (name: string, description?: string) => {
      // Call the API directly to create a project with git repository
      const response = await page.request.post('/api/projects', {
        data: {
          name,
          description: description || `Test project: ${name}`,
          gitRemote: 'origin',
        },
      });

      expect(response.ok()).toBe(true);
      const project = await response.json();

      return {
        id: project.id,
        name: project.name,
        folderPath: project.folderPath,
      };
    };

    await use(createProject);
  },

  selectProject: async ({ page }, use) => {
    const selectProject = async (projectId: string) => {
      // Reload the page to fetch the new project
      await page.reload();
      // Wait for the project dropdown to be available
      const projectSelect = page.locator('select').first();
      await projectSelect.waitFor({ state: 'visible', timeout: 10000 });
      // Select the project
      await projectSelect.selectOption(projectId);
      // Wait for the board to refresh with the selected project
      await page.waitForTimeout(1000);
    };

    await use(selectProject);
  },

  createTicket: async ({ page }, use) => {
    const createTicket = async (title: string, description: string, requirements?: string) => {
      // Click the "New Ticket" button
      await page.click('button:has-text("+ New Ticket")');

      // Wait for modal to be visible
      await page.waitForSelector('text=Create Ticket');

      // Fill in the form
      await page.fill('input[placeholder="Enter ticket title"]', title);
      await page.fill('textarea[placeholder="Describe what needs to be done"]', description);

      if (requirements) {
        await page.fill('textarea[placeholder*="Specific requirements"]', requirements);
      }

      // Submit the form
      await page.click('button:has-text("Create")');

      // Wait for modal to close
      await page.waitForSelector('text=Create Ticket', { state: 'detached' });
    };

    await use(createTicket);
  },

  dragTicketToColumn: async ({ page }, use) => {
    const dragTicketToColumn = async (ticketTitle: string, columnTitle: string) => {
      // Find the ticket and get its ID from the backend
      const ticketsResponse = await page.request.get('/api/tickets');
      const tickets = await ticketsResponse.json();
      const ticket = tickets.find((t: any) => t.title.includes(ticketTitle));
      
      if (!ticket) {
        throw new Error(`Ticket "${ticketTitle}" not found`);
      }

      // Map column title to status
      const statusMap: Record<string, string> = {
        'Backlog': 'BACKLOG',
        'TODO': 'TODO',
        'In Progress': 'IN_PROGRESS',
        'Review': 'REVIEW',
        'Done': 'DONE'
      };

      const status = statusMap[columnTitle];
      if (!status) {
        throw new Error(`Unknown column: ${columnTitle}`);
      }

      // Move ticket via API
      await page.request.put(`/api/tickets/${ticket.id}`, {
        data: { status }
      });
    };

    await use(dragTicketToColumn);
  },

  waitForTicketInColumn: async ({ page }, use) => {
    const waitForTicketInColumn = async (ticketTitle: string, columnTitle: string) => {
      const column = page.locator('h2').filter({ hasText: columnTitle }).first();
      const columnContainer = column.locator('xpath=../..');

      await columnContainer
        .locator(`[role="button"]:has-text("${ticketTitle}")`)
        .first()
        .waitFor({ state: 'visible', timeout: 30000 });
    };

    await use(waitForTicketInColumn);
  },

  waitForFilesInProject: async ({}, use) => {
    const waitForFilesInProject = async (projectFolderPath: string, fileNames: string[], timeoutMs: number = 300000) => {
      const startTime = Date.now();
      const absolutePath = path.isAbsolute(projectFolderPath)
        ? projectFolderPath
        : path.join(process.cwd(), '..', projectFolderPath);

      console.log(`⏳ Waiting for files in: ${absolutePath}`);
      console.log(`📄 Expected files: ${fileNames.join(', ')}`);
      console.log(`⏱️ Timeout: ${timeoutMs / 1000} seconds`);

      while (Date.now() - startTime < timeoutMs) {
        const allFilesExist = fileNames.every(fileName => {
          const filePath = path.join(absolutePath, fileName);
          const exists = fs.existsSync(filePath);
          if (!exists) {
            console.log(`❌ File not found: ${filePath}`);
          } else {
            console.log(`✅ File found: ${filePath}`);
          }
          return exists;
        });

        if (allFilesExist) {
          console.log(`✅ All files created successfully!`);
          return;
        }

        // Wait 3 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // List what files exist in the directory
      try {
        const files = fs.readdirSync(absolutePath);
        console.log(`📁 Files in directory: ${files.join(', ')}`);
      } catch (e) {
        console.log(`📁 Directory does not exist or is not accessible: ${absolutePath}`);
      }

      throw new Error(`Timeout waiting for files after ${timeoutMs}ms. Expected: ${fileNames.join(', ')} in ${absolutePath}`);
    };

    await use(waitForFilesInProject);
  },
});

export { expect } from '@playwright/test';
