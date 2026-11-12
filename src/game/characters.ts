import * as THREE from 'three';

function makeQuatTrack(
  boneName: string,
  times: number[],
  eulers: [number, number, number][]
): THREE.QuaternionKeyframeTrack {
  const values: number[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (let i = 0; i < eulers.length; i++) {
    const [rx, ry, rz] = eulers[i];
    e.set(rx, ry, rz, 'XYZ');
    q.setFromEuler(e);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, values);
}

function makePosTrack(
  boneName: string,
  times: number[],
  positions: [number, number, number][]
): THREE.VectorKeyframeTrack {
  const values: number[] = [];
  for (let i = 0; i < positions.length; i++) {
    values.push(positions[i][0], positions[i][1], positions[i][2]);
  }
  return new THREE.VectorKeyframeTrack(`${boneName}.position`, times, values);
}

export interface GrandfatherHorrorRig {
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: {
    idle: THREE.AnimationAction;
    walk: THREE.AnimationAction;
    chase: THREE.AnimationAction;
    kill: THREE.AnimationAction;
  };
  activeClip: 'idle' | 'walk' | 'chase' | 'kill';
  eyeMats: THREE.MeshStandardMaterial[];
  auraLightMat: THREE.MeshBasicMaterial;
  setClip: (next: 'idle' | 'walk' | 'chase' | 'kill', timeScale?: number) => void;
  setFlash: (flashIntensity: number) => void;
}

/**
 * Builds the terrifying 2.15m tall Pale Gaunt Screaming Old Man Spirit
 * ("روح الجد فيكتور مالاكور") inspired directly by Reference Image 1.
 */
export function buildGrandfatherHorrorRig(): GrandfatherHorrorRig {
  const root = new THREE.Group();

  // Procedural micro-relief bump maps for corpse skin & tattered Victorian wool coat
  const skinBumpCanvas = document.createElement('canvas');
  skinBumpCanvas.width = 128;
  skinBumpCanvas.height = 128;
  const sbCtx = skinBumpCanvas.getContext('2d')!;
  sbCtx.fillStyle = '#808080';
  sbCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 95; i++) {
    const x = (i * 37) % 128;
    const y = (i * 61) % 128;
    sbCtx.strokeStyle = i % 2 === 0 ? 'rgba(40,40,40,0.45)' : 'rgba(215,215,215,0.35)';
    sbCtx.lineWidth = 1.4;
    sbCtx.beginPath();
    sbCtx.moveTo(x, y);
    sbCtx.quadraticCurveTo(x + 8, y + (i % 3 === 0 ? -6 : 6), x + 16, y + 3);
    sbCtx.stroke();
  }
  const skinBumpTex = new THREE.CanvasTexture(skinBumpCanvas);
  skinBumpTex.wrapS = THREE.RepeatWrapping;
  skinBumpTex.wrapT = THREE.RepeatWrapping;

  const clothBumpCanvas = document.createElement('canvas');
  clothBumpCanvas.width = 128;
  clothBumpCanvas.height = 128;
  const cbCtx = clothBumpCanvas.getContext('2d')!;
  cbCtx.fillStyle = '#787878';
  cbCtx.fillRect(0, 0, 128, 128);
  cbCtx.fillStyle = 'rgba(25,25,25,0.42)';
  for (let y = 0; y < 128; y += 4) cbCtx.fillRect(0, y, 128, 1);
  cbCtx.fillStyle = 'rgba(220,220,220,0.28)';
  for (let x = 0; x < 128; x += 4) cbCtx.fillRect(x, 0, 1, 128);
  const clothBumpTex = new THREE.CanvasTexture(clothBumpCanvas);
  clothBumpTex.wrapS = THREE.RepeatWrapping;
  clothBumpTex.wrapT = THREE.RepeatWrapping;
  clothBumpTex.repeat.set(3, 3);

  // Shared PBR horror materials
  const paleFleshMat = new THREE.MeshStandardMaterial({
    color: 0xcfc8be,
    bumpMap: skinBumpTex,
    bumpScale: 0.018,
    roughness: 0.72,
    metalness: 0.04,
  });
  const sunkenSocketMat = new THREE.MeshStandardMaterial({
    color: 0x0f0b12,
    roughness: 0.96,
    metalness: 0.0,
  });
  const darkVeinMat = new THREE.MeshStandardMaterial({
    color: 0x3f2e3e,
    bumpMap: skinBumpTex,
    bumpScale: 0.022,
    roughness: 0.82,
  });
  const coatMat = new THREE.MeshStandardMaterial({
    color: 0x15141a,
    bumpMap: clothBumpTex,
    bumpScale: 0.028,
    roughness: 0.86,
    metalness: 0.08,
  });
  const ragShirtMat = new THREE.MeshStandardMaterial({
    color: 0x3b3530,
    bumpMap: clothBumpTex,
    bumpScale: 0.022,
    roughness: 0.92,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0xd4d7dc,
    bumpMap: skinBumpTex,
    bumpScale: 0.015,
    roughness: 0.76,
    metalness: 0.06,
  });
  const toothMat = new THREE.MeshStandardMaterial({
    color: 0xcab58a,
    roughness: 0.42,
    metalness: 0.08,
  });
  const clawMat = new THREE.MeshStandardMaterial({
    color: 0x1c1516,
    roughness: 0.34,
    metalness: 0.35,
  });
  const chainMat = new THREE.MeshStandardMaterial({
    color: 0x71717a,
    roughness: 0.36,
    metalness: 0.85,
  });
  const tarnishedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xb47b2b,
    roughness: 0.35,
    metalness: 0.82,
  });

  const eyeMatL = new THREE.MeshStandardMaterial({
    color: 0xfffbeb,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });
  const eyeMatR = eyeMatL.clone();

  // 18-Bone Articulated Skeleton
  const pelvis = new THREE.Bone();
  pelvis.name = 'Pelvis';
  pelvis.position.set(0, 1.06, 0);

  const spineLower = new THREE.Bone();
  spineLower.name = 'SpineLower';
  spineLower.position.set(0, 0.24, 0.02);
  pelvis.add(spineLower);

  const spineUpper = new THREE.Bone();
  spineUpper.name = 'SpineUpper';
  spineUpper.position.set(0, 0.34, 0.06);
  spineLower.add(spineUpper);

  const neck = new THREE.Bone();
  neck.name = 'Neck';
  neck.position.set(0, 0.24, 0.06);
  spineUpper.add(neck);

  const head = new THREE.Bone();
  head.name = 'Head';
  head.position.set(0, 0.14, 0.04);
  neck.add(head);

  const jaw = new THREE.Bone();
  jaw.name = 'JawBone';
  jaw.position.set(0, -0.05, 0.06);
  head.add(jaw);

  const leftClav = new THREE.Bone();
  leftClav.name = 'LeftClav';
  leftClav.position.set(0.22, 0.22, 0.02);
  spineUpper.add(leftClav);

  const leftUpperArm = new THREE.Bone();
  leftUpperArm.name = 'LeftUpperArm';
  leftUpperArm.position.set(0.08, -0.04, 0);
  leftClav.add(leftUpperArm);

  const leftForearm = new THREE.Bone();
  leftForearm.name = 'LeftForearm';
  leftForearm.position.set(0.02, -0.42, 0.04);
  leftUpperArm.add(leftForearm);

  const leftHand = new THREE.Bone();
  leftHand.name = 'LeftHand';
  leftHand.position.set(0, -0.38, 0.03);
  leftForearm.add(leftHand);

  const rightClav = new THREE.Bone();
  rightClav.name = 'RightClav';
  rightClav.position.set(-0.22, 0.22, 0.02);
  spineUpper.add(rightClav);

  const rightUpperArm = new THREE.Bone();
  rightUpperArm.name = 'RightUpperArm';
  rightUpperArm.position.set(-0.08, -0.04, 0);
  rightClav.add(rightUpperArm);

  const rightForearm = new THREE.Bone();
  rightForearm.name = 'RightForearm';
  rightForearm.position.set(-0.02, -0.42, 0.04);
  rightUpperArm.add(rightForearm);

  const rightHand = new THREE.Bone();
  rightHand.name = 'RightHand';
  rightHand.position.set(0, -0.38, 0.03);
  rightForearm.add(rightHand);

  const leftThigh = new THREE.Bone();
  leftThigh.name = 'LeftThigh';
  leftThigh.position.set(0.14, -0.06, 0);
  pelvis.add(leftThigh);

  const leftShin = new THREE.Bone();
  leftShin.name = 'LeftShin';
  leftShin.position.set(0, -0.48, 0);
  leftThigh.add(leftShin);

  const rightThigh = new THREE.Bone();
  rightThigh.name = 'RightThigh';
  rightThigh.position.set(-0.14, -0.06, 0);
  pelvis.add(rightThigh);

  const rightShin = new THREE.Bone();
  rightShin.name = 'RightShin';
  rightShin.position.set(0, -0.48, 0);
  rightThigh.add(rightShin);

  root.add(pelvis);

  // Sculpted Seamless Torso, Buckled Waist Sash & Tattered Burial Tailcoat (Zero Waist Gap!)
  const pelvisCoat = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.32, 0.62, 12), coatMat);
  pelvisCoat.position.set(0, 0.04, -0.01);
  pelvis.add(pelvisCoat);

  const waistSash = new THREE.Mesh(new THREE.CylinderGeometry(0.238, 0.245, 0.14, 12), ragShirtMat);
  waistSash.position.set(0, 0.22, 0.01);
  pelvis.add(waistSash);

  const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.04), chainMat);
  beltBuckle.position.set(0, 0.22, 0.235);
  pelvis.add(beltBuckle);

  // Long tattered burial coat tails + side skirt panels
  for (let side = -1; side <= 1; side += 2) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.64, 0.07), coatMat);
    tail.position.set(side * 0.12, -0.36, -0.14);
    tail.rotation.x = 0.14;
    tail.rotation.z = side * 0.08;
    pelvis.add(tail);

    const hipPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.26), coatMat);
    hipPanel.position.set(side * 0.23, -0.16, -0.01);
    hipPanel.rotation.z = side * -0.1;
    pelvis.add(hipPanel);
  }

  const abdomen = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.52, 12), coatMat);
  abdomen.position.set(0, 0.08, 0.01);
  spineLower.add(abdomen);

  const abdomenShirt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 0.08), ragShirtMat);
  abdomenShirt.position.set(0, 0.1, 0.19);
  spineLower.add(abdomenShirt);

  const ribCoat = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.48, 0.3), coatMat);
  ribCoat.position.set(0, 0.12, 0);
  spineUpper.add(ribCoat);

  // Victorian Undertaker Shoulder Mantle / Capelet
  const mantle = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.28, 12), coatMat);
  mantle.scale.set(1.08, 1.0, 0.72);
  mantle.position.set(0, 0.25, 0.01);
  spineUpper.add(mantle);

  // Exposed pale gaunt chest & collarbones inside torn burial coat
  const chestFlesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.06), paleFleshMat);
  chestFlesh.position.set(0, 0.16, 0.14);
  spineUpper.add(chestFlesh);

  for (let r = 0; r < 3; r++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.022, 0.03), darkVeinMat);
    rib.position.set(0, 0.08 + r * 0.06, 0.165);
    spineUpper.add(rib);
  }

  // Torn Victorian lapels + high standing undertaker collar + tarnished brass front buttons
  for (let side = -1; side <= 1; side += 2) {
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.055), coatMat);
    lapel.position.set(side * 0.145, 0.14, 0.162);
    lapel.rotation.z = side * 0.22;
    spineUpper.add(lapel);

    const highCollar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.22), coatMat);
    highCollar.position.set(side * 0.14, 0.32, 0.04);
    highCollar.rotation.z = side * -0.18;
    spineUpper.add(highCollar);

    for (let b = 0; b < 3; b++) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.015, 10), tarnishedBrassMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(side * 0.155, 0.03 + b * 0.095, 0.188);
      spineUpper.add(btn);
    }
  }

  // Sinewy elongated neck
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.098, 0.22, 14), paleFleshMat);
  neckMesh.position.set(0, 0.08, 0.02);
  neckMesh.rotation.x = 0.22;
  neck.add(neckMesh);

  // Gaunt Sculpted Horror Head (High-detail silhouette facing +Z)
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.168, 22, 18), paleFleshMat);
  cranium.scale.set(0.88, 1.18, 1.05);
  cranium.position.set(0, 0.1, 0);
  head.add(cranium);

  // Hollowed gaunt cheekbones & temple ridges
  for (let side = -1; side <= 1; side += 2) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), paleFleshMat);
    cheek.scale.set(0.85, 0.9, 1.25);
    cheek.position.set(side * 0.105, 0.045, 0.095);
    head.add(cheek);

    const cheekHollow = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), darkVeinMat);
    cheekHollow.scale.set(0.7, 1.15, 1.0);
    cheekHollow.position.set(side * 0.108, -0.01, 0.08);
    head.add(cheekHollow);
  }

  // Heavy furrowed brow ridge + dark sunken eye sockets + glowing demonic eyes
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.235, 0.046, 0.088), paleFleshMat);
  brow.position.set(0, 0.138, 0.138);
  brow.rotation.x = 0.18;
  head.add(brow);

  for (let side = -1; side <= 1; side += 2) {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), sunkenSocketMat);
    socket.scale.set(1.12, 0.96, 0.72);
    socket.position.set(side * 0.058, 0.095, 0.138);
    head.add(socket);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.019, 10, 10),
      side < 0 ? eyeMatR : eyeMatL
    );
    pupil.position.set(side * 0.058, 0.095, 0.168);
    head.add(pupil);
  }

  // Sharp hooked nose
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.105, 10), paleFleshMat);
  nose.position.set(0, 0.055, 0.185);
  nose.rotation.x = Math.PI * 0.42;
  head.add(nose);

  // Dark upper mouth cavity + upper jagged teeth
  const mouthCavity = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.095, 0.085), sunkenSocketMat);
  mouthCavity.position.set(0, -0.02, 0.125);
  head.add(mouthCavity);

  for (let t = -3; t <= 3; t++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.026, 6), toothMat);
    tooth.rotation.x = Math.PI;
    tooth.position.set(t * 0.015, -0.006, 0.164 - Math.abs(t) * 0.004);
    head.add(tooth);
  }

  // Articulated Screaming Lower Jaw (`JawBone`)
  const lowerJawMesh = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.065, 0.132), paleFleshMat);
  lowerJawMesh.position.set(0, -0.03, 0.055);
  jaw.add(lowerJawMesh);

  const chinMesh = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 10), paleFleshMat);
  chinMesh.scale.set(0.95, 1.12, 1.15);
  chinMesh.position.set(0, -0.05, 0.112);
  jaw.add(chinMesh);

  for (let t = -3; t <= 3; t++) {
    const lTooth = new THREE.Mesh(new THREE.ConeGeometry(0.0075, 0.024, 6), toothMat);
    lTooth.position.set(t * 0.014, 0.009, 0.106 - Math.abs(t) * 0.004);
    jaw.add(lTooth);
  }

  // Flowing multi-layered tangled silver-white Victorian hair locks sweeping back & down sides
  for (let i = 0; i < 15; i++) {
    const u = (i - 7) / 7;
    const angle = u * 1.48;
    const strandLen = 0.36 + (i % 3) * 0.05;
    const strand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.006, strandLen, 7),
      hairMat
    );
    strand.position.set(
      Math.sin(angle) * 0.155,
      0.02 - Math.abs(u) * 0.035,
      -Math.cos(angle) * 0.135 - 0.025
    );
    strand.rotation.z = -Math.sin(angle) * 0.28;
    strand.rotation.x = 0.24 + (i % 2) * 0.08;
    head.add(strand);
  }

  // Elongated Arms + Gaunt Clawed Hands + Shackle Chain
  const buildArm = (upperBone: THREE.Bone, foreBone: THREE.Bone, handBone: THREE.Bone, side: number) => {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.42, 8), coatMat);
    sleeve.position.set(0, -0.2, 0.01);
    upperBone.add(sleeve);

    const forearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.045, 0.38, 8),
      paleFleshMat
    );
    forearmMesh.position.set(0, -0.18, 0.01);
    foreBone.add(forearmMesh);

    // Iron shackle cuff + dangling chain links
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 12), chainMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, -0.32, 0.01);
    foreBone.add(cuff);

    for (let c = 0; c < 3; c++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 5, 8), chainMat);
      link.position.set(side * 0.03, -0.35 - c * 0.038, 0.02);
      link.rotation.y = (c % 2) * (Math.PI / 2);
      foreBone.add(link);
    }

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.11, 0.035), paleFleshMat);
    palm.position.set(0, -0.05, 0.01);
    handBone.add(palm);

    // 5 Long Bony Claw Fingers
    for (let f = 0; f < 5; f++) {
      const fx = (f - 2) * 0.02;
      const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.006, 0.11, 6), paleFleshMat);
      finger.position.set(fx, -0.14, 0.02 + (f === 0 ? 0.02 : 0));
      finger.rotation.x = 0.28;
      finger.rotation.z = (f - 2) * 0.08;
      handBone.add(finger);

      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.045, 5), clawMat);
      claw.position.set(fx, -0.205, 0.042);
      claw.rotation.x = Math.PI + 0.45;
      handBone.add(claw);
    }
  };

  buildArm(leftUpperArm, leftForearm, leftHand, 1);
  buildArm(rightUpperArm, rightForearm, rightHand, -1);

  // Legs & Heavy Boots
  const buildLeg = (thighBone: THREE.Bone, shinBone: THREE.Bone) => {
    const thighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.078, 0.48, 8), coatMat);
    thighMesh.position.set(0, -0.24, 0);
    thighBone.add(thighMesh);

    const shinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.062, 0.48, 8), coatMat);
    shinMesh.position.set(0, -0.24, 0);
    shinBone.add(shinMesh);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.24), clawMat);
    boot.position.set(0, -0.5, 0.05);
    shinBone.add(boot);
  };
  buildLeg(leftThigh, leftShin);
  buildLeg(rightThigh, rightShin);

  // Realistic soft dark radial contact-shadow disc (replaces arcade red ring for AAA grounding!)
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shCtx = shadowCanvas.getContext('2d')!;
  const grad = shCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(6, 4, 8, 0.78)');
  grad.addColorStop(0.55, 'rgba(18, 8, 12, 0.42)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  shCtx.fillStyle = grad;
  shCtx.fillRect(0, 0, 128, 128);
  const contactShadowTex = new THREE.CanvasTexture(shadowCanvas);

  const auraLightMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: contactShadowTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const auraDisc = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 1.65), auraLightMat);
  auraDisc.rotation.x = -Math.PI / 2;
  auraDisc.position.y = 0.025;
  root.add(auraDisc);

  // Enable dynamic flashlight shadow casting across Grandfather's sculpted body
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj !== auraDisc) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  // ==========================================================================
  // Animation Clips: LurkIdle, StalkWalk, FrenzyChase, and KillExecution!
  // ==========================================================================
  const idleClip = new THREE.AnimationClip('LurkIdle', 2.4, [
    makePosTrack('Pelvis', [0, 1.2, 2.4], [
      [0, 1.06, 0],
      [0, 1.03, 0],
      [0, 1.06, 0],
    ]),
    makeQuatTrack('SpineUpper', [0, 1.2, 2.4], [
      [0.24, 0.04, 0.03],
      [0.29, -0.05, -0.03],
      [0.24, 0.04, 0.03],
    ]),
    makeQuatTrack('Head', [0, 0.8, 1.6, 2.4], [
      [-0.08, 0.08, 0.06],
      [-0.05, -0.14, -0.09],
      [-0.1, 0.12, 0.08],
      [-0.08, 0.08, 0.06],
    ]),
    makeQuatTrack('JawBone', [0, 1.2, 2.4], [
      [0.14, 0, 0],
      [0.28, 0, 0],
      [0.14, 0, 0],
    ]),
    makeQuatTrack('LeftUpperArm', [0, 1.2, 2.4], [
      [-0.28, 0, 0.16],
      [-0.36, 0, 0.22],
      [-0.28, 0, 0.16],
    ]),
    makeQuatTrack('RightUpperArm', [0, 1.2, 2.4], [
      [-0.28, 0, -0.16],
      [-0.36, 0, -0.22],
      [-0.28, 0, -0.16],
    ]),
    makeQuatTrack('LeftForearm', [0, 1.2, 2.4], [
      [-0.45, 0, 0],
      [-0.56, 0, 0],
      [-0.45, 0, 0],
    ]),
    makeQuatTrack('RightForearm', [0, 1.2, 2.4], [
      [-0.45, 0, 0],
      [-0.56, 0, 0],
      [-0.45, 0, 0],
    ]),
  ]);

  const walkClip = new THREE.AnimationClip('StalkWalk', 1.2, [
    makePosTrack('Pelvis', [0, 0.3, 0.6, 0.9, 1.2], [
      [0, 1.05, 0],
      [0, 1.09, 0],
      [0, 1.05, 0],
      [0, 1.09, 0],
      [0, 1.05, 0],
    ]),
    makeQuatTrack('SpineUpper', [0, 0.6, 1.2], [
      [0.28, 0.08, 0.04],
      [0.28, -0.08, -0.04],
      [0.28, 0.08, 0.04],
    ]),
    makeQuatTrack('Head', [0, 0.6, 1.2], [
      [-0.14, -0.06, 0.07],
      [-0.14, 0.06, -0.07],
      [-0.14, -0.06, 0.07],
    ]),
    makeQuatTrack('JawBone', [0, 0.6, 1.2], [
      [0.18, 0, 0],
      [0.3, 0, 0],
      [0.18, 0, 0],
    ]),
    makeQuatTrack('LeftThigh', [0, 0.6, 1.2], [
      [-0.42, 0, 0],
      [0.38, 0, 0],
      [-0.42, 0, 0],
    ]),
    makeQuatTrack('RightThigh', [0, 0.6, 1.2], [
      [0.38, 0, 0],
      [-0.42, 0, 0],
      [0.38, 0, 0],
    ]),
    makeQuatTrack('LeftShin', [0, 0.3, 0.6, 1.2], [
      [0.12, 0, 0],
      [0.48, 0, 0],
      [0.1, 0, 0],
      [0.12, 0, 0],
    ]),
    makeQuatTrack('RightShin', [0, 0.6, 0.9, 1.2], [
      [0.1, 0, 0],
      [0.12, 0, 0],
      [0.48, 0, 0],
      [0.1, 0, 0],
    ]),
    makeQuatTrack('LeftUpperArm', [0, 0.6, 1.2], [
      [-0.55, 0, 0.18],
      [-0.2, 0, 0.14],
      [-0.55, 0, 0.18],
    ]),
    makeQuatTrack('RightUpperArm', [0, 0.6, 1.2], [
      [-0.2, 0, -0.14],
      [-0.55, 0, -0.18],
      [-0.2, 0, -0.14],
    ]),
    makeQuatTrack('LeftForearm', [0, 0.6, 1.2], [
      [-0.55, 0, 0],
      [-0.4, 0, 0],
      [-0.55, 0, 0],
    ]),
    makeQuatTrack('RightForearm', [0, 0.6, 1.2], [
      [-0.4, 0, 0],
      [-0.55, 0, 0],
      [-0.4, 0, 0],
    ]),
  ]);

  const chaseClip = new THREE.AnimationClip('FrenzyChase', 0.72, [
    makePosTrack('Pelvis', [0, 0.18, 0.36, 0.54, 0.72], [
      [0, 1.02, 0],
      [0, 1.11, 0],
      [0, 1.02, 0],
      [0, 1.11, 0],
      [0, 1.02, 0],
    ]),
    makeQuatTrack('SpineUpper', [0, 0.36, 0.72], [
      [0.42, 0.12, 0.06],
      [0.42, -0.12, -0.06],
      [0.42, 0.12, 0.06],
    ]),
    makeQuatTrack('Head', [0, 0.36, 0.72], [
      [-0.26, -0.08, 0.1],
      [-0.26, 0.08, -0.1],
      [-0.26, -0.08, 0.1],
    ]),
    makeQuatTrack('JawBone', [0, 0.36, 0.72], [
      [0.48, 0, 0],
      [0.62, 0, 0],
      [0.48, 0, 0],
    ]),
    // Reaching claws stretched forward toward Mark!
    makeQuatTrack('LeftUpperArm', [0, 0.36, 0.72], [
      [-1.32, -0.12, 0.25],
      [-1.08, 0.08, 0.18],
      [-1.32, -0.12, 0.25],
    ]),
    makeQuatTrack('RightUpperArm', [0, 0.36, 0.72], [
      [-1.08, -0.08, -0.18],
      [-1.32, 0.12, -0.25],
      [-1.08, -0.08, -0.18],
    ]),
    makeQuatTrack('LeftForearm', [0, 0.36, 0.72], [
      [-0.38, 0, 0],
      [-0.55, 0, 0],
      [-0.38, 0, 0],
    ]),
    makeQuatTrack('RightForearm', [0, 0.36, 0.72], [
      [-0.55, 0, 0],
      [-0.38, 0, 0],
      [-0.55, 0, 0],
    ]),
    makeQuatTrack('LeftThigh', [0, 0.36, 0.72], [
      [-0.68, 0, 0],
      [0.58, 0, 0],
      [-0.68, 0, 0],
    ]),
    makeQuatTrack('RightThigh', [0, 0.36, 0.72], [
      [0.58, 0, 0],
      [-0.68, 0, 0],
      [0.58, 0, 0],
    ]),
    makeQuatTrack('LeftShin', [0, 0.18, 0.36, 0.72], [
      [0.18, 0, 0],
      [0.72, 0, 0],
      [0.15, 0, 0],
      [0.18, 0, 0],
    ]),
    makeQuatTrack('RightShin', [0, 0.36, 0.54, 0.72], [
      [0.15, 0, 0],
      [0.18, 0, 0],
      [0.72, 0, 0],
      [0.15, 0, 0],
    ]),
  ]);

  // 1.85s One-Hit Lethal Execution Animation!
  // Left claw seizes Mark, Jaw unhinges in a terrifying shriek, Right claw raises & slashes at t=0.68s!
  const killClip = new THREE.AnimationClip('KillExecution', 1.85, [
    makePosTrack('Pelvis', [0, 0.32, 0.68, 1.2, 1.85], [
      [0, 1.05, 0],
      [0, 1.12, 0.08],
      [0, 0.98, 0.16],
      [0, 0.92, 0.12],
      [0, 0.88, 0.1],
    ]),
    makeQuatTrack('SpineUpper', [0, 0.35, 0.68, 1.2, 1.85], [
      [0.25, 0, 0],
      [0.08, -0.22, 0],
      [0.46, 0.24, 0.08],
      [0.52, 0.08, 0],
      [0.56, 0, 0],
    ]),
    makeQuatTrack('Head', [0, 0.32, 0.68, 1.25, 1.85], [
      [-0.1, 0, 0],
      [-0.22, 0.12, -0.14],
      [0.08, -0.1, 0.12],
      [0.24, 0, 0.06],
      [0.32, 0, 0],
    ]),
    makeQuatTrack('JawBone', [0, 0.25, 0.68, 1.4, 1.85], [
      [0.2, 0, 0],
      [0.68, 0, 0],
      [0.74, 0, 0],
      [0.45, 0, 0],
      [0.28, 0, 0],
    ]),
    // Left arm lunges forward to seize Mark's throat/shoulder
    makeQuatTrack('LeftUpperArm', [0, 0.28, 0.68, 1.3, 1.85], [
      [-0.9, 0, 0.2],
      [-1.52, -0.18, 0.1],
      [-1.38, -0.12, 0.08],
      [-1.05, 0, 0.15],
      [-0.85, 0, 0.2],
    ]),
    makeQuatTrack('LeftForearm', [0, 0.28, 1.85], [
      [-0.35, 0, 0],
      [-0.18, 0, 0],
      [-0.32, 0, 0],
    ]),
    // Right arm raises high overhead (0.35s) and slashes violently across Mark's face (0.68s)!
    makeQuatTrack('RightUpperArm', [0, 0.36, 0.68, 1.15, 1.85], [
      [-0.9, 0, -0.2],
      [-2.35, 0.28, -0.45],
      [-0.42, -0.52, 0.36],
      [-0.55, -0.25, 0.12],
      [-0.65, 0, -0.16],
    ]),
    makeQuatTrack('RightForearm', [0, 0.36, 0.68, 1.85], [
      [-0.45, 0, 0],
      [-0.62, 0, 0],
      [-0.15, 0, 0],
      [-0.4, 0, 0],
    ]),
  ]);

  const mixer = new THREE.AnimationMixer(root);
  const actions = {
    idle: mixer.clipAction(idleClip),
    walk: mixer.clipAction(walkClip),
    chase: mixer.clipAction(chaseClip),
    kill: mixer.clipAction(killClip),
  };

  actions.kill.setLoop(THREE.LoopOnce, 1);
  actions.kill.clampWhenFinished = true;
  actions.idle.play();

  const rig: GrandfatherHorrorRig = {
    root,
    mixer,
    actions,
    activeClip: 'idle',
    eyeMats: [eyeMatL, eyeMatR],
    auraLightMat,
    setClip(next, timeScale = 1) {
      if (rig.activeClip === next) {
        actions[next].timeScale = timeScale;
        return;
      }
      const prevAct = actions[rig.activeClip];
      const nextAct = actions[next];
      nextAct.reset();
      nextAct.timeScale = timeScale;
      nextAct.play();
      prevAct.crossFadeTo(nextAct, next === 'kill' ? 0.08 : 0.18, false);
      rig.activeClip = next;
    },
    setFlash(flashIntensity) {
      const eInt = 2.2 + flashIntensity * 3.8;
      const eyeGlow = flashIntensity > 0.25 ? 0xef4444 : 0xf59e0b;
      eyeMatL.emissive.setHex(eyeGlow);
      eyeMatR.emissive.setHex(eyeGlow);
      eyeMatL.emissiveIntensity = eInt;
      eyeMatR.emissiveIntensity = eInt;
      auraLightMat.opacity = 0.78 + flashIntensity * 0.2;
    },
  };

  return rig;
}

