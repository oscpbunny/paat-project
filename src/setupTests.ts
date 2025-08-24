// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock Electron since we're in a web testing environment
Object.defineProperty(window, 'electron', {
  value: {
    ipcRenderer: {
      invoke: jest.fn(),
      on: jest.fn(),
      send: jest.fn(),
    },
  },
  writable: true,
});

// Mock Electron app for database service
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('/tmp/paat-test'),
    getName: jest.fn().mockReturnValue('PAAT'),
    getVersion: jest.fn().mockReturnValue('1.0.0'),
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    send: jest.fn(),
  },
}));

// Mock WebSocket for testing
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
})) as any;

// Mock fetch for HTTP requests
global.fetch = jest.fn();

// Mock window.matchMedia for Material-UI theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock SQLite3 for testing
jest.mock('sqlite3', () => ({
  Database: jest.fn().mockImplementation(() => ({
    run: jest.fn((sql, params, callback) => callback && callback()),
    get: jest.fn((sql, params, callback) => callback && callback(null, {})),
    all: jest.fn((sql, params, callback) => callback && callback(null, [])),
    close: jest.fn((callback) => callback && callback()),
  })),
}));

// Mock node-cron for testing
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
  destroy: jest.fn(),
}));

// Mock react-router-dom for testing
jest.mock('react-router-dom', () => {
  const mockReact = jest.requireActual('react');
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
    useParams: () => ({ projectId: 'test-project-123' }),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    Navigate: ({ to, replace }: { to: string; replace?: boolean }) => 
      mockReact.createElement('div', { 'data-testid': 'mock-navigate', 'data-to': to, 'data-replace': replace }),
  };
});

// Suppress console.error and console.warn in tests unless explicitly needed
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
