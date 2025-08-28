import { DatabaseService } from '../database';

// Mock SQLite3 for testing
const mockDatabase = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  close: jest.fn()
};

jest.mock('sqlite3', () => ({
  Database: jest.fn().mockImplementation((path, callback) => {
    // Simulate successful database connection
    setTimeout(() => callback(null), 0);
    return mockDatabase;
  })
}));

// Mock fs module to avoid file system dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

describe('DatabaseService', () => {
  let databaseService: DatabaseService;

  beforeEach(async () => {
    databaseService = new DatabaseService();
    await databaseService.initialize();
    jest.clearAllMocks();
  });

  describe('Project Management', () => {
    describe('createProject', () => {
      it('should create a new project successfully', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'Test project description',
          path: '/path/to/project',
          priority: 'high' as const,
          tags: 'web,react'
        };

        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback.call({ lastID: 123, changes: 1 });
        });

        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, {
            id: '123',
            name: 'Test Project',
            description: 'Test project description',
            path: '/path/to/project',
            status: 'active',
            priority: 'high',
            tags: 'web,react',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        });

        const result = await databaseService.createProject(projectData);

        expect(result).toBeDefined();
        expect(result.id).toBe('123');
        expect(result.name).toBe('Test Project');
        expect(result.status).toBe('active');
        expect(mockDb.run).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO projects'),
          expect.arrayContaining([
            expect.any(String), // id
            'Test Project',
            'Test project description',
            '/path/to/project',
            'active',
            'high',
            'web,react'
          ]),
          expect.any(Function)
        );
      });

      it('should handle project creation error', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'Test description'
        };

        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(new Error('Database constraint violation'));
        });

        await expect(databaseService.createProject(projectData))
          .rejects.toThrow('Failed to create project: Database constraint violation');
      });
    });

    describe('getProject', () => {
      it('should retrieve project by id successfully', async () => {
        const mockProject = {
          id: '123',
          name: 'Test Project',
          description: 'Test description',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, mockProject);
        });

        const result = await databaseService.getProject('123');

        expect(result).toEqual(mockProject);
        expect(mockDb.get).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM projects WHERE id = ?'),
          ['123'],
          expect.any(Function)
        );
      });

      it('should handle project not found', async () => {
        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, undefined);
        });

        await expect(databaseService.getProject('nonexistent'))
          .rejects.toThrow('Project not found: nonexistent');
      });
    });

    describe('updateProject', () => {
      it('should update project successfully', async () => {
        const updates = {
          name: 'Updated Project Name',
          status: 'completed' as const,
          completion_percentage: 100
        };

        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback.call({ changes: 1 });
        });

        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, {
            id: '123',
            name: 'Updated Project Name',
            status: 'completed',
            completion_percentage: 100,
            updated_at: new Date().toISOString()
          });
        });

        const result = await databaseService.updateProject('123', updates);

        expect(result).toBeDefined();
        expect(result.name).toBe('Updated Project Name');
        expect(result.status).toBe('completed');
        expect(result.completion_percentage).toBe(100);
      });
    });

    describe('getAllProjects', () => {
      it('should retrieve all projects', async () => {
        const mockProjects = [
          { id: '1', name: 'Project 1', status: 'active' },
          { id: '2', name: 'Project 2', status: 'completed' }
        ];

        mockDb.all.mockImplementation((sql: string, callback: Function) => {
          callback(null, mockProjects);
        });

        const result = await databaseService.getAllProjects();

        expect(result).toEqual(mockProjects);
        expect(mockDb.all).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM projects'),
          expect.any(Function)
        );
      });
    });

    describe('deleteProject', () => {
      it('should delete project and related tasks', async () => {
        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback.call({ changes: 1 });
        });

        await databaseService.deleteProject('123');

        expect(mockDb.run).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM tasks WHERE project_id = ?'),
          ['123'],
          expect.any(Function)
        );
        expect(mockDb.run).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM projects WHERE id = ?'),
          ['123'],
          expect.any(Function)
        );
      });
    });
  });

  describe('Task Management', () => {
    describe('createTask', () => {
      it('should create a new task successfully', async () => {
        const taskData = {
          project_id: 'project-123',
          name: 'Test Task',
          description: 'Test task description',
          type: 'development' as const,
          priority: 'medium' as const,
          estimated_hours: 8
        };

        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback.call({ lastID: 456, changes: 1 });
        });

        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, {
            id: '456',
            project_id: 'project-123',
            name: 'Test Task',
            description: 'Test task description',
            status: 'pending',
            type: 'development',
            priority: 'medium',
            estimated_hours: 8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        });

        const result = await databaseService.createTask(taskData);

        expect(result).toBeDefined();
        expect(result.id).toBe('456');
        expect(result.name).toBe('Test Task');
        expect(result.project_id).toBe('project-123');
      });
    });

    describe('getProjectTasks', () => {
      it('should retrieve all tasks for a project', async () => {
        const mockTasks = [
          { id: '1', project_id: 'project-123', name: 'Task 1', status: 'pending' },
          { id: '2', project_id: 'project-123', name: 'Task 2', status: 'in_progress' }
        ];

        mockDb.all.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, mockTasks);
        });

        const result = await databaseService.getProjectTasks('project-123');

        expect(result).toEqual(mockTasks);
        expect(mockDb.all).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM tasks WHERE project_id = ?'),
          ['project-123'],
          expect.any(Function)
        );
      });
    });

    describe('updateTask', () => {
      it('should update task successfully', async () => {
        const updates = {
          status: 'completed' as const,
          actual_hours: 10,
          completion_notes: 'Task completed successfully'
        };

        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback.call({ changes: 1 });
        });

        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, {
            id: '456',
            status: 'completed',
            actual_hours: 10,
            completion_notes: 'Task completed successfully',
            updated_at: new Date().toISOString()
          });
        });

        const result = await databaseService.updateTask('456', updates);

        expect(result).toBeDefined();
        expect(result.status).toBe('completed');
        expect(result.actual_hours).toBe(10);
      });
    });
  });

  describe('Error Logging', () => {
    describe('createErrorLog', () => {
      it('should create error log entry successfully', async () => {
        const errorData = {
          service: 'VamshService',
          operation: 'sendMessage',
          error_type: 'connection',
          message: 'Connection timeout',
          project_id: 'project-123',
          context: JSON.stringify({ timeout: 5000 })
        };

        mockDb.run.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback.call({ lastID: 789, changes: 1 });
        });

        await databaseService.createErrorLog(errorData);

        expect(mockDb.run).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO error_logs'),
          expect.arrayContaining([
            expect.any(String), // id
            'VamshService',
            'sendMessage',
            'connection',
            'Connection timeout',
            'project-123',
            JSON.stringify({ timeout: 5000 })
          ]),
          expect.any(Function)
        );
      });
    });

    describe('getErrorLogs', () => {
      it('should retrieve error logs with optional filtering', async () => {
        const mockLogs = [
          { id: '1', service: 'VamshService', error_type: 'connection', created_at: new Date().toISOString() },
          { id: '2', service: 'DatabaseService', error_type: 'validation', created_at: new Date().toISOString() }
        ];

        mockDb.all.mockImplementation((sql: string, params: any[], callback: Function) => {
          callback(null, mockLogs);
        });

        const result = await databaseService.getErrorLogs({ service: 'VamshService', limit: 10 });

        expect(result).toEqual(mockLogs);
        expect(mockDb.all).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM error_logs'),
          expect.any(Array),
          expect.any(Function)
        );
      });
    });
  });

  describe('Statistics', () => {
    describe('getProjectStatistics', () => {
      it('should calculate project statistics', async () => {
        mockDb.get.mockImplementation((sql: string, callback: Function) => {
          if (sql.includes('COUNT(*) as total_projects')) {
            callback(null, { total_projects: 5 });
          } else if (sql.includes('status = "active"')) {
            callback(null, { active_projects: 3 });
          } else if (sql.includes('status = "completed"')) {
            callback(null, { completed_projects: 2 });
          }
        });

        const result = await databaseService.getProjectStatistics();

        expect(result).toBeDefined();
        expect(result.totalProjects).toBe(5);
        expect(result.activeProjects).toBe(3);
        expect(result.completedProjects).toBe(2);
      });
    });

    describe('getTaskStatistics', () => {
      it('should calculate task statistics for a project', async () => {
        mockDb.get.mockImplementation((sql: string, params: any[], callback: Function) => {
          if (sql.includes('COUNT(*) as total_tasks')) {
            callback(null, { total_tasks: 10 });
          } else if (sql.includes('status = "completed"')) {
            callback(null, { completed_tasks: 6 });
          }
        });

        const result = await databaseService.getTaskStatistics('project-123');

        expect(result).toBeDefined();
        expect(result.totalTasks).toBe(10);
        expect(result.completedTasks).toBe(6);
      });
    });
  });

  describe('Database Initialization', () => {
    it('should initialize database with proper schema', async () => {
      mockDb.exec.mockImplementation((sql: string, callback: Function) => {
        callback(null);
      });

      await databaseService.initialize();

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS projects'),
        expect.any(Function)
      );
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS tasks'),
        expect.any(Function)
      );
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS error_logs'),
        expect.any(Function)
      );
    });

    it('should handle initialization errors', async () => {
      mockDb.exec.mockImplementation((sql: string, callback: Function) => {
        callback(new Error('Schema creation failed'));
      });

      await expect(databaseService.initialize())
        .rejects.toThrow('Failed to initialize database: Schema creation failed');
    });
  });

  describe('Connection Management', () => {
    it('should close database connection', async () => {
      mockDb.close.mockImplementation((callback: Function) => {
        callback(null);
      });

      await databaseService.close();

      expect(mockDb.close).toHaveBeenCalled();
    });

    it('should handle connection close errors', async () => {
      mockDb.close.mockImplementation((callback: Function) => {
        callback(new Error('Failed to close connection'));
      });

      await expect(databaseService.close())
        .rejects.toThrow('Failed to close database: Failed to close connection');
    });
  });
});
