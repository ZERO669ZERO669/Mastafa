import {
  CastleDoor,
  CluePlaque,
  EnemyEntity,
  InventoryItemId,
  LoreNote,
  PickupItem,
  PlayerState,
  PuzzleId,
  PuzzleStation,
  RelicItem,
  SafeZone,
  WallBox,
} from './types';
import {
  CASTLE_NAV_GRAPH,
  createInitialDoors,
  hasCastleLineOfSight,
  resolveCastleCollisions,
} from './castleMap';
import {
  createCastleCluePlaques,
  createInitialLoreNotes,
  createInitialPuzzleStations,
} from './puzzles';
import {
  ENEMY_RADIUS,
  GRANDFATHER_ENRAGED_SPEED,
  PLAYER_RADIUS,
  clamp,
  createInitialEnemies,
  createInitialPickups,
  createInitialPlayerState,
  createInitialRelics,
  createInitialSafeZones,
  getActiveChapterObjective,
} from './rules';

export const STORAGE_CHECKPOINT_KEY = 'blackthorn_castle_checkpoint_v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SavedCheckpointData {
  version: 1;
  savedAtMs: number;
  chapterNum: number;
  roomNameAr: string;
  sigilsSolved: number;
  notesFound: number;
  relicsFound: number;
  survivalSeconds: number;
  player: {
    x: number;
    z: number;
    rotY: number;
    pitch: number;
    sanity: number;
    battery: number;
    stamina: number;
    flashlightOn: boolean;
    hasDeed: boolean;
    tombAwakened: boolean;
  };
  solvedPuzzleIds: PuzzleId[];
  unlockedDoorIds: string[];
  openDoorIds: string[];
  inventory: InventoryItemId[];
  discoveredNoteIds: string[];
  discoveredPlaqueIds: string[];
  collectedRelicIds: string[];
  collectedPickupIds: string[];
  playedDialogues: string[];
}

export interface CheckpointSimTarget {
  player: PlayerState;
  doors: CastleDoor[];
  safeZones: SafeZone[];
  notes: LoreNote[];
  plaques: CluePlaque[];
  puzzles: PuzzleStation[];
  pickups: PickupItem[];
  relics: RelicItem[];
  enemies: EnemyEntity[];
  inventory: Set<InventoryItemId>;
  playedDialogues: Set<string>;
  survivalSeconds: number;
  walls: readonly WallBox[];
}

function getDefaultStorage(): StorageLike | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore storage access errors in restricted frames
  }
  return null;
}

export function createCheckpointSnapshot(sim: {
  player: PlayerState;
  doors: readonly CastleDoor[];
  notes: readonly LoreNote[];
  plaques: readonly CluePlaque[];
  puzzles: readonly PuzzleStation[];
  pickups: readonly PickupItem[];
  relics: readonly RelicItem[];
  inventory: ReadonlySet<InventoryItemId>;
  playedDialogues: ReadonlySet<string>;
  survivalSeconds: number;
}): SavedCheckpointData {
  const obj = getActiveChapterObjective(sim.puzzles, sim.player, sim.doors);
  // If Mark is currently hiding inside a wardrobe, save the safe exit coordinate right outside it
  const safeX = sim.player.isHidden ? sim.player.hideExitX : sim.player.x;
  const safeZ = sim.player.isHidden ? sim.player.hideExitZ : sim.player.z;

  return {
    version: 1,
    savedAtMs: Date.now(),
    chapterNum: obj.chapterNum,
    roomNameAr: obj.roomNameAr,
    sigilsSolved: sim.puzzles.filter((p) => p.solved).length,
    notesFound: sim.notes.filter((n) => n.discovered).length,
    relicsFound: sim.relics.filter((r) => r.collected).length,
    survivalSeconds: Math.max(0, sim.survivalSeconds),
    player: {
      x: Number(safeX.toFixed(3)),
      z: Number(safeZ.toFixed(3)),
      rotY: Number(sim.player.rotY.toFixed(4)),
      pitch: Number(clamp(sim.player.pitch, -0.8, 0.8).toFixed(4)),
      sanity: Math.round(clamp(sim.player.sanity, 1, 100)),
      battery: Math.round(clamp(sim.player.battery, 5, 100)),
      stamina: Math.round(clamp(sim.player.stamina, 25, 100)),
      flashlightOn: Boolean(sim.player.flashlightOn),
      hasDeed: Boolean(sim.player.hasDeed),
      tombAwakened: Boolean(sim.player.tombAwakened),
    },
    solvedPuzzleIds: sim.puzzles.filter((p) => p.solved).map((p) => p.id),
    unlockedDoorIds: sim.doors.filter((d) => d.unlocked).map((d) => d.id),
    openDoorIds: sim.doors.filter((d) => d.isOpen).map((d) => d.id),
    inventory: Array.from(sim.inventory),
    discoveredNoteIds: sim.notes.filter((n) => n.discovered).map((n) => n.id),
    discoveredPlaqueIds: sim.plaques.filter((pl) => pl.discovered).map((pl) => pl.id),
    collectedRelicIds: sim.relics.filter((r) => r.collected).map((r) => r.id),
    collectedPickupIds: sim.pickups.filter((pk) => pk.collected).map((pk) => pk.id),
    playedDialogues: Array.from(sim.playedDialogues),
  };
}

