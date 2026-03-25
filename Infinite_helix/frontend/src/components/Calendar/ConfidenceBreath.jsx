import React, { useState, useEffect, useRef } from 'react';

const BOX_PHASES = [
  { label: 'Breathe In', duration: 4000, color: '#6b8cff' },
  { label: 'Hold', duration: 4000, color: '#5eb0d8' },
  { label: 'Breathe Out', duration: 6000, color: '#3db89a' },
  { label: 'Rest', duration: 2000, color: '#c97b9a' },
];

const PELVIC_PHASES = [
  { label: 'Deep Inhale', duration: 5000, color: '#f5b731' },
  { label: 'Expand & Hold', duration: 3000, color: '#d4960a' },
  { label: 'Slow Release', duration: 7000, color: '#2d9e6e' },
  { label: 'Rest & Soften', duration: 3000, color: '#d95f8c' },
];

function cycleTotal(phases) {
  return phases.reduce((s, p) => s + p.duration, 0);
}

export default function ConfidenceBreath({ pregnancyMode = false }) {
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cycles, setCycles] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  const PHASES = pregnancyMode ? PELVIC_PHASES : BOX_PHASES;
  const TOTAL_CYCLE = cycleTotal(PHASES);

  useEffect(() => {
    if (!active) return;
    startRef.current = Date.now() - elapsed;

    const tick = () => {
      const now = Date.now();
      const e = now - startRef.current;
      setElapsed(e);
      setCycles(Math.floor(e / TOTAL_CYCLE));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, TOTAL_CYCLE]);

  const cycleElapsed = elapsed % TOTAL_CYCLE;
  let phaseIndex = 0, acc = 0;
  for (let i = 0; i < PHASES.length; i++) {
    if (cycleElapsed < acc + PHASES[i].duration) { phaseIndex = i; break; }
    acc += PHASES[i].duration;
  }
  const phase = PHASES[phaseIndex];
  const phaseProgress = (cycleElapsed - acc) / phase.duration;

  const scale = phaseIndex === 0 ? 1 + phaseProgress * (pregnancyMode ? 0.35 : 0.3)
    : phaseIndex === 1 ? pregnancyMode ? 1.35 : 1.3
    : phaseIndex === 2 ? (pregnancyMode ? 1.35 : 1.3) - phaseProgress * (pregnancyMode ? 0.35 : 0.3)
    : 1;

  const reset = () => { setActive(false); setElapsed(0); setCycles(0); };

  const title = pregnancyMode ? 'Deep Pelvic Breathing' : 'Confidence Breath';
  const subtitle = pregnancyMode
    ? 'Gentle deep breathing to relax your pelvic floor'
    : 'A 30-second calming exercise before meetings';
  const accentGradient = pregnancyMode
    ? 'from-amber-400 to-amber-600'
    : 'from-violet-600 to-blue-600';

  return (
    <div className="bento-card p-6 text-center">
      <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
      <p className="text-xs text-slate-500 mb-6">{subtitle}</p>

      <div className="relative w-40 h-40 mx-auto mb-6">
        <div
          className="absolute inset-0 rounded-full transition-transform duration-300"
          style={{
            transform: active ? `scale(${scale})` : 'scale(1)',
            background: `radial-gradient(circle, ${phase.color}20 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute inset-4 rounded-full border-2 transition-all duration-300"
          style={{
            borderColor: active ? phase.color : '#2e2e3c',
            transform: active ? `scale(${scale})` : 'scale(1)',
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {active ? (
            <>
              <span className="text-lg font-serif font-semibold text-slate-800">{phase.label}</span>
              <span className="text-xs text-slate-500 mt-1">Cycle {cycles + 1}</span>
            </>
          ) : (
            <span className="text-sm text-slate-500">Ready</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setActive(!active)}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            active
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : `bg-gradient-to-r ${accentGradient} text-white hover:opacity-90`
          }`}
        >
          {active ? 'Pause' : 'Start Breathing'}
        </button>
        {elapsed > 0 && (
          <button onClick={reset} className="px-4 py-2.5 rounded-xl text-sm text-slate-500 bg-slate-100 hover:bg-slate-50">
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
