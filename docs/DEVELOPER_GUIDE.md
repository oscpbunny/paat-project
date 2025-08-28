# PAAT Developer Documentation
**AI Personal Assistant Agent Tool - Developer Guide**

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [API Reference](#api-reference)
5. [Component Library](#component-library)
6. [State Management](#state-management)
7. [Database Schema](#database-schema)
8. [AI Integration](#ai-integration)
9. [Testing Guidelines](#testing-guidelines)
10. [Contributing Guidelines](#contributing-guidelines)
11. [Build and Deployment](#build-and-deployment)

## Architecture Overview

PAAT is built with a modern, scalable architecture designed for performance and maintainability.

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│             Frontend (React)            │
├─────────────────────────────────────────┤
│          State Management (Zustand)     │
├─────────────────────────────────────────┤
│         Component Layer (MUI)           │
├─────────────────────────────────────────┤
│           Service Layer                  │
├─────────────────────────────────────────┤
│      Database Layer (SQLite)            │
├─────────────────────────────────────────┤
│       AI Integration Layer              │
├─────────────────────────────────────────┤
│    Electron Main Process                │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18.2.0 with TypeScript 4.9.5
- **Desktop Framework**: Electron 25.3.1
- **UI Library**: Material-UI 5.14.1
- **State Management**: Zustand 4.4.1
- **Routing**: React Router 6.30.1
- **Database**: SQLite3 5.1.6
- **AI Integration**: Ollama HTTP Client, Vamsh API
- **File Monitoring**: Chokidar 3.5.3
- **Build Tool**: Create React App with custom webpack config

### Design Patterns

1. **Service Layer Pattern**: All business logic is encapsulated in services
2. **Observer Pattern**: Used for real-time updates and file monitoring
3. **Factory Pattern**: AI service creation and model selection
4. **Singleton Pattern**: Database connections and global state management
5. **Command Pattern**: AI service requests and task execution

## Development Setup

### Prerequisites

- Node.js 18.0+ (LTS recommended)
- npm 9.0+ or yarn 1.22+
- Git 2.30+
- SQLite3 (included in Node.js)
- Ollama (for AI features)

### Environment Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/paat-project.git
   cd paat-project
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Configure environment variables
   REACT_APP_VERSION=3.0.0
   REACT_APP_OLLAMA_URL=http://localhost:11434
   REACT_APP_VAMSH_URL=http://localhost:8000
   ELECTRON_DEV=true
   ```

4. **Database Setup**
   ```bash
   # Initialize SQLite database
   npm run db:init
   
   # Run migrations
   npm run db:migrate
   
   # Seed development data (optional)
   npm run db:seed
   ```

### Development Scripts

```bash
# Start development server
npm start

# Run Electron in development mode
npm run electron:dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check

# Bundle analysis
npm run analyze

# Database operations
npm run db:migrate
npm run db:seed
npm run db:reset
```

## Project Structure

```
paat-project/
├── public/                     # Static assets
│   ├── electron.js            # Electron main process
│   └── icons/                 # Application icons
├── src/
│   ├── components/            # React components
│   │   ├── common/           # Shared components
│   │   ├── Dashboard/        # Dashboard components
│   │   ├── Projects/         # Project management
│   │   ├── Tasks/            # Task management
│   │   ├── Settings/         # Settings components
│   │   └── ErrorBoundary/    # Error handling
│   ├── hooks/                # Custom React hooks
│   ├── services/             # Business logic services
│   │   ├── api/             # API clients
│   │   ├── database/        # Database operations
│   │   ├── ai/              # AI service integration
│   │   └── monitoring/      # File and process monitoring
│   ├── store/               # Zustand state stores
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── styles/              # Global styles and themes
│   └── constants/           # Application constants
├── docs/                    # Documentation
├── scripts/                 # Build and deployment scripts
├── tests/                   # Test files
├── electron/                # Electron-specific code
└── dist/                    # Build output
```

### Key Directories

#### `/src/components/`
Organized by feature with shared components in `/common/`:

- **Dashboard**: Main dashboard, project overview, quick actions
- **Projects**: Project creation, editing, templates, analytics
- **Tasks**: Kanban board, task cards, task details, time tracking
- **Settings**: Configuration panels, AI service setup, preferences
- **ErrorBoundary**: Global error handling and recovery

#### `/src/services/`
Business logic layer:

- **ProjectService**: CRUD operations for projects
- **TaskService**: Task management and workflow
- **AIService**: Ollama and Vamsh AI integration
- **DatabaseService**: SQLite operations and migrations
- **FileMonitorService**: Real-time file watching
- **ExportService**: Data export and reporting

#### `/src/store/`
Zustand state management:

- **projectStore**: Project data and operations
- **taskStore**: Task state and Kanban board
- **settingsStore**: Application settings and preferences
- **aiStore**: AI service status and responses
- **uiStore**: UI state, modals, notifications

## API Reference

### Core Services

#### ProjectService

```typescript
interface ProjectService {
  // Project CRUD operations
  createProject(project: CreateProjectRequest): Promise<Project>;
  getProject(id: string): Promise<Project>;
  updateProject(id: string, updates: UpdateProjectRequest): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Project queries
  getAllProjects(): Promise<Project[]>;
  getProjectsByStatus(status: ProjectStatus): Promise<Project[]>;
  searchProjects(query: string): Promise<Project[]>;
  
  // Project analytics
  getProjectStats(id: string): Promise<ProjectStats>;
  getProjectActivity(id: string): Promise<ActivityEvent[]>;
}
```

#### TaskService

```typescript
interface TaskService {
  // Task CRUD operations
  createTask(task: CreateTaskRequest): Promise<Task>;
  updateTask(id: string, updates: UpdateTaskRequest): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Task operations
  moveTask(id: string, newStatus: TaskStatus): Promise<Task>;
  assignTask(id: string, assigneeId: string): Promise<Task>;
  addSubtask(parentId: string, subtask: CreateTaskRequest): Promise<Task>;
  
  // Task queries
  getTasksByProject(projectId: string): Promise<Task[]>;
  getTasksByStatus(status: TaskStatus): Promise<Task[]>;
  getOverdueTasks(): Promise<Task[]>;
}
```

#### AIService

```typescript
interface AIService {
  // Ollama integration
  generateProjectAnalysis(project: Project): Promise<AIAnalysis>;
  breakdownTask(task: Task): Promise<Task[]>;
  reviewCode(files: FileContent[]): Promise<CodeReview>;
  
  // Vamsh integration
  executeVamshTask(request: VamshTaskRequest): Promise<VamshExecution>;
  getVamshStatus(): Promise<VamshStatus>;
  monitorVamshProgress(executionId: string): Observable<VamshProgress>;
  
  // Model management
  listAvailableModels(): Promise<AIModel[]>;
  switchModel(modelId: string): Promise<void>;
  getModelStatus(modelId: string): Promise<ModelStatus>;
}
```

### Database Schema

#### Core Tables

```sql
-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  settings TEXT, -- JSON field
  metadata TEXT  -- JSON field
);

-- Tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  parent_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  due_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT, -- JSON field
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (parent_id) REFERENCES tasks(id)
);

-- AI interactions table
CREATE TABLE ai_interactions (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  task_id TEXT,
  service TEXT NOT NULL, -- 'ollama' or 'vamsh'
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  duration INTEGER, -- milliseconds
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- File monitoring table
CREATE TABLE file_changes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  change_type TEXT NOT NULL, -- 'created', 'modified', 'deleted'
  old_content TEXT,
  new_content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

## Component Library

### Design System

PAAT uses a custom Material-UI theme with consistent design tokens:

```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    // ... additional colors
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    // ... typography scale
  },
  components: {
    // Custom component overrides
  },
});
```

### Core Components

#### ProjectCard

```typescript
interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onOpen: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onEdit, 
  onDelete, 
  onOpen 
}) => {
  // Implementation
};
```

#### KanbanBoard

```typescript
interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
  onTaskEdit: (task: Task) => void;
  onTaskCreate: (status: TaskStatus) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  onTaskMove, 
  onTaskEdit, 
  onTaskCreate 
}) => {
  // Implementation with react-beautiful-dnd
};
```

#### AIStatusIndicator

```typescript
interface AIStatusIndicatorProps {
  service: 'ollama' | 'vamsh';
  status: 'connected' | 'disconnected' | 'error';
  onRetry?: () => void;
}

const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({ 
  service, 
  status, 
  onRetry 
}) => {
  // Implementation
};
```

### Custom Hooks

#### useProjects

```typescript
const useProjects = () => {
  const projects = useProjectStore(state => state.projects);
  const loading = useProjectStore(state => state.loading);
  
  const createProject = useCallback(async (project: CreateProjectRequest) => {
    return projectStore.createProject(project);
  }, []);
  
  const updateProject = useCallback(async (id: string, updates: UpdateProjectRequest) => {
    return projectStore.updateProject(id, updates);
  }, []);
  
  return {
    projects,
    loading,
    createProject,
    updateProject,
    // ... other methods
  };
};
```

#### useAI

```typescript
const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const analyzeProject = useCallback(async (project: Project) => {
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await aiService.generateProjectAnalysis(project);
      return analysis;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    loading,
    error,
    analyzeProject,
    // ... other AI methods
  };
};
```

## State Management

PAAT uses Zustand for state management with TypeScript support:

### Project Store

```typescript
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
}

interface ProjectActions {
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
}

const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  
  setProjects: (projects) => set({ projects }),
  
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project]
  })),
  
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id)
  })),
  
  setCurrentProject: (project) => set({ currentProject: project }),
  
  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await projectService.getAllProjects();
      set({ projects, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
```

### Middleware and Persistence

```typescript
// Persist middleware for settings
const useSettingsStore = create(
  persist<SettingsState & SettingsActions>(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: 'paat-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Logger middleware for debugging
const useProjectStore = create(
  logger<ProjectState & ProjectActions>(
    (set, get) => ({
      // ... store implementation
    }),
    'project-store'
  )
);
```

## AI Integration

### Ollama Integration

PAAT integrates with local Ollama instances for privacy-first AI features:

```typescript
class OllamaService {
  private baseUrl: string;
  private httpClient: AxiosInstance;
  
  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
    });
  }
  
  async generateCompletion(prompt: string, model: string): Promise<string> {
    const response = await this.httpClient.post('/api/generate', {
      model,
      prompt,
      stream: false,
    });
    
    return response.data.response;
  }
  
  async analyzeProject(project: Project): Promise<ProjectAnalysis> {
    const prompt = this.buildProjectAnalysisPrompt(project);
    const response = await this.generateCompletion(prompt, 'qwen2.5:7b');
    
    return this.parseProjectAnalysis(response);
  }
  
  private buildProjectAnalysisPrompt(project: Project): string {
    return `
Analyze the following software project:

Name: ${project.name}
Type: ${project.type}
Description: ${project.description}

Please provide:
1. Architecture recommendations
2. Technology stack assessment
3. Potential risks and challenges
4. Suggested next steps
5. Task breakdown for implementation

Respond in JSON format with the following structure:
{
  "architecture": "...",
  "technologies": ["..."],
  "risks": ["..."],
  "nextSteps": ["..."],
  "tasks": [{"title": "...", "description": "...", "priority": "..."}]
}
`;
  }
  
  private parseProjectAnalysis(response: string): ProjectAnalysis {
    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error('Failed to parse AI response');
    }
  }
}
```

### Vamsh AI Integration

For autonomous development capabilities:

```typescript
class VamshService {
  private baseUrl: string;
  private wsUrl: string;
  private socket: Socket | null = null;
  
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.wsUrl = baseUrl.replace('http', 'ws');
  }
  
  async createProject(request: VamshProjectRequest): Promise<VamshProject> {
    const response = await axios.post(`${this.baseUrl}/api/projects`, request);
    return response.data;
  }
  
  async executeTask(projectId: string, task: string): Promise<VamshExecution> {
    const response = await axios.post(`${this.baseUrl}/api/projects/${projectId}/execute`, {
      task,
    });
    
    return response.data;
  }
  
  monitorExecution(executionId: string): Observable<VamshProgress> {
    return new Observable(subscriber => {
      this.socket = io(this.wsUrl);
      
      this.socket.on('connect', () => {
        this.socket!.emit('subscribe', { executionId });
      });
      
      this.socket.on('progress', (data: VamshProgress) => {
        subscriber.next(data);
      });
      
      this.socket.on('complete', (data: VamshResult) => {
        subscriber.next({ ...data, status: 'complete' });
        subscriber.complete();
      });
      
      this.socket.on('error', (error: any) => {
        subscriber.error(error);
      });
      
      return () => {
        this.socket?.disconnect();
      };
    });
  }
}
```

## Testing Guidelines

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── components/         # Component tests
│   ├── services/          # Service tests
│   ├── hooks/             # Hook tests
│   └── utils/             # Utility tests
├── integration/            # Integration tests
│   ├── api/               # API integration tests
│   └── database/          # Database tests
├── e2e/                   # End-to-end tests
│   ├── specs/             # Test specifications
│   └── fixtures/          # Test data
└── __mocks__/             # Mock implementations
```

### Testing Patterns

#### Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectCard } from '../ProjectCard';

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project',
    type: 'web',
    status: 'active',
    // ... other properties
  };
  
  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onOpen: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders project information correctly', () => {
    render(<ProjectCard project={mockProject} {...mockHandlers} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('web')).toBeInTheDocument();
  });
  
  it('calls onOpen when card is clicked', () => {
    render(<ProjectCard project={mockProject} {...mockHandlers} />);
    
    fireEvent.click(screen.getByText('Test Project'));
    
    expect(mockHandlers.onOpen).toHaveBeenCalledWith('1');
  });
  
  it('shows edit and delete options in menu', async () => {
    render(<ProjectCard project={mockProject} {...mockHandlers} />);
    
    const menuButton = screen.getByLabelText('More options');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });
});
```

#### Service Testing

```typescript
import { ProjectService } from '../ProjectService';
import { DatabaseService } from '../DatabaseService';

jest.mock('../DatabaseService');

describe('ProjectService', () => {
  let projectService: ProjectService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  
  beforeEach(() => {
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>;
    projectService = new ProjectService(mockDatabaseService);
  });
  
  describe('createProject', () => {
    it('creates a project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        type: 'web',
        description: 'A test project',
      };
      
      const expectedProject = {
        id: expect.any(String),
        ...projectData,
        status: 'active',
        created_at: expect.any(Date),
      };
      
      mockDatabaseService.insert.mockResolvedValue(expectedProject);
      
      const result = await projectService.createProject(projectData);
      
      expect(mockDatabaseService.insert).toHaveBeenCalledWith(
        'projects',
        expect.objectContaining(projectData)
      );
      expect(result).toEqual(expectedProject);
    });
    
    it('throws error for invalid project data', async () => {
      const invalidData = { name: '' }; // Missing required fields
      
      await expect(projectService.createProject(invalidData)).rejects.toThrow(
        'Project name is required'
      );
    });
  });
});
```

#### Integration Testing

```typescript
import { app } from '../app';
import { DatabaseService } from '../services/DatabaseService';
import request from 'supertest';

describe('Project API Integration', () => {
  let database: DatabaseService;
  
  beforeAll(async () => {
    database = new DatabaseService(':memory:'); // In-memory database for testing
    await database.initialize();
  });
  
  afterAll(async () => {
    await database.close();
  });
  
  beforeEach(async () => {
    await database.clear(); // Clear data between tests
  });
  
  describe('POST /api/projects', () => {
    it('creates a new project', async () => {
      const projectData = {
        name: 'Integration Test Project',
        type: 'web',
        description: 'A project for integration testing',
      };
      
      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...projectData,
        status: 'active',
      });
    });
  });
});
```

### Test Configuration

#### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}',
  ],
};
```

#### Test Setup

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock Electron APIs
global.require = jest.fn();
global.module = { exports: {} };

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
```

## Contributing Guidelines

### Code Style

PAAT follows strict TypeScript and ESLint configurations:

```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react-hooks/exhaustive-deps": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Commit Guidelines

Follow Conventional Commits specification:

```bash
# Format: <type>(<scope>): <description>

feat(projects): add project template selection
fix(ai): resolve Ollama connection timeout issue
docs(readme): update installation instructions
style(components): fix Material-UI theme consistency
refactor(database): optimize project queries
test(services): add unit tests for TaskService
chore(deps): update dependencies to latest versions
```

### Pull Request Process

1. **Branch Naming**
   ```bash
   # Feature branches
   feature/project-templates
   feature/ai-code-review
   
   # Bug fix branches
   fix/ollama-connection-timeout
   fix/task-drag-drop-issue
   
   # Improvement branches
   improve/database-performance
   improve/ui-responsiveness
   ```

2. **Pull Request Template**
   ```markdown
   ## Description
   Brief description of changes made.
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed
   
   ## Screenshots (if applicable)
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No breaking changes (or marked as breaking)
   ```

3. **Review Process**
   - All PRs require at least one review
   - CI/CD checks must pass
   - Code coverage must not decrease
   - Documentation must be updated for new features

### Development Workflow

1. **Setup Development Environment**
   ```bash
   git clone https://github.com/your-org/paat-project.git
   cd paat-project
   npm install
   npm run db:init
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Development Process**
   ```bash
   # Start development server
   npm start
   
   # Run tests in watch mode
   npm run test:watch
   
   # Type checking
   npm run type-check
   
   # Linting
   npm run lint:fix
   ```

4. **Before Committing**
   ```bash
   # Run full test suite
   npm test
   
   # Build to ensure no build errors
   npm run build
   
   # Format code
   npm run format
   ```

5. **Submit Pull Request**
   ```bash
   git push origin feature/your-feature-name
   # Create PR through GitHub interface
   ```

## Build and Deployment

### Development Build

```bash
# Development mode
npm start                    # Start React dev server
npm run electron:dev        # Start Electron in development

# Development with debugging
DEBUG=* npm start           # Enable debug logging
ELECTRON_DEV=true npm run electron:dev
```

### Production Build

```bash
# Build React application
npm run build

# Build Electron application
npm run electron:build

# Build for all platforms
npm run dist:all

# Build for specific platforms
npm run dist:win            # Windows
npm run dist:mac            # macOS
npm run dist:linux          # Linux
```

### Electron Builder Configuration

```json
// electron-builder configuration
{
  "appId": "com.paat.app",
  "productName": "PAAT",
  "directories": {
    "output": "dist"
  },
  "files": [
    "build/**/*",
    "public/electron.js",
    "node_modules/**/*"
  ],
  "win": {
    "target": "nsis",
    "icon": "public/icons/icon.ico"
  },
  "mac": {
    "target": "dmg",
    "icon": "public/icons/icon.icns"
  },
  "linux": {
    "target": [
      { "target": "deb", "arch": ["x64"] },
      { "target": "rpm", "arch": ["x64"] }
    ],
    "icon": "public/icons/icon.png"
  }
}
```

### CI/CD Pipeline

GitHub Actions workflow example:

```yaml
# .github/workflows/build.yml
name: Build and Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build
      - run: npm run type-check
      - run: npm run lint

  build:
    needs: test
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run dist
      - uses: actions/upload-artifact@v3
        with:
          name: dist-${{ matrix.os }}
          path: dist/
```

### Release Process

1. **Version Management**
   ```bash
   # Update version
   npm version patch|minor|major
   
   # Create release tag
   git tag v3.0.0
   git push origin v3.0.0
   ```

2. **Automated Release**
   - CI/CD automatically builds releases for tagged commits
   - Artifacts are uploaded to GitHub Releases
   - Release notes are generated from commit messages

3. **Manual Release Steps**
   ```bash
   # Build for all platforms
   npm run dist:all
   
   # Create checksums
   shasum -a 256 dist/*.exe dist/*.dmg dist/*.deb dist/*.rpm > checksums.txt
   
   # Upload to release platforms
   # - GitHub Releases
   # - Microsoft Store (Windows)
   # - Mac App Store (macOS)
   # - Snap Store (Linux)
   ```

---

## API Documentation

### REST API Endpoints

#### Projects

```
GET    /api/projects           # List all projects
POST   /api/projects           # Create new project
GET    /api/projects/:id       # Get project details
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Delete project
GET    /api/projects/:id/stats # Get project statistics
```

#### Tasks

```
GET    /api/projects/:id/tasks        # List project tasks
POST   /api/projects/:id/tasks        # Create new task
PUT    /api/tasks/:id                 # Update task
DELETE /api/tasks/:id                 # Delete task
POST   /api/tasks/:id/move           # Move task to different status
```

#### AI Services

```
POST   /api/ai/analyze                # Analyze project with AI
POST   /api/ai/breakdown              # Break down task with AI
POST   /api/ai/review                 # Review code with AI
GET    /api/ai/models                 # List available AI models
POST   /api/ai/models/:id/switch      # Switch to different model
```

---

*This developer guide covers the technical aspects of PAAT. For user-facing features and instructions, please refer to the User Manual.*

**Version**: 3.0.0  
**Last Updated**: August 2025  
**Maintainers**: PAAT Development Team
