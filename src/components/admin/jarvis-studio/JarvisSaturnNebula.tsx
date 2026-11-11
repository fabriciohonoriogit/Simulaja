import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbState, OrbEmotion } from "@/components/admin/JarvisOrb";

export interface OrbitalMoonData {
  id: string;
  name: string;
  subname: string;
  routineId: "radar" | "budget" | "whatsapp" | "flux" | "design";
  color: string;
  radius: number;
  speed: number;
  size: number;
  tilt: number;
  angle: number;
}

export interface JarvisSaturnNebulaProps {
  state?: OrbState;
  emotion?: OrbEmotion;
  audioAmplitude?: number; // 0.0 a 1.0
  audioBass?: number;
  audioTreble?: number;
  mode?: "saturn" | "nebula";
  onSelectRoutine?: (routineId: "radar" | "budget" | "whatsapp" | "flux" | "design") => void;
}

export const ORBITAL_ROUTINE_MOONS: OrbitalMoonData[] = [
  {
    id: "moon_radar",
    name: "Titã",
    subname: "Mineração & Radar de Leads",
    routineId: "radar",
    color: "#F59E0B",
    radius: 4.8,
    speed: 0.65,
    size: 0.30,
    tilt: 0.18,
    angle: 0.8,
  },
  {
    id: "moon_budget",
    name: "Encélado",
    subname: "Simulador 50/50 Objetivo",
    routineId: "budget",
    color: "#00F2FE",
    radius: 5.8,
    speed: 0.48,
    size: 0.26,
    tilt: -0.12,
    angle: 2.4,
  },
  {
    id: "moon_whatsapp",
    name: "Reia",
    subname: "Inbox WhatsApp & Disparos",
    routineId: "whatsapp",
    color: "#10B981",
    radius: 6.8,
    speed: 0.35,
    size: 0.28,
    tilt: 0.22,
    angle: 4.2,
  },
  {
    id: "moon_flux",
    name: "Mimas",
    subname: "Estúdio Visual FLUX.1",
    routineId: "flux",
    color: "#EC4899",
    radius: 3.8,
    speed: 0.90,
    size: 0.22,
    tilt: -0.25,
    angle: 5.5,
  },
];

