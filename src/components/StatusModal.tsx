import React, { useState } from 'react';
import {
  Award,
  History,
  Home,
  Play,
  RotateCcw,
  Save,
  ScrollText,
  Skull,
  Sliders,
  Trophy,
} from 'lucide-react';
import { GameState, RunSnapshot } from '../game/types';
import { DIFFICULTY_TUNING } from '../game/achievements';
import { SavedCheckpointData } from '../game/saveSystem';

interface StatusModalProps {
  gameState: GameState;
  snapshot: RunSnapshot | null;
  savedCheckpoint: SavedCheckpointData | null;
  onResume: () => void;
  onSaveCheckpoint: () => void;
  onLoadCheckpoint: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onOpenStory: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  gameState,
  snapshot,
  savedCheckpoint,
  onResume,
  onSaveCheckpoint,
  onLoadCheckpoint,
  onRestart,
  onReturnTitle,
  onOpenStory,
  onOpenSettings,
  onOpenAchievements,
}) => {
  const [confirmRestart, setConfirmRestart] = useState(false);

  if (gameState !== 'paused' && gameState !== 'gameover') return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (gameState === 'paused') {
    return (
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/86 p-2.5 sm:p-4 overflow-y-auto"
      >
        <div className="w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-2xl border-2 border-amber-700/60 bg-stone-950 p-5 [@media(max-height:500px)]:p-3.5 text-center text-stone-100 shadow-2xl space-y-3 [@media(max-height:500px)]:space-y-2 my-auto">
          <h2 id="pause-modal-title" className="text-2xl [@media(max-height:500px)]:text-lg font-black text-amber-100">
            إيقاف مؤقت
          </h2>
          {savedCheckpoint && (
            <div className="rounded-lg border border-emerald-700/50 bg-emerald-950/60 px-3 py-1 text-[11px] font-bold text-emerald-200 tabular-nums">
              آخر حفظ نشط: الفصل {savedCheckpoint.chapterNum} ({savedCheckpoint.roomNameAr}) · الألغاز{' '}
              {savedCheckpoint.sigilsSolved}/6
            </div>
          )}
          <div className="space-y-2 [@media(max-height:500px)]:space-y-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setConfirmRestart(false);
                onResume();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-700 py-3 [@media(max-height:500px)]:py-2 text-sm font-extrabold text-white hover:bg-amber-600 cursor-pointer"
            >
              <Play className="h-4 w-4" />
              مواصلة اللعب
            </button>

            <button
              type="button"
              onClick={onSaveCheckpoint}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/70 bg-emerald-950/90 py-2.5 [@media(max-height:500px)]:py-1.5 text-xs font-extrabold text-emerald-100 hover:bg-emerald-900 cursor-pointer"
            >
              <Save className="h-4 w-4 text-emerald-400" />
              حفظ التقدم الآن
            </button>

            {savedCheckpoint && (
              <button
                type="button"
                onClick={() => {
                  setConfirmRestart(false);
                  onLoadCheckpoint();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-600/60 bg-stone-900 py-2.5 [@media(max-height:500px)]:py-1.5 text-xs font-bold text-amber-200 hover:bg-stone-800 cursor-pointer"
              >
                <History className="h-4 w-4 text-amber-400" />
                العودة لآخر نقطة حفظ (الفصل {savedCheckpoint.chapterNum})
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-700 bg-stone-900 py-2.5 [@media(max-height:500px)]:py-1.5 text-xs font-bold text-stone-200 hover:bg-stone-800 cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5 text-amber-400" />
                الإعدادات
              </button>
              <button
                type="button"
                onClick={onOpenAchievements}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-700 bg-stone-900 py-2.5 [@media(max-height:500px)]:py-1.5 text-xs font-bold text-amber-200 hover:bg-stone-800 cursor-pointer"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                الإنجازات
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenStory}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-700/50 bg-stone-900 py-2 [@media(max-height:500px)]:py-1.5 text-xs font-bold text-amber-200 hover:bg-stone-800 cursor-pointer"
            >
              <ScrollText className="h-4 w-4" />
              قراءة ورقة القصة الكاملة
            </button>

            <button
              type="button"
              onClick={() => {
                if (!confirmRestart) {
                  setConfirmRestart(true);
                  return;
                }
                setConfirmRestart(false);
                onRestart();
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2 [@media(max-height:500px)]:py-1.5 text-xs font-bold cursor-pointer ${
                confirmRestart
                  ? 'border-red-400 bg-red-900 text-white'
                  : 'border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              {confirmRestart ? 'اضغط مجدداً لتأكيد البدء من الصفر' : 'إعادة اللعبة من البداية'}
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirmRestart(false);
                onReturnTitle();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-950 py-2 [@media(max-height:500px)]:py-1.5 text-xs font-bold text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              حفظ والخروج للقائمة الرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!snapshot) return null;
  const isVictory = snapshot.outcome === 'victory';

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-2.5 sm:p-4 overflow-y-auto"
    >
      <div
        className={`w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border-2 p-6 [@media(max-height:500px)]:p-4 text-center shadow-2xl space-y-4 [@media(max-height:500px)]:space-y-2.5 my-auto ${
          isVictory
            ? 'border-amber-500 bg-stone-950 text-amber-50'
            : 'border-red-700 bg-[#140708] text-red-50'
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-15 w-15 items-center justify-center rounded-full border-2 border-current bg-black/40">
            {isVictory ? (
              <Award className="h-8 w-8 text-amber-400" />
            ) : (
              <Skull className="h-8 w-8 text-red-500" />
            )}
          </div>
          {isVictory && (
            <div className="rounded-xl border-2 border-amber-400 bg-amber-950/70 px-3.5 py-1.5 text-center">
              <span className="block text-[10px] font-bold text-amber-300">التصنيف</span>
              <span className="text-2xl font-black text-amber-400">{snapshot.rank}</span>
            </div>
          )}
        </div>

        <div>
          <span className="text-[11px] font-bold text-amber-300/90">
            {DIFFICULTY_TUNING[snapshot.difficulty].labelAr}
          </span>
          <h2 id="gameover-modal-title" className="text-2xl sm:text-3xl font-black mt-0.5">
            {isVictory ? 'نجا مارك بوثيقة الميراث!' : 'سقط مارك في قبضة اللعنة!'}
          </h2>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed text-stone-200">{snapshot.causeAr}</p>

        <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-stone-800 bg-black/45 p-3.5 text-xs tabular-nums">
          <div>
            <span className="text-stone-400 block">الألغاز المحلولة</span>
            <strong className="text-base text-amber-400">
              {snapshot.sigilsCollected} / {snapshot.totalSigils}
            </strong>
          </div>
          <div>
            <span className="text-stone-400 block">التحف الأثرية</span>
            <strong className="text-base text-rose-400">
              {snapshot.relicsFound} / {snapshot.totalRelics}
            </strong>
          </div>
          <div>
            <span className="text-stone-400 block">زمن الجولة</span>
            <strong className="text-base text-stone-100">
              {formatTime(snapshot.survivalSeconds)}
            </strong>
          </div>
          <div>
            <span className="text-stone-400 block">المخطوطات المكتشفة</span>
            <strong className="text-base text-stone-100">
              {snapshot.notesFound} / {snapshot.totalNotes}
            </strong>
          </div>
        </div>

        <div className="space-y-2">
          {!isVictory && savedCheckpoint ? (
            <>
              <button
                type="button"
                data-start="true"
                onClick={onLoadCheckpoint}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-400 bg-emerald-900 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg hover:bg-emerald-800 cursor-pointer"
              >
                <History className="h-5 w-5 text-amber-300" />
                <span>
                  العودة لآخر حفظ — الفصل {savedCheckpoint.chapterNum} ({savedCheckpoint.roomNameAr})
                </span>
              </button>

              <button
                type="button"
                onClick={onRestart}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-900 py-2.5 text-xs font-bold text-stone-200 hover:bg-stone-800 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                إعادة اللعبة من البداية
              </button>
            </>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={onRestart}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-extrabold text-white shadow-lg cursor-pointer ${
                isVictory ? 'bg-amber-700 hover:bg-amber-600' : 'bg-red-800 hover:bg-red-700'
              }`}
            >
              <RotateCcw className="h-5 w-5" />
              {isVictory ? 'العب مجدداً لتحطيم رقمك القياسي' : 'حاول مجدداً من البداية'}
            </button>
          )}

          <button
            type="button"
            onClick={onReturnTitle}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-900 py-2.5 text-xs font-bold text-stone-300 hover:bg-stone-800 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            العودة إلى القائمة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};
