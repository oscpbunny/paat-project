/**
 * PAAT - AI Personal Assistant Agent Tool
 * Electron Development Script
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { URL } = require('url');

// Configuration
const REACT_DEV_SERVER_PORT = 3000;
const ELECTRON_WAIT_TIME = 3000; // Wait 3 seconds for React dev server to start

// Paths
const projectRoot = path.resolve(__dirname, '..');
const electronMain = path.join(projectRoot, 'dist', 'main', 'main.js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function logReact(message) {
  log(colors.cyan, 'React', message);
}

function logElectron(message) {
  log(colors.magenta, 'Electron', message);
}

function logScript(message) {
  log(colors.green, 'Dev Script', message);
}

function logError(prefix, message) {
  log(colors.red, prefix, message);
}

// Check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.on('error', () => {
      resolve(false);
    });
    
    server.on('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, 'localhost');
  });
}

// Wait for React dev server to be ready
async function waitForReactServer(port, maxAttempts = 30) {
  const url = `http://localhost:${port}`;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        logScript(`React dev server is ready at ${url}`);
        return true;
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    logScript(`Waiting for React dev server... (${i + 1}/${maxAttempts})`);
  }
  
  return false;
}

// Build TypeScript for main process
async function buildMainProcess() {
  logScript('Building main process TypeScript...');
  
  return new Promise((resolve, reject) => {
    const tscProcess = spawn('npx', ['tsc', '--project', 'tsconfig.main.json'], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    tscProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    tscProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    tscProcess.on('close', (code) => {
      if (code === 0) {
        logScript('Main process built successfully');
        resolve();
      } else {
        logError('TypeScript', 'Main process build failed:');
        if (errorOutput) console.error(errorOutput);
        if (output) console.log(output);
        reject(new Error(`TypeScript build failed with code ${code}`));
      }
    });
  });
}

// Start React development server
function startReactDevServer() {
  logReact('Starting React development server...');
  
  return new Promise((resolve, reject) => {
    const reactProcess = spawn('npm', ['start'], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        PORT: REACT_DEV_SERVER_PORT.toString(),
        BROWSER: 'none', // Don't open browser
        GENERATE_SOURCEMAP: 'true'
      }
    });
    
    reactProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('webpack compiled') || output.includes('Local:')) {
        logReact('Development server ready');
        resolve(reactProcess);
      }
      // Log React output with prefix
      output.split('\n').filter(line => line.trim()).forEach(line => {
        logReact(line);
      });
    });
    
    reactProcess.stderr.on('data', (data) => {
      const output = data.toString();
      output.split('\n').filter(line => line.trim()).forEach(line => {
        logReact(`Error: ${line}`);
      });
    });
    
    reactProcess.on('close', (code) => {
      if (code !== 0) {
        logError('React', `Development server exited with code ${code}`);
        reject(new Error(`React dev server failed with code ${code}`));
      }
    });
    
    reactProcess.on('error', (error) => {
      logError('React', `Failed to start development server: ${error.message}`);
      reject(error);
    });
  });
}

// Start Electron
function startElectron() {
  logElectron('Starting Electron...');
  
  const electronProcess = spawn('npx', ['electron', '.'], {
    cwd: projectRoot,
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_IS_DEV: 'true'
    }
  });
  
  electronProcess.stdout.on('data', (data) => {
    const output = data.toString();
    output.split('\n').filter(line => line.trim()).forEach(line => {
      logElectron(line);
    });
  });
  
  electronProcess.stderr.on('data', (data) => {
    const output = data.toString();
    output.split('\n').filter(line => line.trim()).forEach(line => {
      logElectron(`Error: ${line}`);
    });
  });
  
  electronProcess.on('close', (code) => {
    logElectron(`Electron exited with code ${code}`);
    process.exit(code);
  });
  
  electronProcess.on('error', (error) => {
    logError('Electron', `Failed to start: ${error.message}`);
    process.exit(1);
  });
  
  return electronProcess;
}

// Main development function
async function startDevelopment() {
  try {
    logScript('Starting PAAT development environment...');
    
    // Check if React dev server port is available
    const portAvailable = await isPortAvailable(REACT_DEV_SERVER_PORT);
    if (!portAvailable) {
      logError('Dev Script', `Port ${REACT_DEV_SERVER_PORT} is already in use`);
      process.exit(1);
    }
    
    // Build main process
    await buildMainProcess();
    
    // Start React dev server
    const reactProcess = await startReactDevServer();
    
    // Wait for React server to be fully ready
    const serverReady = await waitForReactServer(REACT_DEV_SERVER_PORT);
    if (!serverReady) {
      logError('Dev Script', 'React dev server failed to start properly');
      reactProcess.kill();
      process.exit(1);
    }
    
    // Small delay to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start Electron
    const electronProcess = startElectron();
    
    // Handle cleanup on exit
    process.on('SIGINT', () => {
      logScript('Shutting down development environment...');
      reactProcess.kill();
      electronProcess.kill();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logScript('Shutting down development environment...');
      reactProcess.kill();
      electronProcess.kill();
      process.exit(0);
    });
    
    logScript('Development environment started successfully!');
    logScript(`React: http://localhost:${REACT_DEV_SERVER_PORT}`);
    logScript('Electron: Running with hot reload');
    
  } catch (error) {
    logError('Dev Script', `Failed to start development environment: ${error.message}`);
    process.exit(1);
  }
}

// Start the development environment
startDevelopment();
