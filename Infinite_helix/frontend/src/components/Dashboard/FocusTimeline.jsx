import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const CARD_TITLE = 'text-[13px] uppercase tracking-[0.06em] font-semibold text-helix-muted';

const FILTER_LABELS = ['Deep Work', 'Code Review', 'Feature Dev', 'Documentation'];

const pulseLastPointPlugin = {
  id: 'pulseLastPoint',
  afterDraw(chart) {
    const ds = chart.data.datasets[0];
    if (!ds?.data?.length) return;
    const meta = chart.getDatasetMeta(0);
    if (!meta.data.length) return;
    const last = meta.data[meta.data.length - 1];
    const { x, y } = last.getProps(['x', 'y'], true);
    const ctx = chart.ctx;
    const t = (Math.sin(performance.now() / 350) + 1) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 10 + t * 5, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(107, 140, 255, ${0.12 + t * 0.18})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#6b8cff';
    ctx.fill();
    ctx.restore();
  },
};

export default function FocusTimeline({ sessions = [] }) {
  const chartRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState(null);

  const filtered = useMemo(() => {
    if (!activeFilter) return sessions;
    return sessions.filter((s) => s.label === activeFilter);
  }, [sessions, activeFilter]);

  const labels = filtered.map((s) => s.start);
  const scores = filtered.map((s) => s.score);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: scores,
          borderColor: '#6b8cff',
          backgroundColor: (ctx) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 160);
            gradient.addColorStop(0, 'rgba(107, 140, 255, 0.28)');
            gradient.addColorStop(1, 'rgba(107, 140, 255, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6b8cff',
          pointBorderColor: '#22222e',
          pointBorderWidth: 2,
          pointRadius: (ctx) =>
            ctx.dataIndex === (ctx.dataset.data?.length ?? 0) - 1 ? 0 : 4,
          pointHoverRadius: 7,
        },
      ],
    }),
    [labels, scores]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      scales: {
        x: {
          grid: { color: 'rgba(46, 46, 60, 0.5)' },
          ticks: { color: '#9490a8', font: { size: 11 } },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(46, 46, 60, 0.3)' },
          ticks: { color: '#9490a8', font: { size: 11 }, callback: (v) => `${v}%` },
        },
      },
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
        },
      },
    }),
    []
  );

  useEffect(() => {
    if (!filtered.length) return undefined;
    let intervalId;
    const t = setTimeout(() => {
      const chart = chartRef.current;
      if (!chart) return;
      intervalId = setInterval(() => chart.update('none'), 110);
    }, 80);
    return () => {
      clearTimeout(t);
      if (intervalId) clearInterval(intervalId);
    };
  }, [filtered, activeFilter]);

  return (
    <div className="glass-card p-6 col-span-2 h-full flex flex-col rounded-[20px]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <h3 className={CARD_TITLE}>Focus Timeline</h3>
        <div className="flex flex-wrap gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeFilter === null
                ? 'bg-helix-accent/25 text-helix-accent border border-helix-accent/35'
                : 'bg-helix-bg/50 text-helix-muted border border-transparent hover:text-helix-text'
            }`}
          >
            All
          </button>
          {FILTER_LABELS.map((name) => {
            const active = activeFilter === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setActiveFilter(name)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  active
                    ? 'bg-helix-accent/25 text-helix-accent border border-helix-accent/35'
                    : 'bg-helix-bg/50 text-helix-muted border border-transparent hover:text-helix-text'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-44 flex-1 min-h-[11rem] relative">
        {filtered.length === 0 ? (
          <p className="text-sm text-helix-muted flex items-center justify-center h-full">
            No focus blocks match this filter today.
          </p>
        ) : (
          <Line
            ref={chartRef}
            data={data}
            options={options}
            plugins={[pulseLastPointPlugin]}
          />
        )}
        {filtered.length > 0 && (
          <span className="absolute bottom-1 right-2 text-[10px] uppercase tracking-wider text-helix-muted/90 pointer-events-none">
            Current
          </span>
        )}
      </div>
    </div>
  );
}
