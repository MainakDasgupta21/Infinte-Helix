import { useState, useCallback } from 'react';
import { emotionAPI, sentimentAPI } from '../services/api';

export default function useEmotionAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (text) => {
    setLoading(true);
    setError(null);

    try {
      const [emotionRes, sentimentRes] = await Promise.all([
        emotionAPI.analyze(text),
        sentimentAPI.analyze(text),
      ]);

      const combined = {
        ...emotionRes.data,
        sentiment: sentimentRes.data.sentiment,
        reframe: sentimentRes.data.reframe || null,
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
