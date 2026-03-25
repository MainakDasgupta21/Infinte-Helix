import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineClipboardList, HiOutlinePlus, HiOutlineTrash, HiOutlineClock } from 'react-icons/hi';
import { todoAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { checkTodoReminders } from '../../services/todoReminder';

export default function TodayTasks() {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [showInput, setShowInput] = useState(false);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await todoAPI.getToday(userId);
      const list = res.data?.todos || [];
      setTodos(list);
      checkTodoReminders(list);
    } catch { /* offline */ }
  }, [userId]);

  useEffect(() => {
    fetchTodos();
    const iv = setInterval(fetchTodos, 30000);
    return () => clearInterval(iv);
  }, [fetchTodos]);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const res = await todoAPI.create(trimmed, remindAt || null, userId);
      const newTodo = res.data?.todo;
      if (newTodo) {
        setTodos(prev => [...prev, newTodo]);
        toast.success(remindAt ? `Added \u2014 reminder at ${remindAt}` : 'Task added');
      }
    } catch {
      toast.error('Failed to add task');
    }
    setText('');
    setRemindAt('');
    setShowInput(false);
  };

  const handleToggle = async (todoId) => {
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t));
    try {
      await todoAPI.toggle(todoId, userId);
    } catch { /* offline */ }
  };

  const handleDelete = async (todoId) => {
    setTodos(prev => prev.filter(t => t.id !== todoId));
    try {
      await todoAPI.remove(todoId, userId);
    } catch { /* offline */ }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') { setShowInput(false); setText(''); setRemindAt(''); }
  };

  const pending = todos.filter(t => !t.completed);
  const done = todos.filter(t => t.completed);

  return (
    <div className="bento-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-blue-50">
            <HiOutlineClipboardList className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="bento-label">Today's Tasks</h3>
        </div>
        {!showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
            aria-label="Add task"
          >
            <HiOutlinePlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {showInput && (
        <div className="mb-4 space-y-2.5">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buy vegetables, call mom..."
            autoFocus
            className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400/60 focus:outline-none focus:bg-white focus:shadow-[0_2px_12px_rgb(0,0,0,0.04)] transition-all"
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <HiOutlineClock className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="time"
                value={remindAt}
                onChange={e => setRemindAt(e.target.value)}
                className="bg-slate-50 rounded-xl px-3 py-1.5 text-xs text-slate-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">remind at</span>
            </div>
            <button
              onClick={() => { setShowInput(false); setText(''); setRemindAt(''); }}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!text.trim()}
              className="px-4 py-1.5 rounded-xl text-xs font-medium bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 max-h-52 pr-0.5">
        {pending.length === 0 && done.length === 0 && !showInput && (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">{'\u{1F4CB}'}</p>
            <p className="text-xs text-slate-400">No tasks for today</p>
            <button
              onClick={() => setShowInput(true)}
              className="text-xs text-violet-600 mt-2 hover:underline"
            >
              Add your first task
            </button>
          </div>
        )}

        {pending.map(todo => (
          <div
            key={todo.id}
            className="flex items-start gap-3 bg-slate-50/60 rounded-2xl px-4 py-3 group hover:bg-white/60 transition-all"
          >
            <button
              onClick={() => handleToggle(todo.id)}
              className="mt-0.5 w-4.5 h-4.5 rounded-lg border-2 border-slate-200 hover:border-violet-400 flex items-center justify-center shrink-0 transition-colors"
              aria-label="Mark complete"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-600 leading-snug">{todo.text}</p>
              {todo.remind_at && (
                <div className="flex items-center gap-1.5 mt-1">
                  <HiOutlineClock className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] text-slate-400">{todo.remind_at}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => handleDelete(todo.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-300 hover:text-red-600 transition-all"
              aria-label="Delete task"
            >
              <HiOutlineTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {done.length > 0 && (
          <>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pt-3">
              Done ({done.length})
            </p>
            {done.map(todo => (
              <div
                key={todo.id}
                className="flex items-center gap-3 bg-slate-50/40 rounded-2xl px-4 py-2.5 group"
              >
                <button
                  onClick={() => handleToggle(todo.id)}
                  className="w-4.5 h-4.5 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"
                  aria-label="Undo complete"
                >
                  <span className="text-[10px] text-emerald-600">{'\u2713'}</span>
                </button>
                <p className="text-sm text-slate-400 line-through flex-1 min-w-0 truncate">{todo.text}</p>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-300 hover:text-red-600 transition-all"
                  aria-label="Delete task"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {(pending.length > 0 || done.length > 0) && (
        <div className="mt-3 pt-3 flex items-center justify-between"
             style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          <span className="text-[10px] text-slate-400">
            {pending.length} pending{done.length > 0 ? ` \u00B7 ${done.length} done` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
