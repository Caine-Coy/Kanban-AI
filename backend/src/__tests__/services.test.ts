import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('LMStudioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be importable', async () => {
    const { LMStudioService } = await import('../services/lmstudio.js');
    expect(LMStudioService).toBeDefined();
  });

  it('should create instance with correct configuration', async () => {
    const { LMStudioService } = await import('../services/lmstudio.js');
    const service = new LMStudioService('http://localhost:1234', 'test-model');
    
    expect(service).toBeDefined();
  });

  describe('testConnection', () => {
    it('should return true when LM Studio is reachable', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as any);

      const { LMStudioService } = await import('../services/lmstudio.js');
      const service = new LMStudioService('http://localhost:1234', 'test-model');
      
      const result = await service.testConnection();
      expect(result.connected).toBe(true);
      expect(result.service).toBe('LM Studio');
    });

    it('should return false when LM Studio is not reachable', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Connection refused'));

      const { LMStudioService } = await import('../services/lmstudio.js');
      const service = new LMStudioService('http://localhost:1234', 'test-model');
      
      const result = await service.testConnection();
      expect(result.connected).toBe(false);
    });
  });
});

describe('GitService', () => {
  it('should be importable', async () => {
    const { GitService } = await import('../services/git.js');
    expect(GitService).toBeDefined();
  });

  it('should create instance', async () => {
    const { GitService } = await import('../services/git.js');
    const service = new GitService();
    
    expect(service).toBeDefined();
  });
});

describe('AgentService', () => {
  it('should be importable', async () => {
    const { AgentService } = await import('../services/agent.js');
    expect(AgentService).toBeDefined();
    expect(AgentService.initialize).toBeDefined();
  });
});
