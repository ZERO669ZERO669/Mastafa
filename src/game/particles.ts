import * as THREE from 'three';

const POOL_CAPACITY = 84;
const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();

export class ParticlePool {
  public readonly mesh: THREE.InstancedMesh;
  private readonly px = new Float32Array(POOL_CAPACITY);
  private readonly py = new Float32Array(POOL_CAPACITY);
  private readonly pz = new Float32Array(POOL_CAPACITY);
  private readonly vx = new Float32Array(POOL_CAPACITY);
  private readonly vy = new Float32Array(POOL_CAPACITY);
  private readonly vz = new Float32Array(POOL_CAPACITY);
  private readonly life = new Float32Array(POOL_CAPACITY);
  private readonly maxLife = new Float32Array(POOL_CAPACITY);
  private readonly baseSize = new Float32Array(POOL_CAPACITY);
  private readonly isAmbient = new Uint8Array(POOL_CAPACITY);
  private cursor = 24; // indices 0..23 reserved for persistent drifting mist motes

  constructor(scene: THREE.Scene) {
    const geo = new THREE.OctahedronGeometry(0.08, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, POOL_CAPACITY);
    this.mesh.frustumCulled = false;

    // Seed 24 drifting ash/mist spores around spawn
    for (let i = 0; i < 24; i++) {
      this.isAmbient[i] = 1;
      this.px[i] = (Math.random() - 0.5) * 28;
      this.py[i] = 0.4 + Math.random() * 4.2;
      this.pz[i] = (Math.random() - 0.5) * 28;
      this.vx[i] = (Math.random() - 0.5) * 0.35;
      this.vy[i] = 0.08 + Math.random() * 0.18;
      this.vz[i] = (Math.random() - 0.5) * 0.35;
      this.life[i] = 9999;
      this.maxLife[i] = 9999;
      this.baseSize[i] = 0.55 + Math.random() * 0.65;
      _color.setHex(0x9fb6cc);
      this.mesh.setColorAt(i, _color);
    }

    // Initialize burst slots hidden
    _scale.set(0, 0, 0);
    for (let i = 24; i < POOL_CAPACITY; i++) {
      _mat4.compose(_pos, _quat, _scale);
      this.mesh.setMatrixAt(i, _mat4);
      _color.setHex(0xffffff);
      this.mesh.setColorAt(i, _color);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    scene.add(this.mesh);
  }

  public emitBurst(
    x: number,
    y: number,
    z: number,
    count: number,
    hexColor: number,
    speed: number,
    size: number = 1.0
  ): void {
    _color.setHex(hexColor);
    for (let c = 0; c < count; c++) {
      const i = this.cursor;
      this.cursor++;
      if (this.cursor >= POOL_CAPACITY) this.cursor = 24;

      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.45 + Math.random() * 0.75);
      this.px[i] = x + (Math.random() - 0.5) * 0.25;
      this.py[i] = y + (Math.random() - 0.5) * 0.2;
      this.pz[i] = z + (Math.random() - 0.5) * 0.25;
      this.vx[i] = Math.cos(angle) * spd;
      this.vy[i] = (0.4 + Math.random() * 0.9) * speed * 0.55;
      this.vz[i] = Math.sin(angle) * spd;
      const dur = 0.35 + Math.random() * 0.45;
      this.life[i] = dur;
      this.maxLife[i] = dur;
      this.baseSize[i] = size * (0.7 + Math.random() * 0.6);
      this.mesh.setColorAt(i, _color);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  public update(dt: number, anchorX: number, anchorZ: number): void {
    for (let i = 0; i < POOL_CAPACITY; i++) {
      if (this.isAmbient[i]) {
        this.px[i] += this.vx[i] * dt;
        this.py[i] += this.vy[i] * dt;
        this.pz[i] += this.vz[i] * dt;
        if (
          this.py[i] > 5.0 ||
          Math.abs(this.px[i] - anchorX) > 16 ||
          Math.abs(this.pz[i] - anchorZ) > 16
        ) {
          this.px[i] = anchorX + (Math.random() - 0.5) * 28;
          this.py[i] = 0.25 + Math.random() * 1.2;
          this.pz[i] = anchorZ + (Math.random() - 0.5) * 28;
        }
        const s = this.baseSize[i];
        _pos.set(this.px[i], this.py[i], this.pz[i]);
        _scale.set(s, s, s);
        _mat4.compose(_pos, _quat, _scale);
        this.mesh.setMatrixAt(i, _mat4);
      } else if (this.life[i] > 0) {
        this.life[i] -= dt;
        if (this.life[i] <= 0) {
          _scale.set(0, 0, 0);
          _mat4.compose(_pos, _quat, _scale);
          this.mesh.setMatrixAt(i, _mat4);
        } else {
          this.vy[i] -= 4.2 * dt;
          this.px[i] += this.vx[i] * dt;
          this.py[i] = Math.max(0.05, this.py[i] + this.vy[i] * dt);
          this.pz[i] += this.vz[i] * dt;
          const t = this.life[i] / this.maxLife[i];
          const s = this.baseSize[i] * t;
          _pos.set(this.px[i], this.py[i], this.pz[i]);
          _scale.set(s, s, s);
          _mat4.compose(_pos, _quat, _scale);
          this.mesh.setMatrixAt(i, _mat4);
        }
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
