import React from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';

export default function SmartSwitch({ isPregnancy, onToggle }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-medium transition-colors ${!isPregnancy ? 'text-violet-600' : 'text-slate-500'}`}>
        Cycle
      </span>

      <button
        onClick={onToggle}
        className={`relative w-16 h-8 rounded-full transition-all duration-500 ${
          isPregnancy
            ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_16px_rgba(245,183,49,0.3)]'
            : 'bg-gradient-to-r from-violet-600 to-violet-700 shadow-[0_0_16px_rgba(124,108,219,0.3)]'
        }`}
        aria-label={isPregnancy ? 'Switch to Cycle Mode' : 'Switch to Pregnancy Mode'}
      >
        <motion.div
          className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
          animate={{ left: isPregnancy ? '2.125rem' : '0.25rem' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {isPregnancy
            ? <HiOutlineSun className="w-3.5 h-3.5 text-amber-600" />
            : <HiOutlineMoon className="w-3.5 h-3.5 text-violet-600" />
          }
        </motion.div>
      </button>

      <span className={`text-xs font-medium transition-colors ${isPregnancy ? 'text-amber-600' : 'text-slate-500'}`}>
        Pregnancy
      </span>
    </div>
  );
}
