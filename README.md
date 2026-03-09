# Kanban-AI

A Kanban board with AI agent integration for automated development workflows. Drag tickets to TODO and an AI agent will automatically work on them in a separate git branch, creating a pull request when done.

## Features

- 📋 Visual Kanban board with drag-and-drop
- 🤖 AI agent integration via LM Studio
- 🔀 Automatic git branch management
- ✅ Automated testing before PR creation
- 🔄 Real-time board updates
- 🧪 Comprehensive test suite (Unit, Integration, E2E, Regression)

## Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

```bash
# Install dependencies
npm install

# Start dev servers
npm run dev

# Open http://localhost:5173
```

## How It Works

1. **Create a ticket** with your feature request or bug fix
2. **Drag to TODO** column to assign to an available AI agent
3. **Agent works** in a separate git branch:
   - Analyzes the requirements
   - Implements the solution
   - Writes unit tests
   - Commits changes
4. **Automatic PR** created when complete (if GitHub configured)
5. **Review and merge** the pull request

## Project Structure

```
kanban-ai/
├── frontend/          # React + Vite + Tailwind CSS
├── backend/           # Express + Socket.io + SQLite
├── e2e/               # Playwright E2E tests
├── shared/            # Shared TypeScript types
├── SETUP.md           # Detailed setup guide
└── TESTING.md         # Testing documentation
```

## Tech Stack

- **Frontend**: React 19, TypeScript, @dnd-kit, Tailwind CSS 4, Socket.io-client
- **Backend**: Node.js, Express 5, TypeScript, Socket.io, better-sqlite3 12
- **Git**: simple-git
- **AI**: LM Studio (OpenAI-compatible API)
- **Testing**: Vitest 4 (Unit/Integration), Playwright (E2E)

## Testing

```bash
# Run backend tests
npm run test --workspace=backend

# Run E2E tests
npm run test:e2e --workspace=e2e

# Run with watch mode
npm run test:watch --workspace=backend
```

See [TESTING.md](./TESTING.md) for complete testing documentation.

## Documentation

- [Setup Guide](./SETUP.md) - Installation and configuration
- [Testing Guide](./TESTING.md) - Test suite documentation
- [API Endpoints](./SETUP.md#api-endpoints) - REST API reference
- [WebSocket Events](./SETUP.md#websocket-events) - Real-time events

## License

MIT
