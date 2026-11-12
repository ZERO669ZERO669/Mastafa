import React from 'react';
import { Award, CheckCircle2, Lock, Trophy, X } from 'lucide-react';
import { AchievementDef, AchievementId } from '../game/types';
import { STEAM_ACHIEVEMENTS } from '../game/achievements';

interface AchievementsModalProps {
  isOpen: boolean;
  unlockedIds: ReadonlySet<AchievementId>;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  unlockedIds,
  onClose,
}) => {
  if (!isOpen) return null;

  const unlockedCount = STEAM_ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).length;
  const pct = Math.round((unlockedCount / STEAM_ACHIEVEMENTS.length) * 100);

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl border-2 border-amber-700/70 bg-stone-950 text-stone-100 shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 id="achievements-modal-title" className="text-lg font-extrabold text-amber-50">
              إنجازات القلعة ({unlockedCount}/{STEAM_ACHIEVEMENTS.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة الإنجازات"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Progress Bar */}
          <div className="rounded-xl border border-stone-800 bg-stone-900 p-3.5">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-amber-200">نسبة إتمام التختيم الكامل</span>
              <span className="font-mono text-amber-400 tabular-nums">{pct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-800">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* 8 Steam Achievement Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {STEAM_ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlockedIds.has(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                    isUnlocked
                      ? 'border-amber-500/70 bg-amber-950/35 text-amber-50'
                      : 'border-stone-800 bg-stone-900/75 text-stone-400'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                      isUnlocked
                        ? 'border-amber-400 bg-amber-900/70 text-amber-300'
                        : 'border-stone-700 bg-stone-800 text-stone-500'
                    }`}
                  >
                    {isUnlocked ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold truncate">
                      {ach.titleAr}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-stone-300">
                      {ach.descAr}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AchievementToast: React.FC<{ achievement: AchievementDef | null }> = ({
  achievement,
}) => {
  if (!achievement) return null;
  return (
    <div
      dir="rtl"
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-32 left-4 z-40 flex items-center gap-3 rounded-xl border-2 border-amber-400 bg-stone-950/95 px-4 py-3 text-amber-50 shadow-2xl max-w-xs"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-400 bg-amber-900/80 text-amber-300">
        <Award className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
          إنجاز جديد مفتوح!
        </div>
        <div className="text-xs sm:text-sm font-black text-white">{achievement.titleAr}</div>
      </div>
    </div>
  );
};
