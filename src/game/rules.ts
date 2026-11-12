import {
  CastleDoor,
  CluePlaque,
  DeathSequenceState,
  DifficultyMode,
  EnemyEntity,
  HidingSpot,
  InteractTarget,
  InventoryItemId,
  LoreNote,
  PickupItem,
  PlayerState,
  PuzzleStation,
  RelicItem,
  SafeZone,
  WallBox,
} from './types';
import {
  CASTLE_NAV_GRAPH,
  CASTLE_ROOMS,
  DEED_ALTAR_POS,
  MAIN_EXIT_POS,
  SARCOPHAGUS_POS,
  computeNextCastlePathStep,
  createInitialHidingSpots,
  createInitialRelics,
  getReachableNavNodes,
  getRoomAt,
  getWardrobeExitPoint,
  hasCastleLineOfSight,
  hasDirectWalkablePath,
  resolveCastleCollisions,
  sweepCastleMovement,
} from './castleMap';
import { DIFFICULTY_TUNING } from './achievements';
import { createCastleCluePlaques } from './puzzles';

export const TOTAL_SIGILS = 8;
export const TOTAL_RELICS = 12;
export const PLAYER_RADIUS = 0.48;
export const ENEMY_RADIUS = 0.52;

// Victor narrowly outruns Mark's sprint in a direct chase; hiding, route choice, and Victor's wind-up remain Mark's counterplay.
export const PLAYER_WALK_SPEED = 6.25;
export const PLAYER_SPRINT_SPEED = 8.3;
export const PLAYER_CROUCH_SPEED = 3.45;
export const PLAYER_DASH_SPEED = 12.8;

export const GRANDFATHER_PATROL_SPEED = 2.8;
export const GRANDFATHER_SUSPICIOUS_SPEED = 4.1;
export const GRANDFATHER_CHASE_SPEED = 8.85;
export const GRANDFATHER_ENRAGED_SPEED = 9.4;
export const GRANDFATHER_WINDUP_RANGE = 1.38;
export const GRANDFATHER_LETHAL_GRAB_RADIUS = 1.12;
export const GRANDFATHER_GRAB_WINDUP_SEC = 0.42;
export const DEATH_SEQUENCE_DURATION = 1.85;

// Spawn Grandfather in distant (>= 28.8m) unlocked outer wings so he actively patrols into Mark's area from Second 1!
export const GRANDFATHER_SPAWN_CANDIDATES: ReadonlyArray<{ x: number; z: number }> = [
  { x: 31.5, z: 44.0 },   // Rotting Banquet Hall East (32.0m from Foyer)
  { x: 39.5, z: 20.5 },   // Castle Kitchen & Wine Cellar NE (43.4m)
  { x: -28.5, z: 42.5 },  // Abandoned Gothic Library West (28.8m)
  { x: 28.5, z: 47.5 },   // Banquet Hall South-East (29.9m)
  { x: -27.5, z: 47.5 },  // Gothic Library South-West (28.9m)
  { x: 39.5, z: 29.5 },   // Castle Kitchen East (40.5m)
];

export { createInitialHidingSpots, createInitialRelics, getWardrobeExitPoint };

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function normalizeAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  const diff = normalizeAngle(target - current);
  return normalizeAngle(current + diff * (1 - Math.exp(-lambda * dt)));
}

export function createInitialPlayerState(): PlayerState {
  return {
    x: 0,
    z: 38.5,
    rotY: 0,
    pitch: 0.02,
    eyeHeight: 1.68,
    vx: 0,
    vz: 0,
    sanity: 100,
    sanityGhost: 100,
    battery: 100,
    batteryGhost: 100,
    stamina: 100,
    staminaGhost: 100,
    flashlightOn: true,
    isSprinting: false,
    isCrouching: false,
    staminaExhausted: false,
    isHidden: false,
    activeHidingSpotId: null,
    hideExitX: 0,
    hideExitZ: 38.5,
    wardCooldown: 0,
    dashTimer: 0,
    dashCooldown: 0,
    adrenalineTimer: 0,
    invulnTimer: 0,
    gaitDist: 0,
    noiseLevel: 0,
    hasDeed: false,
    tombAwakened: false,
    heldItemBannerTimer: 0,
    heldItemKind: 'none',
  };
}

export function createInitialDeathSequence(): DeathSequenceState {
  return {
    active: false,
    timer: 0,
    duration: DEATH_SEQUENCE_DURATION,
    killerX: 0,
    killerZ: 0,
    startCamX: 0,
    startCamZ: 0,
    startYaw: 0,
    startPitch: 0,
  };
}

export function createInitialSafeZones(): SafeZone[] {
  return [
    {
      id: 'foyer-chandelier-sanctuary',
      nameAr: 'دائرة ثريا البهو الآمنة',
      nameEn: 'Grand Foyer Chandelier Sanctuary',
      x: 0,
      z: 35.0,
      radius: 4.6,
      active: true,
    },
  ];
}

export function createInitialPickups(): PickupItem[] {
  return [
    { id: 'bat-foyer', kind: 'battery', x: -6.8, z: 36.2, collected: false },
    { id: 'tinc-steam', kind: 'tincture', x: -29.0, z: 30.5, collected: false },
    { id: 'adr-steam', kind: 'adrenaline', x: -16.5, z: 16.8, collected: false },
    { id: 'bat-bunker', kind: 'battery', x: -17.5, z: -6.5, collected: false },
    { id: 'tinc-bunker', kind: 'tincture', x: -30.5, z: 10.5, collected: false },
    { id: 'bat-portrait', kind: 'battery', x: 14.5, z: 32.0, collected: false },
    { id: 'tinc-infirmary', kind: 'tincture', x: 32.5, z: -10.5, collected: false },
    { id: 'adr-infirmary', kind: 'adrenaline', x: 28.5, z: 4.5, collected: false },
    { id: 'bat-statues', kind: 'battery', x: 10.5, z: 12.0, collected: false },
    { id: 'tinc-study', kind: 'tincture', x: -24.0, z: -20.5, collected: false },
    { id: 'bat-crypt', kind: 'battery', x: 5.5, z: -36.5, collected: false },
    { id: 'adr-crypt', kind: 'adrenaline', x: 11.2, z: -23.5, collected: false },
    // Extra exploration supplies in the 6 optional castle wings
    { id: 'bat-library', kind: 'battery', x: -21.0, z: 47.2, collected: false },
    { id: 'tinc-banquet', kind: 'tincture', x: 32.0, z: 47.5, collected: false },
    { id: 'adr-kitchen', kind: 'adrenaline', x: 40.0, z: 31.5, collected: false },
    { id: 'bat-courtyard', kind: 'battery', x: -43.5, z: 18.0, collected: false },
    { id: 'adr-dungeon', kind: 'adrenaline', x: -47.5, z: -10.5, collected: false },
    { id: 'tinc-bedroom', kind: 'tincture', x: -44.0, z: -21.0, collected: false },
  ];
}

