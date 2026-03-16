import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#c084fc', '#38bdf8', '#f472b6', '#34d399'];
const LABELS_MAP = { coding: 'Coding', meetings: 'Meetings', browsing: 'Browsing', email: 'Email' };

export default function ScreenTimeChart({ screenTime }) {
  if (!screenTime) return null;

  const labels = Object.keys(screenTime.breakdown).map(k => LABELS_MAP[k] || k);
  const values = Object.values(screenTime.breakdown);

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: COLORS,
      borderColor: '#22222e',
      borderWidth: 3,
      hoverBorderWidth: 0,
      borderRadius: 4,
    }],
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
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-helix-muted mb-4">Screen Time</h3>
      <div className="relative h-40 flex items-center justify-center">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-display font-bold text-helix-text">{screenTime.total}h</span>
          <span className="text-xs text-helix-muted">of {screenTime.goal}h goal</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {labels.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-xs text-helix-muted">{label}</span>
            <span className="text-xs font-medium text-helix-text ml-auto">{values[i]}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
