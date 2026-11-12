import React from 'react';
import { RotateCcw, Sliders, Volume2, X } from 'lucide-react';
import { DifficultyMode, GameSettings, GraphicsQuality } from '../game/types';
import { DEFAULT_GAME_SETTINGS, DIFFICULTY_TUNING } from '../game/achievements';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  if (!isOpen) return null;

  const difficulties: DifficultyMode[] = ['story', 'normal', 'nightmare'];
  const qualities: Array<{ id: GraphicsQuality; labelAr: string }> = [
    { id: 'medium', labelAr: 'متوسط (أداء أسرع)' },
    { id: 'ultra', labelAr: 'فائق (إضاءة وجزيئات كاملة)' },
  ];

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-xl rounded-2xl border-2 border-amber-700/70 bg-stone-950 text-stone-100 shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-5 w-5 text-amber-400" />
            <h2 id="settings-modal-title" className="text-lg font-extrabold text-amber-50">
              إعدادات اللعبة والرسوميات
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الإعدادات"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto text-sm">
          {/* 1. Difficulty Selector */}
          <div>
            <span className="block text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-2">
              مستوى الصعوبة وتوازن المطاردة
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {difficulties.map((d) => {
                const active = settings.difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, difficulty: d })}
                    className={`rounded-xl border p-3 text-right transition cursor-pointer ${
                      active
                        ? 'border-amber-400 bg-amber-950/60 text-amber-100'
                        : 'border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <div className="font-extrabold text-xs sm:text-sm">
                      {DIFFICULTY_TUNING[d].labelAr}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-stone-400">
              {DIFFICULTY_TUNING[settings.difficulty].descAr}
            </p>
          </div>

          {/* 2. Master Audio Volume */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="setting-master-volume"
                className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300"
              >
                <Volume2 className="h-4 w-4" />
                مستوى الصوت الرئيسي
              </label>
              <span className="font-mono text-xs font-bold text-stone-200 tabular-nums">
                {settings.masterVolume}%
              </span>
            </div>
            <input
              id="setting-master-volume"
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.masterVolume}
              onChange={(e) =>
                onUpdateSettings({ ...settings, masterVolume: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* 3. Field of View (FOV) & Look Sensitivity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="setting-fov"
                  className="text-xs font-extrabold text-stone-200"
                >
                  مجال الرؤية (FOV)
                </label>
                <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                  {settings.fov}°
                </span>
              </div>
              <input
                id="setting-fov"
                type="range"
                min={65}
                max={90}
                step={1}
                value={settings.fov}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, fov: Number(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="setting-sensitivity"
                  className="text-xs font-extrabold text-stone-200"
                >
                  حساسية دوران الكاميرا
                </label>
                <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                  {settings.lookSensitivity.toFixed(1)}x
                </span>
              </div>
              <input
                id="setting-sensitivity"
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={settings.lookSensitivity}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    lookSensitivity: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Graphics Preset & Invert Y */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="block text-xs font-extrabold text-stone-200 mb-1.5">
                جودة الإضاءة والجزيئات 3D
              </span>
              <div className="flex gap-2">
                {qualities.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, graphicsQuality: q.id })
                    }
                    className={`flex-1 rounded-lg border px-2.5 py-2 text-xs font-bold cursor-pointer ${
                      settings.graphicsQuality === q.id
                        ? 'border-amber-400 bg-amber-950/60 text-amber-100'
                        : 'border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    {q.labelAr}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <label className="flex w-full items-center justify-between rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2.5 cursor-pointer">
                <span className="text-xs font-bold text-stone-200">
                  عكس محور النظر العمودي (Invert Y)
                </span>
                <input
                  type="checkbox"
                  checked={settings.invertY}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, invertY: e.target.checked })
                  }
                  className="h-4 w-4 accent-amber-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between gap-3 border-t border-stone-800 pt-4">
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...DEFAULT_GAME_SETTINGS })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900 px-3.5 py-2 text-xs font-bold text-stone-300 hover:bg-stone-800 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              استعادة الافتراضي
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-extrabold text-white hover:bg-amber-600 cursor-pointer"
            >
              حفظ ومتابعة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
