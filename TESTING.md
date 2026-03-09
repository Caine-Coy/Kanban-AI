# Kanban-AI Testing Guide

## Overview

This project has a comprehensive test suite including:
- **Unit Tests** - Testing individual functions and components
- **Integration Tests** - Testing API endpoints and database operations
- **Regression Tests** - Ensuring fixed bugs don't resurface
- **E2E Tests** - Testing complete user workflows with Playwright

## Test Structure

```
kanban-ai/
├── backend/
│   └── src/__tests__/
│       ├── database.test.ts      # Basic database operations
│       ├── tickets.test.ts       # Ticket CRUD operations
│       ├── api.test.ts           # API endpoint integration tests
│       ├── services.test.ts      # Service layer tests
│       └── regression.test.ts    # Regression tests for fixed bugs
├── e2e/
│   └── tests/
│       ├── fixtures.ts           # Playwright test fixtures
│       └── e2e.spec.ts           # End-to-end test scenarios
└── .github/
    └── workflows/
        └── ci.yml                # CI/CD pipeline
```

## Running Tests

### All Tests
```bash
# Run all backend tests
npm run test --workspace=backend

# Run with watch mode
npm run test:watch --workspace=backend

# Run E2E tests (requires dev server running)
npm run test:e2e --workspace=e2e
```

### Specific Test Types
```bash
# Unit tests only
npm run test --workspace=backend -- --grep "Unit"

# Integration tests only
npm run test --workspace=backend -- --grep "API"

# Regression tests only
npm run test --workspace=backend -- --grep "Regression"
```

### E2E Test Options
```bash
# Run with UI
npm run test:e2e:ui --workspace=e2e

# Run with browser visible
npm run test:e2e:headed --workspace=e2e

# Run with debugger
npm run test:e2e:debug --workspace=e2e
```

## Test Coverage

### Backend Tests
- **Database Operations**: 100% coverage of CRUD operations
- **API Endpoints**: All REST endpoints tested
- **Services**: Core service functionality tested
- **Regression**: 10+ bug fixes covered

### E2E Tests
- **Hello World Flow**: Complete user workflow
- **Ticket Management**: Create, edit, delete, drag-drop
- **Agent Panel**: Status display and task tracking
- **Settings**: Configuration and connection testing

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setupDatabase } from '../database/index.js';
import { createTicket, getTicketById } from '../database/tickets.js';

describe('Ticket Operations', () => {
  beforeEach(() => {
    setupDatabase();
  });

  it('should create a ticket', () => {
    const ticket = createTicket({
      title: 'Test',
      description: 'Description',
    });

    expect(ticket.id).toBeDefined();
    expect(ticket.title).toBe('Test');
  });
});
```

### Integration Test Example
```typescript
import request from 'supertest';
import express from 'express';
import { ticketsRouter } from '../routes/tickets.js';

const app = express();
app.use(express.json());
app.use('/api/tickets', ticketsRouter);

describe('Tickets API', () => {
  it('should create a ticket', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .send({ title: 'Test', description: 'Desc' });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test');
  });
});
```

### E2E Test Example
```typescript
import { test, expect } from './fixtures';

test('create and move ticket', async ({ 
  page, 
  createTicket,
  dragTicketToColumn 
}) => {
  await createTicket('My Ticket', 'Description');
  await expect(page.locator('text=My Ticket')).toBeVisible();
  
  await dragTicketToColumn('My Ticket', 'TODO');
  await expect(page.locator('h2:has-text("TODO") + div'))
    .toContainText('My Ticket');
});
```

## Regression Testing

When a bug is found and fixed, add a test to `regression.test.ts`:

```typescript
describe('Bug #XXX: Description of the bug', () => {
  it('should not reproduce the bug', () => {
    // Test that verifies the fix
  });
});
```

## CI/CD Pipeline

The GitHub Actions workflow runs:
1. **Lint** - Code style checking
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - Backend test suite
4. **E2E Tests** - Playwright browser tests
5. **Build** - Production build verification

## Test Data

Tests use an in-memory SQLite database that is reset between test runs. The database file is created at `kanban.db` in the project root.

## Troubleshooting

### Tests failing with "Database not initialized"
Make sure `setupDatabase()` is called in `beforeEach()`.

### E2E tests timing out
- Ensure dev server is running: `npm run dev`
- Increase timeout in playwright config
- Check for port conflicts

### Playwright browsers not found
```bash
npx playwright install
npx playwright install-deps
```

## Coverage Reports

After running tests, view coverage reports:
```bash
# HTML report
open backend/coverage/index.html
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Test names should describe expected behavior
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Edge Cases**: Test boundary conditions
5. **Regression Coverage**: Add tests for every bug fix
