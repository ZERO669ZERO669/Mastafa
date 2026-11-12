import React, { useRef } from 'react';
import {
  BookOpen,
  EyeOff,
  Flashlight,
  Hand,
  Map as MapIcon,
  Pause,
  Save,
  Sliders,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Wind,
  Zap,
} from 'lucide-react';
import { HudDomRefs, InteractTarget } from '../game/types';

interface HudOverlayProps {
  hudRefs: React.MutableRefObject<HudDomRefs>;
  sigilsSolved: number;
  totalSigils: number;
  notesFound: number;
  totalNotes: number;
  relicsFound: number;
  totalRelics: number;
  hasSilverLens: boolean;
  hasDeed: boolean;
  isHidden: boolean;
  roomNameAr: string;
  objectiveAr: string;
  interactTarget: InteractTarget | null;
  toastMessage: string | null;
  muted: boolean;
  sprintToggle: boolean;
  crouchToggle: boolean;
  onJoystickMove: (dx: number, dy: number) => void;
  onToggleSprintLock: () => void;
  onToggleCrouchLock: () => void;
  onDash: () => void;
  onToggleFlashlight: () => void;
  onSilverWard: () => void;
  onInteract: () => void;
  onOpenMap: () => void;
  onOpenJournal: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onSaveCheckpoint: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  hudRefs,
  sigilsSolved,
  totalSigils,
  notesFound,
  totalNotes,
  relicsFound,
  totalRelics,
  hasSilverLens,
  hasDeed,
  isHidden,
  roomNameAr,
  objectiveAr,
  interactTarget,
  toastMessage,
  muted,
  sprintToggle,
  crouchToggle,
  onJoystickMove,
  onToggleSprintLock,
  onToggleCrouchLock,
  onDash,
  onToggleFlashlight,
  onSilverWard,
  onInteract,
  onOpenMap,
  onOpenJournal,
  onOpenSettings,
  onOpenAchievements,
  onToggleMute,
  onPause,
  onSaveCheckpoint,
}) => {
  const joyZoneRef = useRef<HTMLDivElement | null>(null);
  const joyKnobRef = useRef<HTMLDivElement | null>(null);
  const joyTouchIdRef = useRef<number | null>(null);

  const updateKnob = (clientX: number, clientY: number) => {
    const zone = joyZoneRef.current;
    const knob = joyKnobRef.current;
    if (!zone || !knob) return;
    const rect = zone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    onJoystickMove(dx / maxR, -dy / maxR);
  };

  const resetKnob = () => {
    joyTouchIdRef.current = null;
    if (joyKnobRef.current) {
      joyKnobRef.current.style.transform = 'translate(0px, 0px)';
    }
    onJoystickMove(0, 0);
  };

  const getInteractLabel = (t: InteractTarget): { title: string; sub?: string; locked?: boolean } => {
    switch (t.type) {
      case 'unhide':
        return { title: 'اضغط للخروج من الخزانة الخشبية' };
      case 'hide':
        return { title: `اضغط للاختباء داخل ${t.spot.nameAr}` };
      case 'note':
        return {
          title: `اضغط لقراءة: ${t.note.titleAr}`,
          sub: t.note.discovered ? 'مخطوطة محفوظة في مفكرتك' : 'مخطوطة مختومة بالشمع',
        };
      case 'plaque':
        return {
          title: `اضغط لتفحّص: ${t.plaque.titleAr}`,
          sub: 'نقش معماري في هذا الجناح',
        };
      case 'deed':
        return {
          title: 'اضغط لانتزاع «وثيقة الميراث المختومة» ومفتاح البوابة!',
          sub: 'تحذير: سيهتزّ قبر الجد في الضريح فور لمس الورقة!',
        };
      case 'door':
        if (t.canUnlock) {
          return {
            title: t.door.isMainExit
              ? 'اضغط لفتح بوابة القلعة الرئيسية والهروب بالورث!'
              : `اضغط لفتح ${t.door.nameAr}`,
          };
        }
        return {
          title: `موصد: ${t.door.nameAr}`,
          sub: t.lockedReasonAr,
          locked: true,
        };
      case 'puzzle':
        if (t.lockedReasonAr) {
          return {
            title: `مغلق: ${t.puzzle.titleAr}`,
            sub: t.lockedReasonAr,
            locked: true,
          };
        }
        return { title: `اضغط لفحص: ${t.puzzle.titleAr}` };
    }
  };

  const promptInfo = interactTarget ? getInteractLabel(interactTarget) : null;

  return (
    <>
      {/* Low-Sanity & Blood Kill Vignette Overlays (mutated directly via hudRefs) */}
      <div
        ref={(el) => {
          hudRefs.current.lowSanityVignette = el;
        }}
        className="pointer-events-none fixed inset-0 z-10 opacity-0 transition-opacity duration-150"
        style={{
          boxShadow: 'inset 0 0 110px 36px rgba(127, 29, 29, 0.85)',
        }}
      />
      <div
        ref={(el) => {
          hudRefs.current.bloodKillOverlay = el;
        }}
        className="pointer-events-none fixed inset-0 z-20 bg-red-950 opacity-0"
      />

      {/* Hidden Wardrobe Peephole Frame when Mark is hiding inside a wooden cabinet */}
      {isHidden && (
        <div className="pointer-events-none fixed inset-0 z-15 flex flex-col justify-between border-[22px] sm:border-[40px] border-stone-950/95">
          <div className="h-5 w-full bg-stone-950/90" />
          <div className="mx-auto rounded bg-stone-950/90 px-4 py-1 text-xs font-bold text-amber-300">
            أنت مختبئ داخل الخزانة — روح الجد لا تراك هنا
          </div>
          <div className="h-5 w-full bg-stone-950/90" />
        </div>
      )}

      {/* First-Person Center Aim Reticle */}
      <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
        <div
          className={`rounded-full transition-all duration-150 ${
            promptInfo && !promptInfo.locked
              ? 'h-3.5 w-3.5 border-2 border-amber-400 bg-amber-300/35 scale-110'
              : crouchToggle
              ? 'h-2.5 w-2.5 border border-emerald-300/80 bg-emerald-400/25'
              : 'h-2 w-2 border border-stone-200/75 bg-white/30'
          }`}
        />
      </div>

      {/* Top Perimeter HUD Bar — Landscape-Safe & 85%+ Unobstructed Center */}
      <div
        dir="rtl"
        className="pointer-events-none fixed inset-x-0 top-0 z-30 flex flex-col gap-1 p-2 sm:p-3 [@media(max-height:500px)]:p-1.5"
      >
        <div className="flex items-start justify-between gap-2">
          {/* Top-Right Corner Cluster: Compact Vitals, Stealth Noise & Castle Progress */}
          <div className="pointer-events-auto flex flex-col gap-1 rounded-xl border border-stone-700/80 bg-stone-950/92 p-2 [@media(max-height:500px)]:p-1.5 text-xs text-stone-100 shadow-lg w-[172px] sm:w-[220px] [@media(max-height:500px)]:w-[186px]">
            {/* Sanity & Battery Compact Bars */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold text-teal-300">الإدراك</span>
                  <span
                    ref={(el) => {
                      hudRefs.current.sanityValue = el;
                    }}
                    className="font-mono text-[10px] text-stone-300 tabular-nums"
                  >
                    100%
                  </span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded bg-stone-800">
                  <div
                    ref={(el) => {
                      hudRefs.current.sanityGhost = el;
                    }}
                    className="absolute inset-y-0 right-0 bg-red-500/60"
                    style={{ width: '100%' }}
                  />
                  <div
                    ref={(el) => {
                      hudRefs.current.sanityFill = el;
                    }}
                    className="absolute inset-y-0 right-0 bg-teal-400"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold text-amber-300">البطارية</span>
                  <span
                    ref={(el) => {
                      hudRefs.current.batteryValue = el;
                    }}
                    className="font-mono text-[10px] text-stone-300 tabular-nums"
                  >
                    100%
                  </span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded bg-stone-800">
                  <div
                    ref={(el) => {
                      hudRefs.current.batteryGhost = el;
                    }}
                    className="absolute inset-y-0 right-0 bg-amber-700/50"
                    style={{ width: '100%' }}
                  />
                  <div
                    ref={(el) => {
                      hudRefs.current.batteryFill = el;
                    }}
                    className="absolute inset-y-0 right-0 bg-amber-400"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Stamina + Acoustic Stealth Noise Row */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div>
                <span className="block text-[10px] font-bold text-sky-300 mb-0.5">اللياقة</span>
                <div className="relative h-1.5 w-full overflow-hidden rounded bg-stone-800">
                  <div
                    ref={(el) => {
                      hudRefs.current.staminaGhost = el;
                    }}
                    className="absolute inset-y-0 right-0 bg-sky-700/40"
                    style={{ width: '100%' }}
                  />
                  <div
                    ref={(el) => {
                      hudRefs.current.staminaFill = el;
                    }}
                    className="absolute inset-y-0 right-0 bg-sky-400"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold text-stone-300">الصوت</span>
                  <span
                    ref={(el) => {
                      hudRefs.current.noiseLabel = el;
                    }}
                    className="text-[10px] font-bold text-emerald-400"
                  >
                    صامت
                  </span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded bg-stone-800">
                  <div
                    ref={(el) => {
                      hudRefs.current.noiseFill = el;
                    }}
                    className="absolute inset-y-0 right-0 bg-emerald-400"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            </div>

            {/* Unboxed Progress Metadata Row */}
            <div className="flex items-center justify-between pt-1 text-[10px] sm:text-[11px] text-stone-300 border-t border-stone-800 tabular-nums">
              <span>
                الألغاز <strong className="text-amber-400">{sigilsSolved}/{totalSigils}</strong>
              </span>
              <span>·</span>
              <span>
                الأدلة <strong className="text-stone-100">{notesFound}/{totalNotes}</strong>
              </span>
              <span>·</span>
              <span>
                التحف <strong className="text-rose-400">{relicsFound}/{totalRelics}</strong>
              </span>
            </div>

            {hasDeed && (
              <div className="rounded bg-red-900/90 px-2 py-0.5 text-center text-[10px] font-bold text-amber-200">
                معك ورقة الميراث — اهرب للبوابة!
              </div>
            )}
          </div>

          {/* Top-Center Room & Concise Requirement Banner */}
          <div className="hidden md:flex flex-col items-center max-w-md rounded-xl border border-amber-700/45 bg-stone-950/92 px-3.5 py-1.5 text-center shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">{roomNameAr}</span>
              <span className="text-stone-600">·</span>
              <span
                ref={(el) => {
                  hudRefs.current.threatBadge = el;
                }}
                className="rounded px-2 py-0.5 text-[11px] font-bold bg-stone-800 text-stone-300"
              >
                هدوء حذر
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-stone-200 leading-snug">{objectiveAr}</p>
          </div>

          {/* Top-Left Corner Cluster: Utility Controls + Strictly Corner-Pinned Desktop Mini-Radar */}
          <div className="pointer-events-auto flex flex-col items-end gap-1.5">
            <div className="flex items-center justify-end gap-1 sm:gap-1.5">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenMap();
                }}
                aria-label="فتح خريطة القلعة الكاملة"
                className="flex h-8 sm:h-9 items-center gap-1 rounded-lg border border-amber-600/55 bg-stone-950/92 px-2 sm:px-2.5 text-xs font-bold text-amber-200 hover:bg-stone-900 cursor-pointer whitespace-nowrap"
              >
                <MapIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                <span className="hidden sm:inline">الخريطة</span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenJournal();
                }}
                aria-label="فتح مفكرة الأدلة والمفاتيح"
                className="flex h-8 sm:h-9 items-center gap-1 rounded-lg border border-amber-600/50 bg-stone-950/92 px-2 sm:px-2.5 text-xs font-bold text-amber-200 hover:bg-stone-900 cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline">الأدلة</span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenAchievements();
                }}
                aria-label="عرض إنجازات اللعبة"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-stone-700 bg-stone-950/92 text-amber-300 hover:bg-stone-900 cursor-pointer"
              >
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenSettings();
                }}
                aria-label="فتح إعدادات اللعبة"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-stone-700 bg-stone-950/92 text-stone-200 hover:bg-stone-900 cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMute();
                }}
                aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-stone-700 bg-stone-950/92 text-stone-200 hover:bg-stone-900 cursor-pointer"
              >
                {muted ? (
                  <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onPause();
                }}
                aria-label="إيقاف اللعبة مؤقتاً"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-stone-700 bg-stone-950/92 text-stone-200 hover:bg-stone-900 cursor-pointer"
              >
                <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSaveCheckpoint();
                }}
                aria-label="حفظ التقدم الحالي"
                className="flex h-8 sm:h-9 items-center gap-1 rounded-lg border border-emerald-600/60 bg-emerald-950/92 px-2 sm:px-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-900 cursor-pointer whitespace-nowrap"
              >
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                <span>حفظ</span>
              </button>
            </div>

            {/* Compact Corner Mini-Radar ONLY on tall wide desktop screens — NEVER on mobile or landscape phones! */}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenMap();
              }}
              aria-label="تكبير خريطة القلعة المصغرة"
              className="hidden xl:block [@media(max-height:640px)]:!hidden overflow-hidden rounded-xl border border-stone-700/80 bg-stone-950/92 p-1 shadow-lg hover:border-amber-500/70 cursor-pointer"
            >
              <canvas
                ref={(el) => {
                  hudRefs.current.minimapCanvas = el;
                }}
                width={84}
                height={84}
                className="block h-[84px] w-[84px] rounded-lg"
              />
            </button>
          </div>
        </div>

        {/* Compact Mobile Objective Strip (hidden on ultra-short landscape phones if needed, single-line truncated) */}
        <div className="md:hidden rounded-lg border border-amber-700/40 bg-stone-950/88 px-2.5 py-1 text-[10px] text-stone-200 leading-tight truncate">
          <span className="font-bold text-amber-400 ml-1">{roomNameAr}:</span>
          <span>{objectiveAr}</span>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="mx-auto mt-0.5 rounded-lg border border-amber-500/60 bg-stone-950/95 px-3.5 py-1 text-xs font-bold text-amber-200 shadow-lg">
            {toastMessage}
          </div>
        )}
      </div>

      {/* Contextual Tappable Interaction Banner */}
      {promptInfo && (
        <div
          dir="rtl"
          className="fixed inset-x-0 bottom-28 sm:bottom-24 [@media(max-height:500px)]:bottom-16 z-30 flex justify-center px-3 pointer-events-none"
        >
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onInteract();
            }}
            className={`pointer-events-auto flex flex-col items-center rounded-xl border px-4 py-2 text-center shadow-2xl transition active:scale-95 cursor-pointer ${
              promptInfo.locked
                ? 'border-red-700/80 bg-stone-950/95 text-red-200'
                : 'border-amber-400 bg-stone-950/95 text-amber-100 hover:bg-stone-900'
            }`}
          >
            <span className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <Hand className="h-4 w-4 text-amber-400 shrink-0" />
              {promptInfo.title}
            </span>
            {promptInfo.sub && (
              <span className="mt-0.5 text-[11px] text-amber-300/90">{promptInfo.sub}</span>
            )}
          </button>
        </div>
      )}

      {/* Unified Hybrid Touch + Mouse/Keyboard Bottom Perimeter Controls */}
      <div
        dir="ltr"
        className="pointer-events-none fixed inset-x-0 bottom-2.5 [@media(max-height:500px)]:bottom-1.5 z-30 flex items-end justify-between px-3 sm:px-6 select-none"
      >
        {/* Left Virtual Thumb Joystick */}
        <div
          ref={joyZoneRef}
          aria-label="عصا الحركة"
          onTouchStart={(e) => {
            if (joyTouchIdRef.current !== null) return;
            const t = e.changedTouches[0];
            joyTouchIdRef.current = t.identifier;
            updateKnob(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
              const t = e.changedTouches[i];
              if (t.identifier === joyTouchIdRef.current) {
                updateKnob(t.clientX, t.clientY);
                break;
              }
            }
          }}
          onTouchEnd={(e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === joyTouchIdRef.current) {
                resetKnob();
                break;
              }
            }
          }}
          onTouchCancel={resetKnob}
          className="pointer-events-auto relative flex h-22 w-22 sm:h-26 sm:w-26 [@media(max-height:500px)]:h-18 [@media(max-height:500px)]:w-18 items-center justify-center rounded-full border-2 border-stone-500/45 bg-stone-950/65 touch-none"
        >
          <div
            ref={joyKnobRef}
            className="h-9 w-9 [@media(max-height:500px)]:h-7 [@media(max-height:500px)]:w-7 rounded-full border border-amber-300/70 bg-amber-500/55 shadow-md"
          />
        </div>

        {/* Right Action Thumb Buttons */}
        <div className="pointer-events-auto flex items-end gap-1.5 sm:gap-2">
          {hasSilverLens && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onSilverWard();
              }}
              aria-label="إطلاق الومضة الفضية لشل الجد"
              className="flex h-11 w-11 sm:h-13 sm:w-13 [@media(max-height:500px)]:h-10 [@media(max-height:500px)]:w-10 flex-col items-center justify-center rounded-full border border-cyan-400/80 bg-cyan-950/90 text-[10px] font-bold text-cyan-100 shadow-lg active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              <span>ومضة</span>
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleCrouchLock();
            }}
            aria-label="التسلل الصامت"
            className={`flex h-11 w-11 sm:h-13 sm:w-13 [@media(max-height:500px)]:h-10 [@media(max-height:500px)]:w-10 flex-col items-center justify-center rounded-full border text-[10px] font-bold shadow-lg active:scale-95 cursor-pointer ${
              crouchToggle
                ? 'border-emerald-400 bg-emerald-950/95 text-emerald-100'
                : 'border-stone-500/70 bg-stone-900/90 text-stone-100'
            }`}
          >
            <EyeOff className="h-3.5 w-3.5 text-emerald-300" />
            <span>تسلل</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onDash();
            }}
            aria-label="اندفاع وتفادي سريع"
            className="flex h-11 w-11 sm:h-13 sm:w-13 [@media(max-height:500px)]:h-10 [@media(max-height:500px)]:w-10 flex-col items-center justify-center rounded-full border border-stone-500/70 bg-stone-900/90 text-[10px] font-bold text-stone-100 shadow-lg active:scale-95 cursor-pointer"
          >
            <Wind className="h-3.5 w-3.5 text-sky-300" />
            <span>تفادي</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleFlashlight();
            }}
            aria-label="تشغيل أو إطفاء الكشاف"
            className="flex h-11 w-11 sm:h-13 sm:w-13 [@media(max-height:500px)]:h-10 [@media(max-height:500px)]:w-10 flex-col items-center justify-center rounded-full border border-amber-500/70 bg-stone-900/90 text-[10px] font-bold text-amber-100 shadow-lg active:scale-95 cursor-pointer"
          >
            <Flashlight className="h-3.5 w-3.5 text-amber-400" />
            <span>كشاف</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleSprintLock();
            }}
            aria-label="تبديل الركض السريع"
            className={`flex h-12 w-12 sm:h-14 sm:w-14 [@media(max-height:500px)]:h-11 [@media(max-height:500px)]:w-11 flex-col items-center justify-center rounded-full border text-[11px] font-bold shadow-lg active:scale-95 cursor-pointer ${
              sprintToggle
                ? 'border-sky-400 bg-sky-900/95 text-sky-100'
                : 'border-stone-500/70 bg-stone-900/90 text-stone-100'
            }`}
          >
            <Zap className="h-4 w-4 text-sky-300" />
            <span>ركض</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onInteract();
            }}
            aria-label="التفاعل مع الأبواب والألغاز والأدلة"
            className={`flex h-13 w-13 sm:h-15 sm:w-15 [@media(max-height:500px)]:h-11 [@media(max-height:500px)]:w-11 flex-col items-center justify-center rounded-full border text-xs font-bold shadow-xl active:scale-95 cursor-pointer ${
              promptInfo && !promptInfo.locked
                ? 'border-amber-300 bg-amber-700/95 text-white'
                : 'border-stone-500/70 bg-stone-900/90 text-stone-200'
            }`}
          >
            <Hand className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>تفاعل</span>
          </button>
        </div>
      </div>
    </>
  );
};
