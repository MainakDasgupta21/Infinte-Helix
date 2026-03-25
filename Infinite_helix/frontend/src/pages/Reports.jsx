import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineClipboardCopy,
  HiOutlineLightBulb,
  HiOutlineSparkles,
  HiOutlineSwitchHorizontal,
  HiOutlineHeart,
  HiOutlineMail,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineFingerPrint,
  HiOutlineClock,
  HiOutlineEmojiHappy,
  HiOutlineTrendingUp,
  HiOutlineEye,
} from 'react-icons/hi';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePageContext } from '../context/PageContext';
import { useWellness } from '../context/WellnessContext';
import { getStressLog, getSessionData } from '../hooks/useStressDetector';
import { getBreakLog, getScheduledBreaks } from '../hooks/useBreakReminder';
import WellnessScorecard from '../components/Reports/WellnessScorecard';
import WorkHoursChart from '../components/Reports/WorkHoursChart';
import EmotionChart from '../components/Reports/EmotionChart';
import StressHeatmap from '../components/Reports/StressHeatmap';
import SelfCareMetrics from '../components/Reports/SelfCareMetrics';
import WeeklyInsight from '../components/Reports/WeeklyInsight';

// ─── Cycle Phase Utilities ───────────────────────────────────────────────────

function getCycleData() {
  try {
    const entries = JSON.parse(localStorage.getItem('helix_period_entries') || '[]');
    if (entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lastStart = sorted[0]?.startDate;
    if (!lastStart) return null;
    const start = new Date(lastStart + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - start) / 86400000);
    const cycleDay = diff >= 0 ? (diff % 28) + 1 : 1;

    if (cycleDay <= 5) return { day: cycleDay, phase: 'Menstrual', energy: 'Rest & Restore', accent: 'rose', desc: 'Your body is recovering. Gentle tasks, warm drinks, and self-compassion are your superpowers today.' };
    if (cycleDay <= 13) return { day: cycleDay, phase: 'Follicular', energy: 'High Creative Energy', accent: 'emerald', desc: 'Creativity and optimism are rising. Perfect time for brainstorming, planning, and starting new things.' };
    if (cycleDay <= 16) return { day: cycleDay, phase: 'Ovulatory', energy: 'Peak Performance', accent: 'violet', desc: 'You\'re at your peak — communication, leadership, and presentations are your strong suit right now.' };
    return { day: cycleDay, phase: 'Luteal', energy: 'Wind Down & Refine', accent: 'amber', desc: 'Energy is tapering. Focus on wrapping up tasks, detail work, and being extra kind to yourself.' };
  } catch { return null; }
}

function getLifeMode() {
  return localStorage.getItem('helix_task_mode') || 'work';
}

const PHASE_BADGE_STYLES = {
  rose: 'bg-rose-50 text-rose-700 border-rose-200/60',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  violet: 'bg-violet-50 text-violet-700 border-violet-200/60',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
};

const PHASE_ACCENT_GRADIENT = {
  rose: 'from-rose-400 to-pink-400',
  emerald: 'from-emerald-400 to-teal-400',
  violet: 'from-violet-500 to-indigo-400',
  amber: 'from-amber-400 to-orange-400',
};

const MEETING_DECLINE_TEMPLATE = `Hi [Name],

Thank you for the invite. I've reviewed my capacity for tomorrow and I need to prioritize some focused work blocks to stay on track with [project/deliverable].

Would it be possible to:
• Share the agenda so I can contribute async?
• Reschedule to [suggest a time] when I'll have more bandwidth?

I want to make sure I bring my best thinking — and right now that means protecting a few deep-work hours.

Thanks for understanding!
[Your Name]`;

// ─── Daily Wellness & Cycle Report ──────────────────────────────────────────

