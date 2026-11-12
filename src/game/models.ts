import * as THREE from 'three';
import {
  CastleDoor,
  HidingSpot,
  LoreNote,
  PickupItem,
  PuzzleStation,
  RelicItem,
  WallBox,
} from './types';
import {
  CASTLE_ROOMS,
  CastleLightFixture,
  DEED_ALTAR_POS,
  SARCOPHAGUS_POS,
  getSixStatuePositions,
} from './castleMap';
import { ELIXIR_VIALS, STEAM_VALVES, VEILED_STATUES } from './puzzles';
import { buildStatueWatcherRig } from './characters';
import oakPlanksUrl from '../assets/images/dark_oak_planks_1793122580608.jpg';
import stoneMasonryUrl from '../assets/images/castle_stone_masonry_1793122581904.jpg';
import victorPortraitUrl from '../assets/images/victor_oil_portrait_1793122582618.jpg';

export interface DoorVisual {
  doorId: string;
  leftLeafPivot: THREE.Group;
  rightLeafPivot: THREE.Group;
  lockGemMat: THREE.MeshBasicMaterial;
  axis: 'x' | 'z';
}

export interface CastleWorldHandles {
  worldGroup: THREE.Group;
  doorVisuals: DoorVisual[];
  noteVisuals: Map<string, THREE.Group>;
  noteBeacons: Map<string, THREE.Mesh>;
  pickupVisuals: Map<string, THREE.Group>;
  relicVisuals: Map<string, THREE.Group>;
  puzzleVisuals: Map<string, { group: THREE.Group; beaconMat: THREE.MeshBasicMaterial }>;
  deedVisual: THREE.Group;
  sarcophagusLid: THREE.Mesh;
  sarcophagusMistMat: THREE.MeshBasicMaterial;
  clockPendulum: THREE.Group;
  statueBowlFlames: THREE.Mesh[];
  fixturePoolLights: THREE.PointLight[];
  fixtures: CastleLightFixture[];
  dispose: () => void;
}

function makeCanvasTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeatX = 1,
  repeatY = 1,
  isLinearData = false,
  anisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isLinearData ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  return tex;
}

