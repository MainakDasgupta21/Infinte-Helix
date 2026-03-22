import React, { useMemo, useState, useEffect } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { useWellness } from '../../context/WellnessContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const COLORS = ['#6b8cff', '#5eb0d8', '#c97b9a', '#3db89a'];
const LABELS_MAP = { coding: 'Coding', meetings: 'Meetings', browsing: 'Browsing', email: 'Email' };
const CARD_TITLE = 'text-[13px] uppercase tracking-[0.06em] font-semibold text-helix-muted';

function screenPhrase(totalHours, goalHours) {
  const t = Number(totalHours) || 0;
  if (t < 4) return 'Good — plenty of day left';
  if (t <= 6) return 'Halfway through your screen goal';
  return 'Consider stepping away soon';
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function TodayView({ screenTime }) {
  const phrase = useMemo(
    () => (screenTime ? screenPhrase(screenTime.total, screenTime.goal) : ''),
    [screenTime],
  );
  if (!screenTime) return null;

  const labels = Object.keys(screenTime.breakdown).map((k) => LABELS_MAP[k] || k);
  const values = Object.values(screenTime.breakdown);
  const keys = Object.keys(screenTime.breakdown);
  const maxVal = Math.max(...values, 0.01);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: COLORS,
        borderColor: '#22222e',
        borderWidth: 3,
        hoverBorderWidth: 0,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a22',
        borderColor: '#2e2e3c',
        borderWidth: 1,
        titleColor: '#e8e4f0',
        bodyColor: '#9490a8',
        padding: 12,
        cornerRadius: 12,
        callbacks: { label: (ctx) => ` ${ctx.parsed}h` },
      },
    },
  };

  return (
    <>
      <div className="relative h-40 flex items-center justify-center flex-1 min-h-[10rem]">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-display font-bold text-helix-text">
            {screenTime.total}h
          </span>
          <span className="text-xs text-helix-muted text-center px-2 mt-0.5 max-w-[9rem] leading-snug">
            {phrase}
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-2.5 flex-1">
        {keys.map((key, i) => {
          const label = LABELS_MAP[key] || key;
          const v = values[i];
          const pct = (v / maxVal) * 100;
          return (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-helix-muted">{label}</span>
                <span className="font-medium text-helix-text">{v}h</span>
              </div>
              <div className="h-1.5 rounded-full bg-helix-bg overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function HistoryView({ history }) {
  if (!history.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-helix-muted py-8">
        No history data yet — check back tomorrow.
      </div>
    );
  }

  const labels = history.map((h) => formatDateLabel(h.date));
  const values = history.map((h) => h.total_hours || 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Hours',
        data: values,
        backgroundColor: values.map((_, i) =>
          i === values.length - 1 ? '#6b8cff' : 'rgba(107,140,255,0.45)',
        ),
        borderRadius: 6,
        barThickness: 18,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a22',
        borderColor: '#2e2e3c',
        borderWidth: 1,
        titleColor: '#e8e4f0',
        bodyColor: '#9490a8',
        padding: 10,
        cornerRadius: 10,
        callbacks: { label: (ctx) => ` ${ctx.parsed.y}h` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9490a8', font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148,144,168,0.1)' },
        ticks: { color: '#9490a8', font: { size: 10 }, callback: (v) => `${v}h` },
      },
    },
  };

  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);

  return (
    <>
      <div className="relative flex-1 min-h-[12rem]">
        <Bar data={data} options={options} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-helix-muted">
        <span>
          Avg <span className="text-helix-text font-medium">{avg}h</span>/day
        </span>
        <span>Last {history.length} days</span>
      </div>
    </>
  );
}

export default function ScreenTimeChart({ screenTime }) {
  const [showHistory, setShowHistory] = useState(false);
  const { screenHistory, fetchScreenHistory } = useWellness();

  useEffect(() => {
    if (showHistory) fetchScreenHistory(7);
  }, [showHistory, fetchScreenHistory]);

  return (
    <div className="glass-card p-6 h-full flex flex-col rounded-2xl border border-helix-border/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className={CARD_TITLE}>{showHistory ? 'Screen History' : 'Screen Time'}</h3>
        <button
          onClick={() => setShowHistory((p) => !p)}
          className="text-[11px] font-medium text-helix-accent hover:text-helix-accent/80 transition-colors"
        >
          {showHistory ? '← Today' : 'History →'}
        </button>
      </div>
      {showHistory ? <HistoryView history={screenHistory} /> : <TodayView screenTime={screenTime} />}
    </div>
  );
}
