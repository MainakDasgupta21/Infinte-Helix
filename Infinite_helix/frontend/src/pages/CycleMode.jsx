import React, { useState } from 'react';
import PhaseSelector from '../components/CycleMode/PhaseSelector';
import EnergyIndicator from '../components/CycleMode/EnergyIndicator';
import { HiOutlineShieldCheck } from 'react-icons/hi';

const ADJUSTED_NUDGES = {
  menstrual: [
    { icon: '🫖', text: 'Warm tea reminder every 90 min' },
    { icon: '🧘', text: 'Gentle stretching — no intense exercise' },
    { icon: '😴', text: 'Power nap reminder at 2 PM' },
    { icon: '🌸', text: 'Self-compassion prompt every 2 hours' },
  ],
  follicular: [
    { icon: '💡', text: 'Creative brainstorming windows scheduled' },
    { icon: '🏃', text: 'Active break suggestions enabled' },
    { icon: '🤝', text: 'Social collaboration nudges active' },
    { icon: '📋', text: 'New project planning prompts' },
  ],
  ovulatory: [
    { icon: '🎤', text: 'Presentation confidence boosters' },
    { icon: '⚡', text: 'Deep work focus blocks maximized' },
    { icon: '💪', text: 'High-energy exercise suggestions' },
    { icon: '🌟', text: 'Leadership opportunity nudges' },
  ],
  luteal: [
    { icon: '📝', text: 'Task completion & cleanup prompts' },
    { icon: '🍵', text: 'Comfort food & tea reminders' },
    { icon: '🧩', text: 'Detail-oriented work suggestions' },
    { icon: '🛁', text: 'Extra self-care reminders' },
  ],
};

export default function CycleMode() {
  const [activePhase, setActivePhase] = useState('follicular');

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-helix-text">Cycle Energy Mode</h1>
          <p className="text-sm text-helix-muted mt-1">Wellness suggestions adapted to your natural energy cycle</p>
        </div>
        <div className="flex items-center gap-2 glass-card px-3 py-1.5">
          <HiOutlineShieldCheck className="w-4 h-4 text-helix-mint" />
          <span className="text-xs text-helix-muted">100% Private — Data stays on device</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <PhaseSelector activePhase={activePhase} onSelect={setActivePhase} />
          </div>
        </div>

        <div className="space-y-4">
          <EnergyIndicator phase={activePhase} />

          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-helix-muted mb-3">Adjusted Nudges</h3>
            <div className="space-y-2">
              {(ADJUSTED_NUDGES[activePhase] || []).map((nudge, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 bg-helix-bg/30 rounded-lg">
                  <span className="text-base">{nudge.icon}</span>
                  <span className="text-sm text-helix-text">{nudge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
