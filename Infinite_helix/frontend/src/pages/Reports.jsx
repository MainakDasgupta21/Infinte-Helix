import React, { useState, useEffect, useCallback } from 'react';
import { HiOutlineDownload, HiOutlineRefresh } from 'react-icons/hi';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePageContext } from '../context/PageContext';
import WellnessScorecard from '../components/Reports/WellnessScorecard';
import WorkHoursChart from '../components/Reports/WorkHoursChart';
import EmotionChart from '../components/Reports/EmotionChart';
import StressHeatmap from '../components/Reports/StressHeatmap';
import SelfCareMetrics from '../components/Reports/SelfCareMetrics';
import WeeklyInsight from '../components/Reports/WeeklyInsight';

export default function Reports() {
  const { user } = useAuth();
  const { updatePageContext } = usePageContext();
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-slide-up">
        <div className="h-8 w-48 bg-helix-card/60 rounded-lg animate-pulse" />
        <div className="glass-card p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="w-36 h-36 rounded-full bg-helix-card/60 animate-pulse" />
            <div className="flex-1 w-full space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-20 bg-helix-card/60 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card h-72 animate-pulse" />
          <div className="glass-card h-72 animate-pulse" />
        </div>
        <div className="glass-card h-56 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto animate-slide-up">
        <div className="glass-card p-12 text-center">
          <p className="text-sm font-medium text-helix-muted mb-2 uppercase tracking-wide">Error</p>
          <p className="text-helix-text font-medium mb-2">Couldn't load your report</p>
          <p className="text-sm text-helix-muted mb-6">{error}</p>
          <button
            onClick={fetchReport}
            className="px-5 py-2.5 rounded-xl bg-helix-accent/20 text-helix-accent text-sm font-medium hover:bg-helix-accent/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slide-up pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-helix-text">
            Your Wellness Report
          </h1>
          <p className="text-sm text-helix-muted mt-1">{report.period?.label}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReport}
            className="glass-card p-2.5 text-helix-muted hover:text-helix-text transition-colors"
            title="Refresh report"
          >
            <HiOutlineRefresh className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={downloadReport}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-helix-accent to-helix-sky text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-helix-accent/20"
          >
            <HiOutlineDownload className="w-4 h-4" />
            {downloading ? 'Preparing...' : 'Download Report'}
          </button>
        </div>
      </div>

      {/* Wellness Scorecard */}
      <WellnessScorecard
        score={report.wellness_score}
        summary={report.summary}
        dailyScores={report.daily_scores}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkHoursChart data={report.work_hours} />
        <EmotionChart distribution={report.emotion_distribution} />
      </div>

      {/* Stress Heatmap */}
      <StressHeatmap heatmap={report.stress_heatmap} />

      {/* Self-Care */}
      <SelfCareMetrics selfCare={report.self_care} />

      {/* Insights + Recommendations + Cycle + Affirmation */}
      <WeeklyInsight
        insights={report.insights}
        recommendations={report.recommendations}
        affirmation={report.affirmation}
        cycleInsights={report.cycle_insights}
      />
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
