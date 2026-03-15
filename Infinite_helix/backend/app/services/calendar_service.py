# CalendarService — Google Calendar API Integration
#
# Uses Google Calendar API v3 to fetch upcoming meetings.
#
# OAuth2 flow:
#   1. User authorizes via Google OAuth on frontend
#   2. Backend receives auth code
#   3. Exchange for access/refresh tokens
#   4. Store tokens securely in Firebase
#   5. Use tokens to fetch calendar events
#
# Key functions:
#   - get_today_meetings(user_id) → list of today's events
#   - get_next_meeting(user_id)   → nearest upcoming meeting
#   - should_nudge(meeting)       → True if meeting is 10-15 min away
#
# Pre-meeting nudge window: 10–15 minutes before meeting start
#
# Required scopes:
#   - https://www.googleapis.com/auth/calendar.readonly

# TODO: Google OAuth2 token management
# TODO: Calendar events fetching
# TODO: Pre-meeting window detection
