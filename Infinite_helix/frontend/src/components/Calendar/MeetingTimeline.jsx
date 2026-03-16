import React from 'react';
import { HiOutlineVideoCamera, HiOutlineUsers, HiOutlinePhone } from 'react-icons/hi';

const MEETINGS = [
  { id: 1, title: 'Sprint Planning', time: '9:00 AM', duration: '45 min', type: 'video', attendees: 8, status: 'completed', stress: 'low' },
  { id: 2, title: 'Design Review', time: '10:30 AM', duration: '30 min', type: 'in-person', attendees: 4, status: 'completed', stress: 'medium' },
  { id: 3, title: '1:1 with Manager', time: '2:00 PM', duration: '30 min', type: 'video', attendees: 2, status: 'upcoming', stress: 'low' },
  { id: 4, title: 'Client Presentation', time: '3:30 PM', duration: '60 min', type: 'video', attendees: 12, status: 'upcoming', stress: 'high' },
  { id: 5, title: 'Team Retro', time: '5:00 PM', duration: '30 min', type: 'phone', attendees: 6, status: 'upcoming', stress: 'low' },
];

const TYPE_ICON = { video: HiOutlineVideoCamera, 'in-person': HiOutlineUsers, phone: HiOutlinePhone };
const STRESS_COLOR = { low: 'bg-helix-mint', medium: 'bg-helix-amber', high: 'bg-helix-pink' };

export default function MeetingTimeline() {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-helix-muted mb-4">Today's Meetings</h3>
      <div className="space-y-1">
        {MEETINGS.map((meeting, i) => {
          const Icon = TYPE_ICON[meeting.type] || HiOutlineVideoCamera;
          const isUpcoming = meeting.status === 'upcoming';

          return (
            <div key={meeting.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 ${
                  isUpcoming ? 'border-helix-accent bg-helix-accent/30' : 'border-helix-muted/40 bg-helix-muted/20'
                }`} />
                {i < MEETINGS.length - 1 && <div className="w-px flex-1 bg-helix-border my-1" />}
              </div>

              <div className={`flex-1 p-3 rounded-xl mb-2 transition-all ${
                isUpcoming
                  ? 'bg-helix-accent/5 border border-helix-accent/20 hover:border-helix-accent/40'
                  : 'bg-helix-bg/30 border border-helix-border/20 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isUpcoming ? 'text-helix-text' : 'text-helix-muted'}`}>
                    {meeting.title}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${STRESS_COLOR[meeting.stress]}`}
                       title={`${meeting.stress} stress`} />
                </div>
                <div className="flex items-center gap-3 text-xs text-helix-muted">
                  <span>{meeting.time}</span>
                  <span>·</span>
                  <span>{meeting.duration}</span>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{meeting.attendees}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
