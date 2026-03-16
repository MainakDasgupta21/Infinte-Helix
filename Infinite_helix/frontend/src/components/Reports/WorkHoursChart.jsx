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

const WEEK_DATA = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  focus: [6.2, 5.8, 7.1, 6.5, 5.0, 1.2, 0],
  breaks: [0.8, 1.0, 0.6, 0.9, 1.2, 0.3, 0],
};

export default function WorkHoursChart() {
  const data = {
    labels: WEEK_DATA.labels,
    datasets: [
      {
        label: 'Focus Hours',
        data: WEEK_DATA.focus,
        backgroundColor: 'rgba(192, 132, 252, 0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Break Hours',
        data: WEEK_DATA.breaks,
        backgroundColor: 'rgba(52, 211, 153, 0.7)',
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
        ticks: { color: '#9490a8', font: { size: 11 } },
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(46, 46, 60, 0.3)' },
        ticks: { color: '#9490a8', font: { size: 11 }, callback: v => `${v}h` },
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
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-helix-muted">Work Hours</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-helix-accent/70" />
            <span className="text-xs text-helix-muted">Focus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-helix-mint/70" />
            <span className="text-xs text-helix-muted">Breaks</span>
          </div>
        </div>
      </div>
      <div className="h-52">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
