import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRANDFATHER_CHASE_SPEED,
  GRANDFATHER_ENRAGED_SPEED,
  GRANDFATHER_GRAB_WINDUP_SEC,
  GRANDFATHER_LETHAL_GRAB_RADIUS,
  GRANDFATHER_SPAWN_CANDIDATES,
  PLAYER_CROUCH_SPEED,
  PLAYER_DASH_SPEED,
  PLAYER_RADIUS,
  PLAYER_SPRINT_SPEED,
  PLAYER_WALK_SPEED,
  TOTAL_RELICS,
  awakenGrandfatherFromTomb,
  collectNearbyPickups,
  collectNearbyRelics,
  createInitialEnemies,
  createInitialHidingSpots,
  createInitialPickups,
  createInitialPlayerState,
  createInitialRelics,
  createInitialSafeZones,
  disperseEnemiesNearOpenedDoor,
  enterWardrobe,
  exitWardrobe,
  findNearestInteractable,
  getActiveChapterObjective,
  stepEnemies,
  stepPlayerMovement,
  triggerSilverWardBurst,
} from './rules';
import {
  CASTLE_ROOMS,
  DEED_ALTAR_POS,
  createCastleWalls,
  createInitialDoors,
  resolveCastleCollisions,
  sweepCastleMovement,
} from './castleMap';
import {
  INITIAL_SAFE_GRID,
  MARK_INHERITANCE_STORY,
  computeSteamPressure,
  createCastleCluePlaques,
  createInitialLoreNotes,
  createInitialPuzzleStations,
  evaluateElixirMix,
  traceSafeLaserBeam,
  validateGrandfatherClock,
  validateSecurityMonitors,
  validateStatueOffering,
} from './puzzles';
import { InventoryItemId } from './types';
import {
  DIFFICULTY_TUNING,
  STEAM_ACHIEVEMENTS,
  computeRunMasteryRank,
  sanitizeSettings,
} from './achievements';
import {
  StorageLike,
  applyCheckpointToSim,
  clearCheckpointStorage,
  createCheckpointSnapshot,
  loadCheckpointFromStorage,
  saveCheckpointToStorage,
} from './saveSystem';

function overlapsSolidWall(
  x: number,
  z: number,
  radius: number,
  walls: ReturnType<typeof createCastleWalls>,
  doors: ReturnType<typeof createInitialDoors>
): string | null {
  for (const w of walls) {
    const cx = Math.max(w.minX, Math.min(x, w.maxX));
    const cz = Math.max(w.minZ, Math.min(z, w.maxZ));
    const dist = Math.hypot(x - cx, z - cz);
    if (dist < radius - 1e-3) {
      return `wall:${w.id}`;
    }
  }
  for (const d of doors) {
    if (d.isOpen) continue;
    const halfW = d.width * 0.5;
    const minX = d.axis === 'x' ? d.x - halfW : d.x - 0.3;
    const maxX = d.axis === 'x' ? d.x + halfW : d.x + 0.3;
    const minZ = d.axis === 'z' ? d.z - halfW : d.z - 0.3;
    const maxZ = d.axis === 'z' ? d.z + halfW : d.z + 0.3;
    const cx = Math.max(minX, Math.min(x, maxX));
    const cz = Math.max(minZ, Math.min(z, maxZ));
    const dist = Math.hypot(x - cx, z - cz);
    if (dist < radius - 1e-3) {
      return `door:${d.id}`;
    }
  }
  return null;
}

test('Mark is decisively faster than Grandfather Victor both when walking AND sprinting across difficulties', () => {
  assert.ok(
    PLAYER_WALK_SPEED > GRANDFATHER_CHASE_SPEED + 2.5,
    `Mark walk (${PLAYER_WALK_SPEED}) must clearly outpace Grandfather chase (${GRANDFATHER_CHASE_SPEED})`
  );
  assert.ok(
    PLAYER_WALK_SPEED > GRANDFATHER_ENRAGED_SPEED + 2.0,
    `Mark walk (${PLAYER_WALK_SPEED}) must still outpace awakened Grandfather (${GRANDFATHER_ENRAGED_SPEED})`
  );
  assert.ok(
    PLAYER_SPRINT_SPEED > GRANDFATHER_ENRAGED_SPEED + 4.5,
    `Mark sprint (${PLAYER_SPRINT_SPEED}) must give strong escape margin over awakened Grandfather (${GRANDFATHER_ENRAGED_SPEED})`
  );

  const nightmareChase = GRANDFATHER_CHASE_SPEED * DIFFICULTY_TUNING.nightmare.enemySpeedMul;
  const nightmareEnraged = GRANDFATHER_ENRAGED_SPEED * DIFFICULTY_TUNING.nightmare.enemySpeedMul;
  assert.ok(
    PLAYER_WALK_SPEED > nightmareEnraged + 1.5,
    `Even on Nightmare, Mark walk (${PLAYER_WALK_SPEED}) outpaces enraged Grandfather (${nightmareEnraged})`
  );
  assert.ok(PLAYER_SPRINT_SPEED > nightmareChase + 4.5);
  assert.ok(PLAYER_CROUCH_SPEED < PLAYER_WALK_SPEED);
});

