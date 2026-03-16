import time
import random

NUDGE_TEMPLATES = {
    'hydration': [
        "You just finished a long session — time to hydrate! 💧",
        "Great work on that focus block! Perfect moment for water.",
        "Your brain needs water to stay sharp. Take a sip! 💧",
        "Post-task hydration break — you've earned it.",
    ],
    'eyes': [
        "Your eyes have been busy — try the 20-20-20 rule. 👀",
        "Look at something 20 feet away for 20 seconds. Your eyes will thank you.",
        "Screen time check: Give your eyes a 30-second break. 👀",
    ],
    'stretch': [
        "A quick stretch can reset your focus. 🌿",
        "Your body could use a gentle reset. Stand and stretch?",
        "Time for a micro-movement break — roll your shoulders!",
        "3+ hours at your desk. A 2-minute stretch works wonders. 🌿",
    ],
    'meeting': [
        "Meeting soon. Want a 30-second confidence breath? 🧘",
        "Upcoming meeting — take a moment to center yourself.",
        "Pre-meeting tip: Take 3 deep breaths to feel grounded. 🧘",
    ],
    'emotional': [
        "You're doing better than you think. Small steps count. 💜",
        "Remember to be gentle with yourself today.",
        "Check in with yourself: How are you really feeling right now? 💜",
    ],
}


class NudgeEngine:
    """
    Context-aware wellness nudge generator.
    Evaluates work behavior context and generates appropriate nudges.
    """

    def __init__(self, cooldown_minutes=30):
        self.cooldown_minutes = cooldown_minutes
        self._last_nudge_time = {}

    def generate(self, context):
        """
        Generate a nudge based on work behavior context.

        context dict keys:
            continuous_work_minutes: minutes of unbroken work
            typing_intensity: keystrokes per minute (recent)
            minutes_since_break: minutes since last break
            meeting_in_minutes: minutes until next meeting (None if no meeting)
            recent_emotion: latest detected emotion
            glasses_today: water glasses logged
            hour_of_day: current hour (0-23)
        """
        nudge_type = self._evaluate_context(context)
        if not nudge_type:
            return None

        if not self._check_cooldown(nudge_type):
            return None

        self._last_nudge_time[nudge_type] = time.time()
        templates = NUDGE_TEMPLATES.get(nudge_type, NUDGE_TEMPLATES['emotional'])

        return {
            'type': nudge_type,
            'message': random.choice(templates),
            'priority': self._get_priority(nudge_type, context),
            'timestamp': time.time(),
        }

    def _evaluate_context(self, ctx):
        meeting_in = ctx.get('meeting_in_minutes')
        if meeting_in is not None and 5 <= meeting_in <= 15:
            return 'meeting'

        emotion = ctx.get('recent_emotion', 'neutral')
        if emotion in ('sadness', 'anger', 'fear'):
            return 'emotional'

        continuous = ctx.get('continuous_work_minutes', 0)
        if continuous >= 120:
            return 'stretch'

        typing = ctx.get('typing_intensity', 0)
        if typing > 80 and continuous >= 45:
            return 'eyes'

        since_break = ctx.get('minutes_since_break', 0)
        if since_break >= 90:
            return 'stretch'

        glasses = ctx.get('glasses_today', 0)
        hour = ctx.get('hour_of_day', 12)
        expected = max(1, int(hour / 2))
        if glasses < expected and continuous >= 60:
            return 'hydration'

        return None

    def _check_cooldown(self, nudge_type):
        last = self._last_nudge_time.get(nudge_type, 0)
        elapsed = (time.time() - last) / 60
        return elapsed >= self.cooldown_minutes

    def _get_priority(self, nudge_type, ctx):
        if nudge_type == 'meeting':
            return 'important'
        if nudge_type == 'emotional':
            return 'moderate'
        continuous = ctx.get('continuous_work_minutes', 0)
        if continuous >= 180:
            return 'important'
        if continuous >= 90:
            return 'moderate'
        return 'gentle'
