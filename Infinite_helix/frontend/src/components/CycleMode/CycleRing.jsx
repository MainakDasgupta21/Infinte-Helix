import React, { useMemo } from 'react';

const PHASES = [
  { name: 'Menstrual', label: 'Rest', days: [1, 5], color: '#d95f8c', arc: '#d95f8c' },
  { name: 'Follicular', label: 'Plan', days: [6, 13], color: '#2d9e6e', arc: '#2d9e6e' },
  { name: 'Ovulatory', label: 'Execute', days: [14, 16], color: '#c88a2d', arc: '#c88a2d' },
  { name: 'Luteal', label: 'Refine', days: [17, 28], color: '#7c6cdb', arc: '#7c6cdb' },
];

function getPhase(day) {
  for (const p of PHASES) {
    if (day >= p.days[0] && day <= p.days[1]) return p;
  }
  return PHASES[3];
}

const R = 80;
const CX = 100;
const CY = 100;
const CIRCUMFERENCE = 2 * Math.PI * R;
const TOTAL_DAYS = 28;

export default function CycleRing({ cycleDay, onPhaseClick }) {
  const currentPhase = useMemo(() => getPhase(cycleDay), [cycleDay]);
  const progress = cycleDay / TOTAL_DAYS;

  const arcs = useMemo(() => {
    return PHASES.map((p) => {
      const startFrac = (p.days[0] - 1) / TOTAL_DAYS;
      const endFrac = p.days[1] / TOTAL_DAYS;
      const len = endFrac - startFrac;
      return {
        ...p,
        offset: CIRCUMFERENCE * (1 - startFrac) + CIRCUMFERENCE * 0.25,
        dash: CIRCUMFERENCE * len,
        gap: CIRCUMFERENCE * (1 - len),
      };
    });
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-52 h-52">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f0f0f8" strokeWidth="10" />
          {arcs.map((a) => (
            <circle
              key={a.name}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={a.arc}
              strokeWidth="10"
              strokeDasharray={`${a.dash} ${a.gap}`}
              strokeDashoffset={a.offset}
              opacity={currentPhase.name === a.name ? 1 : 0.3}
              className="transition-opacity duration-500 cursor-pointer"
              onClick={() => onPhaseClick?.(a)}
              strokeLinecap="round"
            />
          ))}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={currentPhase.arc}
            strokeWidth="4"
            strokeDasharray={`${CIRCUMFERENCE * progress} ${CIRCUMFERENCE * (1 - progress)}`}
            strokeDashoffset={CIRCUMFERENCE * 0.25}
            strokeLinecap="round"
            className="transition-all duration-700"
            filter="url(#glow)"
          />
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-serif font-bold text-helix-text">Day {cycleDay}</span>
          <span className="text-xs font-semibold mt-1" style={{ color: currentPhase.color }}>
            {currentPhase.name}
          </span>
          <span className="text-[10px] text-helix-muted mt-0.5">{currentPhase.label}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4 flex-wrap justify-center">
        {PHASES.map((p) => (
          <button
            key={p.name}
            onClick={() => onPhaseClick?.(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              currentPhase.name === p.name
                ? 'border-current shadow-sm'
                : 'border-helix-border/50 text-helix-muted hover:text-helix-text'
            }`}
            style={currentPhase.name === p.name ? { color: p.color, borderColor: p.color, backgroundColor: `${p.color}15` } : undefined}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { PHASES, getPhase };
