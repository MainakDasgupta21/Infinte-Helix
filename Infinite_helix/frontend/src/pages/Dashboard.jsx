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
    <div className="max-w-[1400px] mx-auto animate-pulse space-y-5">
      <div className="h-24 bg-white rounded-2xl border border-slate-200" />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 md:col-span-4 h-60 bg-white rounded-2xl border border-slate-200" />
        <div className="col-span-12 md:col-span-4 h-60 bg-white rounded-2xl border border-slate-200" />
        <div className="col-span-12 md:col-span-4 h-60 bg-white rounded-2xl border border-slate-200" />
      </div>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8 h-64 bg-white rounded-2xl border border-slate-200" />
        <div className="col-span-12 lg:col-span-4 h-64 bg-white rounded-2xl border border-slate-200" />
      </div>
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
    <div className="max-w-[1400px] mx-auto space-y-5 animate-slide-up">
      {/* ── Hero Greeting ── */}
      <div className="bento-card-lg relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-radial from-violet-100/50 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
              {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed font-medium">
              {wellnessStatusLine(todayMetrics.score)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-2 rounded-xl bg-violet-100 border border-violet-200 px-3.5 py-1.5 text-xs font-bold text-violet-700">
              <span className="text-violet-500 font-semibold">Focus</span>
              <span className="tabular-nums">{todayMetrics.focusSessions.length}</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-rose-100 border border-rose-200 px-3.5 py-1.5 text-xs font-bold text-rose-700">
              <span className="text-rose-500 font-semibold">Breaks</span>
              <span className="tabular-nums">{todayMetrics.breaks?.taken ?? 0}</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
              <span className="text-emerald-500 font-semibold">Self Care</span>
              <span className="tabular-nums">{todayMetrics.selfCare?.eye_rest ?? 0}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Row 1: Bento asymmetric — Score hero (wider) + Screen + Break ── */}
      <div className="grid grid-cols-12 gap-5 items-stretch">
        <div className="col-span-12 md:col-span-5 lg:col-span-4">
          <ProductivityScore
            score={todayMetrics.score}
            streakDays={todayMetrics.streakDays}
            mood={todayMetrics.mood}
            breaks={todayMetrics.breaks}
          />
        </div>
        <div className="col-span-12 md:col-span-7 lg:col-span-4">
          <ScreenTimeChart screenTime={todayMetrics.screenTime} />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <BreakBalance breaks={todayMetrics.breaks} />
        </div>
      </div>

      {/* ── Row 2: Focus Timeline (wide) + Hydration ── */}
      <div className="grid grid-cols-12 gap-5 items-stretch">
        <div className="col-span-12 lg:col-span-8">
          <FocusTimeline sessions={todayMetrics.focusSessions} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <HydrationTracker />
        </div>
      </div>

      {/* ── Row 3: Nudges + Self Care + Tasks ── */}
      <div className="grid grid-cols-12 gap-5 items-stretch">
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <NudgeFeed />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <SelfCareTracker />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <TodayTasks />
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="bento-card px-5 py-3.5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            {trackerStatus === 'connected' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs text-slate-600 font-semibold">
                  AI Wellness Engine Active
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span className="text-xs text-slate-500">Connecting to your wellness flow...</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap justify-end">
            <span>Activity: <span className="text-slate-700 font-bold">{typingActivityLabel(ks)}</span></span>
            <span>Screen: <span className="text-slate-700 font-bold">{todayMetrics.screenTime?.total ?? 0}h</span></span>
            <span>Intensity: <span className="text-slate-700 font-bold">{workIntensityLabel(intensity)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
