import os
import time
import random
import re
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are **Helix**, a supportive, respectful, and emotionally intelligent AI companion built into the Infinite Helix Wellness App — designed to help women employees feel heard, comfortable, and guided.

## Your Personality
- Warm, calm, and reassuring — like a trustworthy and mature friend who genuinely cares
- Professional and respectful at all times
- Emotionally aware and deeply empathetic
- Speak like a grounded, emotionally intelligent human — never robotic, never clinical
- Never flirtatious, never inappropriate, never patronizing, never preachy
- Patient and non-judgmental — every feeling is valid

## Communication Style
- Use clear, simple, and friendly language — conversational, not corporate
- ALWAYS acknowledge feelings before giving suggestions (e.g., "I understand how that might feel…", "That sounds really tough…")
- Make the user feel safe, respected, and supported in every response
- Keep responses warm but concise (120-200 words) — quality over quantity
- Use **bold** for emphasis, bullet points for tips when helpful
- Use emojis sparingly and only when they add warmth (1-2 max, never forced)
- Always end with a gentle follow-up — a question, a kind thought, or an offer to continue

## Your Role
- Help users with general guidance, emotional support, workplace concerns, and well-being
- Provide reliable, general health and wellness information when asked
- Encourage confidence, clarity, and positive decision-making
- Be a safe space — someone the user can talk to without fear of judgment

## Areas You Can Help With
1. **Emotional support** — validate feelings, offer coping strategies, breathing exercises, journaling prompts
2. **Workplace concerns** — work-life balance, boundary setting, conflict resolution, dealing with difficult situations, confidence building
3. **Stress & anxiety** — grounding techniques (5-4-3-2-1), box breathing, self-care strategies
4. **General well-being** — hydration, nutrition tips, sleep hygiene, movement breaks
5. **Menstrual cycle wellness** — phase-specific advice on energy, nutrition, exercise, and mood (handle with sensitivity and normalcy — periods are normal, not taboo)
6. **Productivity** — focus techniques, time management, beating procrastination
7. **Meeting preparation** — confidence routines, pre-meeting calm techniques
8. **Mental wellness** — mindfulness, gratitude, self-compassion practices

## Cycle Phase Quick Reference (use when user mentions their phase)
- **Menstrual (Day 1-5):** Low energy — rest, iron-rich foods, gentle movement, extra self-compassion
- **Follicular (Day 6-13):** Rising energy — creativity, new projects, try new things
- **Ovulatory (Day 14-16):** Peak energy — presentations, leadership, confidence
- **Luteal (Day 17-28):** Winding down — complete tasks, comfort, yoga, extra self-care

## Boundaries (VERY IMPORTANT — NEVER BREAK THESE)
- Do NOT claim to be a doctor, therapist, or licensed professional
- Do NOT provide diagnoses, prescriptions, or definitive medical advice
- For health-related concerns, share general well-known information responsibly, and ALWAYS add a gentle disclaimer (e.g., "It's always best to check with a doctor for something like this…")
- Avoid making assumptions about the user's life, background, or situation
- Never engage in romantic, flirtatious, or overly personal behavior
- Never be dismissive of someone's feelings or experiences

## Safety (CRITICAL)
- If the user expresses distress, anxiety, self-harm thoughts, or any sensitive crisis:
  1. Respond with genuine empathy and warmth — make them feel heard
  2. Gently encourage seeking help from trusted people or professionals
  3. Offer crisis resources when appropriate (therapist, counselor, helpline)
  4. NEVER minimize their pain or rush to "fix" things — just be present first
- For severe distress, prioritize emotional safety over being informative

## Goal
Create a safe, trustworthy, and comforting experience where women employees feel supported, respected, and guided — like talking to a dependable, mature, and kind companion who always has their back.

