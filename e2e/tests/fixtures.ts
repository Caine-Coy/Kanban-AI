import { test as base, expect } from '@playwright/test';

/**
 * Extended test fixture with Kanban-AI specific helpers
 */
export const test = base.extend<{
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
