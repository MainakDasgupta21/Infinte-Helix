import random
import re

# ── Topic detection (runs 100% locally, no API calls) ──

TOPIC_KEYWORDS = {
    'work': ['work', 'office', 'boss', 'meeting', 'deadline', 'project', 'task', 'job', 'colleague', 'email', 'presentation', 'client', 'workload', 'promotion', 'salary'],
    'family': ['family', 'mom', 'dad', 'parent', 'brother', 'sister', 'son', 'daughter', 'husband', 'wife', 'kids', 'children', 'baby', 'home', 'marriage'],
    'social': ['friend', 'people', 'party', 'hangout', 'lonely', 'alone', 'relationship', 'date', 'partner', 'love', 'breakup', 'fight', 'argument', 'social'],
    'health': ['sick', 'pain', 'headache', 'tired', 'sleep', 'insomnia', 'exercise', 'gym', 'doctor', 'medicine', 'health', 'body', 'weight', 'eating', 'diet'],
    'study': ['study', 'exam', 'school', 'college', 'university', 'homework', 'assignment', 'grade', 'class', 'learn', 'course', 'teacher', 'professor'],
    'money': ['money', 'bill', 'rent', 'debt', 'loan', 'save', 'spend', 'expensive', 'budget', 'financial', 'payment', 'broke'],
    'nature': ['garden', 'park', 'walk', 'outside', 'nature', 'sun', 'rain', 'tree', 'flower', 'fresh air', 'beach', 'mountain', 'river', 'sky'],
    'creative': ['music', 'song', 'paint', 'draw', 'write', 'cook', 'bake', 'craft', 'art', 'dance', 'play', 'game', 'read', 'book', 'movie', 'film'],
    'planning': ['plan', 'todo', 'list', 'busy', 'schedule', 'organize', 'prepare', 'lot to do', 'things to do', 'goals', 'tomorrow', 'weekend'],
    'achievement': ['accomplished', 'finished', 'completed', 'proud', 'won', 'success', 'did it', 'achieved', 'milestone', 'promoted', 'passed'],
}

