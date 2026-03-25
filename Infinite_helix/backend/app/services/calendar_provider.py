"""Abstract base class for calendar providers.

Every provider (Microsoft, Google, future additions) implements this
interface so the CalendarManager can treat them uniformly and fall
back transparently when one provider is unavailable.
"""

from abc import ABC, abstractmethod


class CalendarProvider(ABC):

    # ── Identity ──────────────────────────────────────────────────

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Short identifier: 'microsoft' or 'google'."""

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable label shown in the UI."""

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """True when the required env vars (client id/secret) are present."""

    # ── OAuth ─────────────────────────────────────────────────────

    @abstractmethod
    def get_authorize_url(self, user_id: str) -> str | None:
        """Return the OAuth consent URL, or None if not configured."""

    @abstractmethod
    def handle_callback(self, code: str, user_id: str) -> tuple[bool, str]:
        """Exchange *code* for tokens and persist them.

        Returns ``(True, user_email)`` on success or
        ``(False, error_description)`` on failure.
        """

    # ── Calendar operations ───────────────────────────────────────

    @abstractmethod
    def get_todays_meetings(self, user_id: str) -> list[dict]:
        """Return a list of today's meetings in the canonical format:

        ``{'id', 'title', 'start' (HH:MM), 'end' (HH:MM), 'attendees',
           'type', 'is_teams', 'join_url', 'organizer', 'status'}``
        """

    @abstractmethod
    def create_event(self, user_id: str, event: dict) -> dict | None:
        """Create a calendar event. *event* has at minimum:

        ``{'title', 'start_iso', 'end_iso', 'description'}``

        Returns the created event dict or None on failure.
        """

    # ── Connection state ──────────────────────────────────────────

    @abstractmethod
    def is_connected(self, user_id: str) -> bool:
        """True when the user has a valid (or refreshable) token."""

    @abstractmethod
    def get_user_info(self, user_id: str) -> dict | None:
        """Return ``{'name', 'email'}`` for the connected account, or None."""

    @abstractmethod
    def disconnect(self, user_id: str) -> None:
        """Revoke / delete stored tokens for this user."""
