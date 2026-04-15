import React, { useState, useEffect, useCallback } from 'react';
import MeetingTimeline from '../components/Calendar/MeetingTimeline';
import ConfidenceBreath from '../components/Calendar/ConfidenceBreath';
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineSwitchHorizontal } from 'react-icons/hi';
import { calendarAPI } from '../services/api';
import toast from 'react-hot-toast';
import { usePageContext } from '../context/PageContext';

function TeamsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.404 4.5a2.25 2.25 0 1 0-2.746-.09v.09h2.746Zm.346 1.5h-3.5a2.5 2.5 0 0 1 2.5 2.5V14a3 3 0 0 1-.255 1.21A3.5 3.5 0 0 0 22 11.857V8.5A2.5 2.5 0 0 0 19.75 6ZM9.5 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM5 11.5A2.5 2.5 0 0 1 7.5 9h4a2.5 2.5 0 0 1 2.5 2.5V16a4 4 0 1 1-8 0v-1H5v-3.5Zm2.5-1a1 1 0 0 0-1 1V14h2v2a2.5 2.5 0 0 0 5 0v-4.5a1 1 0 0 0-1-1h-5Z"/>
    </svg>
  );
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const PROVIDER_THEME = {
  microsoft: {
    Icon: TeamsIcon,
    label: 'Microsoft Teams',
    color: 'indigo',
    borderClass: 'border-indigo-500/20',
    bgClass: 'bg-indigo-500/10',
    textClass: 'text-indigo-400',
    bgHoverClass: 'hover:bg-indigo-500/15',
  },
  google: {
    Icon: GoogleIcon,
    label: 'Google Calendar',
    color: 'emerald',
    borderClass: 'border-emerald-500/20',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    bgHoverClass: 'hover:bg-emerald-500/15',
  },
};

