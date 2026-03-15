# NotificationManager — Desktop & Browser Notification Dispatcher
#
# Manages all outgoing wellness nudge notifications.
#
# Channels:
#   1. In-app (via API → frontend toast)
#   2. Browser Notification API (via frontend service worker)
#   3. Desktop toast (via plyer or win10toast on Windows)
#
# Throttling rules:
#   - Max 1 nudge per 30 minutes (gentle mode)
#   - Max 1 nudge per 60 minutes (quiet mode)
#   - No nudges during configured quiet hours
#   - No duplicate nudge types within 2 hours
#
# Nudge queue:
#   Pending nudges are queued and delivered at optimal moments
#   (e.g., during natural work pauses detected by activity monitor)

# TODO: Implement throttling logic
# TODO: Quiet hours enforcement
# TODO: Nudge queue with priority ordering
# TODO: Multi-channel dispatch
