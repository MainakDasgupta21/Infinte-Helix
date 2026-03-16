import React, { useState } from 'react';
import JournalEntry from '../components/Journal/JournalEntry';
import AIResponse from '../components/Journal/AIResponse';
import EntryHistory from '../components/Journal/EntryHistory';

const DEMO_ANALYSES = [
  {
    emotion: 'sadness', confidence: 0.72, sentiment: 'negative',
    reframe: "It's okay to feel overwhelmed. You've navigated tough deadlines before — focus on one small win right now.",
    allEmotions: [
      { label: 'sadness', score: 0.72 }, { label: 'fear', score: 0.15 },
      { label: 'anger', score: 0.06 }, { label: 'neutral', score: 0.04 },
      { label: 'joy', score: 0.02 }, { label: 'surprise', score: 0.01 },
    ],
  },
  {
    emotion: 'joy', confidence: 0.89, sentiment: 'positive',
    reframe: null,
    allEmotions: [
      { label: 'joy', score: 0.89 }, { label: 'surprise', score: 0.05 },
      { label: 'neutral', score: 0.04 }, { label: 'sadness', score: 0.01 },
    ],
  },
  {
    emotion: 'anger', confidence: 0.78, sentiment: 'negative',
    reframe: "Frustration shows you care about quality. Take a breath, then tackle one thing at a time.",
    allEmotions: [
      { label: 'anger', score: 0.78 }, { label: 'disgust', score: 0.10 },
      { label: 'sadness', score: 0.06 }, { label: 'neutral', score: 0.04 },
    ],
  },
];

export default function Journal() {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async (text) => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const res = await fetch('http://localhost:5000/api/emotion/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
        setIsAnalyzing(false);
        return;
      }
    } catch {
      // Backend unavailable — use demo data
    }

    await new Promise(r => setTimeout(r, 1500));
    setAnalysis(DEMO_ANALYSES[Math.floor(Math.random() * DEMO_ANALYSES.length)]);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-semibold text-helix-text">Emotion Journal</h1>
        <p className="text-sm text-helix-muted mt-1">Express how you feel and get AI-powered emotional insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <JournalEntry onSubmit={handleSubmit} isAnalyzing={isAnalyzing} />
          {analysis && <AIResponse analysis={analysis} />}
        </div>
        <div className="lg:col-span-2">
          <EntryHistory />
        </div>
      </div>
    </div>
  );
}