function DailyWellnessReport({ userName, wellness }) {
  const [emailCopied, setEmailCopied] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(true);
  const cycle = useMemo(() => getCycleData(), []);
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const m = wellness?.todayMetrics || {};
  const score = m.score || 0;
  const screenH = m.screenTime?.total || 0;
  const breaks = m.breaks?.taken || 0;
  const breaksSuggested = m.breaks?.suggested || 6;
  const hydration = m.hydration?.ml_today || 0;
  const hydrationGoal = m.hydration?.goal_ml || 2000;

  // Simulated "context switches" based on task mode changes
  const contextSwitches = Math.max(1, Math.floor(screenH * 0.7));
  const burnoutLevel = score >= 70 ? 'low' : score >= 45 ? 'moderate' : 'high';

  const phaseAccent = cycle?.accent || 'violet';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(MEETING_DECLINE_TEMPLATE).then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2500);
    });
  };

  const handleDownloadPrivate = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(generateDailyPrintHTML({ userName, todayLabel, cycle, score, screenH, breaks, breaksSuggested, hydration, hydrationGoal, contextSwitches, burnoutLevel, type: 'private' }));
    w.document.close();
    w.onload = () => setTimeout(() => w.print(), 500);
  };

  const handleDownloadManager = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(generateDailyPrintHTML({ userName, todayLabel, cycle, score, screenH, breaks, breaksSuggested, hydration, hydrationGoal, contextSwitches, burnoutLevel, type: 'manager' }));
    w.document.close();
    w.onload = () => setTimeout(() => w.print(), 500);
  };

  return (
    <div className="space-y-5">
      {/* ── Header + Downloads ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-slate-800 tracking-tight">
            Daily Wellness & Cycle Report
          </h2>
          <p className="text-sm text-slate-400 mt-1">{todayLabel}</p>
          {cycle && (
            <div className="flex items-center gap-2 mt-3">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${PHASE_BADGE_STYLES[phaseAccent]}`}>
                <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                {cycle.phase} Phase — {cycle.energy}
              </span>
              <span className="text-xs text-slate-400">Day {cycle.day}/28</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleDownloadPrivate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/20"
          >
            <HiOutlineShieldCheck className="w-4 h-4" />
            Private Wellness PDF
          </button>
          <button
            onClick={handleDownloadManager}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
          >
            <HiOutlineDocumentText className="w-4 h-4" />
            Manager 1-on-1 Summary
          </button>
        </div>
      </div>

      {/* ── Phase Insight Card ── */}
      {cycle && (
        <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${PHASE_ACCENT_GRADIENT[phaseAccent]}/5 border border-${phaseAccent}-200/30`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-white/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="relative p-6 flex items-start gap-4">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${PHASE_ACCENT_GRADIENT[phaseAccent]} shadow-lg shrink-0`}>
              <HiOutlineSparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">Biological Phase Insight</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{cycle.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Metrics Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Wellness Score', value: `${score}/100`, sub: score >= 70 ? 'Great' : score >= 45 ? 'Okay' : 'Needs care', color: 'text-violet-600' },
          { label: 'Screen Time', value: `${screenH}h`, sub: screenH > 6 ? 'High exposure' : 'Balanced', color: 'text-blue-600' },
          { label: 'Breaks Taken', value: `${breaks}/${breaksSuggested}`, sub: breaks >= breaksSuggested ? 'On target' : 'Take more', color: 'text-emerald-600' },
          { label: 'Hydration', value: `${hydration}ml`, sub: `of ${hydrationGoal}ml goal`, color: 'text-sky-600' },
        ].map((item, i) => (
          <div key={i} className="bento-card !p-4 text-center">
            <p className="bento-label">{item.label}</p>
            <p className={`text-xl font-serif font-bold mt-1 ${item.color}`}>{item.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Mental Load Card ── */}
      <div className="bento-card !p-0 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100">
              <HiOutlineSwitchHorizontal className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">Mental Load Meter</h3>
              <p className="text-xs text-slate-400">Context switches & cognitive load today</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-serif font-bold text-slate-800">{contextSwitches}</span>
            <span className="text-sm text-slate-400">context switches today</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                contextSwitches <= 3 ? 'bg-emerald-400 w-[30%]' : contextSwitches <= 6 ? 'bg-amber-400 w-[60%]' : 'bg-rose-400 w-[85%]'
              }`}
              style={{ width: `${Math.min(100, (contextSwitches / 10) * 100)}%` }}
            />
          </div>
          <div className="bg-violet-50/60 rounded-2xl px-5 py-4 border border-violet-100/40">
            <div className="flex items-start gap-3">
              <HiOutlineHeart className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
              <p className="text-sm text-violet-700/80 leading-relaxed">
                {contextSwitches <= 3
                  ? "Excellent focus today! You maintained deep work beautifully. Your productivity is at its peak."
                  : contextSwitches <= 6
                  ? "You had a few personal tasks interrupt your flow today. That's okay — they're saved in your Second Shift list for tonight."
                  : "High context-switching day. Your brain worked overtime juggling demands. Consider blocking focus time tomorrow and batching similar tasks together."
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tomorrow's Strategy (Advocacy & Action) ── */}
      <div className="bento-card !p-0 overflow-hidden border-2 border-violet-100/50">
        <button
          onClick={() => setStrategyOpen(p => !p)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-violet-50/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/20">
              <HiOutlineLightBulb className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">Tomorrow's Strategy</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalized plan based on your {cycle ? cycle.phase.toLowerCase() + ' phase' : 'wellness'} + today's load
              </p>
            </div>
          </div>
          {strategyOpen
            ? <HiOutlineChevronUp className="w-5 h-5 text-slate-400" />
            : <HiOutlineChevronDown className="w-5 h-5 text-slate-400" />
          }
        </button>

        {strategyOpen && (
          <div className="px-6 pb-6 space-y-5">
            {/* Strategy tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: burnoutLevel === 'high' ? 'Protect Your Energy' : 'Optimize Your Flow',
                  body: burnoutLevel === 'high'
                    ? 'Your burnout indicators are elevated. Block the first 2 hours of tomorrow as "Focus Time" — no meetings, no Slack. Your brain needs recovery.'
                    : cycle?.phase === 'Follicular' || cycle?.phase === 'Ovulatory'
                    ? 'Your energy is strong. Schedule your hardest creative or strategic tasks in the morning. Stack meetings after lunch when social energy peaks.'
                    : 'Pace yourself gently. Front-load lighter admin tasks, save complex work for your best energy window, and schedule extra breaks.',
                  icon: <HiOutlineSparkles className="w-4 h-4" />,
                  color: 'from-violet-100 to-indigo-100',
                  textColor: 'text-violet-700',
                },
                {
                  title: 'Set a Boundary',
                  body: breaks < breaksSuggested
                    ? `You only took ${breaks} of ${breaksSuggested} breaks today. Tomorrow, set a hard timer every 90 minutes. Walk away from the screen — even 2 minutes helps.`
                    : screenH > 6
                    ? `Your screen time hit ${screenH}h. Consider ending your workday 30 minutes earlier tomorrow and using that time for yourself.`
                    : 'Great job managing boundaries today! Keep this rhythm going — consistency is what builds sustainable productivity.',
                  icon: <HiOutlineShieldCheck className="w-4 h-4" />,
                  color: 'from-emerald-100 to-teal-100',
                  textColor: 'text-emerald-700',
                },
              ].map((tip, i) => (
                <div key={i} className={`rounded-2xl bg-gradient-to-br ${tip.color} p-5 border border-white/60`}>
                  <div className={`flex items-center gap-2 ${tip.textColor} mb-2`}>
                    {tip.icon}
                    <h4 className="text-xs font-bold uppercase tracking-wider">{tip.title}</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>

            {/* Meeting Decline Email Template */}
            <div className="rounded-2xl border border-slate-200/60 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <HiOutlineMail className="w-4.5 h-4.5 text-violet-500" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Meeting Decline Template</h4>
                    <p className="text-[11px] text-slate-400">Copy and customize for tomorrow</p>
                  </div>
                </div>
                <button
                  onClick={handleCopyEmail}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    emailCopied
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200'
                  }`}
                >
                  <HiOutlineClipboardCopy className="w-3.5 h-3.5" />
                  {emailCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="px-5 py-4 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap font-sans bg-white/60">
                {MEETING_DECLINE_TEMPLATE}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Daily Report PDF Generator ─────────────────────────────────────────────

function generateDailyPrintHTML({ userName, todayLabel, cycle, score, screenH, breaks, breaksSuggested, hydration, hydrationGoal, contextSwitches, burnoutLevel, type }) {
  const isPrivate = type === 'private';
  const title = isPrivate ? 'Private Wellness Report' : 'Manager 1-on-1 Summary';
  const subtitle = isPrivate
    ? 'This report contains your personal wellness data. It is private and confidential.'
    : 'A curated summary of workload and capacity — safe for sharing with your manager.';

  const phaseSection = cycle
    ? `<div style="margin-bottom:24px;padding:18px 22px;border-radius:14px;background:#f5f3ff;border:1px solid #e9e4fd">
        <div style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Biological Phase</div>
        <div style="font-size:16px;font-weight:700;color:#1e293b">${cycle.phase} Phase — ${cycle.energy}</div>
        ${isPrivate ? `<div style="font-size:13px;color:#64748b;margin-top:6px;line-height:1.6">${cycle.desc}</div>` : ''}
      </div>`
    : '';

  const metricsHTML = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
    ${[
      { label: 'Wellness Score', value: `${score}/100` },
      { label: 'Screen Time', value: `${screenH}h` },
      { label: 'Breaks', value: `${breaks}/${breaksSuggested}` },
      ...(isPrivate ? [{ label: 'Hydration', value: `${hydration}/${hydrationGoal}ml` }] : [{ label: 'Focus Capacity', value: score >= 70 ? 'Strong' : score >= 45 ? 'Moderate' : 'Low' }]),
    ].map(m => `<div style="text-align:center;padding:16px 8px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0">
      <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#1e293b">${m.value}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:4px">${m.label}</div>
    </div>`).join('')}
  </div>`;

  const mentalLoadHTML = isPrivate
    ? `<div style="margin-bottom:24px">
        <h2 style="font-family:'Playfair Display',serif;font-size:18px;color:#1e293b;margin-bottom:12px">Mental Load</h2>
        <div style="font-size:28px;font-weight:700;color:#1e293b">${contextSwitches} <span style="font-size:14px;color:#94a3b8;font-weight:400">context switches today</span></div>
        <div style="margin-top:12px;padding:14px 18px;border-radius:12px;background:#f5f3ff;color:#5b21b6;font-size:13px;line-height:1.6">
          ${contextSwitches <= 3 ? 'Excellent focus today. Deep work was well-protected.' : contextSwitches <= 6 ? 'A few interruptions but manageable. Personal tasks are saved in your Second Shift list.' : 'High cognitive load. Consider blocking focus hours and batching tasks tomorrow.'}
        </div>
      </div>`
    : `<div style="margin-bottom:24px">
        <h2 style="font-family:'Playfair Display',serif;font-size:18px;color:#1e293b;margin-bottom:12px">Capacity Overview</h2>
        <div style="padding:14px 18px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#475569;line-height:1.6">
          ${burnoutLevel === 'high' ? 'Current workload is elevated. Would benefit from adjusted deadlines or redistributed tasks.' : burnoutLevel === 'moderate' ? 'Workload is manageable but approaching capacity. Protecting focus blocks would help maintain quality.' : 'Currently operating with good capacity. Maintaining current pace is sustainable.'}
        </div>
      </div>`;

  const strategyHTML = `<div style="margin-bottom:24px">
    <h2 style="font-family:'Playfair Display',serif;font-size:18px;color:#1e293b;margin-bottom:12px">Tomorrow's Strategy</h2>
    <div style="padding:16px 20px;border-radius:12px;background:linear-gradient(135deg,#f5f3ff,#eff6ff);border:1px solid #e9e4fd;font-size:13px;color:#334155;line-height:1.7">
      ${burnoutLevel === 'high'
        ? 'Block the first 2 hours as protected focus time. Limit meetings to essential ones only. Schedule 15-minute recovery breaks between sessions.'
        : 'Schedule creative/strategic work in the morning energy window. Stack meetings in the afternoon. Ensure at least ' + breaksSuggested + ' breaks throughout the day.'}
    </div>
  </div>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} — ${todayLabel}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;color:#1e293b;max-width:720px;margin:0 auto;padding:40px 32px;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@media print{body{padding:12px 16px}.no-print{display:none!important}@page{margin:0.6cm;size:A4}}
h1,h2{font-family:'Playfair Display',serif}
.header{text-align:center;padding-bottom:20px;border-bottom:2px solid #e2e8f0;margin-bottom:28px}
.header h1{font-size:24px;color:#1e293b;margin-bottom:4px}
.print-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 24px;background:linear-gradient(135deg,#7c3aed,#6366f1);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;margin-top:14px;font-family:'Plus Jakarta Sans',sans-serif}
.footer{margin-top:36px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8}
</style></head><body>
<div class="header">
  <div style="font-size:20px;margin-bottom:6px">\u221E</div>
  <h1>Infinite Helix</h1>
  <div style="font-size:14px;color:#7c3aed;font-weight:500">${title}</div>
  <div style="font-size:12px;color:#94a3b8;margin-top:4px">${todayLabel} \u00b7 ${userName}</div>
  <div style="font-size:10px;color:#cbd5e1;margin-top:4px">${subtitle}</div>
  <button class="print-btn no-print" onclick="window.print()">Save as PDF</button>
</div>
${phaseSection}${metricsHTML}${mentalLoadHTML}${strategyHTML}
<div class="footer">Generated by Infinite Helix \u00b7 AI-Powered Wellness for Women<br>\u00a9 ${new Date().getFullYear()} \u00b7 ${isPrivate ? 'Private & Confidential' : 'Prepared for 1-on-1 discussion'}</div>
</body></html>`;
}

// ─── Digital Body Language Report ────────────────────────────────────────────

function DigitalBodyLanguageReport() {
  const stressLog = useMemo(() => getStressLog(), []);
  const session = useMemo(() => getSessionData(), []);

  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = stressLog.filter(e => e.date === today);
  const last7Days = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return stressLog.filter(e => new Date(e.timestamp) >= cutoff);
  }, [stressLog]);

  const resolutions = useMemo(() => {
    const counts = { breathing_completed: 0, dismissed: 0, snoozed: 0, pending: 0 };
    last7Days.forEach(e => {
      if (e.resolution === 'breathing_completed') counts.breathing_completed++;
      else if (e.resolution === 'dismissed') counts.dismissed++;
      else if (e.resolution?.startsWith('snoozed')) counts.snoozed++;
      else counts.pending++;
    });
    return counts;
  }, [last7Days]);

  const avgSpeed = useMemo(() => {
    if (last7Days.length === 0) return 0;
    return Math.round(last7Days.reduce((s, e) => s + (e.speed || 0), 0) / last7Days.length);
  }, [last7Days]);

  const peakHours = useMemo(() => {
    const hourCounts = {};
    last7Days.forEach(e => {
      const h = new Date(e.timestamp).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const sorted = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 3).map(([h]) => {
      const hr = parseInt(h);
      return hr === 0 ? '12 AM' : hr < 12 ? `${hr} AM` : hr === 12 ? '12 PM' : `${hr - 12} PM`;
    });
  }, [last7Days]);

  const groupedByDay = useMemo(() => {
    const groups = {};
    stressLog.slice(-50).reverse().forEach(e => {
      const d = e.date || 'unknown';
      if (!groups[d]) groups[d] = [];
      groups[d].push(e);
    });
    return groups;
  }, [stressLog]);

  const formatTime = (iso) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const formatDate = (dateStr) => {
    if (dateStr === today) return 'Today';
    const d = new Date(dateStr + 'T00:00:00');
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const resolutionLabel = (res) => {
    if (res === 'breathing_completed') return { text: 'Breathing done', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (res === 'dismissed') return { text: 'Dismissed', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    if (res?.startsWith('snoozed')) return { text: 'Snoozed', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { text: 'No action', color: 'bg-slate-50 text-slate-400 border-slate-100' };
  };

  const stressLevel = todayEvents.length === 0 ? 'calm' : todayEvents.length <= 2 ? 'mild' : todayEvents.length <= 4 ? 'moderate' : 'high';
  const stressConfig = {
    calm: { label: 'Calm', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '🧘' },
    mild: { label: 'Mild Stress', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: '🌤️' },
    moderate: { label: 'Moderate Stress', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: '⚡' },
    high: { label: 'High Stress', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: '🔥' },
  };
  const sc = stressConfig[stressLevel];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HiOutlineFingerPrint className="w-5 h-5 text-violet-600" />
          <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Digital Body Language
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          Automatic stress detection from your typing patterns — no manual input needed
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <HiOutlineShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px] text-emerald-700 font-semibold">Privacy-first: tracks patterns only, never content</span>
        </div>
      </div>

      {/* Today's Status Card */}
      <div className={`bento-card-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${sc.bg} !border ${sc.border}`}>
        <div className="flex items-center gap-4">
          <div className="text-3xl">{sc.icon}</div>
          <div>
            <p className={`text-lg font-serif font-bold ${sc.color}`}>
              {sc.label}
            </p>
            <p className="text-sm text-slate-600 mt-0.5">
              {todayEvents.length === 0
                ? 'No stress signals detected today. Keep it up!'
                : `${todayEvents.length} stress signal${todayEvents.length > 1 ? 's' : ''} detected today`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Session time</p>
          <p className="text-lg font-bold text-slate-800">{session.totalMinutes || 0}m</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card text-center">
          <div className="w-9 h-9 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center mx-auto mb-2">
            <HiOutlineTrendingUp className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-slate-900">{todayEvents.length}</p>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Today's Alerts</p>
        </div>
        <div className="bento-card text-center">
          <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto mb-2">
            <HiOutlineClock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-slate-900">{last7Days.length}</p>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">This Week</p>
        </div>
        <div className="bento-card text-center">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-2">
            <HiOutlineEmojiHappy className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-slate-900">{resolutions.breathing_completed}</p>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Breathings Done</p>
        </div>
        <div className="bento-card text-center">
          <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto mb-2">
            <HiOutlineEye className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-slate-900">{avgSpeed}</p>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Avg Keys/min</p>
        </div>
      </div>

      {/* Peak Stress Hours + Resolution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Peak Hours */}
        <div className="bento-card">
          <h3 className="bento-label mb-3">Peak Stress Hours</h3>
          {peakHours.length > 0 ? (
            <div className="space-y-2">
              {peakHours.map((h, i) => (
                <div key={h} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                    i === 1 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{h}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No stress events recorded yet</p>
          )}
          {peakHours.length > 0 && (
            <div className="mt-4 bg-violet-50 rounded-xl p-3 border border-violet-100">
              <p className="text-xs text-violet-700 leading-relaxed">
                Consider scheduling breaks or lighter tasks around {peakHours[0]} — that's when your stress patterns tend to spike.
              </p>
            </div>
          )}
        </div>

        {/* Resolution Breakdown */}
        <div className="bento-card">
          <h3 className="bento-label mb-3">How You Responded (7 days)</h3>
          {last7Days.length > 0 ? (
            <div className="space-y-3">
              {[
                { label: 'Breathing completed', count: resolutions.breathing_completed, color: 'bg-emerald-500', total: last7Days.length },
                { label: 'Snoozed', count: resolutions.snoozed, color: 'bg-amber-500', total: last7Days.length },
                { label: 'Dismissed', count: resolutions.dismissed, color: 'bg-slate-400', total: last7Days.length },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{r.label}</span>
                    <span className="text-xs font-bold text-slate-500">{r.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r.color} transition-all`}
                      style={{ width: `${r.total > 0 ? (r.count / r.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {resolutions.breathing_completed > resolutions.dismissed && (
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 mt-2">
                  <p className="text-xs text-emerald-700">Great job! You chose breathing over dismissing most times. Your body is learning to pause.</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No data yet — your patterns will appear here</p>
          )}
        </div>
      </div>

      {/* Event Timeline */}
      <div className="bento-card">
        <h3 className="bento-label mb-4">Stress Event Timeline</h3>
        {Object.keys(groupedByDay).length > 0 ? (
          <div className="space-y-5 max-h-[400px] overflow-y-auto pr-1">
            {Object.entries(groupedByDay).map(([date, events]) => (
              <div key={date}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{formatDate(date)}</p>
                <div className="space-y-2">
                  {events.map((event, i) => {
                    const res = resolutionLabel(event.resolution);
                    return (
                      <div key={`${date}-${i}`} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800">{formatTime(event.timestamp)}</span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{event.speed} keys/min</span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-xs text-rose-500 font-medium">{event.backspaces} corrections</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {event.sessionMinutes}m into session
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${res.color}`}>
                          {res.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto mb-3">
              <HiOutlineFingerPrint className="w-7 h-7 text-violet-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No stress events recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Your app automatically monitors typing patterns in the background. When frustration or rushing is detected, you'll get a gentle notification — and it'll appear here.
            </p>
          </div>
        )}
      </div>

      {/* ── Meal & Break Tracker ── */}
      <BreakTrackerSection />
    </div>
  );
}

function BreakTrackerSection() {
  const breakLog = useMemo(() => getBreakLog(), []);
  const schedule = getScheduledBreaks();
  const today = new Date().toISOString().slice(0, 10);

  const todayLog = breakLog.filter(l => l.date === today);
  const todayMeals = todayLog.filter(l => l.type === 'meal');
  const todayWellness = todayLog.filter(l => l.type === 'wellness');

  const completedMealIds = new Set(todayMeals.map(l => l.id));

  const last7 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return breakLog.filter(l => new Date(l.completedAt) >= cutoff);
  }, [breakLog]);

  const weekMeals = last7.filter(l => l.type === 'meal').length;
  const weekWellness = last7.filter(l => l.type === 'wellness').length;

  const formatTime = (iso) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <HiOutlineClock className="w-5 h-5 text-amber-600" />
        <h2 className="text-xl font-serif font-bold text-slate-900">Meal & Break Tracker</h2>
      </div>

      {/* Today's Schedule */}
      <div className="bento-card">
        <h3 className="bento-label mb-4">Today's Schedule</h3>
        <div className="space-y-2">
          {schedule.map(brk => {
            const done = completedMealIds.has(brk.id);
            const doneEntry = todayMeals.find(l => l.id === brk.id);
            return (
              <div
                key={brk.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  done
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-xl">{brk.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${done ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {brk.label}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Scheduled {formatTime12h(brk.time)}
                    {done && doneEntry && ` · Completed ${formatTime(doneEntry.completedAt)}`}
                  </p>
                </div>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  done
                    ? 'bg-emerald-200 border border-emerald-300'
                    : 'bg-slate-100 border border-slate-200'
                }`}>
                  {done ? (
                    <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <HiOutlineClock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Today's Progress</span>
            <span className="text-xs font-bold text-slate-800">{todayMeals.length}/{schedule.length} meals</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
              style={{ width: `${(todayMeals.length / schedule.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Wellness Breaks Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bento-card">
          <h3 className="bento-label mb-3">Today's Wellness Breaks</h3>
          {todayWellness.length > 0 ? (
            <div className="space-y-2">
              {todayWellness.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 bg-violet-50 rounded-lg px-3 py-2 border border-violet-100">
                  <span className="text-base">{entry.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-800">{entry.label}</p>
                  </div>
                  <span className="text-[10px] text-slate-500">{formatTime(entry.completedAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No wellness breaks logged yet today</p>
          )}
          <div className="flex gap-3 mt-3">
            {[
              { label: 'Eye Rest', emoji: '👁️', count: todayWellness.filter(l => l.id === 'eye_rest').length },
              { label: 'Stretch', emoji: '🧘', count: todayWellness.filter(l => l.id === 'stretch').length },
              { label: 'Water', emoji: '💧', count: todayWellness.filter(l => l.id === 'water').length },
            ].map(w => (
              <div key={w.label} className="flex-1 text-center bg-slate-50 rounded-lg border border-slate-100 py-2">
                <p className="text-base">{w.emoji}</p>
                <p className="text-lg font-bold text-slate-800">{w.count}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{w.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-card">
          <h3 className="bento-label mb-3">7-Day Summary</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700">Meals Logged</span>
                <span className="text-xs font-bold text-amber-600">{weekMeals}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, (weekMeals / 35) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Target: 35 (5/day × 7 days)</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700">Wellness Breaks</span>
                <span className="text-xs font-bold text-violet-600">{weekWellness}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${Math.min(100, (weekWellness / 42) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Target: 42 (6/day × 7 days)</p>
            </div>
          </div>
          {weekMeals >= 25 && (
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 mt-4">
              <p className="text-xs text-emerald-700">Excellent consistency! Regular meals are the foundation of sustained energy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime12h(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─── Main Reports Component ─────────────────────────────────────────────────

export default function Reports() {
  const { user } = useAuth();
  const { updatePageContext } = usePageContext();
  const wellness = useWellness();
  const [activeTab, setActiveTab] = useState('body-language');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportsAPI.getWeekly(user?.uid);
      setReport(res.data);
    } catch {
      setError('Unable to load your wellness report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (report) {
      updatePageContext('reports', {
        period_label: report.period?.label,
        wellness_score: report.wellness_score?.current,
        wellness_grade: report.wellness_score?.grade,
        score_change: report.wellness_score?.change,
        mood_trend: report.summary?.mood_trend,
        total_focus_hours: report.summary?.total_focus_hours,
        breaks_per_day: report.summary?.breaks_per_day,
        hydration_avg: report.summary?.hydration_avg_ml,
        hydration_goal: report.summary?.hydration_goal_ml,
        emotion_distribution: report.emotion_distribution,
        insights: (report.insights || []).map(i => i.title),
        recommendations: (report.recommendations || []).map(r => r.tip),
        affirmation: report.affirmation,
        cycle_insights_enabled: report.cycle_insights?.enabled,
        cycle_phase: report.cycle_insights?.current_phase,
      });
    }
  }, [report, updatePageContext]);

  const downloadReport = useCallback(() => {
    if (!report) return;
    setDownloading(true);
    const userName = user?.displayName || 'User';

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow pop-ups to download your report.');
        setDownloading(false);
        return;
      }
      printWindow.document.write(generatePrintHTML(report, userName));
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setDownloading(false);
        }, 600);
      };
    } catch {
      setDownloading(false);
    }
  }, [report, user]);

  const userName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slide-up pb-8">
      {/* ── Page Title + Tab Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-serif font-semibold text-slate-800 tracking-tight">
          Your Reports
        </h1>
        <div className="flex items-center gap-1 bg-white rounded-2xl p-1 border border-slate-200 shadow-sm">
          {[
            { id: 'body-language', label: 'Body Language' },
            { id: 'daily', label: 'Daily Report' },
            { id: 'weekly', label: 'Weekly Report' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body Language Tab ── */}
      {activeTab === 'body-language' && (
        <DigitalBodyLanguageReport />
      )}

      {/* ── Daily Tab ── */}
      {activeTab === 'daily' && (
        <DailyWellnessReport userName={userName} wellness={wellness} />
      )}

      {/* ── Weekly Tab ── */}
      {activeTab === 'weekly' && (
        <>
          {loading ? (
            <div className="space-y-6">
              <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
              <div className="bento-card p-8">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  <div className="w-36 h-36 rounded-full bg-slate-100 animate-pulse" />
                  <div className="flex-1 w-full space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bento-card p-12 text-center">
              <p className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wide">Error</p>
              <p className="text-slate-700 font-medium mb-2">Couldn't load your report</p>
              <p className="text-sm text-slate-400 mb-6">{error}</p>
              <button
                onClick={fetchReport}
                className="px-5 py-2.5 rounded-xl bg-violet-100 text-violet-700 text-sm font-medium hover:bg-violet-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : report ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{report.period?.label}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchReport}
                    className="bento-card !p-2.5 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Refresh report"
                  >
                    <HiOutlineRefresh className="w-4 h-4" />
                  </button>
                  <button
                    onClick={downloadReport}
                    disabled={downloading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20"
                  >
                    <HiOutlineDownload className="w-4 h-4" />
                    {downloading ? 'Preparing...' : 'Download Weekly'}
                  </button>
                </div>
              </div>

              <WellnessScorecard
                score={report.wellness_score}
                summary={report.summary}
                dailyScores={report.daily_scores}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WorkHoursChart data={report.work_hours} />
                <EmotionChart distribution={report.emotion_distribution} />
              </div>
              <StressHeatmap heatmap={report.stress_heatmap} />
              <SelfCareMetrics selfCare={report.self_care} />
              <WeeklyInsight
                insights={report.insights}
                recommendations={report.recommendations}
                affirmation={report.affirmation}
                cycleInsights={report.cycle_insights}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}


/* ── PDF / Print HTML Generator (SVG-based charts for crisp PDF output) ── */

function generatePrintHTML(report, userName) {
  const s = report.summary;
  const sc = report.wellness_score;
  const selfCare = report.self_care;
  const wh = report.work_hours || { labels: [], focus: [], breaks: [] };

  // ── SVG: Daily Wellness Scores bar chart ──
  const dailyScores = report.daily_scores || [];
  const dsSvgW = 700, dsSvgH = 200, dsBarW = 60, dsGap = 20;
  const dsStartX = 40;
  const dailyScoresSVG = dailyScores.length > 0
    ? `<svg viewBox="0 0 ${dsSvgW} ${dsSvgH + 30}" width="100%" style="display:block;margin:0 auto">
        <defs><linearGradient id="dsG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6b8cff"/><stop offset="100%" stop-color="#5eb0d8"/></linearGradient></defs>
        ${dailyScores.map((d, i) => {
          const x = dsStartX + i * (dsBarW + dsGap);
          const h = Math.max(4, (d.score / 100) * dsSvgH);
          const y = dsSvgH - h;
          return `<rect x="${x}" y="${y}" width="${dsBarW}" height="${h}" rx="6" fill="url(#dsG)" opacity="0.9"/>
                  <text x="${x + dsBarW / 2}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#1e293b">${d.score}</text>
                  <text x="${x + dsBarW / 2}" y="${dsSvgH + 18}" text-anchor="middle" font-size="11" fill="#64748b">${d.day}</text>`;
        }).join('')}
        <line x1="${dsStartX - 5}" y1="${dsSvgH}" x2="${dsStartX + dailyScores.length * (dsBarW + dsGap)}" y2="${dsSvgH}" stroke="#e2e8f0" stroke-width="1"/>
      </svg>`
    : '<p style="color:#94a3b8;font-size:13px">No daily score data available.</p>';

  // ── SVG: Work Hours grouped bar chart ──
  const whLabels = wh.labels || [];
  const whSvgW = 700, whSvgH = 180, whBarW = 24, whGroupGap = 30;
  const whStartX = 50;
  const whMaxVal = Math.max(1, ...wh.focus, ...wh.breaks, 10);
  const workHoursSVG = whLabels.length > 0
    ? `<svg viewBox="0 0 ${whSvgW} ${whSvgH + 50}" width="100%" style="display:block;margin:0 auto">
        <defs>
          <linearGradient id="whF" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6b8cff"/><stop offset="100%" stop-color="#818cf8"/></linearGradient>
          <linearGradient id="whB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3db89a"/><stop offset="100%" stop-color="#6ee7b7"/></linearGradient>
        </defs>
        ${whLabels.map((label, i) => {
          const gx = whStartX + i * (whBarW * 2 + whGroupGap);
          const fh = Math.max(2, (wh.focus[i] / whMaxVal) * whSvgH);
          const bh = Math.max(2, (wh.breaks[i] / whMaxVal) * whSvgH);
          return `<rect x="${gx}" y="${whSvgH - fh}" width="${whBarW}" height="${fh}" rx="4" fill="url(#whF)"/>
                  <text x="${gx + whBarW / 2}" y="${whSvgH - fh - 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#6b8cff">${wh.focus[i]}h</text>
                  <rect x="${gx + whBarW + 3}" y="${whSvgH - bh}" width="${whBarW}" height="${bh}" rx="4" fill="url(#whB)"/>
                  <text x="${gx + whBarW + 3 + whBarW / 2}" y="${whSvgH - bh - 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#3db89a">${wh.breaks[i]}h</text>
                  <text x="${gx + whBarW + 1}" y="${whSvgH + 16}" text-anchor="middle" font-size="11" fill="#64748b">${label}</text>`;
        }).join('')}
        <line x1="${whStartX - 5}" y1="${whSvgH}" x2="${whStartX + whLabels.length * (whBarW * 2 + whGroupGap)}" y2="${whSvgH}" stroke="#e2e8f0" stroke-width="1"/>
        <rect x="${whSvgW - 180}" y="${whSvgH + 30}" width="12" height="12" rx="3" fill="#6b8cff"/>
        <text x="${whSvgW - 164}" y="${whSvgH + 41}" font-size="11" fill="#475569">Focus</text>
        <rect x="${whSvgW - 110}" y="${whSvgH + 30}" width="12" height="12" rx="3" fill="#3db89a"/>
        <text x="${whSvgW - 94}" y="${whSvgH + 41}" font-size="11" fill="#475569">Breaks</text>
      </svg>`
    : '';

  // ── SVG: Emotion donut chart ──
  const emotionColors = { joy: '#3db89a', neutral: '#5eb0d8', sadness: '#7c8cdb', surprise: '#d4a84b', anger: '#e07070', fear: '#c97b9a', happy: '#3db89a', anxious: '#c97b9a', stressed: '#e07070' };
  const emoPairs = Object.entries(report.emotion_distribution || {}).sort((a, b) => b[1] - a[1]);
  const emoTotal = Math.max(1, emoPairs.reduce((a, [, v]) => a + v, 0));
  let emoAngle = -90;
  const R = 70, cx = 90, cy = 90;
  const donutArcs = emoPairs.map(([emo, pct]) => {
    const angle = (pct / emoTotal) * 360;
    const startA = emoAngle;
    emoAngle += angle;
    const endA = emoAngle;
    const r1 = (Math.PI / 180) * startA;
    const r2 = (Math.PI / 180) * endA;
    const x1 = cx + R * Math.cos(r1), y1 = cy + R * Math.sin(r1);
    const x2 = cx + R * Math.cos(r2), y2 = cy + R * Math.sin(r2);
    const large = angle > 180 ? 1 : 0;
    const ir = 42;
    const ix1 = cx + ir * Math.cos(r2), iy1 = cy + ir * Math.sin(r2);
    const ix2 = cx + ir * Math.cos(r1), iy2 = cy + ir * Math.sin(r1);
    const color = emotionColors[emo] || '#94a3b8';
    return `<path d="M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${ix1},${iy1} A${ir},${ir} 0 ${large} 0 ${ix2},${iy2} Z" fill="${color}"/>`;
  });
  const emoLegend = emoPairs.map(([emo, pct], i) => {
    const color = emotionColors[emo] || '#94a3b8';
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
      <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
      <span style="font-size:12px;color:#475569;text-transform:capitalize;width:70px">${emo}</span>
      <span style="font-size:12px;font-weight:600;color:#1e293b">${pct}%</span>
    </div>`;
  }).join('');

  const emotionSection = emoPairs.length > 0
    ? `<div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap">
        <svg viewBox="0 0 180 180" width="180" height="180">${donutArcs.join('')}
          <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="22" font-weight="700" fill="#1e293b">${emoPairs[0]?.[1] || 0}%</text>
          <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="11" fill="#64748b" text-transform="capitalize">${emoPairs[0]?.[0] || ''}</text>
        </svg>
        <div>${emoLegend}</div>
      </div>`
    : '<p style="color:#94a3b8;font-size:13px">No emotion data.</p>';

  // ── Self-care progress (SVG gauge-style) ──
  const scItems = [
    { label: 'Hydration', val: `${selfCare.hydration.avg_ml}/${selfCare.hydration.goal_ml} ml`, pct: selfCare.hydration.completion_pct, color: '#5eb0d8', icon: '\uD83D\uDCA7' },
    { label: 'Breaks', val: `${selfCare.breaks.total} taken`, pct: selfCare.breaks.compliance_pct, color: '#3db89a', icon: '\u23F8\uFE0F' },
    { label: 'Stretches', val: `${selfCare.stretches.done}/${selfCare.stretches.suggested}`, pct: selfCare.stretches.compliance_pct, color: '#7c8cdb', icon: '\uD83E\uDDD8' },
    { label: 'Eye Rest', val: `${selfCare.eye_rest.done}/${selfCare.eye_rest.suggested}`, pct: selfCare.eye_rest.compliance_pct, color: '#c97b9a', icon: '\uD83D\uDC41\uFE0F' },
  ];
  const selfCareHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    ${scItems.map(item => {
      const p = Math.min(item.pct, 100);
      const circumference = 2 * Math.PI * 36;
      const offset = circumference - (p / 100) * circumference;
      return `<div style="display:flex;align-items:center;gap:16px;padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0">
        <svg viewBox="0 0 90 90" width="70" height="70" style="flex-shrink:0">
          <circle cx="45" cy="45" r="36" fill="none" stroke="#e2e8f0" stroke-width="7"/>
          <circle cx="45" cy="45" r="36" fill="none" stroke="${item.color}" stroke-width="7" stroke-linecap="round"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 45 45)"/>
          <text x="45" y="42" text-anchor="middle" font-size="16" font-weight="700" fill="#1e293b">${p}%</text>
          <text x="45" y="56" text-anchor="middle" font-size="10" fill="#94a3b8">${item.icon}</text>
        </svg>
        <div>
          <div style="font-size:14px;font-weight:600;color:#1e293b">${item.label}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px">${item.val}</div>
        </div>
      </div>`;
    }).join('')}
  </div>`;

  // ── Stress heatmap ──
  const heatmapColors = ['#dcfce7', '#bbf7d0', '#fef3c7', '#fde68a', '#fed7aa', '#fca5a5', '#f87171'];
  const hm = report.stress_heatmap;
  const heatmapHTML = hm
    ? `<div style="overflow-x:auto">
        <table style="width:100%;border-collapse:separate;border-spacing:4px;font-size:12px">
          <tr>
            <td style="width:40px"></td>
            ${hm.hours.map(h => `<td style="text-align:center;padding:4px 2px;color:#94a3b8;font-size:10px;font-weight:500">${h}</td>`).join('')}
          </tr>
          ${hm.days.map((day, di) => `<tr>
            <td style="text-align:right;padding-right:8px;color:#64748b;font-size:11px;font-weight:500">${day}</td>
            ${hm.data[di].map(v => {
              const c = heatmapColors[Math.min(v - 1, 6)] || heatmapColors[0];
              return `<td><div style="height:32px;border-radius:6px;background:${c};display:flex;align-items:center;justify-content:center">
                <span style="font-size:10px;font-weight:600;color:#475569">${v}</span>
              </div></td>`;
            }).join('')}
          </tr>`).join('')}
        </table>
        <div style="display:flex;align-items:center;gap:4px;margin-top:8px;justify-content:flex-end">
          <span style="font-size:10px;color:#94a3b8">Low</span>
          ${heatmapColors.map(c => `<div style="width:16px;height:10px;border-radius:3px;background:${c}"></div>`).join('')}
          <span style="font-size:10px;color:#94a3b8">High</span>
        </div>
      </div>`
    : '';

  // ── Insights ──
  const insightEmoji = { achievement: '\uD83C\uDFC6', improvement: '\uD83D\uDCA1', positive: '\u2728', tip: '\uD83D\uDCA1' };
  const insightHTML = (report.insights || []).map(ins =>
    `<div style="display:flex;gap:14px;padding:16px;background:#f8fafc;border-radius:12px;margin-bottom:10px;border-left:4px solid #6b8cff">
      <span style="font-size:20px;line-height:1">${insightEmoji[ins.type] || '\uD83D\uDCA1'}</span>
      <div>
        <div style="font-size:14px;font-weight:600;color:#1e293b">${ins.title}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;line-height:1.6">${ins.detail}</div>
      </div>
    </div>`
  ).join('');

  // ── Recommendations ──
  const recsHTML = (report.recommendations || []).map((rec, i) =>
    `<div style="display:flex;gap:14px;margin-bottom:14px;align-items:flex-start">
      <div style="width:30px;height:30px;border-radius:10px;background:linear-gradient(135deg,#ede9fe,#fce7f3);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span style="font-size:13px;font-weight:700;color:#7c3aed">${i + 1}</span>
      </div>
      <div style="flex:1">
        <div style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.6px">${rec.category}</div>
        <div style="font-size:13px;color:#334155;margin-top:3px;line-height:1.6">${rec.tip}</div>
      </div>
    </div>`
  ).join('');

  // ── Cycle insights ──
  const cycleHTML = report.cycle_insights?.enabled
    ? `<div style="margin-top:32px;page-break-inside:avoid">
        <h2 style="font-family:'Playfair Display',serif;font-size:18px;color:#1e293b;margin-bottom:14px">Cycle-Aware Insights</h2>
        <div style="display:flex;gap:12px;margin-bottom:14px">
          ${Object.entries(report.cycle_insights.phase_scores || {}).map(([phase, score]) =>
            `<div style="flex:1;text-align:center;padding:14px;border-radius:12px;background:${phase === report.cycle_insights.current_phase ? '#f5f3ff' : '#f8fafc'};border:1px solid ${phase === report.cycle_insights.current_phase ? '#c4b5fd' : '#e2e8f0'}">
              <div style="font-size:22px;font-weight:700;color:#1e293b">${score}</div>
              <div style="font-size:11px;color:#64748b;text-transform:capitalize;margin-top:3px">${phase}</div>
            </div>`
          ).join('')}
        </div>
        <div style="background:#faf5ff;padding:14px 18px;border-radius:12px;font-size:13px;color:#4c1d95;line-height:1.6">${report.cycle_insights.tip}</div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wellness Report \u2013 ${report.period?.label || 'This Week'}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', -apple-system, sans-serif; color: #1e293b; max-width: 780px; margin: 0 auto; padding: 40px 32px; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @media print {
    body { padding: 12px 16px; }
    .no-print { display: none !important; }
    .section { page-break-inside: avoid; }
    @page { margin: 0.6cm; size: A4; }
  }
  h1 { font-family: 'Playfair Display', serif; }
  h2 { font-family: 'Playfair Display', serif; font-size: 18px; color: #1e293b; margin-bottom: 16px; }
  svg text { font-family: 'DM Sans', -apple-system, sans-serif; }
  .header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; margin-bottom: 28px; }
  .header h1 { font-size: 26px; color: #1e293b; margin-bottom: 4px; }
  .header .period { font-size: 14px; color: #7c3aed; font-weight: 500; }
  .header .meta { font-size: 12px; color: #94a3b8; margin-top: 6px; }
  .score-section { text-align: center; margin-bottom: 28px; }
  .score-circle { display: inline-flex; flex-direction: column; align-items: center; gap: 6px; }
  .score-num { font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 700; background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .score-label { font-size: 13px; color: #64748b; }
  .grade { display: inline-block; padding: 4px 14px; border-radius: 20px; background: #f5f3ff; color: #7c3aed; font-weight: 600; font-size: 13px; }
  .change { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-left: 8px; }
  .change.up { background: #f0fdf4; color: #16a34a; }
  .change.down { background: #fef2f2; color: #dc2626; }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .metric { text-align: center; padding: 16px 8px; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .metric .val { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #1e293b; }
  .metric .lbl { font-size: 11px; color: #94a3b8; margin-top: 4px; }
  .section { margin-top: 28px; }
  .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .chart-card { padding: 20px; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .chart-card h3 { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px; }
  .affirmation { margin-top: 32px; text-align: center; padding: 24px 20px; background: linear-gradient(135deg, #f5f3ff, #fdf2f8, #eff6ff); border-radius: 16px; page-break-inside: avoid; }
  .affirmation .label { font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
  .affirmation .text { font-size: 14px; color: #334155; line-height: 1.7; font-style: italic; max-width: 580px; margin: 0 auto; }
  .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
  .print-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 14px; font-family: 'DM Sans', sans-serif; }
  .print-btn:hover { opacity: 0.9; }
</style>
</head>
<body>
  <div class="header">
    <div style="font-size:22px;margin-bottom:6px">\u221E</div>
    <h1>Infinite Helix</h1>
    <div class="period">Weekly Wellness Report</div>
    <div class="meta">${report.period?.label || ''} \u00b7 Prepared for ${userName}</div>
    <div style="margin-top:4px;font-size:10px;color:#cbd5e1">Private & Confidential</div>
    <button class="print-btn no-print" onclick="window.print()">Save as PDF</button>
  </div>

  <!-- Score -->
  <div class="score-section">
    <div class="score-circle">
      <div class="score-num">${sc.current}</div>
      <div class="score-label">Wellness Score out of 100</div>
      <div>
        <span class="grade">${sc.grade}</span>
        <span class="change ${sc.change >= 0 ? 'up' : 'down'}">${sc.change >= 0 ? '\u2191' : '\u2193'} ${Math.abs(sc.change)} from last week</span>
      </div>
    </div>
  </div>

  <!-- Summary metrics -->
  <div class="metrics">
    <div class="metric"><div class="val">${s.total_focus_hours}h</div><div class="lbl">Focus Time</div></div>
    <div class="metric"><div class="val">${s.breaks_per_day}</div><div class="lbl">Breaks / Day</div></div>
    <div class="metric"><div class="val">${s.hydration_avg_ml}<span style="font-size:13px;font-weight:400;color:#94a3b8">/${s.hydration_goal_ml}</span></div><div class="lbl">Hydration (ml)</div></div>
    <div class="metric"><div class="val" style="text-transform:capitalize;font-size:18px">${s.mood_trend}</div><div class="lbl">Mood Trend</div></div>
  </div>

  <!-- Charts side-by-side -->
  <div class="chart-grid section">
    <div class="chart-card">
      <h3>Daily Wellness Scores</h3>
      ${dailyScoresSVG}
    </div>
    <div class="chart-card">
      <h3>Emotional Wellness</h3>
      ${emotionSection}
    </div>
  </div>

  <!-- Work Hours chart -->
  ${whLabels.length > 0 ? `<div class="section chart-card" style="margin-top:24px">
    <h3>Work Hours</h3>
    ${workHoursSVG}
  </div>` : ''}

  <!-- Self-Care Progress -->
  <div class="section">
    <h2>Self-Care Progress</h2>
    ${selfCareHTML}
  </div>

  <!-- Stress Heatmap -->
  ${hm ? `<div class="section">
    <h2>Stress Patterns</h2>
    ${heatmapHTML}
  </div>` : ''}

  ${cycleHTML}

  <!-- Insights -->
  ${(report.insights || []).length > 0 ? `<div class="section">
    <h2>Key Insights</h2>
    ${insightHTML}
  </div>` : ''}

  <!-- Recommendations -->
  ${(report.recommendations || []).length > 0 ? `<div class="section">
    <h2>Personalized Recommendations</h2>
    ${recsHTML}
  </div>` : ''}

  ${report.affirmation ? `<div class="affirmation"><div class="label">Your Weekly Affirmation</div><div class="text">\u201C${report.affirmation}\u201D</div></div>` : ''}

  <div class="footer">
    Generated by Infinite Helix \u00b7 AI-Powered Wellness Assistant for Women<br>
    \u00a9 ${new Date().getFullYear()} \u00b7 This report is private and confidential.
  </div>
</body>
</html>`;
}