export default function Calendar() {
  const { updatePageContext } = usePageContext();
  const [status, setStatus] = useState({ connected: false, providers: [] });
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, meetingsRes] = await Promise.all([
        calendarAPI.getStatus(),
        calendarAPI.getMeetings(),
      ]);
      setStatus(statusRes.data);
      setMeetings(meetingsRes.data);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      const provider = params.get('provider');
      const label = provider === 'google' ? 'Google Calendar' : 'Microsoft Teams';
      toast.success(`${label} calendar connected!`);
      window.history.replaceState({}, '', '/calendar');
    } else if (params.get('error')) {
      toast.error(`Connection failed: ${params.get('error')}`);
      window.history.replaceState({}, '', '/calendar');
    }
    fetchAll();
  }, [fetchAll]);

  const handleConnect = async (providerName) => {
    try {
      const res = await calendarAPI.authorize(providerName);
      if (res.data.authorize_url) {
        window.location.href = res.data.authorize_url;
      } else {
        toast(res.data.message || 'OAuth not configured — showing demo data', { icon: 'ℹ️' });
      }
    } catch {
      toast.error('Failed to start authorization');
    }
  };

  const handleDisconnect = async (providerName) => {
    try {
      await calendarAPI.disconnect(providerName);
      const label = providerName === 'google' ? 'Google Calendar' : 'Microsoft Teams';
      toast.success(`Disconnected from ${label}`);
      fetchAll();
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const activeProvider = status.active_provider;
  const providerList = status.providers || [];
  const connectedProviders = providerList.filter(p => p.connected);
  const disconnectedProviders = providerList.filter(p => !p.connected);

  const teamsMeetings = meetings.filter(m => m.is_teams);
  const upcomingCount = meetings.filter(m => m.status === 'upcoming').length;
  const totalMinutes = meetings.reduce((sum, m) => {
    if (!m.start || !m.end) return sum;
    const [sh, sm] = m.start.split(':').map(Number);
    const [eh, em] = m.end.split(':').map(Number);
    return sum + (eh * 60 + em) - (sh * 60 + sm);
  }, 0);
  const meetingHours = (totalMinutes / 60).toFixed(1);
  const freeHours = Math.max(0, 8 - totalMinutes / 60);

  useEffect(() => {
    if (!loading) {
      updatePageContext('calendar', {
        total_meetings: meetings.length,
        teams_meetings: teamsMeetings.length,
        upcoming_count: upcomingCount,
        meeting_hours: meetingHours,
        free_hours: freeHours.toFixed(1),
        active_provider: activeProvider,
        meetings_list: meetings.slice(0, 5).map(m => ({
          subject: m.title,
          start: m.start,
          end: m.end,
          is_teams: m.is_teams,
          status: m.status,
          provider: m.provider,
        })),
      });
    }
  }, [meetings, status, loading, teamsMeetings, upcomingCount, meetingHours, freeHours, activeProvider, updatePageContext]);

  const stats = [
    { label: 'Meetings Today', value: String(meetings.length), color: 'text-helix-accent' },
    { label: 'Video Calls', value: String(teamsMeetings.length + meetings.filter(m => m.is_meet).length), color: 'text-indigo-400' },
    { label: 'Meeting Hours', value: `${meetingHours}h`, color: 'text-helix-sky' },
    { label: 'Free Time', value: `${freeHours.toFixed(1)}h`, color: 'text-helix-mint' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-helix-text">Calendar</h1>
          <p className="text-sm text-helix-muted mt-1">
            {activeProvider
              ? `Synced with ${PROVIDER_THEME[activeProvider]?.label || activeProvider} — showing your real meetings`
              : 'Pre-meeting calm reminders & schedule overview'}
          </p>
        </div>

        {/* Connected provider badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {connectedProviders.map(p => {
            const theme = PROVIDER_THEME[p.provider] || PROVIDER_THEME.microsoft;
            const isActive = p.provider === activeProvider;
            return (
              <div key={p.provider} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border
                  ${isActive
                    ? 'bg-helix-mint/10 border-helix-mint/20'
                    : 'bg-helix-card/60 border-helix-border/40'}`}
                >
                  <HiOutlineCheckCircle className={`w-4 h-4 ${isActive ? 'text-helix-mint' : 'text-helix-muted'}`} />
                  <theme.Icon className="w-4 h-4" />
                  <span className={`text-xs font-medium ${isActive ? 'text-helix-mint' : 'text-helix-muted'}`}>
                    {p.user?.name || theme.label}
                  </span>
                  {isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-helix-mint/15 text-helix-mint font-medium">
                      Active
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDisconnect(p.provider)}
                  className="px-2 py-2 text-xs text-helix-muted hover:text-helix-pink transition-colors"
                  title={`Disconnect ${theme.label}`}
                >
                  Disconnect
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider connection cards (show unconnected providers) */}
      {disconnectedProviders.length > 0 && (
        <div className={`grid gap-3 ${disconnectedProviders.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {disconnectedProviders.map(p => {
            const theme = PROVIDER_THEME[p.provider] || PROVIDER_THEME.microsoft;
            const isPrimary = p.provider === 'microsoft';
            return (
              <div
                key={p.provider}
                className={`glass-card p-4 border ${theme.borderClass} ${theme.bgClass.replace('/10', '/5')}`}
              >
                <div className="flex items-start gap-3">
                  <theme.Icon className={`w-5 h-5 ${theme.textClass} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-helix-text font-medium">{theme.label}</p>
                      {isPrimary && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-helix-accent/15 text-helix-accent font-medium">
                          Primary
                        </span>
                      )}
                      {!isPrimary && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-helix-amber/15 text-helix-amber font-medium">
                          Fallback
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-helix-muted">
                      {isPrimary
                        ? 'Connect your Microsoft account to see Teams meetings, join calls, and get wellness reminders.'
                        : 'Connect Google Calendar as a fallback if Microsoft is unavailable.'}
                    </p>
                    {!p.configured && (
                      <p className="text-xs text-helix-amber mt-2">
                        Setup required: Add {p.provider.toUpperCase()}_CLIENT_ID and {p.provider.toUpperCase()}_CLIENT_SECRET to your backend .env file.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleConnect(p.provider)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-colors
                      ${theme.borderClass} ${theme.textClass} ${theme.bgHoverClass}`}
                  >
                    Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback indicator */}
      {activeProvider === 'google' && connectedProviders.length > 0 && (
        <div className="glass-card p-3 border border-helix-amber/20 bg-helix-amber/5">
          <div className="flex items-center gap-2 text-xs text-helix-amber">
            <HiOutlineSwitchHorizontal className="w-4 h-4 shrink-0" />
            <span>
              Using Google Calendar as fallback — Microsoft Teams was unavailable.
              {' '}
              <button
                onClick={() => handleConnect('microsoft')}
                className="underline hover:text-helix-text transition-colors"
              >
                Reconnect Microsoft
              </button>
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-serif font-bold ${stat.color}`}>
              {loading ? '—' : stat.value}
            </p>
            <p className="text-xs text-helix-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <MeetingTimeline />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <ConfidenceBreath />

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineBell className="w-4 h-4 text-amber-600" />
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
                    item.enabled ? 'bg-helix-accent' : 'bg-helix-border/30'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-helix-surface transition-transform ${
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
