import React, { useState } from 'react';
import { HiOutlinePaperAirplane } from 'react-icons/hi';

const PROMPTS = [
  "How are you feeling right now?",
  "What's on your mind today?",
  "Describe your energy level.",
  "Any wins or challenges today?",
  "How's your workload feeling?",
];

export default function JournalEntry({ onSubmit, isAnalyzing }) {
  const [text, setText] = useState('');
  const [prompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && onSubmit) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <div className="glass-card p-6 glow-accent">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-helix-accent to-helix-pink flex items-center justify-center">
          <span className="text-sm">✍</span>
        </div>
        <div>
          <h3 className="text-sm font-medium text-helix-text">Emotion Journal</h3>
          <p className="text-xs text-helix-muted">AI-powered emotion analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={prompt}
            rows={4}
            className="w-full bg-helix-bg/50 border border-helix-border rounded-xl p-4 text-sm text-helix-text
                       placeholder:text-helix-muted/60 resize-none focus:outline-none focus:border-helix-accent/50
                       focus:ring-1 focus:ring-helix-accent/20 transition-all"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-helix-muted">{text.length} chars</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!text.trim() || isAnalyzing}
          className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-helix-accent to-helix-pink text-white
                     text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
              Analyze Emotion
            </>
          )}
        </button>
      </form>
    </div>
  );
}