export function createCastleWorld(params: {
  walls: readonly WallBox[];
  doors: readonly CastleDoor[];
  fixtures: CastleLightFixture[];
  notes: readonly LoreNote[];
  puzzles: readonly PuzzleStation[];
  hidingSpots: readonly HidingSpot[];
  pickups: readonly PickupItem[];
  relics: readonly RelicItem[];
  maxAnisotropy?: number;
}): CastleWorldHandles {
  const {
    walls,
    doors,
    fixtures,
    notes,
    puzzles,
    hidingSpots,
    pickups,
    relics,
    maxAnisotropy = 8,
  } = params;
  const worldGroup = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  // ==========================================================================
  // 1. High-Definition 512px Procedural PBR Albedo, Bump & Roughness Maps
  // ==========================================================================
  const woodFloorTex = track(
    makeCanvasTex(
      512,
      512,
      (ctx, w, h) => {
        ctx.fillStyle = '#2d1c11';
        ctx.fillRect(0, 0, w, h);
        const planks = 10;
        const ph = h / planks;
        for (let i = 0; i < planks; i++) {
          const shade = 34 + ((i * 17) % 20);
          const grad = ctx.createLinearGradient(0, i * ph, 0, (i + 1) * ph);
          grad.addColorStop(0, `rgb(${shade + 22}, ${shade + 3}, ${Math.max(12, shade - 9)})`);
          grad.addColorStop(0.5, `rgb(${shade + 28}, ${shade + 7}, ${Math.max(14, shade - 6)})`);
          grad.addColorStop(1, `rgb(${shade + 16}, ${shade - 1}, ${Math.max(10, shade - 12)})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, i * ph + 2, w, ph - 3);

          // Deep plank seam + staggered end joint + brass/iron floor nails
          ctx.fillStyle = 'rgba(10, 5, 2, 0.78)';
          ctx.fillRect(0, i * ph, w, 2.5);
          const jointX = ((i * 137) % (w - 80)) + 40;
          ctx.fillRect(jointX, i * ph, 3, ph);
          ctx.fillStyle = 'rgba(22, 14, 9, 0.85)';
          ctx.beginPath();
          ctx.arc(jointX - 8, i * ph + ph * 0.28, 2.2, 0, Math.PI * 2);
          ctx.arc(jointX - 8, i * ph + ph * 0.72, 2.2, 0, Math.PI * 2);
          ctx.arc(jointX + 10, i * ph + ph * 0.28, 2.2, 0, Math.PI * 2);
          ctx.arc(jointX + 10, i * ph + ph * 0.72, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Fine woodgrain fibers & occasional knot
          ctx.strokeStyle = 'rgba(18, 9, 4, 0.26)';
          ctx.lineWidth = 1.2;
          for (let g = 0; g < 9; g++) {
            const gy = i * ph + 5 + g * (ph / 9.5);
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.bezierCurveTo(w * 0.33, gy + ((g % 2) * 3 - 1.5), w * 0.66, gy - 1.5, w, gy + 0.5);
            ctx.stroke();
          }
          if (i % 3 === 1) {
            const kx = ((i * 193) % (w - 120)) + 60;
            const ky = i * ph + ph * 0.52;
            ctx.fillStyle = 'rgba(24, 12, 5, 0.55)';
            ctx.beginPath();
            ctx.ellipse(kx, ky, 9, 4.5, 0.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      },
      7,
      7,
      false,
      maxAnisotropy
    )
  );

  const woodBumpTex = track(
    makeCanvasTex(
      256,
      256,
      (ctx, w, h) => {
        ctx.fillStyle = '#909090';
        ctx.fillRect(0, 0, w, h);
        const planks = 10;
        const ph = h / planks;
        for (let i = 0; i < planks; i++) {
          ctx.fillStyle = '#181818';
          ctx.fillRect(0, i * ph, w, 2);
          ctx.fillStyle = '#c8c8c8';
          ctx.fillRect(0, i * ph + 2, w, 1.5);
          const jointX = ((i * 68) % (w - 40)) + 20;
          ctx.fillStyle = '#181818';
          ctx.fillRect(jointX, i * ph, 2, ph);
          ctx.strokeStyle = 'rgba(60,60,60,0.45)';
          ctx.lineWidth = 1;
          for (let g = 0; g < 6; g++) {
            ctx.beginPath();
            ctx.moveTo(0, i * ph + 4 + g * 3.8);
            ctx.lineTo(w, i * ph + 5 + g * 3.8);
            ctx.stroke();
          }
        }
      },
      7,
      7,
      true,
      maxAnisotropy
    )
  );

  const wainscotTex = track(
    makeCanvasTex(
      512,
      512,
      (ctx, w, h) => {
        // Upper Victorian damask striped wallpaper with subtle damp-rot vignette
        const wy = Math.floor(h * 0.62);
        const wallGrad = ctx.createLinearGradient(0, 0, 0, wy);
        wallGrad.addColorStop(0, '#4f463d');
        wallGrad.addColorStop(0.5, '#766b5d');
        wallGrad.addColorStop(1, '#584e43');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, w, wy);

        ctx.fillStyle = 'rgba(38, 31, 25, 0.34)';
        for (let x = 0; x < w; x += 32) {
          ctx.fillRect(x, 0, 12, wy);
          ctx.fillStyle = 'rgba(185, 160, 118, 0.08)';
          ctx.fillRect(x + 14, 0, 3, wy);
          ctx.fillStyle = 'rgba(38, 31, 25, 0.34)';
        }

        // Top crown cornice
        ctx.fillStyle = '#2d1d12';
        ctx.fillRect(0, 0, w, 18);
        ctx.fillStyle = '#5c3d28';
        ctx.fillRect(0, 18, w, 5);

        // Lower carved dark walnut wainscoting panels
        ctx.fillStyle = '#382215';
        ctx.fillRect(0, wy, w, h - wy);
        ctx.fillStyle = '#6b462e';
        ctx.fillRect(0, wy, w, 10);
        ctx.fillStyle = '#1f1109';
        ctx.fillRect(0, wy + 10, w, 4);

        for (let p = 0; p < 4; p++) {
          const px = p * (w / 4) + 14;
          const pw = w / 4 - 28;
          const py = wy + 24;
          const ph = h - wy - 40;
          ctx.fillStyle = '#2e1b10';
          ctx.fillRect(px, py, pw, ph);
          ctx.strokeStyle = '#160b05';
          ctx.lineWidth = 5;
          ctx.strokeRect(px, py, pw, ph);
          ctx.strokeStyle = '#5b3a24';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 6, py + 6, pw - 12, ph - 12);
        }
      },
      2,
      1,
      false,
      maxAnisotropy
    )
  );

  const wainscotBumpTex = track(
    makeCanvasTex(
      256,
      256,
      (ctx, w, h) => {
        const wy = Math.floor(h * 0.62);
        ctx.fillStyle = '#787878';
        ctx.fillRect(0, 0, w, wy);
        for (let x = 0; x < w; x += 16) {
          ctx.fillStyle = '#929292';
          ctx.fillRect(x, 0, 6, wy);
        }
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, wy, w, h - wy);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, wy, w, 5);
        for (let p = 0; p < 4; p++) {
          const px = p * (w / 4) + 8;
          ctx.strokeStyle = '#222222';
          ctx.lineWidth = 3;
          ctx.strokeRect(px, wy + 12, w / 4 - 16, h - wy - 20);
        }
      },
      2,
      1,
      true,
      maxAnisotropy
    )
  );

  const stoneBumpTex = track(
    makeCanvasTex(
      256,
      256,
      (ctx, w, h) => {
        ctx.fillStyle = '#8a8a8a';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 160; i++) {
          const rx = (i * 47) % w;
          const ry = (i * 83) % h;
          ctx.fillStyle = i % 2 === 0 ? 'rgba(40,40,40,0.35)' : 'rgba(215,215,215,0.28)';
          ctx.fillRect(rx, ry, 18, 12);
        }
        ctx.strokeStyle = '#202020';
        ctx.lineWidth = 3;
        for (let y = 0; y < h; y += 42) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
          for (let x = ((y / 42) % 2) * 32; x < w; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 42);
            ctx.stroke();
          }
        }
      },
      3,
      2,
      true,
      maxAnisotropy
    )
  );

  const plasterTex = track(
    makeCanvasTex(
      256,
      256,
      (ctx, w, h) => {
        ctx.fillStyle = '#73695c';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 110; i++) {
          const rx = (i * 53) % w;
          const ry = (i * 89) % h;
          ctx.fillStyle = i % 2 === 0 ? 'rgba(34,30,25,0.22)' : 'rgba(138,128,112,0.16)';
          ctx.fillRect(rx, ry, 26, 18);
        }
        ctx.fillStyle = '#261d17';
        ctx.fillRect(0, h - 14, w, 14);
      },
      2,
      1,
      false,
      maxAnisotropy
    )
  );

  const bunkerTex = track(
    makeCanvasTex(
      256,
      256,
      (ctx, w, h) => {
        ctx.fillStyle = '#383d42';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#1e2124';
        ctx.lineWidth = 2.5;
        for (let y = 0; y < h; y += 32) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
          for (let x = ((y / 32) % 2) * 32; x < w; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 32);
            ctx.stroke();
          }
        }
      },
      3,
      1,
      false,
      maxAnisotropy
    )
  );

  const infirmaryTex = track(
    makeCanvasTex(
      256,
      256,
      (ctx, w, h) => {
        ctx.fillStyle = '#47575a';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#252f31';
        ctx.lineWidth = 2;
        for (let x = 0; x <= w; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y <= h; y += 32) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      },
      3,
      2,
      false,
      maxAnisotropy
    )
  );

  const checkerMarbleTex = track(
    makeCanvasTex(
      512,
      512,
      (ctx, w, h) => {
        const cells = 4;
        const cw = w / cells;
        for (let r = 0; r < cells; r++) {
          for (let c = 0; c < cells; c++) {
            const isLight = (r + c) % 2 === 0;
            ctx.fillStyle = isLight ? '#d4cec2' : '#18171c';
            ctx.fillRect(c * cw, r * cw, cw, cw);
            // Subtle marble veins
            ctx.strokeStyle = isLight ? 'rgba(110,102,92,0.32)' : 'rgba(95,95,112,0.28)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(c * cw + 8, r * cw + 18);
            ctx.bezierCurveTo(
              c * cw + cw * 0.45,
              r * cw + cw * 0.3,
              c * cw + cw * 0.6,
              r * cw + cw * 0.75,
              c * cw + cw - 10,
              r * cw + cw - 14
            );
            ctx.stroke();
            ctx.strokeStyle = 'rgba(60,56,50,0.5)';
            ctx.strokeRect(c * cw, r * cw, cw, cw);
          }
        }
      },
      7,
      7,
      false,
      maxAnisotropy
    )
  );

  const cryptStoneTex = track(
    makeCanvasTex(
      256,
      256,
      (ctx, w, h) => {
        ctx.fillStyle = '#282423';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#110f0d';
        ctx.lineWidth = 3;
        for (let y = 0; y < h; y += 42) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
          for (let x = ((y / 42) % 2) * 32; x < w; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 42);
            ctx.stroke();
          }
        }
      },
      3,
      2,
      false,
      maxAnisotropy
    )
  );

  const persianRugTex = track(
    makeCanvasTex(
      512,
      1024,
      (ctx, w, h) => {
        ctx.fillStyle = '#4c0f16';
        ctx.fillRect(0, 0, w, h);
        // Intricate woven Gothic-Persian borders
        ctx.strokeStyle = '#c89646';
        ctx.lineWidth = 18;
        ctx.strokeRect(24, 24, w - 48, h - 48);
        ctx.strokeStyle = '#172030';
        ctx.lineWidth = 10;
        ctx.strokeRect(52, 52, w - 104, h - 104);
        ctx.strokeStyle = '#d4a65a';
        ctx.lineWidth = 5;
        ctx.strokeRect(72, 72, w - 144, h - 144);

        ctx.fillStyle = '#731620';
        ctx.fillRect(88, 96, w - 176, h - 192);

        // Ornate center medallion + inner filigree
        ctx.fillStyle = '#1b2434';
        ctx.beginPath();
        ctx.moveTo(w / 2, 220);
        ctx.lineTo(w - 120, h / 2);
        ctx.lineTo(w / 2, h - 220);
        ctx.lineTo(120, h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#d6a656';
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.moveTo(w / 2, 310);
        ctx.lineTo(w - 168, h / 2);
        ctx.lineTo(w / 2, h - 310);
        ctx.lineTo(168, h / 2);
        ctx.closePath();
        ctx.fill();

        // Subtle woven carpet thread texture
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let y = 0; y < h; y += 6) {
          ctx.fillRect(0, y, w, 2);
        }
      },
      1,
      1,
      false,
      maxAnisotropy
    )
  );

  const portraitTex = track(
    makeCanvasTex(
      256,
      320,
      (ctx, w, h) => {
        const bg = ctx.createRadialGradient(w / 2, h * 0.42, 20, w / 2, h * 0.5, 190);
        bg.addColorStop(0, '#2b2226');
        bg.addColorStop(1, '#0e0b0d');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Victorian Undertaker Coat & Cravat
        ctx.fillStyle = '#18151b';
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.88, 92, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#d6d0c4';
        ctx.beginPath();
        ctx.moveTo(w / 2 - 18, h * 0.62);
        ctx.lineTo(w / 2 + 18, h * 0.62);
        ctx.lineTo(w / 2, h * 0.78);
        ctx.closePath();
        ctx.fill();

        // Silver-white side hair locks
        ctx.fillStyle = '#bfc4cc';
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.41, 56, 62, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gaunt pale oil-painted face
        ctx.fillStyle = '#c9bfb2';
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.42, 44, 58, 0, 0, Math.PI * 2);
        ctx.fill();

        // Deep shadowed eye sockets & piercing amber-gold gaze
        ctx.fillStyle = '#181216';
        ctx.beginPath();
        ctx.ellipse(w / 2 - 17, h * 0.39, 11, 7, 0.1, 0, Math.PI * 2);
        ctx.ellipse(w / 2 + 17, h * 0.39, 11, 7, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(w / 2 - 17, h * 0.39, 3.2, 0, Math.PI * 2);
        ctx.arc(w / 2 + 17, h * 0.39, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Stern mouth & gaunt cheekbones
        ctx.strokeStyle = '#3a2d2b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 15, h * 0.52);
        ctx.lineTo(w / 2 + 15, h * 0.52);
        ctx.stroke();
      },
      1,
      1,
      false,
      maxAnisotropy
    )
  );

  const crtTex = track(
    makeCanvasTex(
      128,
      96,
      (ctx, w, h) => {
        ctx.fillStyle = '#082f38';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        for (let y = 0; y < h; y += 4) {
          ctx.fillRect(0, y, w, 2);
        }
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, w - 16, h - 16);
        ctx.fillStyle = '#a5f3fc';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('CAM FEED', 22, h / 2 + 4);
      },
      1,
      1,
      false,
      maxAnisotropy
    )
  );

  // Shared PBR Materials initialized with instant procedural textures (zero Frame-1 black pop-in!)
  // and upgraded seamlessly once high-res photorealistic local textures decode.
  const floorMaterials: Record<string, THREE.MeshStandardMaterial> = {
    wood: track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: woodFloorTex,
        bumpMap: woodBumpTex,
        bumpScale: 0.036,
        roughness: 0.46,
        metalness: 0.09,
      })
    ),
    stone: track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: plasterTex,
        bumpMap: stoneBumpTex,
        bumpScale: 0.042,
        roughness: 0.78,
        metalness: 0.06,
      })
    ),
    bunker: track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: bunkerTex,
        bumpMap: stoneBumpTex,
        bumpScale: 0.035,
        roughness: 0.76,
        metalness: 0.14,
      })
    ),
    infirmary: track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: infirmaryTex,
        bumpMap: stoneBumpTex,
        bumpScale: 0.02,
        roughness: 0.38,
        metalness: 0.12,
      })
    ),
    checker: track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: checkerMarbleTex,
        bumpMap: stoneBumpTex,
        bumpScale: 0.015,
        roughness: 0.26,
        metalness: 0.16,
      })
    ),
    crypt: track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: cryptStoneTex,
        bumpMap: stoneBumpTex,
        bumpScale: 0.052,
        roughness: 0.82,
      })
    ),
  };

  const wallMaterials: Record<string, THREE.MeshStandardMaterial> = {
    wainscot: track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: wainscotTex,
        bumpMap: wainscotBumpTex,
        bumpScale: 0.038,
        roughness: 0.64,
        metalness: 0.08,
      })
    ),
    plaster: track(
      new THREE.MeshStandardMaterial({
        color: 0xc8bfb2,
        map: plasterTex,
        bumpMap: stoneBumpTex,
        bumpScale: 0.038,
        roughness: 0.82,
      })
    ),
    bunker: track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: bunkerTex,
        bumpMap: stoneBumpTex,
        bumpScale: 0.035,
        roughness: 0.78,
        metalness: 0.14,
      })
    ),
    infirmary: track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: infirmaryTex,
        bumpMap: stoneBumpTex,
        bumpScale: 0.022,
        roughness: 0.48,
        metalness: 0.1,
      })
    ),
    marble: track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: cryptStoneTex,
        bumpMap: stoneBumpTex,
        bumpScale: 0.032,
        roughness: 0.44,
        metalness: 0.14,
      })
    ),
    crypt: track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: cryptStoneTex,
        bumpMap: stoneBumpTex,
        bumpScale: 0.055,
        roughness: 0.86,
      })
    ),
    prop: track(
      new THREE.MeshStandardMaterial({
        color: 0x3b271a,
        bumpMap: woodBumpTex,
        bumpScale: 0.02,
        roughness: 0.62,
        metalness: 0.1,
      })
    ),
  };

  const ceilingMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x383029,
      bumpMap: stoneBumpTex,
      bumpScale: 0.025,
      roughness: 0.9,
    })
  );
  const darkWoodMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x4a2e1b,
      bumpMap: woodBumpTex,
      bumpScale: 0.022,
      roughness: 0.54,
      metalness: 0.1,
    })
  );
  const ironMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x3f464e,
      bumpMap: stoneBumpTex,
      bumpScale: 0.015,
      roughness: 0.36,
      metalness: 0.82,
    })
  );
  const brassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd4943a,
      roughness: 0.24,
      metalness: 0.88,
    })
  );
  const redValveMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.36,
      metalness: 0.65,
    })
  );
  const rugMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: persianRugTex,
      roughness: 0.88,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );

  // ==========================================================================
  // 2. Non-Overlapping Castle Room Floors, Ceilings & Ceiling Beams (Zero Z-fight!)
  // ==========================================================================
  const addFloorCeilPatch = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    ceilingHeight: number,
    floorStyle: string
  ) => {
    const rw = maxX - minX;
    const rd = maxZ - minZ;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;

    const floorMesh = new THREE.Mesh(
      track(new THREE.PlaneGeometry(rw, rd, Math.max(2, Math.round(rw / 3)), Math.max(2, Math.round(rd / 3)))),
      floorMaterials[floorStyle] || floorMaterials.wood
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(cx, 0, cz);
    floorMesh.receiveShadow = true;
    worldGroup.add(floorMesh);

    const ceilMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(rw, rd)), ceilingMat);
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.position.set(cx, ceilingHeight, cz);
    worldGroup.add(ceilMesh);

    for (let bz = minZ + 4; bz < maxZ - 2; bz += 6) {
      const beam = new THREE.Mesh(
        track(new THREE.BoxGeometry(rw - 0.4, 0.24, 0.32)),
        darkWoodMat
      );
      beam.position.set(cx, ceilingHeight - 0.12, bz);
      worldGroup.add(beam);
    }
  };

  for (const room of CASTLE_ROOMS) {
    if (room.id === 'steam_gallery') {
      // L-shaped floor avoiding Statue Hall [-14..14, -18..18]
      addFloorCeilPatch(-32, -14, 14, 34, room.ceilingHeight, room.floorStyle);
      addFloorCeilPatch(-14, -10, 18, 34, room.ceilingHeight, room.floorStyle);
    } else if (room.id === 'portrait_hall') {
      // L-shaped floor avoiding Statue Hall [-14..14, -18..18]
      addFloorCeilPatch(14, 24, 8, 36, room.ceilingHeight, room.floorStyle);
      addFloorCeilPatch(10, 14, 18, 36, room.ceilingHeight, room.floorStyle);
    } else {
      addFloorCeilPatch(
        room.minX,
        room.maxX,
        room.minZ,
        room.maxZ,
        room.ceilingHeight,
        room.floorStyle
      );
    }
  }

  // ==========================================================================
  // 3. Castle Architectural Walls & Loop Islands (Skip invisible prop AABBs!)
  // ==========================================================================
  for (const w of walls) {
    if (w.renderMesh === false) continue;
    const sx = w.maxX - w.minX;
    const sz = w.maxZ - w.minZ;
    const cx = (w.minX + w.maxX) / 2;
    const cz = (w.minZ + w.maxZ) / 2;
    const mat = wallMaterials[w.style || 'wainscot'] || wallMaterials.wainscot;
    const mesh = new THREE.Mesh(track(new THREE.BoxGeometry(sx, w.height, sz)), mat);
    mesh.position.set(cx, w.height / 2, cz);
    worldGroup.add(mesh);
  }

  // ==========================================================================
  // 4. 10 Double-Leaf Gothic Hinged Doors + Transom Arches
  // ==========================================================================
  const doorVisuals: DoorVisual[] = [];
  const doorLeafMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x3a2214,
      roughness: 0.68,
      metalness: 0.1,
    })
  );

  for (const d of doors) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(d.x, 0, d.z);
    if (d.axis === 'z') {
      doorGroup.rotation.y = Math.PI / 2;
    }
    worldGroup.add(doorGroup);

    const frameW = d.width;
    const doorH = 3.25;

    for (let side = -1; side <= 1; side += 2) {
      const jamb = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.28, 4.7, 0.68)),
        darkWoodMat
      );
      jamb.position.set(side * (frameW / 2 - 0.06), 2.35, 0);
      doorGroup.add(jamb);
    }
    const lintel = new THREE.Mesh(
      track(new THREE.BoxGeometry(frameW + 0.36, 1.55, 0.66)),
      wallMaterials.wainscot
    );
    lintel.position.set(0, doorH + 0.77, 0);
    doorGroup.add(lintel);

    // Symmetric Twin-Leaf Gothic Doors (each leaf ~1.84m wide so open leaves hug jambs cleanly!)
    const singleLeafW = (frameW - 0.32) * 0.5;
    const leftLeafPivot = new THREE.Group();
    leftLeafPivot.position.set(-frameW / 2 + 0.16, 0, 0);
    doorGroup.add(leftLeafPivot);

    const leftLeaf = new THREE.Mesh(
      track(new THREE.BoxGeometry(singleLeafW, doorH, 0.16)),
      d.isMainExit ? ironMat : doorLeafMat
    );
    leftLeaf.position.set(singleLeafW / 2, doorH / 2, 0);
    leftLeafPivot.add(leftLeaf);

    const rightLeafPivot = new THREE.Group();
    rightLeafPivot.position.set(frameW / 2 - 0.16, 0, 0);
    doorGroup.add(rightLeafPivot);

    const rightLeaf = new THREE.Mesh(
      track(new THREE.BoxGeometry(singleLeafW, doorH, 0.16)),
      d.isMainExit ? ironMat : doorLeafMat
    );
    rightLeaf.position.set(-singleLeafW / 2, doorH / 2, 0);
    rightLeafPivot.add(rightLeaf);

    // Brass handles & lock status gems
    const lockGemMat = track(
      new THREE.MeshBasicMaterial({
        color: d.unlocked ? 0x34d399 : 0xef4444,
      })
    );
    for (const [piv, dir] of [
      [leftLeafPivot, 1],
      [rightLeafPivot, -1],
    ] as const) {
      const handleBar = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8)),
        brassMat
      );
      handleBar.rotation.x = Math.PI / 2;
      handleBar.position.set(dir * (singleLeafW - 0.2), 1.38, 0);
      piv.add(handleBar);
    }

    const lockGem = new THREE.Mesh(track(new THREE.SphereGeometry(0.06, 8, 8)), lockGemMat);
    lockGem.position.set(singleLeafW - 0.14, 1.62, 0.11);
    leftLeafPivot.add(lockGem);
    const lockGemBack = new THREE.Mesh(track(new THREE.SphereGeometry(0.06, 8, 8)), lockGemMat);
    lockGemBack.position.set(singleLeafW - 0.14, 1.62, -0.11);
    leftLeafPivot.add(lockGemBack);

    doorVisuals.push({
      doorId: d.id,
      leftLeafPivot,
      rightLeafPivot,
      lockGemMat,
      axis: d.axis,
    });
  }

  // ==========================================================================
  // 5. Room-Specific Landmarks Matching Reference Images + Colliders!
  // ==========================================================================

  // --- ROOM 1: GRAND FOYER ---
  const foyerRug = new THREE.Mesh(
    track(new THREE.PlaneGeometry(4.4, 10.5, 12, 24)),
    rugMat
  );
  foyerRug.rotation.x = -Math.PI / 2;
  foyerRug.position.set(0, 0.022, 35.5);
  foyerRug.receiveShadow = true;
  worldGroup.add(foyerRug);

  // Grand Brass Chandelier
  const chandelier = new THREE.Group();
  chandelier.position.set(0, 4.25, 35.0);
  const chanChain = new THREE.Mesh(track(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8)), brassMat);
  chanChain.position.y = 0.45;
  chandelier.add(chanChain);
  const chanWheel = new THREE.Mesh(track(new THREE.TorusGeometry(0.95, 0.05, 8, 20)), brassMat);
  chanWheel.rotation.x = Math.PI / 2;
  chandelier.add(chanWheel);
  const bulbGlowMat = track(new THREE.MeshBasicMaterial({ color: 0xffe8b0 }));
  for (let b = 0; b < 6; b++) {
    const ang = (b / 6) * Math.PI * 2;
    const candle = new THREE.Mesh(track(new THREE.SphereGeometry(0.09, 8, 8)), bulbGlowMat);
    candle.position.set(Math.cos(ang) * 0.95, 0.14, Math.sin(ang) * 0.95);
    chandelier.add(candle);
  }
  worldGroup.add(chandelier);

  // Solid Victorian Staircase Steps + Balustrades aligned with foyer-stairs-steps [-1.38..1.38, 26.15..29.75]
  for (let s = 0; s < 8; s++) {
    const stepMesh = new THREE.Mesh(
      track(new THREE.BoxGeometry(2.65, 0.24 * (s + 1), 0.44)),
      darkWoodMat
    );
    stepMesh.position.set(0, 0.12 * (s + 1), 29.5 - s * 0.44);
    worldGroup.add(stepMesh);
  }
  for (const side of [-1.26, 1.26]) {
    const railPost = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 1.15, 0.16)), brassMat);
    railPost.position.set(side, 0.58, 29.55);
    worldGroup.add(railPost);
  }

  // Ancestor Oil Portrait of Victor Malakor + Unobstructed Golden "1894" Plaque ABOVE the 1.92m Top Stair!
  const portraitMat = track(
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: portraitTex, roughness: 0.62 })
  );
  const victorPortraitMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: portraitTex,
      roughness: 0.44,
      metalness: 0.06,
    })
  );

  // Seamless async upgrade to high-resolution photorealistic PBR & Rembrandt Oil textures
  const texLoader = new THREE.TextureLoader();
  const oakPhotoTex = track(
    texLoader.load(oakPlanksUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 6);
      tex.anisotropy = maxAnisotropy;
      floorMaterials.wood.color.setHex(0xdcc7b0);
      floorMaterials.wood.map = tex;
      floorMaterials.wood.needsUpdate = true;
    })
  );
  void oakPhotoTex;

  const stonePhotoTex = track(
    texLoader.load(stoneMasonryUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 3);
      tex.anisotropy = maxAnisotropy;
      floorMaterials.stone.color.setHex(0xb9b2a8);
      floorMaterials.stone.map = tex;
      floorMaterials.stone.needsUpdate = true;
      floorMaterials.crypt.color.setHex(0x8b837c);
      floorMaterials.crypt.map = tex;
      floorMaterials.crypt.needsUpdate = true;
      wallMaterials.marble.color.setHex(0xcfc8be);
      wallMaterials.marble.map = tex;
      wallMaterials.marble.needsUpdate = true;
      wallMaterials.crypt.color.setHex(0x857d76);
      wallMaterials.crypt.map = tex;
      wallMaterials.crypt.needsUpdate = true;
    })
  );
  void stonePhotoTex;

  const victorOilTex = track(
    texLoader.load(victorPortraitUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.anisotropy = maxAnisotropy;
      victorPortraitMat.map = tex;
      victorPortraitMat.needsUpdate = true;
    })
  );
  void victorOilTex;
  const mainPortraitFrame = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.68, 2.16, 0.12)),
    brassMat
  );
  mainPortraitFrame.position.set(0, 3.24, 26.3);
  worldGroup.add(mainPortraitFrame);
  const mainPortraitCanvas = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.46, 1.94)),
    victorPortraitMat
  );
  mainPortraitCanvas.position.set(0, 3.24, 26.37);
  worldGroup.add(mainPortraitCanvas);

  // Brass Gallery Picture Lamp illuminating Victor's Portrait & Foundation Plaque
  const picLampBar = new THREE.Mesh(track(new THREE.CylinderGeometry(0.035, 0.035, 0.92, 10)), brassMat);
  picLampBar.rotation.z = Math.PI / 2;
  picLampBar.position.set(0, 4.38, 26.52);
  worldGroup.add(picLampBar);
  const picLampGlow = new THREE.Mesh(track(new THREE.BoxGeometry(0.84, 0.04, 0.08)), bulbGlowMat);
  picLampGlow.position.set(0, 4.34, 26.52);
  worldGroup.add(picLampGlow);

  // 1A. Large Engraved Brass Foundation Plaque ("1894") beneath Victor's Portrait (2.16m x 0.56m)
  const plaqueTex = track(
    makeCanvasTex(1024, 288, (ctx, w, h) => {
      ctx.fillStyle = '#1f1205';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, w - 48, h - 48);
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 42px Cairo, serif';
      ctx.textAlign = 'center';
      ctx.fillText('تأسست قلعة آل مالاكور عام', w / 2, 82);
      ctx.fillStyle = '#fffbeb';
      ctx.font = 'bold 116px monospace';
      ctx.fillText('1 8 9 4', w / 2, 212);
    })
  );
  const portraitPlaqueMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: plaqueTex,
      emissive: 0xd97706,
      emissiveIntensity: 0.04,
      roughness: 0.28,
      metalness: 0.22,
    })
  );
  const portraitPlaqueFrame = new THREE.Mesh(
    track(new THREE.BoxGeometry(2.22, 0.62, 0.08)),
    brassMat
  );
  portraitPlaqueFrame.position.set(0, 2.15, 26.58);
  worldGroup.add(portraitPlaqueFrame);
  const portraitPlaqueFace = new THREE.Mesh(
    track(new THREE.PlaneGeometry(2.12, 0.54)),
    portraitPlaqueMat
  );
  portraitPlaqueFace.position.set(0, 2.15, 26.63);
  worldGroup.add(portraitPlaqueFace);

  // 1B. Unmissable Eye-Level Brass Heraldic Lectern right at the foot of the Grand Staircase (0, 29.88)
  // Mark walks right up to z = 30.5 (0.6m away!) and shines his flashlight directly onto huge "1894" digits!
  const lecternTex = track(
    makeCanvasTex(1024, 384, (ctx, w, h) => {
      ctx.fillStyle = '#190e04';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 12;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.strokeRect(28, 28, w - 56, h - 56);
      ctx.fillStyle = '#fcd34d';
      ctx.font = 'bold 44px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('نقش تأسيس القلعة الملعونة', w / 2, 88);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 142px monospace';
      ctx.fillText('1894', w / 2, 238);
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 34px Cairo, sans-serif';
      ctx.fillText('افحص النقش عن قرب [E]', w / 2, 328);
    })
  );
  const foyerLectern = new THREE.Group();
  foyerLectern.position.set(0, 0, 29.88);
  const lecternPillar = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.11, 0.18, 1.24, 12)),
    brassMat
  );
  lecternPillar.position.y = 0.62;
  foyerLectern.add(lecternPillar);
  const lecternBoardGroup = new THREE.Group();
  lecternBoardGroup.position.set(0, 1.32, 0.08);
  lecternBoardGroup.rotation.x = -0.24;
  const lecternBack = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.32, 0.52, 0.06)),
    brassMat
  );
  lecternBoardGroup.add(lecternBack);
  const lecternFace = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.24, 0.46)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: lecternTex,
        emissive: 0xd97706,
        emissiveIntensity: 0.045,
        roughness: 0.26,
        metalness: 0.18,
      })
    )
  );
  lecternFace.position.z = 0.035;
  lecternBoardGroup.add(lecternFace);
  foyerLectern.add(lecternBoardGroup);
  // Subtle warm candle flame atop the lectern corner so Mark spots it in the dark Foyer!
  const lecternCandle = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.025, 0.03, 0.14, 8)),
    track(new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 }))
  );
  lecternCandle.position.set(-0.56, 1.62, 0.02);
  foyerLectern.add(lecternCandle);
  const lecternFlame = new THREE.Mesh(
    track(new THREE.ConeGeometry(0.032, 0.095, 8)),
    bulbGlowMat
  );
  lecternFlame.position.set(-0.56, 1.72, 0.02);
  foyerLectern.add(lecternFlame);
  worldGroup.add(foyerLectern);

  // Chest of drawers with glowing red digital clock (2.8, 33.8)
  const foyerChest = new THREE.Mesh(track(new THREE.BoxGeometry(1.2, 0.92, 0.65)), darkWoodMat);
  foyerChest.position.set(2.8, 0.46, 33.8);
  worldGroup.add(foyerChest);
  const digClock = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.24, 0.11, 0.12)),
    track(new THREE.MeshBasicMaterial({ color: 0xef4444 }))
  );
  digClock.position.set(3.15, 0.98, 33.75);
  worldGroup.add(digClock);

  // Grandfather Tall Clock at (8.6, 29.5)
  const tallClockGroup = new THREE.Group();
  tallClockGroup.position.set(8.65, 0, 29.5);
  tallClockGroup.rotation.y = -Math.PI / 2;
  const clockCase = new THREE.Mesh(track(new THREE.BoxGeometry(0.95, 2.75, 0.55)), darkWoodMat);
  clockCase.position.y = 1.375;
  tallClockGroup.add(clockCase);
  const clockDial = new THREE.Mesh(
    track(new THREE.CircleGeometry(0.32, 16)),
    track(new THREE.MeshBasicMaterial({ color: 0xfef3c7 }))
  );
  clockDial.position.set(0, 2.22, 0.29);
  tallClockGroup.add(clockDial);
  const clockPendulum = new THREE.Group();
  clockPendulum.position.set(0, 1.65, 0.29);
  const pendRod = new THREE.Mesh(track(new THREE.CylinderGeometry(0.015, 0.015, 0.72, 6)), brassMat);
  pendRod.position.y = -0.36;
  clockPendulum.add(pendRod);
  const pendBob = new THREE.Mesh(track(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 12)), brassMat);
  pendBob.rotation.x = Math.PI / 2;
  pendBob.position.y = -0.72;
  clockPendulum.add(pendBob);
  tallClockGroup.add(clockPendulum);
  worldGroup.add(tallClockGroup);

  // --- ROOM 2: WEST ARCHED STEAM GALLERY ---
  // Overhead vaulted ceiling ribs spanning cleanly above head height (y = 3.2..4.55) + flush wall pilasters!
  for (const ax of [-16, -22, -28]) {
    const ceilingArchBeam = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.45, 0.42, 19.2)),
      wallMaterials.plaster
    );
    ceilingArchBeam.position.set(ax, 4.35, 24.0);
    worldGroup.add(ceilingArchBeam);

    for (const wz of [14.48, 33.52]) {
      const pilaster = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.52, 4.5, 0.36)),
        wallMaterials.plaster
      );
      pilaster.position.set(ax, 2.25, wz);
      worldGroup.add(pilaster);
    }
  }
  for (let v = 0; v < 5; v++) {
    const vz = 18.0 + v * 1.9;
    const pipe = new THREE.Mesh(track(new THREE.CylinderGeometry(0.09, 0.09, 4.5, 10)), ironMat);
    pipe.position.set(-31.25, 2.25, vz);
    worldGroup.add(pipe);

    const wheel = new THREE.Mesh(track(new THREE.TorusGeometry(0.22, 0.035, 8, 14)), redValveMat);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(-30.95, 1.45, vz);
    worldGroup.add(wheel);

    // Engraved Brass PSI Rating Tag mounted right above each valve wheel!
    const valveInfo = STEAM_VALVES[v];
    if (valveInfo) {
      const psiStr = `${valveInfo.psi > 0 ? '+' : ''}${valveInfo.psi} PSI`;
      const tagTex = track(
        makeCanvasTex(256, 96, (ctx, w, h) => {
          ctx.fillStyle = '#241407';
          ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 6;
          ctx.strokeRect(5, 5, w - 10, h - 10);
          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 22px Cairo, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`صمام ${v + 1}`, w / 2, 34);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 34px monospace';
          ctx.fillText(psiStr, w / 2, 76);
        })
      );
      const tagPlane = new THREE.Mesh(
        track(new THREE.PlaneGeometry(0.54, 0.21)),
        track(
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: tagTex,
            emissive: 0xb45309,
            emissiveIntensity: 0.16,
            roughness: 0.3,
          })
        )
      );
      tagPlane.rotation.y = Math.PI / 2;
      tagPlane.position.set(-30.89, 1.84, vz);
      worldGroup.add(tagPlane);
    }
  }
  // Eye-Level Front-Facing Steam Boiler Engineering Safety Plaque ("3 صمامات = 80 PSI") at (-30.92, 1.72, 24.8)
  const steamPlaqueTex = track(
    makeCanvasTex(1024, 420, (ctx, w, h) => {
      ctx.fillStyle = '#211106';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 48px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('لوحة أمان المرجل البخاري', w / 2, 92);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 74px Cairo, monospace';
      ctx.fillText('3 صمامات فقط = 80 PSI', w / 2, 224);
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 36px Cairo, sans-serif';
      ctx.fillText('القيم: (+35) · (+30) · (+25) · (-15) · (+20)', w / 2, 340);
    })
  );
  const steamFrame = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 0.84, 1.88)), brassMat);
  steamFrame.position.set(-31.02, 1.72, 24.8);
  worldGroup.add(steamFrame);
  const steamPlaqueFace = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.78, 0.74)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: steamPlaqueTex,
        emissive: 0xb45309,
        emissiveIntensity: 0.18,
        roughness: 0.32,
      })
    )
  );
  steamPlaqueFace.rotation.y = Math.PI / 2;
  steamPlaqueFace.position.set(-30.96, 1.72, 24.8);
  worldGroup.add(steamPlaqueFace);

  const radiator = new THREE.Mesh(track(new THREE.BoxGeometry(2.2, 0.85, 0.35)), ironMat);
  radiator.position.set(-20.0, 0.425, 33.35);
  worldGroup.add(radiator);

  // --- ROOM 3: SURVEILLANCE BUNKER ---
  const crtMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: crtTex,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.42,
      roughness: 0.3,
    })
  );
  const bunkerDesk = new THREE.Mesh(track(new THREE.BoxGeometry(1.4, 0.85, 3.8)), ironMat);
  bunkerDesk.position.set(-32.65, 0.425, -3.5);
  worldGroup.add(bunkerDesk);
  for (let m = 0; m < 4; m++) {
    const crtBox = new THREE.Mesh(track(new THREE.BoxGeometry(0.68, 0.56, 0.68)), ironMat);
    crtBox.position.set(-32.6, 1.16 + (m % 2) * 0.62, -4.6 + Math.floor(m / 2) * 1.45);
    worldGroup.add(crtBox);

    const screen = new THREE.Mesh(track(new THREE.PlaneGeometry(0.54, 0.42)), crtMat);
    screen.rotation.y = Math.PI / 2;
    screen.position.set(-32.24, 1.16 + (m % 2) * 0.62, -4.6 + Math.floor(m / 2) * 1.45);
    worldGroup.add(screen);
  }
  const patrolBoardTex = track(
    makeCanvasTex(1024, 576, (ctx, w, h) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 54px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('جدول مناوبة الحراسة الليلية', w / 2, 104);
      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 48px Cairo, sans-serif';
      ctx.fillText('١- الرواق المقنطر   ←   ٢- المصحة الشرقية', w / 2, 248);
      ctx.fillText('٣- البهو الملكي     ←   ٤- قاعة التماثيل', w / 2, 368);
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 36px Cairo, sans-serif';
      ctx.fillText('اضبط الشاشات الأربع بهذا الترتيب لفتح الجناح الشرقي', w / 2, 492);
    })
  );
  const patrolBoardMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: patrolBoardTex,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.1,
      roughness: 0.35,
    })
  );
  const whiteboardMat = track(
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.45 })
  );
  for (let wb = 0; wb < 2; wb++) {
    const boardBack = new THREE.Mesh(
      track(new THREE.BoxGeometry(2.35, 1.38, 0.08)),
      ironMat
    );
    boardBack.position.set(-26.5 + wb * 3.1, 1.76, -9.58);
    worldGroup.add(boardBack);
    const boardFace = new THREE.Mesh(
      track(new THREE.PlaneGeometry(2.24, 1.28)),
      wb === 0 ? patrolBoardMat : whiteboardMat
    );
    boardFace.position.set(-26.5 + wb * 3.1, 1.76, -9.52);
    worldGroup.add(boardFace);
  }
  const hvacDuct = new THREE.Mesh(track(new THREE.BoxGeometry(0.85, 0.55, 21.0)), ironMat);
  hvacDuct.position.set(-22.0, 4.05, 2.0);
  worldGroup.add(hvacDuct);

  // --- ROOM 4: HAUNTED PORTRAIT HALLWAY ---
  const hallRug = new THREE.Mesh(track(new THREE.PlaneGeometry(2.8, 22.0)), rugMat);
  hallRug.rotation.x = -Math.PI / 2;
  hallRug.position.set(17.5, 0.02, 22.0);
  worldGroup.add(hallRug);

  for (let pz = 20; pz <= 32; pz += 6) {
    for (const side of [-1, 1]) {
      const frame = new THREE.Mesh(track(new THREE.BoxGeometry(0.1, 1.45, 1.1)), brassMat);
      frame.position.set(side < 0 ? 10.42 : 23.58, 2.45, pz);
      worldGroup.add(frame);
      const art = new THREE.Mesh(track(new THREE.PlaneGeometry(0.95, 1.28)), portraitMat);
      art.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      art.position.set(side < 0 ? 10.49 : 23.51, 2.45, pz);
      worldGroup.add(art);
    }
  }

  // --- ROOM 5: CURSED ALCHEMICAL INFIRMARY ---
  const redCurtainMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.42,
      roughness: 0.7,
    })
  );
  const crimsonWindow = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 2.4, 3.2)), redCurtainMat);
  crimsonWindow.position.set(35.55, 2.3, -2.5);
  worldGroup.add(crimsonWindow);

  const surgicalCart = new THREE.Group();
  surgicalCart.position.set(32.0, 0, -6.5);
  const cartBody = new THREE.Mesh(track(new THREE.BoxGeometry(1.06, 0.92, 1.66)), ironMat);
  cartBody.position.y = 0.46;
  surgicalCart.add(cartBody);
  const vialHexes = [0x38bdf8, 0xef4444, 0xfacc15, 0xe2e8f0, 0xa855f7];
  for (let v = 0; v < 5; v++) {
    const vial = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.06, 0.075, 0.28, 10)),
      track(
        new THREE.MeshStandardMaterial({
          color: vialHexes[v],
          emissive: vialHexes[v],
          emissiveIntensity: 0.45,
          roughness: 0.2,
        })
      )
    );
    vial.position.set(v % 2 === 0 ? -0.2 : 0.2, 1.08, -0.56 + v * 0.28);
    surgicalCart.add(vial);
  }
  worldGroup.add(surgicalCart);
  void ELIXIR_VIALS;

  // Eye-Level Front-Facing Infirmary Alchemical Slate Board ("3 قوارير = 19 مل") on East Wall
  const elixirSlateTex = track(
    makeCanvasTex(1024, 448, (ctx, w, h) => {
      ctx.fillStyle = '#09111f';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 46px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('لوح معادلة طبيب القصر', w / 2, 92);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 76px Cairo, monospace';
      ctx.fillText('3 قوارير كيميائية = 19 مل', w / 2, 226);
      ctx.fillStyle = '#bae6fd';
      ctx.font = 'bold 34px Cairo, sans-serif';
      ctx.fillText('الأحجام: زئبق (9) · قرمزي (8) · كبريت (6) · فضة (4) · أثير (3)', w / 2, 352);
    })
  );
  const elixirFrame = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 0.88, 1.92)), ironMat);
  elixirFrame.position.set(35.42, 1.72, -6.5);
  worldGroup.add(elixirFrame);
  const elixirSlateFace = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.82, 0.78)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: elixirSlateTex,
        emissive: 0x0284c7,
        emissiveIntensity: 0.16,
        roughness: 0.34,
      })
    )
  );
  elixirSlateFace.rotation.y = -Math.PI / 2;
  elixirSlateFace.position.set(35.36, 1.72, -6.5);
  worldGroup.add(elixirSlateFace);

  // --- ROOM 6: HALL OF SIX VEILED STATUES (Exact sync with getSixStatuePositions!) ---
  const statueBowlFlames: THREE.Mesh[] = [];
  const statueCoords = getSixStatuePositions();
  for (let i = 0; i < statueCoords.length; i++) {
    const sc = statueCoords[i];
    const { root: sRoot, emberMat } = buildStatueWatcherRig();
    emberMat.color.setHex(0xfbbf24);
    sRoot.position.set(sc.x, 0, sc.z);
    sRoot.rotation.y = sc.rotY;
    worldGroup.add(sRoot);

    // Engraved Brass Nameplate (#1..#6) on each Statue's Pedestal
    const stInfo = VEILED_STATUES[i];
    if (stInfo) {
      const stLabelTex = track(
        makeCanvasTex(512, 160, (ctx, w, h) => {
          ctx.fillStyle = '#241407';
          ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 8;
          ctx.strokeRect(6, 6, w - 12, h - 12);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 44px Cairo, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`#${stInfo.num} · ${stInfo.nameAr}`, w / 2, 100);
        })
      );
      const stPlate = new THREE.Mesh(
        track(new THREE.PlaneGeometry(0.84, 0.26)),
        track(
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: stLabelTex,
            emissive: 0xb45309,
            emissiveIntensity: 0.18,
            roughness: 0.32,
          })
        )
      );
      stPlate.position.set(0, 0.52, 0.5);
      stPlate.rotation.x = -0.2;
      sRoot.add(stPlate);
    }

    const flame = new THREE.Mesh(
      track(new THREE.ConeGeometry(0.11, 0.28, 8)),
      track(new THREE.MeshBasicMaterial({ color: 0xf59e0b }))
    );
    flame.position.set(0, 1.44, 0.36);
    flame.visible = false;
    sRoot.add(flame);
    statueBowlFlames.push(flame);
  }

  // Eye-Level Front-Facing Carved Marble Oath Tablet on East Wall of Statue Hall
  const oathTabletTex = track(
    makeCanvasTex(1024, 480, (ctx, w, h) => {
      ctx.fillStyle = '#171412';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 48px Cairo, serif';
      ctx.textAlign = 'center';
      ctx.fillText('عهد الحراس المقنّعين الأربعة', w / 2, 98);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px Cairo, serif';
      ctx.fillText('١: الديون   ←   ٢: الميراث', w / 2, 236);
      ctx.fillText('٣: الصمت    ←   ٤: الضريح', w / 2, 348);
    })
  );
  const oathFrame = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.09, 0.94, 1.92)),
    wallMaterials.marble
  );
  oathFrame.position.set(13.48, 1.72, -2.0);
  worldGroup.add(oathFrame);
  const oathFace = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.82, 0.84)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: oathTabletTex,
        emissive: 0x78350f,
        emissiveIntensity: 0.16,
        roughness: 0.38,
      })
    )
  );
  oathFace.rotation.y = -Math.PI / 2;
  oathFace.position.set(13.42, 1.72, -2.0);
  worldGroup.add(oathFace);

  // --- ROOM 7: GRANDFATHER'S TROPHY STUDY ---
  const trophyGroup = new THREE.Group();
  trophyGroup.position.set(-15.0, 2.85, -41.52);
  const plaque = new THREE.Mesh(track(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 12)), darkWoodMat);
  plaque.rotation.x = Math.PI / 2;
  trophyGroup.add(plaque);
  const boneMat = track(new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.65 }));
  const skullTrophy = new THREE.Mesh(track(new THREE.ConeGeometry(0.28, 0.62, 8)), boneMat);
  skullTrophy.rotation.x = Math.PI * 0.85;
  skullTrophy.position.set(0, -0.05, 0.22);
  trophyGroup.add(skullTrophy);
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(track(new THREE.ConeGeometry(0.07, 0.78, 8)), ironMat);
    horn.position.set(side * 0.36, 0.28, 0.2);
    horn.rotation.z = side * -0.68;
    horn.rotation.x = 0.25;
    trophyGroup.add(horn);
  }
  worldGroup.add(trophyGroup);

  const royalSafe = new THREE.Mesh(track(new THREE.BoxGeometry(1.7, 2.1, 1.2)), ironMat);
  royalSafe.position.set(-22.5, 1.05, -38.5);
  worldGroup.add(royalSafe);
  const safeDial = new THREE.Mesh(track(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 16)), brassMat);
  safeDial.rotation.x = Math.PI / 2;
  safeDial.position.set(-22.5, 1.15, -37.86);
  worldGroup.add(safeDial);

  // Eye-Level Front-Facing Brass Optical Mirror Schematic Plaque next to Royal Safe
  const safeDiagramTex = track(
    makeCanvasTex(1024, 420, (ctx, w, h) => {
      ctx.fillStyle = '#211306';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 46px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('مخطط الخزنة البصرية للسرداب', w / 2, 92);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px Cairo, monospace';
      ctx.fillText('أعلى اليسار ▶ [ ╱ · ╲ ] ▶ أسفل اليمين', w / 2, 224);
      ctx.fillStyle = '#fcd34d';
      ctx.font = 'bold 34px Cairo, sans-serif';
      ctx.fillText('أدر المرايا لعكس الشعاع نحو قفل السرداب', w / 2, 336);
    })
  );
  const safeFrame = new THREE.Mesh(track(new THREE.BoxGeometry(1.82, 0.82, 0.08)), brassMat);
  safeFrame.position.set(-18.2, 1.72, -41.46);
  worldGroup.add(safeFrame);
  const safeFace = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.72, 0.72)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: safeDiagramTex,
        emissive: 0xb45309,
        emissiveIntensity: 0.18,
        roughness: 0.32,
      })
    )
  );
  safeFace.position.set(-18.2, 1.72, -41.4);
  worldGroup.add(safeFace);

  const bedchamberScoreTex = track(
    makeCanvasTex(1024, 360, (ctx, w, h) => {
      ctx.fillStyle = '#17110b';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#d6a84f';
      ctx.lineWidth = 12;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.fillStyle = '#f5d78e';
      ctx.font = 'bold 54px Cairo, serif';
      ctx.textAlign = 'center';
      ctx.fillText('نوتة فيكتور الأخيرة', w / 2, 95);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 76px Cairo, serif';
      ctx.fillText('٣  ←  ١  ←  ٤  ←  ٢', w / 2, 214);
      ctx.fillStyle = '#d6a84f';
      ctx.font = 'bold 36px Cairo, serif';
      ctx.fillText('رتّب الأجراس من اليسار إلى اليمين', w / 2, 296);
    })
  );
  const bedchamberFrame = new THREE.Mesh(track(new THREE.BoxGeometry(1.82, 0.74, 0.08)), brassMat);
  bedchamberFrame.position.set(-47.48, 1.72, -31.5);
  bedchamberFrame.rotation.y = Math.PI / 2;
  worldGroup.add(bedchamberFrame);
  const bedchamberFace = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.72, 0.64)),
    track(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: bedchamberScoreTex,
      emissive: 0x78350f,
      emissiveIntensity: 0.22,
      roughness: 0.34,
    }))
  );
  bedchamberFace.position.set(-47.41, 1.72, -31.5);
  bedchamberFace.rotation.y = Math.PI / 2;
  worldGroup.add(bedchamberFace);

  const tombSealTex = track(
    makeCanvasTex(1024, 360, (ctx, w, h) => {
      ctx.fillStyle = '#090a12';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 12;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.fillStyle = '#c4b5fd';
      ctx.font = 'bold 52px Cairo, serif';
      ctx.textAlign = 'center';
      ctx.fillText('الختم الرخامي الأخير', w / 2, 94);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 68px Cairo, serif';
      ctx.fillText('الغراب  ·  التاج  ·  اللهب', w / 2, 214);
      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 34px Cairo, serif';
      ctx.fillText('من اليسار إلى اليمين — احذر الهلال الزائف', w / 2, 296);
    })
  );
  const cryptSealFrame = new THREE.Mesh(track(new THREE.BoxGeometry(1.9, 0.74, 0.08)), brassMat);
  cryptSealFrame.position.set(25.35, 1.72, -28.5);
  cryptSealFrame.rotation.y = -Math.PI / 2;
  worldGroup.add(cryptSealFrame);
  const cryptSealFace = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.8, 0.64)),
    track(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tombSealTex,
      emissive: 0x312e81,
      emissiveIntensity: 0.26,
      roughness: 0.3,
    }))
  );
  cryptSealFace.position.set(25.28, 1.72, -28.5);
  cryptSealFace.rotation.y = -Math.PI / 2;
  worldGroup.add(cryptSealFace);

  // --- ROOM 8: GRANDFATHER'S CRYPT, DEED ALTAR & SARCOPHAGUS ---
  const deedPedestal = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.55, 0.72, 1.12, 12)),
    wallMaterials.crypt
  );
  deedPedestal.position.set(DEED_ALTAR_POS.x, 0.56, DEED_ALTAR_POS.z);
  worldGroup.add(deedPedestal);

  const deedVisual = new THREE.Group();
  deedVisual.position.set(DEED_ALTAR_POS.x, 1.24, DEED_ALTAR_POS.z);
  const deedScroll = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.56, 0.04, 0.72)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.75,
        roughness: 0.55,
      })
    )
  );
  deedVisual.add(deedScroll);
  const deedSeal = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 12)),
    redValveMat
  );
  deedSeal.position.set(0.1, 0.03, 0.16);
  deedVisual.add(deedSeal);
  const exitKeyRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.1, 0.025, 8, 14)), brassMat);
  exitKeyRing.rotation.x = Math.PI / 2;
  exitKeyRing.position.set(-0.18, 0.04, -0.12);
  deedVisual.add(exitKeyRing);
  deedVisual.visible = false;
  worldGroup.add(deedVisual);

  const sarcophagusBase = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.85, 1.15, 3.15)),
    boneMat
  );
  sarcophagusBase.position.set(SARCOPHAGUS_POS.x, 0.575, SARCOPHAGUS_POS.z);
  worldGroup.add(sarcophagusBase);

  const sarcophagusInterior = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.4, 0.15, 2.75)),
    track(new THREE.MeshBasicMaterial({ color: 0x090507 }))
  );
  sarcophagusInterior.position.set(SARCOPHAGUS_POS.x, 1.12, SARCOPHAGUS_POS.z);
  worldGroup.add(sarcophagusInterior);

  const sarcophagusLid = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.9, 0.24, 3.2)),
    boneMat
  );
  sarcophagusLid.position.set(SARCOPHAGUS_POS.x, 1.27, SARCOPHAGUS_POS.z);
  worldGroup.add(sarcophagusLid);

  const sarcophagusMistMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    })
  );
  const sarcophagusMist = new THREE.Mesh(
    track(new THREE.CylinderGeometry(1.1, 1.6, 2.8, 14)),
    sarcophagusMistMat
  );
  sarcophagusMist.position.set(SARCOPHAGUS_POS.x, 1.5, SARCOPHAGUS_POS.z);
  worldGroup.add(sarcophagusMist);

  // --- ROOM 9: ABANDONED GOTHIC LIBRARY [-32..-10, 34..50] ---
  const libRug = new THREE.Mesh(track(new THREE.PlaneGeometry(9.5, 11.0)), rugMat);
  libRug.rotation.x = -Math.PI / 2;
  libRug.position.set(-21.2, 0.02, 42.0);
  worldGroup.add(libRug);

  const bookRowColors = [0x7f1d1d, 0x14532d, 0x1e3a8a, 0x78350f, 0x4c1d95];
  const bookMats = bookRowColors.map((hex) =>
    track(new THREE.MeshStandardMaterial({ color: hex, roughness: 0.72 }))
  );
  for (const shelfX of [-24.4, -18.0]) {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(shelfX, 0, 41.85);
    const frame = new THREE.Mesh(track(new THREE.BoxGeometry(1.48, 3.55, 6.6)), darkWoodMat);
    frame.position.y = 1.775;
    shelfGroup.add(frame);
    const crown = new THREE.Mesh(track(new THREE.BoxGeometry(1.66, 0.18, 6.78)), darkWoodMat);
    crown.position.y = 3.62;
    shelfGroup.add(crown);
    for (let row = 0; row < 4; row++) {
      const books = new THREE.Mesh(
        track(new THREE.BoxGeometry(1.54, 0.44, 6.1)),
        bookMats[(row + (shelfX < -20 ? 0 : 2)) % bookMats.length]
      );
      books.position.set(0, 0.65 + row * 0.78, 0);
      shelfGroup.add(books);
    }
    worldGroup.add(shelfGroup);
  }

  const libDesk = new THREE.Group();
  libDesk.position.set(-27.5, 0, 36.7);
  const libDeskBase = new THREE.Mesh(track(new THREE.BoxGeometry(2.1, 0.92, 1.65)), darkWoodMat);
  libDeskBase.position.y = 0.46;
  libDesk.add(libDeskBase);
  const lampStand = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.12, 0.34, 8)), brassMat);
  lampStand.position.set(-0.55, 1.08, 0);
  libDesk.add(lampStand);
  const lampShade = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.14, 0.22, 0.16, 10)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.9,
        roughness: 0.25,
      })
    )
  );
  lampShade.position.set(-0.55, 1.26, 0);
  libDesk.add(lampShade);
  worldGroup.add(libDesk);

  // --- ROOM 10: ROTTING BANQUET HALL [10..36, 36..50] ---
  const banqRug = new THREE.Mesh(track(new THREE.PlaneGeometry(13.5, 5.2)), rugMat);
  banqRug.rotation.x = -Math.PI / 2;
  banqRug.position.set(22.5, 0.02, 43.2);
  worldGroup.add(banqRug);

  const banqTableGroup = new THREE.Group();
  banqTableGroup.position.set(22.5, 0, 43.2);
  const tableTop = new THREE.Mesh(track(new THREE.BoxGeometry(9.9, 0.16, 1.92)), darkWoodMat);
  tableTop.position.y = 0.92;
  banqTableGroup.add(tableTop);
  for (const lx of [-4.2, 0, 4.2]) {
    const pedestal = new THREE.Mesh(track(new THREE.CylinderGeometry(0.28, 0.42, 0.88, 10)), darkWoodMat);
    pedestal.position.set(lx, 0.44, 0);
    banqTableGroup.add(pedestal);
    const candelabra = new THREE.Mesh(track(new THREE.CylinderGeometry(0.04, 0.14, 0.48, 8)), brassMat);
    candelabra.position.set(lx, 1.24, 0);
    banqTableGroup.add(candelabra);
    const flame = new THREE.Mesh(track(new THREE.SphereGeometry(0.08, 8, 8)), bulbGlowMat);
    flame.position.set(lx, 1.52, 0);
    banqTableGroup.add(flame);
  }
  worldGroup.add(banqTableGroup);

  const hearthGroup = new THREE.Group();
  hearthGroup.position.set(35.05, 0, 43.5);
  const hearthMantel = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.25, 3.3, 3.9)),
    wallMaterials.crypt
  );
  hearthMantel.position.y = 1.65;
  hearthGroup.add(hearthMantel);
  const hearthEmbers = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.45, 0.9, 2.1)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0xea580c,
        emissive: 0xdc2626,
        emissiveIntensity: 1.25,
        roughness: 0.6,
      })
    )
  );
  hearthEmbers.position.set(-0.48, 0.55, 0);
  hearthGroup.add(hearthEmbers);
  worldGroup.add(hearthGroup);

  // --- ROOM 11: CASTLE KITCHEN & WINE CELLAR [24..44, 16..36] ---
  const kitchenIsland = new THREE.Group();
  kitchenIsland.position.set(34.0, 0, 25.8);
  const butcherBlock = new THREE.Mesh(track(new THREE.BoxGeometry(4.3, 0.98, 1.9)), darkWoodMat);
  butcherBlock.position.y = 0.49;
  kitchenIsland.add(butcherBlock);
  const potRack = new THREE.Mesh(track(new THREE.BoxGeometry(3.8, 0.1, 1.2)), ironMat);
  potRack.position.y = 2.85;
  kitchenIsland.add(potRack);
  for (let p = -1; p <= 1; p++) {
    const pot = new THREE.Mesh(track(new THREE.CylinderGeometry(0.24, 0.2, 0.32, 10)), ironMat);
    pot.position.set(p * 1.1, 2.52, 0);
    kitchenIsland.add(pot);
  }
  worldGroup.add(kitchenIsland);

  for (let b = 0; b < 4; b++) {
    const barrel = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.56, 0.52, 1.35, 12)),
      darkWoodMat
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(28.7 + b * 2.5, 0.62, 17.15);
    worldGroup.add(barrel);

    const hoop = new THREE.Mesh(track(new THREE.TorusGeometry(0.55, 0.03, 6, 14)), ironMat);
    hoop.position.set(28.7 + b * 2.5, 0.62, 17.5);
    worldGroup.add(hoop);
  }

  // --- ROOM 12: FOGGY MOONLIT CONSERVATORY [-52..-32, 14..38] ---
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(-42.0, 0, 26.0);
  const basinOuter = new THREE.Mesh(
    track(new THREE.CylinderGeometry(1.38, 1.48, 0.72, 16)),
    wallMaterials.marble
  );
  basinOuter.position.y = 0.36;
  fountainGroup.add(basinOuter);
  const moonWater = new THREE.Mesh(
    track(new THREE.CircleGeometry(1.22, 16)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.75,
        roughness: 0.15,
      })
    )
  );
  moonWater.rotation.x = -Math.PI / 2;
  moonWater.position.y = 0.73;
  fountainGroup.add(moonWater);
  const fountainSpire = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.18, 0.32, 1.65, 10)),
    wallMaterials.marble
  );
  fountainSpire.position.y = 0.95;
  fountainGroup.add(fountainSpire);
  worldGroup.add(fountainGroup);

  for (const [tx, tz] of [
    [-47.5, 18.0],
    [-36.5, 34.5],
  ] as const) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, 0, tz);
    const trunk = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.24, 0.52, 3.6, 8)),
      darkWoodMat
    );
    trunk.position.y = 1.8;
    treeGroup.add(trunk);
    for (let br = 0; br < 4; br++) {
      const ang = (br / 4) * Math.PI * 2 + 0.4;
      const limb = new THREE.Mesh(
        track(new THREE.ConeGeometry(0.14, 1.9, 6)),
        darkWoodMat
      );
      limb.position.set(Math.cos(ang) * 0.55, 3.25, Math.sin(ang) * 0.55);
      limb.rotation.z = -Math.cos(ang) * 0.65;
      limb.rotation.x = Math.sin(ang) * 0.65;
      treeGroup.add(limb);
    }
    worldGroup.add(treeGroup);
  }

  // --- ROOM 13: FORGOTTEN DUNGEON CELLS [-52..-34, -14..10] ---
  for (const cellZ of [-2.9, 3.9]) {
    const cellHeader = new THREE.Mesh(track(new THREE.BoxGeometry(6.1, 0.28, 0.36)), ironMat);
    cellHeader.position.set(-48.6, 3.85, cellZ);
    worldGroup.add(cellHeader);
    for (let bx = -51.4; bx <= -45.7; bx += 0.58) {
      const bar = new THREE.Mesh(track(new THREE.CylinderGeometry(0.04, 0.04, 3.8, 6)), ironMat);
      bar.position.set(bx, 1.9, cellZ);
      worldGroup.add(bar);
    }
  }
  const dungeonRack = new THREE.Group();
  dungeonRack.position.set(-41.5, 0, -8.3);
  const rackFrame = new THREE.Mesh(track(new THREE.BoxGeometry(1.9, 0.92, 2.9)), darkWoodMat);
  rackFrame.position.y = 0.46;
  dungeonRack.add(rackFrame);
  const rackRoller = new THREE.Mesh(track(new THREE.CylinderGeometry(0.14, 0.14, 1.75, 8)), ironMat);
  rackRoller.rotation.z = Math.PI / 2;
  rackRoller.position.set(0, 1.02, -1.1);
  dungeonRack.add(rackRoller);
  worldGroup.add(dungeonRack);

  // --- ROOM 14: VICTOR'S MASTER BEDCHAMBER [-48..-28, -42..-18] ---
  const bedRug = new THREE.Mesh(track(new THREE.PlaneGeometry(8.5, 9.5)), rugMat);
  bedRug.rotation.x = -Math.PI / 2;
  bedRug.position.set(-39.5, 0.02, -32.5);
  worldGroup.add(bedRug);

  const canopyBed = new THREE.Group();
  canopyBed.position.set(-41.0, 0, -33.25);
  const bedBase = new THREE.Mesh(track(new THREE.BoxGeometry(4.8, 0.68, 4.3)), darkWoodMat);
  bedBase.position.y = 0.34;
  canopyBed.add(bedBase);
  const mattress = new THREE.Mesh(
    track(new THREE.BoxGeometry(4.5, 0.28, 4.0)),
    track(new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.85 }))
  );
  mattress.position.y = 0.82;
  canopyBed.add(mattress);
  const headboard = new THREE.Mesh(track(new THREE.BoxGeometry(0.32, 2.4, 4.4)), darkWoodMat);
  headboard.position.set(-2.25, 1.2, 0);
  canopyBed.add(headboard);
  for (const [px, pz] of [
    [-2.25, -2.05],
    [-2.25, 2.05],
    [2.25, -2.05],
    [2.25, 2.05],
  ] as const) {
    const post = new THREE.Mesh(track(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 8)), darkWoodMat);
    post.position.set(px, 1.6, pz);
    canopyBed.add(post);
  }
  const canopyRoof = new THREE.Mesh(track(new THREE.BoxGeometry(4.85, 0.18, 4.45)), darkWoodMat);
  canopyRoof.position.y = 3.22;
  canopyBed.add(canopyRoof);
  worldGroup.add(canopyBed);

  const vanityGroup = new THREE.Group();
  vanityGroup.position.set(-34.6, 0, -41.05);
  const vanityDesk = new THREE.Mesh(track(new THREE.BoxGeometry(3.0, 0.9, 0.95)), darkWoodMat);
  vanityDesk.position.y = 0.45;
  vanityGroup.add(vanityDesk);
  const vanityMirror = new THREE.Mesh(
    track(new THREE.BoxGeometry(1.6, 1.25, 0.1)),
    track(new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.18, metalness: 0.25 }))
  );
  vanityMirror.position.set(0, 1.55, -0.35);
  vanityGroup.add(vanityMirror);
  worldGroup.add(vanityGroup);

  // ==========================================================================
  // 6. Interactive Stations, Lore Notes, Wardrobes, Pickups & 8 Golden Relics!
  // ==========================================================================
  const shadowDiscGeo = track(new THREE.CircleGeometry(0.45, 14));
  const shadowDiscMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    })
  );

  const puzzleVisuals = new Map<string, { group: THREE.Group; beaconMat: THREE.MeshBasicMaterial }>();
  for (const pz of puzzles) {
    const g = new THREE.Group();
    g.position.set(pz.x, 0, pz.z);

    const podium = new THREE.Mesh(track(new THREE.CylinderGeometry(0.36, 0.44, 1.04, 10)), darkWoodMat);
    podium.position.y = 0.52;
    g.add(podium);

    const beaconMat = track(new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    const orb = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.16, 0)), beaconMat);
    orb.position.y = 1.28;
    g.add(orb);

    const disc = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.015;
    g.add(disc);

    const halo = new THREE.Mesh(track(new THREE.TorusGeometry(0.27, 0.014, 8, 28)), brassMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 1.29;
    g.add(halo);

    if (pz.id === 'bedroom_chime') {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const bell = new THREE.Mesh(
          track(new THREE.CylinderGeometry(0.045, 0.092, 0.18, 12)),
          brassMat
        );
        bell.position.set(Math.cos(angle) * 0.28, 1.18, Math.sin(angle) * 0.28);
        g.add(bell);
        const clapper = new THREE.Mesh(
          track(new THREE.SphereGeometry(0.035, 8, 6)),
          track(new THREE.MeshStandardMaterial({ color: 0xfcd34d, metalness: 0.76, roughness: 0.26 }))
        );
        clapper.position.set(Math.cos(angle) * 0.28, 1.055, Math.sin(angle) * 0.28);
        g.add(clapper);
      }
    } else if (pz.id === 'tomb_seal') {
      for (let i = 0; i < 3; i++) {
        const runeRing = new THREE.Mesh(
          track(new THREE.TorusGeometry(0.31 - i * 0.07, 0.018, 8, 28)),
          track(new THREE.MeshStandardMaterial({
            color: i === 1 ? 0xc4b5fd : 0x94a3b8,
            emissive: 0x312e81,
            emissiveIntensity: 0.38,
            metalness: 0.62,
            roughness: 0.34,
          }))
        );
        runeRing.rotation.x = Math.PI / 2;
        runeRing.rotation.z = i * 0.34;
        runeRing.position.y = 1.14 + i * 0.085;
        g.add(runeRing);
      }
    }

    worldGroup.add(g);
    puzzleVisuals.set(pz.id, { group: g, beaconMat });
  }

  const noteVisuals = new Map<string, THREE.Group>();
  const noteBeacons = new Map<string, THREE.Mesh>();
  const noteCandleWaxMat = track(
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.55 })
  );
  const noteFlameMat = track(new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
  for (const n of notes) {
    const ng = new THREE.Group();
    ng.position.set(n.x, 0, n.z);

    if (n.id !== 'note-1-clock') {
      const stand = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.32, 0.38, 0.9, 12)),
        darkWoodMat
      );
      stand.position.y = 0.45;
      ng.add(stand);

      const trim = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 12)),
        brassMat
      );
      trim.position.y = 0.91;
      ng.add(trim);
    }

    const page = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.42, 0.025, 0.52)),
      track(
        new THREE.MeshStandardMaterial({
          color: 0xfef3c7,
          emissive: 0xd97706,
          emissiveIntensity: 0.72,
          roughness: 0.62,
        })
      )
    );
    page.position.y = 0.95;
    page.rotation.y = 0.22;
    ng.add(page);

    // Crimson Wax Seal on Parchment
    const waxSeal = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 10)),
      redValveMat
    );
    waxSeal.position.set(0.08, 0.97, 0.12);
    ng.add(waxSeal);

    // Antique Brass Candle Holder + Warm Glowing Flame so notes stand out in dark corridors!
    const candleSaucer = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.09, 0.07, 0.03, 10)),
      brassMat
    );
    candleSaucer.position.set(-0.22, 0.95, -0.14);
    ng.add(candleSaucer);
    const candleStick = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.03, 0.035, 0.16, 8)),
      noteCandleWaxMat
    );
    candleStick.position.set(-0.22, 1.04, -0.14);
    ng.add(candleStick);
    const candleFlame = new THREE.Mesh(
      track(new THREE.ConeGeometry(0.032, 0.09, 8)),
      noteFlameMat
    );
    candleFlame.position.set(-0.22, 1.15, -0.14);
    ng.add(candleFlame);

    // Hovering Spinning Clue Beacon (disappears once Mark reads the note!)
    const beacon = new THREE.Mesh(
      track(new THREE.OctahedronGeometry(0.11, 0)),
      track(
        new THREE.MeshBasicMaterial({
          color: n.isOptionalLore ? 0xc084fc : 0xfde047,
        })
      )
    );
    beacon.position.y = 1.44;
    ng.add(beacon);
    noteBeacons.set(n.id, beacon);

    worldGroup.add(ng);
    noteVisuals.set(n.id, ng);
  }

  // 7 Wooden Hiding Wardrobes (flush against walls & backed by solid WallBox!)
  for (const hs of hidingSpots) {
    const wg = new THREE.Group();
    wg.position.set(hs.x, 0, hs.z);
    wg.rotation.y = hs.rotY;

    const body = new THREE.Mesh(track(new THREE.BoxGeometry(1.45, 2.55, 0.85)), darkWoodMat);
    body.position.y = 1.275;
    wg.add(body);

    const cornice = new THREE.Mesh(track(new THREE.BoxGeometry(1.58, 0.14, 0.95)), darkWoodMat);
    cornice.position.y = 2.6;
    wg.add(cornice);

    for (const side of [-1, 1]) {
      const knob = new THREE.Mesh(track(new THREE.SphereGeometry(0.04, 8, 8)), brassMat);
      knob.position.set(side * 0.12, 1.28, 0.45);
      wg.add(knob);
    }
    worldGroup.add(wg);
  }

  // Collectible Batteries, Sanity Tinctures & Adrenaline Syringes
  const pickupVisuals = new Map<string, THREE.Group>();
  for (const pk of pickups) {
    const pg = new THREE.Group();
    pg.position.set(pk.x, 0.32, pk.z);
    if (pk.kind === 'adrenaline') {
      const tube = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.06, 0.06, 0.36, 8)),
        track(
          new THREE.MeshStandardMaterial({
            color: 0xf43f5e,
            emissive: 0xe11d48,
            emissiveIntensity: 0.95,
            roughness: 0.25,
          })
        )
      );
      tube.rotation.z = 0.45;
      pg.add(tube);
      const plunger = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 8)),
        brassMat
      );
      plunger.position.set(-0.08, 0.16, 0);
      plunger.rotation.z = 0.45;
      pg.add(plunger);
    } else {
      const isBat = pk.kind === 'battery';
      const mesh = new THREE.Mesh(
        track(
          isBat
            ? new THREE.CylinderGeometry(0.11, 0.11, 0.34, 10)
            : new THREE.OctahedronGeometry(0.18, 0)
        ),
        track(
          new THREE.MeshStandardMaterial({
            color: isBat ? 0xfacc15 : 0x2dd4bf,
            emissive: isBat ? 0xca8a04 : 0x0d9488,
            emissiveIntensity: 0.85,
            roughness: 0.28,
          })
        )
      );
      pg.add(mesh);
    }
    worldGroup.add(pg);
    pickupVisuals.set(pk.id, pg);
  }

  // 8 Cursed Malakor Family Relics (Composite Pedestal Cushion + Ornate Golden Chalice/Crown Relic!)
  const relicVisuals = new Map<string, THREE.Group>();
  const relicGoldMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.72,
      roughness: 0.25,
      metalness: 0.25,
    })
  );
  const relicRubyMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
    })
  );
  for (const rel of relics) {
    const rg = new THREE.Group();
    rg.position.set(rel.x, 0.38, rel.z);

    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(0.18, 0.035, 8, 16)), relicGoldMat);
    ring.rotation.x = Math.PI / 3;
    rg.add(ring);

    const coreGem = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.12, 0)), relicRubyMat);
    rg.add(coreGem);

    worldGroup.add(rg);
    relicVisuals.set(rel.id, rg);
  }

  // ==========================================================================
  // 7. Light Fixture Meshes + 5-PointLight Dynamic Pool
  // ==========================================================================
  for (const fx of fixtures) {
    const fg = new THREE.Group();
    fg.position.set(fx.x, fx.y, fx.z);
    const bulbMat = track(new THREE.MeshBasicMaterial({ color: fx.colorHex }));
    if (fx.kind === 'cyan_tube' || fx.kind === 'bunker_tube') {
      const tube = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, 0.09, 2.2)), bulbMat);
      fg.add(tube);
    } else {
      const globe = new THREE.Mesh(track(new THREE.SphereGeometry(0.14, 10, 8)), bulbMat);
      fg.add(globe);
    }
    worldGroup.add(fg);
  }

  const fixturePoolLights: THREE.PointLight[] = [];
  for (let i = 0; i < 5; i++) {
    const pl = new THREE.PointLight(0xffcf87, 0.45, 7.2, 2.0);
    pl.castShadow = false;
    worldGroup.add(pl);
    fixturePoolLights.push(pl);
  }

  // Enable realistic shadow casting & receiving across castle walls, floors, doors & furniture
  worldGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
      obj.receiveShadow = true;
      // Floors/ceilings receive shadows; 3D walls, doors, statues, and furniture cast & receive shadows
      if (Math.abs(obj.rotation.x) < 1.2) {
        obj.castShadow = true;
      }
    }
  });

  return {
    worldGroup,
    doorVisuals,
    noteVisuals,
    noteBeacons,
    pickupVisuals,
    relicVisuals,
    puzzleVisuals,
    deedVisual,
    sarcophagusLid,
    sarcophagusMistMat,
    clockPendulum,
    statueBowlFlames,
    fixturePoolLights,
    fixtures,
    dispose() {
      for (const d of disposables) {
        d.dispose();
      }
    },
  };
}
