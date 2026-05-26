import { vi, describe, it, expect, beforeEach } from 'vitest';
import { apiFetch } from '../api/client';

describe('apiFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed JSON on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1, name: 'Test' }),
    }));
    const result = await apiFetch<{ id: number; name: string }>('/api/stores');
    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  it('returns undefined on 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.reject(new Error('no body')),
    }));
    const result = await apiFetch<void>('/api/stores/1');
    expect(result).toBeUndefined();
  });

  it('throws an Error on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ error: 'name is required' }),
    }));
    await expect(apiFetch('/api/stores')).rejects.toThrow('name is required');
  });

  it('falls back to statusText when no error body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new SyntaxError('no json')),
    }));
    await expect(apiFetch('/api/stores')).rejects.toThrow('Internal Server Error');
  });

  it('sends Content-Type application/json', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal('fetch', mockFetch);
    await apiFetch('/api/stores', { method: 'POST', body: '{}' });
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/stores',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
    );
  });
});
