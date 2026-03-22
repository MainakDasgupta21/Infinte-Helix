import time
import random

NUDGE_TEMPLATES = {
    'hydration': [
        "You've had 0 glasses of water today. Are you a cactus? Drink up.",
        "Your skin is literally begging you. Water. Now. Please.",
        "Coffee is not water. Tea is not water. WATER is water. Go drink it.",
        "You logged so many keystrokes today and zero sips of water. Incredible behaviour.",
        "Headache coming? Tired for no reason? Yeah that's dehydration, bestie.",
        "Your body is 60% water and right now that percentage is dropping. Hydrate.",
        "We checked your water intake. It's giving desert vibes. Drink something.",
    ],
    'eyes': [
        "You've been staring at this screen so long your eyes are basically crying for help.",
        "Look away from the screen for 20 seconds. Yes, right now. We'll wait.",
        "Your eyes are not monitors. They need rest. Look at a wall. A plant. Anything but this.",
        "20-20-20 rule \u2014 every 20 mins, look 20 feet away for 20 seconds. Do it or your future self will be very annoyed.",
        "Quick eye break! Stare at something far away. No, the other monitor doesn't count.",
        "Your eyes just filed a formal complaint. Please look at literally anything else for 20 seconds.",
    ],
    'stretch': [
        "You've been sitting for so long your back already hates you. Don't make it worse.",
        "Stand up. Stretch. You're not a statue even though you've been sitting like one.",
        "The work will still be there after 5 minutes. Your spine however might not be.",
        "Break time! And no, switching tabs doesn't count as a break.",
        "Your chair misses the shape of someone who takes breaks. Go walk.",
        "Are you slouching right now? You absolutely are. Stand up and stretch.",
        "Chin up. Shoulders back. You're a professional, not a question mark.",
        "Future you is going to have serious back problems if present you doesn't move. Fix it.",
    ],
    'posture': [
        "Are you slouching right now? You absolutely are. Sit up straight.",
        "Your posture is sending us concerns. Roll your shoulders back immediately.",
        "Future you is going to have serious back problems if present you doesn't sit properly. Fix it.",
        "Chin up. Shoulders back. You're a professional, not a question mark.",
    ],
    'meeting': [
        "Meeting soon. Want a 30-second confidence breath?",
        "Upcoming meeting \u2014 take a moment to center yourself. You've got this.",
        "Pre-meeting tip: Take 3 deep breaths. Walk in calm, walk out victorious.",
        "Meeting in a few. Quick \u2014 unclench your jaw, drop your shoulders, breathe. Now go crush it.",
    ],
    'emotional': [
        "Okay deep breath. Whatever just happened \u2014 you've survived 100% of your bad days so far. Pretty good record.",
        "Frustration detected. Step away for 3 minutes. The problem will look different when you come back. Probably.",
        "You typed that very aggressively. Tea? Walk? Screaming into a pillow? All valid options.",
        "Remember to be gentle with yourself today. You're doing more than you think.",
        "Check in with yourself: How are you really feeling right now? It's okay to not be okay.",
        "Small steps count. You're doing better than you think. We mean it.",
    ],
    'winddown': [
        "It's past 7pm and you're STILL working. The laptop will survive without you. LOG OFF.",
        "Sending this with love \u2014 close the tabs. The work is not going anywhere. You however need sleep.",
        "Your brain worked hard today. Feed it dinner, rest and zero screens for one hour.",
        "You started at 9am. It is now evening. Even Beyonc\u00e9 sleeps. Please log off.",
    ],
    'morning': [
        "Good morning! Hope you slept and didn't just close your eyes for 4 hours thinking about deadlines.",
        "New day, new chance to drink water, take breaks and pretend you have work-life balance.",
        "You've got this. Also please eat breakfast this time.",
    ],
    'streak': [
        "Wellness streak going strong! You actually drank water AND took breaks. We're proud and honestly shocked.",
        "You hit your hydration goal today. This is not sarcasm \u2014 we're genuinely impressed.",
        "Full break balance today! Your spine thanks you. Your eyes thank you. We thank you.",
        "Look at you being all healthy and consistent. Who even are you? Keep it up.",
    ],
}


class NudgeEngine:
    """
    Context-aware wellness nudge generator with fun roasting-style messages.
    Evaluates work behavior context and generates appropriate nudges.
    """

    def __init__(self, cooldown_minutes=15):
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
            ml_today: water intake logged in milliliters
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
        hour = ctx.get('hour_of_day', 12)

        # Wind-down nudge for late evening
        if hour >= 20:
            continuous = ctx.get('continuous_work_minutes', 0)
            if continuous >= 30:
                return 'winddown'

        # Morning greeting
        if hour < 9:
            continuous = ctx.get('continuous_work_minutes', 0)
            if continuous < 5:
                return 'morning'

        meeting_in = ctx.get('meeting_in_minutes')
        if meeting_in is not None and 5 <= meeting_in <= 15:
            return 'meeting'

        emotion = ctx.get('recent_emotion', 'neutral')
        if emotion in ('sadness', 'anger', 'fear'):
            return 'emotional'

        continuous = ctx.get('continuous_work_minutes', 0)

        # Posture check after long sitting
        if continuous >= 90:
            if random.random() < 0.3:
                return 'posture'
            return 'stretch'

        if continuous >= 60:
            return 'stretch'

        typing = ctx.get('typing_intensity', 0)
        if typing > 30 and continuous >= 25:
            return 'eyes'

        since_break = ctx.get('minutes_since_break', 0)
        if since_break >= 45:
            return 'stretch'

        ml_today = ctx.get('ml_today', 0)
        expected_ml = max(250, int(hour / 3 * 250))
        if ml_today < expected_ml and continuous >= 20:
            return 'hydration'

        return None

    def _check_cooldown(self, nudge_type):
        last = self._last_nudge_time.get(nudge_type, 0)
        elapsed = (time.time() - last) / 60
        return elapsed >= self.cooldown_minutes

    def _get_priority(self, nudge_type, ctx):
        if nudge_type in ('meeting', 'winddown'):
            return 'important'
        if nudge_type == 'emotional':
            return 'moderate'
        continuous = ctx.get('continuous_work_minutes', 0)
        if continuous >= 180:
            return 'important'
        if continuous >= 90:
            return 'moderate'
        return 'gentle'
