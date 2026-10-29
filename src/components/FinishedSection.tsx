import React, { useState } from 'react';
import { Task } from '../types';
import { CheckCircle2, RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDisplayDate } from '../services/scheduler';

interface FinishedSectionProps {
  tasks: Task[];
  onRestart: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const FinishedSection: React.FC<FinishedSectionProps> = ({
  tasks,
  onRestart,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between mb-3 px-1 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-700 dark:text-slate-300">
            Finished
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          <span>{isExpanded ? 'Hide' : 'Show'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-white dark:bg-slate-900/80 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {task.name}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-5.5">
                  Completed all 3 revisions {task.learnedAt ? `• Learned on ${formatDisplayDate(task.learnedAt)}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onRestart(task)}
                  className="active-press flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Restart learning"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restart</span>
                </button>
                <button
                  onClick={() => onDelete(task)}
                  className="active-press p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Delete finished task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
