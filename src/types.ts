export type RevisionNumber = 1 | 2 | 3;

export type TaskStatus = 'learning' | 'revising' | 'finished';

export interface RevisionHistoryItem {
  revision: RevisionNumber;
  actionDate: string; // YYYY-MM-DD
  result: 'remembered' | 'forgotten';
  nextDueDate: string | null;
}

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  createdAt: string; // YYYY-MM-DD
  learnedAt: string | null; // YYYY-MM-DD (Day 0)
  currentRevision: RevisionNumber | null;
  dueDate: string | null; // YYYY-MM-DD
  archived?: boolean;
  archivedAt?: string | null;
  history?: RevisionHistoryItem[];
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  tasks: Task[];
}
