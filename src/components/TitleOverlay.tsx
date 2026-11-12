import React, { useEffect, useState } from 'react';
import { Play, RotateCcw, Sliders, Trophy } from 'lucide-react';
import { SavedCheckpointData } from '../game/saveSystem';

interface TitleOverlayProps {
  savedCheckpoint: SavedCheckpointData | null;
  bestSigils: number;
  bestTimeSeconds: number | null;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  isSubModalOpen: boolean;
  onContinueGame: () => void;
  onStartNewGame: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  savedCheckpoint,
  bestSigils,
  bestTimeSeconds,
  unlockedAchievementsCount,
  totalAchievementsCount,
  isSubModalOpen,
  onContinueGame,
  onStartNewGame,
  onOpenSettings,
  onOpenAchievements,
}) => {
  const [confirmNewGame, setConfirmNewGame] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isSubModalOpen) return;
      if (e.code === 'Enter' || e.code === 'Space') {
        if (document.activeElement instanceof HTMLButtonElement) return;
        e.preventDefault();
        if (savedCheckpoint) {
          onContinueGame();
        } else {
          onStartNewGame();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSubModalOpen, savedCheckpoint, onContinueGame, onStartNewGame]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-40 flex flex-col justify-between bg-gradient-to-l from-black/88 via-black/55 to-black/25 p-5 sm:p-10 text-stone-100 select-none overflow-y-auto"
    >
      {/* Top Mastery Summary Row (No Website Nav Chrome) */}
      <div className="flex items-center justify-between gap-4 text-xs text-stone-300">
        <div className="font-bold tracking-wide text-amber-300/90">
          قلعة آل مالاكور · منظور الشخص الأول 3D
        </div>
        {(bestSigils > 0 || bestTimeSeconds !== null || unlockedAchievementsCount > 0) && (
          <div className="flex items-center gap-3 font-semibold tabular-nums text-stone-200">
            <span>
              أفضل تقدّم: <strong className="text-amber-400">{bestSigils}/6</strong>
            </span>
            {bestTimeSeconds !== null && (
              <span className="text-emerald-400">
                أسرع هروب: {formatTime(bestTimeSeconds)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right-Third Asymmetric Gothic Emblem & Menu Lockup over Calm Shadow Space */}
      <main className="my-auto flex w-full max-w-xl flex-col items-start text-right py-4">
        {/* Custom Code-Authored Gothic Crest Emblem SVG */}
        <svg
          viewBox="0 0 96 96"
          className="mb-3 h-16 w-16 sm:h-20 sm:w-20 drop-shadow-xl"
          aria-hidden="true"
        >
          <path
            d="M48 6 L84 20 V48 C84 70 68 84 48 92 C28 84 12 70 12 48 V20 Z"
            fill="#190d0b"
            stroke="#d97706"
            strokeWidth="3"
          />
          <path
            d="M48 13 L77 24 V47 C77 65 63 77 48 84 C33 77 19 65 19 47 V24 Z"
            fill="#2b1111"
            stroke="#991b1b"
            strokeWidth="1.5"
          />
          <circle cx="48" cy="37" r="10" fill="none" stroke="#fbbf24" strokeWidth="2.8" />
          <circle cx="48" cy="37" r="3.2" fill="#ef4444" />
          <path
            d="M48 47 V73 M48 60 H58 M48 68 H56"
            stroke="#fbbf24"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-amber-50 drop-shadow-lg leading-tight">
          قلعة الجدّ الملعونة
        </h1>

        <p className="mt-2.5 max-w-lg text-sm sm:text-base text-stone-300 leading-relaxed">
          استكشف أجنحة القلعة، حلّ الألغاز المتسلسلة، وانتزع{' '}
          <strong className="text-amber-300">وثيقة الميراث</strong> لسداد ديون مارك قبل أن تدركك
          روح الجد فيكتور!
        </p>

        {/* Primary Continue / Start CTA + Secondary Actions */}
        <div className="mt-6 flex flex-col gap-3 w-full sm:w-auto">
          {savedCheckpoint ? (
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onContinueGame();
              }}
              className="flex flex-col items-start cursor-pointer rounded-xl border-2 border-amber-400 bg-emerald-950/95 px-6 py-3 text-right text-amber-50 shadow-2xl transition hover:bg-emerald-900 active:scale-[0.98]"
            >
              <span className="flex items-center gap-2 text-lg sm:text-xl font-black text-amber-200">
                <Play className="h-5 w-5 fill-amber-300 text-amber-300" />
                <span>مواصلة من آخر حفظ — الفصل {savedCheckpoint.chapterNum}</span>
              </span>
              <span className="mt-0.5 text-xs font-bold text-emerald-200/90 tabular-nums">
                {savedCheckpoint.roomNameAr} · الألغاز {savedCheckpoint.sigilsSolved}/6 · التحف{' '}
                {savedCheckpoint.relicsFound}/12
              </span>
            </button>
          ) : null}

          <div className="flex flex-wrap items-center gap-2.5">
            {!savedCheckpoint ? (
              <button
                type="button"
                data-start="true"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onStartNewGame();
                }}
                className="cursor-pointer rounded-xl border-2 border-amber-400 bg-red-900 px-10 py-3.5 text-lg sm:text-xl font-black text-amber-50 shadow-2xl transition hover:bg-red-800 active:scale-[0.98]"
              >
                ابدأ اللعبة
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  if (!confirmNewGame) {
                    setConfirmNewGame(true);
                    return;
                  }
                  setConfirmNewGame(false);
                  onStartNewGame();
                }}
                className={`inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl border px-4 py-3 text-sm font-extrabold transition ${
                  confirmNewGame
                    ? 'border-red-400 bg-red-900 text-white'
                    : 'border-stone-700 bg-stone-950/90 text-stone-200 hover:bg-stone-900'
                }`}
              >
                <RotateCcw className="h-4 w-4 text-amber-400" />
                <span>{confirmNewGame ? 'اضغط مجدداً لتأكيد لعبة جديدة' : 'لعبة جديدة'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenAchievements();
              }}
              className="inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-amber-700/60 bg-stone-950/90 px-4 py-3 text-sm font-extrabold text-amber-200 transition hover:bg-stone-900 tabular-nums"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>
                الإنجازات ({unlockedAchievementsCount}/{totalAchievementsCount})
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenSettings();
              }}
              className="inline-flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-stone-700 bg-stone-950/90 px-4 py-3 text-sm font-extrabold text-stone-200 transition hover:bg-stone-900"
            >
              <Sliders className="h-4 w-4 text-amber-400" />
              <span>الإعدادات</span>
            </button>
          </div>
        </div>
      </main>

      {/* Single Flat Borderless Control Hint Line in Safe Margin */}
      <div className="text-xs text-stone-300/90 leading-relaxed">
        WASD أو عصا اللمس للحركة · الماوس أو السحب للنظر 360° · Shift ركض · C تسلل صامت · E تفاعل · F كشاف · حفظ تلقائي ويدوي
      </div>
    </div>
  );
};
