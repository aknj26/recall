import { describe, it, expect } from 'vitest';
import {
  isTaskInLast7Days,
  getNextRevisionDetails,
  toggleArchiveTask,
  createTask,
  markTaskAsLearned,
  markRevisionRemembered,
  addDays,
} from './services/scheduler';
import { Task } from './types';

describe('Last 7 Days and Next Revision Features', () => {
  const today = '2026-10-27';

  describe('isTaskInLast7Days', () => {
    it('identifies tasks created today or in the last 7 days', () => {
      const taskToday = createTask('Task Today', today);
      expect(isTaskInLast7Days(taskToday, today)).toBe(true);

      const task4DaysAgo = createTask('Task 4 Days Ago', '2026-10-23');
      expect(isTaskInLast7Days(task4DaysAgo, today)).toBe(true);

      const task7DaysAgo = createTask('Task 7 Days Ago', '2026-10-20');
      expect(isTaskInLast7Days(task7DaysAgo, today)).toBe(true);
    });

    it('identifies older tasks that were learned within the last 7 days', () => {
      const oldTask: Task = {
        id: 'old_1',
        name: 'Old Task Learned Recently',
        status: 'revising',
        createdAt: '2026-09-01', // 2 months ago
        learnedAt: '2026-10-25', // 2 days ago
        currentRevision: 1,
        dueDate: '2026-10-26',
      };
      expect(isTaskInLast7Days(oldTask, today)).toBe(true);
    });

    it('excludes tasks with no activity in the last 7 days', () => {
      const ancientTask: Task = {
        id: 'ancient_1',
        name: 'Ancient Finished Task',
        status: 'finished',
        createdAt: '2026-08-01',
        learnedAt: '2026-08-01',
        currentRevision: null,
        dueDate: null,
      };
      expect(isTaskInLast7Days(ancientTask, today)).toBe(false);
    });
  });

  describe('getNextRevisionDetails', () => {
    it('returns pending 1st revision for tasks still in Learning stage', () => {
      const task = createTask('Sorting Algorithms', today);
      const info = getNextRevisionDetails(task, today);
      expect(info.revisionLabel).toContain('1st revision');
      expect(info.statusType).toBe('learning');
    });

    it('returns 1st revision info with relative due date for revising tasks', () => {
      const task = markTaskAsLearned(createTask('Binary Tree BFS', today), today);
      // Due tomorrow (today + 1)
      const info = getNextRevisionDetails(task, today);
      expect(info.revisionLabel).toBe('1st revision');
      expect(info.dueText).toContain('Tomorrow');
      expect(info.statusType).toBe('upcoming');
    });

    it('returns 2nd revision info when 1st revision is completed', () => {
      let task = markTaskAsLearned(createTask('Trie Insertion', '2026-10-25'), '2026-10-25');
      task = markRevisionRemembered(task, '2026-10-26'); // Remembered on Day 1
      // 2nd revision due on Day 3: 2026-10-28
      const info = getNextRevisionDetails(task, today);
      expect(info.revisionLabel).toBe('2nd revision');
      expect(info.dueDate).toBe('2026-10-28');
      expect(info.dueText).toContain('Tomorrow');
    });

    it('returns overdue status when revision date has passed', () => {
      const overdueTask: Task = {
        id: 'overdue_1',
        name: 'Overdue Revision',
        status: 'revising',
        createdAt: '2026-10-20',
        learnedAt: '2026-10-20',
        currentRevision: 2,
        dueDate: '2026-10-24', // 3 days ago
      };
      const info = getNextRevisionDetails(overdueTask, today);
      expect(info.statusType).toBe('overdue');
      expect(info.revisionLabel).toBe('2nd revision');
      expect(info.dueText).toContain('Overdue by 3 days');
    });

    it('returns finished status when all 3 revisions completed', () => {
      const finishedTask: Task = {
        id: 'fin_1',
        name: 'Completed Task',
        status: 'finished',
        createdAt: '2026-10-01',
        learnedAt: '2026-10-01',
        currentRevision: null,
        dueDate: null,
      };
      const info = getNextRevisionDetails(finishedTask, today);
      expect(info.statusType).toBe('finished');
      expect(info.revisionLabel).toContain('All 3 revisions completed');
    });
  });

  describe('toggleArchiveTask', () => {
    it('toggles archive status and updates archivedAt', () => {
      const task = createTask('Archive Target', today);
      expect(task.archived).toBeFalsy();

      // Archive it
      const archived = toggleArchiveTask(task, today);
      expect(archived.archived).toBe(true);
      expect(archived.archivedAt).toBe(today);

      // Unarchive it
      const unarchived = toggleArchiveTask(archived, today);
      expect(unarchived.archived).toBe(false);
      expect(unarchived.archivedAt).toBeNull();
    });
  });
});
