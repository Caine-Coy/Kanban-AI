# Kanban-AI Setup Guide

## Prerequisites

Before getting started, ensure you have:

- **Node.js** >= 18.0.0
- **npm** or **pnpm** package manager
- **LM Studio** installed and running
- **Git** configured with your repository

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (root, frontend, backend, shared).

### 2. Start LM Studio

1. Open LM Studio
2. Download a coding-focused model (recommended: CodeLlama, StarCoder, or similar)
3. Start the local server (usually on `http://localhost:1234`)
4. Note the model name from the dropdown

### 3. Configure the Application

1. Start the dev servers:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5173`

3. Click the **Settings** button in the top right

4. Configure:
   - **LM Studio URL**: `http://localhost:1234` (default)
   - **Model Name**: Select your loaded model in LM Studio
   - **Test Command**: Your project's test command (e.g., `npm test`, `pytest`, etc.)
   - **GitHub Settings** (optional): For automatic PR creation

5. Click **Test Connection** to verify LM Studio is reachable

### 4. Create an Agent

Before tickets can be assigned, you need at least one agent:

```bash
# Via API (you can use curl or the application will create one by default)
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "DevAgent-1"}'
```

Or use the browser console:
```javascript
fetch('/api/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'DevAgent-1' })
})
```

### 5. Using the Kanban Board

1. **Create a Ticket**: Click "+ New Ticket" and fill in:
   - Title: Brief description of the task
   - Description: Detailed explanation
   - Requirements: Specific technical requirements (optional but recommended)

2. **Assign to Agent**: Drag the ticket from BACKLOG to TODO
   - An idle agent will automatically pick it up
   - A new git branch will be created
   - The agent will start working on the implementation

3. **Monitor Progress**: Watch the agent panel on the right:
   - Agent status changes to "WORKING"
   - Task logs show progress
   - Ticket moves through IN_PROGRESS → REVIEW

4. **Review Work**: When the agent completes:
   - Ticket moves to REVIEW column
   - Branch is pushed to remote
   - PR is created (if GitHub configured)
   - Review the code and merge if satisfactory

## Project Structure

```
kanban-ai/
├── backend/           # Express API server
│   ├── src/
│   │   ├── database/  # SQLite database layer
│   │   ├── routes/    # REST API endpoints
│   │   ├── services/  # Business logic (Agent, Git, LM Studio)
│   │   └── websocket/ # Real-time updates
│   └── package.json
├── frontend/          # React + Vite UI
│   ├── src/
│   │   ├── components/ # React components
│   │   └── hooks/     # Custom React hooks
│   └── package.json
├── shared/            # Shared TypeScript types
│   └── src/types.ts
└── package.json       # Root workspace config
```

## Configuration Options

### LM Studio Settings

| Setting | Default | Description |
|---------|---------|-------------|
| URL | `http://localhost:1234` | LM Studio server address |
| Model | `default` | Model name to use for generation |

### Git Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Remote | `origin` | Git remote name for pushing |

### GitHub Integration (Optional)

| Setting | Description |
|---------|-------------|
| Token | GitHub personal access token with `repo` scope |
| Owner | GitHub username or organization |
| Repo | Repository name for PR creation |

### Test Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Command | `npm test` | Command to run tests |
| Timeout | `60000` | Test timeout in milliseconds |

## API Endpoints

### Tickets

- `GET /api/tickets` - List all tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `POST /api/tickets/:id/assign` - Assign to agent

### Agents

- `GET /api/agents` - List all agents
- `POST /api/agents` - Create new agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Tasks

- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get task by ID
- `GET /api/tasks/ticket/:ticketId` - Get task by ticket
- `PUT /api/tasks/:id` - Update task

### Settings

- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/test-lmstudio` - Test LM Studio connection

## WebSocket Events

The application uses Socket.io for real-time updates:

### Client → Server

- `REQUEST_STATE` - Request full board state
- `TICKET_MOVED` - Notify ticket column change

### Server → Client

- `STATE_UPDATE` - Full board state
- `TICKET_UPDATED` - Ticket changed
- `AGENT_STATUS_CHANGED` - Agent status update
- `TASK_STATUS_CHANGED` - Task status update
- `ERROR` - Error notification

## Troubleshooting

### LM Studio Connection Failed

1. Ensure LM Studio is running
2. Check the server is started in LM Studio
3. Verify the URL matches (default: `http://localhost:1234`)
4. Try a different model

### Agent Not Picking Up Tickets

1. Check if you have at least one agent created
2. Verify agent status is "IDLE"
3. Check backend logs for errors
4. Ensure git is configured properly

### Tests Failing

1. Verify the test command works in your terminal
2. Check the working directory is correct
3. Increase timeout if tests are slow

### Git Push Failed

1. Ensure you have write access to the remote
2. Check remote URL is correct
3. Verify credentials/token are valid

## Development Commands

```bash
# Install all dependencies
npm install

# Start both frontend and backend
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

## Tips for Better Results

1. **Write clear requirements**: The more specific you are, the better the agent can implement
2. **Start small**: Begin with simple, focused tickets
3. **Review carefully**: Always review agent-generated code before merging
4. **Iterate**: If the implementation isn't right, create a follow-up ticket with corrections
5. **Use appropriate models**: Larger coding models produce better results

## Security Notes

- Never commit `.env` files with tokens
- Use GitHub tokens with minimal required permissions
- Run LM Studio in a secure environment
- Review all agent-generated code before merging
