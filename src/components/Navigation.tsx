import React from 'react';
import { CalendarCheck, History } from 'lucide-react';

export type ActivePage = 'today' | 'last7days';

interface NavigationProps {
  activePage: ActivePage;
  onPageChange: (page: ActivePage) => void;
  dueCount: number;
  last7DaysCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activePage,
  onPageChange,
  dueCount,
  last7DaysCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-2 px-6 py-2">
        {/* Today Tab */}
        <button
          onClick={() => onPageChange('today')}
          className={`active-press flex flex-col items-center justify-center py-1 transition-colors relative ${
            activePage === 'today'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <CalendarCheck className="w-5 h-5 mb-0.5" />
            {dueCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {dueCount > 9 ? '9+' : dueCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Today</span>
        </button>

        {/* Last 7 Days Tab */}
        <button
          onClick={() => onPageChange('last7days')}
          className={`active-press flex flex-col items-center justify-center py-1 transition-colors relative ${
            activePage === 'last7days'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <History className="w-5 h-5 mb-0.5" />
            {last7DaysCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[9px] font-bold flex items-center justify-center shadow-xs">
                {last7DaysCount > 9 ? '9+' : last7DaysCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Last 7 Days</span>
        </button>
      </div>
    </nav>
  );
};
