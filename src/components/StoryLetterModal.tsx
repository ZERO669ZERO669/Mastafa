import React, { useEffect } from 'react';
import { ScrollText, ShieldAlert, KeyRound, Flame } from 'lucide-react';
import { MARK_INHERITANCE_STORY } from '../game/puzzles';

interface StoryLetterModalProps {
  isOpen: boolean;
  onConfirmStart: () => void;
}

export const StoryLetterModal: React.FC<StoryLetterModalProps> = ({
  isOpen,
  onConfirmStart,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        onConfirmStart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onConfirmStart]);

  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-parchment-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl rounded-xl border-2 border-amber-700/80 bg-[#f3e5c8] text-stone-900 shadow-2xl overflow-hidden my-auto">
        {/* Aged parchment top & bottom ornamental trim */}
        <div className="h-2.5 w-full bg-gradient-to-r from-amber-950 via-red-900 to-amber-950" />

        <div className="p-5 sm:p-7 max-h-[88vh] overflow-y-auto">
          {/* Wax Seal & Header */}
          <div className="flex items-start justify-between gap-3 border-b-2 border-amber-900/25 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-red-950 bg-red-800 text-amber-100 shadow-md">
                <ScrollText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-wide text-red-900">
                  {MARK_INHERITANCE_STORY.dateLineAr}
                </p>
                <h2
                  id="story-parchment-title"
                  className="text-lg sm:text-2xl font-extrabold text-stone-950 leading-snug"
                >
                  {MARK_INHERITANCE_STORY.titleAr}
                </h2>
              </div>
            </div>
            <span className="shrink-0 rounded border border-red-900/40 bg-red-900/10 px-2.5 py-1 text-xs font-bold text-red-950">
              ختم رسمي سري
            </span>
          </div>

          {/* Complete Story Paragraphs */}
          <div className="space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-stone-800 font-medium">
            {MARK_INHERITANCE_STORY.paragraphsAr.map((para, idx) => (
              <p key={idx} className="text-justify">
                {para}
              </p>
            ))}
          </div>

          {/* Grandfather's Ominous Quote */}
          <blockquote className="mt-4 rounded-lg border-r-4 border-red-900 bg-amber-950/10 px-4 py-3 text-xs sm:text-sm font-bold italic text-red-950">
            {MARK_INHERITANCE_STORY.signatureAr}
          </blockquote>

          {/* Tactical Survival Rules Strip */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="flex items-center gap-2 rounded-lg border border-amber-900/25 bg-amber-900/10 px-3 py-2">
              <KeyRound className="h-4 w-4 shrink-0 text-amber-900" />
              <span className="font-semibold text-stone-900">
                حلّ الألغاز بالترتيب لنيل المفاتيح وفتح الأبواب الموصدة
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-900" />
              <span className="font-semibold text-stone-900">
                ضربة الجد قاتلة وهو أسرع منك؛ اختبئ واستغلّ الزوايا واندفاعك القصير!
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-amber-900/25 bg-amber-900/10 px-3 py-2">
              <Flame className="h-4 w-4 shrink-0 text-amber-900" />
              <span className="font-semibold text-stone-900">
                اكسر ختم الضريح، خذ الوثيقة، ثم اركض نحو البوابة قبل أن يستيقظ الجد!
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onConfirmStart}
              className="w-full sm:w-auto min-w-[260px] cursor-pointer rounded-lg border-2 border-red-950 bg-red-900 px-7 py-3 text-base font-extrabold text-amber-50 shadow-lg transition hover:bg-red-800 active:scale-[0.99]"
            >
              اطوِ الرسالة وابدأ الاستكشاف
            </button>
          </div>
        </div>

        <div className="h-2 w-full bg-gradient-to-r from-amber-950 via-red-900 to-amber-950" />
      </div>
    </div>
  );
};
