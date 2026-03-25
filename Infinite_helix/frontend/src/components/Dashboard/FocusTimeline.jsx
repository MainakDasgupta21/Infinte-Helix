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
    ctx.fillStyle = `rgba(124, 108, 219, ${0.10 + t * 0.15})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#7c6cdb';
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
      datasets: [{
        data: scores,
        borderColor: '#7c6cdb',
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 160);
          gradient.addColorStop(0, 'rgba(124, 108, 219, 0.15)');
          gradient.addColorStop(1, 'rgba(124, 108, 219, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c6cdb',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: (ctx) =>
          ctx.dataIndex === (ctx.dataset.data?.length ?? 0) - 1 ? 0 : 4,
        pointHoverRadius: 7,
      }],
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
          grid: { color: 'rgba(0,0,0,0.03)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
          border: { display: false },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(0,0,0,0.03)' },
          ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v) => `${v}%` },
          border: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          titleColor: '#334155',
          bodyColor: '#64748b',
          borderColor: 'rgba(0,0,0,0.06)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 14,
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
    <div className="bento-card h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <h3 className="bento-label">Focus Timeline</h3>
        <div className="flex flex-wrap gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className={`text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeFilter === null
                ? 'bg-violet-100 text-violet-600 shadow-[0_2px_8px_rgba(124,108,219,0.1)]'
                : 'bg-transparent text-slate-400 hover:text-slate-600'
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
                className={`text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all ${
                  active
                    ? 'bg-violet-100 text-violet-600 shadow-[0_2px_8px_rgba(124,108,219,0.1)]'
                    : 'bg-transparent text-slate-400 hover:text-slate-600'
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
          <p className="text-sm text-slate-400 flex items-center justify-center h-full">
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
          <span className="absolute bottom-1 right-2 text-[10px] uppercase tracking-wider text-slate-400/80 pointer-events-none">
            Current
          </span>
        )}
      </div>
    </div>
  );
}
