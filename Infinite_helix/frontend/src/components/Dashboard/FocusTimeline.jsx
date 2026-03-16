import React from 'react';
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

export default function FocusTimeline({ sessions = [] }) {
  const labels = sessions.map(s => s.start);
  const scores = sessions.map(s => s.score);

  const data = {
    labels,
    datasets: [{
      data: scores,
      borderColor: '#c084fc',
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 160);
        gradient.addColorStop(0, 'rgba(192, 132, 252, 0.25)');
        gradient.addColorStop(1, 'rgba(192, 132, 252, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#c084fc',
      pointBorderColor: '#22222e',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(46, 46, 60, 0.5)' },
        ticks: { color: '#9490a8', font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(46, 46, 60, 0.3)' },
        ticks: { color: '#9490a8', font: { size: 11 }, callback: v => `${v}%` },
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
    <div className="glass-card p-6 col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-helix-muted">Focus Timeline</h3>
        <div className="flex gap-2">
          {sessions.map((s, i) => (
            <span key={i} className="text-xs bg-helix-accent/10 text-helix-accent px-2 py-1 rounded-lg">
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="h-44">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
