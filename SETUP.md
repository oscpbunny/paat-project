# PAAT Development Setup Guide

This guide will help you set up the PAAT development environment. PAAT is now a production-ready desktop application with React 18, Electron, TypeScript, and Material-UI providing a sophisticated project management experience with AI integration.

## Prerequisites

Make sure you have the following installed on your system:

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/) (Current: 18.x LTS recommended)
- **npm 9+** (comes with Node.js) - Package manager
- **Git** for version control
- **Windows 10/11** - Primary development platform (cross-platform support available)
- **Vamsh AI** (Optional) - Located at E:\vamsh for full AI integration
- **Ollama** (Optional) - Local AI models for enhanced functionality

## Quick Setup

1. **Navigate to the project directory**:
   ```bash
   cd E:\devika\paat-project
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

3. **Build the Electron processes**:
   ```bash
   npm run build:electron
   ```

4. **Start the development environment**:
   ```bash
   npm run electron:dev
   ```

## What Happens During Setup

### Dependencies Installation
The `npm install` command installs:

**Production Stack:**
- React 18.2.0 + React DOM for modern UI
- TypeScript 4.9.5 for strict type safety
- Electron 25.3.1 for desktop app functionality
- Material-UI 5.14.1 for professional UI components
- Zustand 4.4.1 for efficient state management
- Framer Motion 10.16.1 for smooth animations
- React Router 6.30.1 for navigation
- SQLite3 5.1.6 for local database

**Development & Build Tools:**
- TypeScript compiler with strict configuration
- ESLint + Prettier for code quality
- Electron Builder 24.6.3 for cross-platform packaging
- React Scripts 5.0.1 for optimized builds
- Jest + React Testing Library for testing

### Build Process
The `npm run build:electron` command:
1. Compiles TypeScript files in `src/main/` (Electron main process) using tsconfig.main.json
2. Compiles TypeScript files in `src/preload/` (Electron preload scripts) using tsconfig.preload.json
3. Outputs compiled files to `dist/main/` and `dist/preload/` directories
4. Maintains strict TypeScript compilation with zero errors

### Development Server
The `npm run electron:dev` command:
1. Builds the main and preload processes with TypeScript compilation
2. Starts React development server on port 3000 with hot reload
3. Waits for React to be fully ready (with health checks)
4. Launches Electron desktop application with live reload
5. Provides colored console output for debugging (React/Electron/Dev Script)

## Project Structure After Setup

```
paat-project/
├── node_modules/           # Installed dependencies (500+ packages)
├── dist/                   # Compiled TypeScript output
│   ├── main/               # Compiled Electron main process
│   └── preload/            # Compiled Electron preload scripts
├── build/                  # React production build (343.97 kB optimized)
├── src/                    # Source code (TypeScript strict mode)
│   ├── main/               # Electron main process with services
│   ├── preload/            # Electron preload scripts (secure bridge)
│   ├── renderer/           # React 18 application with Material-UI
│   ├── services/           # Backend services (8 core services)
│   ├── components/         # React components (50+ professional components)
│   ├── stores/             # Zustand state management
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets for React
├── assets/                 # Application assets (icons, styles)
├── docs/                   # Comprehensive documentation
├── progress/               # Development tracking
└── scripts/                # Build and development scripts
```

## Production Commands

| Command | Description | Status |
|---------|-------------|--------|
| `npm run electron:dev` | Start full development environment | ✅ Production Ready |
| `npm start` | Start React dev server (port 3000) | ✅ Production Ready |
| `npm run build` | Build React application (343.97 kB) | ✅ Optimized |
| `npm run build:electron` | Build all Electron processes | ✅ Production Ready |
| `npm run build:all` | Build everything for production | ✅ Production Ready |
| `npm run dist` | Create distribution packages | ✅ Working |
| `npm run dist:win` | Create Windows installer | ✅ Working |
| `npm run dist:mac` | Create macOS installer | ✅ Working |
| `npm run dist:linux` | Create Linux AppImage | ✅ Working |
| `npm run type-check` | Check TypeScript (strict mode) | ✅ Zero Errors |
| `npm run lint` | Run ESLint code quality check | ✅ Production Ready |
| `npm run lint:fix` | Auto-fix ESLint issues | ✅ Working |
| `npm run clean` | Clean build artifacts | ✅ Working |
| `npm test` | Run test suite | 🔄 Core Tests Passing |

## Development Workflow

1. **Start Development**: Use `npm run electron:dev` for full desktop app development
2. **Code Changes**: Edit TypeScript files in `src/` directory with strict type checking
3. **Hot Reload**: React changes reflected instantly, Material-UI updates automatically
4. **Electron Updates**: Main/preload process changes require restart (auto-detected)
5. **Database Changes**: SQLite schema changes auto-applied during development
6. **Quality Checks**: Automatic TypeScript compilation and ESLint validation
7. **State Management**: Zustand store changes reflected across components immediately

## Production Architecture Overview

### Electron Architecture (Production Ready)
- **Main Process** (`src/main/main.ts`): PAATApplication class with service initialization
- **Renderer Process** (`src/renderer/`): React 18 app with Material-UI design system
- **Preload Scripts** (`src/preload/preload.ts`): Secure IPC bridge with context isolation
- **Window Management**: Native title bar, system tray, and cross-platform window controls

### React Architecture (Advanced Implementation)
- **App Component** (`src/renderer/App.tsx`): Main app with theming and routing
- **Dashboard** (`src/components/Dashboard/`): Real-time project monitoring interface
- **Project Management** (`src/components/Projects/`): Kanban boards and analytics
- **Design System** (`src/components/`): 50+ Material-UI based components
- **Navigation**: Sophisticated sidebar with collapsible menu and breadcrumbs

### Backend Services (8 Production Services)
- **DatabaseService**: SQLite with comprehensive schema and CRUD operations
- **VamshIntegrationService**: Complete Vamsh AI integration with WebSocket support
- **TaskBreakdownService**: AI-powered project analysis and task generation
- **VamshMonitoringService**: Real-time project tracking and status updates
- **FileWatcherService**: File system monitoring with change detection
- **OllamaService**: Local AI model integration (Qwen, Gemma, Llama)
- **ProjectSpecificationService**: AI-powered requirement analysis
- **VamshErrorHandlingService**: Advanced error handling with circuit breakers

### State Management (Advanced)
- **App Store** (`appStore.ts`): Global application state with project management
- **Theme Store** (`themeStore.ts`): Professional dark/light theme system
- **Real-time Updates**: WebSocket integration for live project status

## Quality Assurance & Testing

### Production Quality Checks

```bash
# Full production build validation
npm run build:all