test('Grandfather spawns randomly in distant wings (>= 28m from Foyer) and never door-camps behind opened doors', () => {
  const player = createInitialPlayerState();
  const walls = createCastleWalls();
  const doors = createInitialDoors();
  const safeZones = createInitialSafeZones();

  // Verify every candidate spawn is >= 28m from Mark's starting position and collision-free
  for (let i = 0; i < GRANDFATHER_SPAWN_CANDIDATES.length; i++) {
    const rngVal = (i + 0.25) / GRANDFATHER_SPAWN_CANDIDATES.length;
    const enemies = createInitialEnemies(() => rngVal);
    const gf = enemies.find((e) => e.kind === 'grandfather')!;
    const distFromPlayer = Math.hypot(gf.x - player.x, gf.z - player.z);
    assert.ok(
      distFromPlayer >= 28.0,
      `Grandfather candidate ${i} spawned too close to Foyer (${distFromPlayer.toFixed(1)}m)`
    );
    assert.equal(overlapsSolidWall(gf.x, gf.z, 0.52, walls, doors), null);
  }

  // Simulate Grandfather lurking right behind West Gallery door (-12.5, 26.0) when Mark unlocks it!
  const enemies = createInitialEnemies(() => 0.1);
  const gf = enemies.find((e) => e.kind === 'grandfather')!;
  const westDoor = doors.find((d) => d.id === 'door-west-gallery')!;
  player.x = -8.2;
  player.z = 26.0;
  gf.x = -12.5;
  gf.z = 26.0;
  gf.alertState = 'chase';

  westDoor.unlocked = true;
  westDoor.isOpen = true;
  disperseEnemiesNearOpenedDoor(westDoor, enemies, player, doors, walls, safeZones);

  const newDistToDoor = Math.hypot(gf.x - westDoor.x, gf.z - westDoor.z);
  const newDistToPlayer = Math.hypot(gf.x - player.x, gf.z - player.z);
  assert.ok(
    newDistToDoor >= 20.0 && newDistToPlayer >= 25.0,
    `Expected Grandfather to disperse away from opened door, got doorDist=${newDistToDoor.toFixed(1)}, playerDist=${newDistToPlayer.toFixed(1)}`
  );
  assert.equal(gf.alertState, 'patrol');
});

test('Swept collision prevents wall, door, corner, staircase, and optional wing prop penetration at max dash speed', () => {
  const walls = createCastleWalls();
  const doors = createInitialDoors();
  const safeZones = createInitialSafeZones();

  const testRays = [
    { startX: 0, startZ: 40.5, dx: 0, dz: 12.0 }, // South exit gate
    { startX: -8.5, startZ: 26.0, dx: -10.0, dz: 0 }, // Closed West Gallery door
    { startX: 8.5, startZ: 26.0, dx: 10.0, dz: 0 }, // Closed East Portrait door
    { startX: -9.2, startZ: 41.2, dx: -8.0, dz: 8.0 }, // SW Foyer corner seam
    { startX: 0, startZ: 31.0, dx: 0, dz: -10.0 }, // Foyer Grand Staircase steps
    { startX: -21.5, startZ: 42.0, dx: -8.0, dz: 0 }, // Gothic Library bookshelf
    { startX: 22.5, startZ: 40.5, dx: 0, dz: 8.0 }, // Banquet Hall grand table
  ];

  for (const ray of testRays) {
    let x = ray.startX;
    let z = ray.startZ;
    for (let step = 0; step < 30; step++) {
      const next = sweepCastleMovement(x, z, ray.dx * 0.05, ray.dz * 0.05, PLAYER_RADIUS, walls, doors);
      x = next.x;
      z = next.z;
      const hit = overlapsSolidWall(x, z, PLAYER_RADIUS, walls, doors);
      assert.equal(hit, null, `Player penetrated ${hit} at (${x.toFixed(2)}, ${z.toFixed(2)})`);
    }
  }

  const player = createInitialPlayerState();
  player.x = -8.8;
  player.z = 33.0;
  player.rotY = Math.PI / 2;
  player.dashTimer = 0.25;
  assert.ok(PLAYER_DASH_SPEED > 11.0);
  for (let i = 0; i < 20; i++) {
    stepPlayerMovement(player, { forward: 1, strafe: 0, sprint: true }, walls, doors, safeZones, 0.05);
    assert.ok(player.x > -9.85, `Player clipped across West Foyer wall: x=${player.x}`);
    assert.equal(overlapsSolidWall(player.x, player.z, PLAYER_RADIUS, walls, doors), null);
  }
});

