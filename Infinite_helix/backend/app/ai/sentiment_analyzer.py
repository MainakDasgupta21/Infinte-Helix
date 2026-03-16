from transformers import pipeline

LABEL_MAP = {
    'LABEL_0': 'negative',
    'LABEL_1': 'neutral',
    'LABEL_2': 'positive',
}

REFRAME_TEMPLATES = {
    'negative': [
        "It's okay to feel this way. You've handled similar challenges before — take it one step at a time.",
        "Tough moments don't last. Let's focus on one small win right now.",
        "You're doing better than you think. Small steps count.",
        "Take a breath. You've navigated difficult situations before and come through stronger.",
        "This feeling is temporary. What's one small thing you can do right now to feel a little better?",
        "Remember, asking for help is a sign of strength, not weakness.",
        "You've already accomplished so much today. Give yourself credit for showing up.",
    ],
}


class SentimentAnalyzer:
    """
    HuggingFace sentiment analysis using cardiffnlp/twitter-roberta-base-sentiment.
    Detects: positive, neutral, negative.
    When negative with high confidence, generates supportive reframe.
    """

    def __init__(self, model_name=None, cache_dir=None):
        self.model_name = model_name or 'cardiffnlp/twitter-roberta-base-sentiment'
        self.cache_dir = cache_dir or './model_cache'
        self._pipeline = None
        self._reframe_idx = 0

    def _load(self):
        if self._pipeline is None:
            self._pipeline = pipeline(
                'text-classification',
                model=self.model_name,
                top_k=None,
                model_kwargs={'cache_dir': self.cache_dir}
            )
        return self._pipeline

    def analyze(self, text):
        if not text or not text.strip():
            return {'sentiment': 'neutral', 'confidence': 1.0, 'all_sentiments': [], 'reframe': None}

        pipe = self._load()
        results = pipe(text[:512])[0]

        mapped = [
            {'label': LABEL_MAP.get(r['label'], r['label']), 'score': round(r['score'], 4)}
            for r in results
        ]
        mapped.sort(key=lambda x: x['score'], reverse=True)

        top = mapped[0]
        reframe = None

        if top['label'] == 'negative' and top['score'] > 0.7:
            reframe = self._get_reframe()

        return {
            'sentiment': top['label'],
            'confidence': top['score'],
            'all_sentiments': mapped,
            'reframe': reframe,
        }

    def _get_reframe(self):
        templates = REFRAME_TEMPLATES['negative']
        msg = templates[self._reframe_idx % len(templates)]
        self._reframe_idx += 1
        return msg
