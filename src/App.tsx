/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AchievementDef,
  AchievementId,
  CastleDoor,
  CluePlaque,
  DialogueLine,
  GameSettings,
  GameState,
  HidingSpot,
  HudDomRefs,
  InteractTarget,
  InventoryItemId,
  LoreNote,
  PuzzleStation,
  RelicItem,
  RunSnapshot,
} from './game/types';
import {
  TOTAL_RELICS,
  TOTAL_SIGILS,
  createInitialHidingSpots,
  createInitialRelics,
} from './game/rules';
import { createInitialDoors } from './game/castleMap';
import {
  CASTLE_DIALOGUES,
  createCastleCluePlaques,
  createInitialLoreNotes,
  createInitialPuzzleStations,
} from './game/puzzles';
import {
  STEAM_ACHIEVEMENTS,
  loadGameSettings,
  loadUnlockedAchievements,
  saveGameSettings,
  saveUnlockedAchievements,
} from './game/achievements';
import { HollowSoundEngine } from './game/audio';
import {
  SavedCheckpointData,
  clearCheckpointStorage,
  loadCheckpointFromStorage,
} from './game/saveSystem';
import { HollowCanvas, HollowCanvasHandle } from './components/HollowCanvas';
import { TitleOverlay } from './components/TitleOverlay';
import { StoryLetterModal } from './components/StoryLetterModal';
import { HudOverlay } from './components/HudOverlay';
import { DialogueBanner } from './components/DialogueBanner';
import { PuzzleModal } from './components/PuzzleModal';
import { CluePlaqueModal } from './components/CluePlaqueModal';
import { JournalModal } from './components/JournalModal';
import { CastleMapModal } from './components/CastleMapModal';
import { StatusModal } from './components/StatusModal';
import { SettingsModal } from './components/SettingsModal';
import { AchievementsModal, AchievementToast } from './components/AchievementsModal';

const STORAGE_BEST_SIGILS = 'blackthorn_castle_best_sigils_v2';
const STORAGE_BEST_TIME = 'blackthorn_castle_best_time_v2';

