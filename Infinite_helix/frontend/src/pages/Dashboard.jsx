import React from 'react';
import { useWellness } from '../context/WellnessContext';
import { useAuth } from '../context/AuthContext';
import ProductivityScore from '../components/Dashboard/ProductivityScore';
import ScreenTimeChart from '../components/Dashboard/ScreenTimeChart';
import BreakBalance from '../components/Dashboard/BreakBalance';
import HydrationTracker from '../components/Dashboard/HydrationTracker';
import FocusTimeline from '../components/Dashboard/FocusTimeline';
import NudgeFeed from '../components/Dashboard/NudgeFeed';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { todayMetrics } = useWellness();
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="bg-mesh rounded-2xl p-6 border border-helix-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-helix-text">
              {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'} ✨
            </h1>
            <p className="text-sm text-helix-muted mt-1">
              Here's your wellness snapshot for today. You're on a {todayMetrics.streakDays}-day streak!
            </p>
          </div>
          <div className="flex gap-3">
            <div className="glass-card px-4 py-2 text-center">
              <p className="text-xs text-helix-muted">Focus Sessions</p>
              <p className="text-lg font-semibold text-helix-accent">{todayMetrics.focusSessions.length}</p>
            </div>
            <div className="glass-card px-4 py-2 text-center">
              <p className="text-xs text-helix-muted">Breaks Taken</p>
              <p className="text-lg font-semibold text-helix-sky">{todayMetrics.breaks.taken}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProductivityScore
          score={todayMetrics.score}
          streakDays={todayMetrics.streakDays}
          mood={todayMetrics.mood}
        />
        <ScreenTimeChart screenTime={todayMetrics.screenTime} />
        <BreakBalance breaks={todayMetrics.breaks} />
        <HydrationTracker />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FocusTimeline sessions={todayMetrics.focusSessions} />
        <NudgeFeed />
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-helix-mint animate-pulse" />
            <span className="text-xs text-helix-muted">AI Wellness Engine Active</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-helix-muted">
            <span>Keyboard: <span className="text-helix-text">Active</span></span>
            <span>Screen: <span className="text-helix-text">{todayMetrics.screenTime.total}h</span></span>
            <span>Next nudge: <span className="text-helix-text">~12 min</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