export function createInitialEnemies(rng: () => number = Math.random): EnemyEntity[] {
  const spawnIdx = clamp(
    Math.floor(rng() * GRANDFATHER_SPAWN_CANDIDATES.length),
    0,
    GRANDFATHER_SPAWN_CANDIDATES.length - 1
  );
  const gfSpawn = GRANDFATHER_SPAWN_CANDIDATES[spawnIdx];

  return [
    {
      id: 'grandfather-victor',
      kind: 'grandfather',
      x: gfSpawn.x,
      z: gfSpawn.z,
      homeX: gfSpawn.x,
      homeZ: gfSpawn.z,
      waypoints: GRANDFATHER_SPAWN_CANDIDATES.map((pt) => ({ x: pt.x, z: pt.z })),
      waypointIndex: spawnIdx,
      rotY: 0,
      patrolSpeed: GRANDFATHER_PATROL_SPEED,
      chaseSpeed: GRANDFATHER_CHASE_SPEED,
      alertState: 'patrol',
      alertTimer: 0,
      stunTimer: 0,
      phase: 'idle',
      phaseTimer: 0,
      cooldownTimer: 0,
      directorTimer: 0,
      stuckTimer: 0,
      targetX: gfSpawn.x,
      targetZ: gfSpawn.z,
      orbitAngle: 0,
      inBeam: false,
      hitFlashTimer: 0,
      active: true,
    },
    {
      id: 'veiled-watcher',
      kind: 'watcher',
      x: -9.2,
      z: 6.2,
      homeX: -9.2,
      homeZ: 6.2,
      waypoints: [
        { x: -9.2, z: 6.2 },
        { x: 9.2, z: 6.2 },
        { x: 9.2, z: -15.0 },
        { x: -9.2, z: -15.0 },
      ],
      waypointIndex: 1,
      rotY: 0,
      patrolSpeed: 1.65,
      chaseSpeed: 3.05,
      alertState: 'patrol',
      alertTimer: 0,
      stunTimer: 0,
      phase: 'idle',
      phaseTimer: 0,
      cooldownTimer: 0,
      directorTimer: 0,
      targetX: 9.2,
      targetZ: 6.2,
      orbitAngle: 0,
      inBeam: false,
      hitFlashTimer: 0,
      active: true,
    },
    {
      id: 'infirmary-phantom',
      kind: 'phantom',
      x: 28.5,
      z: -9.5,
      homeX: 28.5,
      homeZ: -9.5,
      waypoints: [
        { x: 28.5, z: -9.5 },
        { x: 29.5, z: 2.5 },
        { x: 19.0, z: 2.5 },
        { x: 19.0, z: -9.5 },
      ],
      waypointIndex: 1,
      rotY: 0,
      patrolSpeed: 1.75,
      chaseSpeed: 3.15,
      alertState: 'patrol',
      alertTimer: 0,
      stunTimer: 0,
      phase: 'idle',
      phaseTimer: 0,
      cooldownTimer: 0,
      directorTimer: 0,
      targetX: 29.5,
      targetZ: 2.5,
      orbitAngle: 0,
      inBeam: false,
      hitFlashTimer: 0,
      active: true,
    },
  ];
}

export function isInsideSafeZone(
  x: number,
  z: number,
  safeZones: readonly SafeZone[]
): SafeZone | null {
  for (let i = 0; i < safeZones.length; i++) {
    const s = safeZones[i];
    if (!s.active) continue;
    if (Math.hypot(x - s.x, z - s.z) <= s.radius) {
      return s;
    }
  }
  return null;
}

export function isPointInFlashlightBeam(
  player: PlayerState,
  tx: number,
  tz: number,
  maxRange = 17.5,
  halfConeCos = 0.78
): boolean {
  if (!player.flashlightOn || player.battery <= 0.5 || player.isHidden) return false;
  const dx = tx - player.x;
  const dz = tz - player.z;
  const dist = Math.hypot(dx, dz);
  if (dist > maxRange || dist < 0.05) return dist < 1.2;
  const lookX = -Math.sin(player.rotY);
  const lookZ = -Math.cos(player.rotY);
  const dot = (dx * lookX + dz * lookZ) / dist;
  return dot >= halfConeCos;
}

export function isPointInPlayerGaze(
  player: PlayerState,
  tx: number,
  tz: number,
  maxRange = 20.0,
  halfConeCos = 0.48
): boolean {
  if (player.isHidden) return false;
  const dx = tx - player.x;
  const dz = tz - player.z;
  const dist = Math.hypot(dx, dz);
  if (dist > maxRange || dist < 0.05) return false;
  const lookX = -Math.sin(player.rotY);
  const lookZ = -Math.cos(player.rotY);
  const dot = (dx * lookX + dz * lookZ) / dist;
  return dot >= halfConeCos;
}

export function enterWardrobe(
  player: PlayerState,
  spot: HidingSpot,
  walls: readonly WallBox[],
  doors: readonly CastleDoor[]
): void {
  const safeExit = getWardrobeExitPoint(spot);
  const verifiedExit = resolveCastleCollisions(
    safeExit.x,
    safeExit.z,
    PLAYER_RADIUS,
    walls,
    doors
  );
  player.hideExitX = verifiedExit.x;
  player.hideExitZ = verifiedExit.z;
  // Position camera right inside the wardrobe louvered door slats looking out!
  player.x = spot.x + Math.sin(spot.rotY) * 0.35;
  player.z = spot.z + Math.cos(spot.rotY) * 0.35;
  player.rotY = normalizeAngle(spot.rotY + Math.PI);
  player.pitch = 0;
  player.vx = 0;
  player.vz = 0;
  player.isHidden = true;
  player.activeHidingSpotId = spot.id;
  player.noiseLevel = 0;
}

export function exitWardrobe(
  player: PlayerState,
  walls: readonly WallBox[],
  doors: readonly CastleDoor[]
): void {
  const verified = resolveCastleCollisions(
    player.hideExitX,
    player.hideExitZ,
    PLAYER_RADIUS,
    walls,
    doors
  );
  player.x = verified.x;
  player.z = verified.z;
  player.isHidden = false;
  player.activeHidingSpotId = null;
}

export interface PlayerMoveInput {
  forward: number; // +1 forward, -1 backward
  strafe: number; // +1 right, -1 left
  sprint: boolean;
  crouch?: boolean;
  yawDelta?: number;
  pitchDelta?: number;
  difficulty?: DifficultyMode;
}

