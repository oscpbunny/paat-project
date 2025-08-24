/**
 * PAAT - AI Personal Assistant Agent Tool
 * File System Monitoring Service
 * 
 * This service monitors project directories for real-time file changes,
 * essential for tracking Vamsh AI development progress and file modifications.
 */

import chokidar, { FSWatcher } from 'chokidar';
import { createHash } from 'crypto';
import { stat, readFile } from 'fs/promises';
import { join, relative, basename } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { databaseService, FileChange } from './database';

export interface WatchedProject {
  id: string;
  name: string;
  path: string;
  watcher: FSWatcher;
  isActive: boolean;
  patterns: string[];
  ignoredPatterns: string[];
}

export interface FileChangeEvent {
  id: string;
  projectId: string;
  filePath: string;
  relativePath: string;
  changeType: 'created' | 'modified' | 'deleted' | 'renamed';
  timestamp: Date;
  size: number;
  checksum: string;
  source: 'vamsh' | 'user' | 'system';
  fileExtension: string;
  isDirectory: boolean;
}

export interface WatcherOptions {
  ignoreInitial?: boolean;
  ignoreHidden?: boolean;
  ignoreNodeModules?: boolean;
  includeBinaryFiles?: boolean;
  maxFileSize?: number; // in bytes
  debounceDelay?: number; // in milliseconds
}

export interface WatcherStats {
  projectId: string;
  totalFiles: number;
  totalChanges: number;
  changesLastHour: number;
  changesLastDay: number;
  lastChangeTime: Date | null;
  activeWatchers: number;
  mostActiveFiles: Array<{ path: string; changes: number }>;
}

class FileWatcherService {
  private watchedProjects: Map<string, WatchedProject> = new Map();
  private changeBuffer: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;
  private changeStats: Map<string, { path: string; changes: number; lastChange: Date }> = new Map();

