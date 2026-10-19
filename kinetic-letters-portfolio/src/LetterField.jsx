import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json';

const PALETTE = ['#D8FF65', '#FF775E', '#A5A0FF', '#7DD9F8', '#F4F1E8', '#FFA7D7'];
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Original 3D typographic playground.
 * Scrolling adds impulses, letters collide and bounce, and the pointer gently
 * pushes nearby glyphs away. It is intentionally independent of the paid reference.
 */
export default function LetterField() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let disposed = false;
    let raf = 0;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 13.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdbe7ff, 0x28202e, 2.0));
    const key = new THREE.DirectionalLight(0xfff2dc, 3.2);
    key.position.set(-4, 7, 8);
    scene.add(key);
    const rim = new THREE.PointLight(0x8075ff, 23, 26, 2);
    rim.position.set(6, 2, -1);
    scene.add(rim);
    const warm = new THREE.PointLight(0xff744f, 14, 21, 2);
    warm.position.set(-7, -2, 3);
    scene.add(warm);

    const font = new FontLoader().parse(fontData);
    const letterGroup = new THREE.Group();
    scene.add(letterGroup);
    const bodies = [];
    const mobile = window.matchMedia('(max-width: 680px)').matches;
    const count = mobile ? 25 : 39;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    for (let i = 0; i < count; i += 1) {
      const glyph = CHARS[Math.floor(Math.random() * CHARS.length)];
      const size = 0.52 + Math.random() * 0.47;
      const depth = 0.14 + Math.random() * 0.1;
      const geometry = new TextGeometry(glyph, {
        font,
        size,
        depth,
        curveSegments: 7,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.022,
        bevelSegments: 3,
      });
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);

      const color = new THREE.Color(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
      const front = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.28 + Math.random() * 0.24,
        metalness: 0.12,
      });
      const side = new THREE.MeshStandardMaterial({
        color: color.clone().multiplyScalar(0.62),
        roughness: 0.36,
        metalness: 0.22,
      });
      const mesh = new THREE.Mesh(geometry, [front, side]);
      mesh.castShadow = false;
      mesh.frustumCulled = true;

      // A loose, slightly denser central field, so the scene has a composed starting pose.
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random());
      const home = new THREE.Vector3(
        Math.cos(angle) * radius * (mobile ? 4.1 : 6.4),
        Math.sin(angle) * radius * 2.65,
        (Math.random() - 0.5) * 3.0,
      );
      mesh.position.copy(home);
      mesh.rotation.set(
        (Math.random() - 0.5) * 0.42,
        (Math.random() - 0.5) * 0.65,
        (Math.random() - 0.5) * 0.5,
      );
      letterGroup.add(mesh);
      bodies.push({
        mesh,
        home,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.055,
          (Math.random() - 0.5) * 0.055,
          (Math.random() - 0.5) * 0.035,
        ),
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 0.42,
          (Math.random() - 0.5) * 0.42,
          (Math.random() - 0.5) * 0.42,
        ),
        radius: size * 0.58,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Fine, low-contrast dust gives depth without making the typography hard to read.
    const dustPositions = new Float32Array(210 * 3);
    for (let i = 0; i < dustPositions.length; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 26;
      dustPositions[i + 1] = (Math.random() - 0.5) * 15;
      dustPositions[i + 2] = -3 - Math.random() * 6;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({ color: 0xaaaac4, size: 0.018, transparent: true, opacity: 0.44 }),
    );
    scene.add(dust);

    const pointer = { x: 999, y: 999, active: false };
    const pointerWorld = new THREE.Vector3();
    let scrollBurst = 0;
    let scrollDirection = 1;
    let latestScrollY = window.scrollY;
    let scrollProgress = 0;
    let lastTime = performance.now();
    const projectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();

    const dimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const vHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      return { width, height, worldWidth: vHeight * (width / height), worldHeight: vHeight };
    };

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    };

    const onPointerMove = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => { pointer.active = false; };
    const onScroll = () => {
      const current = window.scrollY;
      const delta = current - latestScrollY;
      latestScrollY = current;
      scrollDirection = delta >= 0 ? 1 : -1;
      scrollProgress = clamp(current / Math.max(1, document.documentElement.scrollHeight - window.innerHeight), 0, 1);
      if (!reducedMotion && Math.abs(delta) > 0.5) {
        scrollBurst = Math.min(2.25, scrollBurst + Math.abs(delta) / 205);
      }
    };

    const collide = () => {
      for (let i = 0; i < bodies.length; i += 1) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j += 1) {
          const b = bodies[j];
          const dx = b.mesh.position.x - a.mesh.position.x;
          const dy = b.mesh.position.y - a.mesh.position.y;
          const dz = b.mesh.position.z - a.mesh.position.z;
          const minDist = (a.radius + b.radius) * 0.84;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 <= 0.0001 || d2 >= minDist * minDist) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const nz = dz / d;
          const overlap = (minDist - d) * 0.5;
          a.mesh.position.x -= nx * overlap;
          a.mesh.position.y -= ny * overlap;
          a.mesh.position.z -= nz * overlap;
          b.mesh.position.x += nx * overlap;
          b.mesh.position.y += ny * overlap;
          b.mesh.position.z += nz * overlap;
          const relative = (b.velocity.x - a.velocity.x) * nx
            + (b.velocity.y - a.velocity.y) * ny
            + (b.velocity.z - a.velocity.z) * nz;
          if (relative < 0) {
            const impulse = -(1 + 0.72) * relative * 0.5;
            a.velocity.x -= impulse * nx;
            a.velocity.y -= impulse * ny;
            a.velocity.z -= impulse * nz;
            b.velocity.x += impulse * nx;
            b.velocity.y += impulse * ny;
            b.velocity.z += impulse * nz;
          }
        }
      }
    };

    const animate = (now) => {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      const step = dt * 60;
      const { worldWidth, worldHeight } = dimensions();

      // The camera tracks page progress subtly, while scroll impulses scatter the letters.
      camera.position.x += (Math.sin(scrollProgress * Math.PI * 1.6) * 0.48 - camera.position.x) * 0.018 * step;
      camera.position.y += (-scrollProgress * 0.55 - camera.position.y) * 0.018 * step;
      camera.rotation.z = Math.sin(scrollProgress * Math.PI * 1.3) * 0.018;
      dust.rotation.z = scrollProgress * 0.035;

      const kick = scrollBurst;
      if (kick > 0.005 && !reducedMotion) {
        bodies.forEach((body, index) => {
          const p = body.mesh.position;
          const outward = new THREE.Vector3(p.x, p.y + 0.15, p.z * 0.65 + (Math.random() - 0.5) * 1.4);
          if (outward.lengthSq() < 0.2) outward.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
          outward.normalize();
          const amount = Math.min(0.95, kick * 0.115) * (0.7 + Math.random() * 0.65);
          body.velocity.add(outward.multiplyScalar(amount));
          body.velocity.y += scrollDirection * amount * 0.2;
          body.velocity.z += (Math.random() - 0.5) * amount * 0.75;
          body.spin.x += (Math.random() - 0.5) * amount * 0.52;
          body.spin.y += (Math.random() - 0.5) * amount * 0.68;
        });
        scrollBurst *= Math.pow(0.88, step);
      } else {
        scrollBurst = 0;
      }

      if (pointer.active && !reducedMotion) {
        const ndc = new THREE.Vector2((pointer.x / window.innerWidth) * 2 - 1, -(pointer.y / window.innerHeight) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        raycaster.ray.intersectPlane(projectPlane, pointerWorld);
        bodies.forEach((body) => {
          const dx = body.mesh.position.x - pointerWorld.x;
          const dy = body.mesh.position.y - pointerWorld.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 5.2 && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const strength = (1 - dist / Math.sqrt(5.2)) * 0.032 * step;
            body.velocity.x += (dx / dist) * strength;
            body.velocity.y += (dy / dist) * strength;
            body.velocity.z += 0.005 * step;
          }
        });
      }

      bodies.forEach((body) => {
        const mesh = body.mesh;
        const v = body.velocity;
        if (!reducedMotion) {
          // Gentle gravity and tiny home spring produce a lively settle between scrolls.
          v.y -= 0.0017 * step;
          v.x += (body.home.x - mesh.position.x) * 0.0008 * step;
          v.y += (body.home.y - mesh.position.y) * 0.00055 * step;
          v.multiplyScalar(Math.pow(0.988, step));
          mesh.position.addScaledVector(v, step);
          mesh.rotation.x += body.spin.x * 0.0015 * step;
          mesh.rotation.y += body.spin.y * 0.0015 * step;
          mesh.rotation.z += body.spin.z * 0.0012 * step;
        }

        const halfW = worldWidth * 0.5 - body.radius * 0.52;
        const halfH = worldHeight * 0.5 - body.radius * 0.55;
        const halfD = 3.1;
        if (mesh.position.x > halfW) { mesh.position.x = halfW; v.x = -Math.abs(v.x) * 0.78; }
        if (mesh.position.x < -halfW) { mesh.position.x = -halfW; v.x = Math.abs(v.x) * 0.78; }
        if (mesh.position.y > halfH) { mesh.position.y = halfH; v.y = -Math.abs(v.y) * 0.78; }
        if (mesh.position.y < -halfH) { mesh.position.y = -halfH; v.y = Math.abs(v.y) * 0.78; }
        if (mesh.position.z > halfD) { mesh.position.z = halfD; v.z = -Math.abs(v.z) * 0.72; }
        if (mesh.position.z < -halfD) { mesh.position.z = -halfD; v.z = Math.abs(v.z) * 0.72; }
      });

      if (!reducedMotion) collide();
      renderer.render(scene, camera);
    };

    onScroll();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('scroll', onScroll);
      bodies.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => material.dispose());
      });
      dustGeometry.dispose();
      dust.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="letter-field" ref={hostRef} aria-hidden="true" />;
}
