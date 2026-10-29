import { Task, RevisionNumber, RevisionHistoryItem } from '../types';

/**
 * Format Date instance to local YYYY-MM-DD string
 */
export function formatDateToLocalYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string into local midnight Date
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Get today's local date as YYYY-MM-DD
 */
export function getTodayLocalDate(): string {
  return formatDateToLocalYYYYMMDD(new Date());
}

/**
 * Add or subtract days from a YYYY-MM-DD date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateToLocalYYYYMMDD(date);
}

/**
 * Calculate difference in calendar days: toDateStr - fromDateStr
 * E.g., if fromDate is yesterday and toDate is today, returns 1.
 */
export function getDaysDifference(fromDateStr: string, toDateStr: string): number {
  const from = parseLocalDate(fromDateStr).getTime();
  const to = parseLocalDate(toDateStr).getTime();
  const diffMs = to - from;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns the later of two YYYY-MM-DD date strings
 */
export function maxDate(date1: string, date2: string): string {
  return date1 >= date2 ? date1 : date2;
}

/**
 * Human readable revision label (strictly not levels)
 */
export function getRevisionLabel(revision: RevisionNumber | null): string {
  switch (revision) {
    case 1:
      return '1st revision';
    case 2:
      return '2nd revision';
    case 3:
      return '3rd revision';
    default:
      return '';
  }
}

/**
 * Format YYYY-MM-DD for display (e.g. "Tuesday, Oct 27, 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format relative due date text
 */
export function getRelativeDueDateText(dueDateStr: string, todayStr: string = getTodayLocalDate()): {
  text: string;
  isOverdue: boolean;
  isToday: boolean;
  daysDiff: number;
} {
  const diff = getDaysDifference(dueDateStr, todayStr);
  if (diff === 0) {
    return { text: 'Today', isOverdue: false, isToday: true, daysDiff: 0 };
  } else if (diff === 1) {
    return { text: 'Yesterday (Overdue by 1 day)', isOverdue: true, isToday: false, daysDiff: 1 };
  } else if (diff > 1) {
    return { text: `Overdue by ${diff} days`, isOverdue: true, isToday: false, daysDiff: diff };
  } else if (diff === -1) {
    return { text: 'Tomorrow', isOverdue: false, isToday: false, daysDiff: -1 };
  } else {
    return { text: `In ${Math.abs(diff)} days`, isOverdue: false, isToday: false, daysDiff: diff };
  }
}

/**
 * Create a new task in Learning stage
 */
export function createTask(name: string, today: string = getTodayLocalDate()): Task {
  const trimmedName = name.trim();
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    name: trimmedName,
    status: 'learning',
    createdAt: today,
    learnedAt: null,
    currentRevision: null,
    dueDate: null,
    history: [],
  };
}

/**
 * Mark a task as learned.
 * Day 0 = today.
 * 1st revision = Day 1 (Day 0 + 1)
 */
export function markTaskAsLearned(task: Task, today: string = getTodayLocalDate()): Task {
  const firstRevisionDueDate = addDays(today, 1); // Day 1
  return {
    ...task,
    status: 'revising',
    learnedAt: today, // Day 0
    currentRevision: 1,
    dueDate: firstRevisionDueDate,
  };
}

/**
 * Mark a revision as Remembered.
 * - If 1st revision remembered: move to 2nd revision (Day 3 from Day 0, or tomorrow if actionDate >= Day 3)
 * - If 2nd revision remembered: move to 3rd revision (Day 7 from Day 0, or tomorrow if actionDate >= Day 7)
 * - If 3rd revision remembered: task is Finished. No further revisions scheduled.
 */
export function markRevisionRemembered(task: Task, actionDate: string = getTodayLocalDate()): Task {
  if (task.status !== 'revising' || task.currentRevision === null || !task.learnedAt) {
    return task;
  }

  const currentRev = task.currentRevision;
  const historyItem: RevisionHistoryItem = {
    revision: currentRev,
    actionDate,
    result: 'remembered',
    nextDueDate: null,
  };

  if (currentRev === 1) {
    // 2nd revision: Day 3 from learnedAt
    const originalDay3 = addDays(task.learnedAt, 3);
    const tomorrow = addDays(actionDate, 1);
    // Ensure the next revision is scheduled for Day 3, or at least tomorrow if action was delayed
    const nextDueDate = maxDate(originalDay3, tomorrow);
    historyItem.nextDueDate = nextDueDate;

    return {
      ...task,
      currentRevision: 2,
      dueDate: nextDueDate,
      history: [...(task.history || []), historyItem],
    };
  }

  if (currentRev === 2) {
    // 3rd revision: Day 7 from learnedAt
    const originalDay7 = addDays(task.learnedAt, 7);
    const tomorrow = addDays(actionDate, 1);
    // Ensure the next revision is scheduled for Day 7, or at least tomorrow if action was delayed
    const nextDueDate = maxDate(originalDay7, tomorrow);
    historyItem.nextDueDate = nextDueDate;

    return {
      ...task,
      currentRevision: 3,
      dueDate: nextDueDate,
      history: [...(task.history || []), historyItem],
    };
  }

  if (currentRev === 3) {
    // Third revision completed!
    historyItem.nextDueDate = null;
    return {
      ...task,
      status: 'finished',
      currentRevision: null,
      dueDate: null,
      history: [...(task.history || []), historyItem],
    };
  }

  return task;
}

