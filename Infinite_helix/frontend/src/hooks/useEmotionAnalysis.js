import { useState, useCallback } from 'react';
import { journalAPI } from '../services/api';

export default function useEmotionAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (text) => {
    setLoading(true);
    setError(null);

    try {
      const res = await journalAPI.create({ text });
      const data = res.data;

      const combined = {
        emotion: data.emotion,
        confidence: data.confidence,
        sentiment: data.sentiment,
        reframe: data.reframe || null,
        all_emotions: data.all_emotions || [],
        all_sentiments: data.all_sentiments || [],
      };

      setResult(combined);
      return combined;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, reset };
}
