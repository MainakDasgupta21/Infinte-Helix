import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function WorkHoursChart({ data }) {
  if (!data) return null;

  const totalFocus = data.focus.reduce((a, b) => a + b, 0).toFixed(1);
  const totalBreaks = data.breaks.reduce((a, b) => a + b, 0).toFixed(1);

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Focus Hours',
        data: data.focus,
        backgroundColor: 'rgba(107, 140, 255, 0.75)',
        hoverBackgroundColor: 'rgba(107, 140, 255, 0.95)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Break Hours',
        data: data.breaks,
        backgroundColor: 'rgba(52, 211, 153, 0.75)',
        hoverBackgroundColor: 'rgba(52, 211, 153, 0.95)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#9490a8', font: { size: 11, family: "'DM Sans', sans-serif" } },
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(46, 46, 60, 0.25)' },
        ticks: {
          color: '#9490a8',
          font: { size: 11, family: "'DM Sans', sans-serif" },
          callback: (v) => `${v}h`,
        },
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
        titleFont: { family: "'DM Sans', sans-serif" },
        bodyFont: { family: "'DM Sans', sans-serif" },
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}h`,
        },
      },
    },
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-helix-muted">Work Hours</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-helix-accent/75" />
            <span className="text-xs text-helix-muted">Focus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600/75" />
            <span className="text-xs text-helix-muted">Breaks</span>
          </div>
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        <p className="text-xs text-helix-muted/70">{totalFocus}h focus &middot; {totalBreaks}h breaks this week</p>
      </div>
      <div className="h-52">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
