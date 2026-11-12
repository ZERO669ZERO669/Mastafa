import React from 'react';
import { DialogueLine } from '../game/types';

interface DialogueBannerProps {
  dialogue: DialogueLine | null;
}

export const DialogueBanner: React.FC<DialogueBannerProps> = ({ dialogue }) => {
  if (!dialogue) return null;

  const isGrandfather = dialogue.speakerRole === 'grandfather';

  return (
    <div
      dir="rtl"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-36 sm:bottom-24 z-30 flex justify-center px-3"
    >
      <div
        className={`max-w-xl w-full rounded-lg border px-4 py-2.5 shadow-xl ${
          isGrandfather
            ? 'border-red-700/80 bg-[#1a090b]/95 text-red-100'
            : 'border-amber-600/60 bg-stone-950/92 text-amber-50'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span
            className={`text-xs font-extrabold tracking-wide ${
              isGrandfather ? 'text-red-400' : 'text-amber-400'
            }`}
          >
            {dialogue.speakerAr}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-medium leading-relaxed">
          «{dialogue.textAr}»
        </p>
      </div>
    </div>
  );
};
