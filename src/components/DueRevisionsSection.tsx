import React from 'react';
import { Task } from '../types';
import {
  getRevisionLabel,
  formatDisplayDate,
  getRelativeDueDateText,
  isTaskOverdue,
  getTodayLocalDate,
} from '../services/scheduler';
import { Check, RotateCcw, AlertCircle, Calendar, Pencil, Trash2 } from 'lucide-react';

interface DueRevisionsSectionProps {
  tasks: Task[];
  onRemembered: (task: Task) => void;
  onForgotten: (task: Task) => void;
  onRename: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const DueRevisionsSection: React.FC<DueRevisionsSectionProps> = ({
  tasks,
  onRemembered,
  onForgotten,
  onRename,
  onDelete,
}) => {
  const today = getTodayLocalDate();

  const overdueCount = tasks.filter((t) => isTaskOverdue(t, today)).length;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-700 dark:text-slate-300">
            Due & Overdue
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {tasks.length}
          </span>
        </div>

        {overdueCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
            <AlertCircle className="w-3 h-3" />
            {overdueCount} {overdueCount === 1 ? 'task overdue' : 'tasks overdue'}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center bg-white/50 dark:bg-slate-900/40">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            All caught up for today!
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            No revisions due right now. Mark learning tasks as learned or add new tasks below.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const overdue = isTaskOverdue(task, today);
            const relativeDate = getRelativeDueDateText(task.dueDate || today, today);
            const revisionText = getRevisionLabel(task.currentRevision);

            return (
              <div
                key={task.id}
                className={`relative rounded-xl border p-4 transition-all bg-white dark:bg-slate-900 shadow-sm ${
                  overdue
                    ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header row: Revision badge + Overdue alert */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                      {revisionText}
                    </span>

                    {overdue ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <AlertCircle className="w-3 h-3" />
                        {relativeDate.text}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Calendar className="w-3 h-3" />
                        Due today
                      </span>
                    )}
                  </div>

                  {/* Actions: Rename / Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRename(task)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Rename task"
                      aria-label="Rename task"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(task)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete task"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Task name */}
                <h3 className="text-base font-semibold text-slate-900 dark:text-white break-words mb-2">
                  {task.name}
                </h3>

                {/* Due date info */}
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 flex items-center gap-1">
                  <span>Due date:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {task.dueDate ? formatDisplayDate(task.dueDate) : 'Today'}
                  </span>
                </div>

                {/* Revision Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onRemembered(task)}
                    className="active-press flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Remembered</span>
                  </button>

                  <button
                    onClick={() => onForgotten(task)}
                    className="active-press flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                    <span>Forgotten</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
