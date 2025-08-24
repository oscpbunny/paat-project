/**
 * PAAT - AI Personal Assistant Agent Tool
 * Mock Database Service for Browser Environment
 */

// Mock database service that works in browser
export class MockDatabaseService {
  private mockData: any = {};

  async executeSQL(query: string): Promise<any> {
    console.log('[MockDB] Execute SQL:', query);
    return Promise.resolve({ success: true });
  }

  async run(query: string): Promise<any> {
    console.log('[MockDB] Run query:', query);
    return Promise.resolve({ success: true });
  }

  async get(query: string, params?: any[]): Promise<any> {
    console.log('[MockDB] Get query:', query, params);
    return Promise.resolve(null);
  }

  async all(query: string, params?: any[]): Promise<any[]> {
    console.log('[MockDB] All query:', query, params);
    return Promise.resolve([]);
  }

  async initialize(): Promise<void> {
    console.log('[MockDB] Database initialized');
    return Promise.resolve();
  }

  async close(): Promise<void> {
    console.log('[MockDB] Database closed');
    return Promise.resolve();
  }
}

// Export singleton instance
export const databaseService = new MockDatabaseService();
