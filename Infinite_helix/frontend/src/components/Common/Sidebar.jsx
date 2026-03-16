import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWellness } from '../../context/WellnessContext';
import {
  HiOutlineViewGrid,
  HiOutlinePencilAlt,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineCog,
} from 'react-icons/hi';

const NAV_ITEMS = [
  { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { to: '/journal', icon: HiOutlinePencilAlt, label: 'Journal' },
  { to: '/reports', icon: HiOutlineChartBar, label: 'Reports' },
  { to: '/calendar', icon: HiOutlineCalendar, label: 'Calendar' },
  { to: '/cycle-mode', icon: HiOutlineSparkles, label: 'Cycle Mode' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { todayMetrics, trackerStatus } = useWellness();

  const isActive = (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/');

  return (
    <aside className="w-64 h-screen bg-helix-surface border-r border-helix-border flex flex-col shrink-0">
      <div className="p-6 border-b border-helix-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-helix-accent to-helix-pink flex items-center justify-center">
            <span className="text-white font-display font-bold text-lg">∞</span>
          </div>
          <div>
            <h1 className="font-display font-semibold text-helix-text text-lg leading-tight">Infinite Helix</h1>
            <p className="text-xs text-helix-muted font-body">Micro Wellness AI</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
              isActive(to)
                ? 'bg-helix-accent/15 text-helix-accent glow-accent'
                : 'text-helix-muted hover:text-helix-text hover:bg-helix-card/50'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive(to) ? 'text-helix-accent' : 'text-helix-muted group-hover:text-helix-text'}`} />
            {label}
            {isActive(to) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-helix-accent animate-pulse-glow" />}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-helix-border space-y-4">
        <div className="glass-card p-3">
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
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-helix-pink to-helix-accent flex items-center justify-center text-xs font-bold text-white">
            {user?.initials || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-helix-text truncate">{user?.displayName || 'User'}</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${trackerStatus === 'connected' ? 'bg-helix-mint' : 'bg-helix-red'}`} />
              <span className="text-xs text-helix-muted">{trackerStatus === 'connected' ? 'Tracking' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
