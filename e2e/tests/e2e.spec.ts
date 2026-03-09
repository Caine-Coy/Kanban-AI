import { test, expect } from './fixtures';

/**
 * Test: First-time user experience - Project creation required
 */
test.describe('First-Time User Experience', () => {
  test('should show welcome overlay when no projects exist', async ({ page }) => {
    // Clear all projects first (via API)
    const projects = await (await fetch('http://localhost:3000/api/projects')).json();
    for (const project of projects) {
      await fetch(`http://localhost:3000/api/projects/${project.id}`, { method: 'DELETE' });
    }

    // Reload page to see welcome overlay
    await page.reload();
    
    // Should see welcome message
    await expect(page.locator('text=Welcome to Kanban-AI')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Create Your First Project')).toBeVisible();
    
    // Board should not be visible
    await expect(page.locator('h2:has-text("Backlog")')).not.toBeVisible();
  });

  test('should create first project and show board', async ({ page }) => {
    // Clear all projects first
    const projects = await (await fetch('http://localhost:3000/api/projects')).json();
    for (const project of projects) {
      await fetch(`http://localhost:3000/api/projects/${project.id}`, { method: 'DELETE' });
    }

    await page.reload();
    
    // Click create project button
    await page.click('button:has-text("Create Your First Project")');
    
    // Fill in project form
    await page.fill('input[placeholder="My Awesome Project"]', 'Test Project');
    await page.fill('textarea[placeholder*="Brief description"]', 'Test Description');
    
    // Submit
    await page.click('button:has-text("Create Project")');
    
    // Should see success message
    await page.waitForSelector('text=Project created', { timeout: 5000 });
    
    // Board should now be visible
    await expect(page.locator('h2:has-text("Backlog")')).toBeVisible({ timeout: 10000 });
  });
});

/**
 * Test: Drag and Drop Ticket Movement
 */
test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('drag ticket from Backlog to TODO', async ({ page, createTicket }) => {
    // Create a ticket in Backlog
    await createTicket('Drag Test Ticket', 'Testing drag functionality');
    
    // Verify ticket is in Backlog
    const backlogColumn = page.locator('h2:has-text("Backlog")').first();
    const backlogContainer = backlogColumn.locator('xpath=../..');
    await expect(backlogContainer.locator('[role="button"]:has-text("Drag Test Ticket")')).toBeVisible();
    
    // Drag to TODO
    const ticket = backlogContainer.locator('[role="button"]:has-text("Drag Test Ticket")').first();
    const todoColumn = page.locator('h2:has-text("TODO")').first();
    const todoContainer = todoColumn.locator('xpath=../..');
    
    await ticket.dragTo(todoColumn);
    
    // Verify ticket is now in TODO
    await expect(todoContainer.locator('[role="button"]:has-text("Drag Test Ticket")')).toBeVisible({ timeout: 5000 });
    await expect(backlogContainer.locator('[role="button"]:has-text("Drag Test Ticket")')).not.toBeVisible();
  });

  test('ticket should not disappear when dropped outside columns', async ({ page, createTicket }) => {
    // Create a ticket
    await createTicket('Drop Test', 'Testing drop outside');
    
    const backlogColumn = page.locator('h2:has-text("Backlog")').first();
    const backlogContainer = backlogColumn.locator('xpath=../..');
    const ticket = backlogContainer.locator('[role="button"]:has-text("Drop Test")').first();
    
    // Drag and drop outside any column (drop in empty space)
    const board = page.locator('main');
    await ticket.dragTo(board, {
      targetPosition: { x: 10, y: 10 } // Drop in corner, outside columns
    });
    
    // Ticket should still be in Backlog (reverted)
    await expect(backlogContainer.locator('[role="button"]:has-text("Drop Test")')).toBeVisible({ timeout: 5000 });
  });

  test('drag ticket through all columns', async ({ page, createTicket }) => {
    // Create a ticket
    await createTicket('Workflow Test', 'Testing full workflow');
    
    const columns = ['Backlog', 'TODO', 'In Progress', 'Review', 'Done'];
    
    for (let i = 1; i < columns.length; i++) {
      const fromColumn = page.locator(`h2:has-text("${columns[i-1]}")`).first();
      const fromContainer = fromColumn.locator('xpath=../..');
      const toColumn = page.locator(`h2:has-text("${columns[i]}")`).first();
      const toContainer = toColumn.locator('xpath=../..');
      
      const ticket = fromContainer.locator('[role="button"]:has-text("Workflow Test")').first();
      await ticket.dragTo(toColumn);
      
      // Verify ticket moved
      await expect(toContainer.locator('[role="button"]:has-text("Workflow Test")')).toBeVisible({ timeout: 5000 });
    }
  });

  test('drag ticket back from TODO to Backlog', async ({ page, createTicket, dragTicketToColumn }) => {
    // Create and move to TODO
    await createTicket('Back and Forth', 'Moving back');
    await dragTicketToColumn('Back and Forth', 'TODO');
    
    // Drag back to Backlog
    const todoColumn = page.locator('h2:has-text("TODO")').first();
    const todoContainer = todoColumn.locator('xpath=../..');
    const backlogColumn = page.locator('h2:has-text("Backlog")').first();
    const backlogContainer = backlogColumn.locator('xpath=../..');
    
    const ticket = todoContainer.locator('[role="button"]:has-text("Back and Forth")').first();
    await ticket.dragTo(backlogColumn);
    
    // Verify ticket is back in Backlog
    await expect(backlogContainer.locator('[role="button"]:has-text("Back and Forth")')).toBeVisible({ timeout: 5000 });
  });
});

