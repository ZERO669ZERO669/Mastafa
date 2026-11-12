import React from 'react';
import { Compass, DoorOpen, Gem, Lock, Map as MapIcon, ScrollText, Shield, X } from 'lucide-react';
import { CastleDoor, HidingSpot, LoreNote, PuzzleStation, RelicItem } from '../game/types';
import { CASTLE_ROOMS } from '../game/castleMap';

interface CastleMapModalProps {
  isOpen: boolean;
  playerX: number;
  playerZ: number;
  playerRotY: number;
  currentRoomNameAr: string;
  doors: CastleDoor[];
  hidingSpots: HidingSpot[];
  relics: RelicItem[];
  notes: LoreNote[];
  puzzles: PuzzleStation[];
  onClose: () => void;
}

const OPTIONAL_ROOM_IDS = new Set([
  'gothic_library',
  'banquet_hall',
  'kitchen_cellar',
  'moonlit_courtyard',
  'dungeon_cells',
  'master_bedroom',
]);

// Short clean labels for inside architectural SVG rooms (matching exact RoomId keys)
const SHORT_ROOM_LABELS: Record<string, string> = {
  foyer: 'البهو الملكي',
  steam_gallery: 'الرواق الغربي',
  security_bunker: 'قبو المراقبة',
  portrait_hall: 'ممر اللوحات',
  infirmary: 'المصحة الشرقية',
  statue_hall: 'قاعة التماثيل',
  trophy_study: 'مكتب الجد السري',
  crypt: 'سرداب الضريح',
  gothic_library: 'المكتبة القوطية',
  banquet_hall: 'قاعة المأدبة',
  kitchen_cellar: 'المطبخ والقبو',
  moonlit_courtyard: 'حديقة الضباب',
  dungeon_cells: 'زنازين القبو',
  master_bedroom: 'جناح نوم الجد',
};

const ROOM_LABEL_OFFSET_Z: Record<string, number> = {
  foyer: -5.2,
  statue_hall: 4.2,
  steam_gallery: 2.2,
  security_bunker: 2.4,
  infirmary: 2.4,
  trophy_study: 2.2,
};

