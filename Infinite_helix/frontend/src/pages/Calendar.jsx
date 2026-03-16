import React from 'react';
import MeetingTimeline from '../components/Calendar/MeetingTimeline';
import ConfidenceBreath from '../components/Calendar/ConfidenceBreath';
import { HiOutlineCalendar, HiOutlineBell } from 'react-icons/hi';

const CALENDAR_STATS = [
  { label: 'Meetings Today', value: '5', color: 'text-helix-accent' },
  { label: 'Meeting Hours', value: '3.2h', color: 'text-helix-sky' },
  { label: 'Free Blocks', value: '2', color: 'text-helix-mint' },
  { label: 'High-Stress', value: '1', color: 'text-helix-pink' },
];

export default function Calendar() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-helix-text">Calendar</h1>
          <p className="text-sm text-helix-muted mt-1">Pre-meeting calm reminders & schedule overview</p>
        </div>
        <button className="glass-card px-4 py-2 flex items-center gap-2 text-sm text-helix-accent hover:bg-helix-accent/10 transition-colors">
          <HiOutlineCalendar className="w-4 h-4" />
          Connect Google Calendar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CALENDAR_STATS.map(stat => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-helix-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <MeetingTimeline />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <ConfidenceBreath />

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineBell className="w-4 h-4 text-helix-amber" />
              <h3 className="text-sm font-medium text-helix-text">Pre-Meeting Reminders</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Calm reminder before meetings', enabled: true },
                { label: 'Hydration nudge before long calls', enabled: true },
                { label: 'Stretch suggestion after back-to-back', enabled: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-sm text-helix-muted">{item.label}</span>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    item.enabled ? 'bg-helix-accent' : 'bg-helix-border'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      item.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
