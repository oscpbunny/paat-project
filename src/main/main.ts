/**
 * PAAT - AI Personal Assistant Agent Tool
 * Main Electron Process Entry Point
 */

import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';
import isDev from 'electron-is-dev';
import { databaseService } from '../services/database';
import { ollamaService } from '../services/ollama';
import { fileWatcherService } from '../services/fileWatcher';
import VamshService from './services/VamshService';

// Enable live reload for Electron in development
if (isDev) {
  try {
    require('electron-reload')(__dirname, {
      electron: require.resolve('electron'),
      hardResetMethod: 'exit'
    });
  } catch (error) {
    console.warn('Failed to enable electron-reload:', error);
  }
}

// Service instances
const vamshService = new VamshService();

class PAATApplication {
  private mainWindow: BrowserWindow | null = null;
  private isQuitting = false;

  constructor() {
    this.setupApp();
    this.registerEventHandlers();
  }

  private setupApp(): void {
    // App configuration
    app.setName('PAAT - AI Personal Assistant Agent Tool');
    app.setAppUserModelId('com.paat.desktop');

    // Security: Disable node integration in renderer
    app.commandLine.appendSwitch('--disable-features', 'OutOfBlinkCors');
    
    // Handle certificate errors (for local dev)
    if (isDev) {
      app.commandLine.appendSwitch('--ignore-certificate-errors');
      app.commandLine.appendSwitch('--ignore-ssl-errors');
    }
  }

  private registerEventHandlers(): void {
    // App event handlers
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', () => this.onWindowAllClosed());
    app.on('activate', () => this.onActivate());
    app.on('before-quit', async () => { 
      this.isQuitting = true;
      // Cleanup services
      await this.cleanup();
    });

    // IPC handlers
    this.registerIPCHandlers();
  }