export function saveCheckpointToStorage(
  data: SavedCheckpointData,
  storage: StorageLike | null = getDefaultStorage()
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_CHECKPOINT_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadCheckpointFromStorage(
  storage: StorageLike | null = getDefaultStorage()
): SavedCheckpointData | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_CHECKPOINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedCheckpointData>;
    if (
      parsed.version !== 1 ||
      !parsed.player ||
      typeof parsed.player.x !== 'number' ||
      typeof parsed.player.z !== 'number' ||
      !Array.isArray(parsed.solvedPuzzleIds) ||
      !Array.isArray(parsed.unlockedDoorIds) ||
      !Array.isArray(parsed.inventory)
    ) {
      return null;
    }
    return {
      version: 1,
      savedAtMs: typeof parsed.savedAtMs === 'number' ? parsed.savedAtMs : Date.now(),
      chapterNum: typeof parsed.chapterNum === 'number' ? clamp(parsed.chapterNum, 1, 7) : 1,
      roomNameAr:
        typeof parsed.roomNameAr === 'string' && parsed.roomNameAr.length > 0
          ? parsed.roomNameAr
          : 'البهو الملكي والدرج الكبير',
      sigilsSolved: typeof parsed.sigilsSolved === 'number' ? parsed.sigilsSolved : 0,
      notesFound: typeof parsed.notesFound === 'number' ? parsed.notesFound : 0,
      relicsFound: typeof parsed.relicsFound === 'number' ? parsed.relicsFound : 0,
      survivalSeconds: typeof parsed.survivalSeconds === 'number' ? Math.max(0, parsed.survivalSeconds) : 0,
      player: {
        x: parsed.player.x,
        z: parsed.player.z,
        rotY: typeof parsed.player.rotY === 'number' ? parsed.player.rotY : 0,
        pitch: typeof parsed.player.pitch === 'number' ? parsed.player.pitch : 0,
        sanity: typeof parsed.player.sanity === 'number' ? parsed.player.sanity : 100,
        battery: typeof parsed.player.battery === 'number' ? parsed.player.battery : 100,
        stamina: typeof parsed.player.stamina === 'number' ? parsed.player.stamina : 100,
        flashlightOn: parsed.player.flashlightOn !== false,
        hasDeed: Boolean(parsed.player.hasDeed),
        tombAwakened: Boolean(parsed.player.tombAwakened),
      },
      solvedPuzzleIds: parsed.solvedPuzzleIds,
      unlockedDoorIds: parsed.unlockedDoorIds,
      openDoorIds: Array.isArray(parsed.openDoorIds) ? parsed.openDoorIds : [],
      inventory: parsed.inventory,
      discoveredNoteIds: Array.isArray(parsed.discoveredNoteIds) ? parsed.discoveredNoteIds : [],
      discoveredPlaqueIds: Array.isArray(parsed.discoveredPlaqueIds) ? parsed.discoveredPlaqueIds : [],
      collectedRelicIds: Array.isArray(parsed.collectedRelicIds) ? parsed.collectedRelicIds : [],
      collectedPickupIds: Array.isArray(parsed.collectedPickupIds) ? parsed.collectedPickupIds : [],
      playedDialogues: Array.isArray(parsed.playedDialogues) ? parsed.playedDialogues : [],
    };
  } catch {
    return null;
  }
}

export function clearCheckpointStorage(
  storage: StorageLike | null = getDefaultStorage()
): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_CHECKPOINT_KEY);
  } catch {
    // Ignore storage removal errors
  }
}

/**
 * Restores a complete saved checkpoint into the live simulation safely:
 * - Restores all solved puzzles, unlocked/open doors, inventory keys, notes, plaques, relics, and pickups.
 * - Resolves Mark's position against solid geometry with healthy minimum sanity/battery/stamina so checkpoints never death-loop.
 * - Positions Grandfather Victor & secondary apparitions safely away from Mark (>= 22m out of sight).
 */