export function stepPlayerMovement(
  player: PlayerState,
  input: PlayerMoveInput,
  walls: readonly WallBox[],
  doors: readonly CastleDoor[],
  safeZones: readonly SafeZone[],
  dt: number
): { footstepTriggered: boolean } {
  const tuning = DIFFICULTY_TUNING[input.difficulty ?? 'normal'];

  if (input.yawDelta) {
    player.rotY = normalizeAngle(player.rotY + input.yawDelta);
  }
  if (input.pitchDelta) {
    player.pitch = clamp(player.pitch + input.pitchDelta, -1.05, 1.05);
  }

  player.wardCooldown = Math.max(0, player.wardCooldown - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.adrenalineTimer = Math.max(0, player.adrenalineTimer - dt);
  player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  if (player.heldItemBannerTimer > 0) {
    player.heldItemBannerTimer = Math.max(0, player.heldItemBannerTimer - dt);
    if (player.heldItemBannerTimer === 0 && !player.hasDeed) {
      player.heldItemKind = 'none';
    }
  }

  const inSafe = isInsideSafeZone(player.x, player.z, safeZones) !== null;

  // Flashlight battery drain & recharge (calibrated for dark castle exploration)
  if (player.flashlightOn && !player.isHidden) {
    if (inSafe) {
      player.battery = clamp(player.battery + 16 * dt, 0, 100);
    } else {
      player.battery = clamp(player.battery - 0.62 * tuning.batteryDrainMul * dt, 0, 100);
      if (player.battery <= 0) {
        player.flashlightOn = false;
      }
    }
  } else if (inSafe || player.isHidden) {
    player.battery = clamp(player.battery + 9.0 * dt, 0, 100);
  } else {
    player.battery = clamp(player.battery + 2.6 * dt, 0, 100);
  }

  // Passive sanity recovery in Sanctuary vs gentle ambient castle dread
  if (inSafe || player.adrenalineTimer > 0) {
    player.sanity = clamp(player.sanity + 9.0 * dt, 0, 100);
  } else if (!player.flashlightOn && !player.isHidden) {
    player.sanity = clamp(player.sanity - 0.48 * tuning.sanityDrainMul * dt, 0, 100);
  }

  player.sanityGhost = damp(player.sanityGhost, player.sanity, 3.2, dt);
  player.batteryGhost = damp(player.batteryGhost, player.battery, 4.0, dt);
  player.staminaGhost = damp(player.staminaGhost, player.stamina, 4.5, dt);

  if (player.isHidden) {
    player.vx = 0;
    player.vz = 0;
    player.isSprinting = false;
    player.eyeHeight = damp(player.eyeHeight, 1.48, 12, dt);
    player.noiseLevel = damp(player.noiseLevel, 0, 10, dt);
    player.stamina = clamp(player.stamina + 26 * dt, 0, 100);
    if (player.stamina >= 25) player.staminaExhausted = false;
    return { footstepTriggered: false };
  }

  player.isCrouching = Boolean(input.crouch);
  const targetEyeHeight = player.isCrouching ? 1.08 : 1.68;
  player.eyeHeight = damp(player.eyeHeight, targetEyeHeight, 12, dt);

  const mag = Math.hypot(input.forward, input.strafe);
  const f = mag > 1 ? input.forward / mag : input.forward;
  const s = mag > 1 ? input.strafe / mag : input.strafe;

  const fwdX = -Math.sin(player.rotY);
  const fwdZ = -Math.cos(player.rotY);
  const rightX = Math.cos(player.rotY);
  const rightZ = -Math.sin(player.rotY);

  const wishX = fwdX * f + rightX * s;
  const wishZ = fwdZ * f + rightZ * s;
  const isMoving = Math.hypot(wishX, wishZ) > 0.08;

  const canSprint =
    input.sprint &&
    isMoving &&
    !player.isCrouching &&
    (!player.staminaExhausted || player.adrenalineTimer > 0) &&
    (player.stamina > 1 || player.adrenalineTimer > 0);

  player.isSprinting = canSprint;

  if (player.adrenalineTimer > 0) {
    player.stamina = 100;
    player.staminaExhausted = false;
  } else if (canSprint) {
    player.stamina = clamp(player.stamina - 11.5 * dt, 0, 100);
    if (player.stamina <= 0.5) {
      player.staminaExhausted = true;
      player.isSprinting = false;
    }
  } else {
    player.stamina = clamp(player.stamina + 24.0 * dt, 0, 100);
    if (player.stamina >= 22) {
      player.staminaExhausted = false;
    }
  }

  let targetSpeed = PLAYER_WALK_SPEED;
  if (player.dashTimer > 0) {
    player.dashTimer = Math.max(0, player.dashTimer - dt);
    targetSpeed = PLAYER_DASH_SPEED;
  } else if (player.isSprinting) {
    targetSpeed = PLAYER_SPRINT_SPEED;
  } else if (player.isCrouching) {
    targetSpeed = PLAYER_CROUCH_SPEED;
  }

  if (player.adrenalineTimer > 0) {
    targetSpeed *= 1.16;
  }

  const desiredVx = isMoving ? wishX * targetSpeed : 0;
  const desiredVz = isMoving ? wishZ * targetSpeed : 0;
  player.vx = damp(player.vx, desiredVx, 15, dt);
  player.vz = damp(player.vz, desiredVz, 15, dt);

  const prevX = player.x;
  const prevZ = player.z;
  const nextPos = sweepCastleMovement(
    player.x,
    player.z,
    player.vx * dt,
    player.vz * dt,
    PLAYER_RADIUS,
    walls,
    doors
  );
  player.x = nextPos.x;
  player.z = nextPos.z;

  const moved = Math.hypot(player.x - prevX, player.z - prevZ);
  const targetNoise = !isMoving
    ? 0
    : player.dashTimer > 0
    ? 95
    : player.isSprinting
    ? 88
    : player.isCrouching
    ? 10
    : 38;
  player.noiseLevel = damp(player.noiseLevel, targetNoise, 8, dt);

  let footstepTriggered = false;
  if (moved > 0.002) {
    const stride = player.isSprinting ? 1.95 : 1.55;
    const prevSteps = Math.floor(player.gaitDist / stride);
    player.gaitDist += moved;
    const nextSteps = Math.floor(player.gaitDist / stride);
    if (nextSteps > prevSteps && !player.isCrouching) {
      footstepTriggered = true;
    }
  }

  return { footstepTriggered };
}

export function triggerPlayerDash(player: PlayerState): boolean {
  if (player.isHidden || player.dashCooldown > 0 || (player.stamina < 16 && player.adrenalineTimer <= 0)) {
    return false;
  }
  if (player.adrenalineTimer <= 0) {
    player.stamina = Math.max(0, player.stamina - 16);
  }
  player.dashTimer = 0.25;
  player.dashCooldown = 1.25;
  player.invulnTimer = Math.max(player.invulnTimer, 0.34);
  return true;
}

export function triggerSilverWardBurst(
  player: PlayerState,
  enemies: EnemyEntity[],
  hasSilverLens: boolean
): number {
  if (!hasSilverLens || player.isHidden || player.wardCooldown > 0 || player.battery < 18) {
    return 0;
  }
  player.battery = Math.max(0, player.battery - 18);
  player.flashlightOn = true;
  player.wardCooldown = 7.5;

  let stunned = 0;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.active) continue;
    const d = Math.hypot(e.x - player.x, e.z - player.z);
    if (d <= 12.5) {
      e.stunTimer = Math.max(e.stunTimer, 5.5);
      e.hitFlashTimer = 0.55;
      e.phase = 'recovery';
      stunned++;
    }
  }
  return stunned;
}

const STEER_ANGLES = [
  0.48, -0.48, 0.96, -0.96, 1.45, -1.45, 1.95, -1.95, 2.42, -2.42,
];

/**
 * Moves an enemy toward (goalX, goalZ) using swept sub-stepped collisions + 10-angle whisker steering
 * + forward (+Z) orientation so enemies NEVER walk backwards and NEVER stick to walls or stairs!
 */
function autoOpenNearbyUnlockedDoors(enemy: EnemyEntity, doors: CastleDoor[]): boolean {
  let openedAny = false;
  for (let i = 0; i < doors.length; i++) {
    const d = doors[i];
    if (!d.unlocked || d.isMainExit) continue;
    if (!d.isOpen && Math.hypot(d.x - enemy.x, d.z - enemy.z) <= 2.25) {
      d.isOpen = true;
      d.openProgress = Math.max(d.openProgress, 0.65);
      openedAny = true;
    } else if (d.isOpen && d.openProgress < 0.65 && Math.hypot(d.x - enemy.x, d.z - enemy.z) <= 2.25) {
      d.openProgress = 0.65;
    }
  }
  return openedAny;
}

function pickUnstuckBypassNode(
  enemy: EnemyEntity,
  goalX: number,
  goalZ: number,
  doors: readonly CastleDoor[],
  walls: readonly WallBox[]
): { x: number; z: number } {
  let bestNode = CASTLE_NAV_GRAPH[0];
  let bestScore = -Infinity;

  for (const n of CASTLE_NAV_GRAPH) {
    if (n.doorId) {
      const door = doors.find((d) => d.id === n.doorId);
      if (door && !door.isOpen && !door.unlocked) continue;
    }
    const distFromEnemy = Math.hypot(n.x - enemy.x, n.z - enemy.z);
    if (distFromEnemy < 0.75 || distFromEnemy > 16.0) continue;

    const clearLine = hasDirectWalkablePath(
      enemy.x,
      enemy.z,
      n.x,
      n.z,
      0.48,
      walls,
      doors,
      false
    );
    const distToGoal = Math.hypot(goalX - n.x, goalZ - n.z);
    const score = (clearLine ? 100 : 0) - distToGoal * 1.4 - distFromEnemy * 0.45;
    if (score > bestScore) {
      bestScore = score;
      bestNode = n;
    }
  }
  return { x: bestNode.x, z: bestNode.z };
}