export const CastleMapModal: React.FC<CastleMapModalProps> = ({
  isOpen,
  playerX,
  playerZ,
  playerRotY,
  currentRoomNameAr,
  doors,
  hidingSpots,
  relics,
  notes,
  puzzles,
  onClose,
}) => {
  if (!isOpen) return null;

  // World X: [-55 .. +47] (width 102), World Z: [-45 .. +53] (height 98)
  const minWX = -55;
  const minWZ = -45;
  const viewW = 102;
  const viewH = 98;

  const lookDeg = ((-playerRotY * 180) / Math.PI) % 360;

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="castle-map-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-2 sm:p-5 overflow-y-auto"
    >
      <div className="w-full max-w-3xl max-h-[94vh] flex flex-col rounded-2xl border border-amber-700/65 bg-stone-950 text-stone-100 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900 px-3.5 py-2.5 [@media(max-height:500px)]:py-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <h2 id="castle-map-modal-title" className="text-sm sm:text-lg [@media(max-height:500px)]:text-xs font-bold text-amber-50">
                المخطط المعماري لقلعة بلاكثورن (١٤ جناحاً وقاعة)
              </h2>
              <p className="text-[11px] [@media(max-height:500px)]:text-[10px] text-stone-400">
                موقعك الحالي: <strong className="text-amber-300">{currentRoomNameAr}</strong> · اضغط [Tab] للإغلاق
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق خريطة القلعة"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* SVG Architectural Blueprint */}
        <div className="p-2.5 sm:p-4 space-y-2.5 overflow-y-auto">
          <div className="rounded-xl border border-stone-800 bg-stone-900/95 p-2 sm:p-3">
            <svg
              viewBox={`${minWX} ${minWZ} ${viewW} ${viewH}`}
              className="w-full max-h-[54vh] [@media(max-height:500px)]:max-h-[48vh] mx-auto block select-none"
              aria-label="مخطط أجنحة القلعة الكامل"
            >
              {/* Subtle Blueprint Grid */}
              <defs>
                <pattern id="castle-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path
                    d="M 10 0 L 0 0 0 10"
                    fill="none"
                    stroke="rgba(120, 113, 108, 0.14)"
                    strokeWidth="0.25"
                  />
                </pattern>
              </defs>
              <rect x={minWX} y={minWZ} width={viewW} height={viewH} fill="#0c0a09" />
              <rect x={minWX} y={minWZ} width={viewW} height={viewH} fill="url(#castle-grid)" />

              {/* 14 Castle Rooms */}
              {CASTLE_ROOMS.map((room) => {
                const isOptional = OPTIONAL_ROOM_IDS.has(room.id);
                const playerInside =
                  playerX >= room.minX &&
                  playerX <= room.maxX &&
                  playerZ >= room.minZ &&
                  playerZ <= room.maxZ;
                const cx = (room.minX + room.maxX) / 2;
                const cz = (room.minZ + room.maxZ) / 2 + (ROOM_LABEL_OFFSET_Z[room.id] ?? 0);

                return (
                  <g key={room.id}>
                    <rect
                      x={room.minX}
                      y={room.minZ}
                      width={room.maxX - room.minX}
                      height={room.maxZ - room.minZ}
                      fill={
                        playerInside
                          ? 'rgba(180, 83, 9, 0.28)'
                          : isOptional
                          ? 'rgba(30, 41, 59, 0.55)'
                          : 'rgba(41, 37, 36, 0.85)'
                      }
                      stroke={
                        playerInside
                          ? '#f59e0b'
                          : isOptional
                          ? '#475569'
                          : '#78716c'
                      }
                      strokeWidth={playerInside ? 0.7 : 0.45}
                    />
                    <text
                      x={cx}
                      y={cz}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={playerInside ? '#fde68a' : isOptional ? '#cbd5e1' : '#e7e5e4'}
                      fontSize="1.9"
                      fontWeight="700"
                    >
                      {SHORT_ROOM_LABELS[room.id] || room.nameAr}
                    </text>
                  </g>
                );
              })}

              {/* Foyer Chandelier Sanctuary Circle */}
              <circle
                cx={0}
                cy={35}
                r={4.5}
                fill="rgba(251, 191, 36, 0.1)"
                stroke="#fbbf24"
                strokeDasharray="1.2 0.9"
                strokeWidth="0.35"
              />

              {/* Hiding Wardrobes */}
              {hidingSpots.map((hs) => (
                <rect
                  key={hs.id}
                  x={hs.x - 0.9}
                  y={hs.z - 0.9}
                  width={1.8}
                  height={1.8}
                  rx={0.3}
                  fill="#0284c7"
                  stroke="#bae6fd"
                  strokeWidth="0.25"
                />
              ))}

              {/* Uncollected Family Relics */}
              {relics
                .filter((r) => !r.collected)
                .map((r) => (
                  <circle
                    key={r.id}
                    cx={r.x}
                    cy={r.z}
                    r={0.95}
                    fill="#f43f5e"
                    stroke="#fecdd3"
                    strokeWidth="0.22"
                  />
                ))}

              {/* Undiscovered Lore Notes & Secret Clue Scrolls */}
              {notes
                .filter((n) => !n.discovered)
                .map((n) => (
                  <rect
                    key={n.id}
                    x={n.x - 0.85}
                    y={n.z - 0.85}
                    width={1.7}
                    height={1.7}
                    rx={0.25}
                    fill={n.isOptionalLore ? '#c084fc' : '#fde047'}
                    stroke="#1c1917"
                    strokeWidth="0.24"
                  />
                ))}

              {/* Sequential Puzzle Stations */}
              {puzzles.map((pz) => (
                <polygon
                  key={pz.id}
                  points={`${pz.x},${pz.z - 1.3} ${pz.x + 1.2},${pz.z} ${pz.x},${pz.z + 1.3} ${pz.x - 1.2},${pz.z}`}
                  fill={pz.solved ? '#10b981' : '#f59e0b'}
                  stroke="#fef3c7"
                  strokeWidth="0.25"
                />
              ))}

              {/* 16 Castle Doors */}
              {doors.map((d) => {
                const w = d.axis === 'x' ? 3.2 : 1.1;
                const h = d.axis === 'z' ? 3.2 : 1.1;
                const color = d.isMainExit
                  ? '#fbbf24'
                  : d.isOpen || d.unlocked
                  ? '#34d399'
                  : '#ef4444';
                return (
                  <rect
                    key={d.id}
                    x={d.x - w / 2}
                    y={d.z - h / 2}
                    width={w}
                    height={h}
                    rx={0.35}
                    fill={color}
                    stroke="#09090b"
                    strokeWidth="0.3"
                  />
                );
              })}

              {/* Mark's Live Position & Facing Cone */}
              <g transform={`translate(${playerX}, ${playerZ}) rotate(${lookDeg})`}>
                <polygon
                  points="0,-5.2 -2.8,0 2.8,0"
                  fill="rgba(251, 191, 36, 0.28)"
                />
                <circle cx={0} cy={0} r={1.45} fill="#f8fafc" stroke="#f59e0b" strokeWidth="0.5" />
              </g>
            </svg>
          </div>

          {/* Clean Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-800 bg-stone-900/80 px-3.5 py-2.5 text-[11px] text-stone-300">
            <span className="inline-flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-amber-400" />
              موقع مارك الحالي
            </span>
            <span className="inline-flex items-center gap-1.5">
              <DoorOpen className="h-3.5 w-3.5 text-emerald-400" />
              باب مفتوح / جناح استكشاف
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-red-400" />
              باب موصد بمفتاح
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-sky-400" />
              خزانة اختباء آمنة
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ScrollText className="h-3.5 w-3.5 text-yellow-300" />
              مخطوطة / دليل لغز
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Gem className="h-3.5 w-3.5 text-rose-400" />
              تحفة أثرية مخبأة
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
