import { Task, BackupData, RevisionHistoryItem, RevisionNumber } from '../types';
import { getTodayLocalDate, addDays } from './scheduler';

export const STORAGE_KEY = 'recall_tasks_v1';
export const INITIALIZED_FLAG_KEY = 'recall_initialized_v1';

// In-memory fallback in case localStorage is disabled or throws
let memoryStorageCache: Task[] | null = null;

export function _resetMemoryCache(): void {
  memoryStorageCache = null;
}

/**
 * Default sample task on first launch so user sees the workflow immediately
 */
export const INITIAL_TASKS: Task[] = [
  {
    id: 'demo_1',
    name: 'lcs tut 3 q1',
    status: 'learning',
    createdAt: getTodayLocalDate(),
    learnedAt: null,
    currentRevision: null,
    dueDate: null,
    history: [],
  },
];

/**
 * Sanitize and repair an unknown object into a valid Task.
 * Handles missing or invalid fields gracefully without dropping valid user data.
 */
export function sanitizeAndRepairTask(item: unknown, index: number = 0): Task | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const raw = item as Record<string, unknown>;

  // Extract name (support title or task aliases if imported from other formats)
  let name = '';
  if (typeof raw.name === 'string') {
    name = raw.name.trim();
  } else if (typeof raw.title === 'string') {
    name = raw.title.trim();
  } else if (typeof raw.task === 'string') {
    name = raw.task.trim();
  }

  if (!name) {
    name = `Untitled task ${index + 1}`;
  }

  // Extract or generate id
  let id = '';
  if (typeof raw.id === 'string' && raw.id.trim()) {
    id = raw.id.trim();
  } else if (typeof raw.id === 'number') {
    id = `task_${raw.id}`;
  } else {
    id = `task_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`;
  }

  // Determine status
  let status: 'learning' | 'revising' | 'finished' = 'learning';
  if (raw.status === 'learning' || raw.status === 'revising' || raw.status === 'finished') {
    status = raw.status;
  } else if (raw.finished === true || raw.isFinished === true) {
    status = 'finished';
  } else if (raw.currentRevision === 1 || raw.currentRevision === 2 || raw.currentRevision === 3) {
    status = 'revising';
  }

  // Extract createdAt
  let createdAt = getTodayLocalDate();
  if (typeof raw.createdAt === 'string' && raw.createdAt.trim()) {
    createdAt = raw.createdAt.trim().slice(0, 10);
  }

  // Extract learnedAt
  let learnedAt: string | null = null;
  if (status === 'revising' || status === 'finished') {
    if (typeof raw.learnedAt === 'string' && raw.learnedAt.trim()) {
      learnedAt = raw.learnedAt.trim().slice(0, 10);
    } else {
      learnedAt = createdAt;
    }
  }

  // Extract currentRevision
  let currentRevision: RevisionNumber | null = null;
  if (status === 'revising') {
    if (raw.currentRevision === 1 || raw.currentRevision === 2 || raw.currentRevision === 3) {
      currentRevision = raw.currentRevision as RevisionNumber;
    } else {
      currentRevision = 1;
    }
  }

  // Extract dueDate
  let dueDate: string | null = null;
  if (status === 'revising') {
    if (typeof raw.dueDate === 'string' && raw.dueDate.trim()) {
      dueDate = raw.dueDate.trim().slice(0, 10);
    } else {
      // Recompute default due date based on revision number and learnedAt
      const baseDate = learnedAt || createdAt;
      if (currentRevision === 1) {
        dueDate = addDays(baseDate, 1);
      } else if (currentRevision === 2) {
        dueDate = addDays(baseDate, 3);
      } else {
        dueDate = addDays(baseDate, 7);
      }
    }
  }

  // Extract history
  const history: RevisionHistoryItem[] = [];
  if (Array.isArray(raw.history)) {
    for (const h of raw.history) {
      if (h && typeof h === 'object') {
        const hItem = h as Record<string, unknown>;
        if (
          (hItem.revision === 1 || hItem.revision === 2 || hItem.revision === 3) &&
          (hItem.result === 'remembered' || hItem.result === 'forgotten')
        ) {
          history.push({
            revision: hItem.revision as RevisionNumber,
            actionDate: typeof hItem.actionDate === 'string' ? hItem.actionDate : getTodayLocalDate(),
            result: hItem.result,
            nextDueDate: typeof hItem.nextDueDate === 'string' ? hItem.nextDueDate : null,
          });
        }
      }
    }
  }

  const archived = Boolean(raw.archived);
  const archivedAt = typeof raw.archivedAt === 'string' ? raw.archivedAt : null;

  return {
    id,
    name,
    status,
    createdAt,
    learnedAt,
    currentRevision,
    dueDate,
    archived,
    archivedAt,
    history,
  };
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

