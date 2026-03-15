# NudgeEngine — Context-Aware Wellness Nudge Generator
#
# Takes work behavior context and generates appropriate wellness nudges.
#
# Decision matrix:
#
# | Context                  | Nudge Type   | Example Message                                           |
# |--------------------------|-------------|-----------------------------------------------------------|
# | 2+ hrs continuous work   | hydration   | "You just finished a long session — hydrate?"             |
# | High typing intensity    | eyes        | "Your eyes have been busy — try the 20-20-20 rule."      |
# | 90+ min no break         | stretch     | "A quick stretch can reset your focus."                   |
# | Meeting in 10-15 min     | meeting     | "Meeting soon. Want a 30-second confidence breath?"       |
# | Negative journal entry   | emotional   | "You're doing better than you think. Small steps count."  |
# | Post-task completion     | hydration   | "Great work finishing that! Perfect moment to hydrate."   |
# | 3+ hrs no movement       | stretch     | "Your body could use a gentle reset. Stand and stretch?"  |
#
# Priority: gentle < moderate < important
# Frequency: Respects user's notification preference settings
#
# Usage:
#   engine = NudgeEngine()
#   nudge = engine.generate(context_data)

# TODO: Implement context evaluation logic
# TODO: Template-based message generation
# TODO: Frequency throttling
