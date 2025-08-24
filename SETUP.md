# PAAT Development Setup Guide

This guide will help you set up the PAAT development environment and get the application running.

## Prerequisites

Make sure you have the following installed on your system:

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** for version control

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

**Core Dependencies:**
- React 18 + React DOM
- TypeScript for type safety
- Electron for desktop app functionality
- Material-UI (MUI) for UI components
- Zustand for state management
- Framer Motion for animations

**Development Dependencies:**
- TypeScript compiler and types
- ESLint for code linting
- Electron Builder for packaging
- Various build tools and utilities

### Build Process
The `npm run build:electron` command:
1. Compiles TypeScript files in `src/main/` (Electron main process)
2. Compiles TypeScript files in `src/preload/` (Electron preload scripts)
3. Outputs compiled files to `dist/` directory

### Development Server
The `npm run electron:dev` command:
1. Builds the main and preload processes
2. Starts React development server on port 3000
3. Waits for React to be ready
4. Launches Electron with hot reload enabled

## Project Structure After Setup

```
paat-project/
├── node_modules/           # Installed dependencies
├── dist/                   # Compiled TypeScript output
│   ├── main/               # Compiled Electron main process
│   └── preload/            # Compiled Electron preload scripts
├── src/                    # Source code
│   ├── main/               # Electron main process (TypeScript)
│   ├── preload/            # Electron preload scripts (TypeScript)
│   └── renderer/           # React application (TypeScript)
├── public/                 # Static assets for React
└── build/                  # React production build (after npm run build)
```

## Development Commands

| Command | Description | Status |
|---------|-------------|--------|
| `npm test` | Run comprehensive test suite | ⚠️ Partial Pass |
| `npm test -- --verbose` | Run tests with detailed output | ⚠️ Partial Pass |
| `npm test -- --coverage` | Run tests with coverage report | 🔄 In Progress |
| `npm run electron:dev` | Start full development environment | ✅ Working |
| `npm start` | Start React dev server only | ✅ Working |
| `npm run build:main` | Build Electron main process | ✅ Working |
| `npm run build:preload` | Build Electron preload scripts | ✅ Working |
| `npm run build:electron` | Build all Electron processes | ✅ Working |
| `npm run build` | Build React application (343.97 kB) | ✅ Working |
| `npm run build:all` | Build everything | ✅ Working |
| `npm run type-check` | Check TypeScript types | ✅ Working |
| `npm run lint` | Run ESLint | ✅ Working |
| `npm run lint:fix` | Auto-fix ESLint issues | ✅ Working |
| `npm run clean` | Clean build artifacts | ✅ Working |

## Development Workflow

1. **Start Development**: Use `npm run electron:dev` to start the complete development environment
2. **Code Changes**: Edit files in `src/` directory
3. **Hot Reload**: React changes are reflected automatically
4. **Electron Changes**: Main/preload process changes require restart
5. **Type Checking**: Run `npm run type-check` to verify types
6. **Linting**: Run `npm run lint` to check code style

## Architecture Overview

### Electron Architecture
- **Main Process** (`src/main/main.ts`): Controls application lifecycle, creates windows
- **Renderer Process** (`src/renderer/`): React application running in Electron window
- **Preload Scripts** (`src/preload/preload.ts`): Secure bridge between main and renderer

### React Architecture
- **App Component** (`src/renderer/App.tsx`): Main application component
- **Components** (`src/renderer/components/`): Reusable UI components
- **Stores** (`src/renderer/stores/`): Zustand state management
- **Styles** (`assets/styles/`): Global CSS and design system

### State Management
- **App Store** (`appStore.ts`): Global application state
- **Theme Store** (`themeStore.ts`): UI theme and appearance settings

## Testing Setup and Workflow

### Running Tests

```bash
# Run all tests (current status: partial pass)
npm test

# Run tests with detailed output
npm test -- --verbose

# Run specific test file
npm test TaskBreakdownService.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage (when working)
npm test -- --coverage --watchAll=false
```

### Test Status Summary

**✅ Passing Tests:**
- TaskBreakdownService: 14/14 tests (100%)
  - AI response parsing
  - Error handling and fallbacks
  - Validation methods
  - Complexity analysis

**⚠️ Issues to Fix:**
- VamshErrorHandlingService: 7/12 tests (retry logic)
- Database Service: Electron app context issues
- VamshIntegrationService: Mocking problems
- React Components: Router hooks and imports

### Testing Best Practices

1. **Service Tests:** Located in `src/services/__tests__/`
2. **Component Tests:** Located in `src/__tests__/`
3. **Mock Strategy:** External dependencies are mocked
4. **Test Data:** Realistic mock data for AI responses
5. **Error Scenarios:** Both success and failure paths tested

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

## Need Help?

- Check the main [README.md](README.md) for project overview
- Review [docs/specification.md](docs/specification.md) for technical details
- Check [docs/ui-design-system.md](docs/ui-design-system.md) for UI guidelines
- Look at the progress tracking in `progress/` directory

---

**Happy coding!** 🚀
