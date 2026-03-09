# CI/CD Configuration

## GitHub Actions Workflow

The CI workflow (`.github/workflows/ci.yml`) runs the following checks on every push and pull request:

### Jobs

1. **Lint** - Code style checking with ESLint
2. **Type Check** - TypeScript compilation check
3. **Unit Tests** - Backend tests with Vitest
4. **E2E Tests** - Playwright browser tests
5. **Build** - Production build verification

## Skipping External API Tests

By default, tests that require external API connections (OpenRouter, LM Studio) are **skipped in CI** to prevent failures.

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `CI` | Indicates running in CI | `true` in GitHub Actions |
| `SKIP_EXTERNAL_API_TESTS` | Skip external API tests | `true` in CI |
| `OPENROUTER_KEY` | Enable AI agent E2E tests | Not set (tests skipped) |

## Enabling AI Agent Tests

To enable full E2E tests with AI agent functionality:

1. Go to your GitHub repository **Settings**
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name:** `OPENROUTER_KEY`
   - **Value:** Your OpenRouter API key (get from [openrouter.ai](https://openrouter.ai))

Once configured, the E2E tests will:
- Test AI agent ticket assignment
- Verify agent workflow (Backlog → TODO → In Progress → Review)
- Test code generation and commit functionality

## Test Structure

### Unit Tests (`backend/src/__tests__/`)
- `database.test.ts` - Database operations
- `tickets.test.ts` - Ticket CRUD
- `api.test.ts` - API endpoints
- `services.test.ts` - Service layer
- `regression.test.ts` - Bug regression

### E2E Tests (`e2e/tests/`)
- `e2e.spec.ts` - Full user workflows
  - Drag and drop tests (always run)
  - Ticket management (always run)
  - Hello World AI workflow (requires `OPENROUTER_KEY`)

## Local Testing

```bash
# Run all tests (including external API tests)
npm run test --workspace=backend

# Skip external API tests (like CI)
SKIP_EXTERNAL_API_TESTS=true npm run test --workspace=backend

# Run E2E tests
npm run test:e2e --workspace=e2e

# Run E2E with AI tests (requires OPENROUTER_KEY)
OPENROUTER_KEY=sk-or-... npm run test:e2e --workspace=e2e
```

## Troubleshooting

### Tests failing with "Connection refused"
This is expected in CI without `OPENROUTER_KEY`. The tests should be skipped automatically.

### E2E tests timing out
Increase timeout in `e2e/playwright.config.ts`:
```typescript
export default defineConfig({
  timeout: 60000, // Increase from default 30000
});
```

### Want to run AI tests locally?
1. Get an API key from [openrouter.ai](https://openrouter.ai)
2. Set environment variable: `export OPENROUTER_KEY=sk-or-...`
3. Run: `npm run test:e2e --workspace=e2e`