  constructor() {
    // Bind methods to preserve 'this' context
    this.handleFileAdd = this.handleFileAdd.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleFileUnlink = this.handleFileUnlink.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * Initialize the file watcher service
   */
  public async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      console.log('File Watcher Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize File Watcher Service:', error);
      throw error;
    }
  }

  /**
   * Start watching a project directory
   */
  public async watchProject(
    projectId: string,
    projectName: string,
    projectPath: string,
    options: WatcherOptions = {}
  ): Promise<void> {
    if (this.watchedProjects.has(projectId)) {
      console.log(`Project ${projectName} is already being watched`);
      return;
    }

    try {
      // Default options
      const watchOptions = {
        ignoreInitial: options.ignoreInitial ?? true,
        ignoreHidden: options.ignoreHidden ?? true,
        ignoreNodeModules: options.ignoreNodeModules ?? true,
        includeBinaryFiles: options.includeBinaryFiles ?? false,
        maxFileSize: options.maxFileSize ?? 10 * 1024 * 1024, // 10MB
        debounceDelay: options.debounceDelay ?? 500, // 500ms
      };

      // Define patterns to watch and ignore
      const watchPatterns = [
        join(projectPath, '**/*')
      ];

      const ignorePatterns = [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/*.log',
        '**/tmp/**',
        '**/temp/**',
      ];

      if (watchOptions.ignoreHidden) {
        ignorePatterns.push('**/.*/**');
      }

      if (!watchOptions.includeBinaryFiles) {
        ignorePatterns.push(
          '**/*.{exe,dll,so,dylib,bin,img,iso,dmg,pkg,deb,rpm}',
          '**/*.{jpg,jpeg,png,gif,bmp,ico,svg,pdf,zip,rar,tar,gz,7z}',
          '**/*.{mp3,mp4,avi,mov,wmv,wav,flac,ogg,mkv,webm}'
        );
      }

      // Create chokidar watcher
      const watcher = chokidar.watch(watchPatterns, {
        ignored: ignorePatterns,
        ignoreInitial: watchOptions.ignoreInitial,
        persistent: true,
        followSymlinks: false,
        usePolling: false,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50
        },
        depth: 10 // Limit recursion depth
      });

      // Set up event handlers
      watcher
        .on('add', (filePath) => this.handleFileAdd(projectId, filePath, watchOptions))
        .on('change', (filePath) => this.handleFileChange(projectId, filePath, watchOptions))
        .on('unlink', (filePath) => this.handleFileUnlink(projectId, filePath))
        .on('addDir', (dirPath) => this.handleDirectoryAdd(projectId, dirPath))
        .on('unlinkDir', (dirPath) => this.handleDirectoryUnlink(projectId, dirPath))
        .on('error', (error) => this.handleError(projectId, error))
        .on('ready', () => {
          console.log(`File watcher ready for project: ${projectName}`);
          this.notifyWatcherReady(projectId);
        });

      // Store watcher info
      const watchedProject: WatchedProject = {
        id: projectId,
        name: projectName,
        path: projectPath,
        watcher,
        isActive: true,
        patterns: watchPatterns,
        ignoredPatterns: ignorePatterns
      };

      this.watchedProjects.set(projectId, watchedProject);
      console.log(`Started watching project: ${projectName} at ${projectPath}`);

    } catch (error) {
      console.error(`Failed to start watching project ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * Stop watching a project
   */
  public async stopWatchingProject(projectId: string): Promise<void> {
    const watchedProject = this.watchedProjects.get(projectId);
    if (!watchedProject) {
      console.log(`Project ${projectId} is not being watched`);
      return;
    }

    try {
      await watchedProject.watcher.close();
      watchedProject.isActive = false;
      this.watchedProjects.delete(projectId);
      
      // Clear any pending debounced changes
      this.clearProjectChangeBuffer(projectId);
      
      console.log(`Stopped watching project: ${watchedProject.name}`);
    } catch (error) {
      console.error(`Error stopping watcher for project ${watchedProject.name}:`, error);
      throw error;
    }
  }

  /**
   * Handle file addition
   */
  private async handleFileAdd(
    projectId: string, 
    filePath: string, 
    options: WatcherOptions
  ): Promise<void> {
    await this.processFileChange(projectId, filePath, 'created', options);
  }

  /**
   * Handle file modification
   */
  private async handleFileChange(
    projectId: string,
    filePath: string,
    options: WatcherOptions
  ): Promise<void> {
    await this.processFileChange(projectId, filePath, 'modified', options);
  }

  /**
   * Handle file deletion
   */
  private async handleFileUnlink(projectId: string, filePath: string): Promise<void> {
    await this.processFileChange(projectId, filePath, 'deleted');
  }

  /**
   * Handle directory addition
   */
  private async handleDirectoryAdd(projectId: string, dirPath: string): Promise<void> {
    const changeEvent: FileChangeEvent = {
      id: uuidv4(),
      projectId,
      filePath: dirPath,
      relativePath: this.getRelativePath(projectId, dirPath),
      changeType: 'created',
      timestamp: new Date(),
      size: 0,
      checksum: '',
      source: this.determineChangeSource(dirPath),
      fileExtension: '',
      isDirectory: true
    };

    await this.recordChange(changeEvent);
  }

  /**
   * Handle directory deletion
   */
  private async handleDirectoryUnlink(projectId: string, dirPath: string): Promise<void> {
    const changeEvent: FileChangeEvent = {
      id: uuidv4(),
      projectId,
      filePath: dirPath,
      relativePath: this.getRelativePath(projectId, dirPath),
      changeType: 'deleted',
      timestamp: new Date(),
      size: 0,
      checksum: '',
      source: this.determineChangeSource(dirPath),
      fileExtension: '',
      isDirectory: true
    };

    await this.recordChange(changeEvent);
  }

  /**
   * Handle watcher errors
   */
  private handleError(projectId: string, error: Error): void {
    const watchedProject = this.watchedProjects.get(projectId);
    console.error(`File watcher error for project ${watchedProject?.name || projectId}:`, error);
    
    // Optionally restart the watcher or notify the UI
    this.notifyWatcherError(projectId, error);
  }

  /**
   * Process file change with debouncing
   */
  private async processFileChange(
    projectId: string,
    filePath: string,
    changeType: 'created' | 'modified' | 'deleted',
    options: WatcherOptions = {}
  ): Promise<void> {
    const debounceKey = `${projectId}:${filePath}`;
    
    // Clear existing timeout
    if (this.changeBuffer.has(debounceKey)) {
      clearTimeout(this.changeBuffer.get(debounceKey)!);
    }

    // Set new timeout for debouncing
    const timeout = setTimeout(async () => {
      try {
        await this.executeFileChange(projectId, filePath, changeType, options);
        this.changeBuffer.delete(debounceKey);
      } catch (error) {
        console.error(`Error processing file change for ${filePath}:`, error);
      }
    }, options.debounceDelay || 500);

    this.changeBuffer.set(debounceKey, timeout);
  }

  /**
   * Execute the actual file change processing
   */
  private async executeFileChange(
    projectId: string,
    filePath: string,
    changeType: 'created' | 'modified' | 'deleted',
    options: WatcherOptions = {}
  ): Promise<void> {
    try {
      let fileSize = 0;
      let checksum = '';

      if (changeType !== 'deleted') {
        try {
          const stats = await stat(filePath);
          
          if (stats.isDirectory()) {
            return; // Skip directories, handled separately
          }

          fileSize = stats.size;

          // Skip large files if specified
          if (options.maxFileSize && fileSize > options.maxFileSize) {
            console.log(`Skipping large file: ${filePath} (${fileSize} bytes)`);
            return;
          }

          // Calculate checksum for file integrity
          checksum = await this.calculateFileChecksum(filePath);
        } catch (statError) {
          console.error(`Error getting file stats for ${filePath}:`, statError);
          return;
        }
      }

      const changeEvent: FileChangeEvent = {
        id: uuidv4(),
        projectId,
        filePath,
        relativePath: this.getRelativePath(projectId, filePath),
        changeType,
        timestamp: new Date(),
        size: fileSize,
        checksum,
        source: this.determineChangeSource(filePath),
        fileExtension: this.getFileExtension(filePath),
        isDirectory: false
      };

      await this.recordChange(changeEvent);
      this.updateStats(changeEvent);

    } catch (error) {
      console.error(`Error executing file change for ${filePath}:`, error);
    }
  }

  /**
   * Record file change in database and notify listeners
   */
  private async recordChange(changeEvent: FileChangeEvent): Promise<void> {
    try {
      // Store in database if available
      if (databaseService.isReady()) {
        const dbChange: Omit<FileChange, 'timestamp'> = {
          id: changeEvent.id,
          project_id: changeEvent.projectId,
          file_path: changeEvent.filePath,
          change_type: changeEvent.changeType,
          size: changeEvent.size,
          checksum: changeEvent.checksum,
          source: changeEvent.source
        };

        await databaseService.recordFileChange(dbChange);
      }

      // Emit event for real-time updates
      this.emitChangeEvent(changeEvent);

      console.log(`File ${changeEvent.changeType}: ${changeEvent.relativePath} (${changeEvent.source})`);

    } catch (error) {
      console.error('Error recording file change:', error);
    }
  }

  /**
   * Calculate MD5 checksum of a file
   */
  private async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      const content = await readFile(filePath);
      return createHash('md5').update(content).digest('hex');
    } catch (error) {
      console.error(`Error calculating checksum for ${filePath}:`, error);
      return '';
    }
  }

  /**
   * Determine the source of the file change
   */
  private determineChangeSource(filePath: string): 'vamsh' | 'user' | 'system' {
    // Simple heuristics to determine change source
    const fileName = basename(filePath).toLowerCase();
    
    // Check for common Vamsh patterns
    if (filePath.includes('vamsh') || 
        fileName.includes('vamsh') ||
        filePath.includes('.vamsh')) {
      return 'vamsh';
    }

    // Check for system files
    if (fileName.startsWith('.') || 
        fileName.includes('tmp') || 
        fileName.includes('cache') ||
        fileName.endsWith('.log')) {
      return 'system';
    }

    // Default to user
    return 'user';
  }

  /**
   * Get relative path from project root
   */
  private getRelativePath(projectId: string, filePath: string): string {
    const project = this.watchedProjects.get(projectId);
    if (!project) return filePath;

    try {
      return relative(project.path, filePath);
    } catch (error) {
      return filePath;
    }
  }

  /**
   * Get file extension
   */
  private getFileExtension(filePath: string): string {
    const ext = filePath.split('.').pop();
    return ext ? ext.toLowerCase() : '';
  }

  /**
   * Update internal statistics
   */
  private updateStats(changeEvent: FileChangeEvent): void {
    const key = `${changeEvent.projectId}:${changeEvent.filePath}`;
    const existing = this.changeStats.get(key);
    
    if (existing) {
      existing.changes++;
      existing.lastChange = changeEvent.timestamp;
    } else {
      this.changeStats.set(key, {
        path: changeEvent.filePath,
        changes: 1,
        lastChange: changeEvent.timestamp
      });
    }
  }

  /**
   * Get statistics for a project
   */
  public async getProjectStats(projectId: string): Promise<WatcherStats> {
    const project = this.watchedProjects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} is not being watched`);
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let totalFiles = 0;
    let totalChanges = 0;
    let changesLastHour = 0;
    let changesLastDay = 0;
    let lastChangeTime: Date | null = null;
    const fileChanges: Array<{ path: string; changes: number }> = [];

    // Analyze change statistics
    for (const [key, stats] of this.changeStats.entries()) {
      if (key.startsWith(`${projectId}:`)) {
        totalFiles++;
        totalChanges += stats.changes;
        
        if (stats.lastChange > oneHourAgo) {
          changesLastHour += stats.changes;
        }
        if (stats.lastChange > oneDayAgo) {
          changesLastDay += stats.changes;
        }
        
        if (!lastChangeTime || stats.lastChange > lastChangeTime) {
          lastChangeTime = stats.lastChange;
        }

        fileChanges.push({
          path: stats.path,
          changes: stats.changes
        });
      }
    }

    // Sort by most changes
    const mostActiveFiles = fileChanges
      .sort((a, b) => b.changes - a.changes)
      .slice(0, 10);

    return {
      projectId,
      totalFiles,
      totalChanges,
      changesLastHour,
      changesLastDay,
      lastChangeTime,
      activeWatchers: this.watchedProjects.size,
      mostActiveFiles
    };
  }

  /**
   * Clear change buffer for a project
   */
  private clearProjectChangeBuffer(projectId: string): void {
    for (const [key, timeout] of this.changeBuffer.entries()) {
      if (key.startsWith(`${projectId}:`)) {
        clearTimeout(timeout);
        this.changeBuffer.delete(key);
      }
    }
  }

  /**
   * Emit change event (placeholder for real event emission)
   */
  private emitChangeEvent(changeEvent: FileChangeEvent): void {
    // In a real implementation, this would emit to event listeners
    // For now, just log the event
    console.debug('File change event:', {
      type: changeEvent.changeType,
      path: changeEvent.relativePath,
      source: changeEvent.source,
      size: changeEvent.size
    });
  }

  /**
   * Notify that watcher is ready
   */
  private notifyWatcherReady(projectId: string): void {
    const project = this.watchedProjects.get(projectId);
    console.log(`File watcher ready for project: ${project?.name || projectId}`);
  }

  /**
   * Notify watcher error
   */
  private notifyWatcherError(projectId: string, error: Error): void {
    const project = this.watchedProjects.get(projectId);
    console.error(`File watcher error for project ${project?.name || projectId}:`, error.message);
  }

  /**
   * Get all watched projects
   */
  public getWatchedProjects(): WatchedProject[] {
    return Array.from(this.watchedProjects.values());
  }

  /**
   * Check if a project is being watched
   */
  public isProjectWatched(projectId: string): boolean {
    return this.watchedProjects.has(projectId);
  }

  /**
   * Get watcher status
   */
  public getStatus(): {
    initialized: boolean;
    totalProjects: number;
    activeProjects: number;
    totalChanges: number;
  } {
    let totalChanges = 0;
    for (const [, stats] of this.changeStats.entries()) {
      totalChanges += stats.changes;
    }

    return {
      initialized: this.isInitialized,
      totalProjects: this.watchedProjects.size,
      activeProjects: Array.from(this.watchedProjects.values()).filter(p => p.isActive).length,
      totalChanges
    };
  }

  /**
   * Cleanup all watchers
   */
  public async cleanup(): Promise<void> {
    console.log('Cleaning up file watchers...');
    
    const cleanupPromises = Array.from(this.watchedProjects.keys()).map(projectId => 
      this.stopWatchingProject(projectId)
    );

    await Promise.allSettled(cleanupPromises);
    
    // Clear all buffers
    for (const timeout of this.changeBuffer.values()) {
      clearTimeout(timeout);
    }
    this.changeBuffer.clear();
    this.changeStats.clear();
    
    this.isInitialized = false;
    console.log('File watcher service cleanup complete');
  }
}

// Export singleton instance
export const fileWatcherService = new FileWatcherService();
