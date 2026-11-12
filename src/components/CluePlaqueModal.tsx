import React from 'react';
import { CheckCircle2, Eye, X } from 'lucide-react';
import { CluePlaque } from '../game/types';

interface CluePlaqueModalProps {
  plaque: CluePlaque | null;
  onClose: () => void;
}

export const CluePlaqueModal: React.FC<CluePlaqueModalProps> = ({ plaque, onClose }) => {
  if (!plaque) return null;

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clue-plaque-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-xl rounded-2xl border-2 border-amber-500/80 bg-stone-950 text-stone-100 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/60 bg-stone-900 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-amber-400">{plaque.roomNameAr}</div>
              <h2
                id="clue-plaque-modal-title"
                className="text-sm sm:text-lg font-extrabold text-amber-50"
              >
                {plaque.titleAr}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة النقش"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Close-Up Engraved Brass / Marble Tablet */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="rounded-xl border-2 border-amber-500/90 bg-[#1a1107] px-4 py-6 text-center shadow-inner">
            <div className="text-[11px] font-bold text-amber-400/90 mb-2">
              النقش المحفور تحت ضوء الكشاف
            </div>
            <div
              dir="auto"
              className="font-mono text-2xl sm:text-4xl font-extrabold text-amber-200 tracking-wider leading-snug tabular-nums"
            >
              {plaque.featuredCode}
            </div>
          </div>

          <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-4 space-y-2">
            <p className="text-xs sm:text-sm font-bold text-amber-100 leading-relaxed">
              {plaque.inscriptionAr}
            </p>
            <p className="text-xs text-stone-300 leading-relaxed border-t border-stone-800 pt-2">
              {plaque.subInscriptionAr}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              تم حفظ هذا النقش في مفكرة الأدلة وشاشة اللغز
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-stone-950 hover:bg-amber-500 cursor-pointer"
            >
              متابعة الاستكشاف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