test('All 14 rooms, 18 pickups, 12 relics, 11 wardrobes, and 11 notes are valid and spoiler-free', () => {
  assert.equal(CASTLE_ROOMS.length, 14);
  const walls = createCastleWalls();
  const doors = createInitialDoors();
  assert.equal(doors.length, 16);
  const optionalDoors = doors.filter((d) => d.isOptionalWing);
  assert.equal(optionalDoors.length, 6);
  for (const od of optionalDoors) {
    assert.equal(od.unlocked, true, `Optional wing door ${od.id} should be unlocked for exploration`);
  }

  // Open all doors to verify interior placements across all 14 rooms
  for (const d of doors) d.isOpen = true;

  const pickups = createInitialPickups();
  assert.equal(pickups.length, 18);
  for (const p of pickups) {
    assert.equal(
      overlapsSolidWall(p.x, p.z, 0.35, walls, doors),
      null,
      `Pickup ${p.id} overlaps solid collider`
    );
  }

  const relics = createInitialRelics();
  assert.equal(relics.length, TOTAL_RELICS);
  assert.equal(TOTAL_RELICS, 12);
  for (const r of relics) {
    assert.equal(
      overlapsSolidWall(r.x, r.z, 0.35, walls, doors),
      null,
      `Relic ${r.id} overlaps solid collider`
    );
  }

  const hidingSpots = createInitialHidingSpots();
  assert.equal(hidingSpots.length, 11);
  const player = createInitialPlayerState();
  for (const spot of hidingSpots) {
    enterWardrobe(player, spot, walls, doors);
    assert.equal(player.isHidden, true);
    exitWardrobe(player, walls, doors);
    assert.equal(player.isHidden, false);
    assert.equal(
      overlapsSolidWall(player.x, player.z, PLAYER_RADIUS, walls, doors),
      null,
      `Wardrobe exit for ${spot.id} overlaps solid collider at (${player.x}, ${player.z})`
    );
  }

  const puzzles = createInitialPuzzleStations();
  const notes = createInitialLoreNotes();
  assert.equal(notes.length, 11);
  assert.equal(notes.filter((n) => n.isOptionalLore).length, 5);

  // Verify ZERO solution spoilers in puzzle titles, goals, or HUD objectives!
  const bannedSpoilers = ['1894', '80 PSI', '19 مل', '2 → 4 → 1 → 3', '١ ← ٤ ← ٢ ← ٦'];
  for (const pz of puzzles) {
    for (const sp of bannedSpoilers) {
      assert.equal(
        pz.titleAr.includes(sp) || pz.goalAr.includes(sp),
        false,
        `Puzzle ${pz.id} leaked spoiler "${sp}" in titleAr/goalAr!`
      );
    }
    const resolved = resolveCastleCollisions(pz.x, pz.z + 1.1, PLAYER_RADIUS, walls, doors);
    const resolvedAlt = resolveCastleCollisions(pz.x + 1.1, pz.z, PLAYER_RADIUS, walls, doors);
    const d1 = Math.hypot(resolved.x - pz.x, resolved.z - pz.z);
    const d2 = Math.hypot(resolvedAlt.x - pz.x, resolvedAlt.z - pz.z);
    assert.ok(Math.min(d1, d2) <= 2.9, `Puzzle ${pz.id} must be reachable within interaction range`);
  }

  const ch1Obj = getActiveChapterObjective(puzzles, createInitialPlayerState(), createInitialDoors());
  assert.equal(ch1Obj.objectiveAr.includes('1894'), false, 'HUD objective must not leak 1894');
});

test('Crouch stealth lowers eye height, suppresses loud footsteps, and minimizes acoustic noise', () => {
  const walls = createCastleWalls();
  const doors = createInitialDoors();
  const safeZones = createInitialSafeZones();

  const crouchPlayer = createInitialPlayerState();
  let crouchFootsteps = 0;
  for (let i = 0; i < 15; i++) {
    const res = stepPlayerMovement(
      crouchPlayer,
      { forward: 1, strafe: 0, sprint: false, crouch: true },
      walls,
      doors,
      safeZones,
      0.05
    );
    if (res.footstepTriggered) crouchFootsteps++;
  }

  const sprintPlayer = createInitialPlayerState();
  for (let i = 0; i < 15; i++) {
    stepPlayerMovement(
      sprintPlayer,
      { forward: 1, strafe: 0, sprint: true, crouch: false },
      walls,
      doors,
      safeZones,
      0.05
    );
  }

  assert.equal(crouchFootsteps, 0, 'Crouching must silence loud footstep triggers');
  assert.ok(crouchPlayer.eyeHeight < 1.25, `Expected lowered crouch eyeHeight, got ${crouchPlayer.eyeHeight}`);
  assert.ok(
    crouchPlayer.noiseLevel < sprintPlayer.noiseLevel * 0.3,
    `Crouch noise (${crouchPlayer.noiseLevel}) must be much quieter than sprint (${sprintPlayer.noiseLevel})`
  );
});

test('Full Mark inheritance story parchment contains Mark, Grandfather, debts, deed, and tomb awakening', () => {
  const fullText = [
    MARK_INHERITANCE_STORY.titleAr,
    ...MARK_INHERITANCE_STORY.paragraphsAr,
    MARK_INHERITANCE_STORY.signatureAr,
  ].join(' ');
  assert.ok(fullText.includes('مارك'));
  assert.ok(fullText.includes('الديون'));
  assert.ok(fullText.includes('فيكتور'));
  assert.ok(fullText.includes('وثيقة الميراث') || fullText.includes('ورقة الورث'));
  assert.ok(fullText.includes('قبر'));
});

test('All 6 sequential castle puzzle validators accept exact solutions and reject wrong inputs', () => {
  assert.equal(validateGrandfatherClock([1, 8, 9, 4]), true);
  assert.equal(validateGrandfatherClock([1, 8, 9, 5]), false);

  assert.equal(computeSteamPressure([true, false, true, false, true]).solved, true);
  assert.equal(computeSteamPressure([true, true, false, false, true]).solved, false);

  assert.equal(validateSecurityMonitors([2, 4, 1, 3]), true);
  assert.equal(validateSecurityMonitors([1, 2, 3, 4]), false);

  assert.equal(evaluateElixirMix([true, false, true, true, false]).solved, true);
  assert.equal(evaluateElixirMix([true, true, false, false, true]).solved, false);

  assert.equal(validateStatueOffering([1, 4, 2, 6]), true);
  assert.equal(validateStatueOffering([1, 2, 4, 6]), false);

  assert.equal(traceSafeLaserBeam(INITIAL_SAFE_GRID).solved, false);
  const solvedSafe = [
    0, 2, 2,
    2, 0, 1,
    1, 2, 0,
  ];
  assert.equal(traceSafeLaserBeam(solvedSafe).solved, true);
});