/**
 * Load tasks from localStorage synchronously and safely.
 * Will NOT overwrite saved data with an empty initial state.
 */
export function loadTasksFromStorage(): Task[] {
  try {
    const storage = getStorage();
    const raw = storage ? storage.getItem(STORAGE_KEY) : null;
    const isInitialized = storage ? storage.getItem(INITIALIZED_FLAG_KEY) : null;

    if (raw === null) {
      if (isInitialized === 'true') {
        // User had previously initialized and had 0 tasks
        return memoryStorageCache || [];
      }

      // Genuine first run: seed with demo task
      const initial = [...INITIAL_TASKS];
      saveTasksToStorage(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);
    let rawList: unknown[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).tasks)) {
      rawList = (parsed as any).tasks;
    } else {
      console.warn('Recall: unrecognized storage format, attempting recovery');
      return memoryStorageCache || INITIAL_TASKS;
    }

    const seenIds = new Set<string>();
    const loadedTasks: Task[] = [];

    rawList.forEach((item, idx) => {
      const repaired = sanitizeAndRepairTask(item, idx);
      if (repaired && !seenIds.has(repaired.id)) {
        seenIds.add(repaired.id);
        loadedTasks.push(repaired);
      }
    });

    memoryStorageCache = loadedTasks;
    return loadedTasks;
  } catch (error) {
    console.error('Recall: Failed to load tasks from localStorage:', error);
    if (memoryStorageCache !== null) {
      return memoryStorageCache;
    }
    return INITIAL_TASKS;
  }
}

/**
 * Save tasks to localStorage immediately and synchronously.
 */
export function saveTasksToStorage(tasks: Task[]): void {
  memoryStorageCache = tasks;
  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      storage.setItem(INITIALIZED_FLAG_KEY, 'true');
    }
  } catch (error) {
    console.error('Recall: Failed to save tasks to localStorage:', error);
  }
}

/**
 * Export backup as downloadable JSON file
 */
export function exportBackupFile(tasks: Task[]): void {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = getTodayLocalDate();
  a.href = url;
  a.download = `recall-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate imported JSON backup string
 */
export function parseAndValidateBackup(jsonString: string): {
  success: boolean;
  tasks?: Task[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);

    let rawTasks: unknown[] = [];
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed)) {
        rawTasks = parsed;
      } else if (Array.isArray(parsed.tasks)) {
        rawTasks = parsed.tasks;
      } else {
        return { success: false, error: 'JSON does not contain a valid tasks list.' };
      }
    } else {
      return { success: false, error: 'Invalid JSON format.' };
    }

    const seenIds = new Set<string>();
    const validatedTasks: Task[] = [];

    rawTasks.forEach((item, idx) => {
      const repaired = sanitizeAndRepairTask(item, idx);
      if (repaired) {
        let id = repaired.id;
        if (seenIds.has(id)) {
          id = `task_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
          repaired.id = id;
        }
        seenIds.add(id);
        validatedTasks.push(repaired);
      }
    });

    if (validatedTasks.length === 0 && rawTasks.length > 0) {
      return { success: false, error: 'No valid Recall tasks could be extracted from the file.' };
    }

    return { success: true, tasks: validatedTasks };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown parsing error';
    return { success: false, error: `Invalid JSON: ${msg}` };
  }
}
