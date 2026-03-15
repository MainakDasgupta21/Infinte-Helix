# Nudge Routes — /api/nudge/*
#
# POST /api/nudge/generate
#   Request:  { "context": "long_session", "workMinutes": 120, "lastBreak": "..." }
#   Response: { "nudge": {
#     "type": "hydration",
#     "message": "You just finished a long report — this is a good moment to hydrate.",
#     "priority": "gentle",
#     "exercise": null
#   }}
#
# Nudge types: hydration, stretch, eyes, breathing, meeting_prep, emotional
# Priority levels: gentle (can dismiss), moderate (persistent), important (with exercise)
#
# Context-aware logic:
#   - After 2+ hours continuous → hydration + stretch
#   - High typing intensity     → eye relaxation
#   - Pre-meeting (10-15 min)   → confidence breath
#   - Negative journal entry    → emotional support

# TODO: Blueprint registration
# TODO: generate() — context-aware nudge generation engine
