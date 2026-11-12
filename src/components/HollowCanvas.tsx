import React, { useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import {
  AchievementId,
  CastleDoor,
  CluePlaque,
  DeathSequenceState,
  DialogueLine,
  EnemyEntity,
  GameSettings,
  GameState,
  HidingSpot,
  HudDomRefs,
  InteractTarget,
  InventoryItemId,
  LoreNote,
  PickupItem,
  PlayerState,
  PuzzleStation,
  RelicItem,
  RunSnapshot,
  SafeZone,
  WallBox,
} from '../game/types';
import {
  CASTLE_ROOMS,
  SARCOPHAGUS_POS,
  createCastleLightFixtures,
  createCastleWalls,
  createInitialDoors,
  getRoomAt,
} from '../game/castleMap';
import {
  CASTLE_DIALOGUES,
  INVENTORY_CATALOG,
  createCastleCluePlaques,
  createInitialLoreNotes,
  createInitialPuzzleStations,
} from '../game/puzzles';
import {
  DEATH_SEQUENCE_DURATION,
  PLAYER_SPRINT_SPEED,
  TOTAL_RELICS,
  TOTAL_SIGILS,
  awakenGrandfatherFromTomb,
  clamp,
  collectNearbyPickups,
  collectNearbyRelics,
  createInitialDeathSequence,
  createInitialEnemies,
  createInitialHidingSpots,
  createInitialPickups,
  createInitialPlayerState,
  createInitialRelics,
  createInitialSafeZones,
  damp,
  dampAngle,
  disperseEnemiesNearOpenedDoor,
  enterWardrobe,
  exitWardrobe,
  findNearestInteractable,
  getActiveChapterObjective,
  stepEnemies,
  stepPlayerMovement,
  triggerPlayerDash,
  triggerSilverWardBurst,
} from '../game/rules';
import { computeRunMasteryRank } from '../game/achievements';
import {
  buildGrandfatherHorrorRig,
  buildMarkFirstPersonRig,
  buildPhantomRig,
  buildStatueWatcherRig,
} from '../game/characters';
import { createCastleWorld } from '../game/models';
import { HollowSoundEngine } from '../game/audio';
import { ParticlePool } from '../game/particles';
import {
  SavedCheckpointData,
  applyCheckpointToSim,
  createCheckpointSnapshot,
  loadCheckpointFromStorage,
  saveCheckpointToStorage,
} from '../game/saveSystem';

export interface HollowCanvasHandle {
  resetRun: () => void;
  saveCheckpointNow: () => SavedCheckpointData | null;
  loadSavedCheckpoint: () => boolean;
  setJoystick: (dx: number, dy: number) => void;
  triggerDash: () => void;
  toggleFlashlight: () => void;
  triggerWardBurst: () => void;
  triggerInteract: () => void;
  completePuzzle: (puzzleId: string) => void;
  getLiveMapState: () => {
    playerX: number;
    playerZ: number;
    playerRotY: number;
    doors: CastleDoor[];
    hidingSpots: HidingSpot[];
  };
}

interface HollowCanvasProps {
  gameState: GameState;
  settings: GameSettings;
  isModalBlocking: boolean;
  sprintLock: boolean;
  crouchLock: boolean;
  soundEngine: HollowSoundEngine;
  hudRefs: React.MutableRefObject<HudDomRefs>;
  bestSigils: number;
  bestTimeSeconds: number | null;
  onToggleCrouchLock: () => void;
  onToggleMute: () => void;
  onToggleMap: () => void;
  onUnlockAchievement: (id: AchievementId) => void;
  onSyncWorldUi: (payload: {
    notes: LoreNote[];
    plaques: CluePlaque[];
    puzzles: PuzzleStation[];
    relics: RelicItem[];
    doors: CastleDoor[];
    hidingSpots: HidingSpot[];
    playerX: number;
    playerZ: number;
    playerRotY: number;
    inventory: InventoryItemId[];
    hasSilverLens: boolean;
    hasDeed: boolean;
    isHidden: boolean;
    roomNameAr: string;
    objectiveAr: string;
    interactTarget: InteractTarget | null;
  }) => void;
  onOpenPuzzle: (puzzle: PuzzleStation) => void;
  onOpenPlaque: (plaque: CluePlaque) => void;
  onOpenNoteInJournal: (noteId: string) => void;
  onShowToast: (msg: string) => void;
  onTriggerDialogue: (line: DialogueLine) => void;
  onRequestPauseToggle: () => void;
  onGameOver: (snapshot: RunSnapshot) => void;
  onCheckpointSaved?: (cp: SavedCheckpointData) => void;
}

export const HollowCanvas = React.forwardRef<HollowCanvasHandle, HollowCanvasProps>(
  (
    {
      gameState,
      settings,
      isModalBlocking,
      sprintLock,
      crouchLock,
      soundEngine,
      hudRefs,
      bestSigils,
      bestTimeSeconds,
      onToggleCrouchLock,
      onToggleMute,
      onToggleMap,
      onUnlockAchievement,
      onSyncWorldUi,
      onOpenPuzzle,
      onOpenPlaque,
      onOpenNoteInJournal,
      onShowToast,
      onTriggerDialogue,
      onRequestPauseToggle,
      onGameOver,
      onCheckpointSaved,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const propsRef = useRef({
      gameState,
      settings,
      isModalBlocking,
      sprintLock,
      crouchLock,
      soundEngine,
      bestSigils,
      bestTimeSeconds,
      onToggleCrouchLock,
      onToggleMute,
      onToggleMap,
      onUnlockAchievement,
      onSyncWorldUi,
      onOpenPuzzle,
      onOpenPlaque,
      onOpenNoteInJournal,
      onShowToast,
      onTriggerDialogue,
      onRequestPauseToggle,
      onGameOver,
      onCheckpointSaved,
    });
    propsRef.current = {
      gameState,
      settings,
      isModalBlocking,
      sprintLock,
      crouchLock,
      soundEngine,
      bestSigils,
      bestTimeSeconds,
      onToggleCrouchLock,
      onToggleMute,
      onToggleMap,
      onUnlockAchievement,
      onSyncWorldUi,
      onOpenPuzzle,
      onOpenPlaque,
      onOpenNoteInJournal,
      onShowToast,
      onTriggerDialogue,
      onRequestPauseToggle,
      onGameOver,
      onCheckpointSaved,
    };

    const simRef = useRef<{
      player: PlayerState;
      deathSeq: DeathSequenceState;
      walls: WallBox[];
      doors: CastleDoor[];
      safeZones: SafeZone[];
      hidingSpots: HidingSpot[];
      notes: LoreNote[];
      plaques: CluePlaque[];
      puzzles: PuzzleStation[];
      pickups: PickupItem[];
      relics: RelicItem[];
      enemies: EnemyEntity[];
      inventory: Set<InventoryItemId>;
      playedDialogues: Set<string>;
      survivalSeconds: number;
      joyX: number;
      joyY: number;
      pendingYawDelta: number;
      pendingPitchDelta: number;
      slashSoundPlayed: boolean;
      lastInteractSignature: string;
      lastRoomId: string;
      appliedFov: number;
      nextThunderAt: number;
      lightningFlash: number;
      autoSaveTimer: number;
      resetWorldVisuals?: () => void;
      syncWorldVisualsFromSim?: () => void;
      markNoteDiscoveredVisual?: (noteId: string) => void;
      markPuzzleSolvedVisual?: (puzzleId: string) => void;
    }>({
      player: createInitialPlayerState(),
      deathSeq: createInitialDeathSequence(),
      walls: createCastleWalls(),
      doors: createInitialDoors(),
      safeZones: createInitialSafeZones(),
      hidingSpots: createInitialHidingSpots(),
      notes: createInitialLoreNotes(),
      plaques: createCastleCluePlaques(),
      puzzles: createInitialPuzzleStations(),
      pickups: createInitialPickups(),
      relics: createInitialRelics(),
      enemies: createInitialEnemies(),
      inventory: new Set<InventoryItemId>(),
      playedDialogues: new Set<string>(),
      survivalSeconds: 0,
      joyX: 0,
      joyY: 0,
      pendingYawDelta: 0,
      pendingPitchDelta: 0,
      slashSoundPlayed: false,
      lastInteractSignature: '',
      lastRoomId: '',
      appliedFov: settings.fov,
      nextThunderAt: 16,
      lightningFlash: 0,
      autoSaveTimer: 0,
    });

    const persistCheckpointNow = (isManual = false): SavedCheckpointData | null => {
      const s = simRef.current;
      if (s.deathSeq.active || s.player.sanity <= 0) return null;
      const snap = createCheckpointSnapshot({
        player: s.player,
        doors: s.doors,
        notes: s.notes,
        plaques: s.plaques,
        puzzles: s.puzzles,
        pickups: s.pickups,
        relics: s.relics,
        inventory: s.inventory,
        playedDialogues: s.playedDialogues,
        survivalSeconds: s.survivalSeconds,
      });
      if (!isManual) {
        const existing = loadCheckpointFromStorage();
        if (existing && existing.sigilsSolved > snap.sigilsSolved) {
          return existing;
        }
        if (
          existing &&
          snap.sigilsSolved === 0 &&
          snap.notesFound === 0 &&
          snap.relicsFound === 0 &&
          snap.survivalSeconds < 8 &&
          (existing.notesFound > 0 || existing.relicsFound > 0 || existing.survivalSeconds >= 10)
        ) {
          return existing;
        }
      }
      if (saveCheckpointToStorage(snap)) {
        propsRef.current.onCheckpointSaved?.(snap);
        return snap;
      }
      return null;
    };

    const emitWorldUi = () => {
      const s = simRef.current;
      const obj = getActiveChapterObjective(s.puzzles, s.player, s.doors);
      const target = findNearestInteractable(
        s.player,
        s.notes,
        s.puzzles,
        s.doors,
        s.hidingSpots,
        s.inventory,
        s.plaques
      );
      propsRef.current.onSyncWorldUi({
        notes: s.notes.map((n) => ({ ...n })),
        plaques: s.plaques.map((pl) => ({ ...pl })),
        puzzles: s.puzzles.map((pz) => ({ ...pz })),
        relics: s.relics.map((r) => ({ ...r })),
        doors: s.doors.map((d) => ({ ...d })),
        hidingSpots: s.hidingSpots.map((h) => ({ ...h })),
        playerX: s.player.x,
        playerZ: s.player.z,
        playerRotY: s.player.rotY,
        inventory: Array.from(s.inventory),
        hasSilverLens: s.inventory.has('silver_lens'),
        hasDeed: s.player.hasDeed,
        isHidden: s.player.isHidden,
        roomNameAr: obj.roomNameAr,
        objectiveAr: obj.objectiveAr,
        interactTarget: target,
      });
    };

    const playOnceDialogue = (dialogueKey: string) => {
      const s = simRef.current;
      if (s.playedDialogues.has(dialogueKey)) return;
      const line = CASTLE_DIALOGUES[dialogueKey];
      if (!line) return;
      s.playedDialogues.add(dialogueKey);
      propsRef.current.onTriggerDialogue(line);
    };

    const buildSnapshot = (
      outcome: 'victory' | 'defeat',
      causeAr: string,
      causeEn: string
    ): RunSnapshot => {
      const s = simRef.current;
      const p = propsRef.current;
      const sigils = s.puzzles.filter((pz) => pz.solved).length;
      const notesCount = s.notes.filter((n) => n.discovered).length;
      const relicsCount = s.relics.filter((r) => r.collected).length;
      const sanRem = outcome === 'victory' ? Math.round(s.player.sanity) : 0;
      const rank = computeRunMasteryRank({
        outcome,
        sigilsCollected: sigils,
        relicsFound: relicsCount,
        notesFound: notesCount,
        survivalSeconds: s.survivalSeconds,
        sanityRemaining: sanRem,
      });
      return {
        outcome,
        difficulty: p.settings.difficulty,
        rank,
        sigilsCollected: sigils,
        totalSigils: TOTAL_SIGILS,
        notesFound: notesCount,
        totalNotes: s.notes.length,
        relicsFound: relicsCount,
        totalRelics: TOTAL_RELICS,
        hasDeed: s.player.hasDeed,
        survivalSeconds: s.survivalSeconds,
        sanityRemaining: sanRem,
        bestSigils: Math.max(p.bestSigils, sigils),
        bestTimeSeconds:
          outcome === 'victory'
            ? p.bestTimeSeconds === null
              ? s.survivalSeconds
              : Math.min(p.bestTimeSeconds, s.survivalSeconds)
            : p.bestTimeSeconds,
        causeAr,
        causeEn,
      };
    };

    const performInteract = () => {
      const s = simRef.current;
      const p = propsRef.current;
      if (p.gameState !== 'playing' || p.isModalBlocking || s.deathSeq.active) return;

      const target = findNearestInteractable(
        s.player,
        s.notes,
        s.puzzles,
        s.doors,
        s.hidingSpots,
        s.inventory,
        s.plaques
      );
      if (!target) return;

      if (target.type === 'unhide') {
        exitWardrobe(s.player, s.walls, s.doors);
        p.soundEngine.playDoorUnlock(true);
        emitWorldUi();
        return;
      }

      if (target.type === 'hide') {
        const enemyClose = s.enemies.some(
          (e) =>
            e.active &&
            (e.alertState === 'chase' || Math.hypot(e.x - s.player.x, e.z - s.player.z) < 15.5)
        );
        enterWardrobe(s.player, target.spot, s.walls, s.doors);
        p.soundEngine.playDoorUnlock(true);
        p.onShowToast(`اختبأت داخل ${target.spot.nameAr}`);
        if (enemyClose) {
          p.onUnlockAchievement('shadow_whisper');
        }
        emitWorldUi();
        return;
      }

      if (target.type === 'note') {
        const note = s.notes.find((n) => n.id === target.note.id);
        if (note) {
          note.discovered = true;
          s.markNoteDiscoveredVisual?.(note.id);
          s.player.heldItemKind = 'note';
          s.player.heldItemBannerTimer = 3.2;
          p.soundEngine.playPickupChime();
          if (s.notes.every((n) => n.discovered)) {
            p.onUnlockAchievement('loremaster');
          }
          p.onOpenNoteInJournal(note.id);
          emitWorldUi();
          persistCheckpointNow();
        }
        return;
      }

      if (target.type === 'plaque') {
        const plaque = s.plaques.find((pl) => pl.id === target.plaque.id);
        if (plaque) {
          plaque.discovered = true;
          p.soundEngine.playPickupChime();
          p.onOpenPlaque({ ...plaque });
          emitWorldUi();
          persistCheckpointNow();
        }
        return;
      }

      if (target.type === 'door') {
        const door = s.doors.find((d) => d.id === target.door.id);
        if (!door) return;
        if (!target.canUnlock) {
          p.soundEngine.playDoorUnlock(false);
          p.onShowToast(target.lockedReasonAr || door.lockedHintAr);
          return;
        }
        door.unlocked = true;
        door.isOpen = true;
        disperseEnemiesNearOpenedDoor(door, s.enemies, s.player, s.doors, s.walls, s.safeZones);
        p.soundEngine.playDoorUnlock(true);

        if (door.isMainExit && s.player.hasDeed) {
          p.onUnlockAchievement('debt_free_survivor');
          p.soundEngine.playOutcomeSting(true);
          p.onGameOver(
            buildSnapshot(
              'victory',
              'عبر مارك البوابة الحديدية الكبرى وفي يده «وثيقة الميراث المختومة» قبل أن تدركه روح الجد فيكتور! سُدّدت ديون مارك إلى الأبد وانطوت لعنة القلعة خلفه مع خيوط الفجر.',
              'Mark escaped through the Main Castle Gate clutching the Sealed Inheritance Deed!'
            )
          );
          return;
        }

        p.onShowToast(`تم فتح ${door.nameAr}!`);
        if (door.id === 'door-west-gallery') playOnceDialogue('west_wing_opened');
        if (door.id === 'door-security') playOnceDialogue('bunker_entered');
        if (door.id === 'door-crypt') playOnceDialogue('crypt_unlocked');
        emitWorldUi();
        persistCheckpointNow();
        return;
      }

      if (target.type === 'puzzle') {
        if (target.lockedReasonAr) {
          p.soundEngine.playDoorUnlock(false);
          p.onShowToast(target.lockedReasonAr);
          return;
        }
        p.onOpenPuzzle(target.puzzle);
        return;
      }

      if (target.type === 'deed') {
        if (!s.puzzles.some((pz) => pz.id === 'tomb_seal' && pz.solved)) {
          p.onShowToast('ختم الضريح ما زال يحمي الوثيقة. اضبط أقراص الرموز الثلاثة أولاً.');
          return;
        }
        s.inventory.add('inheritance_deed');
        s.inventory.add('master_exit_key');
        awakenGrandfatherFromTomb(s.player, s.enemies, s.doors, s.safeZones, s.walls);
        p.onUnlockAchievement('tomb_raider');
        p.soundEngine.playTombEruption();
        playOnceDialogue('tomb_eruption');
        p.onShowToast('انتزعتَ وثيقة الميراث ومفتاح البوابة! انشقّ قبر الجد — اركض للبهو الجنوبي!');
        emitWorldUi();
        persistCheckpointNow();
      }
    };

    useImperativeHandle(ref, () => ({
      resetRun() {
        const s = simRef.current;
        s.player = createInitialPlayerState();
        s.deathSeq = createInitialDeathSequence();
        s.doors = createInitialDoors();
        s.safeZones = createInitialSafeZones();
        s.notes = createInitialLoreNotes();
        s.plaques = createCastleCluePlaques();
        s.puzzles = createInitialPuzzleStations();
        s.pickups = createInitialPickups();
        s.relics = createInitialRelics();
        s.enemies = createInitialEnemies();
        s.inventory = new Set<InventoryItemId>();
        s.playedDialogues = new Set<string>();
        s.survivalSeconds = 0;
        s.autoSaveTimer = 0;
        s.slashSoundPlayed = false;
        s.lastInteractSignature = '';
        s.lastRoomId = '';
        s.resetWorldVisuals?.();
        if (hudRefs.current.bloodKillOverlay) {
          hudRefs.current.bloodKillOverlay.style.opacity = '0';
        }
        emitWorldUi();
        playOnceDialogue('intro_foyer');
      },
      saveCheckpointNow() {
        return persistCheckpointNow(true);
      },
      loadSavedCheckpoint() {
        const saved = loadCheckpointFromStorage();
        if (!saved) return false;
        const s = simRef.current;
        s.deathSeq = createInitialDeathSequence();
        s.slashSoundPlayed = false;
        s.autoSaveTimer = 0;
        s.lastInteractSignature = '';
        s.lastRoomId = '';
        applyCheckpointToSim(s, saved);
        s.syncWorldVisualsFromSim?.();
        if (hudRefs.current.bloodKillOverlay) {
          hudRefs.current.bloodKillOverlay.style.opacity = '0';
        }
        emitWorldUi();
        return true;
      },
      setJoystick(dx, dy) {
        simRef.current.joyX = dx;
        simRef.current.joyY = dy;
      },
      triggerDash() {
        const s = simRef.current;
        if (propsRef.current.gameState !== 'playing' || propsRef.current.isModalBlocking) return;
        if (triggerPlayerDash(s.player)) {
          propsRef.current.soundEngine.playDash();
        }
      },
      toggleFlashlight() {
        const s = simRef.current;
        if (propsRef.current.gameState !== 'playing' || propsRef.current.isModalBlocking) return;
        if (s.player.battery <= 0.5) {
          propsRef.current.onShowToast('بطارية الكشاف فارغة! التقط بطارية أو عد لدائرة البهو.');
          return;
        }
        s.player.flashlightOn = !s.player.flashlightOn;
        propsRef.current.soundEngine.playFlashlightClick(s.player.flashlightOn);
      },
      triggerWardBurst() {
        const s = simRef.current;
        const p = propsRef.current;
        if (p.gameState !== 'playing' || p.isModalBlocking) return;
        const hasLens = s.inventory.has('silver_lens');
        const count = triggerSilverWardBurst(s.player, s.enemies, hasLens);
        if (count > 0) {
          p.onUnlockAchievement('silver_exorcist');
          p.soundEngine.playWardBurst();
          p.onShowToast('أطلقتَ الومضة الفضية — شُلّت حركة الأرواح القريبة لـ 5.5 ثوانٍ!');
        } else if (hasLens && s.player.wardCooldown > 0) {
          p.onShowToast(`العدسة الفضية تبرد (${Math.ceil(s.player.wardCooldown)} ث)`);
        }
      },
      triggerInteract: performInteract,
      completePuzzle(puzzleId) {
        const s = simRef.current;
        const p = propsRef.current;
        const pz = s.puzzles.find((item) => item.id === puzzleId);
        if (!pz || pz.solved) return;
        pz.solved = true;

        const earnedNames: string[] = [];
        if (pz.rewardItem) {
          s.inventory.add(pz.rewardItem);
          earnedNames.push(INVENTORY_CATALOG[pz.rewardItem].nameAr);
        }
        if (pz.secondaryRewardItem) {
          s.inventory.add(pz.secondaryRewardItem);
          earnedNames.push(INVENTORY_CATALOG[pz.secondaryRewardItem].nameAr);
        }

        if (pz.id === 'clock') {
          p.onUnlockAchievement('first_key');
        }
        if (s.puzzles.every((item) => item.solved)) {
          p.onUnlockAchievement('master_locksmith');
        }

        s.player.heldItemKind = 'key';
        s.player.heldItemBannerTimer = 4.2;
        s.player.sanity = clamp(s.player.sanity + 16, 0, 100);
        s.markPuzzleSolvedVisual?.(pz.id);
        p.soundEngine.playSigilSolved();

        if (pz.id === 'elixir') playOnceDialogue('infirmary_solved');
        if (pz.id === 'statues') playOnceDialogue('statues_solved');

        p.onShowToast(
          earnedNames.length > 0
            ? `تم حلّ اللغز وحفظ التقدم! حصلت على: ${earnedNames.join(' + ')}`
            : `تم حلّ ${pz.titleAr} وحفظ التقدم!`
        );
        emitWorldUi();
        persistCheckpointNow();
      },
      getLiveMapState() {
        const s = simRef.current;
        return {
          playerX: s.player.x,
          playerZ: s.player.z,
          playerRotY: s.player.rotY,
          doors: s.doors.map((d) => ({ ...d })),
          hidingSpots: s.hidingSpots.map((h) => ({ ...h })),
        };
      },
    }));

    // ========================================================================
    // Single-Mount Three.js First-Person Haunted Castle Engine
    // ========================================================================
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const isSoftwareGl = (() => {
        const probeGl = document.createElement('canvas').getContext('webgl2');
        if (!probeGl) return true;
        const dbg = probeGl.getExtension('WEBGL_debug_renderer_info');
        const param = dbg ? dbg.UNMASKED_RENDERER_WEBGL : probeGl.RENDERER;
        const rendererStr = String(probeGl.getParameter(param));
        probeGl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
      })();

      const initW = container.clientWidth || window.innerWidth;
      const initH = Math.max(1, container.clientHeight || window.innerHeight);

      const renderer = new THREE.WebGLRenderer({
        powerPreference: 'high-performance',
        antialias: !isSoftwareGl,
      });
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(initW, initH);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x030206);
      scene.fog = new THREE.FogExp2(0x030206, 0.044);

      // Subtle dark PBR Image-Based Lighting (RoomEnvironment PMREM) for metallic/wood speculars without flooding dark rooms
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envRenderTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.045);
      scene.environment = envRenderTarget.texture;
      scene.environmentIntensity = 0.018;
      pmremGenerator.dispose();

      const camera = new THREE.PerspectiveCamera(
        propsRef.current.settings.fov,
        initW / initH,
        0.06,
        70
      );
      camera.rotation.order = 'YXZ';
      scene.add(camera);

      // Pitch-dark Gothic shadow fill so Mark's handheld flashlight is genuinely essential
      const hemiLight = new THREE.HemisphereLight(0x1e1b2e, 0x050308, 0.046);
      scene.add(hemiLight);

      const moonRimLight = new THREE.DirectionalLight(0x93c5fd, 0.026);
      moonRimLight.position.set(12, 24, -18);
      scene.add(moonRimLight);

      // Mark's 3D First-Person Hands & Powerful Handheld Flashlight attached to Camera
      const markRig = buildMarkFirstPersonRig();
      camera.add(markRig.root);

      const handFillLight = new THREE.PointLight(0xffebc2, 0.14, 2.2, 1.8);
      handFillLight.position.set(0.06, -0.02, -0.28);
      camera.add(handFillLight);

      const flashlight = new THREE.SpotLight(0xfff1cf, 34.0, 36, 0.72, 0.48, 1.15);
      flashlight.position.set(0.16, -0.13, -0.56);
      const flashTarget = new THREE.Object3D();
      flashTarget.position.set(0, -0.02, -9);
      camera.add(flashTarget);
      flashlight.target = flashTarget;
      if (!isSoftwareGl) {
        flashlight.castShadow = true;
        flashlight.shadow.mapSize.set(1024, 1024);
        flashlight.shadow.bias = -0.0004;
        flashlight.shadow.normalBias = 0.024;
        flashlight.shadow.camera.near = 0.28;
        flashlight.shadow.camera.far = 36;
      }
      camera.add(flashlight);

      // Build 3D Castle Architecture, Doors, Statues, Relics & Props with anisotropic PBR maps
      const fixtures = createCastleLightFixtures();
      const worldHandles = createCastleWorld({
        walls: simRef.current.walls,
        doors: simRef.current.doors,
        fixtures,
        notes: simRef.current.notes,
        puzzles: simRef.current.puzzles,
        hidingSpots: simRef.current.hidingSpots,
        pickups: simRef.current.pickups,
        relics: simRef.current.relics,
        maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
      });
      scene.add(worldHandles.worldGroup);

      // Build 3D Horror Enemy Rigs
      const grandfatherRig = buildGrandfatherHorrorRig();
      scene.add(grandfatherRig.root);

      const grandfatherLight = new THREE.PointLight(0xdc2626, 1.25, 7.8);
      grandfatherLight.position.set(0, 1.65, 0.28);
      grandfatherRig.root.add(grandfatherLight);

      const watcherRig = buildStatueWatcherRig();
      scene.add(watcherRig.root);

      const phantomRig = buildPhantomRig();
      scene.add(phantomRig.root);

      const particlePool = new ParticlePool(scene);

      // Next-Gen Post-Processing Pipeline (Cinematic Bloom + ACES Output) on Hardware GPUs
      let composer: EffectComposer | null = null;
      let bloomPass: UnrealBloomPass | null = null;
      let vignettePass: ShaderPass | null = null;
      if (!isSoftwareGl) {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        bloomPass = new UnrealBloomPass(
          new THREE.Vector2(Math.max(1, Math.floor(initW / 2)), Math.max(1, Math.floor(initH / 2))),
          0.34,
          0.55,
          0.84
        );
        composer.addPass(bloomPass);
        vignettePass = new ShaderPass(VignetteShader);
        vignettePass.uniforms.offset.value = 1.12;
        vignettePass.uniforms.darkness.value = 1.22;
        composer.addPass(vignettePass);
        composer.addPass(new OutputPass());
        renderer.compile(scene, camera);
      }

      simRef.current.resetWorldVisuals = () => {
        for (const dv of worldHandles.doorVisuals) {
          const d = simRef.current.doors.find((item) => item.id === dv.doorId);
          dv.leftLeafPivot.rotation.y = 0;
          dv.rightLeafPivot.rotation.y = 0;
          dv.lockGemMat.color.setHex(d?.unlocked ? 0x34d399 : 0xef4444);
        }
        for (const [, pv] of worldHandles.puzzleVisuals) {
          pv.beaconMat.color.setHex(0xfbbf24);
        }
        for (const [, nb] of worldHandles.noteBeacons) {
          nb.visible = true;
        }
        for (const [, pk] of worldHandles.pickupVisuals) {
          pk.visible = true;
        }
        for (const [, rl] of worldHandles.relicVisuals) {
          rl.visible = true;
        }
        for (const flame of worldHandles.statueBowlFlames) {
          flame.visible = false;
        }
        worldHandles.deedVisual.visible = false;
        worldHandles.sarcophagusLid.position.set(SARCOPHAGUS_POS.x, 1.27, SARCOPHAGUS_POS.z);
        worldHandles.sarcophagusLid.rotation.z = 0;
        worldHandles.sarcophagusMistMat.opacity = 0;
        grandfatherRig.setClip('idle', 1);
      };

      simRef.current.syncWorldVisualsFromSim = () => {
        const s = simRef.current;
        for (const dv of worldHandles.doorVisuals) {
          const d = s.doors.find((item) => item.id === dv.doorId);
          const prog = d?.isOpen ? 1 : 0;
          dv.leftLeafPivot.rotation.y = -prog * 1.56;
          dv.rightLeafPivot.rotation.y = prog * 1.56;
          dv.lockGemMat.color.setHex(
            d?.isMainExit ? 0xfbbf24 : d?.unlocked ? 0x34d399 : 0xef4444
          );
        }
        for (const [pzId, pv] of worldHandles.puzzleVisuals) {
          const pz = s.puzzles.find((item) => item.id === pzId);
          pv.beaconMat.color.setHex(pz?.solved ? 0x34d399 : 0xfbbf24);
        }
        const statuesSolved = s.puzzles.some((item) => item.id === 'statues' && item.solved);
        for (const flame of worldHandles.statueBowlFlames) {
          flame.visible = statuesSolved;
        }
        for (const [nId, nb] of worldHandles.noteBeacons) {
          const n = s.notes.find((item) => item.id === nId);
          nb.visible = !n?.discovered;
        }
        for (const [pkId, pkMesh] of worldHandles.pickupVisuals) {
          const pk = s.pickups.find((item) => item.id === pkId);
          pkMesh.visible = !pk?.collected;
        }
        for (const [rlId, rlMesh] of worldHandles.relicVisuals) {
          const rl = s.relics.find((item) => item.id === rlId);
          rlMesh.visible = !rl?.collected;
        }
        const tombSealSolved = s.puzzles.some((item) => item.id === 'tomb_seal' && item.solved);
        worldHandles.deedVisual.visible = tombSealSolved && !s.player.hasDeed;
        if (s.player.tombAwakened) {
          worldHandles.sarcophagusLid.position.set(SARCOPHAGUS_POS.x + 1.32, 1.27, SARCOPHAGUS_POS.z);
          worldHandles.sarcophagusLid.rotation.z = -0.24;
          worldHandles.sarcophagusMistMat.opacity = 0.24;
        } else {
          worldHandles.sarcophagusLid.position.set(SARCOPHAGUS_POS.x, 1.27, SARCOPHAGUS_POS.z);
          worldHandles.sarcophagusLid.rotation.z = 0;
          worldHandles.sarcophagusMistMat.opacity = 0;
        }
        grandfatherRig.setClip('idle', 1);
      };

      simRef.current.markNoteDiscoveredVisual = (noteId: string) => {
        const nb = worldHandles.noteBeacons.get(noteId);
        if (nb) {
          nb.visible = false;
        }
      };

      simRef.current.markPuzzleSolvedVisual = (puzzleId: string) => {
        const pv = worldHandles.puzzleVisuals.get(puzzleId);
        if (pv) {
          pv.beaconMat.color.setHex(0x34d399);
          particlePool.emitBurst(
            pv.group.position.x,
            1.35,
            pv.group.position.z,
            18,
            0xfbbf24,
            3.2,
            1.1
          );
        }
        if (puzzleId === 'statues') {
          for (const flame of worldHandles.statueBowlFlames) {
            flame.visible = true;
          }
        }
        if (puzzleId === 'tomb_seal' && !simRef.current.player.hasDeed) {
          worldHandles.deedVisual.visible = true;
        }
      };

      // Input state (Keyboard + PointerLock + Mouse Drag + Touch Drag Look)
      const keysDown = new Set<string>();
      let isMouseDragging = false;
      let lastMouseX = 0;
      let lastMouseY = 0;
      let lookTouchId: number | null = null;
      let lastTouchX = 0;
      let lastTouchY = 0;

      const clearAllHeldInputs = () => {
        keysDown.clear();
        isMouseDragging = false;
        lookTouchId = null;
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) {
          keysDown.add(e.code);
          return;
        }
        keysDown.add(e.code);

        if (e.code === 'Escape' || e.code === 'KeyP') {
          if (!propsRef.current.isModalBlocking && propsRef.current.gameState === 'playing') {
            e.preventDefault();
            propsRef.current.onRequestPauseToggle();
          } else if (propsRef.current.gameState === 'paused') {
            e.preventDefault();
            propsRef.current.onRequestPauseToggle();
          }
          return;
        }

        if (e.code === 'KeyM' && !propsRef.current.isModalBlocking) {
          e.preventDefault();
          propsRef.current.onToggleMute();
          return;
        }

        if (e.code === 'Tab' && propsRef.current.gameState === 'playing') {
          e.preventDefault();
          propsRef.current.onToggleMap();
          return;
        }

        if (propsRef.current.gameState !== 'playing' || propsRef.current.isModalBlocking) return;

        if (e.code === 'KeyE') {
          e.preventDefault();
          performInteract();
        } else if (e.code === 'KeyC') {
          e.preventDefault();
          propsRef.current.onToggleCrouchLock();
        } else if (e.code === 'KeyF') {
          e.preventDefault();
          const s = simRef.current;
          if (s.player.battery > 0.5) {
            s.player.flashlightOn = !s.player.flashlightOn;
            propsRef.current.soundEngine.playFlashlightClick(s.player.flashlightOn);
          }
        } else if (e.code === 'Space') {
          e.preventDefault();
          if (triggerPlayerDash(simRef.current.player)) {
            propsRef.current.soundEngine.playDash();
          }
        } else if (e.code === 'KeyQ') {
          e.preventDefault();
          const s = simRef.current;
          if (triggerSilverWardBurst(s.player, s.enemies, s.inventory.has('silver_lens')) > 0) {
            propsRef.current.onUnlockAchievement('silver_exorcist');
            propsRef.current.soundEngine.playWardBurst();
          }
        }
      };

      const onKeyUp = (e: KeyboardEvent) => {
        keysDown.delete(e.code);
      };

      const onMouseDown = (e: MouseEvent) => {
        if (propsRef.current.gameState !== 'playing' || propsRef.current.isModalBlocking) return;
        propsRef.current.soundEngine.unlock();
        isMouseDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        try {
          if (document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock?.();
          }
        } catch {
          // Drag-look fallback remains active
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        if (propsRef.current.gameState !== 'playing' || propsRef.current.isModalBlocking) return;
        const sens = propsRef.current.settings.lookSensitivity;
        const ySign = propsRef.current.settings.invertY ? 1 : -1;
        if (document.pointerLockElement === renderer.domElement) {
          simRef.current.pendingYawDelta -= e.movementX * 0.0024 * sens;
          simRef.current.pendingPitchDelta += e.movementY * 0.002 * sens * ySign;
        } else if (isMouseDragging) {
          const dx = e.clientX - lastMouseX;
          const dy = e.clientY - lastMouseY;
          lastMouseX = e.clientX;
          lastMouseY = e.clientY;
          simRef.current.pendingYawDelta -= dx * 0.0042 * sens;
          simRef.current.pendingPitchDelta += dy * 0.0034 * sens * ySign;
        }
      };

      const onMouseUp = () => {
        isMouseDragging = false;
      };

      const onTouchStart = (e: TouchEvent) => {
        if (propsRef.current.gameState !== 'playing' || propsRef.current.isModalBlocking) return;
        propsRef.current.soundEngine.unlock();
        if (lookTouchId !== null) return;
        const t = e.changedTouches[0];
        lookTouchId = t.identifier;
        lastTouchX = t.clientX;
        lastTouchY = t.clientY;
      };

      const onTouchMove = (e: TouchEvent) => {
        if (lookTouchId === null) return;
        const sens = propsRef.current.settings.lookSensitivity;
        const ySign = propsRef.current.settings.invertY ? 1 : -1;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === lookTouchId) {
            const dx = t.clientX - lastTouchX;
            const dy = t.clientY - lastTouchY;
            lastTouchX = t.clientX;
            lastTouchY = t.clientY;
            simRef.current.pendingYawDelta -= dx * 0.0052 * sens;
            simRef.current.pendingPitchDelta += dy * 0.004 * sens * ySign;
            break;
          }
        }
      };

      const onTouchEnd = (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === lookTouchId) {
            lookTouchId = null;
            break;
          }
        }
      };

      const onVisibilityChange = () => {
        if (document.hidden) {
          clearAllHeldInputs();
          if (propsRef.current.gameState === 'playing' || propsRef.current.gameState === 'paused') {
            persistCheckpointNow();
          }
        }
      };

      const onPageHideOrUnload = () => {
        if (propsRef.current.gameState === 'playing' || propsRef.current.gameState === 'paused') {
          persistCheckpointNow();
        }
      };

      const onResize = () => {
        if (!container) return;
        const w = container.clientWidth || window.innerWidth;
        const h = Math.max(1, container.clientHeight || window.innerHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        if (composer) {
          composer.setSize(w, h);
        }
        if (bloomPass) {
          bloomPass.resolution.set(Math.max(1, Math.floor(w / 2)), Math.max(1, Math.floor(h / 2)));
        }
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('blur', clearAllHeldInputs);
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('pagehide', onPageHideOrUnload);
      window.addEventListener('beforeunload', onPageHideOrUnload);
      window.addEventListener('resize', onResize);
      renderer.domElement.addEventListener('mousedown', onMouseDown);
      renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
      renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
      renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true });
      renderer.domElement.addEventListener('touchcancel', onTouchEnd, { passive: true });

      const syncPointerLock = () => {
        if (
          document.pointerLockElement === renderer.domElement &&
          (propsRef.current.gameState !== 'playing' || propsRef.current.isModalBlocking)
        ) {
          document.exitPointerLock?.();
        }
      };

      // Architectural Minimap 2D Canvas Renderer (Real Walls + Wardrobes + Relics + Noise Ring)
      const drawMinimap = () => {
        const canvas = hudRefs.current.minimapCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, w, h);

        const s = simRef.current;
        const scale = 1.25;
        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // Room Floors
        for (const r of CASTLE_ROOMS) {
          const rx = (r.minX - s.player.x) * scale;
          const rz = (r.minZ - s.player.z) * scale;
          const rw = (r.maxX - r.minX) * scale;
          const rd = (r.maxZ - r.minZ) * scale;
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(rx, rz, rw, rd);
        }

        // Solid Architectural Walls & Islands
        ctx.fillStyle = '#78716c';
        for (const wl of s.walls) {
          if (wl.renderMesh === false) continue;
          const wx = (wl.minX - s.player.x) * scale;
          const wz = (wl.minZ - s.player.z) * scale;
          const ww = Math.max(1.2, (wl.maxX - wl.minX) * scale);
          const wd = Math.max(1.2, (wl.maxZ - wl.minZ) * scale);
          ctx.fillRect(wx, wz, ww, wd);
        }

        // Hiding Wardrobes (Cyan Safe Squares)
        ctx.fillStyle = '#38bdf8';
        for (const hs of s.hidingSpots) {
          const hx = (hs.x - s.player.x) * scale;
          const hz = (hs.z - s.player.z) * scale;
          ctx.fillRect(hx - 1.5, hz - 1.5, 3, 3);
        }

        // Uncollected Relics (Rose-Gold Dots)
        ctx.fillStyle = '#fb7185';
        for (const rl of s.relics) {
          if (rl.collected) continue;
          ctx.beginPath();
          ctx.arc((rl.x - s.player.x) * scale, (rl.z - s.player.z) * scale, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Undiscovered Lore Notes & Secret Clue Scrolls (Violet/Gold Diamonds)
        for (const nt of s.notes) {
          if (nt.discovered) continue;
          const nx = (nt.x - s.player.x) * scale;
          const nz = (nt.z - s.player.z) * scale;
          ctx.fillStyle = nt.isOptionalLore ? '#c084fc' : '#fde047';
          ctx.fillRect(nx - 1.6, nz - 1.6, 3.2, 3.2);
        }

        // Doors
        for (const d of s.doors) {
          const dx = (d.x - s.player.x) * scale;
          const dz = (d.z - s.player.z) * scale;
          ctx.fillStyle = d.isMainExit
            ? '#fbbf24'
            : d.isOpen || d.unlocked
            ? '#34d399'
            : '#ef4444';
          ctx.beginPath();
          ctx.arc(dx, dz, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Active Chapter Objective Beacon
        const obj = getActiveChapterObjective(s.puzzles, s.player, s.doors);
        const ox = clamp((obj.targetPos.x - s.player.x) * scale, -cx + 5, cx - 5);
        const oz = clamp((obj.targetPos.z - s.player.z) * scale, -cy + 5, cy - 5);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(ox, oz, 3.0, 0, Math.PI * 2);
        ctx.fill();

        // Nearby Grandfather pulse when within 22m
        const gf = s.enemies.find((e) => e.kind === 'grandfather');
        if (gf && Math.hypot(gf.x - s.player.x, gf.z - s.player.z) < 22) {
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc((gf.x - s.player.x) * scale, (gf.z - s.player.z) * scale, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Mark Acoustic Noise Ring + View Cone
        if (s.player.noiseLevel > 15) {
          ctx.strokeStyle =
            s.player.noiseLevel > 65 ? 'rgba(248, 113, 113, 0.45)' : 'rgba(251, 191, 36, 0.32)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, (s.player.noiseLevel / 100) * 18, 0, Math.PI * 2);
          ctx.stroke();
        }

        const lookAng = Math.atan2(-Math.cos(s.player.rotY), -Math.sin(s.player.rotY));
        ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 14, lookAng - 0.45, lookAng + 0.45);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      let disposed = false;
      let rafId = 0;
      let timerId = 0;
      let lastTime = performance.now();
      let elapsed = 0;

      const afterDraw = (cb: () => void) => {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (!sync) {
          timerId = window.setTimeout(cb, 80);
          return;
        }
        gl.flush();
        const poll = () => {
          if (disposed) {
            gl.deleteSync(sync);
            return;
          }
          const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            timerId = window.setTimeout(poll, 5);
          } else {
            gl.deleteSync(sync);
            timerId = window.setTimeout(cb, 80);
          }
        };
        timerId = window.setTimeout(poll, 5);
      };

      emitWorldUi();
      playOnceDialogue('intro_foyer');

      const tick = () => {
        if (disposed) return;
        const now = performance.now();
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;
        elapsed += dt;

        syncPointerLock();

        const s = simRef.current;
        const p = propsRef.current;
        const tombSealComplete = s.puzzles.some((pz) => pz.id === 'tomb_seal' && pz.solved);
        worldHandles.deedVisual.visible = tombSealComplete && !s.player.hasDeed;

        // Live sync FOV & Graphics Quality from Steam Settings
        if (s.appliedFov !== p.settings.fov) {
          s.appliedFov = p.settings.fov;
          camera.fov = p.settings.fov;
          camera.updateProjectionMatrix();
        }
        particlePool.mesh.visible = p.settings.graphicsQuality === 'ultra';

        // 1. Update Symmetric Double-Leaf 3D Doors, Clock Pendulum & Crypt Sarcophagus
        worldHandles.clockPendulum.rotation.z = Math.sin(elapsed * 2.6) * 0.24;
        for (const dv of worldHandles.doorVisuals) {
          const door = s.doors.find((item) => item.id === dv.doorId);
          if (!door) continue;
          const targetProg = door.isOpen ? 1 : 0;
          door.openProgress = damp(door.openProgress, targetProg, 7.5, dt);
          dv.leftLeafPivot.rotation.y = -door.openProgress * 1.56;
          dv.rightLeafPivot.rotation.y = door.openProgress * 1.56;
          dv.lockGemMat.color.setHex(
            door.isMainExit ? 0xfbbf24 : door.unlocked ? 0x34d399 : 0xef4444
          );
        }

        if (s.player.tombAwakened) {
          worldHandles.deedVisual.visible = false;
          worldHandles.sarcophagusLid.position.x = damp(
            worldHandles.sarcophagusLid.position.x,
            SARCOPHAGUS_POS.x + 1.32,
            4.5,
            dt
          );
          worldHandles.sarcophagusLid.rotation.z = damp(
            worldHandles.sarcophagusLid.rotation.z,
            -0.24,
            4.5,
            dt
          );
          worldHandles.sarcophagusMistMat.opacity = 0.24 + Math.sin(elapsed * 4) * 0.08;
        }

        // 2. Title Screen Atmospheric Camera vs First-Person Gameplay
        if (p.gameState === 'title') {
          markRig.root.visible = false;
          handFillLight.intensity = 0;
          flashlight.position.set(0, 0.15, 0);
          flashlight.intensity = 22.0;
          camera.position.set(
            Math.sin(elapsed * 0.32) * 2.4,
            2.35 + Math.sin(elapsed * 0.6) * 0.08,
            37.2
          );
          camera.rotation.set(0.04, Math.sin(elapsed * 0.22) * 0.24, 0);
        } else {
          const activePlay = p.gameState === 'playing' && !p.isModalBlocking;

          if (s.deathSeq.active) {
            s.deathSeq.timer += dt;
            const prog = clamp(s.deathSeq.timer / s.deathSeq.duration, 0, 1);

            grandfatherRig.mixer.update(dt);

            if (s.deathSeq.timer >= 0.66 && !s.slashSoundPlayed) {
              s.slashSoundPlayed = true;
              p.soundEngine.playOutcomeSting(false);
            }

            if (hudRefs.current.bloodKillOverlay) {
              const flashAlpha =
                prog < 0.34
                  ? prog * 0.35
                  : prog < 0.55
                  ? 0.78
                  : 0.45 + (prog - 0.55) * 0.9;
              hudRefs.current.bloodKillOverlay.style.opacity = String(clamp(flashAlpha, 0, 0.92));
            }

            const lookDx = s.deathSeq.killerX - s.deathSeq.startCamX;
            const lookDz = s.deathSeq.killerZ - s.deathSeq.startCamZ;
            const targetYaw = Math.atan2(-lookDx, -lookDz);

            if (prog < 0.42) {
              s.player.rotY = dampAngle(s.player.rotY, targetYaw, 18, dt);
              s.player.pitch = damp(s.player.pitch, 0.14, 14, dt);
              const shake = Math.sin(elapsed * 55) * 0.035;
              camera.position.set(
                s.deathSeq.startCamX + shake,
                1.66 + shake * 0.6,
                s.deathSeq.startCamZ
              );
              camera.rotation.set(s.player.pitch, s.player.rotY, shake * 1.5);
            } else {
              const fallProg = (prog - 0.42) / 0.58;
              const fallEase = fallProg * fallProg;
              const camY = 1.66 - fallEase * 1.38;
              const rollZ = fallEase * 0.72;
              const pitchDown = 0.14 - fallEase * 0.52;
              camera.position.set(s.deathSeq.startCamX, camY, s.deathSeq.startCamZ);
              camera.rotation.set(pitchDown, s.player.rotY, rollZ);
            }

            markRig.root.visible = true;
            markRig.update({
              time: elapsed,
              speedRatio: 0,
              isSprinting: false,
              flashlightOn: true,
              battery: 60,
              heldItemKind: s.player.heldItemKind,
              grandfatherThreatRatio: 1,
              yawVel: 0,
              pitchVel: 0,
              deathProgress: prog,
            });

            if (s.deathSeq.timer >= s.deathSeq.duration) {
              s.deathSeq.active = false;
              p.onGameOver(
                buildSnapshot(
                  'defeat',
                  'أمسكت بك روح الجد «فيكتور مالاكور» وقضت على مارك بضربة قاتلة واحدة! استغلّ تفوق سرعتك في المشي والركض واختبئ داخل الخزائن الخشبية.',
                  'Grandfather Victor caught Mark with a lethal one-hit strike!'
                )
              );
            }
          } else if (activePlay) {
            s.survivalSeconds += dt;

            let kbForward = 0;
            let kbStrafe = 0;
            if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) kbForward += 1;
            if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) kbForward -= 1;
            if (keysDown.has('KeyD')) kbStrafe += 1;
            if (keysDown.has('KeyA')) kbStrafe -= 1;

            let keyYaw = 0;
            if (keysDown.has('ArrowLeft')) keyYaw += 1.95 * dt;
            if (keysDown.has('ArrowRight')) keyYaw -= 1.95 * dt;

            const yawDelta = s.pendingYawDelta + keyYaw;
            const pitchDelta = s.pendingPitchDelta;
            s.pendingYawDelta = 0;
            s.pendingPitchDelta = 0;

            const sprintHeld =
              keysDown.has('ShiftLeft') ||
              keysDown.has('ShiftRight') ||
              p.sprintLock;

            const crouchActive =
              keysDown.has('ControlLeft') || p.crouchLock;

            const moveRes = stepPlayerMovement(
              s.player,
              {
                forward: clamp(kbForward + s.joyY, -1, 1),
                strafe: clamp(kbStrafe + s.joyX, -1, 1),
                sprint: sprintHeld,
                crouch: crouchActive,
                yawDelta,
                pitchDelta,
                difficulty: p.settings.difficulty,
              },
              s.walls,
              s.doors,
              s.safeZones,
              dt
            );

            if (moveRes.footstepTriggered) {
              p.soundEngine.playFootstep(s.player.isSprinting);
            }

            // Collect nearby Batteries, Sanity Tinctures & Adrenaline Syringes
            const collected = collectNearbyPickups(s.player, s.pickups);
            if (collected) {
              const pv = worldHandles.pickupVisuals.get(collected.id);
              if (pv) pv.visible = false;
              p.soundEngine.playPickup(collected.kind);
              p.onShowToast(
                collected.kind === 'battery'
                  ? 'التقطت بطارية كشاف (+45%)'
                  : collected.kind === 'adrenaline'
                  ? 'حقنة أدرينالين! سرعة ولياقة قصوى لمدة 6.5 ثوانٍ!'
                  : 'شربتَ قارورة تهدئة الإدراك (+35%)'
              );
            }

            // Collect nearby Cursed Family Relics
            const foundRelic = collectNearbyRelics(s.player, s.relics);
            if (foundRelic) {
              const rv = worldHandles.relicVisuals.get(foundRelic.id);
              if (rv) rv.visible = false;
              particlePool.emitBurst(foundRelic.x, 0.55, foundRelic.z, 16, 0xfbbf24, 2.8, 1.0);
              p.soundEngine.playRelicPickup();
              const count = s.relics.filter((r) => r.collected).length;
              p.onShowToast(`اكتشفتَ تحفة أثرية (${count}/${TOTAL_RELICS}): ${foundRelic.nameAr}`);
              if (count >= TOTAL_RELICS) {
                p.onUnlockAchievement('relic_hunter');
              }
              emitWorldUi();
              persistCheckpointNow();
            }

            // Periodic background checkpoint save every 10s when Mark is alive & safe from execution
            s.autoSaveTimer += dt;
            if (s.autoSaveTimer >= 10.0 && !s.deathSeq.active && s.player.sanity >= 25) {
              s.autoSaveTimer = 0;
              persistCheckpointNow();
            }

            // Step Castle Enemies
            const enemyRes = stepEnemies(
              s.enemies,
              s.player,
              s.walls,
              s.doors,
              s.safeZones,
              dt,
              p.settings.difficulty
            );

            if (enemyRes.doorForcedOpen) {
              p.soundEngine.playDoorUnlock(true);
            }

            p.soundEngine.updateTension(enemyRes.nearestEnemyDist, enemyRes.isChased);

            if (enemyRes.sanityHit > 0) {
              p.soundEngine.playDamageShock();
              if (hudRefs.current.bloodKillOverlay) {
                hudRefs.current.bloodKillOverlay.style.opacity = '0.45';
                window.setTimeout(() => {
                  if (hudRefs.current.bloodKillOverlay && !s.deathSeq.active) {
                    hudRefs.current.bloodKillOverlay.style.opacity = '0';
                  }
                }, 180);
              }
            }

            // Trigger 1-Hit Lethal Execution Sequence if Grandfather catches Mark
            if (enemyRes.lethalCatchByGrandfather && enemyRes.killerEnemy) {
              const killer = enemyRes.killerEnemy;
              const dx = killer.x - s.player.x;
              const dz = killer.z - s.player.z;
              const d = Math.max(0.01, Math.hypot(dx, dz));
              killer.x = s.player.x + (dx / d) * 0.88;
              killer.z = s.player.z + (dz / d) * 0.88;
              killer.rotY = Math.atan2(s.player.x - killer.x, s.player.z - killer.z);

              s.deathSeq = {
                active: true,
                timer: 0,
                duration: DEATH_SEQUENCE_DURATION,
                killerX: killer.x,
                killerZ: killer.z,
                startCamX: s.player.x,
                startCamZ: s.player.z,
                startYaw: s.player.rotY,
                startPitch: s.player.pitch,
              };
              s.slashSoundPlayed = false;
              grandfatherRig.setClip('kill', 1.0);
              p.soundEngine.playKillExecutionScream();
            } else if (s.player.sanity <= 0) {
              p.soundEngine.playOutcomeSting(false);
              p.onGameOver(
                buildSnapshot(
                  'defeat',
                  'انهار إدراك مارك العقلي وسط ظلام القلعة وأشباحها! أبقِ الكشاف مضاءً والتقط قوارير التهدئة والتحف.',
                  'Mark succumbed to the castle madness!'
                )
              );
            }

            // Position First-Person Camera + Smooth Crouch EyeHeight + Head-Bob + Viewmodel Hands
            const speed = Math.hypot(s.player.vx, s.player.vz);
            const speedRatio = clamp(speed / PLAYER_SPRINT_SPEED, 0, 1);
            const headBobY =
              !s.player.isHidden && speed > 0.15
                ? Math.sin(s.player.gaitDist * 3.6) *
                  (s.player.isCrouching ? 0.02 : 0.042) *
                  speedRatio
                : 0;
            const strafeRoll = clamp(-s.joyX * 0.018, -0.025, 0.025);

            camera.position.set(s.player.x, s.player.eyeHeight + headBobY, s.player.z);
            camera.rotation.set(s.player.pitch, s.player.rotY, strafeRoll);

            markRig.root.visible = !s.player.isHidden;
            const gfThreat = clamp((11.5 - enemyRes.grandfatherDist) / 9.5, 0, 1);
            markRig.update({
              time: elapsed,
              speedRatio,
              isSprinting: s.player.isSprinting,
              flashlightOn: s.player.flashlightOn,
              battery: s.player.battery,
              heldItemKind: s.player.hasDeed ? 'deed' : s.player.heldItemKind,
              grandfatherThreatRatio: gfThreat,
              yawVel: yawDelta / Math.max(0.008, dt),
              pitchVel: pitchDelta / Math.max(0.008, dt),
              deathProgress: 0,
            });

            const torchActive =
              s.player.flashlightOn && s.player.battery > 0.5 && !s.player.isHidden;
            const lowBatFlicker =
              s.player.battery < 16 ? 0.65 + Math.sin(elapsed * 32) * 0.3 : 1.0;
            flashlight.position.set(0.16, -0.13, -0.56);
            flashlight.intensity = torchActive ? 34.0 * lowBatFlicker : 0;
            handFillLight.intensity = torchActive ? 0.14 * lowBatFlicker : 0.008;

            // Update HUD DOM Gauges directly at 60Hz (Zero React Reconciliation)
            const refs = hudRefs.current;
            if (refs.sanityFill) refs.sanityFill.style.width = `${s.player.sanity.toFixed(1)}%`;
            if (refs.sanityGhost)
              refs.sanityGhost.style.width = `${s.player.sanityGhost.toFixed(1)}%`;
            if (refs.sanityValue) refs.sanityValue.textContent = `${Math.round(s.player.sanity)}%`;

            if (refs.batteryFill) refs.batteryFill.style.width = `${s.player.battery.toFixed(1)}%`;
            if (refs.batteryGhost)
              refs.batteryGhost.style.width = `${s.player.batteryGhost.toFixed(1)}%`;
            if (refs.batteryValue)
              refs.batteryValue.textContent = `${Math.round(s.player.battery)}%`;

            if (refs.staminaFill) refs.staminaFill.style.width = `${s.player.stamina.toFixed(1)}%`;
            if (refs.staminaGhost)
              refs.staminaGhost.style.width = `${s.player.staminaGhost.toFixed(1)}%`;

            if (refs.noiseFill) {
              refs.noiseFill.style.width = `${s.player.noiseLevel.toFixed(0)}%`;
              refs.noiseFill.className =
                s.player.noiseLevel > 65
                  ? 'absolute inset-y-0 right-0 bg-red-400'
                  : s.player.noiseLevel > 25
                  ? 'absolute inset-y-0 right-0 bg-amber-400'
                  : 'absolute inset-y-0 right-0 bg-emerald-400';
            }
            if (refs.noiseLabel) {
              refs.noiseLabel.textContent =
                s.player.isCrouching || s.player.noiseLevel <= 15
                  ? 'صامت'
                  : s.player.noiseLevel > 65
                  ? 'مرتفع'
                  : 'معتدل';
            }

            if (refs.lowSanityVignette) {
              const pulse = gfThreat > 0.2 ? (Math.sin(elapsed * 8.5) * 0.5 + 0.5) * 0.16 : 0;
              const dreadAlpha = Math.max(
                clamp((45 - s.player.sanity) / 45, 0, 0.85),
                gfThreat * 0.52 + pulse
              );
              refs.lowSanityVignette.style.opacity = dreadAlpha.toFixed(2);
            }

            if (refs.threatBadge) {
              if (s.player.adrenalineTimer > 0) {
                refs.threatBadge.textContent = `أدرينالين نشط (${Math.ceil(s.player.adrenalineTimer)}ث)`;
                refs.threatBadge.className =
                  'rounded px-2 py-0.5 text-[11px] font-extrabold bg-rose-900 text-rose-100';
              } else if (enemyRes.chasingEnemyKind === 'grandfather') {
                refs.threatBadge.textContent =
                  'روح الجد تلاحقك وهي أسرع منك — اختبئ، اكسر خط الرؤية أو اندفع!';
                refs.threatBadge.className =
                  'rounded px-2 py-0.5 text-[11px] font-extrabold bg-red-900 text-amber-100';
              } else if (enemyRes.chasingEnemyKind === 'apparition') {
                refs.threatBadge.textContent =
                  'طيف القلعة الملعون يلاحقك — سلّط الكشاف لإبطائه أو ابتعد!';
                refs.threatBadge.className =
                  'rounded px-2 py-0.5 text-[11px] font-extrabold bg-amber-950 text-amber-200';
              } else if (enemyRes.nearestEnemyDist < 14) {
                refs.threatBadge.textContent = 'خطوات قريبة في الممر';
                refs.threatBadge.className =
                  'rounded px-2 py-0.5 text-[11px] font-bold bg-amber-900/80 text-amber-200';
              } else {
                refs.threatBadge.textContent = s.player.isCrouching ? 'تسلل خفي' : 'هدوء حذر';
                refs.threatBadge.className = s.player.isCrouching
                  ? 'rounded px-2 py-0.5 text-[11px] font-bold bg-emerald-950 text-emerald-300'
                  : 'rounded px-2 py-0.5 text-[11px] font-bold bg-stone-800 text-stone-300';
              }
            }

            const curRoom = getRoomAt(s.player.x, s.player.z);
            const curTarget = findNearestInteractable(
              s.player,
              s.notes,
              s.puzzles,
              s.doors,
              s.hidingSpots,
              s.inventory,
              s.plaques
            );
            const sig = curTarget
              ? `${curTarget.type}:${
                  curTarget.type === 'door'
                    ? `${curTarget.door.id}:${curTarget.canUnlock}`
                    : curTarget.type === 'puzzle'
                    ? `${curTarget.puzzle.id}:${Boolean(curTarget.lockedReasonAr)}`
                    : curTarget.type === 'note'
                    ? `${curTarget.note.id}:${curTarget.note.discovered}`
                    : curTarget.type === 'plaque'
                    ? `${curTarget.plaque.id}:${Boolean(curTarget.plaque.discovered)}`
                    : curTarget.type === 'hide'
                    ? curTarget.spot.id
                    : 'x'
                }`
              : 'none';

            if (sig !== s.lastInteractSignature || curRoom.id !== s.lastRoomId) {
              s.lastInteractSignature = sig;
              s.lastRoomId = curRoom.id;
              emitWorldUi();
            }

            drawMinimap();
          }

          // Sync 3D Enemy Meshes
          for (const e of s.enemies) {
            if (e.kind === 'grandfather') {
              grandfatherRig.root.visible = e.active;
              grandfatherRig.root.position.set(e.x, 0, e.z);
              grandfatherRig.root.rotation.y = e.rotY;
              grandfatherRig.setFlash(
                e.hitFlashTimer > 0 ? 1 : e.alertState === 'chase' ? 0.62 : 0
              );

              if (!s.deathSeq.active) {
                if (e.stunTimer > 0) {
                  grandfatherRig.setClip('idle', 0.35);
                } else if (e.alertState === 'chase') {
                  grandfatherRig.setClip('chase', s.player.tombAwakened ? 1.24 : 1.14);
                } else {
                  grandfatherRig.setClip('walk', 0.85);
                }
                grandfatherRig.mixer.update(activePlay ? dt : 0);
              }
            } else if (e.kind === 'watcher') {
              watcherRig.root.visible = e.active;
              watcherRig.root.position.set(e.x, 0, e.z);
              watcherRig.root.rotation.y = e.rotY;
            } else if (e.kind === 'phantom') {
              phantomRig.root.visible = e.active;
              phantomRig.root.position.set(e.x, 0, e.z);
              phantomRig.root.rotation.y = e.rotY;
              phantomRig.update(elapsed, e.alertState === 'chase', e.hitFlashTimer);
            }
          }
        }

        // Distant Gothic Storm Lightning Flash + Thunder Ambience
        if (p.gameState === 'playing' && !p.isModalBlocking && elapsed >= s.nextThunderAt) {
          s.nextThunderAt = elapsed + 24 + ((elapsed * 7.3) % 14);
          s.lightningFlash = 1.0;
          p.soundEngine.playDistantThunder();
        }
        if (s.lightningFlash > 0) {
          s.lightningFlash = Math.max(0, s.lightningFlash - dt * 3.4);
        }
        moonRimLight.intensity = 0.018 + s.lightningFlash * 1.65;
        hemiLight.intensity = 0.046 + s.lightningFlash * 0.26;

        // Attach up to 4 localized dim candle/lamp halos nearest the camera so rooms stay ominously dark without Mark's flashlight
        const camX = camera.position.x;
        const camZ = camera.position.z;
        const sortedFixtures = [...worldHandles.fixtures].sort(
          (a, b) =>
            (a.x - camX) * (a.x - camX) +
            (a.z - camZ) * (a.z - camZ) -
            ((b.x - camX) * (b.x - camX) + (b.z - camZ) * (b.z - camZ))
        );
        const qualMul = p.settings.graphicsQuality === 'ultra' ? 0.14 : 0.11;
        for (let i = 0; i < worldHandles.fixturePoolLights.length; i++) {
          const pl = worldHandles.fixturePoolLights[i];
          const fx = sortedFixtures[i];
          if (fx && i < 4) {
            const flicker =
              fx.kind === 'cyan_tube' || fx.kind === 'bunker_tube'
                ? 0.94 + Math.sin(elapsed * 22 + i * 2.1) * 0.06
                : 0.88 +
                  Math.sin(elapsed * 6.8 + i * 1.7) * 0.08 +
                  Math.cos(elapsed * 13.5 + i * 3.1) * 0.04;
            pl.position.set(fx.x, fx.y - 0.15, fx.z);
            pl.color.setHex(fx.colorHex);
            pl.intensity = fx.intensity * qualMul * flicker;
            pl.distance = Math.min(5.8, fx.distance * 0.34);
          } else {
            pl.intensity = 0;
          }
        }

        // Gentle floating bob on pickups, relics, note beacons & puzzle orbs
        for (const [, pv] of worldHandles.puzzleVisuals) {
          pv.group.children[1].rotation.y = elapsed * 1.4;
        }
        for (const [, nb] of worldHandles.noteBeacons) {
          if (nb.visible) {
            nb.rotation.y = elapsed * 2.1;
            nb.position.y = 1.44 + Math.sin(elapsed * 3.0) * 0.06;
          }
        }
        for (const [, pk] of worldHandles.pickupVisuals) {
          pk.rotation.y = elapsed * 1.8;
        }
        for (const [, rl] of worldHandles.relicVisuals) {
          rl.rotation.y = elapsed * 1.5;
          rl.position.y = 0.38 + Math.sin(elapsed * 2.4) * 0.05;
        }
        if (worldHandles.deedVisual.visible) {
          worldHandles.deedVisual.position.y = 1.24 + Math.sin(elapsed * 2.5) * 0.04;
          worldHandles.deedVisual.rotation.y = elapsed * 0.6;
        }

        particlePool.update(dt, camera.position.x, camera.position.z);

        const ultraActive = p.settings.graphicsQuality === 'ultra';
        if (flashlight.castShadow !== (!isSoftwareGl && ultraActive)) {
          flashlight.castShadow = !isSoftwareGl && ultraActive;
        }
        if (composer && bloomPass) {
          bloomPass.enabled = ultraActive;
          if (vignettePass) vignettePass.enabled = ultraActive;
          composer.render();
        } else {
          renderer.render(scene, camera);
        }

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          rafId = requestAnimationFrame(tick);
        }
      };

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        rafId = requestAnimationFrame(tick);
      }

      return () => {
        disposed = true;
        cancelAnimationFrame(rafId);
        clearTimeout(timerId);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('blur', clearAllHeldInputs);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('pagehide', onPageHideOrUnload);
        window.removeEventListener('beforeunload', onPageHideOrUnload);
        window.removeEventListener('resize', onResize);
        composer?.dispose();
        envRenderTarget.dispose();
        particlePool.dispose();
        worldHandles.dispose();
        renderer.dispose();
      };
    }, []);

    return (
      <div
        ref={containerRef}
        data-testid="castle-webgl-canvas"
        className="fixed inset-0 z-0 h-full w-full overflow-hidden bg-black touch-none"
      />
    );
  }
);