function moveEnemySmart(
  enemy: EnemyEntity,
  goalX: number,
  goalZ: number,
  speed: number,
  dt: number,
  walls: readonly WallBox[],
  doors: CastleDoor[]
): { unstuck: boolean; openedDoor: boolean } {
  const openedDoor = autoOpenNearbyUnlockedDoors(enemy, doors);

  const moveDx = goalX - enemy.x;
  const moveDz = goalZ - enemy.z;
  const moveDist = Math.hypot(moveDx, moveDz);
  if (moveDist <= 0.04) {
    enemy.stuckTimer = 0;
    return { unstuck: true, openedDoor };
  }

  const nx = moveDx / moveDist;
  const nz = moveDz / moveDist;
  const stepLen = speed * dt;

  let next = sweepCastleMovement(
    enemy.x,
    enemy.z,
    nx * stepLen,
    nz * stepLen,
    ENEMY_RADIUS,
    walls,
    doors
  );

  let actualMoved = Math.hypot(next.x - enemy.x, next.z - enemy.z);

  // Multi-angle whisker steering whenever snagged on a wall, pillar, staircase, or table (< 62% progress)
  if (actualMoved < stepLen * 0.62 && stepLen > 0.003) {
    let bestScore = -Infinity;
    let bestCand = next;

    for (let i = 0; i < STEER_ANGLES.length; i++) {
      const ang = STEER_ANGLES[i];
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const rx = nx * ca - nz * sa;
      const rz = nx * sa + nz * ca;

      const cand = sweepCastleMovement(
        enemy.x,
        enemy.z,
        rx * stepLen,
        rz * stepLen,
        ENEMY_RADIUS,
        walls,
        doors
      );
      const candMoved = Math.hypot(cand.x - enemy.x, cand.z - enemy.z);
      if (candMoved < stepLen * 0.28) continue;

      const newDistToGoal = Math.hypot(goalX - cand.x, goalZ - cand.z);
      const progressTowardGoal = moveDist - newDistToGoal;
      const score = candMoved * 1.6 + progressTowardGoal * 2.2 - Math.abs(ang) * 0.015;
      if (score > bestScore) {
        bestScore = score;
        bestCand = cand;
      }
    }

    next = bestCand;
    actualMoved = Math.hypot(next.x - enemy.x, next.z - enemy.z);
  }

  const finalDx = next.x - enemy.x;
  const finalDz = next.z - enemy.z;
  enemy.x = next.x;
  enemy.z = next.z;

  // Track stuck state so patrol/chase can immediately route via a clear bypass node if wedged
  if (stepLen > 0.003 && actualMoved < stepLen * 0.35) {
    enemy.stuckTimer = (enemy.stuckTimer ?? 0) + dt;
  } else {
    enemy.stuckTimer = Math.max(0, (enemy.stuckTimer ?? 0) - dt * 2.5);
  }

  // CRITICAL: Enemy 3D models are authored facing local +Z!
  // In Three.js right-handed coordinates, rotating +Z by rotY yields world (sin(rotY), cos(rotY)),
  // so facing (dx, dz) requires Math.atan2(dx, dz) — NEVER Math.atan2(-dx, -dz)!
  if (actualMoved > 0.0015) {
    enemy.rotY = dampAngle(enemy.rotY, Math.atan2(finalDx, finalDz), 12.5, dt);
  } else {
    enemy.rotY = dampAngle(enemy.rotY, Math.atan2(moveDx, moveDz), 12.5, dt);
  }

  return { unstuck: (enemy.stuckTimer ?? 0) < 0.24, openedDoor };
}

/**
 * Picks an organic, randomized patrol waypoint strictly within Grandfather's
 * currently reachable rooms — avoiding locked doors so he roams naturally across wings!
 */
function pickSmartGrandfatherPatrolNode(
  enemy: EnemyEntity,
  player: PlayerState,
  doors: readonly CastleDoor[],
  walls: readonly WallBox[],
  preferFarFromPlayer = false
): { x: number; z: number } {
  const reachable = getReachableNavNodes(enemy.x, enemy.z, doors, true, walls);
  const filtered = reachable.filter((n) => {
    // Never pick a patrol node right next to a locked progression door!
    for (const d of doors) {
      if (!d.unlocked && !d.isOpen && Math.hypot(n.x - d.x, n.z - d.z) < 7.2) {
        return false;
      }
    }
    return Math.hypot(n.x - enemy.x, n.z - enemy.z) > 4.5;
  });

  const pool = filtered.length > 0 ? filtered : reachable;
  if (preferFarFromPlayer) {
    let best = pool[0];
    let bestDist = -1;
    for (const n of pool) {
      const d = Math.hypot(n.x - player.x, n.z - player.z);
      if (d > bestDist) {
        bestDist = d;
        best = n;
      }
    }
    return { x: best.x, z: best.z };
  }

  enemy.waypointIndex =
    (enemy.waypointIndex + 1 + Math.floor(Math.random() * pool.length)) % pool.length;
  const chosen = pool[enemy.waypointIndex];
  return { x: chosen.x, z: chosen.z };
}

/**
 * Anti-Door-Camping Director: Whenever Mark unlocks/opens a door, ensure Grandfather
 * (and nearby spirits) are NEVER standing directly behind that doorway ambushing Mark!
 */
export function disperseEnemiesNearOpenedDoor(
  openedDoor: CastleDoor,
  enemies: EnemyEntity[],
  player: PlayerState,
  doors: readonly CastleDoor[],
  walls: readonly WallBox[],
  safeZones: readonly SafeZone[]
): void {
  if (player.tombAwakened || openedDoor.isMainExit) return;

  for (const e of enemies) {
    if (!e.active || e.kind !== 'grandfather') continue;
    const distToDoor = Math.hypot(e.x - openedDoor.x, e.z - openedDoor.z);
    const hasDoorLOS = hasCastleLineOfSight(e.x, e.z, openedDoor.x, openedDoor.z, walls, doors);

    if (distToDoor < 16.5 || (distToDoor < 22.0 && hasDoorLOS)) {
      // Find a safe, distant room node (>= 25m from both player & opened door, out of sight)
      const candidates = CASTLE_NAV_GRAPH.filter((n) => {
        if (n.doorId) return false;
        if (isInsideSafeZone(n.x, n.z, safeZones)) return false;
        const dp = Math.hypot(n.x - player.x, n.z - player.z);
        const dd = Math.hypot(n.x - openedDoor.x, n.z - openedDoor.z);
        if (dp < 25.0 || dd < 20.0) return false;
        return !hasCastleLineOfSight(player.x, player.z, n.x, n.z, walls, doors);
      });

      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const resolved = resolveCastleCollisions(pick.x, pick.z, ENEMY_RADIUS, walls, doors);
        e.x = resolved.x;
        e.z = resolved.z;
        e.alertState = 'patrol';
        e.alertTimer = 0;
        e.phase = 'idle';
        e.phaseTimer = 0;
        e.stuckTimer = 0;
        const nextGoal = pickSmartGrandfatherPatrolNode(e, player, doors, walls, true);
        e.targetX = nextGoal.x;
        e.targetZ = nextGoal.z;
      }
    }
  }
}

export interface EnemyStepResult {
  lethalCatchByGrandfather: boolean;
  killerEnemy: EnemyEntity | null;
  sanityHit: number;
  nearestEnemyDist: number;
  grandfatherDist: number;
  isChased: boolean;
  chasingEnemyKind: 'none' | 'grandfather' | 'apparition';
  doorForcedOpen?: boolean;
}