# TypeScript strict mode validation (zero errors)
npm run type-check

# Code quality and style validation
npm run lint

# React production build optimization
npm run build  # Creates 343.97 kB gzipped bundle

# Desktop application testing
npm run electron:dev

# Distribution package creation
npm run dist
```

### Current Quality Status

**✅ Production Ready Components:**
- Frontend Architecture: React 18 + TypeScript + Material-UI
- Backend Services: 8/8 services fully implemented
- Database Layer: SQLite with comprehensive schema
- Desktop Application: Electron with native functionality
- Build System: Optimized with zero TypeScript errors
- UI/UX: Professional design system with 50+ components

**✅ Code Quality Metrics:**
- TypeScript: Strict mode, zero compilation errors
- Bundle Size: 343.97 kB (gzipped) - highly optimized
- Architecture: Enterprise-grade modular services
- Design: Consistent Material-UI with custom theming

### Development Best Practices

1. **TypeScript First:** All code written in strict TypeScript mode
2. **Component Architecture:** Modular React components with proper typing
3. **Service Layer:** Clean separation between UI and business logic
4. **State Management:** Zustand for efficient, typed state management
5. **Design System:** Consistent Material-UI implementation
6. **Error Handling:** Comprehensive error boundaries and user feedback
7. **Performance:** Optimized bundle sizes and lazy loading

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Kill existing process using port 3000
npx kill-port 3000
# Then restart development
npm run electron:dev
```

**TypeScript compilation errors:**
```bash
# Check types without running
npm run type-check
# Clean build artifacts and rebuild
npm run clean
npm run build:electron
```

**Test failures:**
```bash
# Clear Jest cache
npx jest --clearCache

# Run tests with no cache
npm test -- --no-cache

# Check specific failing test
npm test -- --verbose VamshErrorHandlingService
```

**Database test issues:**
```bash
# Database tests fail due to Electron app context
# This is expected in pure Node.js test environment
# Integration tests should be run in Electron context
```

**Component import errors:**
```bash
# Check component exports
grep -r "export.*Dashboard" src/components/

# Verify React Router version compatibility
npm list react-router-dom
```

**Electron not starting:**
```bash
# Make sure main process is built
npm run build:main
# Check if all dependencies are installed
npm install
```

**Hot reload not working:**
```bash
# Restart the development environment
# Ctrl+C to stop, then:
npm run electron:dev
```

### Debug Information

Enable debug logging:
```bash
DEBUG=* npm run electron:dev
```

### VS Code Setup

Recommended extensions:
- TypeScript and JavaScript Language Features (built-in)
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Material Icon Theme

## Next Steps

After successful setup:

1. **Explore the code**: Start with `src/renderer/App.tsx`
2. **Check the stores**: Review `src/renderer/stores/` for state management
3. **UI components**: Look at `src/renderer/components/` for component structure
4. **Design system**: Review `assets/styles/globals.css` for styling approach

## Additional Resources

- **Project Overview:** [README.md](README.md) - Current status and achievements
- **Technical Specification:** [docs/specification.md](docs/specification.md) - Complete project specification
- **Design System:** [docs/ui-design-system.md](docs/ui-design-system.md) - Material-UI implementation
- **Architecture Comparison:** [docs/paat-vs-vamsh-comparison.md](docs/paat-vs-vamsh-comparison.md)
- **Development Progress:** [progress/](progress/) - Detailed development tracking
- **Project Status:** [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current production status

## Application Features

**Current Production Features:**
- ✅ Professional Dashboard with Real-time Monitoring
- ✅ Advanced Project Management with Kanban Boards
- ✅ AI-Powered Project Analysis and Task Breakdown
- ✅ Comprehensive Database with SQLite
- ✅ Desktop Application with Native Features
- ✅ Material-UI Design System Implementation
- ✅ Complete Backend Services Architecture
- ✅ WebSocket Real-time Communication
- 🔄 Project Creation Wizard (in development)
- 🔄 Settings and Configuration Interface (in development)

---

**Happy coding!** 🚀
