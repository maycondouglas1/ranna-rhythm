import * as THREE from "three";

export class Stage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  private dancers: THREE.Sprite[] = [];
  private hearts: THREE.Mesh[] = [];
  private stars: THREE.Points;
  private glow = 0;
  private observer: ResizeObserver;
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera.position.set(0, 3.5, 9);
    this.camera.lookAt(0, 1.9, 0);
    this.scene.add(new THREE.HemisphereLight(0xffebff, 0x655487, 2));
    const key = new THREE.DirectionalLight(0xffd4e0, 3);
    key.position.set(-3, 8, 5);
    this.scene.add(key);

    const material = (color: number) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.95,
        flatShading: true,
      });
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(4.6, 4.8, 0.32, 48),
      material(0xb0a0db),
    );
    platform.position.y = -0.17;
    this.scene.add(platform);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(4.45, 0.045, 5, 64),
      new THREE.MeshBasicMaterial({ color: 0xffc5da }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.025;
    this.scene.add(rim);

    const leafGeometry = new THREE.IcosahedronGeometry(1, 1);
    const leafMaterials = [
      material(0xd28ab3),
      material(0x9175b1),
      material(0xbc94d2),
    ];
    const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.13, 2.7, 5);
    const trunkMaterial = material(0x746088);
    for (let i = 0; i < 6; i++) {
      const x = (i < 3 ? -1 : 1) * (3.3 + (i % 3) * 0.55);
      const z = -1.6 - (i % 3) * 0.8;
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(x, 0.9, z);
      this.scene.add(trunk);
      const leaf = new THREE.Mesh(leafGeometry, leafMaterials[i % 3]);
      leaf.position.set(x, 2.5, z);
      leaf.scale.set(0.9, 1.3, 0.9);
      this.scene.add(leaf);
    }

    const heart = new THREE.Shape();
    heart.moveTo(0, -0.5);
    heart.bezierCurveTo(-1.4, 0.4, -0.5, 1.3, 0, 0.65);
    heart.bezierCurveTo(0.5, 1.3, 1.4, 0.4, 0, -0.5);
    const heartGeometry = new THREE.ShapeGeometry(heart);
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(
        heartGeometry,
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0xffc3d9 : 0xffe5ac,
          side: THREE.DoubleSide,
        }),
      );
      mesh.position.set(Math.sin(i * 2.4) * 4.1, 2.5 + (i % 3) * 0.6, -2.5);
      mesh.scale.setScalar(i === 0 ? 0.6 : 0.12);
      this.hearts.push(mesh);
      this.scene.add(mesh);
    }
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xffedba }),
    );
    moon.position.set(2.9, 4.1, -4);
    this.scene.add(moon);
    const moonCut = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0x30283f }),
    );
    moonCut.position.set(3.16, 4.25, -3.7);
    this.scene.add(moonCut);

    const points = new Float32Array(70 * 3);
    for (let i = 0; i < 70; i++) {
      points[i * 3] = Math.sin(i * 127.1) * 7;
      points[i * 3 + 1] = 1 + Math.abs(Math.sin(i * 311.7)) * 5;
      points[i * 3 + 2] = -4 - (i % 5);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
    this.stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: 0xffefd8, size: 0.055 }),
    );
    this.scene.add(this.stars);

    const loader = new THREE.TextureLoader();
    const characters = [
      { name: "maycon", x: -2.0, size: 4.1, ratio: 508 / 1024 },
      { name: "ranna", x: 0, size: 4.6, ratio: 588 / 1024 },
      { name: "cebolinha", x: 2, size: 3.8, ratio: 440 / 1024 },
    ];
    for (const character of characters) {
      const texture = loader.load(
        `/art/${character.name}.webp`,
        undefined,
        undefined,
        () => canvas.parentElement?.classList.add("art-fallback"),
      );
      texture.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
        }),
      );
      sprite.center.set(0.5, 0.055);
      sprite.position.set(
        character.x,
        0.07,
        character.name === "ranna" ? 0.7 : 0.3,
      );
      sprite.scale.set(character.size * character.ratio, character.size, 1);
      sprite.userData.base = sprite.scale.clone();
      this.dancers.push(sprite);
      this.scene.add(sprite);
    }
    this.observer = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      this.camera.aspect = width / height;
      this.camera.position.z = Math.max(9, 9 / this.camera.aspect);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    });
    this.observer.observe(canvas);
  }

  celebrate() {
    this.glow = 1;
  }
  render(time: number, bpm: number, playing: boolean) {
    const beat = ((time * bpm) / 60) * Math.PI * 2;
    this.glow *= 0.91;
    this.dancers.forEach((sprite, i) => {
      const bounce = this.reduced
        ? 0
        : Math.max(0, Math.sin(beat + i * 0.55)) * (playing ? 0.1 : 0.035);
      sprite.position.y = 0.07 + bounce;
      sprite.material.rotation = this.reduced
        ? 0
        : Math.sin(beat * 0.5 + i) * (playing ? 0.045 : 0.018);
      sprite.scale
        .copy(sprite.userData.base)
        .multiplyScalar(1 + (this.reduced ? 0 : this.glow * 0.035));
    });
    this.hearts.forEach((heart, i) => {
      if (!this.reduced) heart.rotation.z = Math.sin(time + i) * 0.1;
    });
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.observer.disconnect();
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      if (mesh.material)
        for (const mat of Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]) {
          (mat as THREE.SpriteMaterial).map?.dispose();
          mat.dispose();
        }
    });
    this.renderer.dispose();
  }
}