export interface MarkFirstPersonRig {
  root: THREE.Group;
  rightArmPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  flashlightMuzzle: THREE.Object3D;
  lensGlowMat: THREE.MeshBasicMaterial;
  keyProp: THREE.Group;
  noteProp: THREE.Group;
  deedProp: THREE.Group;
  update: (params: {
    time: number;
    speedRatio: number;
    isSprinting: boolean;
    flashlightOn: boolean;
    battery: number;
    heldItemKind: 'none' | 'key' | 'note' | 'deed';
    grandfatherThreatRatio: number; // 0..1 when Grandfather is within 11m
    yawVel: number;
    pitchVel: number;
    deathProgress: number; // 0 if alive, 0..1 during 1.85s execution
  }) => void;
}

/**
 * Builds Mark's 3D First-Person Viewmodel Arms & Hands attached to the camera
 * (Right hand holding detailed 3D flashlight; Left hand raising keys, dark clue cards,
 * the wax-sealed Inheritance Deed, defensive fear pose like Ref Image 9, and death collapse!).
 */
export function buildMarkFirstPersonRig(): MarkFirstPersonRig {
  const root = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd9a78b,
    roughness: 0.72,
    metalness: 0.02,
  });
  const scarMat = new THREE.MeshStandardMaterial({
    color: 0x9f5848,
    roughness: 0.78,
  });
  const sleeveMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.88,
  });
  const cuffMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.82,
  });
  const metalBodyMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.36,
    metalness: 0.82,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.32,
    metalness: 0.86,
  });
  const lensGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfffbeb,
  });

  // --------------------------------------------------------------------------
  // RIGHT ARM & HAND + 3D FLASHLIGHT
  // --------------------------------------------------------------------------
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.27, -0.25, -0.44);
  root.add(rightArmPivot);

  const rSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.34, 10), sleeveMat);
  rSleeve.rotation.x = Math.PI / 2 - 0.18;
  rSleeve.rotation.z = -0.12;
  rSleeve.position.set(0.05, -0.06, 0.19);
  rightArmPivot.add(rSleeve);

  const rCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.05, 0.04, 10), cuffMat);
  rCuff.rotation.x = Math.PI / 2 - 0.18;
  rCuff.position.set(0.02, -0.02, 0.04);
  rightArmPivot.add(rCuff);
  const rCuffSeam = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.003, 6, 16), brassMat);
  rCuffSeam.position.set(0.02, -0.02, 0.064);
  rightArmPivot.add(rCuffSeam);

  const rPalm = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.065, 0.095), skinMat);
  rPalm.position.set(0, -0.01, -0.02);
  rightArmPivot.add(rPalm);

  for (let f = 0; f < 4; f++) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.035, 4, 8), skinMat);
    finger.position.set(-0.036, 0.005, -0.05 + f * 0.022);
    finger.rotation.z = 0.35;
    rightArmPivot.add(finger);
  }
  const rThumb = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.02, 0.055), skinMat);
  rThumb.position.set(-0.025, 0.035, -0.03);
  rThumb.rotation.y = 0.25;
  rightArmPivot.add(rThumb);

  // Flashlight barrel
  const torchGroup = new THREE.Group();
  torchGroup.position.set(-0.01, 0.018, -0.06);
  rightArmPivot.add(torchGroup);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.024, 0.22, 14), metalBodyMat);
  barrel.rotation.x = Math.PI / 2;
  torchGroup.add(barrel);

  const headBell = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.027, 0.065, 16), metalBodyMat);
  headBell.rotation.x = Math.PI / 2;
  headBell.position.set(0, 0, -0.125);
  torchGroup.add(headBell);

  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.004, 8, 16), brassMat);
  bezel.position.set(0, 0, -0.158);
  torchGroup.add(bezel);

  const lensDisk = new THREE.Mesh(new THREE.CircleGeometry(0.033, 14), lensGlowMat);
  lensDisk.rotation.y = Math.PI;
  lensDisk.position.set(0, 0, -0.159);
  torchGroup.add(lensDisk);

  const switchBtn = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.022), brassMat);
  switchBtn.position.set(0, 0.027, -0.05);
  torchGroup.add(switchBtn);

  // Subtle Atmospheric Dust Haze near Mark's Flashlight Lens (ClampToEdge + FrontSide = zero hard seam)
  const beamCanvas = document.createElement('canvas');
  beamCanvas.width = 64;
  beamCanvas.height = 128;
  const bmCtx = beamCanvas.getContext('2d')!;
  bmCtx.clearRect(0, 0, 64, 128);
  const bmGrad = bmCtx.createLinearGradient(0, 0, 0, 128);
  bmGrad.addColorStop(0, 'rgba(255, 245, 210, 0.0)');
  bmGrad.addColorStop(0.22, 'rgba(255, 244, 205, 0.35)');
  bmGrad.addColorStop(0.65, 'rgba(255, 238, 185, 0.10)');
  bmGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  bmCtx.fillStyle = bmGrad;
  bmCtx.fillRect(0, 0, 64, 128);
  const beamTex = new THREE.CanvasTexture(beamCanvas);
  beamTex.wrapS = THREE.ClampToEdgeWrapping;
  beamTex.wrapT = THREE.ClampToEdgeWrapping;

  const volBeamMat = new THREE.MeshBasicMaterial({
    color: 0xfff3cf,
    map: beamTex,
    transparent: true,
    opacity: 0.07,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  const volBeamCone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.48, 1.85, 20, 1, true),
    volBeamMat
  );
  volBeamCone.rotation.x = Math.PI / 2;
  volBeamCone.position.set(0, 0, -1.08);
  volBeamCone.renderOrder = 4;
  torchGroup.add(volBeamCone);

  const flashlightMuzzle = new THREE.Object3D();
  flashlightMuzzle.position.set(0, 0, -0.17);
  torchGroup.add(flashlightMuzzle);

  // --------------------------------------------------------------------------
  // LEFT ARM & HAND (Defensive ward pose + Held Keys / Clue Card / Deed!)
  // --------------------------------------------------------------------------
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.27, -0.34, -0.44);
  root.add(leftArmPivot);

  const lSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.34, 10), sleeveMat);
  lSleeve.rotation.x = Math.PI / 2 - 0.25;
  lSleeve.rotation.z = 0.16;
  lSleeve.position.set(-0.05, -0.09, 0.17);
  leftArmPivot.add(lSleeve);

  const lCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.043, 0.045, 12), cuffMat);
  lCuff.rotation.x = Math.PI / 2 - 0.25;
  lCuff.rotation.z = 0.16;
  lCuff.position.set(-0.045, -0.078, 0.025);
  leftArmPivot.add(lCuff);
  const lCuffSeam = new THREE.Mesh(new THREE.TorusGeometry(0.041, 0.003, 6, 16), brassMat);
  lCuffSeam.position.set(-0.045, -0.078, 0.052);
  leftArmPivot.add(lCuffSeam);

  const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.044, 0.14, 10), skinMat);
  lForearm.rotation.x = Math.PI / 2 - 0.35;
  lForearm.position.set(-0.015, -0.03, 0.04);
  leftArmPivot.add(lForearm);

  const lPalm = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.088, 0.026), skinMat);
  lPalm.position.set(0, 0.02, -0.02);
  lPalm.rotation.y = 0.22;
  lPalm.rotation.x = -0.18;
  leftArmPivot.add(lPalm);

  // Subtle scrape detail on palm (matching Reference Image 9!)
  const palmScar = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.01, 0.005), scarMat);
  palmScar.position.set(0.005, 0.02, -0.005);
  palmScar.rotation.z = -0.35;
  lPalm.add(palmScar);

  for (let f = 0; f < 4; f++) {
    const lf = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.048, 4, 8), skinMat);
    lf.position.set(-0.026 + f * 0.018, 0.072 + (f === 1 || f === 2 ? 0.008 : 0), 0);
    lf.rotation.z = (1.5 - f) * 0.06;
    lf.rotation.x = 0.12;
    lPalm.add(lf);
  }
  const lThumb = new THREE.Mesh(new THREE.BoxGeometry(0.017, 0.052, 0.017), skinMat);
  lThumb.position.set(0.048, 0.015, 0.008);
  lThumb.rotation.z = -0.58;
  lPalm.add(lThumb);

  // Prop 1: Ornate Brass Castle Key
  const keyProp = new THREE.Group();
  keyProp.position.set(0.03, 0.06, -0.02);
  keyProp.rotation.set(0.2, -0.3, -0.35);
  const keyBow = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.006, 8, 14), brassMat);
  keyProp.add(keyBow);
  const keyShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.11, 8), brassMat);
  keyShaft.position.set(0, 0.075, 0);
  keyProp.add(keyShaft);
  const keyBit = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.022, 0.006), brassMat);
  keyBit.position.set(0.012, 0.115, 0);
  keyProp.add(keyBit);
  keyProp.visible = false;
  leftArmPivot.add(keyProp);

  // Prop 2: Dark Clue Card (matching Reference Image 10!)
  const noteProp = new THREE.Group();
  noteProp.position.set(0.04, 0.055, -0.025);
  noteProp.rotation.set(-0.12, 0.28, -0.1);
  const cardMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.85 });
  const cardBorderMat = new THREE.MeshStandardMaterial({
    color: 0xd6d3d1,
    emissive: 0x78716c,
    emissiveIntensity: 0.25,
    roughness: 0.7,
  });
  const cardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.145, 0.004), cardMat);
  noteProp.add(cardMesh);
  const cardSeal = new THREE.Mesh(new THREE.RingGeometry(0.018, 0.026, 12), cardBorderMat);
  cardSeal.position.set(0, 0.01, 0.003);
  noteProp.add(cardSeal);
  noteProp.visible = false;
  leftArmPivot.add(noteProp);

  // Prop 3: Wax-Sealed Inheritance Deed ("ورقة الورث المختومة")
  const deedProp = new THREE.Group();
  deedProp.position.set(0.045, 0.06, -0.03);
  deedProp.rotation.set(-0.15, 0.3, -0.08);
  const parchmentMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xd97706,
    emissiveIntensity: 0.22,
    roughness: 0.78,
  });
  const waxSealMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.35,
    roughness: 0.45,
  });
  const deedSheet = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.165, 0.006), parchmentMat);
  deedProp.add(deedSheet);
  const waxDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.008, 12), waxSealMat);
  waxDisk.rotation.x = Math.PI / 2;
  waxDisk.position.set(0.02, -0.045, 0.005);
  deedProp.add(waxDisk);
  deedProp.visible = false;
  leftArmPivot.add(deedProp);

  return {
    root,
    rightArmPivot,
    leftArmPivot,
    flashlightMuzzle,
    lensGlowMat,
    keyProp,
    noteProp,
    deedProp,
    update({
      time,
      speedRatio,
      isSprinting,
      flashlightOn,
      battery,
      heldItemKind,
      grandfatherThreatRatio,
      yawVel,
      pitchVel,
      deathProgress,
    }) {
      const torchActive = flashlightOn && battery > 0.5;
      lensGlowMat.color.setHex(torchActive ? 0xfffbeb : 0x27272a);
      volBeamCone.visible = torchActive;
      volBeamMat.opacity = torchActive ? 0.055 + Math.min(0.035, (battery / 100) * 0.035) : 0;

      // 1st-Person Player Death & Execution Pose!
      if (deathProgress > 0) {
        if (deathProgress < 0.4) {
          // Desperate defensive hands thrown up toward Grandfather's face!
          const u = deathProgress / 0.4;
          const shake = Math.sin(time * 48) * 0.015;
          leftArmPivot.position.set(-0.16 + shake, -0.08 + u * 0.12, -0.36);
          leftArmPivot.rotation.set(0.35 * u, 0.25, -0.25);
          rightArmPivot.position.set(0.18 - shake, -0.1 + u * 0.1, -0.38);
          rightArmPivot.rotation.set(0.45 * u, -0.2, 0.25);
        } else {
          // Slash impact recoil + going limp onto the castle floor!
          const v = (deathProgress - 0.4) / 0.6;
          leftArmPivot.position.set(-0.22 - v * 0.08, 0.04 - v * 0.36, -0.36 - v * 0.06);
          leftArmPivot.rotation.set(0.35 - v * 1.15, 0.25, -0.25 - v * 0.55);
          rightArmPivot.position.set(0.2 + v * 0.1, 0.0 - v * 0.34, -0.38);
          rightArmPivot.rotation.set(0.45 - v * 1.1, -0.2, 0.25 + v * 0.45);
        }
        return;
      }

      const bobFreq = isSprinting ? 11.5 : 7.8;
      const bobX = Math.cos(time * bobFreq * 0.5) * 0.014 * speedRatio;
      const bobY = Math.abs(Math.sin(time * bobFreq)) * 0.018 * speedRatio;
      const swayX = THREE.MathUtils.clamp(-yawVel * 0.04, -0.045, 0.045);
      const swayY = THREE.MathUtils.clamp(pitchVel * 0.04, -0.04, 0.04);
      const breath = Math.sin(time * 1.8) * 0.003;
      const threatShake = Math.sin(time * (18 + grandfatherThreatRatio * 16)) * 0.004 * grandfatherThreatRatio;

      // Right Flashlight Hand
      rightArmPivot.position.set(
        0.27 + bobX + swayX,
        -0.24 - bobY + swayY + breath + threatShake + (torchActive ? 0 : -0.04),
        -0.44
      );
      rightArmPivot.rotation.set(
        (isSprinting ? -0.12 : 0) + swayY * 1.4,
        swayX * 1.6,
        bobX * 1.5 + threatShake * 1.8
      );

      // Left Hand: Held Item (Key / Note / Deed) OR Defensive Fear Ward Pose (Ref Image 9)!
      keyProp.visible = heldItemKind === 'key';
      noteProp.visible = heldItemKind === 'note';
      deedProp.visible = heldItemKind === 'deed';

      const showLeftHand = heldItemKind !== 'none' || grandfatherThreatRatio > 0.08;
      if (showLeftHand) {
        const tremble =
          grandfatherThreatRatio > 0.2
            ? Math.sin(time * (34 + grandfatherThreatRatio * 10)) * 0.012 * grandfatherThreatRatio
            : 0;
        const targetY =
          heldItemKind !== 'none'
            ? -0.21 - bobY * 0.8
            : -0.34 + grandfatherThreatRatio * 0.16;
        leftArmPivot.position.set(-0.24 - bobX + swayX + tremble, targetY + swayY, -0.43);
        leftArmPivot.rotation.set(
          heldItemKind !== 'none' ? 0.18 : 0.28 * grandfatherThreatRatio,
          0.12,
          -0.08 + tremble * 3
        );
      } else {
        // Tuck empty left hand cleanly below viewport until holding an item or warding off Grandfather
        leftArmPivot.position.set(-0.28 - bobX, -0.54 - bobY, -0.45);
        leftArmPivot.rotation.set(-0.25, 0.1, -0.15);
      }
    },
  };
}

