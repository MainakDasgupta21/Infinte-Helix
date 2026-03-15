# ScreenTracker — Screen Time & Focus Session Tracker
#
# Uses psutil to monitor active windows and screen time.
#
# Tracks:
#   - Total screen-on time
#   - Active application windows
#   - Focus sessions (uninterrupted work periods)
#   - Break periods (idle > 5 minutes)
#
# Focus score calculation:
#   score = (focused_minutes / total_minutes) * 100
#   Adjusted by: break regularity, typing consistency, idle pattern

# TODO: Implement window activity detection
# TODO: Focus session boundary detection
# TODO: Score calculation algorithm