export function applyCheckpointToSim(
  sim: CheckpointSimTarget,
  data: SavedCheckpointData,
  rng: () => number = Math.random
): void {
  const solvedSet = new Set<string>(data.solvedPuzzleIds);
  const unlockedSet = new Set<string>(data.unlockedDoorIds);
  const openSet = new Set<string>(data.openDoorIds);
  const noteSet = new Set<string>(data.discoveredNoteIds);
  const plaqueSet = new Set<string>(data.discoveredPlaqueIds);
  const relicSet = new Set<string>(data.collectedRelicIds);
  const pickupSet = new Set<string>(data.collectedPickupIds);

  sim.doors = createInitialDoors().map((d) => {
    const isOpen = openSet.has(d.id) || (data.player.tombAwakened && d.id === 'door-crypt-escape');
    const unlocked = d.unlocked || unlockedSet.has(d.id) || isOpen;
    return {
      ...d,
      unlocked,
      isOpen,
      openProgress: isOpen ? 1 : 0,
    };
  });

  sim.safeZones = createInitialSafeZones().map((sz) => ({
    ...sz,
    active: data.player.tombAwakened ? false : sz.active,
  }));

  sim.puzzles = createInitialPuzzleStations().map((pz) => ({
    ...pz,
    solved: solvedSet.has(pz.id),
  }));

  sim.notes = createInitialLoreNotes().map((n) => ({
    ...n,
    discovered: noteSet.has(n.id),
  }));

  sim.plaques = createCastleCluePlaques().map((pl) => ({
    ...pl,
    discovered: plaqueSet.has(pl.id),
  }));

  sim.relics = createInitialRelics().map((r) => ({
    ...r,
    collected: relicSet.has(r.id),
  }));

  sim.pickups = createInitialPickups().map((pk) => ({
    ...pk,
    collected: pickupSet.has(pk.id),
  }));

  sim.inventory = new Set<InventoryItemId>(data.inventory);
  if (data.player.hasDeed) {
    sim.inventory.add('inheritance_deed');
    sim.inventory.add('master_exit_key');
  }

  sim.playedDialogues = new Set<string>(data.playedDialogues);
  sim.survivalSeconds = data.survivalSeconds;

  const freshPlayer = createInitialPlayerState();
  const safePos = resolveCastleCollisions(
    data.player.x,
    data.player.z,
    PLAYER_RADIUS,
    sim.walls,
    sim.doors
  );
  freshPlayer.x = safePos.x;
  freshPlayer.z = safePos.z;
  freshPlayer.rotY = data.player.rotY;
  freshPlayer.pitch = clamp(data.player.pitch, -0.85, 0.85);
  // Guarantee playable recovery floor on checkpoint load so Mark never spawns at 1% sanity/battery
  freshPlayer.sanity = Math.max(45, clamp(data.player.sanity, 45, 100));
  freshPlayer.sanityGhost = freshPlayer.sanity;
  freshPlayer.battery = Math.max(35, clamp(data.player.battery, 35, 100));
  freshPlayer.batteryGhost = freshPlayer.battery;
  freshPlayer.stamina = 100;
  freshPlayer.staminaGhost = 100;
  freshPlayer.flashlightOn = true;
  freshPlayer.hasDeed = Boolean(data.player.hasDeed);
  freshPlayer.tombAwakened = Boolean(data.player.tombAwakened);
  freshPlayer.heldItemKind = freshPlayer.hasDeed ? 'deed' : 'none';
  freshPlayer.invulnTimer = 2.5;
  sim.player = freshPlayer;

  // Spawn enemies and ensure none are standing dangerously close to Mark's restored position!
  const enemies = createInitialEnemies(rng);
  for (const e of enemies) {
    const minSafeDist = e.kind === 'grandfather' ? (freshPlayer.tombAwakened ? 16.5 : 24.0) : 14.0;
    const dist = Math.hypot(e.x - freshPlayer.x, e.z - freshPlayer.z);
    const hasLOS = hasCastleLineOfSight(freshPlayer.x, freshPlayer.z, e.x, e.z, sim.walls, sim.doors);

    if (dist < minSafeDist || (dist < minSafeDist + 6.0 && hasLOS)) {
      const candidates = CASTLE_NAV_GRAPH.filter((n) => {
        if (n.doorId) return false;
        const dp = Math.hypot(n.x - freshPlayer.x, n.z - freshPlayer.z);
        if (dp < minSafeDist) return false;
        return !hasCastleLineOfSight(freshPlayer.x, freshPlayer.z, n.x, n.z, sim.walls, sim.doors);
      });
      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(rng() * candidates.length)];
        const resolved = resolveCastleCollisions(chosen.x, chosen.z, ENEMY_RADIUS, sim.walls, sim.doors);
        e.x = resolved.x;
        e.z = resolved.z;
        e.targetX = resolved.x;
        e.targetZ = resolved.z;
      }
    }

    if (e.kind === 'grandfather' && freshPlayer.tombAwakened) {
      e.alertState = 'chase';
      e.alertTimer = 30;
      e.chaseSpeed = GRANDFATHER_ENRAGED_SPEED;
      e.targetX = freshPlayer.x;
      e.targetZ = freshPlayer.z;
    }
  }
  sim.enemies = enemies;
}