export function stepEnemies(
  enemies: EnemyEntity[],
  player: PlayerState,
  walls: readonly WallBox[],
  doors: CastleDoor[],
  safeZones: readonly SafeZone[],
  dt: number,
  difficulty: DifficultyMode = 'normal'
): EnemyStepResult {
  const tuning = DIFFICULTY_TUNING[difficulty];
  let lethalCatchByGrandfather = false;
  let killerEnemy: EnemyEntity | null = null;
  let sanityHit = 0;
  let nearestEnemyDist = Infinity;
  let grandfatherDist = Infinity;
  let isChased = false;
  let chasingEnemyKind: 'none' | 'grandfather' | 'apparition' = 'none';
  let doorForcedOpen = false;
  const openDoorsBefore = doors.reduce((acc, d) => acc + (d.isOpen ? 1 : 0), 0);

  // Note: Foyer chandelier sanctuary ONLY restores battery/sanity when out of danger;
  // it NEVER blinds enemies or acts as an invisible wall! Only real stealth/wardrobes/outrunning save Mark!
  void safeZones;

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.active) continue;

    if (e.hitFlashTimer > 0) e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);
    if (e.cooldownTimer > 0) e.cooldownTimer = Math.max(0, e.cooldownTimer - dt);

    const dx = player.x - e.x;
    const dz = player.z - e.z;
    const dist = Math.hypot(dx, dz);
    if (dist < nearestEnemyDist) nearestEnemyDist = dist;
    if (e.kind === 'grandfather') grandfatherDist = dist;

    e.inBeam =
      isPointInFlashlightBeam(player, e.x, e.z, 22.0, 0.72) &&
      hasCastleLineOfSight(player.x, player.z, e.x, e.z, walls, doors);

    if (e.stunTimer > 0) {
      e.stunTimer = Math.max(0, e.stunTimer - dt);
      e.phase = 'idle';
      e.phaseTimer = 0;
      e.rotY = dampAngle(e.rotY, Math.atan2(dx, dz), 7, dt);
      continue;
    }

    // ------------------------------------------------------------------------
    // 1. GRANDFATHER VICTOR — Smart AAA Relentless Stalker & Fair 1-Hit Executioner
    // ------------------------------------------------------------------------
    if (e.kind === 'grandfather') {
      const hasLOS =
        !player.isHidden &&
        hasCastleLineOfSight(e.x, e.z, player.x, player.z, walls, doors);

      const sightRange = player.flashlightOn ? 30.0 : 21.5;
      const forwardX = Math.sin(e.rotY);
      const forwardZ = Math.cos(e.rotY);
      const facingCos = dist > 0.05 ? (dx * forwardX + dz * forwardZ) / dist : 1.0;

      // Grandfather spots Mark in a wide 195° cone (or 360° if chasing, lit by Mark's beam, or within 10.5m!)
      const inVisionCone =
        e.alertState === 'chase' ||
        e.alertState === 'suspicious' ||
        e.inBeam ||
        dist <= 10.5 ||
        facingCos >= -0.35;

      const loudHearRange =
        (player.dashTimer > 0
          ? 30.0
          : player.isSprinting
          ? 26.0
          : player.isCrouching
          ? 2.4
          : 14.0) * tuning.hearingMul;

      const seesOrCloseHears =
        !player.isHidden &&
        ((hasLOS && dist <= sightRange && inVisionCone) ||
          (dist <= 7.5 && !player.isCrouching) ||
          player.tombAwakened);

      const hearsDistantFootsteps =
        !seesOrCloseHears &&
        !player.isHidden &&
        dist <= loudHearRange;

      if (seesOrCloseHears) {
        e.alertState = 'chase';
        e.alertTimer = player.tombAwakened ? 60.0 : 14.5;
        e.targetX = player.x;
        e.targetZ = player.z;
        e.directorTimer = 0;
      } else if (hearsDistantFootsteps) {
        // Update target to Mark's acoustic sound source! If already chasing or close, relentlessly pursue!
        if (e.alertState === 'chase' || dist <= 16.5) {
          e.alertState = 'chase';
          e.alertTimer = Math.max(e.alertTimer, 11.0);
        } else {
          e.alertState = 'suspicious';
          e.alertTimer = 8.5;
        }
        e.targetX = player.x;
        e.targetZ = player.z;
      } else if (e.alertState === 'chase') {
        e.alertTimer = Math.max(0, e.alertTimer - dt);
        if (player.isHidden && !hasLOS) {
          e.alertTimer = Math.max(0, e.alertTimer - dt * 2.6);
        } else if (
          !player.isHidden &&
          hasLOS &&
          dist <= 30.0 &&
          !(player.isCrouching && dist > 8.5)
        ) {
          // Update a chase target only when Victor can see Mark; behind walls he searches the last known position.
          e.targetX = player.x;
          e.targetZ = player.z;
        }
        const distToLastKnown = Math.hypot(e.targetX - e.x, e.targetZ - e.z);
        if (
          e.alertTimer <= 0 ||
          (distToLastKnown < 1.25 &&
            !hasLOS &&
            (player.isHidden || dist > 25.0 || player.isCrouching))
        ) {
          e.alertState = 'suspicious';
          e.alertTimer = 8.0;
          e.phase = 'idle';
          e.phaseTimer = 0;
          const searchGoal = pickSmartGrandfatherPatrolNode(e, player, doors, walls, false);
          e.targetX = searchGoal.x;
          e.targetZ = searchGoal.z;
        }
      } else if (e.alertState === 'suspicious') {
        e.alertTimer = Math.max(0, e.alertTimer - dt);
        if (e.alertTimer <= 0 || Math.hypot(e.targetX - e.x, e.targetZ - e.z) < 1.4) {
          e.alertState = 'patrol';
          const nextGoal = pickSmartGrandfatherPatrolNode(e, player, doors, walls, false);
          e.targetX = nextGoal.x;
          e.targetZ = nextGoal.z;
        }
      } else {
        // Active Stalker Director: Every 9s without an encounter, steer Grandfather's patrol
        // toward Mark's reachable wing (or relocate unseen if separated by a locked door or >38m away)
        // so the player genuinely encounters Grandfather Victor across all chapters!
        e.directorTimer += dt;
        if (e.directorTimer >= 9.0 && dist > 17.5) {
          e.directorTimer = 0;
          const playerReachable = getReachableNavNodes(player.x, player.z, doors, true, walls);
          let enemyReachable = getReachableNavNodes(e.x, e.z, doors, true, walls);
          const sharesComponent = enemyReachable.some((en) =>
            playerReachable.some((pn) => pn.id === en.id)
          );
          if (!sharesComponent || (dist > 38.0 && !hasLOS)) {
            const safeReloc = playerReachable.filter((n) => {
              const dp = Math.hypot(n.x - player.x, n.z - player.z);
              if (dp < 22.0 || dp > 34.0) return false;
              for (const d of doors) {
                if (!d.isOpen && Math.hypot(n.x - d.x, n.z - d.z) < 9.5) return false;
              }
              return !hasCastleLineOfSight(player.x, player.z, n.x, n.z, walls, doors);
            });
            if (safeReloc.length > 0) {
              const chosen = safeReloc[Math.floor(Math.random() * safeReloc.length)];
              const resolved = resolveCastleCollisions(chosen.x, chosen.z, ENEMY_RADIUS, walls, doors);
              e.x = resolved.x;
              e.z = resolved.z;
              enemyReachable = getReachableNavNodes(e.x, e.z, doors, true, walls);
            }
          }
          const curTargetDistToPlayer = Math.hypot(e.targetX - player.x, e.targetZ - player.z);
          const distToCurTarget = Math.hypot(e.targetX - e.x, e.targetZ - e.z);
          if (distToCurTarget < 2.2 || curTargetDistToPlayer > 22.0) {
            // Steer Grandfather toward an active hunting node 11m..22m from Mark (never camping locked doors)
            const huntPool = enemyReachable.filter((n) => {
              const dp = Math.hypot(n.x - player.x, n.z - player.z);
              if (dp < 11.0 || dp > 22.0) return false;
              for (const d of doors) {
                if (!d.unlocked && !d.isOpen && Math.hypot(n.x - d.x, n.z - d.z) < 7.5) {
                  return false;
                }
              }
              return true;
            });
            if (huntPool.length > 0) {
              const targetNode = huntPool[Math.floor(Math.random() * huntPool.length)];
              e.targetX = targetNode.x;
              e.targetZ = targetNode.z;
            }
          }
        }
      }

      if (e.alertState === 'chase' && !player.isHidden) {
        isChased = true;
        chasingEnemyKind = 'grandfather';
        if (dist < 10.5 && player.adrenalineTimer <= 0) {
          player.sanity = clamp(
            player.sanity - (10.5 - dist) * 0.26 * tuning.sanityDrainMul * dt,
            0,
            100
          );
        }

        // Fair close-range windup telegraph before lethal 1-hit execution!
        if (dist <= GRANDFATHER_WINDUP_RANGE && player.invulnTimer <= 0) {
          e.rotY = dampAngle(e.rotY, Math.atan2(dx, dz), 18, dt);
          if (e.phase !== 'windup') {
            e.phase = 'windup';
            e.phaseTimer = GRANDFATHER_GRAB_WINDUP_SEC;
          } else {
            e.phaseTimer -= dt;
            if (e.phaseTimer <= 0 && dist <= GRANDFATHER_LETHAL_GRAB_RADIUS) {
              lethalCatchByGrandfather = true;
              killerEnemy = e;
              e.phase = 'executing';
              e.rotY = Math.atan2(dx, dz);
              break;
            }
          }
        } else if (e.phase === 'windup' && dist > GRANDFATHER_WINDUP_RANGE + 0.35) {
          e.phase = 'idle';
          e.phaseTimer = 0;
        }
      } else if (e.phase === 'windup') {
        e.phase = 'idle';
        e.phaseTimer = 0;
      }

      let goalX = e.targetX;
      let goalZ = e.targetZ;
      if (e.alertState === 'chase') {
        // Walk directly toward Mark ONLY when the straight floor path has full >= 0.58m clearance!
        const directFloorClear =
          hasLOS &&
          hasDirectWalkablePath(e.x, e.z, player.x, player.z, ENEMY_RADIUS + 0.06, walls, doors, false);
        if (directFloorClear) {
          goalX = player.x;
          goalZ = player.z;
        } else {
          const step = computeNextCastlePathStep(e.x, e.z, e.targetX, e.targetZ, doors, true, walls);
          goalX = step.x;
          goalZ = step.z;
        }
      } else if (e.alertState === 'suspicious') {
        const step = computeNextCastlePathStep(e.x, e.z, e.targetX, e.targetZ, doors, true, walls);
        goalX = step.x;
        goalZ = step.z;
      } else {
        if (Math.hypot(e.targetX - e.x, e.targetZ - e.z) < 1.8) {
          const nextGoal = pickSmartGrandfatherPatrolNode(e, player, doors, walls, false);
          e.targetX = nextGoal.x;
          e.targetZ = nextGoal.z;
        }
        const step = computeNextCastlePathStep(e.x, e.z, e.targetX, e.targetZ, doors, true, walls);
        if (Math.hypot(step.x - e.x, step.z - e.z) < 0.35) {
          const nextGoal = pickSmartGrandfatherPatrolNode(e, player, doors, walls, false);
          e.targetX = nextGoal.x;
          e.targetZ = nextGoal.z;
        }
        goalX = step.x;
        goalZ = step.z;
      }

      const rawSpd =
        e.alertState === 'chase'
          ? player.tombAwakened
            ? GRANDFATHER_ENRAGED_SPEED
            : e.chaseSpeed
          : e.alertState === 'suspicious'
          ? GRANDFATHER_SUSPICIOUS_SPEED
          : e.patrolSpeed;
      const windupMul = e.phase === 'windup' ? 0.45 : 1.0;
      const spd = rawSpd * tuning.enemySpeedMul * windupMul;

      const moveRes = moveEnemySmart(e, goalX, goalZ, spd, dt, walls, doors);
      if (moveRes.openedDoor) doorForcedOpen = true;

      if (!moveRes.unstuck) {
        // Unstick EVEN DURING CHASE by routing immediately to the cleanest unobstructed nav node!
        e.stuckTimer = 0;
        const bypass = pickUnstuckBypassNode(e, e.targetX, e.targetZ, doors, walls);
        moveEnemySmart(e, bypass.x, bypass.z, spd, dt, walls, doors);
        if (e.alertState !== 'chase') {
          const freshGoal = pickSmartGrandfatherPatrolNode(e, player, doors, walls, false);
          e.targetX = freshGoal.x;
          e.targetZ = freshGoal.z;
        }
      } else if (e.alertState === 'chase' && dist < 3.4 && hasLOS) {
        // Keep eyes & claws locked onto Mark at close range!
        e.rotY = dampAngle(e.rotY, Math.atan2(dx, dz), 14, dt);
      }
      continue;
    }

    // ------------------------------------------------------------------------
    // 2. VEILED STATUE WATCHER — Freezes when Mark looks directly at it!
    // ------------------------------------------------------------------------
    if (e.kind === 'watcher') {
      const watchedByPlayer =
        isPointInPlayerGaze(player, e.x, e.z, 19.0, 0.46) &&
        hasCastleLineOfSight(player.x, player.z, e.x, e.z, walls, doors);

      if (watchedByPlayer) {
        e.phase = 'idle';
        continue;
      }

      const inStatueHall = getRoomAt(player.x, player.z).id === 'statue_hall';
      if (inStatueHall && !player.isHidden && dist < 16.5) {
        e.alertState = 'chase';
        e.alertTimer = 4.0;
        e.targetX = player.x;
        e.targetZ = player.z;
      } else if (e.alertState === 'chase') {
        e.alertTimer = Math.max(0, e.alertTimer - dt);
        if (e.alertTimer <= 0 || player.isHidden || !inStatueHall) {
          e.alertState = 'patrol';
        }
      }

      if (e.alertState === 'chase' && !player.isHidden) {
        isChased = true;
        if (chasingEnemyKind === 'none') chasingEnemyKind = 'apparition';
        const directClear = hasDirectWalkablePath(
          e.x,
          e.z,
          e.targetX,
          e.targetZ,
          ENEMY_RADIUS + 0.05,
          walls,
          doors,
          false
        );
        const step = directClear
          ? { x: e.targetX, z: e.targetZ }
          : computeNextCastlePathStep(e.x, e.z, e.targetX, e.targetZ, doors, false, walls);
        const moveRes = moveEnemySmart(
          e,
          step.x,
          step.z,
          e.chaseSpeed * tuning.enemySpeedMul,
          dt,
          walls,
          doors
        );
        if (!moveRes.unstuck) {
          e.stuckTimer = 0;
          const bypass = pickUnstuckBypassNode(e, e.targetX, e.targetZ, doors, walls);
          moveEnemySmart(e, bypass.x, bypass.z, e.chaseSpeed * tuning.enemySpeedMul, dt, walls, doors);
        }

        if (dist <= 1.3 && e.cooldownTimer <= 0 && player.invulnTimer <= 0) {
          const hit = Math.round(22 * tuning.sanityDrainMul);
          sanityHit += hit;
          player.sanity = clamp(player.sanity - hit, 0, 100);
          player.invulnTimer = 1.3;
          e.cooldownTimer = 3.0;
        }
      } else {
        e.alertState = 'patrol';
        const wp = e.waypoints[e.waypointIndex % e.waypoints.length];
        if (Math.hypot(wp.x - e.x, wp.z - e.z) < 1.35) {
          e.waypointIndex = (e.waypointIndex + 1) % e.waypoints.length;
        }
        const nextWp = e.waypoints[e.waypointIndex % e.waypoints.length];
        const directClear = hasDirectWalkablePath(
          e.x,
          e.z,
          nextWp.x,
          nextWp.z,
          ENEMY_RADIUS + 0.04,
          walls,
          doors,
          false
        );
        const step = directClear
          ? nextWp
          : computeNextCastlePathStep(e.x, e.z, nextWp.x, nextWp.z, doors, false, walls);
        const moveRes = moveEnemySmart(e, step.x, step.z, e.patrolSpeed, dt, walls, doors);
        if (!moveRes.unstuck) {
          e.stuckTimer = 0;
          e.waypointIndex = (e.waypointIndex + 1) % e.waypoints.length;
          const bypass = pickUnstuckBypassNode(e, nextWp.x, nextWp.z, doors, walls);
          moveEnemySmart(e, bypass.x, bypass.z, e.patrolSpeed, dt, walls, doors);
        }
      }
      continue;
    }

    // ------------------------------------------------------------------------
    // 3. CHAINED ASYLUM CORPSE WRAITH ('phantom') — Relentless corner pursuit,
    //    never glues to walls, and burns/slows under Mark's flashlight beam!
    // ------------------------------------------------------------------------
    if (e.kind === 'phantom') {
      const hasLOS =
        !player.isHidden &&
        dist <= 18.0 &&
        hasCastleLineOfSight(e.x, e.z, player.x, player.z, walls, doors);

      const hearsPlayer =
        !player.isHidden &&
        !player.isCrouching &&
        dist <= (player.isSprinting || player.dashTimer > 0 ? 15.0 : 9.0) * tuning.hearingMul;

      if (hasLOS || hearsPlayer) {
        e.alertState = 'chase';
        e.alertTimer = 8.5;
        e.targetX = player.x;
        e.targetZ = player.z;
      } else if (e.alertState === 'chase') {
        e.alertTimer = Math.max(0, e.alertTimer - (player.isHidden ? dt * 2.6 : dt));
        if (!player.isHidden && dist <= 16.5 && !(player.isCrouching && !hasLOS)) {
          // Relentless pursuit around corners/islands so hiding briefly behind a wall doesn't drop aggro!
          e.targetX = player.x;
          e.targetZ = player.z;
        }
        const distToGoal = Math.hypot(e.targetX - e.x, e.targetZ - e.z);
        if (
          e.alertTimer <= 0 ||
          (distToGoal < 1.15 && !hasLOS && (player.isHidden || player.isCrouching || dist > 16.5))
        ) {
          e.alertState = 'patrol';
          e.alertTimer = 0;
        }
      }

      // Flashlight sears & slows the Asylum Wraith instead of pushing it backwards into walls!
      let beamSlowMul = 1.0;
      if (e.inBeam && player.battery > 4) {
        e.hitFlashTimer = 0.25;
        beamSlowMul = 0.48;
      }

      if (e.alertState === 'chase' && !player.isHidden) {
        isChased = true;
        if (chasingEnemyKind === 'none') chasingEnemyKind = 'apparition';

        const directFloorClear =
          hasLOS &&
          hasDirectWalkablePath(e.x, e.z, player.x, player.z, ENEMY_RADIUS + 0.05, walls, doors, false);
        const step = directFloorClear
          ? { x: player.x, z: player.z }
          : computeNextCastlePathStep(e.x, e.z, e.targetX, e.targetZ, doors, true, walls);

        const spd = e.chaseSpeed * tuning.enemySpeedMul * beamSlowMul;
        const moveRes = moveEnemySmart(e, step.x, step.z, spd, dt, walls, doors);
        if (moveRes.openedDoor) doorForcedOpen = true;

        if (!moveRes.unstuck) {
          e.stuckTimer = 0;
          const bypass = pickUnstuckBypassNode(e, e.targetX, e.targetZ, doors, walls);
          moveEnemySmart(e, bypass.x, bypass.z, spd, dt, walls, doors);
        } else if (dist < 3.0 && hasLOS) {
          e.rotY = dampAngle(e.rotY, Math.atan2(dx, dz), 12, dt);
        }

        if (dist <= 1.32 && e.cooldownTimer <= 0 && player.invulnTimer <= 0) {
          const hit = Math.round(18 * tuning.sanityDrainMul);
          sanityHit += hit;
          player.sanity = clamp(player.sanity - hit, 0, 100);
          player.invulnTimer = 1.2;
          e.cooldownTimer = 2.8;
        }
      } else {
        e.alertState = 'patrol';
        const wp = e.waypoints[e.waypointIndex % e.waypoints.length];
        if (Math.hypot(wp.x - e.x, wp.z - e.z) < 1.35) {
          e.waypointIndex = (e.waypointIndex + 1) % e.waypoints.length;
        }
        const nextWp = e.waypoints[e.waypointIndex % e.waypoints.length];
        const directClear = hasDirectWalkablePath(
          e.x,
          e.z,
          nextWp.x,
          nextWp.z,
          ENEMY_RADIUS + 0.04,
          walls,
          doors,
          false
        );
        const step = directClear
          ? nextWp
          : computeNextCastlePathStep(e.x, e.z, nextWp.x, nextWp.z, doors, true, walls);
        const spd = e.patrolSpeed * beamSlowMul;
        const moveRes = moveEnemySmart(e, step.x, step.z, spd, dt, walls, doors);
        if (moveRes.openedDoor) doorForcedOpen = true;

        if (!moveRes.unstuck) {
          e.stuckTimer = 0;
          e.waypointIndex = (e.waypointIndex + 1) % e.waypoints.length;
          const bypass = pickUnstuckBypassNode(e, nextWp.x, nextWp.z, doors, walls);
          moveEnemySmart(e, bypass.x, bypass.z, spd, dt, walls, doors);
        }
      }
    }
  }

  const openDoorsAfter = doors.reduce((acc, d) => acc + (d.isOpen ? 1 : 0), 0);
  if (openDoorsAfter > openDoorsBefore) {
    doorForcedOpen = true;
  }

  return {
    lethalCatchByGrandfather,
    killerEnemy,
    sanityHit,
    nearestEnemyDist,
    grandfatherDist,
    isChased,
    chasingEnemyKind,
    doorForcedOpen,
  };
}

