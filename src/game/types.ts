export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type GameOutcome = 'victory' | 'defeat' | null;

export type DifficultyMode = 'story' | 'normal' | 'nightmare';

export type GraphicsQuality = 'medium' | 'ultra';

export interface GameSettings {
  difficulty: DifficultyMode;
  fov: number; // 65..90
  lookSensitivity: number; // 0.5..2.0
  invertY: boolean;
  graphicsQuality: GraphicsQuality;
  masterVolume: number; // 0..100
}

export type AchievementId =
  | 'first_key'
  | 'shadow_whisper'
  | 'silver_exorcist'
  | 'loremaster'
  | 'master_locksmith'
  | 'tomb_raider'
  | 'relic_hunter'
  | 'debt_free_survivor';

export interface AchievementDef {
  id: AchievementId;
  titleAr: string;
  titleEn: string;
  descAr: string;
  category: 'story' | 'stealth' | 'mastery';
}

export type EnemyKind = 'grandfather' | 'watcher' | 'phantom';

export type EnemyAlertState = 'patrol' | 'suspicious' | 'chase' | 'return';

export type AttackPhase = 'idle' | 'windup' | 'active' | 'recovery' | 'executing';

export type PuzzleId =
  | 'clock'
  | 'valves'
  | 'monitors'
  | 'elixir'
  | 'statues'
  | 'safe'
  | 'bedroom_chime'
  | 'tomb_seal';

export type InventoryItemId =
  | 'west_wing_key'
  | 'security_key'
  | 'infirmary_key'
  | 'statue_hall_key'
  | 'silver_lens'
  | 'study_key'
  | 'bedroom_key'
  | 'crypt_key'
  | 'inheritance_deed'
  | 'master_exit_key';

export type RoomId =
  | 'foyer'
  | 'gothic_library'
  | 'banquet_hall'
  | 'kitchen_cellar'
  | 'steam_gallery'
  | 'moonlit_courtyard'
  | 'security_bunker'
  | 'dungeon_cells'
  | 'portrait_hall'
  | 'infirmary'
  | 'statue_hall'
  | 'trophy_study'
  | 'master_bedroom'
  | 'crypt';

export interface Vec2 {
  x: number;
  z: number;
}

export interface WallBox {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  blocksSight: boolean;
  renderMesh?: boolean;
  style?: 'plaster' | 'wainscot' | 'bunker' | 'infirmary' | 'marble' | 'crypt' | 'prop';
}

export interface CastleDoor {
  id: string;
  nameAr: string;
  nameEn: string;
  x: number;
  z: number;
  axis: 'x' | 'z'; // 'x' spans along X (blocks Z crossing); 'z' spans along Z (blocks X crossing)
  width: number;
  requiredItem?: InventoryItemId;
  unlocked: boolean;
  isOpen: boolean;
  openProgress: number; // 0 = closed, 1 = 92 deg swung open
  isMainExit?: boolean;
  isOptionalWing?: boolean;
  lockedHintAr: string;
}

export interface SafeZone {
  id: string;
  nameAr: string;
  nameEn: string;
  x: number;
  z: number;
  radius: number;
  active: boolean;
}

export interface HidingSpot {
  id: string;
  nameAr: string;
  nameEn: string;
  x: number;
  z: number;
  rotY: number;
}

export interface LoreNote {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  roomNameAr: string;
  relatedPuzzle?: PuzzleId;
  isOptionalLore?: boolean;
  x: number;
  z: number;
  discovered: boolean;
}

export interface CluePlaque {
  id: string;
  puzzleId: PuzzleId;
  roomId: RoomId;
  roomNameAr: string;
  titleAr: string;
  featuredCode: string;
  inscriptionAr: string;
  subInscriptionAr: string;
  /** Position where the player stands to inspect the wall/stair plaque */
  interactX: number;
  interactZ: number;
  discovered?: boolean;
}

export interface PuzzleStation {
  id: PuzzleId;
  chapter: number;
  titleAr: string;
  titleEn: string;
  districtAr: string;
  districtEn: string;
  goalAr: string;
  x: number;
  z: number;
  requiredItem?: InventoryItemId;
  rewardItem?: InventoryItemId;
  secondaryRewardItem?: InventoryItemId;
  solved: boolean;
}

