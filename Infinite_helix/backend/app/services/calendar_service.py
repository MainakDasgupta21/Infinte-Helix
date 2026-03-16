import os
from datetime import datetime, timedelta

DEMO_MEETINGS = [
    {'id': '1', 'title': 'Sprint Planning', 'start': '09:00', 'end': '09:45', 'attendees': 8, 'type': 'video'},
    {'id': '2', 'title': 'Design Review', 'start': '10:30', 'end': '11:00', 'attendees': 4, 'type': 'in-person'},
    {'id': '3', 'title': '1:1 with Manager', 'start': '14:00', 'end': '14:30', 'attendees': 2, 'type': 'video'},
    {'id': '4', 'title': 'Client Presentation', 'start': '15:30', 'end': '16:30', 'attendees': 12, 'type': 'video'},
    {'id': '5', 'title': 'Team Retro', 'start': '17:00', 'end': '17:30', 'attendees': 6, 'type': 'phone'},
]


class CalendarService:
    """
    Google Calendar integration.
    Falls back to demo data when OAuth is not configured.
    """

    def __init__(self):
        self._service = None
        self._credentials = None

    def get_authorize_url(self):
        client_id = os.getenv('GOOGLE_CLIENT_ID', '')
        redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/calendar/callback')

        if not client_id:
            return None

        from google_auth_oauthlib.flow import Flow
        flow = Flow.from_client_config(
            {
                'web': {
                    'client_id': client_id,
                    'client_secret': os.getenv('GOOGLE_CLIENT_SECRET', ''),
                    'redirect_uris': [redirect_uri],
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': 'https://oauth2.googleapis.com/token',
                }
            },
            scopes=['https://www.googleapis.com/auth/calendar.readonly'],
            redirect_uri=redirect_uri,
        )
        url, _ = flow.authorization_url(prompt='consent')
        return url

    def get_todays_meetings(self):
        if self._service:
            return self._fetch_from_google()
        return DEMO_MEETINGS

    def get_next_meeting(self):
        meetings = self.get_todays_meetings()
        now = datetime.now().strftime('%H:%M')

        for m in meetings:
            if m['start'] > now:
                start_dt = datetime.strptime(m['start'], '%H:%M')
                now_dt = datetime.strptime(now, '%H:%M')
                minutes_until = (start_dt - now_dt).seconds // 60
                return {**m, 'minutes_until': minutes_until}
        return None

    def _fetch_from_google(self):
        now = datetime.utcnow()
        start = now.replace(hour=0, minute=0, second=0).isoformat() + 'Z'
        end = (now.replace(hour=23, minute=59, second=59)).isoformat() + 'Z'

        events = self._service.events().list(
            calendarId='primary',
            timeMin=start,
            timeMax=end,
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        return [
            {
                'id': e['id'],
                'title': e.get('summary', 'No Title'),
                'start': e['start'].get('dateTime', e['start'].get('date', '')),
                'end': e['end'].get('dateTime', e['end'].get('date', '')),
                'attendees': len(e.get('attendees', [])),
                'type': 'video' if 'hangoutLink' in e else 'in-person',
            }
            for e in events.get('items', [])
        ]