test('Grandfather performs a fair 0.42s grab windup before executing Mark in one lethal hit', () => {
  const player = createInitialPlayerState();
  const walls = createCastleWalls();
  const doors = createInitialDoors();
  const safeZones = createInitialSafeZones();
  safeZones[0].active = false;

  player.x = -18.0;
  player.z = 26.0;
  player.isHidden = false;

  const enemies = createInitialEnemies(() => 0.0);
  const gf = enemies.find((e) => e.kind === 'grandfather')!;
  gf.x = player.x + GRANDFATHER_LETHAL_GRAB_RADIUS * 0.7;
  gf.z = player.z;
  gf.alertState = 'chase';

  // Frame 1: Grandfather enters windup telegraph instead of instant unfair zero-frame death!
  const firstStep = stepEnemies(enemies, player, walls, doors, safeZones, 0.05);
  assert.equal(firstStep.lethalCatchByGrandfather, false);
  assert.equal(gf.phase, 'windup');
  assert.ok(GRANDFATHER_GRAB_WINDUP_SEC >= 0.35);

  // If Mark stays inside lethal range until windup finishes, Grandfather executes in 1 hit!
  let caught = false;
  for (let i = 0; i < 12; i++) {
    const res = stepEnemies(enemies, player, walls, doors, safeZones, 0.05);
    if (res.lethalCatchByGrandfather) {
      caught = true;
      assert.equal(res.killerEnemy?.kind, 'grandfather');
      assert.equal(gf.phase, 'executing');
      break;
    }
  }
  assert.equal(caught, true, 'Grandfather must execute Mark in 1 hit once windup completes');
});

test('Claiming Inheritance Deed in Crypt awakens Grandfather from his tomb and opens escape route', () => {
  const player = createInitialPlayerState();
  player.x = DEED_ALTAR_POS.x;
  player.z = DEED_ALTAR_POS.z;

  const notes = createInitialLoreNotes();
  const puzzles = createInitialPuzzleStations();
  const doors = createInitialDoors();
  const hidingSpots = createInitialHidingSpots();
  const safeZones = createInitialSafeZones();
  const enemies = createInitialEnemies(() => 0.2);
  const walls = createCastleWalls();

  const target = findNearestInteractable(player, notes, puzzles, doors, hidingSpots, new Set());
  assert.equal(target?.type, 'deed');

  awakenGrandfatherFromTomb(player, enemies, doors, safeZones, walls);
  assert.equal(player.hasDeed, true);
  assert.equal(player.tombAwakened, true);
  assert.equal(safeZones[0].active, false);

  const escapeDoor = doors.find((d) => d.id === 'door-crypt-escape')!;
  assert.equal(escapeDoor.isOpen, true);

  const gf = enemies.find((e) => e.kind === 'grandfather')!;
  assert.equal(gf.alertState, 'chase');
  assert.equal(gf.chaseSpeed, GRANDFATHER_ENRAGED_SPEED);
  assert.equal(overlapsSolidWall(gf.x, gf.z, 0.52, walls, doors), null);

  const stunned = triggerSilverWardBurst(player, enemies, true);
  assert.ok(stunned >= 1);
  assert.ok(gf.stunTimer >= 5.0);
});

test('Steam features: Adrenaline syringe, Relic collection, Settings clamping, and Mastery Rank S+', () => {
  assert.equal(STEAM_ACHIEVEMENTS.length, 8);

  const player = createInitialPlayerState();
  player.stamina = 15;
  player.staminaExhausted = true;
  player.sanity = 60;

  const pickups = createInitialPickups();
  const adr = pickups.find((p) => p.kind === 'adrenaline')!;
  player.x = adr.x;
  player.z = adr.z;
  const picked = collectNearbyPickups(player, pickups);
  assert.equal(picked?.kind, 'adrenaline');
  assert.equal(player.stamina, 100);
  assert.equal(player.staminaExhausted, false);
  assert.ok(player.adrenalineTimer >= 6.0);

  const relics = createInitialRelics();
  player.x = relics[0].x;
  player.z = relics[0].z;
  const foundRelic = collectNearbyRelics(player, relics);
  assert.equal(foundRelic?.id, relics[0].id);
  assert.equal(relics[0].collected, true);

  const clamped = sanitizeSettings({ fov: 140, masterVolume: -20, lookSensitivity: 9.5 });
  assert.equal(clamped.fov, 90);
  assert.equal(clamped.masterVolume, 0);
  assert.equal(clamped.lookSensitivity, 2.0);

  assert.equal(
    computeRunMasteryRank({
      outcome: 'victory',
      sigilsCollected: 6,
      relicsFound: 10,
      notesFound: 8,
      survivalSeconds: 350,
      sanityRemaining: 85,
    }),
    'S+'
  );
  assert.equal(
    computeRunMasteryRank({
      outcome: 'defeat',
      sigilsCollected: 2,
      relicsFound: 1,
      notesFound: 1,
      survivalSeconds: 120,
      sanityRemaining: 0,
    }),
    'C'
  );
});

test('Grandfather Victor always faces forward (+Z chest/eyes/claws) toward Mark and never moves backwards', () => {
  const walls = createCastleWalls();
  const doors = createInitialDoors();
  const safeZones = createInitialSafeZones();

  const testCases = [
    { gx: -4.0, gz: 29.0, px: -4.0, pz: 37.0, label: 'North -> South in Foyer' },
    { gx: 4.5, gz: 38.0, px: 4.5, pz: 29.0, label: 'South -> North in Foyer' },
    { gx: -6.5, gz: 35.0, px: 5.5, pz: 35.0, label: 'West -> East across Foyer carpet' },
    { gx: 5.5, gz: 34.0, px: -5.5, pz: 40.0, label: 'NE -> SW diagonal in Foyer' },
  ];

  for (const tc of testCases) {
    const player = createInitialPlayerState();
    player.x = tc.px;
    player.z = tc.pz;
    player.flashlightOn = true;

    const enemies = createInitialEnemies(() => 0.1);
    const gf = enemies.find((e) => e.kind === 'grandfather')!;
    gf.x = tc.gx;
    gf.z = tc.gz;
    gf.rotY = Math.PI; // Start deliberately facing away to test smooth forward turn
    gf.alertState = 'chase';
    gf.alertTimer = 10;

    for (let step = 0; step < 18; step++) {
      stepEnemies(enemies, player, walls, doors, safeZones, 0.05);
    }

    // Rig local +Z rotated by rotY yields world forward vector (sin(rotY), cos(rotY))
    const fwdX = Math.sin(gf.rotY);
    const fwdZ = Math.cos(gf.rotY);
    const toPlayerX = player.x - gf.x;
    const toPlayerZ = player.z - gf.z;
    const dist = Math.hypot(toPlayerX, toPlayerZ);
    const dot = (fwdX * toPlayerX + fwdZ * toPlayerZ) / Math.max(1e-4, dist);

    assert.ok(
      dot > 0.92,
      `[${tc.label}] Expected Grandfather +Z front to face Mark (dot > 0.92), got dot=${dot.toFixed(3)}`
    );
  }
});