/**
 * Veiled Marble Offering Statue Rig (Reference Image 10)
 */
export function buildStatueWatcherRig(): {
  root: THREE.Group;
  emberMat: THREE.MeshBasicMaterial;
} {
  const root = new THREE.Group();
  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0xd6d3d1,
    roughness: 0.65,
    metalness: 0.05,
  });
  const darkFoldMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.82,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.4,
    metalness: 0.75,
  });
  const emberMat = new THREE.MeshBasicMaterial({
    color: 0xd97706,
  });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.75), darkFoldMat);
  plinth.position.y = 0.11;
  root.add(plinth);

  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 1.45, 12), marbleMat);
  robe.position.y = 0.94;
  root.add(robe);

  const shawl = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.68, 12), marbleMat);
  shawl.position.y = 1.62;
  root.add(shawl);

  // Hooded veiled head bowed slightly over the offering bowl
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), marbleMat);
  hood.scale.set(0.92, 1.15, 1.05);
  hood.position.set(0, 1.84, 0.03);
  root.add(hood);

  const veilShadow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), darkFoldMat);
  veilShadow.position.set(0, 1.82, 0.09);
  root.add(veilShadow);

  // Draped forearms holding bronze offering bowl forward
  for (let side = -1; side <= 1; side += 2) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.46, 8), marbleMat);
    arm.rotation.x = Math.PI / 3;
    arm.rotation.z = side * -0.25;
    arm.position.set(side * 0.16, 1.34, 0.2);
    root.add(arm);
  }

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.09, 0.12, 14),
    bronzeMat
  );
  bowl.position.set(0, 1.24, 0.36);
  root.add(bowl);

  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), emberMat);
  ember.scale.set(1.2, 0.7, 1.2);
  ember.position.set(0, 1.31, 0.36);
  root.add(ember);

  return { root, emberMat };
}

