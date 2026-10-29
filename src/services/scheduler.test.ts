import { describe, it, expect } from 'vitest';
import {
  createTask,
  markTaskAsLearned,
  markRevisionRemembered,
  markRevisionForgotten,
  restartTask,
  renameTask,
  getRevisionLabel,
  isTaskOverdue,
  isTaskDueToday,
  isTaskDueOrOverdue,
  sortDueAndOverdueTasks,
  addDays,
  getDaysDifference,
  getRelativeDueDateText,
} from './scheduler';
import { Task } from '../types';

describe('Recall Scheduling Module', () => {
  describe('1. Task creation', () => {
    it('creates a new task in Learning stage with no schedule', () => {
      const task = createTask('lcs tut 3 q1', '2026-10-27');
      expect(task.name).toBe('lcs tut 3 q1');
      expect(task.status).toBe('learning');
      expect(task.createdAt).toBe('2026-10-27');
      expect(task.learnedAt).toBeNull();
      expect(task.currentRevision).toBeNull();
      expect(task.dueDate).toBeNull();
    });

    it('trims whitespace on creation and renaming', () => {
      const task = createTask('   system design basics   ', '2026-10-27');
      expect(task.name).toBe('system design basics');

      const renamed = renameTask(task, '  system design advanced  ');
      expect(renamed.name).toBe('system design advanced');
    });
  });

  describe('2. Marking a task as learned (Day 0 & Day 1)', () => {
    it('starts revision schedule at 1st revision on Day 1 counted from Day 0', () => {
      const task = createTask('Binary Search Variations', '2026-10-25');
      const learnedTask = markTaskAsLearned(task, '2026-10-27'); // Day 0 = 2026-10-27

      expect(learnedTask.status).toBe('revising');
      expect(learnedTask.learnedAt).toBe('2026-10-27'); // Day 0
      expect(learnedTask.currentRevision).toBe(1);
      expect(getRevisionLabel(learnedTask.currentRevision)).toBe('1st revision');
      // 1st revision must be Day 1 = Day 0 + 1 day
      expect(learnedTask.dueDate).toBe('2026-10-28');
    });
  });

  describe('3. All three revision dates schedule progression', () => {
    it('schedules exactly 1st revision (Day 1), 2nd revision (Day 3), and 3rd revision (Day 7)', () => {
      const day0 = '2026-10-20';
      const task = createTask('Dynamic Programming LCS', day0);

      // Step 1: Mark as learned on Day 0
      const rev1 = markTaskAsLearned(task, day0);
      expect(rev1.currentRevision).toBe(1);
      expect(getRevisionLabel(rev1.currentRevision)).toBe('1st revision');
      expect(rev1.dueDate).toBe('2026-10-21'); // Day 1

      // Step 2: 1st revision completed Remembered on Day 1
      const rev2 = markRevisionRemembered(rev1, '2026-10-21');
      expect(rev2.currentRevision).toBe(2);
      expect(getRevisionLabel(rev2.currentRevision)).toBe('2nd revision');
      expect(rev2.dueDate).toBe('2026-10-23'); // Day 3 (2026-10-20 + 3 days)

      // Step 3: 2nd revision completed Remembered on Day 3
      const rev3 = markRevisionRemembered(rev2, '2026-10-23');
      expect(rev3.currentRevision).toBe(3);
      expect(getRevisionLabel(rev3.currentRevision)).toBe('3rd revision');
      expect(rev3.dueDate).toBe('2026-10-27'); // Day 7 (2026-10-20 + 7 days)

      // Step 4: 3rd revision completed Remembered on Day 7
      const finished = markRevisionRemembered(rev3, '2026-10-27');
      expect(finished.status).toBe('finished');
      expect(finished.currentRevision).toBeNull();
      expect(finished.dueDate).toBeNull();
    });
  });

  describe('4. Forgotten attempts behavior', () => {
    it('reschedules for the next day and retains the same revision number', () => {
      const day0 = '2026-10-20';
      const task = createTask('Dijkstra Algorithm', day0);
      const rev1 = markTaskAsLearned(task, day0); // Due 2026-10-21 (Day 1)

      // Forgot on Day 1
      const forgot1 = markRevisionForgotten(rev1, '2026-10-21');
      expect(forgot1.currentRevision).toBe(1);
      expect(getRevisionLabel(forgot1.currentRevision)).toBe('1st revision');
      expect(forgot1.dueDate).toBe('2026-10-22'); // Tomorrow

      // Forgot again on Day 2
      const forgot2 = markRevisionForgotten(forgot1, '2026-10-22');
      expect(forgot2.currentRevision).toBe(1);
      expect(getRevisionLabel(forgot2.currentRevision)).toBe('1st revision');
      expect(forgot2.dueDate).toBe('2026-10-23');

      // Finally remembered on Day 3
      const remembered = markRevisionRemembered(forgot2, '2026-10-23');
      expect(remembered.currentRevision).toBe(2);
      expect(getRevisionLabel(remembered.currentRevision)).toBe('2nd revision');
      // Next attempt for 2nd revision is scheduled at least tomorrow
      expect(remembered.dueDate).toBe('2026-10-24');
    });
  });

  describe('5. Overdue tasks and sorting', () => {
    const today = '2026-10-27';

    it('correctly categorizes overdue vs due today vs upcoming', () => {
      const overdueTask: Task = {
        id: '1',
        name: 'Overdue Task',
        status: 'revising',
        createdAt: '2026-10-20',
        learnedAt: '2026-10-20',
        currentRevision: 1,
        dueDate: '2026-10-25', // 2 days ago
      };

      const dueTodayTask: Task = {
        id: '2',
        name: 'Today Task',
        status: 'revising',
        createdAt: '2026-10-26',
        learnedAt: '2026-10-26',
        currentRevision: 1,
        dueDate: '2026-10-27', // today
      };

      const upcomingTask: Task = {
        id: '3',
        name: 'Tomorrow Task',
        status: 'revising',
        createdAt: '2026-10-26',
        learnedAt: '2026-10-26',
        currentRevision: 1,
        dueDate: '2026-10-28', // tomorrow
      };

      expect(isTaskOverdue(overdueTask, today)).toBe(true);
      expect(isTaskDueToday(overdueTask, today)).toBe(false);
      expect(isTaskDueOrOverdue(overdueTask, today)).toBe(true);

      expect(isTaskOverdue(dueTodayTask, today)).toBe(false);
      expect(isTaskDueToday(dueTodayTask, today)).toBe(true);
      expect(isTaskDueOrOverdue(dueTodayTask, today)).toBe(true);

      expect(isTaskOverdue(upcomingTask, today)).toBe(false);
      expect(isTaskDueToday(upcomingTask, today)).toBe(false);
      expect(isTaskDueOrOverdue(upcomingTask, today)).toBe(false);
    });

    it('sorts overdue revisions first, followed by revisions due today', () => {
      const t1: Task = {
        id: '1',
        name: 'Alpha (Due Today)',
        status: 'revising',
        createdAt: '2026-10-26',
        learnedAt: '2026-10-26',
        currentRevision: 1,
        dueDate: '2026-10-27',
      };

      const t2: Task = {
        id: '2',
        name: 'Beta (Overdue by 3 days)',
        status: 'revising',
        createdAt: '2026-10-20',
        learnedAt: '2026-10-20',
        currentRevision: 2,
        dueDate: '2026-10-24',
      };

      const t3: Task = {
        id: '3',
        name: 'Gamma (Overdue by 1 day)',
        status: 'revising',
        createdAt: '2026-10-20',
        learnedAt: '2026-10-20',
        currentRevision: 3,
        dueDate: '2026-10-26',
      };

      const t4: Task = {
        id: '4',
        name: 'Delta (Due Tomorrow)',
        status: 'revising',
        createdAt: '2026-10-27',
        learnedAt: '2026-10-27',
        currentRevision: 1,
        dueDate: '2026-10-28',
      };

      const sorted = sortDueAndOverdueTasks([t1, t2, t3, t4], today);

      // Should only include t2, t3, t1 in that order (Delta is upcoming)
      expect(sorted.length).toBe(3);
      expect(sorted[0].id).toBe('2'); // Oldest overdue first: 2026-10-24
      expect(sorted[1].id).toBe('3'); // Overdue: 2026-10-26
      expect(sorted[2].id).toBe('1'); // Due today: 2026-10-27
    });

    it('displays human-readable overdue and due relative labels', () => {
      expect(getRelativeDueDateText('2026-10-27', today).text).toBe('Today');
      expect(getRelativeDueDateText('2026-10-26', today).text).toBe('Yesterday (Overdue by 1 day)');
      expect(getRelativeDueDateText('2026-10-24', today).text).toBe('Overdue by 3 days');
      expect(getRelativeDueDateText('2026-10-28', today).text).toBe('Tomorrow');
    });
  });

  describe('6. Task completion and restarting', () => {
    it('marks task as Finished after 3rd revision is remembered and leaves no schedule', () => {
      const task: Task = {
        id: 'task-complete',
        name: 'Finished Task',
        status: 'revising',
        createdAt: '2026-10-01',
        learnedAt: '2026-10-01',
        currentRevision: 3,
        dueDate: '2026-10-08',
      };

      const finished = markRevisionRemembered(task, '2026-10-08');
      expect(finished.status).toBe('finished');
      expect(finished.currentRevision).toBeNull();
      expect(finished.dueDate).toBeNull();

      // Restart task
      const restarted = restartTask(finished);
      expect(restarted.status).toBe('learning');
      expect(restarted.learnedAt).toBeNull();
      expect(restarted.currentRevision).toBeNull();
      expect(restarted.dueDate).toBeNull();
    });
  });

  describe('7. Local date calculations and boundary transitions', () => {
    it('handles month end rollover correctly', () => {
      expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
      expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
      expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    });

    it('calculates calendar days difference accurately', () => {
      expect(getDaysDifference('2026-10-20', '2026-10-27')).toBe(7);
      expect(getDaysDifference('2026-10-27', '2026-10-27')).toBe(0);
      expect(getDaysDifference('2026-10-27', '2026-10-25')).toBe(-2);
    });
  });
});
