import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Table } from '../../types';

interface Tables3DPlanProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
  selectedTableId?: string | null;
}

export function Tables3DPlan({ tables, onSelectTable, selectedTableId }: Tables3DPlanProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const tablesRef = useRef<Table[]>(tables);
  tablesRef.current = tables;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18181b);

    // Isometric-angle camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(10, 14, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    dirLight.position.set(12, 18, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Hall Floor
    const floorGeo = new THREE.PlaneGeometry(16, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Grid markings
    const grid = new THREE.GridHelper(16, 16, 0x3f3f46, 0x3f3f46);
    grid.position.y = 0.01;
    scene.add(grid);

    // Table Meshes mapping
    const tableMeshGroup = new THREE.Group();
    scene.add(tableMeshGroup);

    const meshToTableId = new Map<THREE.Object3D, Table>();

    // Geometries
    const tableTopGeoRound = new THREE.CylinderGeometry(0.85, 0.85, 0.1, 24);
    const tableTopGeoRect = new THREE.BoxGeometry(1.6, 0.1, 1.1);
    const tableLegGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 12);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.2 });

    const freeMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
    const occupiedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const selectedMat = new THREE.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.2, emissive: 0xff5a1f, emissiveIntensity: 0.3 });

    // Chair geometry
    const chairSeatGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 16);
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.5 });

    tablesRef.current.forEach((tbl, idx) => {
      const group = new THREE.Group();

      const cols = 4;
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = (col - 1.5) * 3.4;
      const z = (row - 1.5) * 2.6;

      group.position.set(x, 0, z);

      // Tabletop
      const isSelected = tbl.id === selectedTableId;
      const material = isSelected ? selectedMat : tbl.is_occupied ? occupiedMat : freeMat;
      const isRect = tbl.seats >= 6;
      const topMesh = new THREE.Mesh(isRect ? tableTopGeoRect : tableTopGeoRound, material);
      topMesh.position.y = 0.85;
      topMesh.castShadow = true;
      group.add(topMesh);

      // Central leg / base
      const leg = new THREE.Mesh(tableLegGeo, legMat);
      leg.position.y = 0.4;
      group.add(leg);

      // Surrounding chairs
      const chairCount = Math.min(tbl.seats, 6);
      for (let c = 0; c < chairCount; c++) {
        const rad = 1.1;
        const angle = (c / chairCount) * Math.PI * 2;
        const chair = new THREE.Mesh(chairSeatGeo, chairMat);
        chair.position.set(Math.cos(angle) * rad, 0.45, Math.sin(angle) * rad);
        group.add(chair);
      }

      tableMeshGroup.add(group);
      meshToTableId.set(topMesh, tbl);
    });

    // Raycasting for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(tableMeshGroup.children, true);

      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (current && !meshToTableId.has(current)) {
          current = current.parent;
        }
        if (current && meshToTableId.has(current)) {
          const tbl = meshToTableId.get(current);
          if (tbl) {
            onSelectTable(tbl);
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Subtle gentle float/rotation animation
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Slow pan
      camera.position.x = 10 + Math.sin(elapsed * 0.15) * 0.8;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
    };
  }, [tables, onSelectTable, selectedTableId]);

  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden relative border border-stone-800 bg-[#18181B] shadow-inner">
      <div
        ref={mountRef}
        className="w-full h-full cursor-pointer"
        aria-label="3D Izometrik stollar xaritasi"
      />
      <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-700/60 text-xs text-stone-200 flex items-center gap-4 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Boʻsh stol
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Band stol
        </span>
        <span className="text-stone-400">Stol ustiga bosing</span>
      </div>
    </div>
  );
}
