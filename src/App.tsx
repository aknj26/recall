import React, { useState, useEffect } from 'react';
import { Task } from './types';
import {
  createTask,
  markTaskAsLearned,
  markRevisionRemembered,
  markRevisionForgotten,
  restartTask,
  renameTask,
  sortDueAndOverdueTasks,
  getTodayLocalDate,
  getRevisionLabel,
  isTaskInLast7Days,
} from './services/scheduler';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  STORAGE_KEY,
} from './services/storage';
import { Header } from './components/Header';
import { Navigation, ActivePage } from './components/Navigation';
import { AddTaskForm } from './components/AddTaskForm';
import { DueRevisionsSection } from './components/DueRevisionsSection';
import { LearningSection } from './components/LearningSection';
import { FinishedSection } from './components/FinishedSection';
import { Last7DaysPage } from './components/Last7DaysPage';
import { RenameModal } from './components/RenameModal';
import { BackupModal } from './components/BackupModal';
import { Toast, ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  // Synchronous lazy state initialization
  const [tasks, setTasks] = useState<Task[]>(() => {
    return loadTasksFromStorage();
  });

  const [activePage, setActivePage] = useState<ActivePage>('today');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Synchronous atomic state + storage updater
  const updateTasksAndPersist = (updater: (prev: Task[]) => Task[]) => {
    setTasks((prev) => {
      const next = updater(prev);
      saveTasksToStorage(next);
      return next;
    });
  };

  // Cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const fresh = loadTasksFromStorage();
          setTasks(fresh);
        } catch (err) {
          console.error('Recall: Storage sync error:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle PWA installation prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'retry' = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Recall installed successfully!');
    }
    setDeferredPrompt(null);
  };

  // 1. Add Task - saved immediately
  const handleAddTask = (name: string) => {
    const newTask = createTask(name);
    updateTasksAndPersist((prev) => [newTask, ...prev]);
    showToast(`Added "${newTask.name}" to Learning`);
  };

  // 2. Mark As Learned (Day 0) - saved immediately
  const handleMarkAsLearned = (task: Task) => {
    const today = getTodayLocalDate();
    const updated = markTaskAsLearned(task, today);
    updateTasksAndPersist((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    showToast(`Marked as learned! 1st revision scheduled for tomorrow.`);
  };

  // 3. Remembered - saved immediately
  const handleRemembered = (task: Task) => {
    const today = getTodayLocalDate();
    const updated = markRevisionRemembered(task, today);
    updateTasksAndPersist((prev) => prev.map((t) => (t.id === task.id ? updated : t)));

    if (updated.status === 'finished') {
      showToast(`Finished all 3 revisions for "${task.name}"!`, 'info');
    } else {
      const nextLabel = getRevisionLabel(updated.currentRevision);
      showToast(`Remembered! ${nextLabel} scheduled.`);
    }
  };

  // 4. Forgotten - saved immediately
  const handleForgotten = (task: Task) => {
    const today = getTodayLocalDate();
    const updated = markRevisionForgotten(task, today);
    updateTasksAndPersist((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    const currentLabel = getRevisionLabel(task.currentRevision);
    showToast(`Marked as forgotten. ${currentLabel} rescheduled for tomorrow.`, 'retry');
  };

  // 5. Restart Task - saved immediately
  const handleRestart = (task: Task) => {
    const updated = restartTask(task);
    updateTasksAndPersist((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    showToast(`"${task.name}" restarted and moved to Learning`);
  };

  // 6. Delete Task - saved immediately
  const handleDelete = (task: Task) => {
    updateTasksAndPersist((prev) => prev.filter((t) => t.id !== task.id));
    showToast(`Deleted "${task.name}"`);
  };

  // 7. Save Renamed Task - saved immediately
  const handleSaveRename = (task: Task, newName: string) => {
    const updated = renameTask(task, newName);
    updateTasksAndPersist((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    showToast(`Renamed task to "${updated.name}"`);
  };

  // 8. Handle Backup Import - saved immediately
  const handleImportSuccess = (importedTasks: Task[]) => {
    saveTasksToStorage(importedTasks);
    setTasks(importedTasks);
    showToast(`Imported ${importedTasks.length} tasks!`);
  };

  const today = getTodayLocalDate();

  // Active unarchived tasks for homepage
  const activeTasks = tasks.filter((t) => !t.archived);

  // Homepage sections
  const dueAndOverdueTasks = sortDueAndOverdueTasks(activeTasks, today);
  const learningTasks = activeTasks.filter((t) => t.status === 'learning');
  const finishedTasks = activeTasks.filter((t) => t.status === 'finished');

  // Last 7 days tasks count
  const last7DaysCount = tasks.filter((t) => isTaskInLast7Days(t, today)).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header
        onOpenBackup={() => setIsBackupOpen(true)}
        deferredPrompt={deferredPrompt}
        onInstallApp={handleInstallApp}
      />

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4 pb-24">
        {activePage === 'today' ? (
          <>
            {/* Quick Add Task Form */}
            <AddTaskForm onAddTask={handleAddTask} />

            {/* 1. Due and Overdue Section */}
            <DueRevisionsSection
              tasks={dueAndOverdueTasks}
              onRemembered={handleRemembered}
              onForgotten={handleForgotten}
              onRename={(t) => setEditingTask(t)}
              onDelete={handleDelete}
            />

            {/* 2. Learning Section */}
            <LearningSection
              tasks={learningTasks}
              onMarkAsLearned={handleMarkAsLearned}
              onRename={(t) => setEditingTask(t)}
              onDelete={handleDelete}
            />

            {/* 3. Finished Section */}
            <FinishedSection
              tasks={finishedTasks}
              onRestart={handleRestart}
              onDelete={handleDelete}
            />
          </>
        ) : (
          /* Whole Page: Last 7 Days Overview */
          <Last7DaysPage
            tasks={tasks}
            onUpdateTasks={updateTasksAndPersist}
            onShowToast={showToast}
            onNavigateHome={() => setActivePage('today')}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <Navigation
        activePage={activePage}
        onPageChange={setActivePage}
        dueCount={dueAndOverdueTasks.length}
        last7DaysCount={last7DaysCount}
      />

      {/* Rename Modal */}
      <RenameModal
        task={editingTask}
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveRename}
      />

      {/* Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        tasks={tasks}
        onClose={() => setIsBackupOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Feedback Toast */}
      <Toast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
};

export default App;
