"""CalendarManager — orchestrates multiple calendar providers with fallback.

Priority: Microsoft Teams/Outlook → Google Calendar → Demo data.
If the primary provider fails (API error, auth expired, not configured),
the manager transparently falls back to the next available provider.
"""

import logging
from datetime import datetime

from app.services.microsoft_calendar import MicrosoftCalendarProvider
from app.services.google_calendar import GoogleCalendarProvider

logger = logging.getLogger(__name__)

<<<<<<< HEAD
GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
# Read-only: meetings/times from Outlook/Teams calendar; no email, files, or write access.
SCOPES = 'Calendars.Read User.Read offline_access'


def _auth_base():
    tenant = os.getenv('MS_TENANT_ID', 'common')
    return f'https://login.microsoftonline.com/{tenant}/oauth2/v2.0'

=======
>>>>>>> 9aa662e (Add middleware, calendar providers, theme support, and UI improvement)
DEMO_MEETINGS = [
    {
        'id': 'demo-1', 'title': 'Sprint Planning', 'start': '09:00', 'end': '09:45',
        'attendees': 8, 'type': 'teams', 'organizer': 'Priya Sharma',
        'join_url': None, 'status': 'completed', 'is_teams': True, 'provider': 'demo',
    },
    {
        'id': 'demo-2', 'title': 'Design Review', 'start': '10:30', 'end': '11:00',
        'attendees': 4, 'type': 'in-person', 'organizer': 'Ananya Roy',
        'join_url': None, 'status': 'completed', 'is_teams': False, 'provider': 'demo',
    },
    {
        'id': 'demo-3', 'title': '1:1 with Manager', 'start': '14:00', 'end': '14:30',
        'attendees': 2, 'type': 'teams', 'organizer': 'Meera Patel',
        'join_url': 'https://teams.microsoft.com/l/meetup-join/demo',
        'status': 'upcoming', 'is_teams': True, 'provider': 'demo',
    },
    {
        'id': 'demo-4', 'title': 'Client Presentation', 'start': '15:30', 'end': '16:30',
        'attendees': 12, 'type': 'teams', 'organizer': 'Ravi Kumar',
        'join_url': 'https://teams.microsoft.com/l/meetup-join/demo',
        'status': 'upcoming', 'is_teams': True, 'provider': 'demo',
    },
    {
        'id': 'demo-5', 'title': 'Team Retro', 'start': '17:00', 'end': '17:30',
        'attendees': 6, 'type': 'teams', 'organizer': 'Sneha Iyer',
        'join_url': 'https://teams.microsoft.com/l/meetup-join/demo',
        'status': 'upcoming', 'is_teams': True, 'provider': 'demo',
    },
]


class CalendarManager:
    """Single entry-point for all calendar operations.

    Providers are tried in priority order.  The first one that is both
    *connected* and successfully returns data wins.  If all fail,
    demo data is returned so the UI always renders something useful.
    """

    def __init__(self):
        self._providers = [
            MicrosoftCalendarProvider(),
            GoogleCalendarProvider(),
        ]
        self._provider_map = {p.provider_name: p for p in self._providers}

    # ── Provider lookup ───────────────────────────────────────────

    def get_provider(self, name: str):
        return self._provider_map.get(name)

    @property
    def providers(self):
        return list(self._providers)

    # ── Aggregate status ──────────────────────────────────────────

    def get_connection_status(self, user_id: str) -> dict:
        """Return connection state for every provider + which is active."""
        active_provider = None
        provider_statuses = []

        for p in self._providers:
            connected = False
            try:
                connected = p.is_connected(user_id)
            except Exception:
                pass

            info = {
                'provider': p.provider_name,
                'display_name': p.display_name,
                'configured': p.is_configured,
                'connected': connected,
                'user': p.get_user_info(user_id) if connected else None,
            }
            provider_statuses.append(info)

            if connected and active_provider is None:
                active_provider = p.provider_name

        return {
            'active_provider': active_provider,
            'connected': active_provider is not None,
            'providers': provider_statuses,
        }

    # ── Meetings (with automatic fallback) ────────────────────────

    def get_todays_meetings(self, user_id: str) -> list[dict]:
        """Try each provider in priority order; fall back on failure."""
        last_error = None

        for p in self._providers:
            try:
                if not p.is_connected(user_id):
                    continue
                meetings = p.get_todays_meetings(user_id)
                logger.debug('Meetings fetched from %s for user %s (%d events)',
                             p.provider_name, user_id, len(meetings))
                return meetings
            except Exception as exc:
                last_error = exc
                logger.warning(
                    'Provider %s failed for user %s, trying next: %s',
                    p.provider_name, user_id, exc,
                )

        if last_error:
            logger.error('All calendar providers failed for user %s', user_id)

        return self._demo_with_status()

    def get_next_meeting(self, user_id: str) -> dict | None:
        meetings = self.get_todays_meetings(user_id)
        now = datetime.now().strftime('%H:%M')

        for m in meetings:
            if m['start'] > now:
                start_dt = datetime.strptime(m['start'], '%H:%M')
                now_dt = datetime.strptime(now, '%H:%M')
                minutes_until = (start_dt - now_dt).seconds // 60
                return {**m, 'minutes_until': minutes_until}
        return None

    # ── Event creation (through active provider) ──────────────────

    def create_event(self, user_id: str, event: dict) -> dict | None:
        """Create an event via the first connected provider.

        ``event`` must contain ``title``, ``start_iso``, ``end_iso``.
        Optional: ``description``.
        """
        for p in self._providers:
            try:
                if not p.is_connected(user_id):
                    continue
                result = p.create_event(user_id, event)
                if result:
                    logger.info('Event created via %s for user %s',
                                p.provider_name, user_id)
                    return result
            except Exception as exc:
                logger.warning('Event creation via %s failed: %s',
                               p.provider_name, exc)

        logger.error('No provider available to create event for user %s', user_id)
        return None

    # ── OAuth helpers ─────────────────────────────────────────────

    def get_authorize_url(self, provider_name: str, user_id: str) -> dict:
        """Return ``{'authorize_url': ...}`` or ``{'message': ..., 'missing': [...]}``."""
        p = self._provider_map.get(provider_name)
        if not p:
            return {'message': f'Unknown provider: {provider_name}'}

        if not p.is_configured:
            return {
                'message': f'{p.display_name} OAuth not configured.',
                'help': 'Check the required environment variables in .env.',
                'missing': [f'{provider_name.upper()}_CLIENT_ID',
                            f'{provider_name.upper()}_CLIENT_SECRET'],
            }

        url = p.get_authorize_url(user_id)
        if url:
            return {'authorize_url': url}
        return {'message': f'Failed to generate {p.display_name} authorization URL.'}

    def handle_callback(self, provider_name: str, code: str, user_id: str):
        """Delegate to the correct provider's callback handler."""
        p = self._provider_map.get(provider_name)
        if not p:
            return False, f'Unknown provider: {provider_name}'
        return p.handle_callback(code, user_id)

    def disconnect(self, provider_name: str, user_id: str):
        p = self._provider_map.get(provider_name)
        if p:
            p.disconnect(user_id)

    # ── Demo fallback ─────────────────────────────────────────────

    @staticmethod
    def _demo_with_status() -> list[dict]:
        now_str = datetime.now().strftime('%H:%M')
        return [
            {**m, 'status': 'completed' if m['start'] < now_str else 'upcoming'}
            for m in DEMO_MEETINGS
        ]