test('Grandfather relentlessly pursues Mark onto the Foyer carpet and routes cleanly around the Grand Staircase without sticking', () => {
  const walls = createCastleWalls();
  const doors = createInitialDoors();
  const safeZones = createInitialSafeZones(); // Keep safeZones[0] ACTIVE at (0, 35) to verify bug is gone!

  const player = createInitialPlayerState();
  player.x = 0.0;
  player.z = 36.2; // Standing right on the Foyer carpet south of the Grand Staircase!
  player.flashlightOn = true;

  const enemies = createInitialEnemies(() => 0.2);
  const gf = enemies.find((e) => e.kind === 'grandfather')!;
  // Place Grandfather directly north of the solid Foyer Grand Staircase (x: -1.38..1.38, z: 23.8..29.75)
  gf.x = 0.0;
  gf.z = 22.0;
  gf.alertState = 'chase';
  gf.alertTimer = 12.0;

  let reachedCloseRange = false;
  for (let step = 0; step < 160; step++) {
    stepEnemies(enemies, player, walls, doors, safeZones, 0.05);
    assert.equal(
      gf.alertState,
      'chase',
      `Grandfather must NEVER lose aggro on Foyer carpet (dropped to ${gf.alertState} at step ${step})`
    );
    assert.equal(
      overlapsSolidWall(gf.x, gf.z, 0.52, walls, doors),
      null,
      `Grandfather clipped into wall/staircase at (${gf.x.toFixed(2)}, ${gf.z.toFixed(2)})`
    );
    const dist = Math.hypot(gf.x - player.x, gf.z - player.z);
    if (dist <= 1.8) {
      reachedCloseRange = true;
      break;
    }
  }

  assert.equal(
    reachedCloseRange,
    true,
    `Grandfather got stuck instead of bypassing Foyer staircase! Final pos=(${gf.x.toFixed(2)}, ${gf.z.toFixed(2)})`
  );
});

