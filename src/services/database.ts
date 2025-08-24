/**
 * PAAT - AI Personal Assistant Agent Tool
 * SQLite Database Service
 * 
 * This service handles all database operations including:
 * - Project management
 * - Task tracking
 * - File monitoring data
 * - Vamsh integration status
 */

import sqlite3 from 'sqlite3';
import { join } from 'path';
import { app } from 'electron';
import { existsSync, mkdirSync } from 'fs';

// Database interfaces
export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  status: 'active' | 'completed' | 'paused' | 'error';
  vamsh_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  completion_percentage: number;
  estimated_duration: number; // in minutes
  actual_duration: number; // in minutes
  priority: 'low' | 'medium' | 'high';
  tags: string; // JSON array as string
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  type: 'analysis' | 'development' | 'testing' | 'review' | 'deployment';
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  estimated_duration: number;
  actual_duration: number;
  dependencies: string; // JSON array of task IDs
  vamsh_task_id: string | null;
  error_message: string | null;
}

export interface FileChange {
  id: string;
  project_id: string;
  file_path: string;
  change_type: 'created' | 'modified' | 'deleted' | 'renamed';
  timestamp: string;
  size: number;
  checksum: string;
  source: 'vamsh' | 'user' | 'system';
}

export interface VamshSession {
  id: string;
  project_id: string;
  session_start: string;
  session_end: string | null;
  status: 'active' | 'completed' | 'failed' | 'interrupted';
  messages_exchanged: number;
  files_created: number;
  files_modified: number;
  errors_encountered: number;
  performance_metrics: string; // JSON object as string
}

class DatabaseService {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private isInitialized = false;

  constructor() {
    // Get the user data directory
    const userDataPath = app.getPath('userData');
    const dbDir = join(userDataPath, 'PAAT');
    
    // Ensure the directory exists
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    
    this.dbPath = join(dbDir, 'paat.db');
  }

