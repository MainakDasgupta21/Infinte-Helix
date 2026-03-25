import os
import logging
import requests
from datetime import datetime, timezone
from urllib.parse import urlencode

logger = logging.getLogger(__name__)

GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
# Read-only: meetings/times from Outlook/Teams calendar; no email, files, or write access.
SCOPES = 'Calendars.Read User.Read offline_access'


def _auth_base():
    tenant = os.getenv('MS_TENANT_ID', 'common')
    return f'https://login.microsoftonline.com/{tenant}/oauth2/v2.0'

DEMO_MEETINGS = [
    {
        'id': 'demo-1', 'title': 'Sprint Planning', 'start': '09:00', 'end': '09:45',
        'attendees': 8, 'type': 'teams', 'organizer': 'Priya Sharma',
        'join_url': None, 'status': 'completed', 'is_teams': True,
    },
    {
        'id': 'demo-2', 'title': 'Design Review', 'start': '10:30', 'end': '11:00',
        'attendees': 4, 'type': 'in-person', 'organizer': 'Ananya Roy',
        'join_url': None, 'status': 'completed', 'is_teams': False,
    },
    {
        'id': 'demo-3', 'title': '1:1 with Manager', 'start': '14:00', 'end': '14:30',
        'attendees': 2, 'type': 'teams', 'organizer': 'Meera Patel',
        'join_url': 'https://teams.microsoft.com/l/meetup-join/demo',
        'status': 'upcoming', 'is_teams': True,
    },
    {
        'id': 'demo-4', 'title': 'Client Presentation', 'start': '15:30', 'end': '16:30',
        'attendees': 12, 'type': 'teams', 'organizer': 'Ravi Kumar',
        'join_url': 'https://teams.microsoft.com/l/meetup-join/demo',
        'status': 'upcoming', 'is_teams': True,
    },
    {
        'id': 'demo-5', 'title': 'Team Retro', 'start': '17:00', 'end': '17:30',
        'attendees': 6, 'type': 'teams', 'organizer': 'Sneha Iyer',
        'join_url': 'https://teams.microsoft.com/l/meetup-join/demo',
        'status': 'upcoming', 'is_teams': True,
    },
]