/**
 * End-to-End Test: Hello World Website Creation
 *
 * This test simulates a complete user workflow:
 * 1. User creates tickets for building a Hello World website
 * 2. Tickets are moved to TODO column (triggering AI agents)
 * 3. AI agents implement HTML, CSS, and JavaScript
 * 4. Final result is a working Hello World website
 *
 * NOTE: This test is skipped in CI environments without AI configuration
 */
test.describe('Hello World Website E2E Flow', () => {
  test('complete workflow from tickets to working website', async ({
    page,
    createTicket,
    dragTicketToColumn,
    waitForTicketInColumn
  }) => {
    // Skip AI-dependent tests in CI
    if (process.env.CI && !process.env.OPENROUTER_KEY) {
      test.skip();
      console.log('Skipping AI-dependent test in CI (no OPENROUTER_KEY)');
      return;
    }
    // Step 1: Verify the board loads correctly
    await expect(page.locator('h1:has-text("Kanban-AI")')).toBeVisible();
    await expect(page.locator('h2:has-text("Backlog")')).toBeVisible();
    await expect(page.locator('h2:has-text("TODO")')).toBeVisible();
    await expect(page.locator('h2:has-text("In Progress")')).toBeVisible();
    await expect(page.locator('h2:has-text("Review")')).toBeVisible();
    await expect(page.locator('h2:has-text("Done")')).toBeVisible();

    // Step 2: Create tickets for the Hello World website project
    await test.step('Create HTML structure ticket', async () => {
      await createTicket(
        'Create HTML structure for Hello World website',
        'Create a basic HTML5 document structure for a Hello World website. Include proper meta tags, semantic HTML elements, and a clean structure.',
        `- Use HTML5 doctype
- Include viewport meta tag for responsive design
- Add a header with site title
- Add a main content area with a greeting
- Add a footer with copyright
- Ensure valid HTML5 structure`
      );
    });

    await test.step('Create CSS styling ticket', async () => {
      await createTicket(
        'Add CSS styling for Hello World website',
        'Style the Hello World website with modern CSS. Create an attractive, responsive design with good typography and color scheme.',
        `- Use CSS custom properties for colors
- Implement flexbox or grid layout
- Add responsive design with media queries
- Style the greeting prominently
- Add hover effects and transitions
- Ensure good contrast and accessibility`
      );
    });

    await test.step('Create JavaScript interactivity ticket', async () => {
      await createTicket(
        'Add JavaScript interactivity to Hello World website',
        'Add JavaScript functionality to make the Hello World website interactive. Include dynamic greeting and user interaction.',
        `- Add a button to toggle dark/light mode
- Implement a dynamic greeting based on time of day
- Add a counter for button clicks
- Store user preference in localStorage
- Include proper error handling`
      );
    });

    await test.step('Create unit tests ticket', async () => {
      await createTicket(
        'Write unit tests for Hello World website',
        'Create comprehensive unit tests for the JavaScript functionality in the Hello World website.',
        `- Test the greeting function
- Test the theme toggle functionality
- Test localStorage integration
- Test edge cases and error handling
- Achieve at least 80% code coverage`
      );
    });

    // Step 3: Verify all tickets are in Backlog
    await expect(page.locator('h2:has-text("Backlog") + div')).toContainText('Create HTML structure');
    await expect(page.locator('h2:has-text("Backlog") + div')).toContainText('Add CSS styling');
    await expect(page.locator('h2:has-text("Backlog") + div')).toContainText('Add JavaScript interactivity');
    await expect(page.locator('h2:has-text("Backlog") + div')).toContainText('Write unit tests');

    // Step 4: Move HTML ticket to TODO (triggers AI agent)
    await test.step('Move HTML ticket to TODO', async () => {
      await dragTicketToColumn('Create HTML structure', 'TODO');
      await waitForTicketInColumn('Create HTML structure', 'TODO');
    });

    // Step 5: Verify agent picks up the ticket
    await test.step('Verify agent starts working', async () => {
      // The ticket should move to In Progress when agent picks it up
      await waitForTicketInColumn('Create HTML structure', 'In Progress');
    });

    // Step 6: Move CSS ticket to TODO
    await test.step('Move CSS ticket to TODO', async () => {
      await dragTicketToColumn('Add CSS styling', 'TODO');
      await waitForTicketInColumn('Add CSS styling', 'TODO');
    });

    // Step 7: Move JavaScript ticket to TODO
    await test.step('Move JavaScript ticket to TODO', async () => {
      await dragTicketToColumn('Add JavaScript interactivity', 'TODO');
      await waitForTicketInColumn('Add JavaScript interactivity', 'TODO');
    });

    // Step 8: Verify tickets progress through the workflow
    await test.step('Verify tickets complete successfully', async () => {
      // Wait for tickets to be completed by agents
      // Tickets should move to Review when agents finish
      await waitForTicketInColumn('Create HTML structure', 'Review');
      await waitForTicketInColumn('Add CSS styling', 'Review');
      await waitForTicketInColumn('Add JavaScript interactivity', 'Review');
    });

    // Step 9: Verify the generated website exists
    await test.step('Verify generated files', async () => {
      // This would typically check a preview or the actual generated files
      // For now, we verify the tickets completed
      await expect(page.locator('h2:has-text("Review") + div')).toContainText('index.html');
      await expect(page.locator('h2:has-text("Review") + div')).toContainText('styles.css');
      await expect(page.locator('h2:has-text("Review") + div')).toContainText('app.js');
    });
  });
});

