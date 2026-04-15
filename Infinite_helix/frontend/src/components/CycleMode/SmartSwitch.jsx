import React from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';

export default function SmartSwitch({ isPregnancy, onToggle }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-medium transition-colors ${!isPregnancy ? 'text-helix-accent' : 'text-helix-muted'}`}>
        Cycle
      </span>

      <button
        onClick={onToggle}
        className={`relative w-16 h-8 rounded-full transition-all duration-500 ${
          isPregnancy
            ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg'
            : 'bg-gradient-to-r from-violet-600 to-violet-700 shadow-lg'
        }`}
        aria-label={isPregnancy ? 'Switch to Cycle Mode' : 'Switch to Pregnancy Mode'}
      >
        <motion.div
          className="absolute top-1 w-6 h-6 rounded-full bg-helix-surface shadow-md flex items-center justify-center"
          animate={{ left: isPregnancy ? '2.125rem' : '0.25rem' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {isPregnancy
            ? <HiOutlineSun className="w-3.5 h-3.5 text-amber-600" />
            : <HiOutlineMoon className="w-3.5 h-3.5 text-helix-accent" />
          }
        </motion.div>
      </button>

      <span className={`text-xs font-medium transition-colors ${isPregnancy ? 'text-amber-600' : 'text-helix-muted'}`}>
        Pregnancy
      </span>
    </div>
  );
}
