'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, CheckCircle2, Circle, Trash2, Calendar, GripVertical, Search, Filter, RefreshCw, ChevronDown, Info, X, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

// Configure axios locally if lib/api is problematic
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Completed';
  createdAt: string;
}

const getStatusColor = (status: string) => {
  return status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
};

const BoardColumn = ({
  title,
  status,
  tasks,
  onToggle,
  onDelete,
  onOpenModal,
  onDrop
}: {
  title: string,
  status: 'Pending' | 'Completed',
  tasks: Task[],
  onToggle: (id: string, current: string) => void,
  onDelete: (id: string) => void,
  onOpenModal: () => void,
  onDrop: (status: 'Pending' | 'Completed', e: React.DragEvent) => void
}) => (
  <div
    className="flex flex-col w-full min-w-[320px] max-w-[400px]"
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => onDrop(status, e)}
  >
    <div className="flex items-center justify-between mb-6 px-2">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-[var(--text-primary)] text-lg">{title}</h2>
        <span className="bg-[var(--input-bg)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md text-xs font-medium">
          {tasks.length}
        </span>
      </div>
      <div className="flex gap-1 text-gray-400">
        <button onClick={onOpenModal} className="p-1 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"><Plus size={18} /></button>
      </div>
    </div>

    <div className="flex flex-col gap-4 bg-transparent p-2 rounded-md min-h-[500px]">
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-[var(--card-border)] rounded-md text-[var(--text-secondary)]">
          <p className="text-sm">No tasks here</p>
        </div>
      ) : (
        tasks.map((task) => (
          <div
            key={task._id}
            draggable
            onDragStart={(e) => {
              // @ts-ignore
              e.dataTransfer.setData('taskId', task._id);
            }}
            className="bg-[var(--card-bg)] p-4 rounded-md shadow-sm border border-[var(--card-border)] group cursor-default relative"
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
              <button
                onClick={() => onDelete(task._id)}
                className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-all cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <h3 className={`font-semibold text-[var(--text-primary)] mb-1 line-clamp-2 ${task.status === 'Completed' ? 'line-through opacity-50' : ''}`}>
              {task.title}
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-3 leading-relaxed">
              {task.description}
            </p>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--card-border)]">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs">
                <Calendar size={12} />
                <span>{new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="group/btn relative flex items-center">
                {task.status !== 'Completed' && (
                  <span className="absolute right-full mr-2 text-[9px] font-bold text-gray-400 uppercase tracking-tighter opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none">
                    mark as completed
                  </span>
                )}
                <button
                  onClick={() => onToggle(task._id, task.status)}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${task.status === 'Completed'
                    ? 'text-emerald-500 hover:bg-emerald-500/10'
                    : 'text-[var(--text-secondary)] hover:text-blue-500 hover:bg-blue-500/10'
                    }`}
                >
                  <CheckCircle2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default function Home() {
  const { theme, toggleTheme } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [filterMode, setFilterMode] = useState<'All' | 'Pending' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem('hasSeenDraggableDisclaimer');
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
    }
  }, []);

  const dismissDisclaimer = () => {
    localStorage.setItem('hasSeenDraggableDisclaimer', 'true');
    setShowDisclaimer(false);
  };

  const handleBoardScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      setMobileActiveIndex(newIndex);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks');
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to fetch tasks. Make sure Backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return toast.error('Title is required');

    try {
      const response = await api.post('/tasks', newTask);
      setTasks([response.data, ...tasks]);
      setNewTask({ title: '', description: '' });
      setIsModalOpen(false);
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
    try {
      setTasks(tasks.map(t => t._id === id ? { ...t, status: newStatus as 'Pending' | 'Completed' } : t));
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      setTasks(tasks.map(t => t._id === id ? { ...t, status: currentStatus as 'Pending' | 'Completed' } : t));
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t._id !== id));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleDrop = async (targetStatus: 'Pending' | 'Completed', e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t._id === taskId);

    if (task && task.status !== targetStatus) {
      try {
        // Optimistic update
        setTasks(tasks.map(t => t._id === taskId ? { ...t, status: targetStatus } : t));
        await api.patch(`/tasks/${taskId}/status`, { status: targetStatus });
        toast.success(`Task moved to ${targetStatus}`);
      } catch (error) {
        // Revert on error
        setTasks(tasks.map(t => t._id === taskId ? { ...t, status: task.status } : t));
        toast.error('Failed to move task');
      }
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium">Connecting to Backend...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen text-[var(--text-primary)] p-4 md:p-10 font-[family-name:var(--font-sans)] transition-colors duration-300">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header section */}
      <div className="max-w-7xl mx-auto mb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Project Tasks</h1>
              <p className="text-[var(--text-secondary)] mt-0.5">Manage, track and complete your daily goals.</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 w-full md:w-auto">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:border-blue-500 transition-all shadow-sm active:scale-95"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium text-sm flex items-center gap-2 transition-all shadow-sm active:transform active:scale-95"
            >
              <Plus size={18} />
              Create Task
            </button>
          </div>
        </header>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start relative pb-24 md:pb-0">

        {/* Mobile-Only Header/Greeting inspired by reference */}


        {/* Project Stats - Top on mobile, right on desktop */}
        <aside className="shrink-0 w-full lg:w-80 lg:sticky lg:top-10 order-1 lg:order-2">
          <div className="bg-[var(--stats-bg)] rounded-3xl lg:rounded-md p-6 lg:p-6 text-[var(--stats-text)] shadow-xl shadow-blue-500/20 transition-colors duration-300">
            <div className="lg:hidden mb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Overview</span>
              <h2 className="text-xl font-bold tracking-tight">Good Result!</h2>
            </div>
            <h2 className="hidden lg:block text-lg font-bold mb-8 tracking-tight opacity-90">Project stats</h2>

            <div className="relative flex flex-col items-center">
              <div className="relative w-40 h-28 overflow-hidden">
                <svg viewBox="0 0 100 65" className="w-full h-full">
                  {/* Outer Background Track */}
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Progress Path (The main indicator now) */}
                  <motion.path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="white"
                    strokeWidth="10"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progressPercentage / 100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />

                  {/* Inner Decorative Dashed Arc */}
                  <path
                    d="M 22 50 A 28 28 0 0 1 78 50"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />

                  {/* End Labels */}
                  <text x="6" y="62" fill="white" fontSize="6" fontWeight="bold" opacity="0.6" textAnchor="middle">0%</text>
                  <text x="94" y="62" fill="white" fontSize="6" fontWeight="bold" opacity="0.6" textAnchor="middle">100%</text>

                  {/* Percentage Text Centered below the arc */}
                  <text
                    x="50" y="55"
                    fill="white"
                    fontSize="14"
                    fontWeight="black"
                    textAnchor="middle"
                    className="tracking-tighter"
                  >
                    {progressPercentage}%
                  </text>
                </svg>
              </div>

              {/* Information Grid */}
              <div className="flex justify-between w-full mt-6">
                <div className="flex flex-col gap-1 items-end text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold opacity-60">In Progress</span>
                    <div className="w-2 h-2 rounded-full bg-white/30 border border-white/20"></div>
                  </div>
                  <p className="text-xl font-bold mr-1 tracking-tight">{totalTasks - completedTasks} task</p>
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white opacity-90 shadow-sm"></div>
                    <span className="text-[11px] font-semibold opacity-80">Completed</span>
                  </div>
                  <p className="text-xl font-bold ml-1 tracking-tight">{completedTasks} task</p>
                </div>

              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 w-full order-2 lg:order-1">
          {/* Toolbar - Sticky search on mobile */}
          <div className="sticky top-0 backdrop-blur-md z-30 py-4 lg:py-4 border-y lg:border-y border-[var(--toolbar-border)] flex items-center justify-between mb-8 transition-colors">
            <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto">
              <div className="relative group w-full lg:w-auto">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-3 lg:py-2 bg-[var(--input-bg)] border-none rounded-xl lg:rounded-md text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500/20 focus:bg-[var(--card-bg)] transition-all outline-none w-full lg:w-64"
                />
              </div>
            </div>

            {/* Desktop Filter Dropdown (Custom Implementation) */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] relative">
              <span className="text-[var(--text-secondary)] font-medium font-mono tracking-tight uppercase transition-colors">Sort by:</span>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 font-bold text-[var(--text-primary)] hover:text-blue-600 transition-colors py-1 uppercase"
                >
                  {filterMode}
                  <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <>
                      {/* Invisible backdrop to close on click outside */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-1 w-28 bg-[var(--card-bg)] rounded-md shadow-lg border border-[var(--card-border)] py-1 z-50 overflow-hidden"
                      >
                        {(['All', 'Pending', 'Completed'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => {
                              setFilterMode(mode);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 transition-colors bg-[var(--card-bg)] font-bold uppercase tracking-tight
                              ${filterMode === mode ? 'text-blue-600' : 'text-[var(--text-primary)] hover:text-blue-600'}
                            `}
                          >
                            {mode}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* First-time Draggable Disclaimer */}
          <AnimatePresence>
            {showDisclaimer && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[var(--disclaimer-bg)] border border-[var(--disclaimer-border)] p-3 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-blue-600 p-1 rounded-full text-white shadow-sm">
                      <Info size={12} />
                    </div>
                    <p className="text-[11px] font-semibold text-[var(--disclaimer-text)] uppercase tracking-wider">
                      Quick Tip: All task cards are <span className="underline underline-offset-2">draggable</span>. Move them between columns to update status.
                    </p>
                  </div>
                  <button
                    onClick={dismissDisclaimer}
                    className="p-1 hover:bg-[var(--disclaimer-hover-bg)] text-[var(--disclaimer-icon-color)] hover:text-[var(--disclaimer-icon-hover-color)] rounded-md transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Swipe Indicator (Only for 'All' mode) */}
          {filterMode === 'All' && (
            <div className="lg:hidden flex justify-center gap-1.5 mb-4">
              <div className={`w-1.5 h-1.5 rounded-full ${mobileActiveIndex === 0 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`w-1.5 h-1.5 rounded-full ${mobileActiveIndex === 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
          )}

          {/* Kanban Board */}
          <div
            onScroll={handleBoardScroll}
            className="overflow-x-auto pb-10 scrollbar-hide snap-x snap-mandatory"
          >
            <div className={`flex flex-row lg:flex-row gap-4 lg:gap-8 min-w-full lg:min-w-0 ${filterMode === 'All' ? 'lg:grid lg:grid-cols-2' : 'items-center lg:justify-center'
              }`}>
              {(filterMode === 'All' || filterMode === 'Pending') && (
                <div className="snap-center shrink-0 w-[88vw] lg:w-full ml-4 lg:ml-0">
                  <BoardColumn
                    title="To Do"
                    status="Pending"
                    tasks={tasks.filter(t =>
                      t.status === 'Pending' &&
                      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.description.toLowerCase().includes(searchQuery.toLowerCase()))
                    )}
                    onToggle={toggleStatus}
                    onDelete={deleteTask}
                    onOpenModal={() => setIsModalOpen(true)}
                    onDrop={handleDrop}
                  />
                </div>
              )}
              {(filterMode === 'All' || filterMode === 'Completed') && (
                <div className={`snap-center shrink-0 w-[88vw] lg:w-full mr-4 lg:mr-0`}>
                  <BoardColumn
                    title="Completed"
                    status="Completed"
                    tasks={tasks.filter(t =>
                      t.status === 'Completed' &&
                      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.description.toLowerCase().includes(searchQuery.toLowerCase()))
                    )}
                    onToggle={toggleStatus}
                    onDelete={deleteTask}
                    onOpenModal={() => setIsModalOpen(true)}
                    onDrop={handleDrop}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Action Button (Mobile Only) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
        >
          <Plus size={28} />
        </button>

        {/* Bottom Tab Bar (Mobile Only) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--card-bg)]/95 backdrop-blur-md border-t border-[var(--toolbar-border)] px-8 py-3 flex justify-between items-center z-40 transition-colors">
          {(['All', 'Pending', 'Completed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`flex flex-col items-center gap-1 transition-all ${filterMode === mode ? 'text-blue-600' : 'text-[var(--text-secondary)]'}`}
            >
              {mode === 'All' && <Filter size={20} />}
              {mode === 'Pending' && <Circle size={20} />}
              {mode === 'Completed' && <CheckCircle2 size={20} />}
              <span className="text-[10px] font-bold uppercase tracking-widest">{mode}</span>
            </button>
          ))}
        </div>
      </div>


      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--card-bg)] p-8 rounded-md shadow-2xl z-50 border border-[var(--card-border)]"
            >
              <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">New Task</h2>
              <form onSubmit={createTask} className="flex flex-col gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Audit Architecture"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-md border border-[var(--card-border)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Description</label>
                  <textarea
                    placeholder="Describe what needs to be done..."
                    required
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-md border border-[var(--card-border)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-[var(--input-bg)] text-[var(--text-primary)] resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-[var(--text-secondary)] font-medium rounded-md hover:bg-[var(--input-bg)] transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-all shadow-md active:scale-95"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main >
  );
}
