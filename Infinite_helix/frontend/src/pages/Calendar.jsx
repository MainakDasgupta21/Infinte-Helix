import React, { useState, useEffect, useCallback } from 'react';
import MeetingTimeline from '../components/Calendar/MeetingTimeline';
import ConfidenceBreath from '../components/Calendar/ConfidenceBreath';
import { HiOutlineBell, HiOutlineCheckCircle } from 'react-icons/hi';
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

export default function Calendar() {
  const { updatePageContext } = usePageContext();
  const [status, setStatus] = useState({ connected: false, configured: false });
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
      toast.success('Microsoft Teams calendar connected!');
      window.history.replaceState({}, '', '/calendar');
    } else if (params.get('error')) {
      toast.error(`Connection failed: ${params.get('error')}`);
      window.history.replaceState({}, '', '/calendar');
    }
    fetchAll();
  }, [fetchAll]);

  const handleConnect = async () => {
    try {
      const res = await calendarAPI.authorize();
      if (res.data.authorize_url) {
        window.location.href = res.data.authorize_url;
      } else {
        toast(res.data.message || 'Microsoft OAuth not configured — showing demo data', { icon: 'i' });
      }
    } catch {
      toast.error('Failed to start authorization');
    }
  };

  const handleDisconnect = async () => {
    try {
      await calendarAPI.disconnect();
      toast.success('Disconnected from Microsoft Teams');
      fetchAll();
    } catch {
      toast.error('Failed to disconnect');
    }
  };

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
        teams_connected: status.connected,
        meetings_list: meetings.slice(0, 5).map(m => ({
          subject: m.subject,
          start: m.start,
          end: m.end,
          is_teams: m.is_teams,
          status: m.status,
        })),
      });
    }
  }, [meetings, status, loading, teamsMeetings, upcomingCount, meetingHours, freeHours, updatePageContext]);

  const stats = [
    { label: 'Meetings Today', value: String(meetings.length), color: 'text-helix-accent' },
    { label: 'Teams Calls', value: String(teamsMeetings.length), color: 'text-indigo-400' },
    { label: 'Meeting Hours', value: `${meetingHours}h`, color: 'text-helix-sky' },
    { label: 'Free Time', value: `${freeHours.toFixed(1)}h`, color: 'text-helix-mint' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-helix-text">Calendar</h1>
          <p className="text-sm text-helix-muted mt-1">
            {status.connected
              ? 'Synced with Microsoft Teams — showing your real meetings'
              : 'Pre-meeting calm reminders & schedule overview'}
          </p>
        </div>

        {status.connected ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-helix-mint/10 border border-helix-mint/20">
              <HiOutlineCheckCircle className="w-4 h-4 text-helix-mint" />
              <span className="text-xs text-helix-mint font-medium">
                {status.user?.name || 'Teams Connected'}
              </span>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-3 py-2 text-xs text-helix-muted hover:text-helix-pink transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="glass-card px-4 py-2 flex items-center gap-2 text-sm text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 transition-colors"
          >
            <TeamsIcon className="w-4 h-4" />
            Connect Microsoft Teams
          </button>
        )}
      </div>

      {!status.connected && (
        <div className="glass-card p-4 border border-indigo-500/10 bg-indigo-500/5">
          <div className="flex items-start gap-3">
            <TeamsIcon className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-helix-text font-medium">Sync your Microsoft Teams meetings</p>
              <p className="text-xs text-helix-muted mt-1">
                Connect your Microsoft account to automatically see your Teams meetings,
                join calls with one click, and get wellness reminders before stressful meetings.
              </p>
              {!status.configured && (
                <p className="text-xs text-helix-amber mt-2">
                  Setup required: Add MS_CLIENT_ID and MS_CLIENT_SECRET to your backend .env file.
                  Register an app at portal.azure.com with Calendars.Read permission.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-display font-bold ${stat.color}`}>
              {loading ? '—' : stat.value}
            </p>
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