test('All 6 physical 3D clue plaques & 6 chapter notes are reachable, contain exact puzzle clues, and unlock the entire castle end-to-end', () => {
  const walls = createCastleWalls();
  const doors = createInitialDoors();
  for (const d of doors) d.isOpen = true;

  const plaques = createCastleCluePlaques();
  const notes = createInitialLoreNotes();
  const puzzles = createInitialPuzzleStations();
  const hidingSpots = createInitialHidingSpots();
  assert.equal(plaques.length, 6);

  // 1. Every physical 3D CluePlaque is standing in valid collision-free floor space and is inspectable via [E]
  for (const pl of plaques) {
    assert.equal(
      overlapsSolidWall(pl.interactX, pl.interactZ, PLAYER_RADIUS, walls, doors),
      null,
      `CluePlaque ${pl.id} overlaps solid wall at (${pl.interactX}, ${pl.interactZ})`
    );
    const p = createInitialPlayerState();
    p.x = pl.interactX;
    p.z = pl.interactZ;
    // Mark notes discovered temporarily so we verify plaque detection cleanly
    const discoveredNotes = notes.map((n) => ({ ...n, discovered: true }));
    const solvedPuzzles = puzzles.map((pz) => ({ ...pz, solved: true }));
    const hit = findNearestInteractable(p, discoveredNotes, solvedPuzzles, doors, hidingSpots, new Set(), plaques);
    assert.equal(hit?.type, 'plaque', `Expected plaque interaction for ${pl.id}, got ${hit?.type}`);
    if (hit?.type === 'plaque') {
      assert.equal(hit.plaque.id, pl.id);
    }
  }

  // 2. Verify each puzzle's in-world clue text (both Note AND Plaque) genuinely communicates the secret code/rule!
  const expectedTokensByPuzzle: Record<string, string[]> = {
    clock: ['1894'],
    valves: ['80 PSI'],
    monitors: ['الرواق المقنطر', 'المصحة الشرقية', 'البهو الملكي', 'قاعة التماثيل'],
    elixir: ['19 مل'],
    statues: ['الديون', 'الميراث', 'الصمت', 'الضريح'],
    safe: ['أعلى اليسار', 'أسفل اليمين'],
  };

  for (const pz of puzzles) {
    const note = notes.find((n) => n.relatedPuzzle === pz.id);
    const plaque = plaques.find((pl) => pl.puzzleId === pz.id);
    assert.ok(note, `Missing related LoreNote for puzzle ${pz.id}`);
    assert.ok(plaque, `Missing physical CluePlaque for puzzle ${pz.id}`);
    assert.ok(note!.roomNameAr.length > 3, `Note ${note!.id} must specify roomNameAr`);
    for (const token of expectedTokensByPuzzle[pz.id]) {
      assert.ok(
        note!.bodyAr.includes(token),
        `LoreNote ${note!.id} is missing clue token "${token}"`
      );
      assert.ok(
        plaque!.inscriptionAr.includes(token),
        `CluePlaque ${plaque!.id} is missing clue token "${token}"`
      );
    }
  }

  // 3. Simulate full 6-chapter sequential playthrough from locked Castle start to Victory Exit Gate!
  const simDoors = createInitialDoors();
  const simPuzzles = createInitialPuzzleStations();
  const simPlayer = createInitialPlayerState();
  const inv = new Set<InventoryItemId>();

  const chapterSteps: Array<{
    puzzleId: string;
    doorToUnlockAfter: string;
    solverCheck: () => boolean;
  }> = [
    {
      puzzleId: 'clock',
      doorToUnlockAfter: 'door-west-gallery',
      solverCheck: () => validateGrandfatherClock([1, 8, 9, 4]),
    },
    {
      puzzleId: 'valves',
      doorToUnlockAfter: 'door-security',
      solverCheck: () => computeSteamPressure([true, false, true, false, true]).solved,
    },
    {
      puzzleId: 'monitors',
      doorToUnlockAfter: 'door-east-hall',
      solverCheck: () => validateSecurityMonitors([2, 4, 1, 3]),
    },
    {
      puzzleId: 'elixir',
      doorToUnlockAfter: 'door-statue-hall',
      solverCheck: () => evaluateElixirMix([true, false, true, true, false]).solved,
    },
    {
      puzzleId: 'statues',
      doorToUnlockAfter: 'door-study',
      solverCheck: () => validateStatueOffering([1, 4, 2, 6]),
    },
    {
      puzzleId: 'safe',
      doorToUnlockAfter: 'door-crypt',
      solverCheck: () => traceSafeLaserBeam([0, 2, 2, 2, 0, 1, 1, 2, 0]).solved,
    },
  ];

  for (const step of chapterSteps) {
    const pz = simPuzzles.find((item) => item.id === step.puzzleId)!;
    if (pz.requiredItem) {
      assert.equal(inv.has(pz.requiredItem), true, `Missing required item ${pz.requiredItem} for ${pz.id}`);
    }
    assert.equal(step.solverCheck(), true, `Validator failed for ${step.puzzleId}`);
    pz.solved = true;
    if (pz.rewardItem) inv.add(pz.rewardItem);
    if (pz.secondaryRewardItem) inv.add(pz.secondaryRewardItem);

    const door = simDoors.find((d) => d.id === step.doorToUnlockAfter)!;
    assert.ok(door.requiredItem && inv.has(door.requiredItem), `Reward did not unlock ${door.id}`);
    door.unlocked = true;
    door.isOpen = true;
  }

  // Claim Inheritance Deed in Crypt & unlock Main Castle Gate
  inv.add('inheritance_deed');
  inv.add('master_exit_key');
  simPlayer.hasDeed = true;
  const mainGate = simDoors.find((d) => d.isMainExit)!;
  simPlayer.x = mainGate.x;
  simPlayer.z = mainGate.z - 1.4;
  const exitCheck = findNearestInteractable(simPlayer, notes, simPuzzles, simDoors, hidingSpots, inv, plaques);
  assert.equal(exitCheck?.type, 'door');
  if (exitCheck?.type === 'door') {
    assert.equal(exitCheck.door.isMainExit, true);
    assert.equal(exitCheck.canUnlock, true);
  }
});

test('Grandfather automatically swings open closed unlocked doors without sticking, relentlessly hunts fleeing Mark across rooms, and loses trail when Mark hides in a wardrobe', () => {
  const walls = createCastleWalls();
  const doors = createInitialDoors();
  const safeZones = createInitialSafeZones();
  const hidingSpots = createInitialHidingSpots();

  const libDoor = doors.find((d) => d.id === 'door-library')!;
  assert.equal(libDoor.unlocked, true);
  assert.equal(libDoor.isOpen, false);

  // Place Grandfather inside Gothic Library (-18.5, 40.5) and Mark running away in Foyer (-3.5, 33.5) (~16.5m away, around corner)
  const player = createInitialPlayerState();
  player.x = -3.5;
  player.z = 33.5;
  player.flashlightOn = false; // Even with flashlight OFF and not sprinting, Grandfather tracks fleeing Mark during active chase!
  player.isSprinting = false;
  player.isCrouching = false;

  const enemies = createInitialEnemies(() => 0.0);
  const gf = enemies.find((e) => e.kind === 'grandfather')!;
  gf.x = -18.5;
  gf.z = 40.5;
  gf.alertState = 'chase';
  gf.alertTimer = 14.0;
  gf.targetX = player.x;
  gf.targetZ = player.z;

  let doorForced = false;
  let enteredFoyer = false;
  for (let step = 0; step < 180; step++) {
    const res = stepEnemies(enemies, player, walls, doors, safeZones, 0.05);
    if (res.doorForcedOpen) doorForced = true;
    assert.equal(
      overlapsSolidWall(gf.x, gf.z, 0.52, walls, doors),
      null,
      `Grandfather clipped into wall/door at (${gf.x.toFixed(2)}, ${gf.z.toFixed(2)})`
    );
    assert.equal(
      gf.alertState,
      'chase',
      `Grandfather prematurely abandoned chase at step ${step} while Mark was ${Math.hypot(gf.x - player.x, gf.z - player.z).toFixed(1)}m away!`
    );
    if (gf.x > -8.5) {
      enteredFoyer = true;
      break;
    }
  }

  assert.equal(libDoor.isOpen, true, 'Grandfather must swing open unlocked closed doors in his path');
  assert.equal(doorForced, true, 'stepEnemies must report doorForcedOpen for audio feedback');
  assert.equal(
    enteredFoyer,
    true,
    `Grandfather got stuck behind door-library instead of entering Foyer! Final pos=(${gf.x.toFixed(2)}, ${gf.z.toFixed(2)})`
  );

  // Now Mark ducks inside a nearby Foyer Wardrobe -> Grandfather can no longer track Mark's live position!
  const foyerWardrobe = hidingSpots[0];
  enterWardrobe(player, foyerWardrobe, walls, doors);
  assert.equal(player.isHidden, true);
  // Set target away from wardrobe so Grandfather finishes searching and stands down
  gf.targetX = 4.0;
  gf.targetZ = 36.0;
  gf.alertTimer = 1.0;
  for (let step = 0; step < 90; step++) {
    stepEnemies(enemies, player, walls, doors, safeZones, 0.05);
  }
  assert.notEqual(gf.alertState, 'chase', 'Grandfather must eventually drop chase when Mark hides inside a wardrobe');
});

