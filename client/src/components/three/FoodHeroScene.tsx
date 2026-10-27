import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function FoodHeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setHasWebGL(false);
      return;
    }

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Scene setup
    const scene = new THREE.Scene();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 6.2);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setHasWebGL(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff3e0, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xff7733, 2.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x40a9ff, 0.8);
    fillLight.position.set(-4, 3, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 5, -4);
    scene.add(rimLight);

    // Procedural composite dish group
    const dishGroup = new THREE.Group();
    scene.add(dishGroup);

    // 1. Ceramic Plate Base (National Uzbek Lagan shape)
    const plateGeo = new THREE.CylinderGeometry(2.3, 1.8, 0.16, 48);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.2,
      metalness: 0.1,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = -0.08;
    dishGroup.add(plate);

    // Plate inner gold rim ornament
    const rimGeo = new THREE.TorusGeometry(2.1, 0.05, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      metalness: 0.8,
      roughness: 0.25,
    });
    const plateRim = new THREE.Mesh(rimGeo, rimMat);
    plateRim.rotation.x = Math.PI / 2;
    dishGroup.add(plateRim);

    // 2. Golden Rice Mound (Palov pyramid dome)
    const riceDomeGeo = new THREE.SphereGeometry(1.7, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const riceDomeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.7,
      metalness: 0.05,
    });
    const riceDome = new THREE.Mesh(riceDomeGeo, riceDomeMat);
    riceDome.position.y = -0.15;
    dishGroup.add(riceDome);

    // 3. Succulent Meat Cubes (Lahm go'sht)
    const meatGeo = new THREE.BoxGeometry(0.38, 0.35, 0.38);
    const meatMat = new THREE.MeshStandardMaterial({
      color: 0x8b3a1a,
      roughness: 0.45,
      metalness: 0.1,
    });
    const meatPositions = [
      [0, 0.95, 0],
      [0.45, 0.8, 0.3],
      [-0.4, 0.82, 0.35],
      [0.3, 0.78, -0.4],
      [-0.45, 0.76, -0.25],
    ];
    meatPositions.forEach(([x, y, z]) => {
      const meat = new THREE.Mesh(meatGeo, meatMat);
      meat.position.set(x, y, z);
      meat.rotation.set(Math.random() * 0.5, Math.random() * 2, Math.random() * 0.5);
      dishGroup.add(meat);
    });

    // 4. Quail Egg on top
    const eggGeo = new THREE.SphereGeometry(0.2, 16, 16);
    eggGeo.scale(1, 1.25, 1);
    const eggMat = new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      roughness: 0.3,
    });
    const egg = new THREE.Mesh(eggGeo, eggMat);
    egg.position.set(0.1, 1.25, -0.1);
    egg.rotation.z = 0.2;
    dishGroup.add(egg);

    // 5. Red Uzbek Pepper / Garnish
    const chiliGeo = new THREE.ConeGeometry(0.12, 0.8, 16);
    const chiliMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.25,
      metalness: 0.1,
    });
    const chili = new THREE.Mesh(chiliGeo, chiliMat);
    chili.position.set(-0.35, 1.05, 0.15);
    chili.rotation.set(0.4, 0.2, -1.2);
    dishGroup.add(chili);

    // 6. Floating instanced spice/sparkle particles
    const particleCount = isSoftwareGl ? 20 : 65;
    const spiceGeo = new THREE.DodecahedronGeometry(0.06);
    const spiceMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      roughness: 0.3,
      metalness: 0.4,
    });
    const instancedSpices = new THREE.InstancedMesh(spiceGeo, spiceMat, particleCount);

    const dummy = new THREE.Object3D();
    const particleData: {
      origX: number;
      origY: number;
      origZ: number;
      speed: number;
      radius: number;
      angle: number;
      yOffset: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.3) * 3.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.7 + Math.random() * 0.9);
      dummy.updateMatrix();
      instancedSpices.setMatrixAt(i, dummy.matrix);

      particleData.push({
        origX: x,
        origY: y,
        origZ: z,
        speed: 0.003 + Math.random() * 0.006,
        radius,
        angle,
        yOffset: Math.random() * Math.PI * 2,
      });
    }
    instancedSpices.instanceMatrix.needsUpdate = true;
    scene.add(instancedSpices);

    // Mouse parallax variables
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetMouseX = x * 1.2;
      targetMouseY = y * 0.8;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Handle container resize
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth mouse damping
      currentMouseX = THREE.MathUtils.damp(currentMouseX, targetMouseX, 4, delta);
      currentMouseY = THREE.MathUtils.damp(currentMouseY, targetMouseY, 4, delta);

      // Rotate dish
      dishGroup.rotation.y = elapsed * 0.35 + currentMouseX;
      dishGroup.rotation.x = 0.28 + currentMouseY * 0.4;
      dishGroup.position.y = Math.sin(elapsed * 1.2) * 0.08;

      // Animate floating spices
      for (let i = 0; i < particleCount; i++) {
        const p = particleData[i];
        p.angle += p.speed;
        const x = Math.cos(p.angle) * p.radius;
        const z = Math.sin(p.angle) * p.radius;
        const y = p.origY + Math.sin(elapsed * 1.5 + p.yOffset) * 0.2;

        dummy.position.set(x, y, z);
        dummy.rotation.x = elapsed + i;
        dummy.rotation.y = elapsed * 0.5 + i;
        dummy.updateMatrix();
        instancedSpices.setMatrixAt(i, dummy.matrix);
      }
      instancedSpices.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  if (!hasWebGL) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-[#FF5A1F]/20 via-amber-200/30 to-orange-400/20 flex items-center justify-center p-8 backdrop-blur-md border border-orange-200/50 shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80"
            alt="TaomGo Osh"
            className="w-48 h-48 rounded-full object-cover shadow-xl ring-4 ring-[#FF5A1F]/30"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing flex items-center justify-center"
      aria-label="3D taom modeli va interaktiv animatsiya"
    />
  );
}