export function JarvisSaturnNebula({
  state = "idle",
  audioAmplitude = 0,
  audioBass = 0,
  audioTreble = 0,
  mode = "saturn",
  onSelectRoutine,
}: JarvisSaturnNebulaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const audioAmpRef = useRef(audioAmplitude);
  const audioBassRef = useRef(audioBass);
  const audioTrebleRef = useRef(audioTreble);
  const [currentMode, setCurrentMode] = useState<"saturn" | "nebula">(mode);
  const [hoveredMoon, setHoveredMoon] = useState<OrbitalMoonData | null>(null);
  const hoveredMoonRef = useRef<OrbitalMoonData | null>(null);

  useEffect(() => {
    stateRef.current = state;
    audioAmpRef.current = audioAmplitude;
    audioBassRef.current = audioBass;
    audioTrebleRef.current = audioTreble;
  }, [state, audioAmplitude, audioBass, audioTreble]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3.2, 9.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Raycaster para interação com os planetas orbitais
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Grupo Cósmico Central
    const cosmicGroup = new THREE.Group();
    cosmicGroup.rotation.z = THREE.MathUtils.degToRad(26.7);
    cosmicGroup.rotation.x = THREE.MathUtils.degToRad(14);
    scene.add(cosmicGroup);

    // ==========================================
    // 1. TEXTURA PROCEDURAL DO PLANETA CENTRAL
    // ==========================================
    const createBandedTexture = (isNebula: boolean) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.Texture();

      const grad = ctx.createLinearGradient(0, 0, 0, 512);

      if (isNebula) {
        grad.addColorStop(0.0, "#030408");
        grad.addColorStop(0.18, "#2e0854");
        grad.addColorStop(0.32, "#f59e0b");
        grad.addColorStop(0.48, "#fbbf24");
        grad.addColorStop(0.5, "#ffffff");
        grad.addColorStop(0.52, "#f59e0b");
        grad.addColorStop(0.7, "#8b5cf6");
        grad.addColorStop(0.88, "#18042b");
        grad.addColorStop(1.0, "#030408");
      } else {
        grad.addColorStop(0.0, "#020b17");
        grad.addColorStop(0.15, "#0b2545");
        grad.addColorStop(0.28, "#00f2fe");
        grad.addColorStop(0.38, "#1d4ed8");
        grad.addColorStop(0.48, "#8b5cf6");
        grad.addColorStop(0.52, "#f0f9ff");
        grad.addColorStop(0.65, "#0369a1");
        grad.addColorStop(0.78, "#00f2fe");
        grad.addColorStop(0.9, "#0f172a");
        grad.addColorStop(1.0, "#020b17");
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      for (let y = 0; y < 512; y += 4) {
        if (Math.random() > 0.4) {
          ctx.fillRect(0, y, 1024, Math.random() * 3);
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return texture;
    };

    // Esfera Central de Saturno
    const planetRadius = 1.45;
    const planetGeom = new THREE.SphereGeometry(planetRadius, 64, 64);
    const planetMat = new THREE.MeshStandardMaterial({
      map: createBandedTexture(currentMode === "nebula"),
      roughness: 0.3,
      metalness: 0.2,
    });
    const planetMesh = new THREE.Mesh(planetGeom, planetMat);
    cosmicGroup.add(planetMesh);

    // Atmosfera Fresnel Rim Glow
    const atmosphereGeom = new THREE.SphereGeometry(planetRadius * 1.06, 32, 32);
    const atmosphereMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        glowColor: { value: new THREE.Color("#00F2FE") },
        viewVector: { value: camera.position },
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity * 2.0;
          gl_FragColor = vec4(glow, intensity * 0.85);
        }
      `,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeom, atmosphereMat);
    cosmicGroup.add(atmosphereMesh);

    // ==========================================
    // 2. ANÉIS MAJESTOSOS DE SATURNO
    // ==========================================
    const createRingTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.Texture();

      const grad = ctx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0.0, "rgba(0, 0, 0, 0)");
      grad.addColorStop(0.15, "rgba(0, 242, 254, 0.25)");
      grad.addColorStop(0.28, "rgba(139, 92, 246, 0.8)");
      grad.addColorStop(0.48, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.55, "rgba(0, 0, 0, 0.0)");
      grad.addColorStop(0.60, "rgba(0, 0, 0, 0.0)");
      grad.addColorStop(0.68, "rgba(0, 242, 254, 0.85)");
      grad.addColorStop(0.85, "rgba(245, 158, 11, 0.7)");
      grad.addColorStop(0.95, "rgba(236, 72, 153, 0.4)");
      grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 64);

      for (let x = 120; x < 950; x += 3) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
          ctx.fillRect(x, 0, 1, 64);
        }
      }

      return new THREE.CanvasTexture(canvas);
    };

    const ringInnerRadius = 1.85;
    const ringOuterRadius = 3.55;
    const ringGeom = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 128);

    const pos = ringGeom.attributes.position;
    const uvs = ringGeom.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const u = (dist - ringInnerRadius) / (ringOuterRadius - ringInnerRadius);
      uvs.setXY(i, u, 0.5);
    }
    uvs.needsUpdate = true;

    const ringMat = new THREE.MeshBasicMaterial({
      map: createRingTexture(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    cosmicGroup.add(ringMesh);

    // ==========================================
    // 3. PLANETAS PEQUENOS ORBITAIS (ROTINAS IA)
    // ==========================================
    const moonMeshes: {
      data: OrbitalMoonData;
      mesh: THREE.Mesh;
      glow: THREE.Mesh;
      orbitLine: THREE.Line;
    }[] = [];

    ORBITAL_ROUTINE_MOONS.forEach((moon) => {
      // 3.1 Linha de Órbita Translúcida (Trilha)
      const orbitCurve = new THREE.EllipseCurve(
        0, 0,
        moon.radius, moon.radius,
        0, 2 * Math.PI,
        false,
        0
      );
      const orbitPoints = orbitCurve.getPoints(80);
      const orbitGeom = new THREE.BufferGeometry().setFromPoints(
        orbitPoints.map((p) => new THREE.Vector3(p.x, 0, p.y))
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(moon.color),
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
      });
      const orbitLine = new THREE.Line(orbitGeom, orbitMat);
      orbitLine.rotation.x = moon.tilt;
      cosmicGroup.add(orbitLine);

      // 3.2 Esfera do Planeta Orbital
      const moonGeom = new THREE.SphereGeometry(moon.size, 32, 32);
      const moonMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(moon.color),
        emissive: new THREE.Color(moon.color),
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.6,
      });
      const moonMesh = new THREE.Mesh(moonGeom, moonMat);
      moonMesh.userData = { moonData: moon };

      // 3.3 Halo de Brilho da Lua
      const glowGeom = new THREE.SphereGeometry(moon.size * 1.5, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(moon.color),
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glowMesh = new THREE.Mesh(glowGeom, glowMat);
      moonMesh.add(glowMesh);

      cosmicGroup.add(moonMesh);

      moonMeshes.push({
        data: moon,
        mesh: moonMesh,
        glow: glowMesh,
        orbitLine,
      });
    });

    // ==========================================
    // 4. NEBULOSA & PARTÍCULAS DE POEIRA ESTELAR
    // ==========================================
    const starCount = 1400;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const cCyan = new THREE.Color("#00F2FE");
    const cPurple = new THREE.Color("#8B5CF6");
    const cAmber = new THREE.Color("#F59E0B");

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.0 + Math.random() * 5.8;
      const spreadY = (Math.random() - 0.5) * 2.2;

      starPositions[idx] = Math.cos(angle) * radius;
      starPositions[idx + 1] = spreadY;
      starPositions[idx + 2] = Math.sin(angle) * radius;

      const rand = Math.random();
      const col = rand < 0.4 ? cCyan : rand < 0.75 ? cPurple : cAmber;
      starColors[idx] = col.r;
      starColors[idx + 1] = col.g;
      starColors[idx + 2] = col.b;
    }

    starGeom.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeom.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starField = new THREE.Points(starGeom, starMat);
    cosmicGroup.add(starField);

    // ==========================================
    // 5. ILUMINAÇÃO ESTELAR
    // ==========================================
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(7, 5, 6);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0a1428, 0.9);
    scene.add(ambientLight);

    const rimLight = new THREE.PointLight(0x8b5cf6, 2.5, 12);
    rimLight.position.set(-6, -3, -5);
    scene.add(rimLight);

    // ==========================================
    // 6. EVENTOS DE INTERAÇÃO (HOVER & CLICK)
    // ==========================================
    const interactiveMeshes = moonMeshes.map((m) => m.mesh);

    const onPointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, false);

      if (intersects.length > 0) {
        const hitMoon = (intersects[0].object as THREE.Mesh).userData?.moonData as OrbitalMoonData;
        if (hitMoon) {
          renderer.domElement.style.cursor = "pointer";
          setHoveredMoon(hitMoon);
          hoveredMoonRef.current = hitMoon;
          return;
        }
      }

      renderer.domElement.style.cursor = "default";
      setHoveredMoon(null);
      hoveredMoonRef.current = null;
    };

    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, false);

      if (intersects.length > 0) {
        const hitMoon = (intersects[0].object as THREE.Mesh).userData?.moonData as OrbitalMoonData;
        if (hitMoon && onSelectRoutine) {
          onSelectRoutine(hitMoon.routineId);
        }
      }
    };

    renderer.domElement.addEventListener("mousemove", onPointerMove);
    renderer.domElement.addEventListener("click", onClick);

    // ==========================================
    // 7. LOOP DE ANIMAÇÃO & MECÂNICA ORBITAL
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      const currentState = stateRef.current;
      const amp = audioAmpRef.current;

      // Velocidade do núcleo de acordo com o estado do Jarvis
      let rotationSpeed = 0.35;
      if (currentState === "thinking") rotationSpeed = 1.1;
      else if (currentState === "speaking") rotationSpeed = 0.7;
      else if (currentState === "listening") rotationSpeed = 0.2;

      planetMesh.rotation.y += delta * rotationSpeed;
      ringMesh.rotation.z += delta * (rotationSpeed * 0.4);
      starField.rotation.y += delta * (rotationSpeed * 0.2);

      // Movimentação orbital precisa de cada planeta pequeno ao redor de Saturno
      moonMeshes.forEach((item) => {
        const moon = item.data;
        moon.angle += delta * moon.speed * (currentState === "thinking" ? 1.6 : 1.0);

        const x = Math.cos(moon.angle) * moon.radius;
        const z = Math.sin(moon.angle) * moon.radius;
        const y = Math.sin(moon.angle * 1.5) * moon.tilt * 1.2;

        item.mesh.position.set(x, y, z);
        item.mesh.rotation.y += delta * 1.5;

        // Pulso suave se estiver em hover
        const isHovered = hoveredMoonRef.current?.id === moon.id;
        const targetScale = isHovered ? 1.4 : 1.0 + amp * 0.25;
        item.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      });

      // Reatividade sonora nos anéis
      const pulseScale = 1.0 + amp * 0.2;
      ringMesh.scale.set(pulseScale, pulseScale, pulseScale);
      starMat.size = 0.04 + amp * 0.03;

      // Cor da atmosfera do planeta central
      if (currentState === "listening") {
        atmosphereMat.uniforms.glowColor.value.set("#10B981");
      } else if (currentState === "thinking") {
        atmosphereMat.uniforms.glowColor.value.set("#F59E0B");
      } else if (currentState === "speaking") {
        atmosphereMat.uniforms.glowColor.value.set("#EC4899");
      } else {
        atmosphereMat.uniforms.glowColor.value.set("#00F2FE");
      }

      cosmicGroup.position.y = Math.sin(time * 1.2) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 360;
      const newH = container.clientHeight || 320;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousemove", onPointerMove);
      renderer.domElement.removeEventListener("click", onClick);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      planetGeom.dispose();
      planetMat.dispose();
      atmosphereGeom.dispose();
      atmosphereMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      starGeom.dispose();
      starMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [currentMode, onSelectRoutine]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Tooltip Holográfico Interativo ao Passar o Mouse sobre Luas */}
      {hoveredMoon && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-3.5 py-1.5 rounded-2xl bg-slate-950/90 border border-white/20 backdrop-blur-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 animate-fade-in-up">
          <div
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: hoveredMoon.color }}
          />
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>{hoveredMoon.name}</span>
              <span className="text-[10px] text-slate-400 font-normal">• {hoveredMoon.subname}</span>
            </div>
            <div className="text-[9px] font-mono text-cyan-300">
              Clique para abrir esta rotina no painel
            </div>
          </div>
        </div>
      )}

      {/* Canvas 3D */}
      <div ref={containerRef} className="w-full h-full min-h-[290px]" />

      {/* Pílulas Interativas das Rotinas Orbitais (1-Click na UI) */}
      <div className="absolute bottom-1 flex flex-wrap items-center justify-center gap-1.5 px-2 py-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl z-20 max-w-[95%]">
        {ORBITAL_ROUTINE_MOONS.map((moon) => (
          <button
            key={moon.id}
            onClick={() => onSelectRoutine?.(moon.routineId)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold text-slate-200 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 transition-all hover:scale-105 active:scale-95"
            style={{ borderLeftColor: moon.color, borderLeftWidth: 3 }}
            title={`Ativar rotina de ${moon.subname}`}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: moon.color }} />
            <span>{moon.name}</span>
          </button>
        ))}

        <div className="h-3 w-[1px] bg-white/20 mx-1 hidden sm:block" />

        <button
          onClick={() => setCurrentMode(currentMode === "saturn" ? "nebula" : "saturn")}
          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-300"
        >
          {currentMode === "saturn" ? "🪐 Saturno" : "✨ Nebulosa"}
        </button>
      </div>
    </div>
  );
}