test('Foyer 1894 staircase lectern is immediately inspectable in front of Mark and all 6 CluePlaques carry featuredCode + subInscriptionAr', () => {
  const plaques = createCastleCluePlaques();
  const notes = createInitialLoreNotes();
  const puzzles = createInitialPuzzleStations();
  const doors = createInitialDoors();
  const hidingSpots = createInitialHidingSpots();

  for (const pl of plaques) {
    assert.ok(pl.featuredCode.length >= 4, `Plaque ${pl.id} must have a prominent featuredCode`);
    assert.ok(pl.subInscriptionAr.length >= 12, `Plaque ${pl.id} must have a clear subInscriptionAr`);
    assert.ok(pl.roomNameAr.length >= 4, `Plaque ${pl.id} must specify roomNameAr`);
  }

  // Stand right in front of the Foyer Grand Staircase where Mark naturally walks (0, 31.4) facing North (rotY = 0)
  const player = createInitialPlayerState();
  player.x = 0.0;
  player.z = 31.4;
  player.rotY = 0;

  const target = findNearestInteractable(player, notes, puzzles, doors, hidingSpots, new Set(), plaques);
  assert.equal(target?.type, 'plaque', `Expected Foyer 1894 lectern plaque right at staircase foot, got ${target?.type}`);
  if (target?.type === 'plaque') {
    assert.equal(target.plaque.id, 'plaque-foyer-1894');
    assert.equal(target.plaque.featuredCode, '1894');
  }
});

test('Checkpoint save & load system preserves Chapter 4 progress (3/6 puzzles, unlocked doors, keys, relics, notes) and restores safely away from enemies', () => {
  const mem = new Map<string, string>();
  const mockStorage: StorageLike = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => {
      mem.set(k, v);
    },
    removeItem: (k) => {
      mem.delete(k);
    },
  };

  const walls = createCastleWalls();
  const doors = createInitialDoors();
  const puzzles = createInitialPuzzleStations();
  const notes = createInitialLoreNotes();
  const plaques = createCastleCluePlaques();
  const relics = createInitialRelics();
  const pickups = createInitialPickups();
  const player = createInitialPlayerState();
  const inventory = new Set<InventoryItemId>(['west_wing_key', 'security_key', 'infirmary_key']);

  // Simulate user reaching Chapter 4 Infirmary (3/6 puzzles solved, 5/12 relics, 3/11 notes, 26% battery)
  for (const id of ['clock', 'valves', 'monitors']) {
    puzzles.find((p) => p.id === id)!.solved = true;
  }
  for (const dId of ['door-west-gallery', 'door-security', 'door-east-hall']) {
    const d = doors.find((item) => item.id === dId)!;
    d.unlocked = true;
    d.isOpen = true;
  }
  for (let i = 0; i < 3; i++) notes[i].discovered = true;
  for (let i = 0; i < 5; i++) relics[i].collected = true;
  plaques[0].discovered = true;
  pickups[0].collected = true;

  player.x = 22.5;
  player.z = 3.2;
  player.rotY = 0.45;
  player.battery = 26;
  player.sanity = 30;

  const snap = createCheckpointSnapshot({
    player,
    doors,
    notes,
    plaques,
    puzzles,
    pickups,
    relics,
    inventory,
    playedDialogues: new Set(['intro_foyer', 'west_wing_opened']),
    survivalSeconds: 245,
  });

  assert.equal(snap.chapterNum, 4);
  assert.equal(snap.sigilsSolved, 3);
  assert.equal(snap.relicsFound, 5);
  assert.equal(snap.notesFound, 3);
  assert.equal(saveCheckpointToStorage(snap, mockStorage), true);

  const loaded = loadCheckpointFromStorage(mockStorage);
  assert.ok(loaded, 'Checkpoint should deserialize cleanly from storage');
  assert.equal(loaded!.chapterNum, 4);
  assert.equal(loaded!.sigilsSolved, 3);

  // Restore into a brand-new simulation instance
  const targetSim = {
    player: createInitialPlayerState(),
    doors: createInitialDoors(),
    safeZones: createInitialSafeZones(),
    notes: createInitialLoreNotes(),
    plaques: createCastleCluePlaques(),
    puzzles: createInitialPuzzleStations(),
    pickups: createInitialPickups(),
    relics: createInitialRelics(),
    enemies: createInitialEnemies(() => 0.25),
    inventory: new Set<InventoryItemId>(),
    playedDialogues: new Set<string>(),
    survivalSeconds: 0,
    walls,
  };

  applyCheckpointToSim(targetSim, loaded!, () => 0.35);

  assert.equal(targetSim.puzzles.filter((p) => p.solved).length, 3);
  assert.equal(targetSim.relics.filter((r) => r.collected).length, 5);
  assert.equal(targetSim.notes.filter((n) => n.discovered).length, 3);
  assert.equal(targetSim.doors.find((d) => d.id === 'door-east-hall')?.isOpen, true);
  assert.equal(targetSim.inventory.has('infirmary_key'), true);
  assert.ok(Math.hypot(targetSim.player.x - 22.5, targetSim.player.z - 3.2) < 0.5);
  // Playable floor guarantees Mark never spawns in a 1-hit sanity/battery death loop
  assert.ok(targetSim.player.sanity >= 45);
  assert.ok(targetSim.player.battery >= 35);

  const gf = targetSim.enemies.find((e) => e.kind === 'grandfather')!;
  const phantom = targetSim.enemies.find((e) => e.kind === 'phantom')!;
  assert.ok(
    Math.hypot(gf.x - targetSim.player.x, gf.z - targetSim.player.z) >= 24.0,
    'Grandfather must be dispersed >=24m away from restored checkpoint'
  );
  assert.ok(
    Math.hypot(phantom.x - targetSim.player.x, phantom.z - targetSim.player.z) >= 14.0,
    'Infirmary Wraith must be dispersed >=14m away from restored checkpoint'
  );

  clearCheckpointStorage(mockStorage);
  assert.equal(loadCheckpointFromStorage(mockStorage), null);
});