export function awakenGrandfatherFromTomb(
  player: PlayerState,
  enemies: EnemyEntity[],
  doors: CastleDoor[],
  safeZones: SafeZone[],
  walls?: readonly WallBox[]
): void {
  player.hasDeed = true;
  player.tombAwakened = true;
  player.heldItemKind = 'deed';
  player.heldItemBannerTimer = 6.0;

  for (let i = 0; i < safeZones.length; i++) {
    safeZones[i].active = false;
  }

  for (let i = 0; i < doors.length; i++) {
    const d = doors[i];
    if (d.id === 'door-crypt-escape' || d.id === 'door-statue-hall') {
      d.unlocked = true;
      d.isOpen = true;
    }
  }

  const gf = enemies.find((e) => e.kind === 'grandfather');
  if (gf) {
    gf.active = true;
    const rawSpawnX = SARCOPHAGUS_POS.x - 2.2;
    const rawSpawnZ = SARCOPHAGUS_POS.z + 0.8;
    if (walls) {
      const safeSpawn = resolveCastleCollisions(rawSpawnX, rawSpawnZ, ENEMY_RADIUS, walls, doors);
      gf.x = safeSpawn.x;
      gf.z = safeSpawn.z;
    } else {
      gf.x = rawSpawnX;
      gf.z = rawSpawnZ;
    }
    gf.rotY = Math.atan2(player.x - gf.x, player.z - gf.z);
    gf.chaseSpeed = GRANDFATHER_ENRAGED_SPEED;
    gf.alertState = 'chase';
    gf.alertTimer = 60.0;
    gf.targetX = player.x;
    gf.targetZ = player.z;
    // 1.6s dramatic emergence roar so Mark sees him rise from the coffin and effortlessly sprints away!
    gf.stunTimer = 1.6;
    gf.hitFlashTimer = 0.8;
    gf.phase = 'idle';
  }
}

