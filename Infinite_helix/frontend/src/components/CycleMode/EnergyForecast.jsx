import React, { useMemo, useRef, useEffect } from 'react';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getPhase } from './CycleRing';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip);

function energyForDay(cycleDay) {
  if (cycleDay >= 1 && cycleDay <= 3) return 30 + Math.random() * 10;
  if (cycleDay >= 4 && cycleDay <= 5) return 40 + Math.random() * 10;
  if (cycleDay >= 6 && cycleDay <= 10) return 55 + Math.random() * 15;
  if (cycleDay >= 11 && cycleDay <= 13) return 70 + Math.random() * 10;
  if (cycleDay >= 14 && cycleDay <= 16) return 85 + Math.random() * 10;
  if (cycleDay >= 17 && cycleDay <= 21) return 65 + Math.random() * 10;
  if (cycleDay >= 22 && cycleDay <= 25) return 50 + Math.random() * 10;
  return 35 + Math.random() * 10;
}

export default function EnergyForecast({ cycleDay }) {
  const chartRef = useRef(null);

  const { labels, data, colors } = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = ((cycleDay - 1 + i) % 28) + 1;
      return d;
    });
    const dayLabels = days.map((d, i) => i === 0 ? 'Today' : `+${i}d`);
    const values = days.map(d => Math.round(energyForDay(d)));
    const phaseColors = days.map(d => getPhase(d).arc);
    return { labels: dayLabels, data: values, colors: phaseColors };
  }, [cycleDay]);

  const chartData = {
    labels,
    datasets: [{
      data,
      fill: true,
      tension: 0.45,
      borderColor: '#7c6cdb',
      backgroundColor: 'rgba(124,108,219,0.08)',
      pointBackgroundColor: colors,
      pointBorderColor: colors,
      pointRadius: 5,
      pointHoverRadius: 7,
      borderWidth: 2.5,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0, max: 100,
        ticks: { display: false },
        grid: { color: 'rgba(232,232,240,0.4)', drawBorder: false },
        border: { display: false },
      },
      x: {
        ticks: { color: '#6b7280', font: { size: 11 } },
        grid: { display: false },
        border: { display: false },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#2a2a3a',
        bodyColor: '#6b7280',
        borderColor: '#e8e8f0',
        borderWidth: 1,
        cornerRadius: 10,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx) => `Energy: ${ctx.raw}%`,
        },
      },
      legend: { display: false },
    },
  };

  return (
    <div className="bento-card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Energy Forecast</h3>
        <span className="text-[10px] text-slate-500">Next 7 days</span>
      </div>
      <div className="h-40">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-[#d95f8c]" /> Rest
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-[#2d9e6e]" /> Plan
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-[#c88a2d]" /> Execute
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-[#7c6cdb]" /> Refine
        </span>
      </div>
    </div>
  );
}
