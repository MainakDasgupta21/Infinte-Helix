from transformers import pipeline


class EmotionDetector:
    """
    HuggingFace emotion detection using j-hartmann/emotion-english-distilroberta-base.
    Detects: anger, disgust, fear, joy, neutral, sadness, surprise.
    """

    def __init__(self, model_name=None, cache_dir=None):
        self.model_name = model_name or 'j-hartmann/emotion-english-distilroberta-base'
        self.cache_dir = cache_dir or './model_cache'
        self._pipeline = None

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
        """
        Analyze text for emotions.

        Returns dict with:
            emotion: dominant emotion label
            confidence: score of dominant emotion
            all_emotions: list of {label, score} sorted by score desc
        """
        if not text or not text.strip():
            return {'emotion': 'neutral', 'confidence': 1.0, 'all_emotions': [{'label': 'neutral', 'score': 1.0}]}

        pipe = self._load()
        results = pipe(text[:512])[0]

        sorted_results = sorted(results, key=lambda x: x['score'], reverse=True)

        return {
            'emotion': sorted_results[0]['label'],
            'confidence': round(sorted_results[0]['score'], 4),
            'all_emotions': [
                {'label': r['label'], 'score': round(r['score'], 4)}
                for r in sorted_results
            ]
        }