TOPIC_TIPS = {
    'work': [
        {'icon': 'goal', 'title': 'Pomodoro Focus', 'text': 'Work in 25-minute bursts with 5-minute breaks. This prevents burnout and keeps your brain sharp.'},
        {'icon': 'boundary', 'title': 'Set Work Boundaries', 'text': "Close your laptop at a fixed time today. Work will always expand to fill the time you give it — so don't give it all your time."},
        {'icon': 'breathe', 'title': 'Desk Reset', 'text': 'Push back from your desk, close your eyes, and take 5 deep breaths. Even 30 seconds of reset prevents mental fatigue.'},
        {'icon': 'journal', 'title': 'Priority Matrix', 'text': 'Write down your top 3 tasks for today. Cross off the rest — not everything urgent is important.'},
        {'icon': 'move', 'title': 'Walk Break', 'text': 'Take a 5-minute walk between tasks. Physical movement helps your brain switch contexts and stay creative.'},
    ],
    'family': [
        {'icon': 'social', 'title': 'Be Fully Present', 'text': 'Put your phone away for the next 30 minutes with your family. Undivided attention is the greatest gift.'},
        {'icon': 'comfort', 'title': 'Small Gesture', 'text': "Do one small thing for a family member today — make their tea, leave a note, give a hug. Small acts build big bonds."},
        {'icon': 'journal', 'title': 'Memory Capture', 'text': 'Write down one family moment from today you want to remember. These become treasures later.'},
        {'icon': 'goal', 'title': 'Plan Together', 'text': "Ask your family: 'What should we do this weekend?' Shared planning creates shared excitement."},
    ],
    'social': [
        {'icon': 'social', 'title': 'Reach Out First', 'text': "Don't wait for others to text. Send one message to someone you've been thinking about — it'll make both your days."},
        {'icon': 'comfort', 'title': 'Quality Over Quantity', 'text': 'One deep conversation is worth more than 10 shallow ones. Ask someone "how are you really doing?"'},
        {'icon': 'boundary', 'title': 'Protect Your Energy', 'text': "It's okay to say no to plans that drain you. Choose connections that fill your cup, not empty it."},
    ],
    'health': [
        {'icon': 'move', 'title': 'Gentle Movement', 'text': "You don't need a gym session. A 10-minute walk, some stretches, or even dancing in your room counts."},
        {'icon': 'comfort', 'title': 'Rest is Productive', 'text': 'Your body is talking — listen to it. Rest now so you can show up stronger tomorrow.'},
        {'icon': 'breathe', 'title': 'Body Scan', 'text': 'Close your eyes and scan from head to toe. Notice where you hold tension. Breathe into those spots.'},
        {'icon': 'goal', 'title': 'Hydration Check', 'text': 'Drink a full glass of water right now. Dehydration causes fatigue, headaches, and brain fog.'},
    ],
    'study': [
        {'icon': 'goal', 'title': 'Chunk It Down', 'text': "Break your study into 20-minute blocks. Your brain absorbs more in short focused sessions than long grinding ones."},
        {'icon': 'move', 'title': 'Study Break Movement', 'text': 'After each study session, do 10 jumping jacks or walk around. Physical breaks improve memory retention.'},
        {'icon': 'journal', 'title': 'Teach It Back', 'text': "Explain what you learned out loud as if teaching someone. If you can't explain it simply, you don't understand it yet."},
        {'icon': 'comfort', 'title': 'Reward Yourself', 'text': 'Set a small reward for after studying — a snack, a show episode, a walk. Your brain works better with something to look forward to.'},
    ],
    'money': [
        {'icon': 'journal', 'title': 'Write It Down', 'text': 'List your 3 biggest expenses this week. Awareness alone reduces unnecessary spending by 20%.'},
        {'icon': 'goal', 'title': 'One Small Save', 'text': 'Skip one non-essential purchase today. Small daily saves compound into big relief over time.'},
        {'icon': 'breathe', 'title': 'Financial Anxiety Reset', 'text': "Money stress triggers survival mode in your brain. Take 3 deep breaths — you can't make good financial decisions in panic mode."},
    ],
    'nature': [
        {'icon': 'comfort', 'title': 'Mindful Observation', 'text': 'Pick one thing in nature — a leaf, a cloud, a flower — and really look at it for 30 seconds. This is instant meditation.'},
        {'icon': 'breathe', 'title': 'Fresh Air Breathing', 'text': 'Take 5 deep breaths of fresh air. Outdoor air has more oxygen and negative ions that naturally boost your mood.'},
        {'icon': 'move', 'title': 'Barefoot Grounding', 'text': 'If you can, take your shoes off on grass for a few minutes. Grounding reduces cortisol and inflammation.'},
        {'icon': 'journal', 'title': 'Nature Gratitude', 'text': "Notice 3 beautiful things around you right now. Nature's beauty is free therapy — don't walk past it."},
    ],
    'creative': [
        {'icon': 'goal', 'title': 'Create for 10 Minutes', 'text': "Don't wait for inspiration. Set a timer for 10 minutes and just start. Motivation follows action, not the other way around."},
        {'icon': 'comfort', 'title': 'Enjoy the Process', 'text': "Not everything you create needs to be good. Let yourself make something messy, silly, or imperfect — that's where the joy lives."},
        {'icon': 'social', 'title': 'Share Your Work', 'text': 'Show someone what you created, even if it feels unfinished. Sharing creative work builds confidence and connection.'},
    ],
    'planning': [
        {'icon': 'goal', 'title': 'Top 3 Only', 'text': "Pick your 3 most important tasks. Everything else is bonus. You can't do everything, but you can nail the things that matter."},
        {'icon': 'breathe', 'title': 'Overwhelm Reset', 'text': "Feeling overwhelmed by your list? Close your eyes, take 3 breaths, and ask: 'What's the ONE thing I should do first?'"},
        {'icon': 'journal', 'title': 'Brain Dump', 'text': 'Write everything in your head onto paper — every task, worry, idea. Getting it out of your head frees up mental RAM.'},
        {'icon': 'comfort', 'title': 'Buffer Time', 'text': "Don't schedule every minute. Leave gaps between tasks. Buffer time reduces stress and accounts for things taking longer than expected."},
    ],
    'achievement': [
        {'icon': 'journal', 'title': 'Document the Win', 'text': 'Write down exactly what you achieved and how it felt. On tough days, reading this will remind you what you are capable of.'},
        {'icon': 'social', 'title': 'Celebrate Out Loud', 'text': "Tell someone about your win. You earned it — don't downplay it. Sharing success reinforces it in your brain."},
        {'icon': 'comfort', 'title': 'Reward Yourself', 'text': 'Do something nice for yourself today. Your brain needs rewards to stay motivated for the next challenge.'},
    ],
}