export function collectNearbyPickups(
  player: PlayerState,
  pickups: PickupItem[]
): PickupItem | null {
  if (player.isHidden) return null;
  for (let i = 0; i < pickups.length; i++) {
    const p = pickups[i];
    if (p.collected) continue;
    if (Math.hypot(p.x - player.x, p.z - player.z) <= 1.65) {
      p.collected = true;
      if (p.kind === 'battery') {
        player.battery = clamp(player.battery + 45, 0, 100);
      } else if (p.kind === 'adrenaline') {
        player.stamina = 100;
        player.staminaExhausted = false;
        player.adrenalineTimer = 6.5;
        player.sanity = clamp(player.sanity + 20, 0, 100);
      } else {
        player.sanity = clamp(player.sanity + 35, 0, 100);
      }
      return p;
    }
  }
  return null;
}

export function collectNearbyRelics(
  player: PlayerState,
  relics: RelicItem[]
): RelicItem | null {
  if (player.isHidden) return null;
  for (let i = 0; i < relics.length; i++) {
    const r = relics[i];
    if (r.collected) continue;
    if (Math.hypot(r.x - player.x, r.z - player.z) <= 1.75) {
      r.collected = true;
      player.sanity = clamp(player.sanity + 15, 0, 100);
      return r;
    }
  }
  return null;
}