/**
 * Mark a revision as Forgotten.
 * Schedule another attempt for the next day.
 * Keep the same revision number until successfully remembered.
 */
export function markRevisionForgotten(task: Task, actionDate: string = getTodayLocalDate()): Task {
  if (task.status !== 'revising' || task.currentRevision === null) {
    return task;
  }

  const nextAttemptDate = addDays(actionDate, 1);
  const historyItem: RevisionHistoryItem = {
    revision: task.currentRevision,
    actionDate,
    result: 'forgotten',
    nextDueDate: nextAttemptDate,
  };

  return {
    ...task,
    dueDate: nextAttemptDate,
    history: [...(task.history || []), historyItem],
  };
}

/**
 * Restart a finished task back to Learning stage
 */
export function restartTask(task: Task): Task {
  return {
    ...task,
    status: 'learning',
    learnedAt: null,
    currentRevision: null,
    dueDate: null,
  };
}

/**
 * Rename task
 */
export function renameTask(task: Task, newName: string): Task {
  const trimmed = newName.trim();
  if (!trimmed) return task;
  return {
    ...task,
    name: trimmed,
  };
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: Task, today: string = getTodayLocalDate()): boolean {
  return task.status === 'revising' && task.dueDate !== null && task.dueDate < today;
}

/**
 * Check if a task is due today
 */
export function isTaskDueToday(task: Task, today: string = getTodayLocalDate()): boolean {
  return task.status === 'revising' && task.dueDate !== null && task.dueDate === today;
}

/**
 * Check if a task is due or overdue
 */
export function isTaskDueOrOverdue(task: Task, today: string = getTodayLocalDate()): boolean {
  return task.status === 'revising' && task.dueDate !== null && task.dueDate <= today;
}

/**
 * Sort due and overdue tasks:
 * Overdue first (oldest due date first), then due today (alphabetical or due date)
 */
export function sortDueAndOverdueTasks(tasks: Task[], today: string = getTodayLocalDate()): Task[] {
  const dueOrOverdue = tasks.filter((t) => isTaskDueOrOverdue(t, today));

  return dueOrOverdue.sort((a, b) => {
    const aOverdue = isTaskOverdue(a, today);
    const bOverdue = isTaskOverdue(b, today);

    // Overdue tasks come before due today
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // If both overdue, sort oldest due date first (smaller date string comes first)
    if (aOverdue && bOverdue) {
      const dateComparison = (a.dueDate || '').localeCompare(b.dueDate || '');
      if (dateComparison !== 0) return dateComparison;
    }

    // Secondary sort by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Check if a task was created, learned, or had activity in the last 7 days
 */
export function isTaskInLast7Days(task: Task, today: string = getTodayLocalDate()): boolean {
  // Check createdAt
  if (task.createdAt) {
    const diff = getDaysDifference(task.createdAt, today);
    if (diff >= 0 && diff <= 7) return true;
  }

  // Check learnedAt
  if (task.learnedAt) {
    const diff = getDaysDifference(task.learnedAt, today);
    if (diff >= 0 && diff <= 7) return true;
  }

  // Check history entries
  if (Array.isArray(task.history)) {
    for (const h of task.history) {
      if (h.actionDate) {
        const diff = getDaysDifference(h.actionDate, today);
        if (diff >= 0 && diff <= 7) return true;
      }
    }
  }

  // If due date is within the last 7 days or today
  if (task.dueDate) {
    const diff = getDaysDifference(task.dueDate, today);
    if (diff >= 0 && diff <= 7) return true;
  }

  return false;
}

export interface NextRevisionInfo {
  revisionLabel: string;
  dueText: string;
  dueDate: string | null;
  statusType: 'learning' | 'overdue' | 'today' | 'upcoming' | 'finished';
}

/**
 * Get detailed information on which revision is due next for a task
 */
export function getNextRevisionDetails(task: Task, today: string = getTodayLocalDate()): NextRevisionInfo {
  if (task.status === 'learning') {
    return {
      revisionLabel: '1st revision (Pending)',
      dueText: 'Start schedule by clicking "Mark as learned"',
      dueDate: null,
      statusType: 'learning',
    };
  }

  if (task.status === 'finished') {
    return {
      revisionLabel: 'All 3 revisions completed',
      dueText: 'Finished (No more revisions)',
      dueDate: null,
      statusType: 'finished',
    };
  }

  // Task is in 'revising'
  const revLabel = getRevisionLabel(task.currentRevision);
  if (!task.dueDate) {
    return {
      revisionLabel: revLabel,
      dueText: 'Schedule date pending',
      dueDate: null,
      statusType: 'upcoming',
    };
  }

  const relative = getRelativeDueDateText(task.dueDate, today);
  const formattedDate = formatDisplayDate(task.dueDate);

  let statusType: 'overdue' | 'today' | 'upcoming' = 'upcoming';
  if (relative.isOverdue) {
    statusType = 'overdue';
  } else if (relative.isToday) {
    statusType = 'today';
  }

  return {
    revisionLabel: revLabel,
    dueText: `${relative.text} (${formattedDate})`,
    dueDate: task.dueDate,
    statusType,
  };
}

/**
 * Toggle archive status on a task
 */
export function toggleArchiveTask(task: Task, today: string = getTodayLocalDate()): Task {
  const isArchived = Boolean(task.archived);
  return {
    ...task,
    archived: !isArchived,
    archivedAt: !isArchived ? today : null,
  };
}
