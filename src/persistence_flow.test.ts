import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  _resetMemoryCache,
} from './services/storage';
import {
  createTask,
  markTaskAsLearned,
  markRevisionRemembered,
  markRevisionForgotten,
} from './services/scheduler';
import { Task } from './types';

describe('Recall Persistence Across Page Refreshes & Browser Sessions', () => {
  const browserLocalStorage = new Map<string, string>();

  beforeAll(() => {
    const localStorageMock = {
      getItem: (key: string) => browserLocalStorage.get(key) ?? null,
      setItem: (key: string, val: string) => browserLocalStorage.set(key, val),
      removeItem: (key: string) => browserLocalStorage.delete(key),
      clear: () => browserLocalStorage.clear(),
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    browserLocalStorage.clear();
    _resetMemoryCache();
  });

  it('Session 1: User adds a task -> refreshes page -> task is still in Learning', () => {
    // 1. Initial page load (first time launch)
    let sessionTasks: Task[] = loadTasksFromStorage();
    expect(sessionTasks.length).toBe(1);

    // 2. User adds custom task
    const newTask = createTask('lcs tut 3 q1', '2026-10-27');
    sessionTasks = [newTask, ...sessionTasks];
    saveTasksToStorage(sessionTasks);

    // 3. User refreshes the page (Simulate complete browser memory wipe)
    _resetMemoryCache();

    // 4. Session reload
    const refreshedTasks = loadTasksFromStorage();
    expect(refreshedTasks.length).toBe(2);
    const found = refreshedTasks.find((t) => t.name === 'lcs tut 3 q1');
    expect(found).toBeDefined();
    expect(found?.status).toBe('learning');
    expect(found?.learnedAt).toBeNull();
  });

  it('Session 2: User marks task as learned -> refreshes -> 1st revision schedule is intact', () => {
    // 1. Add and save task
    let tasks: Task[] = [createTask('binary search', '2026-10-20')];
    saveTasksToStorage(tasks);

    // 2. User marks task as learned on Day 0 (2026-10-20)
    tasks = tasks.map((t) => (t.name === 'binary search' ? markTaskAsLearned(t, '2026-10-20') : t));
    saveTasksToStorage(tasks);

    // 3. Page Refresh (Memory wiped)
    _resetMemoryCache();

    // 4. Verify after refresh
    const refreshed = loadTasksFromStorage();
    const learnedTask = refreshed.find((t) => t.name === 'binary search')!;
    expect(learnedTask.status).toBe('revising');
    expect(learnedTask.learnedAt).toBe('2026-10-20');
    expect(learnedTask.currentRevision).toBe(1);
    expect(learnedTask.dueDate).toBe('2026-10-21'); // Day 1
  });

  it('Session 3: User marks revision as Forgotten -> refreshes -> retry schedule is preserved', () => {
    let task = markTaskAsLearned(createTask('graph cycle check', '2026-10-20'), '2026-10-20');
    saveTasksToStorage([task]);

    // On Day 1 (2026-10-21), user marks Forgotten
    task = markRevisionForgotten(task, '2026-10-21');
    saveTasksToStorage([task]);

    // Page Refresh (Memory wiped)
    _resetMemoryCache();

    const refreshed = loadTasksFromStorage();
    const forgottenTask = refreshed[0];
    expect(forgottenTask.currentRevision).toBe(1); // Still 1st revision
    expect(forgottenTask.dueDate).toBe('2026-10-22'); // Next day attempt
    expect(forgottenTask.history?.length).toBe(1);
    expect(forgottenTask.history?.[0].result).toBe('forgotten');
  });

  it('Session 4: User completes all 3 revisions -> refreshes -> task stays in Finished', () => {
    let task = markTaskAsLearned(createTask('two pointers', '2026-10-20'), '2026-10-20');
    // 1st revision remembered
    task = markRevisionRemembered(task, '2026-10-21');
    // 2nd revision remembered
    task = markRevisionRemembered(task, '2026-10-23');
    // 3rd revision remembered -> finished
    task = markRevisionRemembered(task, '2026-10-27');
    saveTasksToStorage([task]);

    // Close browser & reopen (Memory wiped)
    _resetMemoryCache();

    const reopened = loadTasksFromStorage();
    expect(reopened[0].status).toBe('finished');
    expect(reopened[0].currentRevision).toBeNull();
    expect(reopened[0].dueDate).toBeNull();
    expect(reopened[0].history?.length).toBe(3);
  });
});
