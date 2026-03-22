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
    <div className="glass-card p-5 h-full flex flex-col rounded-2xl border border-helix-border/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-helix-sky/10">
            <HiOutlineClipboardList className="w-4 h-4 text-helix-sky" />
          </div>
          <h3 className="text-[13px] uppercase tracking-[0.06em] font-semibold text-helix-muted">
            Today's Tasks
          </h3>
        </div>
        {!showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="p-1.5 rounded-lg text-helix-muted hover:text-helix-accent hover:bg-helix-accent/10 transition-all"
            aria-label="Add task"
          >
            <HiOutlinePlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick add input */}
      {showInput && (
        <div className="mb-3 space-y-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buy vegetables, call mom..."
            autoFocus
            className="w-full bg-helix-bg/50 border border-helix-border/30 rounded-xl px-3 py-2 text-sm text-helix-text placeholder:text-helix-muted/50 focus:outline-none focus:border-helix-accent/40"
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <HiOutlineClock className="w-3.5 h-3.5 text-helix-muted" />
              <input
                type="time"
                value={remindAt}
                onChange={e => setRemindAt(e.target.value)}
                className="bg-helix-bg/50 border border-helix-border/30 rounded-lg px-2 py-1 text-xs text-helix-text focus:outline-none focus:border-helix-accent/40"
              />
              <span className="text-[10px] text-helix-muted">remind at</span>
            </div>
            <button
              onClick={() => { setShowInput(false); setText(''); setRemindAt(''); }}
              className="px-3 py-1.5 rounded-lg text-xs text-helix-muted hover:text-helix-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!text.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-helix-accent/15 text-helix-accent hover:bg-helix-accent/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 max-h-52 pr-0.5">
        {pending.length === 0 && done.length === 0 && !showInput && (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">{'\u{1F4CB}'}</p>
            <p className="text-xs text-helix-muted">No tasks for today</p>
            <button
              onClick={() => setShowInput(true)}
              className="text-xs text-helix-accent mt-1 hover:underline"
            >
              Add your first task
            </button>
          </div>
        )}

        {pending.map(todo => (
          <div
            key={todo.id}
            className="flex items-start gap-2.5 bg-helix-bg/40 rounded-xl px-3 py-2.5 border border-helix-border/20 group hover:border-helix-accent/20 transition-colors"
          >
            <button
              onClick={() => handleToggle(todo.id)}
              className="mt-0.5 w-4 h-4 rounded-md border-2 border-helix-border/50 hover:border-helix-accent flex items-center justify-center shrink-0 transition-colors"
              aria-label="Mark complete"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-helix-text leading-snug">{todo.text}</p>
              {todo.remind_at && (
                <div className="flex items-center gap-1 mt-1">
                  <HiOutlineClock className="w-3 h-3 text-helix-muted" />
                  <span className="text-[10px] text-helix-muted">{todo.remind_at}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => handleDelete(todo.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-helix-muted hover:text-helix-red transition-all"
              aria-label="Delete task"
            >
              <HiOutlineTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {done.length > 0 && (
          <>
            <p className="text-[10px] text-helix-muted font-medium uppercase tracking-wider pt-2">
              Done ({done.length})
            </p>
            {done.map(todo => (
              <div
                key={todo.id}
                className="flex items-center gap-2.5 bg-helix-bg/20 rounded-xl px-3 py-2 border border-helix-border/10 group"
              >
                <button
                  onClick={() => handleToggle(todo.id)}
                  className="w-4 h-4 rounded-md bg-helix-mint/20 border-2 border-helix-mint/40 flex items-center justify-center shrink-0"
                  aria-label="Undo complete"
                >
                  <span className="text-[10px] text-helix-mint">{'\u2713'}</span>
                </button>
                <p className="text-sm text-helix-muted line-through flex-1 min-w-0 truncate">{todo.text}</p>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-helix-muted hover:text-helix-red transition-all"
                  aria-label="Delete task"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer count */}
      {(pending.length > 0 || done.length > 0) && (
        <div className="mt-2 pt-2 border-t border-helix-border/15 flex items-center justify-between">
          <span className="text-[10px] text-helix-muted">
            {pending.length} pending{done.length > 0 ? ` \u00B7 ${done.length} done` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
