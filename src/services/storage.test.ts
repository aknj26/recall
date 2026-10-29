import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  parseAndValidateBackup,
  sanitizeAndRepairTask,
  _resetMemoryCache,
  STORAGE_KEY,
  INITIALIZED_FLAG_KEY,
} from './storage';
import { Task } from '../types';

describe('Storage and Persistence Module', () => {
  const storageMap = new Map<string, string>();

  beforeAll(() => {
    const localStorageMock = {
      getItem: (key: string) => storageMap.get(key) ?? null,
      setItem: (key: string, val: string) => storageMap.set(key, val),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    storageMap.clear();
    _resetMemoryCache();
  });

  it('1. Initializes with default demo task only on brand new first launch', () => {
    const tasks = loadTasksFromStorage();
    expect(tasks.length).toBe(1);
    expect(tasks[0].name).toBe('lcs tut 3 q1');
    expect(tasks[0].status).toBe('learning');
    // Flag must be marked as initialized
    expect(storageMap.get(INITIALIZED_FLAG_KEY)).toBe('true');
  });

  it('2. Does NOT re-seed demo task if user intentionally cleared/deleted all tasks', () => {
    // First launch
    loadTasksFromStorage();
    // User deletes all tasks and saves empty list
    saveTasksToStorage([]);
    expect(storageMap.get(STORAGE_KEY)).toBe('[]');
    expect(storageMap.get(INITIALIZED_FLAG_KEY)).toBe('true');

    // App restarts/refreshes
    const reloaded = loadTasksFromStorage();
    expect(reloaded).toEqual([]);
    expect(reloaded.length).toBe(0);
  });

  it('3. Persists and restores all task properties: status, learnedAt, currentRevision, dueDate, and history', () => {
    const fullTask: Task = {
      id: 'task_full_1',
      name: 'Dynamic Programming LCS',
      status: 'revising',
      createdAt: '2026-10-20',
      learnedAt: '2026-10-20',
      currentRevision: 2,
      dueDate: '2026-10-23',
      history: [
        {
          revision: 1,
          actionDate: '2026-10-21',
          result: 'forgotten',
          nextDueDate: '2026-10-22',
        },
        {
          revision: 1,
          actionDate: '2026-10-22',
          result: 'remembered',
          nextDueDate: '2026-10-23',
        },
      ],
    };

    saveTasksToStorage([fullTask]);

    // Simulate page refresh
    const loaded = loadTasksFromStorage();
    expect(loaded.length).toBe(1);
    const restored = loaded[0];
    expect(restored.id).toBe('task_full_1');
    expect(restored.name).toBe('Dynamic Programming LCS');
    expect(restored.status).toBe('revising');
    expect(restored.createdAt).toBe('2026-10-20');
    expect(restored.learnedAt).toBe('2026-10-20');
    expect(restored.currentRevision).toBe(2);
    expect(restored.dueDate).toBe('2026-10-23');
    expect(restored.history?.length).toBe(2);
    expect(restored.history?.[0].result).toBe('forgotten');
    expect(restored.history?.[1].result).toBe('remembered');
  });

  it('4. Persists finished task status without revisions scheduled', () => {
    const finishedTask: Task = {
      id: 'task_fin_1',
      name: 'Graph Traversal BFS',
      status: 'finished',
      createdAt: '2026-10-01',
      learnedAt: '2026-10-01',
      currentRevision: null,
      dueDate: null,
      history: [
        { revision: 1, actionDate: '2026-10-02', result: 'remembered', nextDueDate: '2026-10-04' },
        { revision: 2, actionDate: '2026-10-04', result: 'remembered', nextDueDate: '2026-10-08' },
        { revision: 3, actionDate: '2026-10-08', result: 'remembered', nextDueDate: null },
      ],
    };

    saveTasksToStorage([finishedTask]);
    const loaded = loadTasksFromStorage();
    expect(loaded[0].status).toBe('finished');
    expect(loaded[0].currentRevision).toBeNull();
    expect(loaded[0].dueDate).toBeNull();
  });

  it('5. Handles missing or partially corrupt fields safely without deleting valid tasks', () => {
    // Task missing createdAt and dueDate
    const partialRaw = {
      id: 'partial_1',
      name: 'Trie Data Structure',
      status: 'revising',
      learnedAt: '2026-10-25',
      currentRevision: 1,
    };

    const repaired = sanitizeAndRepairTask(partialRaw, 0);
    expect(repaired).not.toBeNull();
    expect(repaired?.id).toBe('partial_1');
    expect(repaired?.name).toBe('Trie Data Structure');
    expect(repaired?.status).toBe('revising');
    // dueDate automatically calculated for revision 1 (learnedAt + 1)
    expect(repaired?.dueDate).toBe('2026-10-26');
    expect(repaired?.createdAt).toBeDefined();
  });

  it('6. Parses backup with both array or object structure safely', () => {
    const backupObj = JSON.stringify({
      version: 1,
      exportedAt: '2026-10-27T10:00:00Z',
      tasks: [
        {
          id: 'b-1',
          name: 'Merge Sort Implementation',
          status: 'learning',
        },
      ],
    });

    const result = parseAndValidateBackup(backupObj);
    expect(result.success).toBe(true);
    expect(result.tasks?.length).toBe(1);
    expect(result.tasks?.[0].name).toBe('Merge Sort Implementation');
    expect(result.tasks?.[0].status).toBe('learning');
  });

  it('7. Handles malformed JSON strings without throwing unhandled exceptions', () => {
    const result = parseAndValidateBackup('{ not valid json');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid JSON');
  });
});
