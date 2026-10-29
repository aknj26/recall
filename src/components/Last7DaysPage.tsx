import React, { useState } from 'react';
import { Task } from '../types';
import {
  isTaskInLast7Days,
  getNextRevisionDetails,
  toggleArchiveTask,
  formatDisplayDate,
  getTodayLocalDate,
  addDays,
} from '../services/scheduler';
import {
  Calendar,
  Archive,
  ArchiveRestore,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface Last7DaysPageProps {
  tasks: Task[];
  onUpdateTasks: (updater: (prev: Task[]) => Task[]) => void;
  onShowToast: (text: string, type?: 'success' | 'info' | 'retry') => void;
  onNavigateHome: () => void;
}

type FilterOption = 'all' | 'revising' | 'learning' | 'finished' | 'archived';

export const Last7DaysPage: React.FC<Last7DaysPageProps> = ({
  tasks,
  onUpdateTasks,
  onShowToast,
  onNavigateHome,
}) => {
  const [filter, setFilter] = useState<FilterOption>('all');
  const today = getTodayLocalDate();
  const sevenDaysAgo = addDays(today, -7);

  // Filter tasks that belong to the last 7 days
  const last7DaysTasks = tasks.filter((t) => isTaskInLast7Days(t, today));

  // Count metrics
  const activeTasks = last7DaysTasks.filter((t) => !t.archived);
  const archivedTasks = last7DaysTasks.filter((t) => t.archived);
  const revisingCount = activeTasks.filter((t) => t.status === 'revising').length;
  const learningCount = activeTasks.filter((t) => t.status === 'learning').length;
  const finishedCount = activeTasks.filter((t) => t.status === 'finished').length;

  // Filter based on selected tab
  const displayedTasks = last7DaysTasks.filter((task) => {
    if (filter === 'archived') return Boolean(task.archived);
    if (task.archived && filter !== 'all') return false; // Hide archived unless viewing all or archived tab
    if (filter === 'all') return true;
    return task.status === filter;
  });

  // Sort: newest tasks first (by learnedAt or createdAt)
  const sortedTasks = [...displayedTasks].sort((a, b) => {
    const dateA = a.learnedAt || a.createdAt || '';
    const dateB = b.learnedAt || b.createdAt || '';
    return dateB.localeCompare(dateA);
  });

  const handleToggleArchive = (task: Task) => {
    const updated = toggleArchiveTask(task, today);
    onUpdateTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    if (updated.archived) {
      onShowToast(`Archived "${task.name}"`, 'info');
    } else {
      onShowToast(`Restored "${task.name}" from archive`);
    }
  };

  return (
    <div className="pb-16 animate-fade-in">
      {/* Date Range & Overview Banner */}
      <div className="mb-4 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-950 text-white rounded-2xl p-4 shadow-sm border border-slate-700/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Last 7 Days Activity</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/80">
            {formatDisplayDate(sevenDaysAgo).slice(0, -6)} – Today
          </span>
        </div>

        <h2 className="text-lg font-bold tracking-tight mb-3">
          7-Day Revision Timeline
        </h2>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-700/60 text-xs">
          <div className="bg-white/5 rounded-lg py-1.5 px-1">
            <div className="text-base font-bold text-white">{last7DaysTasks.length}</div>
            <div className="text-[10px] text-slate-400">Total</div>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5 px-1">
            <div className="text-base font-bold text-blue-400">{revisingCount}</div>
            <div className="text-[10px] text-slate-400">Revising</div>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5 px-1">
            <div className="text-base font-bold text-amber-400">{learningCount}</div>
            <div className="text-[10px] text-slate-400">Learning</div>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5 px-1">
            <div className="text-base font-bold text-emerald-400">{finishedCount}</div>
            <div className="text-[10px] text-slate-400">Finished</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-4">
        {(
          [
            { id: 'all', label: `All (${last7DaysTasks.length})` },
            { id: 'revising', label: `Revising (${revisingCount})` },
            { id: 'learning', label: `Learning (${learningCount})` },
            { id: 'finished', label: `Finished (${finishedCount})` },
            { id: 'archived', label: `Archived (${archivedTasks.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`active-press shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === tab.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {sortedTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white/60 dark:bg-slate-900/40">
          <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {filter === 'archived'
              ? 'No archived tasks in the last 7 days'
              : 'No tasks found for this filter'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {last7DaysTasks.length === 0
              ? 'Tasks added or revised in the last 7 days will automatically appear here with their upcoming revision dates.'
              : 'Try selecting a different filter tab above.'}
          </p>
          {last7DaysTasks.length === 0 && (
            <button
              onClick={onNavigateHome}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Go to Homepage & Add Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => {
            const nextInfo = getNextRevisionDetails(task, today);
            const isArchived = Boolean(task.archived);

            return (
              <div
                key={task.id}
                className={`rounded-2xl border p-4 bg-white dark:bg-slate-900 shadow-sm transition-all ${
                  isArchived
                    ? 'border-slate-200 dark:border-slate-800 opacity-75 bg-slate-50/50 dark:bg-slate-900/50'
                    : nextInfo.statusType === 'overdue'
                    ? 'border-rose-300 dark:border-rose-900/70 bg-rose-50/10'
                    : nextInfo.statusType === 'today'
                    ? 'border-emerald-300 dark:border-emerald-800'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header: Status badge & Archive action */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {task.status === 'learning' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        <Sparkles className="w-3 h-3" />
                        Learning
                      </span>
                    )}

                    {task.status === 'revising' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        <Clock className="w-3 h-3" />
                        In Revision
                      </span>
                    )}

                    {task.status === 'finished' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Finished
                      </span>
                    )}

                    {isArchived && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Archive className="w-2.5 h-2.5" />
                        Archived
                      </span>
                    )}
                  </div>

                  {/* Archive / Restore Button */}
                  <button
                    onClick={() => handleToggleArchive(task)}
                    className="active-press flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={isArchived ? 'Restore to active list' : 'Archive this task'}
                  >
                    {isArchived ? (
                      <>
                        <ArchiveRestore className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Unarchive</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3 h-3 text-slate-400" />
                        <span>Archive</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Task Name */}
                <h3 className="text-base font-semibold text-slate-900 dark:text-white break-words mb-2.5">
                  {task.name}
                </h3>

                {/* Which Revision is Due Next (Key Requirement) */}
                <div
                  className={`rounded-xl p-3 border text-xs mb-2.5 ${
                    nextInfo.statusType === 'overdue'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                      : nextInfo.statusType === 'today'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : nextInfo.statusType === 'finished'
                      ? 'bg-slate-100/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      : 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      {nextInfo.statusType === 'overdue' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                      <span>Next Due: {nextInfo.revisionLabel}</span>
                    </span>

                    {nextInfo.statusType === 'overdue' && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        Overdue
                      </span>
                    )}
                    {nextInfo.statusType === 'today' && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] opacity-90">
                    {nextInfo.dueText}
                  </p>
                </div>

                {/* Footer Dates Information */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                  <span>
                    Added: {formatDisplayDate(task.createdAt)}
                  </span>
                  {task.learnedAt && (
                    <span>
                      Learned (Day 0): {formatDisplayDate(task.learnedAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
