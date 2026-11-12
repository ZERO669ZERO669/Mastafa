import React, { useState } from 'react';
import { BookOpen, Eye, RotateCcw, X } from 'lucide-react';
import { CluePlaque, LoreNote, PuzzleStation } from '../game/types';
import {
  BEDROOM_CHIMES,
  ELIXIR_VIALS,
  INITIAL_SAFE_GRID,
  MONITOR_CHANNEL_LABELS,
  STEAM_VALVES,
  TOMB_SEAL_SYMBOLS,
  VEILED_STATUES,
  computeSteamPressure,
  evaluateElixirMix,
  traceSafeLaserBeam,
  validateBedroomChime,
  validateGrandfatherClock,
  validateSecurityMonitors,
  validateStatueOffering,
  validateTombSeal,
} from '../game/puzzles';

interface PuzzleModalProps {
  puzzle: PuzzleStation | null;
  relatedNote: LoreNote | undefined;
  relatedPlaque?: CluePlaque;
  onClose: () => void;
  onSolved: (puzzle: PuzzleStation) => void;
  onPlayBellTone: (freq: number) => void;
  onPlayClick?: (pitch?: number) => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  puzzle,
  relatedNote,
  relatedPlaque,
  onClose,
  onSolved,
  onPlayBellTone,
  onPlayClick,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showDiscoveredNote, setShowDiscoveredNote] = useState<boolean>(true);

  // 1. Grandfather Clock state (4 digits)
  const [clockDigits, setClockDigits] = useState<[number, number, number, number]>([0, 0, 0, 0]);

  // 2. Steam Valves state (5 valves)
  const [valveFlags, setValveFlags] = useState<boolean[]>([false, false, false, false, false]);

  // 3. Security CRT Monitors state (4 monitors, each channel 1..4)
  const [monitorChannels, setMonitorChannels] = useState<[number, number, number, number]>([
    1, 1, 1, 1,
  ]);

  // 4. Infirmary Elixir Vials state (5 vials)
  const [vialFlags, setVialFlags] = useState<boolean[]>([false, false, false, false, false]);

  // 5. Six Veiled Statues sequence
  const [statueSeq, setStatueSeq] = useState<number[]>([]);

  // 6. Royal Safe Mirror Grid (3x3)
  const [safeGrid, setSafeGrid] = useState<number[]>([...INITIAL_SAFE_GRID]);

  // 7. Victor's four haunted bedchamber chimes
  const [bedroomChimeSequence, setBedroomChimeSequence] = useState<number[]>([]);

  // 8. Three rotating marble seal dials in the crypt
  const [tombSealDials, setTombSealDials] = useState<[number, number, number]>([0, 0, 0]);

  if (!puzzle) return null;

  const steamResult = computeSteamPressure(valveFlags);
  const elixirResult = evaluateElixirMix(vialFlags);
  const beamResult = traceSafeLaserBeam(safeGrid);

  const cycleClockDigit = (idx: number, delta: number) => {
    onPlayClick?.(delta > 0 ? 1.08 : 0.92);
    setFeedback(null);
    setClockDigits((prev) => {
      const next = [...prev] as [number, number, number, number];
      next[idx] = (next[idx] + delta + 10) % 10;
      return next;
    });
  };

  const submitClock = () => {
    if (validateGrandfatherClock(clockDigits)) {
      onSolved(puzzle);
    } else {
      onPlayClick?.(0.65);
      setFeedback('التروس لا تدور... افحص المنبر الذهبي أمام الدرج أو المخطوطة في البهو الملكي لمعرفة الأرقام الأربعة.');
    }
  };

  const toggleValve = (idx: number) => {
    onPlayClick?.(0.88 + idx * 0.05);
    setFeedback(null);
    setValveFlags((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const submitValves = () => {
    if (steamResult.solved) {
      onSolved(puzzle);
    } else {
      onPlayClick?.(0.65);
      setFeedback(
        `المؤشر يقرأ ${steamResult.psi} PSI مع ${steamResult.openCount} صمامات مفتوحة — افحص لوحة المرجل على الجدار الغربي.`
      );
    }
  };

  const cycleMonitor = (idx: number) => {
    onPlayClick?.(1.15);
    setFeedback(null);
    setMonitorChannels((prev) => {
      const next = [...prev] as [number, number, number, number];
      next[idx] = (next[idx] % 4) + 1;
      return next;
    });
  };

  const submitMonitors = () => {
    if (validateSecurityMonitors(monitorChannels)) {
      onSolved(puzzle);
    } else {
      onPlayClick?.(0.65);
      setFeedback('رفض النظام التبديل — وجّه الكشاف نحو لوح جدول الحراسة الأبيض داخل القبو.');
    }
  };

  const toggleVial = (idx: number) => {
    onPlayClick?.(1.22);
    setFeedback(null);
    setVialFlags((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const submitElixir = () => {
    if (elixirResult.solved) {
      onSolved(puzzle);
    } else {
      onPlayClick?.(0.65);
      setFeedback(
        `التفاعل غير مستقر (${elixirResult.totalMl} مل من ${elixirResult.count} قوارير) — افحص لوح المعادلة الكيميائية على جدار المصحة.`
      );
    }
  };

  const tapStatue = (num: number, freq: number) => {
    onPlayBellTone(freq);
    setFeedback(null);
    const next = [...statueSeq, num];
    if (next.length === 4) {
      if (validateStatueOffering(next)) {
        onSolved(puzzle);
      } else {
        setStatueSeq([]);
        setFeedback('انطفأت الشعلات! ترتيب التماثيل غير صحيح، راجع اللوح الرخامي على الجدار الشرقي.');
      }
    } else {
      setStatueSeq(next);
    }
  };

  const toggleSafeMirror = (idx: number) => {
    onPlayClick?.(1.3);
    setFeedback(null);
    const next = safeGrid.map((cell, i) => (i === idx ? (cell + 1) % 3 : cell));
    setSafeGrid(next);
    const trace = traceSafeLaserBeam(next);
    if (trace.solved) {
      onSolved(puzzle);
    }
  };

  const tapBedroomChime = (num: number, freq: number) => {
    onPlayBellTone(freq);
    setFeedback(null);
    const next = [...bedroomChimeSequence, num];
    if (next.length === 4) {
      if (validateBedroomChime(next)) {
        onSolved(puzzle);
      } else {
        setBedroomChimeSequence([]);
        setFeedback('اختلّ اللحن وانطفأت الأجراس. اقرأ النوتة التي خلف المرآة ثم أعد المحاولة.');
      }
    } else {
      setBedroomChimeSequence(next);
    }
  };

  const cycleTombSealDial = (idx: number) => {
    onPlayClick?.(0.8 + idx * 0.1);
    setFeedback(null);
    setTombSealDials((prev) => {
      const next = [...prev] as [number, number, number];
      next[idx] = (next[idx] + 1) % TOMB_SEAL_SYMBOLS.length;
      return next;
    });
  };

  const submitTombSeal = () => {
    if (validateTombSeal(tombSealDials)) {
      onSolved(puzzle);
    } else {
      onPlayClick?.(0.55);
      setFeedback('أصدر الختم صريراً ولم ينفتح. افحص نقش الأقراص قرب التابوت؛ رمز الهلال مضلل.');
    }
  };

  const hasAnyDiscoveredClue = Boolean(relatedPlaque?.discovered || relatedNote?.discovered);

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="castle-puzzle-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-3 sm:p-5 overflow-y-auto"
    >
      <div className="w-full max-w-xl rounded-2xl border border-amber-700/60 bg-stone-950 text-stone-100 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900/90 px-4 py-3.5">
          <div>
            <span className="text-xs font-semibold text-amber-400">
              الفصل {puzzle.chapter} · {puzzle.districtAr}
            </span>
            <h2 id="castle-puzzle-title" className="text-base sm:text-xl font-bold text-amber-50">
              {puzzle.titleAr}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة اللغز"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Concise Requirement Only — Zero Unfound Spoilers, Plus Saved Plaque/Note Display Once Inspected! */}
          <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-3.5 text-xs sm:text-sm space-y-2">
            <p className="font-bold text-amber-100 leading-relaxed">{puzzle.goalAr}</p>
            {hasAnyDiscoveredClue ? (
              <div className="pt-1 space-y-2 border-t border-stone-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    {relatedPlaque?.discovered ? (
                      <Eye className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    ) : (
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    )}
                    الأدلة التي اكتشفتها لهذا القفل
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDiscoveredNote((prev) => !prev)}
                    className="rounded-md border border-amber-600/50 bg-amber-950/60 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-900/60 cursor-pointer"
                  >
                    {showDiscoveredNote ? 'إخفاء الدليل' : 'إظهار الدليل المحفوظ'}
                  </button>
                </div>
                {showDiscoveredNote && (
                  <div className="space-y-2">
                    {relatedPlaque?.discovered && (
                      <div className="rounded-lg border border-amber-500/60 bg-[#1a1107] p-2.5 text-center">
                        <div className="text-[11px] text-amber-400 font-bold mb-1">
                          {relatedPlaque.titleAr}
                        </div>
                        <div
                          dir="auto"
                          className="font-mono text-lg sm:text-2xl font-extrabold text-amber-200 tabular-nums"
                        >
                          {relatedPlaque.featuredCode}
                        </div>
                        <div className="mt-1 text-[11px] text-stone-300">
                          {relatedPlaque.subInscriptionAr}
                        </div>
                      </div>
                    )}
                    {relatedNote?.discovered && (
                      <p className="rounded-lg border border-amber-700/35 bg-stone-950/90 p-2.5 text-xs text-stone-200 leading-relaxed">
                        {relatedNote.bodyAr}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400">
                لم تفحص دليل هذا اللغز بعد — وجّه الكشاف نحو النقش المعدني أو المخطوطة المضيئة بالشمعة في{' '}
                <strong className="text-amber-300">{relatedNote?.roomNameAr || puzzle.districtAr}</strong>{' '}
                واضغط <strong className="text-amber-200">[E] / تفاعل</strong> لقراءتها عن قرب.
              </p>
            )}
          </div>

          {/* 1. CLOCK PUZZLE */}
          {puzzle.id === 'clock' && (
            <div className="space-y-4">
              <div dir="ltr" className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-sm mx-auto">
                {clockDigits.map((digit, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center rounded-xl border border-amber-600/60 bg-stone-900 p-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => cycleClockDigit(idx, 1)}
                      aria-label={`زيادة الخانة ${idx + 1}`}
                      className="w-full rounded bg-stone-800 py-1.5 text-sm font-bold text-amber-300 hover:bg-stone-700 cursor-pointer"
                    >
                      +
                    </button>
                    <span className="my-2.5 font-mono text-3xl font-bold text-amber-100 tabular-nums">
                      {digit}
                    </span>
                    <button
                      type="button"
                      onClick={() => cycleClockDigit(idx, -1)}
                      aria-label={`إنقاص الخانة ${idx + 1}`}
                      className="w-full rounded bg-stone-800 py-1.5 text-sm font-bold text-amber-300 hover:bg-stone-700 cursor-pointer"
                    >
                      -
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={submitClock}
                className="w-full rounded-xl bg-amber-700 py-3 text-sm font-bold text-white hover:bg-amber-600 cursor-pointer"
              >
                تجربة فتح قفل الساعة
              </button>
            </div>
          )}

          {/* 2. STEAM VALVES PUZZLE */}
          {puzzle.id === 'valves' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-900 px-4 py-2.5 text-xs sm:text-sm tabular-nums">
                <span>
                  الصمامات المفتوحة:{' '}
                  <strong className="text-amber-300">{steamResult.openCount}</strong>
                </span>
                <span>
                  قراءة المرجل الحالية:{' '}
                  <strong className="text-amber-300">{steamResult.psi} PSI</strong>
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {STEAM_VALVES.map((v, idx) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleValve(idx)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                      valveFlags[idx]
                        ? 'border-red-500 bg-red-950/70 text-amber-100'
                        : 'border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <span>{v.labelAr}</span>
                    <span className="text-xs text-stone-400">
                      {valveFlags[idx] ? 'مفتوح' : 'مغلق'}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={submitValves}
                className="w-full rounded-xl bg-amber-700 py-3 text-sm font-bold text-white hover:bg-amber-600 cursor-pointer"
              >
                اختبار ضغط المرجل
              </button>
            </div>
          )}

          {/* 3. SECURITY CRT MONITORS PUZZLE */}
          {puzzle.id === 'monitors' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {monitorChannels.map((ch, idx) => {
                  const info = MONITOR_CHANNEL_LABELS[ch - 1];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => cycleMonitor(idx)}
                      className="flex flex-col items-start rounded-xl border border-sky-600/60 bg-slate-950 p-3.5 text-right hover:border-sky-400 cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-sky-400">
                        الشاشة رقم {idx + 1} · اضغط لتبديل القناة
                      </span>
                      <span className="mt-1 text-sm font-bold text-sky-100">
                        {info.nameAr}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={submitMonitors}
                className="w-full rounded-xl bg-sky-700 py-3 text-sm font-bold text-white hover:bg-sky-600 cursor-pointer"
              >
                تأكيد مصفوفة المراقبة
              </button>
            </div>
          )}

          {/* 4. INFIRMARY ELIXIR PUZZLE */}
          {puzzle.id === 'elixir' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-900 px-4 py-2.5 text-xs sm:text-sm tabular-nums">
                <span>
                  القوارير الممزوجة:{' '}
                  <strong className="text-cyan-300">{elixirResult.count}</strong>
                </span>
                <span>
                  الحجم الحالي في الدورق:{' '}
                  <strong className="text-cyan-300">{elixirResult.totalMl} مل</strong>
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {ELIXIR_VIALS.map((vial, idx) => (
                  <button
                    key={vial.id}
                    type="button"
                    onClick={() => toggleVial(idx)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold cursor-pointer ${
                      vialFlags[idx]
                        ? 'border-cyan-400 bg-cyan-950/70 text-cyan-100'
                        : 'border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <span>{vial.nameAr}</span>
                    <span className="text-xs text-stone-400">
                      {vialFlags[idx] ? 'مُضاف' : 'إضافة'}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={submitElixir}
                className="w-full rounded-xl bg-cyan-700 py-3 text-sm font-bold text-white hover:bg-cyan-600 cursor-pointer"
              >
                مزج المركّب الكيميائي
              </button>
            </div>
          )}

          {/* 5. SIX VEILED STATUES PUZZLE */}
          {puzzle.id === 'statues' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-900 px-4 py-2.5 text-xs">
                <span>
                  الشعلات المضاءة:{' '}
                  <strong className="text-amber-300">
                    {statueSeq.length > 0 ? statueSeq.join(' ← ') : 'لم تُشعل بعد'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setStatueSeq([])}
                  className="inline-flex items-center gap-1 text-stone-300 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  تصفير
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {VEILED_STATUES.map((st) => {
                  const activeIdx = statueSeq.indexOf(st.num);
                  return (
                    <button
                      key={st.num}
                      type="button"
                      onClick={() => tapStatue(st.num, st.freq)}
                      className={`rounded-xl border p-3 text-center transition cursor-pointer ${
                        activeIdx >= 0
                          ? 'border-amber-400 bg-amber-950/70 text-amber-100'
                          : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      <div className="text-lg font-bold text-amber-400 tabular-nums">#{st.num}</div>
                      <div className="mt-0.5 text-xs font-semibold">{st.nameAr}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. ROYAL MIRROR SAFE PUZZLE (Strictly LTR so Top-Left Emitter & Bottom-Right Lock match 100%) */}
          {puzzle.id === 'safe' && (
            <div dir="ltr" className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300 px-2">
                <span>⚡ شعاع الليزر (يدخل من صف ١ يسار ▶)</span>
                <span>(▶ يخرج من صف ٣ يمين) قفل الخزنة 🔓</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="flex flex-col justify-between h-[252px] py-7 text-xs font-bold text-amber-400 select-none">
                  <span>▶</span>
                  <span className="opacity-20">·</span>
                  <span className="opacity-20">·</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 w-[252px]">
                  {safeGrid.map((cell, idx) => {
                    const r = Math.floor(idx / 3);
                    const c = idx % 3;
                    const stepOrder = beamResult.visitedCells.findIndex((v) => v.r === r && v.c === c);
                    const lit = stepOrder >= 0;
                    const symbol = cell === 1 ? '╱' : cell === 2 ? '╲' : '·';
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleSafeMirror(idx)}
                        aria-label={`مربع المرآة صف ${r + 1} عمود ${c + 1}`}
                        className={`relative h-20 rounded-xl border text-2xl font-bold transition cursor-pointer ${
                          lit
                            ? 'border-amber-400 bg-amber-950/85 text-amber-200 shadow-inner'
                            : 'border-stone-700 bg-stone-900 text-stone-400 hover:bg-stone-800'
                        }`}
                      >
                        {symbol}
                        {lit && (
                          <span className="absolute top-1 left-1.5 text-[10px] font-mono text-amber-400/90">
                            {stepOrder + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col justify-between h-[252px] py-7 text-xs font-bold text-emerald-400 select-none">
                  <span className="opacity-20">·</span>
                  <span className="opacity-20">·</span>
                  <span>▶🔓</span>
                </div>
              </div>
            </div>
          )}

          {/* 7. BEDCHAMBER CHIME SEQUENCE */}
          {puzzle.id === 'bedroom_chime' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-700/50 bg-[#17110a] p-3 text-center">
                <div className="text-xs font-bold text-amber-300">تسلسل النغمات التي عزفتها</div>
                <div dir="ltr" className="mt-1 font-mono text-xl font-extrabold tracking-[0.35em] text-amber-100">
                  {bedroomChimeSequence.length ? bedroomChimeSequence.join(' · ') : '— · — · — · —'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {BEDROOM_CHIMES.map((chime) => (
                  <button
                    key={chime.num}
                    type="button"
                    onClick={() => tapBedroomChime(chime.num, chime.freq)}
                    className="rounded-xl border border-amber-600/55 bg-stone-900 px-3 py-4 text-center text-sm font-bold text-amber-100 hover:border-amber-300 hover:bg-amber-950/60 cursor-pointer"
                  >
                    <span className="mb-1 block text-2xl text-amber-400">♬</span>
                    {chime.nameAr}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setBedroomChimeSequence([])}
                className="w-full rounded-xl border border-stone-700 bg-stone-900 py-2.5 text-xs font-bold text-stone-300 hover:bg-stone-800 cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> إعادة النوتة من البداية</span>
              </button>
            </div>
          )}

          {/* 8. THREE-DIAL MARBLE TOMB SEAL */}
          {puzzle.id === 'tomb_seal' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                {tombSealDials.map((symbol, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => cycleTombSealDial(idx)}
                    aria-label={`تدوير قرص الختم ${idx + 1}`}
                    className="rounded-xl border border-stone-600 bg-gradient-to-b from-stone-800 to-stone-950 px-2 py-5 text-center shadow-inner hover:border-amber-400 cursor-pointer"
                  >
                    <span className="block text-[10px] font-bold text-stone-400">القرص {idx + 1}</span>
                    <span className="mt-1 block text-base sm:text-lg font-extrabold text-amber-200">{TOMB_SEAL_SYMBOLS[symbol]}</span>
                    <span className="mt-2 block text-[10px] text-amber-500">اضغط للتدوير</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={submitTombSeal}
                className="w-full rounded-xl bg-amber-800 py-3 text-sm font-extrabold text-amber-50 hover:bg-amber-700 cursor-pointer"
              >
                كسر ختم الضريح
              </button>
            </div>
          )}

          {/* Validation Feedback */}
          {feedback && (
            <div className="rounded-xl border border-red-600/60 bg-red-950/70 px-3.5 py-2.5 text-xs font-bold text-red-200">
              {feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
