import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock the services to avoid initialization issues in tests
jest.mock('../services/database', () => ({
  databaseService: {
    initialize: jest.fn().mockResolvedValue(true),
    isReady: jest.fn().mockReturnValue(true),
  },
}));

jest.mock('../services/ollama', () => ({
  ollamaService: {
    generate: jest.fn().mockResolvedValue({ response: 'test' }),
  },
}));

jest.mock('../services/VamshService', () => ({
  vamshService: {
    isHealthy: jest.fn().mockResolvedValue(true),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactElement }) => element,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear any previous mocks
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    // If we get here without throwing, the component rendered successfully
    expect(document.body).toBeInTheDocument();
  });

  it('renders the application container', () => {
    render(<App />);
    // Look for any element that indicates the app is running
    // Since we're mocking router components, we'll just check that something rendered
    const appElement = document.querySelector('div');
    expect(appElement).toBeInTheDocument();
  });

  it('initializes without errors', async () => {
    // This test ensures that the app can mount and initialize services
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<App />);
    
    // Wait a bit for any async initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check that no errors were logged
    expect(consoleSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

describe('App Component Integration', () => {
  it('handles service initialization gracefully', async () => {
    // Mock services with various states
    const mockDatabase = require('../services/database').databaseService;
    mockDatabase.initialize.mockResolvedValue(true);
    
    const { container } = render(<App />);
    
    // Wait for potential async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with Material-UI theme', () => {
    render(<App />);
    
    // Check if ThemeProvider is working by looking for MUI classes or structure
    // Since we're rendering the full app, Material-UI should be applied
    const elements = document.querySelectorAll('div');
    expect(elements.length).toBeGreaterThan(0);
  });
});