# ── Emotion-based base advice ──

EMOTION_ADVICE = {
    'joy': {
        'headings': ['Keep the momentum going!', 'Ride this wave of joy!', "This is your day — own it!", "You're glowing — keep it up!"],
        'insights': [
            "You're in a great headspace. Positive emotions boost creativity and resilience — let's channel this energy.",
            "Joy is contagious and powerful. This is the perfect time to take action on things that matter to you.",
            "Your positive energy right now is a resource — use it to build something, connect with someone, or simply enjoy the moment.",
        ],
        'tips': [
            {'icon': 'journal', 'title': 'Gratitude Anchor', 'text': 'Write down 3 things you\'re grateful for. Revisiting this list on harder days can lift your mood.'},
            {'icon': 'social', 'title': 'Share the Joy', 'text': 'Reach out to someone you care about. Sharing positive moments doubles the happiness.'},
            {'icon': 'goal', 'title': 'Ride the Wave', 'text': 'Tackle a task you\'ve been postponing. Positive moods make challenging work feel manageable.'},
        ],
        'quick_actions': [
            {'label': 'Try this now', 'text': 'Set one small goal for today and knock it out while your energy is high.'},
            {'label': 'Right now', 'text': 'Text someone you care about and tell them something you appreciate about them.'},
            {'label': 'Do this', 'text': 'Take a deep breath, smile, and mentally bookmark this feeling. You can come back to it later.'},
        ],
        'affirmations': [
            'You deserve this good feeling. Let it fuel you forward.',
            'Happiness isn\'t luck — it\'s the reward for being present. You earned this.',
            'Your joy matters. Don\'t rush past it.',
        ],
    },
    'sadness': {
        'headings': ["It's okay to not be okay", 'This heaviness will lift', "Your feelings are valid", "Be gentle with yourself today"],
        'insights': [
            'Sadness is a signal, not a flaw. It means something matters deeply to you.',
            "What you're feeling right now is temporary, even though it doesn't feel that way. Give yourself permission to feel it.",
            'Acknowledging sadness is brave. Most people push it down — you\'re processing it, and that takes strength.',
        ],
        'tips': [
            {'icon': 'breathe', 'title': '4-7-8 Breathing', 'text': 'Breathe in for 4 seconds, hold for 7, exhale for 8. Repeat 3 times. This activates your calm nervous system.'},
            {'icon': 'move', 'title': 'Gentle Movement', 'text': 'A 10-minute walk outside can shift your brain chemistry. Even stretching helps break the heaviness.'},
            {'icon': 'social', 'title': 'Reach Out', 'text': "Even texting \"hey\" to a friend reminds you you're not alone. You don't have to explain everything."},
            {'icon': 'comfort', 'title': 'Comfort Routine', 'text': 'Make a warm drink, wrap up in a blanket, or listen to a soothing song. Small comforts add up.'},
        ],
        'quick_actions': [
            {'label': 'Do this right now', 'text': 'Place your hand on your chest, take 3 slow breaths, and say "This feeling will pass."'},
            {'label': 'Try this', 'text': 'Stand up, stretch your arms overhead, and take one deep breath. Physical movement interrupts emotional spirals.'},
            {'label': 'Right now', 'text': 'Name your feeling out loud: "I feel sad because..." Just saying it reduces its power over you.'},
        ],
        'affirmations': [
            "Being sad doesn't mean you're weak. It means you're human and you feel deeply.",
            "You've survived every bad day so far. This one is no different.",
            "It's okay to rest. You don't have to be strong every minute of every day.",
        ],
    },
    'anger': {
        'headings': ["Your anger is valid", "Let's channel this energy", "You have every right to feel this", "Anger is a messenger — listen"],
        'insights': [
            'Anger often masks hurt, frustration, or unmet needs. Understanding the trigger helps you respond instead of react.',
            "What you're feeling is powerful energy. The goal isn't to suppress it — it's to direct it somewhere useful.",
            'Anger means a boundary was crossed. That awareness is actually a good thing.',
        ],
        'tips': [
            {'icon': 'breathe', 'title': 'Cool-Down Breath', 'text': 'Breathe in for 4 counts, out for 6. Longer exhales signal your brain to stand down from fight mode.'},
            {'icon': 'move', 'title': 'Physical Release', 'text': 'Do 20 jumping jacks or scrub something clean. Moving your body metabolizes the adrenaline.'},
            {'icon': 'journal', 'title': 'Name the Trigger', 'text': 'Write: "I feel angry because ___." Moving it to words moves it from emotional brain to logical brain.'},
            {'icon': 'boundary', 'title': 'Set a Boundary', 'text': "If something keeps triggering you, it's time to say no or step back. Boundaries protect your peace."},
        ],
        'quick_actions': [
            {'label': 'Try this immediately', 'text': 'Splash cold water on your face. The cold triggers a dive reflex that slows your heart rate instantly.'},
            {'label': 'Do this now', 'text': 'Clench your fists tight for 5 seconds, then release. Feel the tension leave. Repeat 3 times.'},
            {'label': 'Right now', 'text': 'Count backwards from 10 slowly. This engages your logical brain and interrupts the anger loop.'},
        ],
        'affirmations': [
            'Your anger is telling you something important. Listen to it, then choose wisely.',
            "Feeling angry doesn't make you a bad person. What you do with it is what matters.",
            'You are allowed to be upset. You are also allowed to let it go when you are ready.',
        ],
    },
    'fear': {
        'headings': ["Fear means you care", "You are safer than you think", "Courage lives right here", "Breathe — you've got this"],
        'insights': [
            "Anxiety activates your body's alarm system. The goal isn't to eliminate fear but to regulate it so it doesn't control you.",
            "Your brain is trying to protect you, but it's overestimating the danger. Let's bring it back to reality.",
            "Fear and excitement are almost the same feeling. The difference is the story you tell yourself about it.",
        ],
        'tips': [
            {'icon': 'breathe', 'title': 'Grounding 5-4-3-2-1', 'text': 'Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste. This pulls you to the present.'},
            {'icon': 'journal', 'title': 'Worst/Best/Likely', 'text': 'Write your worst fear, the best outcome, then the most likely. Anxiety exaggerates — this shrinks it.'},
            {'icon': 'move', 'title': 'Shake It Off', 'text': 'Shake your hands, arms, and legs for 30 seconds. Animals release fear energy this way. It works.'},
            {'icon': 'comfort', 'title': 'Safe Person', 'text': 'Call or text someone who makes you feel safe. A calm voice can reset your nervous system.'},
        ],
        'quick_actions': [
            {'label': 'Do this now', 'text': 'Press your feet firmly into the floor. Feel the ground. You are here. You are safe right now.'},
            {'label': 'Try this', 'text': 'Hold something cold — a glass of water, a metal object. The sensation anchors you to the present moment.'},
            {'label': 'Right now', 'text': 'Say out loud: "I am safe in this moment." Repeat it 3 times. Your brain believes what you tell it.'},
        ],
        'affirmations': [
            "Courage isn't the absence of fear. It's feeling afraid and choosing to move forward anyway.",
            'You have survived 100% of your worst days. You will survive this one too.',
            "Fear is just your brain's way of saying this matters to you. That's not weakness — that's depth.",
        ],
    },
    'surprise': {
        'headings': ['Something unexpected happened', 'Take a moment to process', 'Surprises open new doors', 'Pause before you react'],
        'insights': [
            "Surprise jolts your brain into high alert. Give yourself a moment to process before reacting.",
            "Whether good or bad, unexpected events need processing time. Don't rush to conclusions.",
        ],
        'tips': [
            {'icon': 'breathe', 'title': 'Pause & Process', 'text': 'Take 3 deep breaths before responding. Surprise narrows focus — breathing widens it.'},
            {'icon': 'journal', 'title': 'Capture It', 'text': 'Write what surprised you and how it made you feel. Processing in writing helps your brain file it.'},
            {'icon': 'goal', 'title': 'Find the Opportunity', 'text': 'Ask: "What could this make possible?" Unexpected events often open doors you didn\'t know existed.'},
        ],
        'quick_actions': [
            {'label': 'Try this', 'text': 'Take a slow breath and ask: "Is this a threat or an opportunity?" Most surprises are the latter.'},
        ],
        'affirmations': ['Life is full of unexpected turns. Your ability to adapt is your superpower.'],
    },
    'disgust': {
        'headings': ['Your instincts are talking', 'Trust your gut feeling', 'Your standards matter', 'Listen to that inner voice'],
        'insights': [
            'Disgust signals that something violates your values. That awareness is powerful.',
            "Your brain is drawing a boundary for you. Trust it — you don't need to justify your feelings.",
        ],
        'tips': [
            {'icon': 'boundary', 'title': 'Honor the Boundary', 'text': "If something feels wrong, trust that feeling. Your values matter."},
            {'icon': 'move', 'title': 'Change Environment', 'text': 'Step outside for fresh air. Physical distance helps clear emotional disgust.'},
            {'icon': 'journal', 'title': 'Values Check', 'text': 'Ask: "What value of mine is being violated?" Naming it gives you clarity.'},
        ],
        'quick_actions': [
            {'label': 'Right now', 'text': 'Wash your hands with cold water and take 3 breaths. Physical cleansing resets emotional disgust.'},
        ],
        'affirmations': ["Having standards is a strength. Don't apologize for knowing what feels wrong."],
    },
    'neutral': {
        'headings': ['A calm state is powerful', 'Steady and grounded', 'Neutral is your foundation', 'A clear mind is a gift'],
        'insights': [
            "Neutral doesn't mean empty. Your emotional baseline is steady — the ideal place to build from.",
            "A calm mind is an open mind. This is the perfect state for reflection, planning, or simply being present.",
        ],
        'tips': [
            {'icon': 'goal', 'title': 'Set an Intention', 'text': 'Neutral moments are perfect for planning. Write one thing you want to accomplish today.'},
            {'icon': 'comfort', 'title': 'Mindful Check-In', 'text': 'Scan your body head to toe. Notice tension, hunger, or tiredness. Small needs add up.'},
            {'icon': 'social', 'title': 'Connect', 'text': "Message someone you haven't talked to in a while. Neutral energy is great for reconnecting."},
        ],
        'quick_actions': [
            {'label': 'Quick boost', 'text': 'Put on your favorite song. Music is the fastest legal mood enhancer.'},
            {'label': 'Try this', 'text': 'Look out a window for 20 seconds and let your eyes relax. This micro-break resets your focus.'},
        ],
        'affirmations': [
            "Calm is not boring — it's the foundation for everything great you'll do next.",
            'Not every moment needs to be intense. Peaceful moments are where you recharge.',
        ],
    },
}