/**
 * Test: Ticket Creation and Management
 */
test.describe('Ticket Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('create a new ticket with all fields', async ({ page }) => {
    // Click "New Ticket" button
    await page.click('button:has-text("+ New Ticket")');
    
    // Fill in all fields
    await page.fill('input[placeholder="Enter ticket title"]', 'Test Ticket');
    await page.fill('textarea[placeholder="Describe what needs to be done"]', 'Test Description');
    await page.fill('textarea[placeholder*="Specific requirements"]', 'Test Requirements');
    
    // Submit
    await page.click('button:has-text("Create")');
    
    // Verify ticket appears in Backlog
    await expect(page.locator('[role="button"]:has-text("Test Ticket")')).toBeVisible();
  });

  test('edit an existing ticket', async ({ page, createTicket }) => {
    // Create a ticket first
    await createTicket('Original Title', 'Original Description');
    
    // Click on the ticket to edit
    await page.click('[role="button"]:has-text("Original Title")');
    
    // Update the title
    await page.fill('input[placeholder="Enter ticket title"]', 'Updated Title');
    await page.click('button:has-text("Update")');
    
    // Verify update
    await expect(page.locator('[role="button"]:has-text("Updated Title")')).toBeVisible();
  });

  test('delete a ticket', async ({ page, createTicket }) => {
    // Create a ticket first
    await createTicket('Ticket to Delete', 'This will be deleted');
    
    // Click on the ticket to edit
    await page.click('[role="button"]:has-text("Ticket to Delete")');
    
    // Click delete button
    await page.click('button:has-text("Delete")');
    
    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());
    
    // Verify ticket is gone
    await expect(page.locator('[role="button"]:has-text("Ticket to Delete")')).not.toBeVisible();
  });

  test('drag and drop ticket between columns', async ({ page, createTicket }) => {
    // Create a ticket
    await createTicket('Drag Test Ticket', 'Testing drag and drop');
    
    // Find the ticket and drag it to TODO column
    const ticket = page.locator('[role="button"]').filter({ hasText: 'Drag Test Ticket' }).first();
    const todoColumn = page.locator('h2:has-text("TODO")').first();
    
    await ticket.dragTo(todoColumn);
    
    // Verify ticket is in TODO column
    const todoColumnContainer = todoColumn.locator('xpath=../..');
    await expect(todoColumnContainer.locator('[role="button"]:has-text("Drag Test Ticket")')).toBeVisible();
  });
});

/**
 * Test: Agent Panel and Status
 */
test.describe('Agent Panel', () => {
  test('display agent status', async ({ page }) => {
    await page.goto('/');
    
    // Agent panel should be visible
    await expect(page.locator('h2:has-text("AI Agents")')).toBeVisible();
    
    // Should show either agents or "No agents configured"
    const agentPanel = page.locator('aside');
    await expect(agentPanel).toBeVisible();
  });

  test('show task progress in agent panel', async ({ page, createTicket, dragTicketToColumn }) => {
    // Create and assign a ticket
    await createTicket('Agent Test Task', 'Testing agent progress display');
    await dragTicketToColumn('Agent Test Task', 'TODO');
    
    // Agent panel should show the task
    await expect(page.locator('h3:has-text("Recent Tasks")')).toBeVisible();
  });
});

/**
 * Test: Settings Configuration
 */
test.describe('Settings', () => {
  test('open settings modal', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("Settings")');
    
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();
    await expect(page.locator('text=LM Studio Configuration')).toBeVisible();
  });

  test('test LM Studio connection', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Settings")');
    
    // Click test connection button
    await page.click('button:has-text("Test Connection")');
    
    // Should show connection result (success or failure)
    await page.waitForSelector('text=Connected, text=Failed', { timeout: 10000 });
  });

  test('save settings', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Settings")');
    
    // Modify LM Studio URL
    await page.fill('input[placeholder="http://localhost:1234"]', 'http://localhost:1234');
    
    // Save
    await page.click('button:has-text("Save Settings")');
    
    // Modal should close
    await expect(page.locator('h2:has-text("Settings")')).not.toBeVisible();
  });
});
