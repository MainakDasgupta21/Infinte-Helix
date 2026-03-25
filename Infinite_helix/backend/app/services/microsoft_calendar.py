"""Microsoft Graph (Teams / Outlook) calendar provider."""

import os
import logging
import requests
from datetime import datetime, timezone
from urllib.parse import urlencode

from app.services.calendar_provider import CalendarProvider
from app.services.firebase_service import (
    save_calendar_token,
    get_calendar_token,
    delete_calendar_token,
)

logger = logging.getLogger(__name__)

GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
SCOPES = 'Calendars.ReadWrite User.Read offline_access'
PROVIDER = 'microsoft'


def _auth_base():
    tenant = os.getenv('MS_TENANT_ID', 'common')
    return f'https://login.microsoftonline.com/{tenant}/oauth2/v2.0'


class MicrosoftCalendarProvider(CalendarProvider):

    # ── Identity ──────────────────────────────────────────────────

    @property
    def provider_name(self) -> str:
        return PROVIDER

    @property
    def display_name(self) -> str:
        return 'Microsoft Teams / Outlook'

    @property
    def is_configured(self) -> bool:
        cid = os.getenv('MS_CLIENT_ID', '')
        secret = os.getenv('MS_CLIENT_SECRET', '')
        tenant = os.getenv('MS_TENANT_ID', 'common')
        return bool(cid and secret and not tenant.startswith('your-'))

    @property
    def _client_id(self):
        return os.getenv('MS_CLIENT_ID', '')

    @property
    def _client_secret(self):
        return os.getenv('MS_CLIENT_SECRET', '')

    @property
    def _redirect_uri(self):
        return os.getenv('MS_REDIRECT_URI', 'http://localhost:5000/api/calendar/callback')

    # ── OAuth ─────────────────────────────────────────────────────

    def get_authorize_url(self, user_id: str) -> str | None:
        if not self.is_configured:
            logger.warning('Microsoft OAuth not configured')
            return None

        params = {
            'client_id': self._client_id,
            'response_type': 'code',
            'redirect_uri': self._redirect_uri,
            'scope': SCOPES,
            'response_mode': 'query',
            'prompt': 'select_account',
            'state': f'microsoft:{user_id}',
        }
        url = f"{_auth_base()}/authorize?{urlencode(params)}"
        logger.info('Generated Microsoft authorize URL for user %s', user_id)
        return url

    def handle_callback(self, code: str, user_id: str) -> tuple[bool, str]:
        if not self.is_configured:
            return False, 'Microsoft OAuth not configured'

        resp = requests.post(f"{_auth_base()}/token", data={
            'client_id': self._client_id,
            'client_secret': self._client_secret,
            'code': code,
            'redirect_uri': self._redirect_uri,
            'grant_type': 'authorization_code',
            'scope': SCOPES,
        }, timeout=15)

        if resp.status_code != 200:
            body = resp.json()
            desc = body.get('error_description', 'Token exchange failed')
            code_err = body.get('error', 'unknown')
            logger.error('Microsoft token exchange failed (%s): [%s] %s',
                         resp.status_code, code_err, desc)
            if 'invalid_client' in code_err:
                logger.error('HINT: Use the Secret "Value", not the "Secret ID".')
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
        logger.info('Microsoft connected for user %s (%s)', user_id, email)
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
            logger.warning('No Microsoft refresh token for user %s', user_id)
            return False

        resp = requests.post(f"{_auth_base()}/token", data={
            'client_id': self._client_id,
            'client_secret': self._client_secret,
            'refresh_token': refresh,
            'grant_type': 'refresh_token',
            'scope': SCOPES,
        }, timeout=15)

        if resp.status_code != 200:
            logger.error('Microsoft token refresh failed (%s): %s',
                         resp.status_code, resp.text[:200])
            return False

        data = resp.json()
        save_calendar_token(user_id, PROVIDER, {
            'access_token': data['access_token'],
            'refresh_token': data.get('refresh_token', refresh),
            'expires_at': datetime.now(timezone.utc).timestamp() + data.get('expires_in', 3600),
            'user_info': stored.get('user_info'),
        })
        logger.info('Microsoft token refreshed for user %s', user_id)
        return True

    # ── Calendar operations ───────────────────────────────────────

    def get_todays_meetings(self, user_id: str) -> list[dict]:
        token = self._get_valid_token(user_id)
        if not token:
            raise ConnectionError('No valid Microsoft token')

        now = datetime.now(timezone.utc)
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=0).isoformat()

        resp = requests.get(
            f'{GRAPH_BASE}/me/calendarView',
            headers={'Authorization': f'Bearer {token}'},
            params={
                'startDateTime': start_of_day,
                'endDateTime': end_of_day,
                '$orderby': 'start/dateTime',
                '$select': 'id,subject,start,end,attendees,isOnlineMeeting,'
                           'onlineMeeting,onlineMeetingProvider,organizer,isCancelled',
                '$top': 50,
            },
            timeout=15,
        )
        if resp.status_code != 200:
            raise ConnectionError(f'Graph API error: {resp.status_code}')

        now_str = datetime.now().strftime('%H:%M')
        meetings = []

        for e in resp.json().get('value', []):
            if e.get('isCancelled'):
                continue
            start_raw = e.get('start', {}).get('dateTime', '')
            end_raw = e.get('end', {}).get('dateTime', '')
            try:
                start_time = datetime.fromisoformat(
                    start_raw.replace('Z', '+00:00')).strftime('%H:%M')
                end_time = datetime.fromisoformat(
                    end_raw.replace('Z', '+00:00')).strftime('%H:%M')
            except (ValueError, AttributeError):
                continue

            is_teams = (
                e.get('isOnlineMeeting', False)
                and e.get('onlineMeetingProvider', '').lower()
                in ('teamsforbusiness', 'teams')
            ) or bool((e.get('onlineMeeting') or {}).get('joinUrl'))

            join_url = (e.get('onlineMeeting') or {}).get('joinUrl')
            meeting_type = ('teams' if is_teams
                            else ('video' if e.get('isOnlineMeeting') else 'in-person'))

            meetings.append({
                'id': e.get('id', ''),
                'title': e.get('subject', 'No Title'),
                'start': start_time,
                'end': end_time,
                'attendees': len(e.get('attendees', [])),
                'type': meeting_type,
                'is_teams': is_teams,
                'join_url': join_url,
                'organizer': e.get('organizer', {}).get(
                    'emailAddress', {}).get('name', ''),
                'status': 'completed' if start_time < now_str else 'upcoming',
                'provider': PROVIDER,
            })

        return meetings

    def create_event(self, user_id: str, event: dict) -> dict | None:
        token = self._get_valid_token(user_id)
        if not token:
            return None

        body = {
            'subject': event['title'],
            'start': {
                'dateTime': event['start_iso'],
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': event['end_iso'],
                'timeZone': 'UTC',
            },
            'body': {
                'contentType': 'text',
                'content': event.get('description', ''),
            },
        }

        resp = requests.post(
            f'{GRAPH_BASE}/me/events',
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
            },
            json=body,
            timeout=15,
        )
        if resp.status_code in (200, 201):
            created = resp.json()
            logger.info('Microsoft event created: %s', created.get('id'))
            return {'id': created.get('id'), 'provider': PROVIDER}
        logger.error('Microsoft event creation failed (%s): %s',
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
        logger.info('Microsoft disconnected for user %s', user_id)

    # ── Helpers ───────────────────────────────────────────────────

    @staticmethod
    def _fetch_user_profile(access_token: str) -> dict | None:
        try:
            resp = requests.get(
                f'{GRAPH_BASE}/me',
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10,
            )
            if resp.status_code == 200:
                d = resp.json()
                return {
                    'name': d.get('displayName'),
                    'email': d.get('mail') or d.get('userPrincipalName'),
                }
        except Exception as exc:
            logger.error('Failed to fetch Microsoft profile: %s', exc)
        return None