const DEFAULT_CLUE_PLAQUES: readonly CluePlaque[] = createCastleCluePlaques();

export function findNearestInteractable(
  player: PlayerState,
  notes: readonly LoreNote[],
  puzzles: readonly PuzzleStation[],
  doors: readonly CastleDoor[],
  hidingSpots: readonly HidingSpot[],
  inventory: ReadonlySet<InventoryItemId>,
  plaques: readonly CluePlaque[] = DEFAULT_CLUE_PLAQUES
): InteractTarget | null {
  if (player.isHidden && player.activeHidingSpotId) {
    return { type: 'unhide', spotId: player.activeHidingSpotId };
  }

  let best: InteractTarget | null = null;
  let bestScore = Infinity;

  const tombSealSolved = puzzles.some((p) => p.id === 'tomb_seal' && p.solved);
  if (!player.hasDeed && tombSealSolved) {
    const dDeed = Math.hypot(DEED_ALTAR_POS.x - player.x, DEED_ALTAR_POS.z - player.z);
    if (dDeed <= 2.8) {
      best = { type: 'deed', dist: dDeed };
      bestScore = dDeed - 0.5;
    }
  }

  for (let i = 0; i < doors.length; i++) {
    const door = doors[i];
    if (door.isOpen) continue;
    const dist = Math.hypot(door.x - player.x, door.z - player.z);
    if (dist <= 3.1 && dist < bestScore) {
      const hasReq = !door.requiredItem || inventory.has(door.requiredItem);
      const canUnlock = door.unlocked || hasReq;
      best = {
        type: 'door',
        door,
        dist,
        canUnlock,
        lockedReasonAr: canUnlock ? undefined : door.lockedHintAr,
      };
      bestScore = dist;
    }
  }

  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    const dist = Math.hypot(n.x - player.x, n.z - player.z);
    const maxDist = n.discovered ? 2.15 : 2.95;
    const priorityBonus = n.discovered ? 0.35 : -0.35;
    if (dist <= maxDist && dist + priorityBonus < bestScore) {
      best = { type: 'note', note: n, dist };
      bestScore = dist + priorityBonus;
    }
  }

  for (let i = 0; i < puzzles.length; i++) {
    const pz = puzzles[i];
    if (pz.solved) continue;
    const dist = Math.hypot(pz.x - player.x, pz.z - player.z);
    if (dist <= 2.95 && dist < bestScore) {
      const missingKey = pz.requiredItem && !inventory.has(pz.requiredItem);
      best = {
        type: 'puzzle',
        puzzle: pz,
        dist,
        lockedReasonAr: missingKey
          ? 'تحتاج إلى مفتاح الجناح السابق لتشغيل هذه الآلية.'
          : undefined,
      };
      bestScore = dist;
    }
  }

  const lookX = -Math.sin(player.rotY);
  const lookZ = -Math.cos(player.rotY);
  for (let i = 0; i < plaques.length; i++) {
    const pl = plaques[i];
    const dx = pl.interactX - player.x;
    const dz = pl.interactZ - player.z;
    const dist = Math.hypot(dx, dz);
    const lookDot = dist > 0.05 ? (dx * lookX + dz * lookZ) / dist : 1;
    const maxDist = pl.discovered ? 3.4 : lookDot > 0.85 ? 6.5 : 3.65;
    const priorityBonus = pl.discovered ? 0.2 : lookDot > 0.85 ? -0.45 : -0.25;
    if (dist <= maxDist && dist + priorityBonus < bestScore) {
      best = { type: 'plaque', plaque: pl, dist };
      bestScore = dist + priorityBonus;
    }
  }

  for (let i = 0; i < hidingSpots.length; i++) {
    const s = hidingSpots[i];
    const dist = Math.hypot(s.x - player.x, s.z - player.z);
    if (dist <= 2.55 && dist + 0.15 < bestScore) {
      best = { type: 'hide', spot: s, dist };
      bestScore = dist + 0.15;
    }
  }

  return best;
}

export function getActiveChapterObjective(
  puzzles: readonly PuzzleStation[],
  player: PlayerState,
  doors: readonly CastleDoor[]
): {
  chapterNum: number;
  roomNameAr: string;
  objectiveAr: string;
  targetPos: { x: number; z: number };
} {
  const currentRoom = getRoomAt(player.x, player.z);

  if (player.hasDeed) {
    return {
      chapterNum: 9,
      roomNameAr: currentRoom.nameAr,
      objectiveAr:
        'الجد خرج من قبره! اركض فوراً إلى بوابة القلعة الرئيسية جنوب البهو الملكي وافتحها بمفتاح الخروج!',
      targetPos: MAIN_EXIT_POS,
    };
  }

  const nextPuzzle = puzzles.find((p) => !p.solved);
  if (!nextPuzzle) {
    const cryptDoor = doors.find((d) => d.id === 'door-crypt');
    if (cryptDoor && !cryptDoor.isOpen) {
      return {
        chapterNum: 9,
        roomNameAr: currentRoom.nameAr,
        objectiveAr: 'افتح بوابة سرداب الضريح بمفتاح السرداب لانتزاع وثيقة الميراث!',
        targetPos: { x: cryptDoor.x, z: cryptDoor.z },
      };
    }
    return {
      chapterNum: 9,
      roomNameAr: currentRoom.nameAr,
      objectiveAr: 'ادخل سرداب الضريح والتقط «وثيقة الميراث المختومة» من أمام تابوت الجد!',
      targetPos: DEED_ALTAR_POS,
    };
  }

  const objectivesByPuzzle: Record<string, string> = {
    clock: 'المطلوب (الفصل ١): استكشف البهو الملكي والأجنحة المحيطة وافتح قفل الساعة الطويلة.',
    valves: 'المطلوب (الفصل ٢): ادخل الرواق الغربي ووازن ضغط المرجل البخاري لفتح قبو المراقبة.',
    monitors: 'المطلوب (الفصل ٣): افحص قبو المراقبة واضبط شاشات الحراسة لفتح الجناح الشرقي.',
    elixir: 'المطلوب (الفصل ٤): استكشف المصحة الشرقية وحضّر المركّب الكيميائي لفتح البوابة الفضية.',
    statues: 'المطلوب (الفصل ٥): ادخل قاعة التماثيل الستة وأتمّ طقس الشعلات لفتح مكتب الجد.',
    safe: 'المطلوب (الفصل ٦): فكّ قفل الخزنة البصرية لاستخراج مفتاح جناح نوم الجد.',
    bedroom_chime: 'المطلوب (الفصل ٧): ادخل جناح نوم فيكتور واعزف نوتة الأجراس لتحصل على مفتاح السرداب.',
    tomb_seal: 'المطلوب (الفصل ٨): ادخل السرداب واضبط الأقراص الرخامية لكسر ختم وثيقة الميراث.',
  };

  return {
    chapterNum: nextPuzzle.chapter,
    roomNameAr: currentRoom.nameAr,
    objectiveAr: objectivesByPuzzle[nextPuzzle.id] ?? nextPuzzle.goalAr,
    targetPos: { x: nextPuzzle.x, z: nextPuzzle.z },
  };
}

export { CASTLE_ROOMS, getRoomAt };