/**
 * Cursed Infirmary Asylum Corpse Wraith Rig ("طيف المريض المقيّد بالسلاسل")
 * Replaces any placeholder cone with a composite 12-part Gothic horror apparition:
 * charred necrotic flesh, exposed pale ribcage, bloodstained straitjacket rags,
 * rusted iron neck collar & dangling wrist chains, crooked spasming skull with
 * hollow black sockets and pinpoint amber-blood eyes, and lunging skeletal claws.
 */
export function buildPhantomRig(): {
  root: THREE.Group;
  coreMat: THREE.MeshStandardMaterial;
  update: (time: number, isChasing: boolean, hitFlash: number) => void;
} {
  const root = new THREE.Group();

  const fleshMat = new THREE.MeshStandardMaterial({
    color: 0x2a2123,
    roughness: 0.88,
    metalness: 0.04,
  });
  const ragMat = new THREE.MeshStandardMaterial({
    color: 0x1a1315,
    emissive: 0x220709,
    emissiveIntensity: 0.18,
    roughness: 0.94,
    metalness: 0.02,
  });
  const bloodRagMat = new THREE.MeshStandardMaterial({
    color: 0x3b1215,
    roughness: 0.82,
    metalness: 0.05,
  });
  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xc4b9a5,
    roughness: 0.62,
    metalness: 0.06,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x44403c,
    roughness: 0.42,
    metalness: 0.78,
  });
  const socketMat = new THREE.MeshBasicMaterial({
    color: 0x050307,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xdc2626,
    emissiveIntensity: 1.8,
    roughness: 0.22,
  });

  // Ground contact shadow pool so the figure sits grounded in dark corridors
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 16),
    new THREE.MeshBasicMaterial({
      color: 0x020104,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  root.add(shadowDisc);

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  // Tattered lower asylum gown & dragging necrotic legs
  const lowerShroud = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.36, 0.96, 10, 1, true), ragMat);
  lowerShroud.position.set(0, 0.52, -0.02);
  bodyPivot.add(lowerShroud);

  for (let side = -1; side <= 1; side += 2) {
    const ragStrip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.62, 0.04), bloodRagMat);
    ragStrip.position.set(side * 0.16, 0.42, 0.16);
    ragStrip.rotation.z = side * 0.12;
    bodyPivot.add(ragStrip);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.032, 0.68, 7), fleshMat);
    shin.position.set(side * 0.11, 0.36, -0.03);
    shin.rotation.x = 0.12;
    bodyPivot.add(shin);
  }

  // Hunched upper torso + exposed skeletal spine & ribcage
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.15, 0.64, 9), fleshMat);
  torso.position.set(0, 1.24, 0.04);
  torso.rotation.x = 0.24;
  bodyPivot.add(torso);

  const tornJacket = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.28), bloodRagMat);
  tornJacket.position.set(0, 1.32, 0.02);
  tornJacket.rotation.x = 0.22;
  bodyPivot.add(tornJacket);

  for (let r = 0; r < 4; r++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.15 - r * 0.012, 0.016, 6, 12, Math.PI * 1.15), boneMat);
    rib.position.set(0, 1.38 - r * 0.075, 0.11 - r * 0.01);
    rib.rotation.x = Math.PI / 2 + 0.22;
    rib.rotation.z = -Math.PI * 0.08;
    bodyPivot.add(rib);
  }

  // Rusted iron asylum neck collar & chest shackle
  const ironCollar = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.028, 8, 14), ironMat);
  ironCollar.position.set(0, 1.58, 0.11);
  ironCollar.rotation.x = Math.PI / 2 + 0.25;
  bodyPivot.add(ironCollar);

  // Spasming crooked skull & screaming jaw
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.72, 0.14);
  bodyPivot.add(headGroup);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), boneMat);
  cranium.scale.set(0.86, 1.12, 0.98);
  headGroup.add(cranium);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.14), boneMat);
  jaw.position.set(0, -0.12, 0.03);
  jaw.rotation.x = 0.34;
  headGroup.add(jaw);

  const mouthAbyss = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.075, 0.06), socketMat);
  mouthAbyss.position.set(0, -0.09, 0.105);
  headGroup.add(mouthAbyss);

  for (let side = -1; side <= 1; side += 2) {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), socketMat);
    socket.position.set(side * 0.052, 0.02, 0.115);
    headGroup.add(socket);

    const pinpointEye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), coreMat);
    pinpointEye.position.set(side * 0.052, 0.02, 0.142);
    headGroup.add(pinpointEye);
  }

  // Long skeletal clawed arms with rusted iron wrist manacles & hanging chains
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.26, 1.46, 0.06);
  bodyPivot.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.26, 1.46, 0.06);
  bodyPivot.add(rightArmPivot);

  const armPivots = [leftArmPivot, rightArmPivot];
  for (let idx = 0; idx < 2; idx++) {
    const side = idx === 0 ? -1 : 1;
    const pivot = armPivots[idx];

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.034, 0.42, 7), fleshMat);
    upperArm.position.set(side * 0.03, -0.16, 0.11);
    upperArm.rotation.x = -0.62;
    upperArm.rotation.z = side * -0.14;
    pivot.add(upperArm);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.026, 0.42, 7), boneMat);
    forearm.position.set(side * 0.05, -0.28, 0.38);
    forearm.rotation.x = -1.18;
    pivot.add(forearm);

    const manacle = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.014, 6, 10), ironMat);
    manacle.position.set(side * 0.05, -0.34, 0.54);
    manacle.rotation.y = Math.PI / 2;
    pivot.add(manacle);

    // Dangling iron chain links beneath wrist manacles
    for (let lk = 0; lk < 4; lk++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 5, 8), ironMat);
      link.position.set(side * 0.05, -0.41 - lk * 0.055, 0.54);
      link.rotation.y = lk % 2 === 0 ? 0 : Math.PI / 2;
      pivot.add(link);
    }

    // Three long hooked bone claws per hand
    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.14, 5), boneMat);
      claw.position.set(side * 0.05 + c * 0.024, -0.37, 0.64);
      claw.rotation.x = Math.PI * 0.62;
      pivot.add(claw);
    }
  }

  const update = (time: number, isChasing: boolean, hitFlash: number) => {
    const rate = isChasing ? 9.5 : 3.4;
    bodyPivot.position.y = Math.abs(Math.sin(time * rate)) * (isChasing ? 0.065 : 0.025);
    bodyPivot.rotation.z = Math.sin(time * (rate * 0.5)) * (isChasing ? 0.08 : 0.03);

    // Unsettling asylum head twitch
    const twitch = Math.sin(time * 19.0) > 0.86 ? Math.sin(time * 47.0) * 0.28 : 0;
    headGroup.rotation.z = 0.22 + Math.sin(time * 2.7) * 0.09 + twitch;
    headGroup.rotation.x = (isChasing ? -0.14 : 0.12) + Math.cos(time * 4.1) * 0.05;

    const lunge = isChasing ? -0.42 : -0.05;
    leftArmPivot.rotation.x = lunge + Math.sin(time * rate) * (isChasing ? 0.34 : 0.1);
    rightArmPivot.rotation.x = lunge - Math.sin(time * rate) * (isChasing ? 0.34 : 0.1);

    if (hitFlash > 0) {
      coreMat.color.setHex(0xffffff);
      coreMat.emissive.setHex(0xfbbf24);
      coreMat.emissiveIntensity = 3.2;
      ragMat.emissiveIntensity = 0.65;
    } else if (isChasing) {
      coreMat.color.setHex(0xfef08a);
      coreMat.emissive.setHex(0xef4444);
      coreMat.emissiveIntensity = 2.4;
      ragMat.emissiveIntensity = 0.22;
    } else {
      coreMat.color.setHex(0xfde68a);
      coreMat.emissive.setHex(0xb91c1c);
      coreMat.emissiveIntensity = 1.25;
      ragMat.emissiveIntensity = 0.08;
    }
  };

  return { root, coreMat, update };
}
