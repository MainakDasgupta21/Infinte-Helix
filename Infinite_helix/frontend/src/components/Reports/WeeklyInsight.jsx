import React from 'react';
import {
  HiOutlineStar,
  HiOutlineTrendingUp,
  HiOutlineCheckCircle,
  HiOutlineLightBulb,
  HiOutlineSparkles,
} from 'react-icons/hi';

const INSIGHT_STYLES = {
  achievement: { icon: HiOutlineStar, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  improvement: { icon: HiOutlineTrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  positive: { icon: HiOutlineCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  tip: { icon: HiOutlineLightBulb, color: 'text-helix-accent', bg: 'bg-helix-accent/10', border: 'border-helix-accent/20' },
};

const PHASE_INFO = {
  menstrual: { label: 'Menstrual', color: 'text-rose-500', bg: 'bg-rose-500/15' },
  follicular: { label: 'Follicular', color: 'text-emerald-600', bg: 'bg-emerald-500/15' },
  ovulatory: { label: 'Ovulatory', color: 'text-amber-600', bg: 'bg-amber-500/15' },
  luteal: { label: 'Luteal', color: 'text-helix-accent', bg: 'bg-helix-accent/15' },
};

export default function WeeklyInsight({ insights, recommendations, affirmation, cycleInsights }) {
  return (
    <div className="space-y-6">
      {/* Cycle Insights */}
      {cycleInsights?.enabled && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineSparkles className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-medium text-helix-muted">Cycle-Aware Insights</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-medium">
              {PHASE_INFO[cycleInsights.current_phase]?.label} phase
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {Object.entries(cycleInsights.phase_scores || {}).map(([phase, score]) => {
              const info = PHASE_INFO[phase] || {};
              const isCurrent = phase === cycleInsights.current_phase;
              return (
                <div
                  key={phase}
                  className={`rounded-xl p-3 text-center border transition-all ${isCurrent ? `${info.bg} border-current/20 ring-1 ring-current/10` : 'bg-helix-border/30 border-helix-border/30'}`}
                >
                  <p className={`text-lg font-serif font-bold ${isCurrent ? info.color : 'text-helix-text'}`}>
                    {score}
                  </p>
                  <p className="text-[10px] text-helix-muted capitalize mt-1">{info.label}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-helix-border/30 rounded-xl p-4 border border-helix-border/30">
            <p className="text-sm text-helix-text/90 leading-relaxed">{cycleInsights.tip}</p>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insights && insights.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-helix-muted mb-4">AI-Powered Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => {
              const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.tip;
              const Icon = style.icon;
              return (
                <div key={i} className={`${style.bg} rounded-xl p-4 border ${style.border}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${style.bg}`}>
                      <Icon className={`w-4.5 h-4.5 ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-helix-text">{insight.title}</p>
                      <p className="text-xs text-helix-muted mt-1 leading-relaxed">{insight.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-helix-muted mb-4">Personalized Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 bg-helix-border/30 rounded-xl p-4 border border-helix-border/30">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-helix-accent/15 to-blue-500/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-helix-accent">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-helix-accent uppercase tracking-wider mb-0.5">
                    {rec.category}
                  </p>
                  <p className="text-sm text-helix-text/90 leading-relaxed">{rec.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affirmation */}
      {affirmation && (
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-helix-accent/10 via-rose-500/10 to-blue-500/10" />
          <div className="absolute inset-0 bg-mesh opacity-50" />
          <div className="relative p-8 text-center">
            <p className="text-xs font-semibold text-helix-accent uppercase tracking-widest mb-3">
              Your Weekly Affirmation
            </p>
            <p className="text-base text-helix-text/90 leading-relaxed italic font-body max-w-2xl mx-auto">
              &ldquo;{affirmation}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