class CalendarService:
    """
    Microsoft Graph Calendar integration for Teams meetings.
    Falls back to demo data when OAuth is not configured or user hasn't connected.
    """

    def __init__(self):
        self._tokens = {}

    @property
    def _client_id(self):
        return os.getenv('MS_CLIENT_ID', '')

    @property
    def _client_secret(self):
        return os.getenv('MS_CLIENT_SECRET', '')

    @property
    def _redirect_uri(self):
        return os.getenv('MS_REDIRECT_URI', 'http://localhost:5000/api/calendar/callback')

    @property
    def _is_configured(self):
        return bool(self._client_id and self._client_secret)

    def get_authorize_url(self):
        if not self._is_configured:
            logger.warning("Microsoft OAuth not configured: MS_CLIENT_ID or MS_CLIENT_SECRET missing")
            return None

        tenant = os.getenv('MS_TENANT_ID', 'common')
        if tenant.startswith('your-') or not tenant:
            logger.error(
                "MS_TENANT_ID is not set (current value: '%s'). "
                "Set it to your Azure AD tenant ID, or 'common' for multi-tenant apps.", tenant
            )
            return None

        params = {
            'client_id': self._client_id,
            'response_type': 'code',
            'redirect_uri': self._redirect_uri,
            'scope': SCOPES,
            'response_mode': 'query',
            'prompt': 'select_account',
        }
        url = f"{_auth_base()}/authorize?{urlencode(params)}"
        logger.info("Generated authorize URL for tenant: %s", tenant)
        return url

    def handle_callback(self, auth_code):
        """Exchange authorization code for access + refresh tokens."""
        if not self._is_configured:
            return False, 'Microsoft OAuth not configured'

        token_url = f"{_auth_base()}/token"
        logger.info("Exchanging auth code at: %s", token_url)

        resp = requests.post(token_url, data={
            'client_id': self._client_id,
            'client_secret': self._client_secret,
            'code': auth_code,
            'redirect_uri': self._redirect_uri,
            'grant_type': 'authorization_code',
            'scope': SCOPES,
        })

        if resp.status_code != 200:
            error_body = resp.json()
            error_desc = error_body.get('error_description', 'Token exchange failed')
            error_code = error_body.get('error', 'unknown')
            logger.error(
                "Token exchange failed (HTTP %s): [%s] %s",
                resp.status_code, error_code, error_desc
            )
            if 'invalid_client' in error_code:
                logger.error(
                    "HINT: 'invalid_client' usually means MS_CLIENT_SECRET is wrong. "
                    "Make sure you are using the Secret 'Value' (not the 'Secret ID') from Azure portal."
                )
            return False, error_desc

        data = resp.json()
        user_info = self._fetch_user_profile(data['access_token'])
        user_key = user_info.get('mail', 'default') if user_info else 'default'

        self._tokens[user_key] = {
            'access_token': data['access_token'],
            'refresh_token': data.get('refresh_token'),
            'expires_at': datetime.now(timezone.utc).timestamp() + data.get('expires_in', 3600),
            'user': user_info,
        }
        logger.info("Successfully connected Microsoft account: %s", user_key)
        return True, user_key

    def _refresh_access_token(self, user_key):
        token_data = self._tokens.get(user_key)
        if not token_data or not token_data.get('refresh_token'):
            logger.warning("No refresh token available for user: %s", user_key)
            return False

        resp = requests.post(f"{_auth_base()}/token", data={
            'client_id': self._client_id,
            'client_secret': self._client_secret,
            'refresh_token': token_data['refresh_token'],
            'grant_type': 'refresh_token',
            'scope': SCOPES,
        })

        if resp.status_code != 200:
            logger.error("Token refresh failed (HTTP %s): %s", resp.status_code, resp.text)
            return False

        data = resp.json()
        token_data['access_token'] = data['access_token']
        token_data['refresh_token'] = data.get('refresh_token', token_data['refresh_token'])
        token_data['expires_at'] = datetime.now(timezone.utc).timestamp() + data.get('expires_in', 3600)
        logger.info("Successfully refreshed token for user: %s", user_key)
        return True

    def _get_valid_token(self, user_key='default'):
        token_data = self._tokens.get(user_key)
        if not token_data:
            return None

        if datetime.now(timezone.utc).timestamp() >= token_data['expires_at'] - 60:
            if not self._refresh_access_token(user_key):
                del self._tokens[user_key]
                return None

        return token_data['access_token']

    def _fetch_user_profile(self, access_token):
        try:
            resp = requests.get(f"{GRAPH_BASE}/me", headers={
                'Authorization': f'Bearer {access_token}',
            })
            if resp.status_code == 200:
                d = resp.json()
                return {'name': d.get('displayName'), 'mail': d.get('mail') or d.get('userPrincipalName')}
            logger.error("Failed to fetch user profile (HTTP %s): %s", resp.status_code, resp.text)
        except Exception as e:
            logger.error("Exception fetching user profile: %s", e)
        return None

    def get_connection_status(self):
        if not self._is_configured:
            return {'connected': False, 'provider': 'microsoft', 'configured': False}

        for key, data in self._tokens.items():
            token = self._get_valid_token(key)
            if token:
                return {
                    'connected': True,
                    'provider': 'microsoft',
                    'configured': True,
                    'user': data.get('user'),
                }

        return {'connected': False, 'provider': 'microsoft', 'configured': True}

    def disconnect(self, user_key=None):
        if user_key and user_key in self._tokens:
            del self._tokens[user_key]
        else:
            self._tokens.clear()

    def get_todays_meetings(self):
        for key in list(self._tokens.keys()):
            token = self._get_valid_token(key)
            if token:
                try:
                    return self._fetch_from_microsoft(token)
                except Exception as e:
                    logger.error("Failed to fetch meetings from Microsoft Graph for '%s': %s", key, e)

        if not self._tokens:
            logger.debug("No connected accounts, returning demo meetings")
        return self._demo_with_status()

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

    def _fetch_from_microsoft(self, access_token):
        """Fetch today's calendar events from Microsoft Graph including Teams info."""
        now = datetime.now(timezone.utc)
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=0).isoformat()

        resp = requests.get(
            f"{GRAPH_BASE}/me/calendarView",
            headers={'Authorization': f'Bearer {access_token}'},
            params={
                'startDateTime': start_of_day,
                'endDateTime': end_of_day,
                '$orderby': 'start/dateTime',
                '$select': 'id,subject,start,end,attendees,isOnlineMeeting,onlineMeeting,onlineMeetingProvider,organizer,isCancelled',
                '$top': 50,
            },
        )

        if resp.status_code != 200:
            raise Exception(f"Graph API error: {resp.status_code}")

        events = resp.json().get('value', [])
        now_str = datetime.now().strftime('%H:%M')
        meetings = []

        for e in events:
            if e.get('isCancelled'):
                continue

            start_raw = e.get('start', {}).get('dateTime', '')
            end_raw = e.get('end', {}).get('dateTime', '')

            try:
                start_time = datetime.fromisoformat(start_raw.replace('Z', '+00:00')).strftime('%H:%M')
                end_time = datetime.fromisoformat(end_raw.replace('Z', '+00:00')).strftime('%H:%M')
            except (ValueError, AttributeError):
                continue

            is_teams = (
                e.get('isOnlineMeeting', False)
                and e.get('onlineMeetingProvider', '').lower() in ('teamsforbusiness', 'teams')
            ) or bool(e.get('onlineMeeting', {}).get('joinUrl'))

            join_url = None
            online = e.get('onlineMeeting')
            if online and isinstance(online, dict):
                join_url = online.get('joinUrl')

            meeting_type = 'teams' if is_teams else ('video' if e.get('isOnlineMeeting') else 'in-person')
            status = 'completed' if start_time < now_str else 'upcoming'

            meetings.append({
                'id': e.get('id', ''),
                'title': e.get('subject', 'No Title'),
                'start': start_time,
                'end': end_time,
                'attendees': len(e.get('attendees', [])),
                'type': meeting_type,
                'is_teams': is_teams,
                'join_url': join_url,
                'organizer': e.get('organizer', {}).get('emailAddress', {}).get('name', ''),
                'status': status,
            })

        return meetings

    def _demo_with_status(self):
        now_str = datetime.now().strftime('%H:%M')
        meetings = []
        for m in DEMO_MEETINGS:
            status = 'completed' if m['start'] < now_str else 'upcoming'
            meetings.append({**m, 'status': status})
        return meetings