  private registerIPCHandlers(): void {
    // System information
    ipcMain.handle('app:getVersion', () => app.getVersion());
    ipcMain.handle('app:getPlatform', () => process.platform);
    
    // Window controls
    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('window:close', () => {
      if (process.platform === 'darwin') {
        this.mainWindow?.hide();
      } else {
        app.quit();
      }
    });

    // File system operations
    ipcMain.handle('dialog:openDirectory', async () => {
      if (!this.mainWindow) return null;
      
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Project Directory'
      });

      return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle('dialog:openFile', async (_, filters?: Electron.FileFilter[]) => {
      if (!this.mainWindow) return null;
      
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openFile'],
        filters: filters || [
          { name: 'All Files', extensions: ['*'] }
        ],
        title: 'Select File'
      });

      return result.canceled ? null : result.filePaths[0];
    });

    // Notification handler
    ipcMain.handle('notification:show', (_, options: { title: string; body: string; }) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('notification:display', options);
      }
    });
  }

  private async onReady(): Promise<void> {
    // Initialize database first
    try {
      await databaseService.initialize();
      console.log('PAAT Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Continue without database for now, but log the error
    }

    // Initialize Ollama service (optional, continue if it fails)
    try {
      await ollamaService.initialize();
      console.log('PAAT Ollama AI service initialized successfully');
    } catch (error) {
      console.warn('Ollama AI service not available:', error instanceof Error ? error.message : String(error));
      console.warn('PAAT will continue without AI features. Make sure Ollama is running at http://localhost:11434');
    }

    // Initialize file watcher service
    try {
      await fileWatcherService.initialize();
      console.log('PAAT File Watcher service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize file watcher service:', error);
    }

    // Initialize Vamsh service (optional, continue if it fails)
    try {
      const connected = await vamshService.connect();
      if (connected) {
        console.log('PAAT Vamsh AI service connected successfully');
      } else {
        console.warn('Failed to connect to Vamsh AI service - it may not be running');
        console.warn('Handoff to Vamsh will not be available. Make sure Vamsh is running at http://localhost:1337');
      }
    } catch (error) {
      console.warn('Vamsh AI service not available:', error instanceof Error ? error.message : String(error));
      console.warn('Handoff to Vamsh will not be available. Make sure Vamsh is running at http://localhost:1337');
    }

    await this.createMainWindow();
    this.setupMenu();
    
    // Focus main window
    if (this.mainWindow) {
      this.mainWindow.focus();
    }
  }

  private async createMainWindow(): Promise<void> {
    // Create the main application window
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1024,
      minHeight: 768,
      show: false, // Don't show until ready
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#1a1a2e',
        symbolColor: '#f8fafc',
        height: 40
      },
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '..', 'preload', 'preload.js'),
        webSecurity: !isDev, // Disable web security in development
        allowRunningInsecureContent: isDev,
        experimentalFeatures: true
      },
      icon: this.getAppIcon(),
      backgroundColor: '#0f0f23', // Match app background
      vibrancy: 'dark', // macOS vibrancy effect
      visualEffectState: 'active'
    });

    // Load the React app
    const startUrl = isDev 
      ? 'http://localhost:3000' 
      : `file://${join(__dirname, '..', '..', '..', 'build', 'index.html')}`;

    await this.mainWindow.loadURL(startUrl);

    // Window event handlers
    this.mainWindow.once('ready-to-show', () => {
      if (!this.mainWindow) return;
      
      this.mainWindow.show();
      
      // Focus the window
      if (isDev) {
        this.mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle window state changes
    this.mainWindow.on('maximize', () => {
      this.mainWindow?.webContents.send('window:state-changed', { maximized: true });
    });

    this.mainWindow.on('unmaximize', () => {
      this.mainWindow?.webContents.send('window:state-changed', { maximized: false });
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private getAppIcon(): string | undefined {
    const iconPath = join(__dirname, '..', '..', 'assets', 'icons');
    
    if (process.platform === 'win32') {
      const winIcon = join(iconPath, 'icon.ico');
      return existsSync(winIcon) ? winIcon : undefined;
    } else if (process.platform === 'darwin') {
      const macIcon = join(iconPath, 'icon.icns');
      return existsSync(macIcon) ? macIcon : undefined;
    } else {
      const linuxIcon = join(iconPath, 'icon.png');
      return existsSync(linuxIcon) ? linuxIcon : undefined;
    }
  }

  private setupMenu(): void {
    if (process.platform === 'darwin') {
      // macOS menu
      const template: Electron.MenuItemConstructorOptions[] = [
        {
          label: 'PAAT',
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        },
        {
          label: 'File',
          submenu: [
            {
              label: 'New Project',
              accelerator: 'CmdOrCtrl+N',
              click: () => {
                this.mainWindow?.webContents.send('menu:new-project');
              }
            },
            {
              label: 'Open Project...',
              accelerator: 'CmdOrCtrl+O',
              click: () => {
                this.mainWindow?.webContents.send('menu:open-project');
              }
            },
            { type: 'separator' },
            {
              label: 'Settings',
              accelerator: 'CmdOrCtrl+,',
              click: () => {
                this.mainWindow?.webContents.send('menu:open-settings');
              }
            }
          ]
        },
        {
          label: 'Edit',
          submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' }
          ]
        },
        {
          label: 'View',
          submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
          ]
        },
        {
          label: 'Window',
          submenu: [
            { role: 'minimize' },
            { role: 'close' }
          ]
        }
      ];

      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    } else {
      // Windows/Linux - no menu bar for minimalistic design
      Menu.setApplicationMenu(null);
    }
  }

  private onWindowAllClosed(): void {
    // On macOS, keep the app running even when all windows are closed
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate(): void {
    // On macOS, re-create the window when dock icon is clicked
    if (this.mainWindow === null) {
      this.createMainWindow();
    } else if (!this.mainWindow.isVisible()) {
      this.mainWindow.show();
    }
  }

  /**
   * Cleanup all services before app quit
   */
  private async cleanup(): Promise<void> {
    console.log('PAAT: Starting cleanup process...');

    try {
      // Cleanup file watcher service
      await fileWatcherService.cleanup();
    } catch (error) {
      console.error('Error cleaning up file watcher service:', error);
    }

    try {
      // Cleanup Vamsh service
      vamshService.destroy();
    } catch (error) {
      console.error('Error cleaning up Vamsh service:', error);
    }

    try {
      // Close database connection
      await databaseService.close();
    } catch (error) {
      console.error('Error closing database connection:', error);
    }

    console.log('PAAT: Cleanup completed');
  }
}

// Initialize the application
new PAATApplication();

// Handle any unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
