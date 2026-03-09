import { test as base, expect } from '@playwright/test';

/**
 * Extended test fixture with Kanban-AI specific helpers
 */
export const test = base.extend<{
  createProject: (name: string, description?: string) => Promise<{ id: string; name: string; folderPath: string }>;
  selectProject: (projectId: string) => Promise<void>;
  createTicket: (title: string, description: string, requirements?: string) => Promise<void>;
  dragTicketToColumn: (ticketTitle: string, columnTitle: string) => Promise<void>;
  waitForTicketInColumn: (ticketTitle: string, columnTitle: string) => Promise<void>;
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
      // Select project from the dropdown
      const projectSelect = page.locator('select').first();
      await projectSelect.selectOption(projectId);
      // Wait a bit for the board to refresh with the selected project
      await page.waitForTimeout(500);
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
      const ticket = page.locator('[role="button"]').filter({ hasText: ticketTitle }).first();
      const column = page.locator('h2').filter({ hasText: columnTitle }).first();

      await ticket.dragTo(column);
    };

    await use(dragTicketToColumn);
  },

  waitForTicketInColumn: async ({ page }, use) => {
    const waitForTicketInColumn = async (ticketTitle: string, columnTitle: string) => {
      const column = page.locator('h2').filter({ hasText: columnTitle }).first();
      const columnContainer = column.locator('xpath=../..');

      await columnContainer
        .locator(`[role="button"]:has-text("${ticketTitle}")`)
        .waitFor({ state: 'visible', timeout: 30000 });
    };

    await use(waitForTicketInColumn);
  },
});

export { expect } from '@playwright/test';
