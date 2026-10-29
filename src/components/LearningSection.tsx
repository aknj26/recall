import React from 'react';
import { Task } from '../types';
import { BookOpen, CheckCircle, Pencil, Trash2, Sparkles } from 'lucide-react';
import { formatDisplayDate } from '../services/scheduler';

interface LearningSectionProps {
  tasks: Task[];
  onMarkAsLearned: (task: Task) => void;
  onRename: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const LearningSection: React.FC<LearningSectionProps> = ({
  tasks,
  onMarkAsLearned,
  onRename,
  onDelete,
}) => {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-700 dark:text-slate-300">
            Learning
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {tasks.length}
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-5 text-center bg-white/50 dark:bg-slate-900/40">
          <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No active learning tasks. Use the input above to add topics or questions you are currently studying.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  <Sparkles className="w-3 h-3" />
                  Learning
                </span>

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

              <h3 className="text-base font-semibold text-slate-900 dark:text-white break-words mb-1">
                {task.name}
              </h3>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
                Added {formatDisplayDate(task.createdAt)}
              </div>

              <button
                onClick={() => onMarkAsLearned(task)}
                className="active-press w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <CheckCircle className="w-4 h-4 stroke-[2.2]" />
                <span>Mark as learned</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
