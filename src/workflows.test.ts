import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTask,
  markTaskAsLearned,
  markRevisionRemembered,
  markRevisionForgotten,
  restartTask,
  getRevisionLabel,
  sortDueAndOverdueTasks,
  isTaskOverdue,
  isTaskDueToday,
} from './services/scheduler';
import { parseAndValidateBackup } from './services/storage';

describe('Recall End-to-End Workflows', () => {
  beforeEach(() => {
    // Clear state
  });

  it('Complete Workflow: Learning -> 1st Revision -> Forgotten retry -> 2nd Revision -> 3rd Revision -> Finished', () => {
    // 1. User adds a task while learning it
    let task = createTask('lcs tut 3 q1', '2026-10-20');
    expect(task.status).toBe('learning');
    expect(task.name).toBe('lcs tut 3 q1');
    expect(task.learnedAt).toBeNull();
    expect(task.currentRevision).toBeNull();
    expect(task.dueDate).toBeNull();

    // Verify it does NOT appear in Due/Overdue yet
    let dueList = sortDueAndOverdueTasks([task], '2026-10-20');
    expect(dueList).toHaveLength(0);

    // 2. User marks task as learned on Day 0 (2026-10-20)
    task = markTaskAsLearned(task, '2026-10-20');
    expect(task.status).toBe('revising');
    expect(task.learnedAt).toBe('2026-10-20'); // Day 0
    expect(task.currentRevision).toBe(1);
    expect(getRevisionLabel(task.currentRevision)).toBe('1st revision');
    expect(task.dueDate).toBe('2026-10-21'); // Day 1

    // On Day 0 (2026-10-20), it is not due yet
    expect(sortDueAndOverdueTasks([task], '2026-10-20')).toHaveLength(0);

    // On Day 1 (2026-10-21), it appears as Due Today
    dueList = sortDueAndOverdueTasks([task], '2026-10-21');
    expect(dueList).toHaveLength(1);
    expect(dueList[0].id).toBe(task.id);
    expect(isTaskDueToday(dueList[0], '2026-10-21')).toBe(true);

    // 3. User forgets 1st revision on Day 1
    task = markRevisionForgotten(task, '2026-10-21');
    expect(task.currentRevision).toBe(1); // Keeps 1st revision
    expect(getRevisionLabel(task.currentRevision)).toBe('1st revision');
    expect(task.dueDate).toBe('2026-10-22'); // Rescheduled for next day

    // 4. On Day 2 (2026-10-22), user remembers 1st revision
    task = markRevisionRemembered(task, '2026-10-22');
    expect(task.currentRevision).toBe(2);
    expect(getRevisionLabel(task.currentRevision)).toBe('2nd revision');
    expect(task.dueDate).toBe('2026-10-23'); // Day 3 (2026-10-20 + 3)

    // 5. On Day 3 (2026-10-23), 2nd revision is due
    expect(isTaskDueToday(task, '2026-10-23')).toBe(true);
    task = markRevisionRemembered(task, '2026-10-23');
    expect(task.currentRevision).toBe(3);
    expect(getRevisionLabel(task.currentRevision)).toBe('3rd revision');
    expect(task.dueDate).toBe('2026-10-27'); // Day 7 (2026-10-20 + 7)

    // 6. On Day 7 (2026-10-27), user completes 3rd revision
    task = markRevisionRemembered(task, '2026-10-27');
    expect(task.status).toBe('finished');
    expect(task.currentRevision).toBeNull();
    expect(task.dueDate).toBeNull();

    // Verify it is no longer in Due/Overdue list
    expect(sortDueAndOverdueTasks([task], '2026-10-27')).toHaveLength(0);

    // 7. User restarts finished task
    task = restartTask(task);
    expect(task.status).toBe('learning');
    expect(task.learnedAt).toBeNull();
    expect(task.currentRevision).toBeNull();
    expect(task.dueDate).toBeNull();
  });

  it('Overdue Workflow: missed revisions remain overdue and are never skipped', () => {
    let task = createTask('sql joins practice', '2026-10-15');
    task = markTaskAsLearned(task, '2026-10-15'); // Day 0 = 2026-10-15, Day 1 = 2026-10-16

    // Fast forward 5 days without touching the app (today is 2026-10-21)
    const today = '2026-10-21';
    expect(isTaskOverdue(task, today)).toBe(true);
    expect(task.currentRevision).toBe(1); // Revision is NOT skipped automatically!

    const dueAndOverdue = sortDueAndOverdueTasks([task], today);
    expect(dueAndOverdue).toHaveLength(1);
    expect(dueAndOverdue[0].id).toBe(task.id);
    expect(isTaskOverdue(dueAndOverdue[0], today)).toBe(true);

    // User finally completes 1st revision on 2026-10-21
    task = markRevisionRemembered(task, today);
    expect(task.currentRevision).toBe(2);
    // Since original Day 3 (2026-10-18) has already passed, next revision is set for tomorrow (2026-10-22)
    expect(task.dueDate).toBe('2026-10-22');
  });

  it('Backup & Restore Workflow: export and import tasks seamlessly', () => {
    const t1 = createTask('t1', '2026-10-27');
    const t2 = markTaskAsLearned(createTask('t2', '2026-10-20'), '2026-10-20');

    const backupPayload = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: [t1, t2],
    });

    const parsed = parseAndValidateBackup(backupPayload);
    expect(parsed.success).toBe(true);
    expect(parsed.tasks).toHaveLength(2);
    expect(parsed.tasks![0].name).toBe('t1');
    expect(parsed.tasks![1].name).toBe('t2');
    expect(parsed.tasks![1].status).toBe('revising');
  });
});
