import { describe, it, expect, vi } from 'vitest';
import { ExportImportService } from '../../src/services/exportImportService.js';
import { DataSource } from 'typeorm';

describe('ExportImportService', () => {
  it('should export project data correctly', async () => {
    // Mock repos and service
    const mockProjectRepo = { findOne: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }) };
    const mockGroupRepo = { find: vi.fn().mockResolvedValue([]) };
    const service = new ExportImportService(
      {} as DataSource,
      mockProjectRepo as any,
      mockGroupRepo as any,
      {} as any,
      {} as any
    );

    const result = await service.exportProjectData('1');
    expect(result.project.name).toBe('Test');
  });
});