export default function App() {
  const isAutoStart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [gameState, setGameState] = useState<GameState>(isAutoStart ? 'playing' : 'title');
  const [savedCheckpoint, setSavedCheckpoint] = useState<SavedCheckpointData | null>(() =>
    loadCheckpointFromStorage()
  );
  const [settings, setSettings] = useState<GameSettings>(() => loadGameSettings());
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<AchievementId>>(() =>
    loadUnlockedAchievements()
  );
  const [achievementBanner, setAchievementBanner] = useState<AchievementDef | null>(null);

  const [isStoryOpen, setIsStoryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [sprintLock, setSprintLock] = useState<boolean>(false);
  const [crouchLock, setCrouchLock] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  const [notes, setNotes] = useState<LoreNote[]>(() => createInitialLoreNotes());
  const [plaques, setPlaques] = useState<CluePlaque[]>(() => createCastleCluePlaques());
  const [puzzles, setPuzzles] = useState<PuzzleStation[]>(() => createInitialPuzzleStations());
  const [relics, setRelics] = useState<RelicItem[]>(() => createInitialRelics());
  const [doors, setDoors] = useState<CastleDoor[]>(() => createInitialDoors());
  const [hidingSpots, setHidingSpots] = useState<HidingSpot[]>(() => createInitialHidingSpots());
  const [playerMapPos, setPlayerMapPos] = useState<{ x: number; z: number; rotY: number }>({
    x: 0,
    z: 38.5,
    rotY: 0,
  });
  const [inventory, setInventory] = useState<InventoryItemId[]>([]);
  const [hasSilverLens, setHasSilverLens] = useState<boolean>(false);
  const [hasDeed, setHasDeed] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [roomNameAr, setRoomNameAr] = useState<string>('البهو الملكي والدرج الكبير');
  const [objectiveAr, setObjectiveAr] = useState<string>(
    'المطلوب (الفصل ١): استكشف البهو الملكي والأجنحة المحيطة وافتح قفل الساعة الطويلة.'
  );
  const [interactTarget, setInteractTarget] = useState<InteractTarget | null>(null);

  const [activePuzzle, setActivePuzzle] = useState<PuzzleStation | null>(null);
  const [activePlaque, setActivePlaque] = useState<CluePlaque | null>(null);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<DialogueLine | null>(null);
  const [runSnapshot, setRunSnapshot] = useState<RunSnapshot | null>(null);

  const [bestSigils, setBestSigils] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(STORAGE_BEST_SIGILS) || '0') || 0;
    } catch {
      return 0;
    }
  });
  const [bestTimeSeconds, setBestTimeSeconds] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_BEST_TIME);
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  });

  const soundEngine = useMemo(() => new HollowSoundEngine(), []);
  const canvasRef = useRef<HollowCanvasHandle | null>(null);
  const toastTimerRef = useRef<number>(0);
  const dialogueTimerRef = useRef<number>(0);
  const achTimerRef = useRef<number>(0);

  const hudRefs = useRef<HudDomRefs>({
    sanityFill: null,
    sanityGhost: null,
    sanityValue: null,
    batteryFill: null,
    batteryGhost: null,
    batteryValue: null,
    staminaFill: null,
    staminaGhost: null,
    noiseFill: null,
    noiseLabel: null,
    lowSanityVignette: null,
    bloodKillOverlay: null,
    minimapCanvas: null,
    threatBadge: null,
  });

  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  useEffect(() => {
    if (isAutoStart) {
      canvasRef.current?.loadSavedCheckpoint();
    }
  }, [isAutoStart]);

  useEffect(() => {
    soundEngine.setMasterVolume(settings.masterVolume);
  }, [settings.masterVolume, soundEngine]);

  const handleUpdateSettings = useCallback((next: GameSettings) => {
    setSettings(next);
    saveGameSettings(next);
  }, []);

  const handleOpenOrToggleMap = useCallback(() => {
    setIsMapOpen((prev) => {
      const next = !prev;
      if (next && canvasRef.current) {
        const live = canvasRef.current.getLiveMapState();
        setPlayerMapPos({ x: live.playerX, z: live.playerZ, rotY: live.playerRotY });
        setDoors(live.doors);
        setHidingSpots(live.hidingSpots);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (
        e.code === 'KeyJ' &&
        gameState === 'playing' &&
        !isStoryOpen &&
        !activePuzzle &&
        !activePlaque
      ) {
        e.preventDefault();
        setIsMapOpen(false);
        setIsSettingsOpen(false);
        setIsAchievementsOpen(false);
        setIsJournalOpen((prev) => !prev);
      } else if (e.code === 'Escape') {
        if (activePlaque) {
          setActivePlaque(null);
        } else if (activePuzzle) {
          setActivePuzzle(null);
        } else if (isMapOpen) {
          setIsMapOpen(false);
        } else if (isJournalOpen) {
          setIsJournalOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isAchievementsOpen) {
          setIsAchievementsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [
    gameState,
    isStoryOpen,
    activePlaque,
    activePuzzle,
    isMapOpen,
    isJournalOpen,
    isSettingsOpen,
    isAchievementsOpen,
  ]);

  const handleUnlockAchievement = useCallback(
    (id: AchievementId) => {
      setUnlockedAchievements((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        saveUnlockedAchievements(next);
        const def = STEAM_ACHIEVEMENTS.find((a) => a.id === id) || null;
        if (def) {
          soundEngine.playAchievementUnlock();
          window.clearTimeout(achTimerRef.current);
          setAchievementBanner(def);
          achTimerRef.current = window.setTimeout(() => {
            setAchievementBanner(null);
          }, 4200);
        }
        return next;
      });
    },
    [soundEngine]
  );

  const showToast = useCallback((msg: string) => {
    window.clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3600);
  }, []);

  const triggerDialogue = useCallback((line: DialogueLine) => {
    window.clearTimeout(dialogueTimerRef.current);
    setActiveDialogue(line);
    dialogueTimerRef.current = window.setTimeout(() => {
      setActiveDialogue(null);
    }, Math.round(line.durationSec * 1000));
  }, []);

  const handleStartNewFromTitle = useCallback(() => {
    soundEngine.unlock();
    clearCheckpointStorage();
    setSavedCheckpoint(null);
    canvasRef.current?.resetRun();
    setRunSnapshot(null);
    setActivePuzzle(null);
    setActivePlaque(null);
    setIsJournalOpen(false);
    setIsMapOpen(false);
    setIsSettingsOpen(false);
    setIsAchievementsOpen(false);
    setSprintLock(false);
    setCrouchLock(false);
    setGameState('playing');
    setIsStoryOpen(true);
  }, [soundEngine]);

  const handleContinueFromCheckpoint = useCallback(() => {
    soundEngine.unlock();
    const ok = canvasRef.current?.loadSavedCheckpoint();
    if (!ok) {
      handleStartNewFromTitle();
      return;
    }
    setRunSnapshot(null);
    setActivePuzzle(null);
    setActivePlaque(null);
    setIsJournalOpen(false);
    setIsMapOpen(false);
    setIsStoryOpen(false);
    setIsSettingsOpen(false);
    setIsAchievementsOpen(false);
    setSprintLock(false);
    setCrouchLock(false);
    setGameState('playing');
    showToast('تم استئناف تقدمك من آخر نقطة حفظ بنجاح!');
  }, [soundEngine, handleStartNewFromTitle, showToast]);

  const handleManualSaveCheckpoint = useCallback(() => {
    const saved = canvasRef.current?.saveCheckpointNow();
    if (saved) {
      soundEngine.playPickupChime();
      setSavedCheckpoint(saved);
      showToast(`تم حفظ التقدم — الفصل ${saved.chapterNum} (${saved.roomNameAr})`);
    }
  }, [soundEngine, showToast]);

  const handleRestartRun = useCallback(() => {
    soundEngine.unlock();
    clearCheckpointStorage();
    setSavedCheckpoint(null);
    canvasRef.current?.resetRun();
    setRunSnapshot(null);
    setActivePuzzle(null);
    setActivePlaque(null);
    setIsJournalOpen(false);
    setIsMapOpen(false);
    setIsStoryOpen(false);
    setIsSettingsOpen(false);
    setIsAchievementsOpen(false);
    setSprintLock(false);
    setCrouchLock(false);
    setGameState('playing');
  }, [soundEngine]);

  const handleReturnToTitle = useCallback(() => {
    if (gameState === 'playing' || gameState === 'paused') {
      const saved = canvasRef.current?.saveCheckpointNow();
      if (saved) setSavedCheckpoint(saved);
    }
    soundEngine.stopAmbient();
    setRunSnapshot(null);
    setActivePuzzle(null);
    setActivePlaque(null);
    setIsJournalOpen(false);
    setIsMapOpen(false);
    setIsStoryOpen(false);
    setIsSettingsOpen(false);
    setIsAchievementsOpen(false);
    setGameState('title');
  }, [gameState, soundEngine]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setMuted(nextMuted);
  }, [soundEngine]);

  const handleGameOver = useCallback((snapshot: RunSnapshot) => {
    if (snapshot.outcome === 'victory') {
      clearCheckpointStorage();
      setSavedCheckpoint(null);
    } else {
      setSavedCheckpoint(loadCheckpointFromStorage());
    }
    setRunSnapshot(snapshot);
    setActivePuzzle(null);
    setActivePlaque(null);
    setIsJournalOpen(false);
    setIsMapOpen(false);
    setIsStoryOpen(false);
    setIsSettingsOpen(false);
    setIsAchievementsOpen(false);
    setGameState('gameover');
    setBestSigils(snapshot.bestSigils);
    setBestTimeSeconds(snapshot.bestTimeSeconds);
    try {
      localStorage.setItem(STORAGE_BEST_SIGILS, String(snapshot.bestSigils));
      if (snapshot.bestTimeSeconds !== null) {
        localStorage.setItem(STORAGE_BEST_TIME, String(Math.round(snapshot.bestTimeSeconds)));
      }
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const isModalBlocking =
    isStoryOpen ||
    isSettingsOpen ||
    isAchievementsOpen ||
    isMapOpen ||
    Boolean(activePuzzle) ||
    Boolean(activePlaque) ||
    isJournalOpen ||
    gameState === 'paused';

  const sigilsSolved = puzzles.filter((p) => p.solved).length;
  const notesFound = notes.filter((n) => n.discovered).length;
  const relicsFound = relics.filter((r) => r.collected).length;
  const relatedNoteForActivePuzzle = activePuzzle
    ? notes.find((n) => n.relatedPuzzle === activePuzzle.id)
    : undefined;
  const relatedPlaqueForActivePuzzle = activePuzzle
    ? plaques.find((pl) => pl.puzzleId === activePuzzle.id)
    : undefined;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-['Cairo',sans-serif] select-none">
      {/* Persistent Single-Mount 3D First-Person Haunted Castle Canvas */}
      <HollowCanvas
        ref={canvasRef}
        gameState={gameState}
        settings={settings}
        isModalBlocking={isModalBlocking}
        sprintLock={sprintLock}
        crouchLock={crouchLock}
        soundEngine={soundEngine}
        hudRefs={hudRefs}
        bestSigils={bestSigils}
        bestTimeSeconds={bestTimeSeconds}
        onToggleCrouchLock={() =>
          setCrouchLock((prev) => {
            const next = !prev;
            if (next) setSprintLock(false);
            return next;
          })
        }
        onToggleMute={handleToggleMute}
        onToggleMap={handleOpenOrToggleMap}
        onUnlockAchievement={handleUnlockAchievement}
        onSyncWorldUi={(payload) => {
          setNotes(payload.notes);
          setPlaques(payload.plaques);
          setPuzzles(payload.puzzles);
          setRelics(payload.relics);
          setDoors(payload.doors);
          setHidingSpots(payload.hidingSpots);
          setPlayerMapPos({
            x: payload.playerX,
            z: payload.playerZ,
            rotY: payload.playerRotY,
          });
          setInventory(payload.inventory);
          setHasSilverLens(payload.hasSilverLens);
          setHasDeed(payload.hasDeed);
          setIsHidden(payload.isHidden);
          setRoomNameAr(payload.roomNameAr);
          setObjectiveAr(payload.objectiveAr);
          setInteractTarget(payload.interactTarget);
        }}
        onOpenPuzzle={(pz) => setActivePuzzle(pz)}
        onOpenPlaque={(pl) => setActivePlaque(pl)}
        onOpenNoteInJournal={(noteId) => {
          setActiveNoteId(noteId);
          setIsJournalOpen(true);
        }}
        onShowToast={showToast}
        onTriggerDialogue={triggerDialogue}
        onRequestPauseToggle={() =>
          setGameState((prev) => {
            if (prev === 'playing') {
              const saved = canvasRef.current?.saveCheckpointNow();
              if (saved) setSavedCheckpoint(saved);
              return 'paused';
            }
            return prev === 'paused' ? 'playing' : prev;
          })
        }
        onGameOver={handleGameOver}
        onCheckpointSaved={(cp) => setSavedCheckpoint(cp)}
      />

      {/* Title Screen */}
      {gameState === 'title' && (
        <TitleOverlay
          savedCheckpoint={savedCheckpoint}
          bestSigils={bestSigils}
          bestTimeSeconds={bestTimeSeconds}
          unlockedAchievementsCount={unlockedAchievements.size}
          totalAchievementsCount={STEAM_ACHIEVEMENTS.length}
          isSubModalOpen={isSettingsOpen || isAchievementsOpen}
          onContinueGame={handleContinueFromCheckpoint}
          onStartNewGame={handleStartNewFromTitle}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
        />
      )}

      {/* Active First-Person HUD & Dialogue Subtitles */}
      {gameState !== 'title' && (
        <>
          <HudOverlay
            hudRefs={hudRefs}
            sigilsSolved={sigilsSolved}
            totalSigils={TOTAL_SIGILS}
            notesFound={notesFound}
            totalNotes={notes.length}
            relicsFound={relicsFound}
            totalRelics={TOTAL_RELICS}
            hasSilverLens={hasSilverLens}
            hasDeed={hasDeed}
            isHidden={isHidden}
            roomNameAr={roomNameAr}
            objectiveAr={objectiveAr}
            interactTarget={interactTarget}
            toastMessage={toastMessage}
            muted={muted}
            sprintToggle={sprintLock}
            crouchToggle={crouchLock}
            onJoystickMove={(dx, dy) => canvasRef.current?.setJoystick(dx, dy)}
            onToggleSprintLock={() =>
              setSprintLock((prev) => {
                const next = !prev;
                if (next) setCrouchLock(false);
                return next;
              })
            }
            onToggleCrouchLock={() =>
              setCrouchLock((prev) => {
                const next = !prev;
                if (next) setSprintLock(false);
                return next;
              })
            }
            onDash={() => canvasRef.current?.triggerDash()}
            onToggleFlashlight={() => canvasRef.current?.toggleFlashlight()}
            onSilverWard={() => canvasRef.current?.triggerWardBurst()}
            onInteract={() => canvasRef.current?.triggerInteract()}
            onOpenMap={handleOpenOrToggleMap}
            onOpenJournal={() => setIsJournalOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAchievements={() => setIsAchievementsOpen(true)}
            onToggleMute={handleToggleMute}
            onPause={() => {
              const saved = canvasRef.current?.saveCheckpointNow();
              if (saved) setSavedCheckpoint(saved);
              setGameState('paused');
            }}
            onSaveCheckpoint={handleManualSaveCheckpoint}
          />

          {!isStoryOpen && <DialogueBanner dialogue={activeDialogue} />}
        </>
      )}

      {/* Non-Blocking Steam Achievement Unlock Corner Banner */}
      <AchievementToast achievement={achievementBanner} />

      {/* Full Complete Story Parchment Modal */}
      <StoryLetterModal
        isOpen={isStoryOpen}
        onConfirmStart={() => {
          soundEngine.unlock();
          setIsStoryOpen(false);
          triggerDialogue(CASTLE_DIALOGUES.intro_foyer);
        }}
      />

      {/* Interactive Architectural Castle Map Modal */}
      <CastleMapModal
        isOpen={isMapOpen}
        playerX={playerMapPos.x}
        playerZ={playerMapPos.z}
        playerRotY={playerMapPos.rotY}
        currentRoomNameAr={roomNameAr}
        doors={doors}
        hidingSpots={hidingSpots}
        relics={relics}
        notes={notes}
        puzzles={puzzles}
        onClose={() => setIsMapOpen(false)}
      />

      {/* Interactive Sequential Castle Puzzles Modal */}
      <PuzzleModal
        puzzle={activePuzzle}
        relatedNote={relatedNoteForActivePuzzle}
        relatedPlaque={relatedPlaqueForActivePuzzle}
        onClose={() => setActivePuzzle(null)}
        onSolved={(pz) => {
          setActivePuzzle(null);
          canvasRef.current?.completePuzzle(pz.id);
        }}
        onPlayBellTone={(freq) => soundEngine.playBellNote(freq)}
        onPlayClick={(pitch) => soundEngine.playMechanicalClick(pitch)}
      />

      {/* Close-Up Engraved Wall Plaque & Secret Numbers Viewer Modal */}
      <CluePlaqueModal
        plaque={activePlaque}
        onClose={() => setActivePlaque(null)}
      />

      {/* Mark's Inventory Keys, Lore Notes, Discovered Plaques & Relics Journal */}
      <JournalModal
        isOpen={isJournalOpen}
        notes={notes}
        plaques={plaques}
        inventory={inventory}
        relics={relics}
        activeNoteId={activeNoteId}
        onSelectNote={(id) => setActiveNoteId(id)}
        onOpenStoryLetter={() => {
          setIsJournalOpen(false);
          setIsStoryOpen(true);
        }}
        onClose={() => setIsJournalOpen(false)}
      />

      {/* Commercial Steam Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Steam Achievements Gallery Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        unlockedIds={unlockedAchievements}
        onClose={() => setIsAchievementsOpen(false)}
      />

      {/* Pause & Victory / Defeat Outcome Modal */}
      {!isSettingsOpen && !isAchievementsOpen && (
        <StatusModal
          gameState={gameState}
          snapshot={runSnapshot}
          savedCheckpoint={savedCheckpoint}
          onResume={() => setGameState('playing')}
          onSaveCheckpoint={handleManualSaveCheckpoint}
          onLoadCheckpoint={handleContinueFromCheckpoint}
          onRestart={handleRestartRun}
          onReturnTitle={handleReturnToTitle}
          onOpenStory={() => {
            setGameState('playing');
            setIsStoryOpen(true);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
        />
      )}
    </div>
  );
}
