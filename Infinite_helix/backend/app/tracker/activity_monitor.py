# ActivityMonitor — Background Work Behavior Tracking Service
#
# Runs as a background thread/process using psutil and pynput.
#
# Tracks:
#   - Keyboard activity (keystrokes per minute, typing bursts)
#   - Mouse activity (clicks, movement)
#   - Idle time (no input for 60+ seconds)
#   - Active work duration (continuous activity sessions)
#   - Screen time (total non-idle time)
#   - Typing intensity (low / moderate / high / intense)
#
# Data collection interval: every 30 seconds
# Aggregation: per 5-minute windows, stored in work_sessions
#
# Fatigue detection rules:
#   - 2+ hours continuous work → suggest break
#   - Declining typing speed   → potential fatigue
#   - Frequent short idle gaps → possible distraction/stress
#   - Very late hours         → overtime warning
#
# Libraries: pynput (keyboard/mouse listeners), psutil (system metrics)
#
# Usage:
#   monitor = ActivityMonitor(user_id="...")
#   monitor.start()  # begins background tracking
#   monitor.stop()   # stops tracking
#   monitor.get_current_session() → { ... }

# TODO: Implement keyboard listener (pynput)
# TODO: Implement idle detection
# TODO: Implement typing intensity calculation
# TODO: Implement session aggregation
# TODO: Thread-safe data access
