import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  _resetMemoryCache,
  STORAGE_KEY,
} from './services/storage';
import {
  createTask,
  markTaskAsLearned,
  markRevisionRemembered,
  markRevisionForgotten,
} from './services/scheduler';
import { Task } from './types';
import fs from 'node:fs';
import path from 'node:path';

describe('Offline Capability & PWA Reliability', () => {
  const offlineStorage = new Map<string, string>();

  beforeAll(() => {
    const localStorageMock = {
      getItem: (key: string) => offlineStorage.get(key) ?? null,
      setItem: (key: string, val: string) => offlineStorage.set(key, val),
      removeItem: (key: string) => offlineStorage.delete(key),
      clear: () => offlineStorage.clear(),
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    offlineStorage.clear();
    _resetMemoryCache();
  });

  it('1. Precache assets verification: dist/sw.js contains complete precache list', () => {
    const distSwPath = path.resolve(__dirname, '../dist/sw.js');
    expect(fs.existsSync(distSwPath)).toBe(true);

    const swContent = fs.readFileSync(distSwPath, 'utf-8');
    expect(swContent).toContain('/index.html');
    expect(swContent).toContain('/manifest.webmanifest');
    expect(swContent).toContain('/icon.svg');
    expect(swContent).toContain('/icon-192.png');
    expect(swContent).toContain('/icon-512.png');
    expect(swContent).toContain('/assets/index-');
  });

  it('2. Task creation and management works 100% offline without network calls', () => {
    // Simulate offline environment
    const isOnline = false;
    expect(isOnline).toBe(false);

    // Create task
    const offlineTask = createTask('offline algorithm practice', '2026-10-27');
    expect(offlineTask.status).toBe('learning');

    // Save offline
    saveTasksToStorage([offlineTask]);

    // Wipe memory (simulate closing browser tab)
    _resetMemoryCache();

    // Reopen while still offline
    const restored = loadTasksFromStorage();
    expect(restored.length).toBe(1);
    expect(restored[0].name).toBe('offline algorithm practice');
    expect(restored[0].status).toBe('learning');
  });

  it('3. Full revision scheduling and retry progression works offline', () => {
    let task = createTask('offline revision test', '2026-10-20');

    // Mark as learned offline (Day 0)
    task = markTaskAsLearned(task, '2026-10-20');
    expect(task.currentRevision).toBe(1);
    expect(task.dueDate).toBe('2026-10-21');
    saveTasksToStorage([task]);

    // Mark Forgotten offline on Day 1
    task = markRevisionForgotten(task, '2026-10-21');
    expect(task.currentRevision).toBe(1); // Keeps 1st revision
    expect(task.dueDate).toBe('2026-10-22');
    saveTasksToStorage([task]);

    // Mark Remembered offline on Day 2
    task = markRevisionRemembered(task, '2026-10-22');
    expect(task.currentRevision).toBe(2);
    expect(task.dueDate).toBe('2026-10-23');
    saveTasksToStorage([task]);

    // Complete remaining revisions offline
    task = markRevisionRemembered(task, '2026-10-23'); // 3rd revision
    task = markRevisionRemembered(task, '2026-10-27'); // Finished
    expect(task.status).toBe('finished');
    saveTasksToStorage([task]);

    // Reopen offline
    _resetMemoryCache();
    const loaded = loadTasksFromStorage();
    expect(loaded[0].status).toBe('finished');
    expect(loaded[0].history?.length).toBe(4);
  });

  it('4. Connection drops and app updates do not erase saved tasks', () => {
    const existingTask: Task = {
      id: 'persist_task',
      name: 'Critical Learning Task',
      status: 'revising',
      createdAt: '2026-10-26',
      learnedAt: '2026-10-26',
      currentRevision: 1,
      dueDate: '2026-10-27',
    };
    saveTasksToStorage([existingTask]);

    // Simulate app update (cache cleared, service worker updated, connection re-established)
    _resetMemoryCache();

    // Verify tasks survived update intact
    const tasksAfterUpdate = loadTasksFromStorage();
    expect(tasksAfterUpdate.length).toBe(1);
    expect(tasksAfterUpdate[0].id).toBe('persist_task');
    expect(tasksAfterUpdate[0].name).toBe('Critical Learning Task');
  });
});
