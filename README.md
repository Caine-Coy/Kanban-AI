# Kanban-AI

A powerful Kanban board with AI agent integration that automatically works on tickets using OpenRouter free models. Features multi-project support with isolated git repositories, comprehensive testing, and real-time updates.

## 🎯 Features

### Core Functionality
- 📋 **Visual Kanban Board** - Drag-and-drop ticket management with 5 columns (Backlog, TODO, In Progress, Review, Done)
- 🤖 **AI Agent Integration** - Automatic ticket completion using OpenRouter free models
- 🗂️ **Multi-Project Support** - Each project has its own folder and git repository
- 🔄 **Real-Time Updates** - WebSocket-based live board, task, and agent status updates
- 🧪 **Comprehensive Testing** - 64+ tests (Unit, Integration, E2E, Regression)

### AI & Automation
- 🌐 **OpenRouter Integration** - Uses free tier models (default: `openrouter/free`)
- 🔑 **Environment Variable Support** - Secure API key configuration via `.env` file
- 🔄 **Automatic Retry** - Failed tasks can be retried with one click
- 📝 **Smart Git Management** - Automatic branch creation, commits, and PR creation
- ✅ **Test Execution** - Agents run tests before marking tasks complete

### Developer Experience
- 🎨 **Modern UI** - React 19 + Vite 7 + TailwindCSS 4
- 🗄️ **SQLite Database** - Persistent settings and project data
- 🔌 **Type-Safe** - Full TypeScript support across frontend, backend, and shared code
- 🚀 **Hot Reload** - Fast development with concurrent dev servers

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 20.0.0
- **npm** or **yarn**
- **OpenRouter API Key** (free tier available at [openrouter.ai](https://openrouter.ai))

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Kanban-AI

# Install dependencies
npm install

# Create .env file with your OpenRouter API key
cp .env.example .env
# Edit .env and add: OPENROUTER_KEY=sk-or-your-key-here
```

### Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
```

### First-Time Setup

1. **Welcome Screen** appears - click "+ Create Your First Project"
2. **Enter project details**:
   - Name: "My Awesome Project"
   - Description: (optional)
   - Folder will be created at: `Projects/my-awesome-project/`
3. **Click "Create Project"** - Git repository initialized automatically
4. **Create your first ticket** - Describe what you want the AI to build
5. **Drag ticket to TODO** - AI agent automatically starts working

---

## 📖 User Guide

### Creating Projects

Each project gets its own isolated git repository in the `Projects/` folder.

**Via UI:**
1. Click **"+ New Project"** in the header
2. Enter project name (auto-slugified to folder name)
3. Add optional description
4. Click **"Create Project"**

**What happens:**
- Creates `Projects/{project-name}/` folder
- Initializes git repository
- Creates `README.md` with project info
- Makes initial commit

**Project Structure:**
```
Kanban-AI/
├── Projects/
│   ├── my-web-app/
│   │   ├── .git/
│   │   ├── README.md
│   │   └── [AI-generated files]
│   └── api-backend/
│       ├── .git/
│       ├── README.md
│       └── [AI-generated files]
├── frontend/
├── backend/
└── kanban.db
```

### Creating Tickets

1. Click **"+ New Ticket"** in the header
2. Fill in the form:
   - **Title**: Clear, concise description
   - **Description**: Detailed requirements
   - **Requirements** (optional): Technical specs, acceptance criteria
   - **Project** (optional): Select which project to work on
3. Click **"Create Ticket"**

**Tips for better AI results:**
- Be specific about what you want
- Include technical requirements
- Add acceptance criteria
- Specify frameworks or libraries to use

### Working with Tickets

**Ticket Columns:**
- **BACKLOG** - Newly created tickets (no agent assigned)
- **TODO** - Assigned to agent, waiting to be processed
- **IN_PROGRESS** - Agent is actively working
- **REVIEW** - Agent completed work, PR ready for review
- **DONE** - Merged and completed

**Drag-and-Drop:**
- Drag tickets between columns to change status
- Drop outside columns to cancel (ticket stays in place)
- Moving to TODO assigns an available agent

**Editing Tickets:**
- Click the **metadata area** (bottom half of card) to edit
- **Title/Description area** is for dragging
- Use the **Delete** button in edit modal to remove tickets

### AI Agent Workflow

**When you drag a ticket to TODO:**

1. **Agent Assignment**
   - First available agent picks up the ticket
   - Creates branch: `ticket/{id}-{slugified-title}`
   - Ticket status → IN_PROGRESS

2. **AI Analysis**
   - Reads ticket title, description, requirements
   - Plans implementation approach
   - Generates code files

3. **Git Operations**
   - Creates/updates files in project folder
   - Runs tests (if configured)
   - Commits changes with descriptive message
   - Pushes to remote (if configured)

4. **Pull Request**
   - Creates PR on GitHub (if configured)
   - Ticket status → REVIEW
   - Agent becomes IDLE

**If Agent Fails:**
- Ticket automatically reverts to TODO
- Error message shown in Agent Panel
- Click **🔄 Retry** button to try again

### Managing Agents

**View Agents:**
- Open **Agent Panel** (right sidebar)
- See all agents and their status:
  - ✅ **Idle** - Ready for work
  - 🔧 **Working** - Currently on a ticket
  - ⏸️ **Busy** - Temporarily unavailable

**Create Agents:**
1. In Agent Panel, enter agent name
2. Click **"+ Create Agent"**
3. Default agent "OpenRouter-Agent-1" created automatically on startup

**Delete Agents:**
- Click **🗑️** button next to agent name
- Only idle agents can be deleted

### Task Management

**View Tasks:**
- Agent Panel shows recent 5 tasks
- Each task shows:
  - Branch name
  - Status badge (PENDING, RUNNING, COMPLETED, FAILED)
  - Error message (if failed)
  - Last log entry

**Retry Failed Tasks:**
1. Find failed task in Agent Panel
2. Click **🔄 Retry** button
3. Task resets to PENDING
4. Agent reassigns automatically

---

## ⚙️ Configuration

### Environment Variables (.env)

Create a `.env` file in the project root:

```bash
# OpenRouter API Configuration
OPENROUTER_KEY=sk-or-your-api-key-here
OPENROUTER_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openrouter/free

# GitHub Integration (Optional)
GITHUB_TOKEN=ghp_your-token-here
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo-name

# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**Environment variables override database settings.**

### Settings UI

Access via **Settings** button in header:

**AI Configuration:**
- **OpenRouter Mode** toggle - Enable/disable OpenRouter
- **API Key** - Your OpenRouter API key
- **Model** - Which model to use (default: `openrouter/free`)
- **Test Connection** - Verify API key works

**Git Configuration:**
- **Git Remote** - Remote name (default: `origin`)
- **Test Command** - Command to run tests (default: `npm test`)
- **Test Timeout** - Test timeout in ms (default: `60000`)

**GitHub Integration:**
- **GitHub Owner** - Your username or org
- **GitHub Repo** - Repository name
- **GitHub Token** - Personal access token

### Reset Settings

```bash
# Reset settings to defaults (keeps projects, tickets, etc.)
npm run reset-settings

# Complete factory reset (deletes EVERYTHING)
npm run reset-all
```

**reset-settings** resets:
- OpenRouter enabled (`useOpenRouter: true`)
- Model: `openrouter/free`
- Git remote: `origin`
- Test command: `npm test`
- Test timeout: `60000`

**reset-all** deletes:
- All settings
- All projects
- All tickets
- All agents
- All tasks
- All project folders (`Projects/`)
- Database files (`kanban.db*`)

After `reset-all`, you'll see the welcome screen and need to create your first project again.

---

## 🎨 UI Components

### Header
- **App title** with status indicators
- **📡 Connected/Disconnected** - WebSocket status
- **✅/❌ OpenRouter** - AI provider connection status
- **Project selector** - Filter by project
- **+ New Project** - Create project
- **+ New Ticket** - Create ticket
- **Settings** - Configuration modal

### Kanban Board
- **5 columns** - Backlog, TODO, In Progress, Review, Done
- **Drag-and-drop** tickets between columns
- **Ticket cards** show:
  - Title and description
  - Branch name (if assigned)
  - Assigned agent
  - Status indicator

### Agent Panel
- **Agent list** with status
- **Create/Delete agents**
- **Recent tasks** with retry button
- **Real-time updates** via WebSocket

### Modals
- **Ticket Modal** - Create/edit tickets
- **Project Modal** - Create projects
- **Settings Modal** - Configure app

---

## 🔧 Development

### Project Structure

```
Kanban-AI/
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
├── package.json         # Root package config
├── tsconfig.json        # TypeScript config
├── README.md            # This file
├── SETUP.md             # Detailed setup guide
├── TESTING.md           # Testing documentation
│
├── backend/
│   ├── src/
│   │   ├── index.ts     # Server entry point
│   │   ├── routes/      # REST API routes
│   │   ├── services/    # Business logic
│   │   └── database/    # SQLite schema & queries
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx      # Main component
│   │   ├── components/  # React components
│   │   └── hooks/       # Custom hooks
│   └── package.json
│
├── shared/
│   └── src/types.ts     # Shared TypeScript types
│
├── e2e/
│   └── tests/           # Playwright E2E tests
│
├── scripts/
│   ├── reset-settings.js # Settings reset utility
│   └── reset-all.js      # Complete factory reset
│
└── Projects/            # Project repositories (gitignored)
```

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Frontend only (Vite)
npm run dev:backend      # Backend only (tsx)

# Build
npm run build            # Build both projects
npm run build:frontend   # Frontend production build
npm run build:backend    # Backend TypeScript compile

# Testing
npm run test             # Run backend tests
npm run test:watch       # Tests in watch mode
npm run test:e2e         # Run E2E tests (Playwright)

# Utilities
npm run reset-settings   # Reset database settings
npm run reset-all        # Complete factory reset
npm run lint             # Run ESLint
```

### API Endpoints

**Tickets:**
- `GET /api/tickets` - List all tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

**Projects:**
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project (with git init)
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

**Agents:**
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create agent
- `DELETE /api/agents/:id` - Delete agent

**Tasks:**
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get task by ID
- `GET /api/tasks/ticket/:ticketId` - Get task by ticket
- `POST /api/tasks/:id/retry` - Retry failed task
- `PUT /api/tasks/:id` - Update task

**Settings:**
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/test-lmstudio` - Test AI connection

### WebSocket Events

**Client → Server:**
- `JOIN_BOARD` - Subscribe to board updates

**Server → Client:**
- `BOARD_UPDATED` - Board state changed
- `TICKET_UPDATED` - Ticket updated
- `TASK_STATUS_CHANGED` - Task status changed
- `AGENT_STATUS_CHANGED` - Agent status changed

---

## 🧪 Testing

### Run Tests

```bash
# Backend unit tests (Vitest)
npm run test --workspace=backend

# E2E tests (Playwright)
npm run test:e2e --workspace=e2e

# All tests
npm run test && npm run test:e2e
```

### Test Coverage

- **64 backend tests** - Unit, integration, regression
- **10+ E2E tests** - User workflows, drag-and-drop
- **CI/CD ready** - Tests run on every push

### Test Categories

**Unit Tests:**
- Database operations
- Service functions
- Utility functions

**Integration Tests:**
- API endpoints
- WebSocket handlers
- Git operations

**E2E Tests:**
- First-time user experience
- Project creation
- Ticket creation and movement
- Drag-and-drop behavior
- Agent workflow

---

## 🐛 Troubleshooting

### Common Issues

**"No idle agents available"**
- Create an agent in the Agent Panel
- Default agent auto-created on startup

**"LM Studio generation failed: fetch failed"**
- Check if OpenRouter API key is set
- Verify `useOpenRouter: true` in settings
- Run `npm run reset-settings` if needed

**"Cannot pull with rebase: You have unstaged changes"**
- Agent now auto-stashes local changes
- Should resolve automatically

**"Ticket disappears when clicked"**
- Click the metadata area (bottom) to edit
- Title/description area is for dragging

**"Welcome screen won't go away"**
- Create at least one project
- Database may be corrupted - run `npm run reset-settings`

**"Projects not loading on refresh"**
- Check database exists at `kanban.db` (project root)
- Verify `projects` table exists: `sqlite3 kanban.db "SELECT name FROM sqlite_master WHERE type='table';"`

### Debug Mode

**Backend logs:**
```bash
# Start backend with verbose logging
npm run dev:backend
```

**Frontend console:**
- Open DevTools (F12)
- Check Console tab for errors
- Network tab for API calls

**Database inspection:**
```bash
# View all tables
sqlite3 kanban.db ".tables"

# View settings
sqlite3 kanban.db "SELECT * FROM settings;"

# View projects
sqlite3 kanban.db "SELECT * FROM projects;"
```

---

## 📚 Additional Documentation

- **[SETUP.md](./SETUP.md)** - Detailed installation and configuration
- **[TESTING.md](./TESTING.md)** - Complete testing guide
- **[.github/CI.md](./.github/CI.md)** - CI/CD configuration

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test && npm run test:e2e`
5. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎯 Quick Reference

### Keyboard Shortcuts
- **N** - New ticket (when focused on board)
- **Escape** - Close modal
- **F5** - Refresh board

### Default Values
- **AI Provider**: OpenRouter (enabled by default)
- **Model**: `openrouter/free`
- **Git Remote**: `origin`
- **Test Command**: `npm test`
- **Test Timeout**: `60000ms`

### File Locations
- **Database**: `kanban.db` (project root)
- **Projects**: `Projects/{project-name}/`
- **Environment**: `.env` (project root)
- **Logs**: Console output

### Reset Commands
- **Reset settings only**: `npm run reset-settings`
- **Factory reset (all data)**: `npm run reset-all`

### Support
- Check [Troubleshooting](#-troubleshooting) section
- Review [SETUP.md](./SETUP.md) for detailed setup
- Inspect browser console for frontend errors
- Check backend logs for server errors
