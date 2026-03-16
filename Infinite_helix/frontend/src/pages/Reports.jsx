import React from 'react';
import WorkHoursChart from '../components/Reports/WorkHoursChart';
import StressHeatmap from '../components/Reports/StressHeatmap';
import WeeklyInsight from '../components/Reports/WeeklyInsight';
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

const TREND_DATA = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Wellness Score',
      data: [65, 72, 68, 80, 78, 45, 0],
      borderColor: '#c084fc',
      backgroundColor: 'rgba(192, 132, 252, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#c084fc',
      pointBorderColor: '#22222e',
      pointBorderWidth: 2,
      pointRadius: 4,
    },
    {
      label: 'Hydration',
      data: [50, 62, 75, 50, 62, 25, 0],
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56, 189, 248, 0.05)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#38bdf8',
      pointBorderColor: '#22222e',
      pointBorderWidth: 2,
      pointRadius: 4,
    },
  ],
};

const TREND_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { grid: { display: false }, ticks: { color: '#9490a8' } },
    y: { min: 0, max: 100, grid: { color: 'rgba(46,46,60,0.3)' }, ticks: { color: '#9490a8', callback: v => `${v}%` } },
  },
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#1a1a22', borderColor: '#2e2e3c', borderWidth: 1, titleColor: '#e8e4f0', bodyColor: '#9490a8', padding: 12, cornerRadius: 12 },
  },
};

export default function Reports() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-semibold text-helix-text">Weekly Report</h1>
        <p className="text-sm text-helix-muted mt-1">Insights and trends from your work week</p>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-helix-muted">Weekly Trends</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-helix-accent" />
              <span className="text-xs text-helix-muted">Wellness</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-helix-sky" />
              <span className="text-xs text-helix-muted">Hydration</span>
            </div>
          </div>
        </div>
        <div className="h-48">
          <Line data={TREND_DATA} options={TREND_OPTIONS} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkHoursChart />
        <StressHeatmap />
      </div>

      <WeeklyInsight />
    </div>
  );
}
