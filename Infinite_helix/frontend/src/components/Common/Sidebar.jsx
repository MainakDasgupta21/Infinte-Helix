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
} from 'react-icons/hi';

const NAV_ITEMS = [
  { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { to: '/journal', icon: HiOutlinePencilAlt, label: 'Journal' },
  { to: '/reports', icon: HiOutlineChartBar, label: 'Reports' },
  { to: '/calendar', icon: HiOutlineCalendar, label: 'Calendar' },
  { to: '/cycle-mode', icon: HiOutlineSparkles, label: 'Cycle Mode' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

const SWIPE_THRESHOLD = 60;
const SIDEBAR_WIDTH = 256;
const COLLAPSED_WIDTH = 68;

export default function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { todayMetrics, trackerStatus } = useWellness();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickTodo, setQuickTodo] = useState('');
  const [addingTodo, setAddingTodo] = useState(false);

  // Swipe tracking
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const swiping = useRef(false);
  const sidebarRef = useRef(null);

  const isActive = (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/');

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Keyboard shortcut: Ctrl+B to toggle
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

  // Touch handlers for swipe-to-collapse/expand
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
      // Swipe left → collapse
      setCollapsed(true);
      setMobileOpen(false);
    } else if (diff > SWIPE_THRESHOLD) {
      // Swipe right → expand
      setCollapsed(false);
    }
  }, []);

  // Global swipe-from-left-edge to open on mobile
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
        h-screen bg-helix-surface border-r border-helix-border flex flex-col shrink-0 relative
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
        className="absolute -right-3 top-7 z-20 w-6 h-6 rounded-full bg-helix-card border border-helix-border
                   flex items-center justify-center text-helix-muted hover:text-helix-accent hover:border-helix-accent/40
                   transition-all duration-200 hover:scale-110 shadow-lg shadow-black/30
                   max-lg:hidden focus:outline-none focus:ring-2 focus:ring-helix-accent/50"
        title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
      >
        {collapsed
          ? <HiOutlineChevronRight className="w-3 h-3" />
          : <HiOutlineChevronLeft className="w-3 h-3" />}
      </button>

      {/* Logo */}
      <div className={`border-b border-helix-border transition-all duration-300 ${collapsed ? 'p-3' : 'p-6'}`}>
        <div className="flex items-center gap-3">
          <div className={`rounded-xl bg-gradient-to-br from-helix-accent to-helix-sky flex items-center justify-center shrink-0
                          transition-all duration-300 ${collapsed ? 'w-9 h-9' : 'w-10 h-10'}`}>
            <span className="text-white font-display font-bold text-xs tracking-tight">IH</span>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <h1 className="font-display font-semibold text-helix-text text-lg leading-tight whitespace-nowrap">Infinite Helix</h1>
            <p className="text-xs text-helix-muted font-body whitespace-nowrap">Micro Wellness AI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 space-y-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ${collapsed ? 'p-2' : 'p-4'}`}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive: navActive }) => {
              const active = navActive || isActive(to);
              return `flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group border-l-[3px]
                ${collapsed ? 'px-2.5 py-2.5 justify-center' : 'px-4 py-3'}
                ${active
                  ? 'border-helix-accent bg-helix-accent/15 text-helix-accent glow-accent'
                  : 'border-transparent text-helix-muted hover:text-helix-text hover:bg-helix-card/50'}`;
            }}
          >
            {({ isActive: navActive }) => {
              const active = navActive || isActive(to);
              return (
                <>
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-helix-accent' : 'text-helix-muted group-hover:text-helix-text'}`} />
                  <span className={`overflow-hidden whitespace-nowrap transition-all duration-300
                    ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    {label}
                  </span>
                  {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-helix-accent animate-pulse-glow" />}
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>

      {/* Quick Add Todo */}
      {!collapsed && (
        <div className="px-4 pb-2">
          <div className="relative">
            <input
              type="text"
              value={quickTodo}
              onChange={e => setQuickTodo(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && quickTodo.trim()) {
                  setAddingTodo(true);
                  try {
                    await todoAPI.create(quickTodo.trim(), null, user?.uid);
                    toast.success('Task added');
                    setQuickTodo('');
                  } catch { toast.error('Failed'); }
                  setAddingTodo(false);
                }
              }}
              placeholder="Quick task..."
              className="w-full bg-helix-bg/50 border border-helix-border/30 rounded-xl pl-3 pr-8 py-2 text-xs text-helix-text placeholder:text-helix-muted/50 focus:outline-none focus:border-helix-accent/40 transition-colors"
            />
            <button
              onClick={async () => {
                if (!quickTodo.trim()) return;
                setAddingTodo(true);
                try {
                  await todoAPI.create(quickTodo.trim(), null, user?.uid);
                  toast.success('Task added');
                  setQuickTodo('');
                } catch { toast.error('Failed'); }
                setAddingTodo(false);
              }}
              disabled={addingTodo || !quickTodo.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-helix-muted hover:text-helix-accent transition-colors disabled:opacity-30"
              aria-label="Add task"
            >
              <HiOutlinePlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`border-t border-helix-border transition-all duration-300 ${collapsed ? 'p-2' : 'p-4'} space-y-3`}>
        {/* Score card */}
        <div className={`glass-card transition-all duration-300 overflow-hidden ${collapsed ? 'p-2' : 'p-3'}`}>
          {collapsed ? (
            <div className="flex flex-col items-center" title={`Today's Score: ${todayMetrics?.score || 0}%`}>
              <span className="text-xs font-bold text-helix-mint">{todayMetrics?.score || 0}</span>
              <div className="w-full h-1 bg-helix-bg rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-helix-accent to-helix-mint rounded-full transition-all duration-1000"
                  style={{ width: `${todayMetrics?.score || 0}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-helix-muted">Today's Score</span>
                <span className="text-xs font-semibold text-helix-mint">{todayMetrics?.score || 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-helix-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-helix-accent to-helix-mint rounded-full transition-all duration-1000"
                  style={{ width: `${todayMetrics?.score || 0}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* User section */}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-3 px-2'}`}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-helix-sky to-helix-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.initials || 'U'}
            </div>
          )}
          <div className={`overflow-hidden transition-all duration-300 min-w-0
            ${collapsed ? 'w-0 h-0 opacity-0' : 'flex-1 opacity-100'}`}>
            <p className="text-sm text-helix-text truncate">{user?.displayName || 'User'}</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${trackerStatus === 'connected' ? 'bg-helix-mint' : 'bg-helix-red'}`} />
              <span className="text-xs text-helix-muted">{trackerStatus === 'connected' ? 'Tracking' : 'Offline'}</span>
            </div>
          </div>
          <button
            onClick={signOut}
            title="Sign Out"
            className={`p-1.5 rounded-lg text-helix-muted hover:text-helix-red hover:bg-helix-red/10 transition-all
              ${collapsed ? '' : ''}`}
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
        className="fixed top-4 left-4 z-40 p-2 rounded-xl bg-helix-card/80 backdrop-blur-lg border border-helix-border
                   text-helix-muted hover:text-helix-text transition-all lg:hidden focus:outline-none focus:ring-2 focus:ring-helix-accent/50"
      >
        <HiOutlineMenu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {sidebarContent}
    </>
  );
}
