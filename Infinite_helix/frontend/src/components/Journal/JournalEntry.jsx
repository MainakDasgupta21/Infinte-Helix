import React, { useState } from 'react';
import { HiOutlinePaperAirplane, HiOutlinePencilAlt } from 'react-icons/hi';

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
    <div className="glass-card p-6 border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center">
          <HiOutlinePencilAlt className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-800">Emotion Journal</h3>
          <p className="text-xs text-slate-500">Write freely — get real advice, not just labels</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={prompt}
            rows={4}
            className="w-full bg-slate-100/50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800
                       placeholder:text-slate-500 resize-none focus:outline-none focus:border-violet-300
                       focus:ring-1 focus:ring-violet-200 transition-all"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">{text.length} chars</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!text.trim() || isAnalyzing}
          className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white
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
              Analyze & Get Advice
            </>
          )}
        </button>
      </form>
    </div>
  );
}
