import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineHeart, HiOutlineClock, HiOutlineX, HiOutlineShieldCheck } from 'react-icons/hi';

const BREATH_DURATION = 60;

function BreathingExercise({ onDone }) {
  const [seconds, setSeconds] = useState(BREATH_DURATION);
  const [phase, setPhase] = useState('in');
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [onDone]);

  useEffect(() => {
    const cyclePos = (BREATH_DURATION - seconds) % 16;
    if (cyclePos < 4) setPhase('in');
    else if (cyclePos < 8) setPhase('hold');
    else if (cyclePos < 14) setPhase('out');
    else setPhase('rest');
  }, [seconds]);

  const PHASE_CONFIG = {
    in:   { label: 'Breathe In',  color: 'text-helix-accent', ring: 'ring-helix-accent/50', scale: 1.15 },
    hold: { label: 'Hold',        color: 'text-blue-500',   ring: 'ring-blue-400',   scale: 1.15 },
    out:  { label: 'Breathe Out', color: 'text-emerald-500',ring: 'ring-emerald-400', scale: 1.0 },
    rest: { label: 'Rest',        color: 'text-rose-400',   ring: 'ring-rose-300',    scale: 1.0 },
  };

  const cfg = PHASE_CONFIG[phase];

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <motion.div
        animate={{ scale: cfg.scale }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        className={`w-16 h-16 rounded-full bg-helix-surface border-2 ${cfg.ring} flex items-center justify-center shadow-sm`}
      >
        <span className={`text-sm font-bold ${cfg.color}`}>{seconds}s</span>
      </motion.div>
      <p className={`text-sm font-semibold ${cfg.color} transition-colors`}>{cfg.label}</p>
      <div className="w-full bg-helix-border/30 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full"
          initial={{ width: '100%' }}
          animate={{ width: `${(seconds / BREATH_DURATION) * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

export default function StressInterventionToast({ isStressed, onDismiss, onSnooze, onBreathingDone, metrics }) {
  const [breathing, setBreathing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleBreathDone = useCallback(() => {
    setCompleted(true);
    onBreathingDone?.();
    setTimeout(() => {
      setBreathing(false);
      setCompleted(false);
      onDismiss();
    }, 2500);
  }, [onDismiss, onBreathingDone]);

  useEffect(() => {
    if (!isStressed) {
      setBreathing(false);
      setCompleted(false);
    }
  }, [isStressed]);

  return (
    <AnimatePresence>
      {isStressed && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-24 right-6 z-[60] w-[340px]"
        >
          <div className="bg-helix-surface rounded-2xl border border-helix-border/50 shadow-xl shadow-lg overflow-hidden">
            {/* Privacy badge strip */}
            <div className="bg-helix-surface/50 border-b border-helix-border/30 px-4 py-1.5 flex items-center gap-1.5">
              <HiOutlineShieldCheck className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] text-helix-muted font-semibold">
                Privacy-first — patterns only, never content
              </span>
            </div>

            <div className="p-5">
              {/* Close button */}
              <button
                onClick={onDismiss}
                className="absolute top-8 right-3 p-1 rounded-lg text-helix-muted hover:text-helix-text hover:bg-helix-border/30 transition-colors"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>

              {completed ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-4"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <HiOutlineHeart className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-helix-text">You did great.</p>
                  <p className="text-xs text-helix-muted mt-1">Your body thanks you for that pause.</p>
                </motion.div>
              ) : breathing ? (
                <BreathingExercise onDone={handleBreathDone} />
              ) : (
                <>
                  {/* Icon + Message */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-helix-accent/15 border border-helix-accent/20 flex items-center justify-center shrink-0">
                      <HiOutlineHeart className="w-5 h-5 text-helix-accent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-helix-text leading-snug">
                        Your body is talking
                      </h4>
                      <p className="text-xs text-helix-muted mt-1 leading-relaxed">
                        Your typing patterns suggest you might be frustrated or rushing. 
                        Take a breath — you're doing enough.
                      </p>
                    </div>
                  </div>

                  {/* Live metrics */}
                  {metrics && (
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 bg-helix-surface/50 rounded-lg border border-helix-border/30 px-3 py-2 text-center">
                        <p className="text-lg font-bold text-helix-text">{metrics.speed}</p>
                        <p className="text-[10px] text-helix-muted font-semibold uppercase tracking-wider">keys/min</p>
                      </div>
                      <div className="flex-1 bg-rose-500/10 rounded-lg border border-rose-500/20 px-3 py-2 text-center">
                        <p className="text-lg font-bold text-rose-600">{metrics.backspaces}</p>
                        <p className="text-[10px] text-helix-muted font-semibold uppercase tracking-wider">corrections</p>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBreathing(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      <HiOutlineClock className="w-3.5 h-3.5" />
                      Start 60s Breathing
                    </button>
                    <button
                      onClick={() => onSnooze(30)}
                      className="px-4 py-2.5 rounded-xl bg-helix-border/30 border border-helix-border/50 text-xs font-bold text-helix-text hover:bg-helix-card/60 transition-all"
                    >
                      Snooze
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
