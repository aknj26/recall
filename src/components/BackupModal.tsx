import React, { useRef, useState } from 'react';
import { Task } from '../types';
import { exportBackupFile, parseAndValidateBackup } from '../services/storage';
import { X, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  tasks: Task[];
  onClose: () => void;
  onImportSuccess: (importedTasks: Task[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  tasks,
  onClose,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      exportBackupFile(tasks);
      setStatusMessage({
        type: 'success',
        text: `Exported ${tasks.length} tasks to JSON backup file.`,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Failed to generate backup export.',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseAndValidateBackup(content);
      if (result.success && result.tasks) {
        onImportSuccess(result.tasks);
        setStatusMessage({
          type: 'success',
          text: `Successfully imported ${result.tasks.length} tasks!`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Failed to import backup.',
        });
      }
    };
    reader.onerror = () => {
      setStatusMessage({
        type: 'error',
        text: 'Failed to read file.',
      });
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Backup & Restore
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Export your tasks and revision progress as a JSON backup, or restore from a previously exported file.
        </p>

        {statusMessage && (
          <div
            className={`flex items-start gap-2 p-2.5 rounded-lg text-xs mb-4 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.2" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.2" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="space-y-2.5">
          <button
            onClick={handleExport}
            className="active-press w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export backup (JSON)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="active-press w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import backup (JSON)</span>
          </button>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
