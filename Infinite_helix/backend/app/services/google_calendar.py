"""Google Calendar API v3 provider (fallback when Microsoft is unavailable)."""

import os
import logging
import requests
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode

from app.services.calendar_provider import CalendarProvider
from app.services.firebase_service import (
    save_calendar_token,
    get_calendar_token,
    delete_calendar_token,
)

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3'
SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
PROVIDER = 'google'


class GoogleCalendarProvider(CalendarProvider):

    # ── Identity ──────────────────────────────────────────────────

    @property
    def provider_name(self) -> str:
        return PROVIDER

    @property
    def display_name(self) -> str:
        return 'Google Calendar'

    @property
    def is_configured(self) -> bool:
        return bool(self._client_id and self._client_secret)

    @property
    def _client_id(self):
        return os.getenv('GOOGLE_CLIENT_ID', '')

    @property
    def _client_secret(self):
        return os.getenv('GOOGLE_CLIENT_SECRET', '')

    @property
    def _redirect_uri(self):
        return os.getenv(
            'GOOGLE_REDIRECT_URI',
            'http://localhost:5000/api/calendar/google/callback',
        )

    # ── OAuth ─────────────────────────────────────────────────────

    def get_authorize_url(self, user_id: str) -> str | None:
        if not self.is_configured:
            logger.warning('Google OAuth not configured')
            return None

        params = {
            'client_id': self._client_id,
            'redirect_uri': self._redirect_uri,
            'response_type': 'code',
            'scope': SCOPES,
            'access_type': 'offline',
            'prompt': 'consent',
            'state': f'google:{user_id}',
        }
        url = f'{GOOGLE_AUTH_URL}?{urlencode(params)}'
        logger.info('Generated Google authorize URL for user %s', user_id)
        return url

    def handle_callback(self, code: str, user_id: str) -> tuple[bool, str]:
        if not self.is_configured:
            return False, 'Google OAuth not configured'

        resp = requests.post(GOOGLE_TOKEN_URL, data={
            'client_id': self._client_id,
            'client_secret': self._client_secret,
            'code': code,
            'redirect_uri': self._redirect_uri,
            'grant_type': 'authorization_code',
        }, timeout=15)

        if resp.status_code != 200:
            body = resp.json()
            desc = body.get('error_description', body.get('error', 'Token exchange failed'))
            logger.error('Google token exchange failed (%s): %s',
                         resp.status_code, desc)
            return False, desc

        data = resp.json()
        user_info = self._fetch_user_profile(data['access_token'])

        save_calendar_token(user_id, PROVIDER, {
            'access_token': data['access_token'],
            'refresh_token': data.get('refresh_token'),
            'expires_at': datetime.now(timezone.utc).timestamp() + data.get('expires_in', 3600),
            'user_info': user_info,
        })

        email = (user_info or {}).get('email', user_id)
        logger.info('Google Calendar connected for user %s (%s)', user_id, email)
        return True, email

    # ── Token management ──────────────────────────────────────────

    def _get_valid_token(self, user_id: str) -> str | None:
        stored = get_calendar_token(user_id, PROVIDER)
        if not stored or not stored.get('access_token'):
            return None

        now = datetime.now(timezone.utc).timestamp()
        if now >= stored.get('expires_at', 0) - 60:
            if not self._refresh_token(user_id, stored):
                delete_calendar_token(user_id, PROVIDER)
                return None
            stored = get_calendar_token(user_id, PROVIDER)

        return stored.get('access_token')

    def _refresh_token(self, user_id: str, stored: dict) -> bool:
        refresh = stored.get('refresh_token')
        if not refresh:
            logger.warning('No Google refresh token for user %s', user_id)
            return False

        resp = requests.post(GOOGLE_TOKEN_URL, data={
            'client_id': self._client_id,
            'client_secret': self._client_secret,
            'refresh_token': refresh,
            'grant_type': 'refresh_token',
        }, timeout=15)

        if resp.status_code != 200:
            logger.error('Google token refresh failed (%s): %s',
                         resp.status_code, resp.text[:200])
            return False

        data = resp.json()
        save_calendar_token(user_id, PROVIDER, {
            'access_token': data['access_token'],
            'refresh_token': data.get('refresh_token', refresh),
            'expires_at': datetime.now(timezone.utc).timestamp() + data.get('expires_in', 3600),
            'user_info': stored.get('user_info'),
        })
        logger.info('Google token refreshed for user %s', user_id)
        return True

    # ── Calendar operations ───────────────────────────────────────

    def get_todays_meetings(self, user_id: str) -> list[dict]:
        token = self._get_valid_token(user_id)
        if not token:
            raise ConnectionError('No valid Google token')

        now = datetime.now(timezone.utc)
        time_min = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z'
        time_max = now.replace(hour=23, minute=59, second=59, microsecond=0).isoformat() + 'Z'

        resp = requests.get(
            f'{CALENDAR_BASE}/calendars/primary/events',
            headers={'Authorization': f'Bearer {token}'},
            params={
                'timeMin': time_min,
                'timeMax': time_max,
                'singleEvents': 'true',
                'orderBy': 'startTime',
                'maxResults': 50,
            },
            timeout=15,
        )
        if resp.status_code != 200:
            raise ConnectionError(f'Google Calendar API error: {resp.status_code}')

        now_str = datetime.now().strftime('%H:%M')
        meetings = []

        for item in resp.json().get('items', []):
            if item.get('status') == 'cancelled':
                continue

            start_dt = item.get('start', {}).get('dateTime')
            end_dt = item.get('end', {}).get('dateTime')
            if not start_dt or not end_dt:
                continue

            try:
                start_time = datetime.fromisoformat(start_dt).strftime('%H:%M')
                end_time = datetime.fromisoformat(end_dt).strftime('%H:%M')
            except (ValueError, AttributeError):
                continue

            hangout = item.get('hangoutLink')
            conf_data = item.get('conferenceData', {})
            conf_type = conf_data.get('conferenceSolution', {}).get(
                'name', '').lower()
            entry_points = conf_data.get('entryPoints', [])
            video_url = next(
                (ep.get('uri') for ep in entry_points if ep.get('entryPointType') == 'video'),
                hangout,
            )

            is_video = bool(video_url)
            is_meet = 'meet' in conf_type or bool(hangout)
            meeting_type = 'video' if is_video else 'in-person'

            organizer = item.get('organizer', {})
            attendees = item.get('attendees', [])

            meetings.append({
                'id': item.get('id', ''),
                'title': item.get('summary', 'No Title'),
                'start': start_time,
                'end': end_time,
                'attendees': len(attendees),
                'type': meeting_type,
                'is_teams': False,
                'is_meet': is_meet,
                'join_url': video_url,
                'organizer': organizer.get('displayName', organizer.get('email', '')),
                'status': 'completed' if start_time < now_str else 'upcoming',
                'provider': PROVIDER,
            })

        return meetings

    def create_event(self, user_id: str, event: dict) -> dict | None:
        token = self._get_valid_token(user_id)
        if not token:
            return None

        body = {
            'summary': event['title'],
            'start': {'dateTime': event['start_iso'], 'timeZone': 'UTC'},
            'end': {'dateTime': event['end_iso'], 'timeZone': 'UTC'},
            'description': event.get('description', ''),
        }

        resp = requests.post(
            f'{CALENDAR_BASE}/calendars/primary/events',
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
            },
            json=body,
            timeout=15,
        )
        if resp.status_code in (200, 201):
            created = resp.json()
            logger.info('Google event created: %s', created.get('id'))
            return {'id': created.get('id'), 'provider': PROVIDER}
        logger.error('Google event creation failed (%s): %s',
                     resp.status_code, resp.text[:200])
        return None

    # ── Connection state ──────────────────────────────────────────

    def is_connected(self, user_id: str) -> bool:
        return self._get_valid_token(user_id) is not None

    def get_user_info(self, user_id: str) -> dict | None:
        stored = get_calendar_token(user_id, PROVIDER)
        if stored:
            return stored.get('user_info')
        return None

    def disconnect(self, user_id: str) -> None:
        delete_calendar_token(user_id, PROVIDER)
        logger.info('Google Calendar disconnected for user %s', user_id)

    # ── Helpers ───────────────────────────────────────────────────

    @staticmethod
    def _fetch_user_profile(access_token: str) -> dict | None:
        try:
            resp = requests.get(
                GOOGLE_USERINFO_URL,
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10,
            )
            if resp.status_code == 200:
                d = resp.json()
                return {
                    'name': d.get('name'),
                    'email': d.get('email'),
                }
        except Exception as exc:
            logger.error('Failed to fetch Google profile: %s', exc)
        return None
