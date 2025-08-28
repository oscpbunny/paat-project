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

// Mock Electron app for database service with better path handling
const mockElectronApp = {
  getPath: jest.fn((type: string) => {
    switch (type) {
      case 'userData':
        return process.platform === 'win32' 
          ? 'C:\\Users\\Test\\AppData\\Roaming\\paat-test'
          : '/tmp/paat-test';
      case 'temp':
        return process.platform === 'win32' ? 'C:\\temp' : '/tmp';
      case 'downloads':
        return process.platform === 'win32' ? 'C:\\Users\\Test\\Downloads' : '/tmp/downloads';
      default:
        return '/tmp/paat-test';
    }
  }),
  getName: jest.fn().mockReturnValue('PAAT'),
  getVersion: jest.fn().mockReturnValue('0.1.0-test'),
  isReady: jest.fn().mockReturnValue(true),
  whenReady: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn(),
  on: jest.fn(),
  emit: jest.fn()
};

jest.mock('electron', () => ({
  app: mockElectronApp,
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    once: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    close: jest.fn(),
    focus: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
      openDevTools: jest.fn()
    }
  })),
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
    removeHandler: jest.fn(),
    removeAllListeners: jest.fn()
  },
  ipcRenderer: {
    invoke: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    send: jest.fn(),
    removeAllListeners: jest.fn()
  },
  dialog: {
    showOpenDialog: jest.fn().mockResolvedValue({ canceled: false, filePaths: ['/test/path'] }),
    showSaveDialog: jest.fn().mockResolvedValue({ canceled: false, filePath: '/test/save.txt' })
  }
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

// Mock SQLite3 for testing with better callback handling
const mockSQLiteDatabase: any = {
  run: jest.fn().mockImplementation((sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    if (callback) {
      // Simulate async behavior
      process.nextTick(() => callback.call({ lastID: 1, changes: 1 }));
    }
    return mockSQLiteDatabase;
  }),
  get: jest.fn().mockImplementation((sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    if (callback) {
      process.nextTick(() => callback(null, { id: 1, name: 'Test' }));
    }
  }),
  all: jest.fn().mockImplementation((sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    if (callback) {
      process.nextTick(() => callback(null, []));
    }
  }),
  prepare: jest.fn().mockImplementation(() => ({
    run: mockSQLiteDatabase.run,
    get: mockSQLiteDatabase.get,
    all: mockSQLiteDatabase.all,
    finalize: jest.fn()
  })),
  close: jest.fn().mockImplementation((callback) => {
    if (callback) process.nextTick(callback);
  }),
  exec: jest.fn().mockImplementation((sql, callback) => {
    if (callback) process.nextTick(callback);
  }),
  on: jest.fn()
};

jest.mock('sqlite3', () => ({
  Database: jest.fn().mockImplementation(() => mockSQLiteDatabase),
  OPEN_READWRITE: 1,
  OPEN_CREATE: 4,
  verbose: jest.fn(() => ({
    Database: jest.fn().mockImplementation(() => mockSQLiteDatabase)
  }))
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

// Mock electron-is-dev
jest.mock('electron-is-dev', () => true);

// Mock axios for HTTP requests
jest.mock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
    post: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
    put: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
    delete: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
    create: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
      post: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
      put: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
      delete: jest.fn().mockResolvedValue({ data: {}, status: 200 })
    })
  },
  get: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
  post: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
  put: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
  delete: jest.fn().mockResolvedValue({ data: {}, status: 200 })
}));

// Export test utilities
export { mockElectronApp, mockSQLiteDatabase };
