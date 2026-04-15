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

const COLORS = ['#7c6cdb', '#3b82c8', '#d95f8c', '#2d9e6e'];
const LABELS_MAP = { coding: 'Coding', meetings: 'Meetings', browsing: 'Browsing', email: 'Email' };

function screenPhrase(totalHours) {
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
    () => (screenTime ? screenPhrase(screenTime.total) : ''),
    [screenTime],
  );
  if (!screenTime) return null;

  const labels = Object.keys(screenTime.breakdown).map((k) => LABELS_MAP[k] || k);
  const values = Object.values(screenTime.breakdown);
  const keys = Object.keys(screenTime.breakdown);
  const maxVal = Math.max(...values, 0.01);

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: COLORS,
      borderColor: 'rgba(255,255,255,0.9)',
      borderWidth: 3,
      hoverBorderWidth: 0,
      borderRadius: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#334155',
        bodyColor: '#64748b',
        borderColor: 'rgba(0,0,0,0.06)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 16,
        callbacks: { label: (ctx) => ` ${ctx.parsed}h` },
      },
    },
  };

  return (
    <>
      <div className="relative h-40 flex items-center justify-center flex-1 min-h-[10rem]">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-serif font-bold text-helix-text">
            {screenTime.total}h
          </span>
          <span className="text-[11px] text-helix-muted text-center px-2 mt-1 max-w-[9rem] leading-snug">
            {phrase}
          </span>
        </div>
      </div>
      <div className="mt-5 space-y-3 flex-1">
        {keys.map((key, i) => {
          const label = LABELS_MAP[key] || key;
          const v = values[i];
          const pct = (v / maxVal) * 100;
          return (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-helix-muted">{label}</span>
                <span className="font-medium text-helix-text">{v}h</span>
              </div>
              <div className="h-1.5 rounded-full bg-helix-border/30 overflow-hidden">
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
    datasets: [{
      label: 'Hours',
      data: values,
      backgroundColor: values.map((_, i) =>
        i === values.length - 1 ? '#7c6cdb' : 'rgba(124,108,219,0.3)',
      ),
      borderRadius: 8,
      barThickness: 20,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#334155',
        bodyColor: '#64748b',
        borderColor: 'rgba(0,0,0,0.06)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 12,
        callbacks: { label: (ctx) => ` ${ctx.parsed.y}h` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.03)' },
        ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v) => `${v}h` },
        border: { display: false },
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
        <span>Avg <span className="text-helix-text font-medium">{avg}h</span>/day</span>
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
    <div className="bento-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="bento-label">{showHistory ? 'Screen History' : 'Screen Time'}</h3>
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
