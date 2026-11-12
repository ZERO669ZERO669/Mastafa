import React from 'react';
import { BookOpen, Eye, Gem, KeyRound, ScrollText, X } from 'lucide-react';
import { CluePlaque, InventoryItemId, LoreNote, RelicItem } from '../game/types';
import { INVENTORY_CATALOG } from '../game/puzzles';

interface JournalModalProps {
  isOpen: boolean;
  notes: LoreNote[];
  plaques?: CluePlaque[];
  inventory: InventoryItemId[];
  relics: RelicItem[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onOpenStoryLetter: () => void;
  onClose: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  notes,
  plaques = [],
  inventory,
  relics,
  activeNoteId,
  onSelectNote,
  onOpenStoryLetter,
  onClose,
}) => {
  if (!isOpen) return null;

  const discoveredNotes = notes.filter((n) => n.discovered);
  const discoveredPlaques = plaques.filter((p) => p.discovered);
  const collectedRelics = relics.filter((r) => r.collected);
  const selected =
    discoveredNotes.find((n) => n.id === activeNoteId) || discoveredNotes[0] || null;

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="journal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-amber-700/65 bg-stone-950 text-stone-100 shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <h2 id="journal-modal-title" className="text-base sm:text-lg font-bold text-amber-50 tabular-nums">
              حقيبة مارك ومفكرة القلعة ({discoveredNotes.length}/{notes.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenStoryLetter}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/60 bg-amber-950/60 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-900/60 cursor-pointer whitespace-nowrap"
            >
              <ScrollText className="h-3.5 w-3.5" />
              رسالة القصة الكاملة
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق المفكرة"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Collected Castle Keys & Inheritance Deed */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 mb-2 tabular-nums">
              المفاتيح والمقتنيات ({inventory.length})
            </h3>
            {inventory.length === 0 ? (
              <p className="rounded-xl border border-stone-800 bg-stone-900/70 px-3.5 py-2.5 text-xs text-stone-400">
                لم تحصل على أي مفتاح بعد — وجّه الكشاف نحو المنبر الذهبي أمام الدرج الكبير في البهو لقراءة أرقام قفل الساعة!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inventory.map((itemId) => {
                  const meta = INVENTORY_CATALOG[itemId];
                  return (
                    <div
                      key={itemId}
                      className="flex items-start gap-2.5 rounded-xl border border-amber-700/40 bg-stone-900 p-2.5"
                    >
                      <KeyRound className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-amber-100">{meta.nameAr}</div>
                        <div className="text-[11px] text-stone-400 leading-snug">{meta.descAr}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discovered Architectural Wall Plaques */}
          {plaques.length > 0 && (
            <div className="border-t border-stone-800 pt-3">
              <h3 className="text-xs font-bold text-amber-400 mb-2 tabular-nums">
                النقوش الجدارية والأرقام المكتشفة ({discoveredPlaques.length}/{plaques.length})
              </h3>
              {discoveredPlaques.length === 0 ? (
                <p className="rounded-xl border border-stone-800 bg-stone-900/70 px-3.5 py-2.5 text-xs text-stone-400">
                  اقترب من اللوحات المنقوشة في كل قاعة (بدءاً من قاعدة الدرج الكبير في البهو) واضغط [E] لحفظ الأرقام والشيفرات هنا!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {discoveredPlaques.map((pl) => (
                    <div
                      key={pl.id}
                      className="rounded-xl border border-amber-600/50 bg-[#1a1107] p-2.5 space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                        <Eye className="h-3.5 w-3.5 shrink-0" />
                        <span>{pl.roomNameAr}</span>
                      </div>
                      <div
                        dir="auto"
                        className="font-mono text-base font-extrabold text-amber-200 tabular-nums"
                      >
                        {pl.featuredCode}
                      </div>
                      <div className="text-[11px] text-stone-300 leading-snug">
                        {pl.subInscriptionAr}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discovered & Undiscovered Notes Tracker */}
          <div className="border-t border-stone-800 pt-3">
            <h3 className="text-xs font-bold text-amber-400 mb-2 tabular-nums">
              المخطوطات وأدلة الألغاز ({discoveredNotes.length}/{notes.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 max-h-60 overflow-y-auto pl-1">
                {notes.map((n) =>
                  n.discovered ? (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onSelectNote(n.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-right text-xs font-bold cursor-pointer ${
                        selected?.id === n.id
                          ? 'border-amber-500 bg-amber-950/70 text-amber-100'
                          : 'border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <div>{n.titleAr}</div>
                      <div className="mt-0.5 text-[10px] font-normal text-amber-300/80">
                        ✓ مكتشفة · {n.roomNameAr}
                      </div>
                    </button>
                  ) : (
                    <div
                      key={n.id}
                      className="w-full rounded-lg border border-stone-800/80 bg-stone-950/80 px-3 py-2 text-right text-xs text-stone-500"
                    >
                      <div className="font-semibold text-stone-400">
                        {n.isOptionalLore ? 'يوميّة سرية مفقودة' : 'دليل لغز لم يُلتقط بعد'}
                      </div>
                      <div className="mt-0.5 text-[10px] text-amber-400/75">
                        ابحث في: {n.roomNameAr}
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="sm:col-span-2 rounded-xl border border-stone-800 bg-stone-900 p-4 space-y-2.5">
                {selected ? (
                  <>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-stone-400">
                      <span>{selected.roomNameAr}</span>
                      <span>·</span>
                      <span>{selected.isOptionalLore ? 'أرشيف عائلة مالاكور' : 'دليل جناح أساسي'}</span>
                    </div>
                    <h4 className="text-sm font-bold text-amber-200">{selected.titleAr}</h4>
                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                      {selected.bodyAr}
                    </p>
                  </>
                ) : (
                  <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                    لم تلتقط أي مخطوطة بعد — استعن بقائمة الغرف على اليمين أو افتح الخريطة [Tab] لرؤية مواقع المخطوطات المضيئة بالشموع واللوحات المنقوشة على الجدران!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Collected Cursed Family Relics */}
          <div className="border-t border-stone-800 pt-3">
            <h3 className="text-xs font-bold text-rose-400 mb-2 tabular-nums">
              تحف آل مالاكور الأثرية ({collectedRelics.length}/{relics.length})
            </h3>
            {collectedRelics.length === 0 ? (
              <p className="rounded-xl border border-stone-800 bg-stone-900/70 px-3.5 py-2.5 text-xs text-stone-400">
                توجد ١٢ تحفة ذهبية مخبأة في أجنحة القلعة وقاعاتها الاختيارية تمنحك راحة إدراكية وترفع تصنيف التختيم!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {collectedRelics.map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-start gap-2.5 rounded-xl border border-rose-700/40 bg-stone-900 p-2.5"
                  >
                    <Gem className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-100">{rel.nameAr}</div>
                      <div className="text-[11px] text-stone-400 leading-snug">{rel.loreAr}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
