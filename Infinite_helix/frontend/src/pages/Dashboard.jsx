import React, { useEffect } from 'react';
import { useWellness } from '../context/WellnessContext';
import { useAuth } from '../context/AuthContext';
import { usePageContext } from '../context/PageContext';
import ProductivityScore from '../components/Dashboard/ProductivityScore';
import ScreenTimeChart from '../components/Dashboard/ScreenTimeChart';
import BreakBalance from '../components/Dashboard/BreakBalance';
import HydrationTracker from '../components/Dashboard/HydrationTracker';
import FocusTimeline from '../components/Dashboard/FocusTimeline';
import NudgeFeed from '../components/Dashboard/NudgeFeed';
import SelfCareTracker from '../components/Dashboard/SelfCareTracker';
import TodayTasks from '../components/Dashboard/TodayTasks';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function wellnessStatusLine(score) {
  const s = Number(score) || 0;
  if (s >= 80) return "You're having a strong day.";
  if (s >= 60) return 'Steady progress today — keep it up';
  return "Let's make the rest of the day count";
}

function typingActivityLabel(keystrokes) {
  const k = Number(keystrokes) || 0;
  if (k >= 5000) return 'High';
  if (k >= 1800) return 'Moderate';
  if (k >= 400) return 'Light';
  return 'Low';
}

function workIntensityLabel(typingIntensity) {
  const i = Number(typingIntensity) || 0;
  if (i >= 32) return 'High';
  if (i >= 14) return 'Moderate';
  return 'Light';
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="bg-helix-card/40 rounded-[20px] h-24" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-helix-card/40 rounded-[20px] h-52" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-helix-card/40 rounded-[20px] h-64 col-span-2" />
        <div className="bg-helix-card/40 rounded-[20px] h-64" />
        <div className="bg-helix-card/40 rounded-[20px] h-64" />
      </div>
      <div className="bg-helix-card/40 rounded-[20px] h-14" />
    </div>
  );
}

export default function Dashboard() {
  const { todayMetrics, trackerStatus, dashboardLoading, nudges } = useWellness();
  const { user } = useAuth();
  const { updatePageContext } = usePageContext();
  const ks = todayMetrics.activity?.keystrokes ?? 0;
  const intensity = todayMetrics.activity?.typing_intensity ?? 0;

  useEffect(() => {
    if (!dashboardLoading) {
      updatePageContext('dashboard', {
        wellness_score: todayMetrics.score,
        mood: todayMetrics.mood,
        streak_days: todayMetrics.streakDays,
        screen_time_hours: todayMetrics.screenTime?.total || 0,
        screen_time_breakdown: todayMetrics.screenTime?.breakdown || {},
        breaks_taken: todayMetrics.breaks?.taken || 0,
        breaks_suggested: todayMetrics.breaks?.suggested || 6,
        last_break: todayMetrics.breaks?.lastBreak || 'N/A',
        hydration_ml: todayMetrics.hydration?.ml_today || 0,
        hydration_goal: todayMetrics.hydration?.goal_ml || 2000,
        self_care_stretches: todayMetrics.selfCare?.stretch || 0,
        self_care_eye_rest: todayMetrics.selfCare?.eye_rest || 0,
        focus_sessions_count: todayMetrics.focusSessions?.length || 0,
        typing_activity: typingActivityLabel(ks),
        work_intensity: workIntensityLabel(intensity),
        tracker_status: trackerStatus,
        active_nudges: (nudges || []).filter(n => !n.dismissed).map(n => n.message || n.type).slice(0, 3),
      });
    }
  }, [todayMetrics, trackerStatus, dashboardLoading, nudges, ks, intensity, updatePageContext]);

  if (dashboardLoading) return <DashboardSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div className="bg-mesh rounded-[20px] p-6 border border-helix-border/30">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-display font-semibold text-helix-text">
              {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-sm text-helix-muted mt-1.5 leading-relaxed">
              {wellnessStatusLine(todayMetrics.score)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-helix-accent/25 bg-helix-accent/10 px-3 py-1.5 text-xs font-medium text-helix-accent">
              <span className="text-helix-muted font-normal">Focus</span>
              <span className="tabular-nums">{todayMetrics.focusSessions.length}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-helix-sky/25 bg-helix-sky/10 px-3 py-1.5 text-xs font-medium text-helix-sky">
              <span className="text-helix-muted font-normal">Breaks</span>
              <span className="tabular-nums">{todayMetrics.breaks?.taken ?? 0}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-helix-pink/25 bg-helix-pink/10 px-3 py-1.5 text-xs font-medium text-helix-pink">
              <span className="text-helix-muted font-normal">Eye Rest</span>
              <span className="tabular-nums">{todayMetrics.selfCare?.eye_rest ?? 0}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        <ProductivityScore
          score={todayMetrics.score}
          streakDays={todayMetrics.streakDays}
          mood={todayMetrics.mood}
          breaks={todayMetrics.breaks}
        />
        <ScreenTimeChart screenTime={todayMetrics.screenTime} />
        <BreakBalance breaks={todayMetrics.breaks} />
        <HydrationTracker />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        <FocusTimeline sessions={todayMetrics.focusSessions} />
        <NudgeFeed />
        <SelfCareTracker />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <TodayTasks />
      </div>

      <div className="glass-card p-4 rounded-[20px]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            {trackerStatus === 'connected' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-helix-mint opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-helix-mint" />
                </span>
                <span className="text-xs text-helix-muted">
                  AI Wellness Engine Active
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-helix-red" />
                <span className="text-xs text-helix-muted">AI Wellness Engine Connecting...</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-helix-muted flex-wrap justify-end">
            <span>Typing activity: <span className="text-helix-text">{typingActivityLabel(ks)}</span></span>
            <span>Screen time: <span className="text-helix-text">{todayMetrics.screenTime?.total ?? 0}h</span></span>
            <span>Work intensity: <span className="text-helix-text">{workIntensityLabel(intensity)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