export interface PickupItem {
  id: string;
  kind: 'tincture' | 'battery' | 'adrenaline';
  x: number;
  z: number;
  collected: boolean;
}

export interface RelicItem {
  id: string;
  roomId: RoomId;
  nameAr: string;
  nameEn: string;
  loreAr: string;
  x: number;
  z: number;
  collected: boolean;
}

export interface DialogueLine {
  id: string;
  speakerAr: string;
  speakerRole: 'mark' | 'grandfather' | 'system';
  textAr: string;
  durationSec: number;
}

export interface EnemyEntity {
  id: string;
  kind: EnemyKind;
  x: number;
  z: number;
  homeX: number;
  homeZ: number;
  waypoints: Vec2[];
  waypointIndex: number;
  rotY: number;
  patrolSpeed: number;
  chaseSpeed: number;
  alertState: EnemyAlertState;
  alertTimer: number;
  stunTimer: number;
  phase: AttackPhase;
  phaseTimer: number;
  cooldownTimer: number;
  directorTimer: number;
  stuckTimer?: number;
  targetX: number;
  targetZ: number;
  orbitAngle: number;
  inBeam: boolean;
  hitFlashTimer: number;
  active: boolean;
}

export interface DeathSequenceState {
  active: boolean;
  timer: number;
  duration: number;
  killerX: number;
  killerZ: number;
  startCamX: number;
  startCamZ: number;
  startYaw: number;
  startPitch: number;
}

export interface PlayerState {
  x: number;
  z: number;
  rotY: number; // Camera yaw (0 = looking -Z North)
  pitch: number; // First-person vertical look pitch (-1.05..+1.05 rad)
  eyeHeight: number; // Smoothly damped eye height (1.68 standing, 1.08 crouching)
  vx: number;
  vz: number;
  sanity: number;
  sanityGhost: number;
  battery: number;
  batteryGhost: number;
  stamina: number;
  staminaGhost: number;
  flashlightOn: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  staminaExhausted: boolean;
  isHidden: boolean;
  activeHidingSpotId: string | null;
  hideExitX: number;
  hideExitZ: number;
  wardCooldown: number;
  dashTimer: number;
  dashCooldown: number;
  adrenalineTimer: number;
  invulnTimer: number;
  gaitDist: number;
  noiseLevel: number; // 0..100 acoustic stealth meter
  hasDeed: boolean;
  tombAwakened: boolean;
  heldItemBannerTimer: number;
  heldItemKind: 'none' | 'key' | 'note' | 'deed';
}

export type InteractTarget =
  | { type: 'note'; note: LoreNote; dist: number }
  | { type: 'plaque'; plaque: CluePlaque; dist: number }
  | { type: 'puzzle'; puzzle: PuzzleStation; dist: number; lockedReasonAr?: string }
  | { type: 'door'; door: CastleDoor; dist: number; canUnlock: boolean; lockedReasonAr?: string }
  | { type: 'deed'; dist: number }
  | { type: 'hide'; spot: HidingSpot; dist: number }
  | { type: 'unhide'; spotId: string };

export type MasteryRank = 'S+' | 'S' | 'A' | 'B' | 'C';

export interface RunSnapshot {
  outcome: 'victory' | 'defeat';
  difficulty: DifficultyMode;
  rank: MasteryRank;
  sigilsCollected: number;
  totalSigils: number;
  notesFound: number;
  totalNotes: number;
  relicsFound: number;
  totalRelics: number;
  hasDeed: boolean;
  survivalSeconds: number;
  sanityRemaining: number;
  bestSigils: number;
  bestTimeSeconds: number | null;
  causeAr: string;
  causeEn: string;
}

export interface HudDomRefs {
  sanityFill: HTMLDivElement | null;
  sanityGhost: HTMLDivElement | null;
  sanityValue: HTMLSpanElement | null;
  batteryFill: HTMLDivElement | null;
  batteryGhost: HTMLDivElement | null;
  batteryValue: HTMLSpanElement | null;
  staminaFill: HTMLDivElement | null;
  staminaGhost: HTMLDivElement | null;
  noiseFill: HTMLDivElement | null;
  noiseLabel: HTMLSpanElement | null;
  lowSanityVignette: HTMLDivElement | null;
  bloodKillOverlay: HTMLDivElement | null;
  minimapCanvas: HTMLCanvasElement | null;
  threatBadge: HTMLSpanElement | null;
}
