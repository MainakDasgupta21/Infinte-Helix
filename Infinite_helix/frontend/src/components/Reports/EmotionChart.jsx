import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const EMOTION_COLORS = {
  joy: '#3db89a',
  neutral: '#5eb0d8',
  sadness: '#7c8cdb',
  surprise: '#d4a84b',
  anger: '#e07070',
  fear: '#c97b9a',
  disgust: '#8f8f9a',
};

export default function EmotionChart({ distribution }) {
  if (!distribution) return null;

  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const labels = entries.map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
  const values = entries.map(([, val]) => val);
  const colors = entries.map(([key]) => EMOTION_COLORS[key] || '#9490a8');
  const topEmotion = entries[0];

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors.map((c) => `${c}cc`),
      hoverBackgroundColor: colors,
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
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
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.raw}%`,
        },
      },
    },
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-helix-muted mb-4">Emotional Wellness</h3>

      <div className="flex items-center gap-6">
        {/* Doughnut */}
        <div className="relative w-44 h-44 flex-shrink-0">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
            <span className="text-lg font-semibold text-helix-text capitalize leading-tight">
              {topEmotion?.[0] || '—'}
            </span>
            <span className="text-xs text-helix-muted mt-1">{topEmotion?.[1] != null ? `${topEmotion[1]}%` : ''}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {entries.map(([emotion, pct]) => (
            <div key={emotion} className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: EMOTION_COLORS[emotion] || '#9490a8' }}
              />
              <span className="text-xs text-helix-muted capitalize flex-1">{emotion}</span>
              <div className="w-16 h-1.5 bg-helix-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: EMOTION_COLORS[emotion] || '#9490a8' }}
                />
              </div>
              <span className="text-xs text-helix-text font-medium w-8 text-right">{pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