test('Chained Asylum Wraith (phantom) & Statue Watcher patrol cleanly without ever sticking to walls, pursue around corners for 8s, and slow under flashlight without wall pushback', () => {
  const walls = createCastleWalls();
  const doors = createInitialDoors();
  const safeZones = createInitialSafeZones();
  const player = createInitialPlayerState();
  // Keep player hidden far away first to test 30 seconds of uninterrupted patrol
  player.x = 0;
  player.z = 38.5;
  player.isHidden = true;

  const enemies = createInitialEnemies(() => 0.0);
  const phantom = enemies.find((e) => e.kind === 'phantom')!;
  const watcher = enemies.find((e) => e.kind === 'watcher')!;

  const visitedPhantomWps = new Set<number>([phantom.waypointIndex]);
  for (let i = 0; i < 600; i++) {
    stepEnemies(enemies, player, walls, doors, safeZones, 0.05);
    visitedPhantomWps.add(phantom.waypointIndex);
    assert.equal(
      overlapsSolidWall(phantom.x, phantom.z, 0.45, walls, doors),
      null,
      `Phantom overlapped solid wall at (${phantom.x.toFixed(2)}, ${phantom.z.toFixed(2)})`
    );
    assert.equal(
      overlapsSolidWall(watcher.x, watcher.z, 0.45, walls, doors),
      null,
      `Watcher overlapped solid wall at (${watcher.x.toFixed(2)}, ${watcher.z.toFixed(2)})`
    );
  }
  assert.ok(
    visitedPhantomWps.size >= 3,
    `Infirmary Wraith got stuck instead of patrolling waypoints (visited ${visitedPhantomWps.size})`
  );

  // Now put Mark in Infirmary (21.0, 2.5), spot him, then step Mark behind the central Infirmary island (25.0, 1.0 -> behind 23.5..26.5, -4.5..-1.5)
  player.isHidden = false;
  player.isCrouching = false;
  player.flashlightOn = true;
  player.battery = 85;
  phantom.x = 28.5;
  phantom.z = -7.5;
  player.x = 28.5;
  player.z = 1.5;
  player.rotY = 0; // Shining flashlight North straight at Phantom!

  const spotStep = stepEnemies(enemies, player, walls, doors, safeZones, 0.05);
  assert.equal(phantom.alertState, 'chase', 'Phantom must immediately enter chase when spotting Mark');
  assert.equal(spotStep.chasingEnemyKind, 'apparition');
  assert.ok(phantom.z > -7.5, 'Flashlight must slow Phantom rather than shoving it backwards into North wall');

  // Mark ducks behind the solid Infirmary central island (x=25.0, z=2.0) breaking direct LOS from (28.5, -7.4)
  player.x = 20.0;
  player.z = -3.0;
  player.flashlightOn = false;
  for (let i = 0; i < 60; i++) {
    stepEnemies(enemies, player, walls, doors, safeZones, 0.05);
  }
  assert.equal(
    phantom.alertState,
    'chase',
    'Phantom must NOT immediately drop chase when Mark steps behind an obstacle for 3 seconds!'
  );
  assert.ok(
    Math.hypot(phantom.x - player.x, phantom.z - player.z) < 9.5,
    'Phantom must actively navigate around the Infirmary obstacle toward Mark'
  );
});

test('Grandfather Stalker Director actively brings Grandfather Victor into Mark reachable wing when >38m away', () => {
  const walls = createCastleWalls();
  const doors = createInitialDoors();
  const safeZones = createInitialSafeZones();
  for (const dId of ['door-west-gallery', 'door-security', 'door-east-hall']) {
    const d = doors.find((item) => item.id === dId)!;
    d.unlocked = true;
    d.isOpen = true;
  }

  const player = createInitialPlayerState();
  player.x = 28.0;
  player.z = -6.0; // Deep in East Infirmary

  const enemies = createInitialEnemies(() => 0.2);
  const gf = enemies.find((e) => e.kind === 'grandfather')!;
  gf.x = -26.0;
  gf.z = 26.0; // 62m away in far West Steam Gallery!
  gf.alertState = 'patrol';
  gf.directorTimer = 8.95;

  stepEnemies(enemies, player, walls, doors, safeZones, 0.1);
  const newDist = Math.hypot(gf.x - player.x, gf.z - player.z);
  assert.ok(
    newDist <= 34.5 && newDist >= 21.5,
    `Expected Grandfather Director to advance unseen to 22..34m of Mark, got ${newDist.toFixed(1)}m`
  );
});