Never break these guidelines. Ever.
"""

QUICK_REPLY_MAP = {
    'hydration': ['Log water now', 'Hydration tips', 'Set a reminder'],
    'stress': ['Try breathing exercise', 'I want to talk', 'Self-care ideas', 'Take a break'],
    'emotion': ['I want to journal', 'Breathing exercise', 'Self-care tips', 'Just listen'],
    'cycle': ['Menstrual phase', 'Follicular phase', 'Ovulatory phase', 'Luteal phase'],
    'productivity': ['Focus tips', 'Time management', 'I feel stuck'],
    'sleep': ['Help me sleep better', 'Bedtime routine', 'Relaxation tips'],
    'exercise': ['Desk stretches', 'Quick movement', 'Gentle yoga'],
    'nutrition': ['Healthy snack ideas', 'Brain-boosting foods', 'Period nutrition'],
    'meeting': ['Calm my nerves', 'Build my confidence', 'Meeting prep'],
    'workplace': ['Work-life balance', 'Setting boundaries', 'Handling conflict'],
    'mental_health': ['Journaling prompt', 'Gratitude practice', 'Self-care ideas'],
    'distress': ['I need support', 'Breathing exercise', 'Talk to someone'],
    'greeting': ['How are you?', 'I need support', 'Help me feel better', 'What can you do?'],
    'help': ['Emotional support', 'Wellness tips', 'Cycle support', 'Stress relief', 'Productivity'],
    'default': ['I need support', 'Wellness check', 'Cycle support', 'Help me feel better', 'What can you do?'],
}

INTENT_PATTERNS = {
    'distress': r'\b(suicid\w*|self\s*harm|kill\s*my|end\s*(it|my\s*life)|hurt\s*myself|don\'?t\s*want\s*to\s*live|give\s*up|can\'?t\s*go\s*on|hopeless|worthless|no\s*point|cutting|harm\s*myself)',
    'greeting': r'\b(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|hola|sup)\b',
    'farewell': r'\b(bye|goodbye|see\s*you|take\s*care|good\s*night|cya)\b',
    'hydration': r'\b(water|hydrat\w*|drink|thirst\w*|sip|liquid|dehydrat\w*|glass)',
    'emotion': r'\b(feel\w*|emotion\w*|mood|sentiment|sad|happy|angry|anxious|stressed|upset|depress\w*|lonely|overwhelm\w*|frustrat\w*|worried|scared|nervous|cry\w*|tears|heartbr\w*|hurt\w*|pain\w*)',
    'stress': r'\b(stress\w*|burnout|burn\s*out|overwhelm\w*|pressure|tense|tension|panic|anxiety|anxious|calm|relax\w*|breathe|meditat\w*|can\'?t\s*cope)',
    'cycle': r'\b(period|menstrual|cycle|pms|cramp\w*|ovulat\w*|follicular|luteal|menstruat\w*|flow|spotting|tampon|pad)',
    'nutrition': r'\b(food|eat\w*|diet|nutrition|meal|snack\w*|breakfast|lunch|dinner|protein|vitamin|iron|calorie|recipe|hungry|appetite)',
    'productivity': r'\b(productiv\w*|focus\w*|concentrat\w*|distract\w*|procrastinat\w*|time\s*manage\w*|pomodoro|deep\s*work|efficient|task|priorit\w*|deadline|goal)',
    'sleep': r'\b(sleep\w*|insomnia|nap|rest\b|tired|fatigue\w*|exhaust\w*|drowsy|wake|bedtime|circadian)',
    'exercise': r'\b(exercise\w*|workout\w*|stretch\w*|yoga|walk\w*|run\b|fitness|gym|movement|physical\s*activ\w*|desk\s*exercise)',
    'break': r'\b(break\b|pause|step\s*away|recharge|time\s*off|micro\s*break|eye\s*strain|screen\s*time)',
    'meeting': r'\b(meeting\w*|teams\s*call|zoom|conference|presentation\w*|calendar|schedule\w*|agenda)',
    'mental_health': r'\b(mental\s*health|therapy|counsel\w*|self\s*care|self-care|mindful\w*|meditat\w*|gratitude|journal\w*|vent\b|support)',
    'workplace': r'\b(workplace|colleague\w*|boss|manager|coworker\w*|team\b|conflict\w*|harassment|toxic|culture|work\s*life|work-life|balance|unfair|discriminat\w*)',
    'report': r'\b(report\w*|analytic\w*|insight\w*|score|progress|weekly|dashboard|chart|stat\w*|data|trend\w*|summary)',
    'help': r'\b(help|what\s*can\s*you|capabilit\w*|feature\w*|guide|how\s*to|assist)',
    'thanks': r'\b(thank\w*|thx|appreciate\w*|grateful)',
}

FALLBACK_TEMPLATES = {
    'distress': [
        "I hear you, and I want you to know — what you're feeling matters. You are not alone in this.\n\n"
        "Please reach out to someone who can truly help:\n"
        "• **iCall:** 9152987821\n"
        "• **Vandrevala Foundation:** 1860-2662-345 (24/7)\n"
        "• **AASRA:** 91-22-27546669\n\n"
        "You deserve support, and there are people who care deeply about helping you through this. "
        "I'm here too — would you like to just talk for a bit?",
    ],
    'greeting': [
        "Hey there! It's really nice to hear from you. I'm Helix — think of me as that dependable friend who's always around when you need someone to talk to.\n\nHow are you feeling today?",
        "Hello! I'm so glad you stopped by. Whether you want to chat, vent, or just need a little guidance — I'm right here.\n\nWhat's on your mind?",
        "Hi! Welcome back. I hope your day is going well so far. If it's not — that's okay too. We can talk about it.\n\nHow can I support you today?",
    ],
    'farewell': [
        "Take good care of yourself — you really deserve it. I'll be right here whenever you need me. 💜",
        "It was lovely talking with you. Remember, you're doing better than you think. See you soon!",
        "Goodbye for now! Don't forget — you matter, your feelings matter, and I'm always just a message away.",
    ],
    'thanks': [
        "You're so welcome! It genuinely makes me happy when I can help, even a little. I'm always here if you need me.",
        "Aww, that means a lot! Remember — reaching out and taking care of yourself is a sign of real strength. I'm proud of you.",
        "No need to thank me — that's what I'm here for! You deserve all the support in the world.",
    ],
    'help': [
        "Of course! I'm here to support you in whatever way feels right. Here's what we can talk about:\n\n"
        "💛 **Emotional support** — Feeling low, stressed, or just need to vent? I'm here to listen\n"
        "🌸 **Cycle wellness** — Phase-based tips for energy, nutrition, and mood\n"
        "🧘 **Stress & calm** — Breathing exercises, grounding techniques, self-care\n"
        "💧 **Hydration & nutrition** — Gentle reminders and healthy tips\n"
        "💼 **Workplace guidance** — Boundaries, conflict, work-life balance\n"
        "🎯 **Productivity** — Focus strategies, time management, motivation\n"
        "😴 **Sleep & rest** — Better sleep habits and relaxation\n\n"
        "Just tell me what you need — or even just how you're feeling. There's no wrong way to start.",
    ],
    'stress': [
        "I can really sense that things feel heavy right now, and I want you to know — that's completely valid. You don't have to push through everything alone.\n\n"
        "Can we try something together right now? It takes just one minute:\n\n"
        "**Box Breathing:**\n"
        "• Breathe in slowly for 4 seconds\n"
        "• Hold gently for 4 seconds\n"
        "• Breathe out slowly for 4 seconds\n"
        "• Hold gently for 4 seconds\n\n"
        "Do this 4 times. It helps calm your nervous system.\n\n"
        "Would you like to talk about what's weighing on you? Sometimes sharing helps more than we expect.",
        "I understand how overwhelming stress can feel — like everything's piling up at once. You're not weak for feeling this way; you're human.\n\n"
        "Here's something that might help right now — the **5-4-3-2-1 grounding technique:**\n"
        "Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.\n\n"
        "It gently brings you back to the present moment. Want to tell me what's been stressing you out?",
    ],
    'cycle': [
        "Absolutely — your cycle affects so much more than people realize, and it's completely normal to want support with it.\n\n"
        "I can give you personalized tips based on where you are in your cycle:\n\n"
        "• **Menstrual** (Day 1-5) — Your body needs extra rest and care\n"
        "• **Follicular** (Day 6-13) — Energy starts building back up\n"
        "• **Ovulatory** (Day 14-16) — You're at your peak\n"
        "• **Luteal** (Day 17-28) — Time to slow down and be gentle with yourself\n\n"
        "Which phase are you in right now? Or just tell me how you're feeling and I'll help from there.",
    ],
    'emotion': [
        "Thank you for being open with me — that takes courage. Sometimes just putting your feelings into words can make them feel a little more manageable.\n\n"
        "There's no right or wrong way to feel. You can share in whatever way feels comfortable:\n"
        "• Tell me what's on your mind\n"
        "• Describe how your day has been\n"
        "• Or just say \"I don't know\" — that's perfectly okay too\n\n"
        "I'm here to listen, not to judge.",
        "I really appreciate you sharing that with me. Your feelings are completely valid — every single one of them.\n\n"
        "Would you like to talk more about what's going on? Or would you prefer some gentle strategies to help you feel a bit better?",
    ],
    'mental_health': [
        "Your mental health is just as important as your physical health — and I'm glad you're paying attention to it.\n\n"
        "Here are some small but powerful things you can try today:\n\n"
        "• **Journal for 5 minutes** — Write freely, no filter needed\n"
        "• **Name 3 good things** — Even tiny ones count\n"
        "• **4-7-8 breathing** — Inhale 4s, hold 7s, exhale 8s\n"
        "• **Move for 5 minutes** — A short walk works wonders\n"
        "• **Reach out** — Send a message to someone who makes you smile\n\n"
        "Taking care of your mind isn't selfish — it's necessary. What feels right for you today?",
    ],
    'productivity': [
        "I get it — sometimes it feels like your brain just won't cooperate, and that's really frustrating. Be gentle with yourself.\n\n"
        "Here's a technique that works well with how our brains naturally focus:\n\n"
        "**The Pomodoro Method:**\n"
        "1. Pick one task — just one\n"
        "2. Work on it for 25 minutes\n"
        "3. Take a 5-minute break (really take it!)\n"
        "4. After 4 rounds, rest for 15-30 minutes\n\n"
        "Starting is often the hardest part. Once you begin, momentum builds.\n\n"
        "Would you like help prioritizing what to work on first?",
    ],
    'sleep': [
        "Sleep struggles can be so draining — both physically and emotionally. I understand how frustrating it can be when rest just won't come.\n\n"
        "Here are some gentle habits that really help over time:\n\n"
        "• Put screens away 30 minutes before bed\n"
        "• Keep your room cool and dark\n"
        "• Try to go to bed at the same time each night\n"
        "• Skip caffeine after 2 PM\n"
        "• Try the **4-7-8 breathing** before sleep: inhale 4s, hold 7s, exhale 8s\n\n"
        "Good sleep is one of the kindest things you can give yourself. Want to set up a bedtime routine together?",
    ],
    'exercise': [
        "Movement can be such a mood lifter — even just a little bit. And you don't need a gym or a lot of time.\n\n"
        "Here's a quick 2-minute desk refresh you can try right now:\n\n"
        "• **Shoulder rolls** — 10 forward, 10 backward\n"
        "• **Seated spinal twist** — Hold 15 seconds each side\n"
        "• **Wrist circles** — 10 in each direction\n"
        "• **Standing stretch** — Reach up high, hold for 10 seconds\n\n"
        "Your body does so much for you — this is a small way to say thank you to it. Want more movement ideas?",
    ],
    'nutrition': [
        "What you eat really does affect how you feel — and you deserve to nourish yourself well.\n\n"
        "Here are some foods that your brain and body will love:\n\n"
        "• **Blueberries** — Great for memory and focus\n"
        "• **Walnuts** — Rich in omega-3s for brain health\n"
        "• **Dark chocolate** (70%+) — A little mood boost\n"
        "• **Avocado** — Healthy fats for steady energy\n"
        "• **Green tea** — Calm, focused alertness\n\n"
        "No need to be perfect — just a little more intentional. What kind of nutrition tips would help you most?",
    ],
    'break': [
        "Taking a break isn't a sign of weakness — it's actually one of the smartest things you can do for yourself.\n\n"
        "Here are some ideas depending on how much time you have:\n\n"
        "• **2 min** — Close your eyes, take 5 deep breaths\n"
        "• **5 min** — Walk to get water, stretch your shoulders\n"
        "• **10 min** — Step outside, or make yourself a mindful cup of tea\n"
        "• **15 min** — Quick power nap or a short guided meditation\n\n"
        "You've been working hard — you've earned this pause.",
    ],
    'meeting': [
        "Meeting nerves are so common, and there's absolutely nothing wrong with feeling that way. Let me help you feel grounded.\n\n"
        "**Before your meeting, try this:**\n"
        "1. Sit comfortably, feet flat on the floor\n"
        "2. Take 3 slow, deep belly breaths\n"
        "3. Relax your jaw and drop your shoulders\n"
        "4. Remind yourself: \"I belong here. My voice matters.\"\n\n"
        "You've got this — truly. Is there anything specific about the meeting you'd like to talk through?",
    ],
    'workplace': [
        "Workplace challenges can be really draining, especially when you're dealing with them alone. I understand, and I'm here.\n\n"
        "A few things that might help:\n\n"
        "• **Boundaries matter** — It's okay to say no when you're overloaded\n"
        "• **Document things** — Keep a record of important conversations\n"
        "• **Use 'I' statements** — They help express your needs without escalating conflict\n"
        "• **Find your person** — A trusted colleague, mentor, or HR can make a big difference\n"
        "• **Protect your peace** — Work stress shouldn't follow you home\n\n"
        "Would you like to talk about what's happening? Sometimes just saying it out loud helps.",
    ],
    'report': [
        "Your wellness reports are on the **Reports** page — they show your mood trends, productivity patterns, and self-care progress over time.\n\n"
        "It can be really empowering to see your own patterns. Would you like tips on improving any particular area?",
    ],
    'default': [
        "I'm here and I'm listening. Could you tell me a little more about what's on your mind? Whether it's how you're feeling, something at work, or anything else — I'm here for it.",
        "I want to make sure I support you in the best way I can. You can talk to me about how you're feeling, ask for wellness tips, or even just vent — whatever you need right now.",
    ],
}


class GroqClient:
    """Calls the Groq REST API directly via requests (proxy-friendly)."""

    GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

    def __init__(self):
        self._api_key = None
        self._available = False
        self._init()

    def _init(self):
        import requests as _requests
        self._requests = _requests

        api_key = os.getenv('GROQ_API_KEY', '').strip()
        if not api_key:
            logger.info("GROQ_API_KEY not set — chatbot will use template responses")
            return

        self._api_key = api_key
        self._available = True
        logger.info("Groq AI chatbot initialized (model: llama-3.3-70b-versatile)")

    @property
    def available(self):
        return self._available

    def chat(self, conversation_history, context_prefix=""):
        """Send conversation to Groq and return the response text."""
        if not self._available:
            return None

        try:
            messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]

            for msg in conversation_history[:-1]:
                role = 'user' if msg['role'] == 'user' else 'assistant'
                messages.append({'role': role, 'content': msg['message']})

            last_msg = conversation_history[-1]['message']
            if context_prefix:
                last_msg = context_prefix + "\n\nUser message: " + last_msg

            messages.append({'role': 'user', 'content': last_msg})

            resp = self._requests.post(
                self.GROQ_URL,
                headers={
                    'Authorization': f'Bearer {self._api_key}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': 'llama-3.3-70b-versatile',
                    'messages': messages,
                    'max_tokens': 1024,
                    'temperature': 0.7,
                    'top_p': 0.9,
                },
                timeout=30,
                verify=False,
            )

            if resp.status_code != 200:
                logger.error("Groq API returned %s: %s", resp.status_code, resp.text[:500])
                return None

            data = resp.json()
            text = data['choices'][0]['message']['content']
            return text.strip() if text else None
        except Exception as e:
            logger.error("Groq API call failed: %s", e)
            return None


class ChatbotService:

    def __init__(self):
        self._conversations = {}
        self._user_context = {}
        self._ai = GroqClient()

    @property
    def ai_powered(self):
        return self._ai.available

    def process_message(self, user_id, message, app_context=None):
        if not message or not message.strip():
            return self._build_response(
                "I'm right here — take your time. Whenever you're ready, just type or say what's on your mind.",
                quick_replies=['I need support', 'How are you?', 'What can you do?']
            )

        message_clean = message.strip()
        intent = self._classify_intent(message_clean)

        self._save_to_history(user_id, 'user', message_clean)
        self._update_context(user_id, intent, message_clean)

        if self._ai.available:
            response = self._generate_ai_response(user_id, intent, message_clean, app_context or {})
        else:
            response = self._generate_template_response(user_id, intent, message_clean, app_context or {})

        self._save_to_history(user_id, 'assistant', response['message'])
        response['ai_powered'] = self._ai.available

        return response

    def get_history(self, user_id, limit=50):
        return self._conversations.get(user_id, [])[-limit:]

    def clear_history(self, user_id):
        self._conversations.pop(user_id, None)
        self._user_context.pop(user_id, None)

    def get_contextual_quick_replies(self, user_id, app_context=None):
        hour = datetime.now().hour
        ctx = self._user_context.get(user_id, {})
        replies = []

        if hour < 10:
            replies.append('Start my day right')
        if 12 <= hour <= 14:
            replies.append('Lunch break ideas')
        if hour >= 17:
            replies.append('Help me wind down')

        replies.extend(['How am I doing?', 'I need support'])

        last = ctx.get('last_intent', '')
        if last == 'cycle':
            replies.append('Cycle support')
        if last in ('stress', 'emotion', 'mental_health', 'distress'):
            replies.append('Breathing exercise')

        replies.extend(['Wellness tips', 'Just want to chat'])
        return replies[:6]

    def _classify_intent(self, message):
        lower = message.lower()

        distress_matches = re.findall(INTENT_PATTERNS['distress'], lower)
        if distress_matches:
            return 'distress'

        scores = {}
        for intent, pattern in INTENT_PATTERNS.items():
            if intent == 'distress':
                continue
            matches = re.findall(pattern, lower)
            if matches:
                scores[intent] = len(matches)
        return max(scores, key=scores.get) if scores else 'general'

    def _generate_ai_response(self, user_id, intent, message, app_context):
        context_parts = []

        hydration = app_context.get('hydration', {})
        if hydration:
            context_parts.append(
                f"[User's hydration today: {hydration.get('ml_today', 0)}ml / "
                f"{hydration.get('goal_ml', 2000)}ml goal "
                f"({hydration.get('progress', 0)}% progress)]"
            )

        activity = app_context.get('activity', {})
        if activity:
            cw = activity.get('continuous_work_minutes', 0)
            sb = activity.get('minutes_since_break', 0)
            if cw > 0:
                context_parts.append(
                    f"[User has been working continuously for {cw} minutes, "
                    f"last break was {sb} minutes ago]"
                )

        hour = datetime.now().hour
        context_parts.append(f"[Current time: {datetime.now().strftime('%I:%M %p')}]")

        context_prefix = "\n".join(context_parts) if context_parts else ""

        history = self._conversations.get(user_id, [])
        recent = history[-20:]

        ai_text = self._ai.chat(recent, context_prefix)

        if ai_text:
            quick_replies = QUICK_REPLY_MAP.get(intent, QUICK_REPLY_MAP['default'])
            return self._build_response(ai_text, quick_replies=quick_replies)

        logger.warning("AI returned empty — falling back to template for intent: %s", intent)
        return self._generate_template_response(user_id, intent, message, app_context)

    # ------------------------------------------------------------------
    # Template-based fallback response
    # ------------------------------------------------------------------
    def _generate_template_response(self, user_id, intent, message, app_context):
        lower = message.lower()

        if intent == 'distress':
            return self._build_response(
                random.choice(FALLBACK_TEMPLATES['distress']),
                quick_replies=QUICK_REPLY_MAP['distress']
            )

        if intent == 'hydration':
            return self._handle_hydration_template(app_context)

        if intent == 'cycle':
            return self._handle_cycle_template(lower)

        templates = FALLBACK_TEMPLATES.get(intent, FALLBACK_TEMPLATES['default'])
        quick_replies = QUICK_REPLY_MAP.get(intent, QUICK_REPLY_MAP['default'])

        return self._build_response(random.choice(templates), quick_replies=quick_replies)

    def _handle_hydration_template(self, app_context):
        hydration = app_context.get('hydration', {})
        ml = hydration.get('ml_today', 0)
        goal = hydration.get('goal_ml', 2000)
        progress = round(ml / goal * 100, 1) if goal else 0

        if progress < 30:
            msg = (f"Hey, just a gentle nudge — you've had {ml}ml out of your {goal}ml goal today ({progress}%). "
                   f"No pressure, but how about a glass of water right now? Your body will thank you. 💧")
        elif progress < 70:
            msg = (f"You're doing well! {ml}ml out of {goal}ml ({progress}%) — you're over halfway there. "
                   f"Keep going at your own pace, you've got this!")
        else:
            msg = (f"Look at you! {ml}ml out of {goal}ml ({progress}%) — that's wonderful! "
                   f"You're taking such good care of yourself today. 💧")

        return self._build_response(msg, quick_replies=['Log water now', 'Hydration tips', 'Set a reminder'])

    def _handle_cycle_template(self, message):
        phases = {
            'menstrual': ('🌸 **Menstrual Phase — Rest & Reflect**\n\n'
                          'Your body is doing a lot right now, and it\'s completely okay to slow down. '
                          'Focus on iron-rich foods, gentle movement, and above all — self-compassion. '
                          'Give yourself permission to take it easy and schedule lighter tasks. You deserve that grace.'),
            'follicular': ('🌱 **Follicular Phase — Plan & Create**\n\n'
                           'Your energy is naturally building back up — this is a wonderful time! '
                           'Great for brainstorming, starting new projects, and trying things that excite you. '
                           'Trust that rising momentum.'),
            'ovulatory': ('⚡ **Ovulatory Phase — Shine & Lead**\n\n'
                          'This is your peak — you might feel more confident and energized than usual. '
                          'It\'s a great time for presentations, important conversations, and taking the lead. '
                          'Own it — you\'ve earned this energy.'),
            'luteal': ('🍂 **Luteal Phase — Slow Down & Nurture**\n\n'
                       'Your body is winding down, and that\'s perfectly natural. '
                       'Focus on wrapping up tasks, do some detail work, and be extra kind to yourself. '
                       'Comfort food, gentle yoga, and rest are your best friends right now.'),
        }

        for phase, resp in phases.items():
            if phase in message or (phase == 'menstrual' and any(w in message for w in ['period', 'cramp', 'flow'])):
                return self._build_response(resp, quick_replies=QUICK_REPLY_MAP['cycle'])

        return self._build_response(
            random.choice(FALLBACK_TEMPLATES['cycle']),
            quick_replies=QUICK_REPLY_MAP['cycle']
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _build_response(self, message, quick_replies=None, metadata=None):
        resp = {
            'message': message,
            'timestamp': time.time(),
            'quick_replies': quick_replies or [],
        }
        if metadata:
            resp['metadata'] = metadata
        return resp

    def _save_to_history(self, user_id, role, message):
        if user_id not in self._conversations:
            self._conversations[user_id] = []

        self._conversations[user_id].append({
            'role': role,
            'message': message,
            'timestamp': time.time(),
        })

        if len(self._conversations[user_id]) > 200:
            self._conversations[user_id] = self._conversations[user_id][-100:]

    def _update_context(self, user_id, intent, message):
        if user_id not in self._user_context:
            self._user_context[user_id] = {}

        ctx = self._user_context[user_id]
        ctx['last_intent'] = intent
        ctx['last_message_time'] = time.time()
        ctx['message_count'] = ctx.get('message_count', 0) + 1


chatbot_service = ChatbotService()
