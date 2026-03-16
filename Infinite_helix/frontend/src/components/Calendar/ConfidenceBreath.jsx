import React, { useState, useEffect, useRef } from 'react';

const PHASES = [
  { label: 'Breathe In', duration: 4000, color: '#c084fc' },
  { label: 'Hold', duration: 4000, color: '#38bdf8' },
  { label: 'Breathe Out', duration: 6000, color: '#34d399' },
  { label: 'Rest', duration: 2000, color: '#f472b6' },
];
const TOTAL_CYCLE = PHASES.reduce((s, p) => s + p.duration, 0);

export default function ConfidenceBreath() {
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cycles, setCycles] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(0);

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
  }, [active]);

  const cycleElapsed = elapsed % TOTAL_CYCLE;
  let phaseIndex = 0, acc = 0;
  for (let i = 0; i < PHASES.length; i++) {
    if (cycleElapsed < acc + PHASES[i].duration) { phaseIndex = i; break; }
    acc += PHASES[i].duration;
  }
  const phase = PHASES[phaseIndex];
  const phaseProgress = (cycleElapsed - acc) / phase.duration;

  const scale = phaseIndex === 0 ? 1 + phaseProgress * 0.3
    : phaseIndex === 1 ? 1.3
    : phaseIndex === 2 ? 1.3 - phaseProgress * 0.3
    : 1;

  const reset = () => { setActive(false); setElapsed(0); setCycles(0); };

  return (
    <div className="glass-card p-6 text-center">
      <h3 className="text-sm font-medium text-helix-muted mb-2">Confidence Breath</h3>
      <p className="text-xs text-helix-muted mb-6">A 30-second calming exercise before meetings</p>

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
              <span className="text-lg font-display font-semibold text-helix-text">{phase.label}</span>
              <span className="text-xs text-helix-muted mt-1">Cycle {cycles + 1}</span>
            </>
          ) : (
            <span className="text-sm text-helix-muted">Ready</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setActive(!active)}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            active
              ? 'bg-helix-red/15 text-helix-red hover:bg-helix-red/25'
              : 'bg-gradient-to-r from-helix-accent to-helix-pink text-white hover:opacity-90'
          }`}
        >
          {active ? 'Pause' : 'Start Breathing'}
        </button>
        {elapsed > 0 && (
          <button onClick={reset} className="px-4 py-2.5 rounded-xl text-sm text-helix-muted bg-helix-bg/50 hover:bg-helix-bg">
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
