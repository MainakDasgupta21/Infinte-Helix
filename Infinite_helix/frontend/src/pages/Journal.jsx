import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import JournalEntry from '../components/Journal/JournalEntry';
import AIResponse from '../components/Journal/AIResponse';
import EntryHistory from '../components/Journal/EntryHistory';
import { journalAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Journal() {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [entries, setEntries] = useState([]);
  const [submitError, setSubmitError] = useState(null);
  const { user } = useAuth();

  const fetchEntries = useCallback(async () => {
    try {
      const res = await journalAPI.list({ user_id: user?.uid || 'demo-user-001', limit: 10 });
      if (Array.isArray(res.data)) {
        setEntries(res.data);
      }
    } catch {
      // keep existing entries on failure
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = async (text) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setSubmitError(null);

    try {
      const res = await journalAPI.create({ text, user_id: user?.uid || 'demo-user-001' });
      if (res.data) {
        setAnalysis({
          emotion: res.data.emotion,
          confidence: res.data.confidence,
          sentiment: res.data.sentiment,
          reframe: res.data.reframe,
          all_emotions: res.data.all_emotions,
          all_sentiments: res.data.all_sentiments,
        });
        fetchEntries();
        setIsAnalyzing(false);
        toast.success('Journal entry saved');
        return;
      }
    } catch {
      setSubmitError(
        'Could not reach the server. Start the backend and try again \u2014 your text was not analyzed.'
      );
      toast.error('Failed to save entry');
    }

    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-semibold text-helix-text">Emotion Journal</h1>
        <p className="text-sm text-helix-muted mt-1">
          Write freely; your entry is analyzed and saved with detected emotion and sentiment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {submitError && (
            <div className="rounded-xl border border-helix-red/30 bg-helix-red/10 px-4 py-3 text-sm text-helix-text">
              {submitError}
            </div>
          )}
          <JournalEntry onSubmit={handleSubmit} isAnalyzing={isAnalyzing} />
          {analysis && <AIResponse analysis={analysis} />}
        </div>
        <div className="lg:col-span-2">
          <EntryHistory entries={entries} />
        </div>
      </div>
    </div>
  );
}