  /**
   * Initialize the database connection and create tables
   */
  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        
        console.log('Connected to SQLite database at:', this.dbPath);
        this.createTables()
          .then(() => {
            this.isInitialized = true;
            resolve();
          })
          .catch(reject);
      });
    });
  }

  /**
   * Create all necessary database tables
   */
  private async createTables(): Promise<void> {
    const tables = [
      // Projects table
      `CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        path TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active',
        vamsh_status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completion_percentage INTEGER NOT NULL DEFAULT 0,
        estimated_duration INTEGER NOT NULL DEFAULT 0,
        actual_duration INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'medium',
        tags TEXT DEFAULT '[]'
      )`,

      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        type TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        started_at TEXT,
        completed_at TEXT,
        estimated_duration INTEGER NOT NULL DEFAULT 0,
        actual_duration INTEGER NOT NULL DEFAULT 0,
        dependencies TEXT DEFAULT '[]',
        vamsh_task_id TEXT,
        error_message TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )`,

      // File changes table
      `CREATE TABLE IF NOT EXISTS file_changes (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        change_type TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        size INTEGER NOT NULL DEFAULT 0,
        checksum TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'system',
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )`,

      // Vamsh sessions table
      `CREATE TABLE IF NOT EXISTS vamsh_sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        session_start TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        session_end TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        messages_exchanged INTEGER NOT NULL DEFAULT 0,
        files_created INTEGER NOT NULL DEFAULT 0,
        files_modified INTEGER NOT NULL DEFAULT 0,
        errors_encountered INTEGER NOT NULL DEFAULT 0,
        performance_metrics TEXT DEFAULT '{}',
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status)`,
      `CREATE INDEX IF NOT EXISTS idx_projects_vamsh_status ON projects (vamsh_status)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks (project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status)`,
      `CREATE INDEX IF NOT EXISTS idx_file_changes_project_id ON file_changes (project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_file_changes_timestamp ON file_changes (timestamp)`,
      `CREATE INDEX IF NOT EXISTS idx_vamsh_sessions_project_id ON vamsh_sessions (project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_vamsh_sessions_status ON vamsh_sessions (status)`
    ];

    for (const sql of tables) {
      await this.run(sql);
    }
  }

  /**
   * Execute a SQL statement
   */
  private run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Execute a SQL query and return all results
   */
  private all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  /**
   * Execute a SQL query and return first result
   */
  private get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  // Project operations
  public async createProject(project: Omit<Project, 'created_at' | 'updated_at'>): Promise<void> {
    const sql = `INSERT INTO projects (
      id, name, description, path, status, vamsh_status, 
      completion_percentage, estimated_duration, actual_duration, priority, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      project.id,
      project.name,
      project.description,
      project.path,
      project.status,
      project.vamsh_status,
      project.completion_percentage,
      project.estimated_duration,
      project.actual_duration,
      project.priority,
      project.tags
    ];

    await this.run(sql, params);
  }

  public async getProject(id: string): Promise<Project | undefined> {
    const sql = 'SELECT * FROM projects WHERE id = ?';
    return await this.get<Project>(sql, [id]);
  }

  public async getAllProjects(): Promise<Project[]> {
    const sql = 'SELECT * FROM projects ORDER BY updated_at DESC';
    return await this.all<Project>(sql);
  }

  public async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    
    const sql = `UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.run(sql, [...values, id]);
  }

  public async deleteProject(id: string): Promise<void> {
    const sql = 'DELETE FROM projects WHERE id = ?';
    await this.run(sql, [id]);
  }

  // Task operations
  public async createTask(task: Omit<Task, 'created_at' | 'updated_at'>): Promise<void> {
    const sql = `INSERT INTO tasks (
      id, project_id, name, description, status, type, started_at, completed_at,
      estimated_duration, actual_duration, dependencies, vamsh_task_id, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      task.id,
      task.project_id,
      task.name,
      task.description,
      task.status,
      task.type,
      task.started_at,
      task.completed_at,
      task.estimated_duration,
      task.actual_duration,
      task.dependencies,
      task.vamsh_task_id,
      task.error_message
    ];

    await this.run(sql, params);
  }

  public async getTasksByProject(projectId: string): Promise<Task[]> {
    const sql = 'SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC';
    return await this.all<Task>(sql, [projectId]);
  }

  public async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    
    const sql = `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.run(sql, [...values, id]);
  }

  // File change operations
  public async recordFileChange(change: Omit<FileChange, 'timestamp'>): Promise<void> {
    const sql = `INSERT INTO file_changes (
      id, project_id, file_path, change_type, size, checksum, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      change.id,
      change.project_id,
      change.file_path,
      change.change_type,
      change.size,
      change.checksum,
      change.source
    ];

    await this.run(sql, params);
  }

  public async getFileChanges(projectId: string, limit: number = 100): Promise<FileChange[]> {
    const sql = 'SELECT * FROM file_changes WHERE project_id = ? ORDER BY timestamp DESC LIMIT ?';
    return await this.all<FileChange>(sql, [projectId, limit]);
  }

  // Vamsh session operations
  public async createVamshSession(session: Omit<VamshSession, 'session_start'>): Promise<void> {
    const sql = `INSERT INTO vamsh_sessions (
      id, project_id, session_end, status, messages_exchanged, 
      files_created, files_modified, errors_encountered, performance_metrics
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      session.id,
      session.project_id,
      session.session_end,
      session.status,
      session.messages_exchanged,
      session.files_created,
      session.files_modified,
      session.errors_encountered,
      session.performance_metrics
    ];

    await this.run(sql, params);
  }

  public async updateVamshSession(id: string, updates: Partial<VamshSession>): Promise<void> {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    
    const sql = `UPDATE vamsh_sessions SET ${setClause} WHERE id = ?`;
    await this.run(sql, [...values, id]);
  }

  // Utility methods
  public async getProjectStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    paused: number;
    error: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error
      FROM projects
    `;
    
    const result = await this.get<any>(sql);
    return result || { total: 0, active: 0, completed: 0, paused: 0, error: 0 };
  }

  /**
   * Execute raw SQL statement (for internal services like VamshMonitoringService)
   */
  public async executeSQL(sql: string, params: any[] = []): Promise<void> {
    return this.run(sql, params);
  }

  /**
   * Execute raw SQL query and return all results (for internal services)
   */
  public async querySQL<T>(sql: string, params: any[] = []): Promise<T[]> {
    return this.all<T>(sql, params);
  }

  /**
   * Execute raw SQL query and return first result (for internal services)
   */
  public async queryFirstSQL<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return this.get<T>(sql, params);
  }

  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed');
          this.db = null;
          this.isInitialized = false;
          resolve();
        }
      });
    });
  }

  /**
   * Check if database is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
