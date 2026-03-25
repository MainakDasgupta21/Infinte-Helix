import React, { useState, useRef, useCallback, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useWellness } from '../../context/WellnessContext';
import { todoAPI } from '../../services/api';
import {
  HiOutlineViewGrid,
  HiOutlinePencilAlt,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineMenu,
  HiOutlinePlus,
  HiOutlineClipboardList,
} from 'react-icons/hi';

const NAV_ITEMS = [
  { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { to: '/todos', icon: HiOutlineClipboardList, label: 'My Tasks' },
  { to: '/reports', icon: HiOutlineChartBar, label: 'Reports' },
  { to: '/calendar', icon: HiOutlineCalendar, label: 'Calendar' },
  { to: '/cycle-mode', icon: HiOutlineSparkles, label: 'Cycle Mode' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

const SWIPE_THRESHOLD = 60;
const SIDEBAR_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

export default function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { todayMetrics, trackerStatus } = useWellness();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickTodo, setQuickTodo] = useState('');
  const [addingTodo, setAddingTodo] = useState(false);

  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const swiping = useRef(false);
  const sidebarRef = useRef(null);

  const isActive = (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/');

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    swiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!swiping.current) return;
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swiping.current) return;
    swiping.current = false;
    const diff = touchCurrentX.current - touchStartX.current;
    if (diff < -SWIPE_THRESHOLD) {
      setCollapsed(true);
      setMobileOpen(false);
    } else if (diff > SWIPE_THRESHOLD) {
      setCollapsed(false);
    }
  }, []);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (e.touches[0].clientX < 20) {
        touchStartX.current = e.touches[0].clientX;
        swiping.current = true;
      }
    };
    const onTouchEnd = () => {
      if (!swiping.current) return;
      swiping.current = false;
      const diff = touchCurrentX.current - touchStartX.current;
      if (diff > SWIPE_THRESHOLD) {
        setMobileOpen(true);
        setCollapsed(false);
      }
    };
    const onTouchMove = (e) => {
      if (swiping.current) touchCurrentX.current = e.touches[0].clientX;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const toggle = () => setCollapsed(prev => !prev);

  const sidebarContent = (
    <aside
      ref={sidebarRef}
      role="navigation"
      aria-label="Main navigation"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ width: collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
      className={`
        h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 relative
        transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:z-50
        ${mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
        max-lg:transition-transform max-lg:duration-300 max-lg:ease-[cubic-bezier(0.4,0,0.2,1)]
        lg:relative lg:translate-x-0
      `}
    >

      {/* Toggle button */}
      <button
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-8 z-20 w-6 h-6 rounded-full bg-white border border-slate-200
                   flex items-center justify-center text-slate-500 hover:text-violet-600
                   transition-all duration-200 hover:scale-110
                   shadow-sm
                   max-lg:hidden focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
      >
        {collapsed
          ? <HiOutlineChevronRight className="w-3 h-3" />
          : <HiOutlineChevronLeft className="w-3 h-3" />}
      </button>

      {/* Logo */}
      <div className={`transition-all duration-300 ${collapsed ? 'p-4' : 'px-6 pt-7 pb-5'}`}>
        <div className="flex items-center gap-3">
<<<<<<< HEAD
          <div className={`rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shrink-0
                          transition-all duration-300 shadow-md shadow-violet-500/20 ${collapsed ? 'w-10 h-10' : 'w-10 h-10'}`}>
            <span className="text-white font-serif font-bold text-sm tracking-tight">IH</span>
          </div>
=======
          <img
            src="/logo.png"
            alt="Infinite Helix"
            className={`rounded-xl shrink-0 object-contain transition-all duration-300 ${collapsed ? 'w-9 h-9' : 'w-10 h-10'}`}
          />
>>>>>>> 9aa662e (Add middleware, calendar providers, theme support, and UI improvement)
          <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <h1 className="font-serif font-bold text-slate-900 text-base leading-tight whitespace-nowrap">Infinite Helix</h1>
            <p className="text-[11px] text-slate-500 font-body whitespace-nowrap tracking-wide">Your Wellness Sanctuary</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden transition-all duration-300 ${collapsed ? 'px-2 py-2' : 'px-3 py-2'}`}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive: navActive }) => {
              const active = navActive || isActive(to);
              return `flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200 group
                ${collapsed ? 'px-3 py-2.5 justify-center' : 'px-3.5 py-2.5'}
                ${active
                  ? 'bg-violet-50 text-violet-700 border border-violet-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'}`;
            }}
          >
            {({ isActive: navActive }) => {
              const active = navActive || isActive(to);
              return (
                <>
                  <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className={`overflow-hidden whitespace-nowrap transition-all duration-300
                    ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    {label}
                  </span>
                  {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />}
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>

      {/* Quick Add Todo */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <input
              type="text"
              value={quickTodo}
              onChange={e => setQuickTodo(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && quickTodo.trim()) {
                  setAddingTodo(true);
                  try {
                    await todoAPI.create(quickTodo.trim());
                    toast.success('Task added');
                    setQuickTodo('');
                  } catch { toast.error('Failed to add task'); }
                  setAddingTodo(false);
                }
              }}
              placeholder="Quick task..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-9 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
            />
            <button
              onClick={async () => {
                if (!quickTodo.trim()) return;
                setAddingTodo(true);
                try {
                  await todoAPI.create(quickTodo.trim());
                  toast.success('Task added');
                  setQuickTodo('');
                } catch { toast.error('Failed to add task'); }
                setAddingTodo(false);
              }}
              disabled={addingTodo || !quickTodo.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all disabled:opacity-30"
              aria-label="Add task"
            >
              <HiOutlinePlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`transition-all duration-300 border-t border-slate-100 ${collapsed ? 'p-3' : 'px-3 pb-4 pt-3'} space-y-3`}>
        {/* Score card */}
        <div className={`bg-slate-50 rounded-xl transition-all duration-300 overflow-hidden border border-slate-200/60 ${collapsed ? 'p-2.5' : 'p-3'}`}>
          {collapsed ? (
            <div className="flex flex-col items-center" title={`Today's Score: ${todayMetrics?.score || 0}%`}>
              <span className="text-xs font-bold text-emerald-600">{Math.round(todayMetrics?.score || 0)}</span>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                  style={{ width: `${todayMetrics?.score || 0}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Today's Score</span>
                <span className="text-xs font-bold text-emerald-600">{Math.round(todayMetrics?.score || 0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                  style={{ width: `${todayMetrics?.score || 0}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* User section */}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-2.5'}`}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-slate-200" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.initials || 'U'}
            </div>
          )}
          <div className={`overflow-hidden transition-all duration-300 min-w-0
            ${collapsed ? 'w-0 h-0 opacity-0' : 'flex-1 opacity-100'}`}>
            <p className="text-sm text-slate-800 truncate font-semibold">{user?.displayName || 'Wellness Seeker'}</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${trackerStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-400 animate-pulse'}`} />
              <span className="text-[11px] text-slate-500">{trackerStatus === 'connected' ? 'Active' : 'Connecting'}</span>
            </div>
          </div>
          <button
            onClick={signOut}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
          >
            <HiOutlineLogout className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        className="fixed top-4 left-4 z-40 p-2.5 rounded-2xl bg-white/80 backdrop-blur-xl
                   text-slate-500 hover:text-slate-800 transition-all lg:hidden
                   focus:outline-none focus:ring-2 focus:ring-helix-lavender-500/30
                   shadow-[0_4px_20px_rgb(0,0,0,0.06)]"
      >
        <HiOutlineMenu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {sidebarContent}
    </>
  );
}