def _detect_topics(text):
    """Extract topics from journal text using keyword matching."""
    lower = text.lower()
    found = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            found.append(topic)
    return found


def generate_wellness_suggestions(emotion, sentiment, confidence, text=''):
    """Generate contextual wellness suggestions. Runs 100% locally — no external API calls.
    Combines emotion-based advice with topic-specific tips based on what the user wrote."""

    emotion_key = emotion.lower() if emotion else 'neutral'
    if emotion_key not in EMOTION_ADVICE:
        emotion_key = 'neutral'

    base = EMOTION_ADVICE[emotion_key]

    heading = random.choice(base['headings'])
    insight = random.choice(base['insights'])
    quick_action = random.choice(base['quick_actions'])
    affirmation = random.choice(base['affirmations'])

    topics = _detect_topics(text)

    topic_tips = []
    for topic in topics:
        if topic in TOPIC_TIPS:
            topic_tips.extend(TOPIC_TIPS[topic])

    if topic_tips:
        selected_topic_tips = random.sample(topic_tips, min(2, len(topic_tips)))
        emotion_tips = random.sample(base['tips'], min(1, len(base['tips'])))
        tips = selected_topic_tips + emotion_tips
    else:
        tips = list(base['tips'])
        if len(tips) > 3:
            tips = random.sample(tips, 3)

    random.shuffle(tips)

    return {
        'heading': heading,
        'insight': insight,
        'tips': tips[:3],
        'quick_action': quick_action,
        'affirmation': affirmation,
    }
