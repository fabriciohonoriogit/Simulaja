import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type OrbTheme = "cobalt" | "flame" | "emerald";
export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface JarvisOrbProps {
  state?: OrbState;
  theme?: OrbTheme;
  statusText?: string;
  subStatusText?: string;
  showOverlay?: boolean;
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

const themeColors: Record<OrbTheme, Record<OrbState, string>> = {
  cobalt: {
    idle: "#4ca8e8",      // Classic Blue
    listening: "#2dd4bf", // Teal
    thinking: "#6ec4ff",  // Electric Cyan / Violet
    speaking: "#5ab8f0",  // Pulsing Bright Blue
  },
  flame: {
    idle: "#f59e0b",
    listening: "#f97316",
    thinking: "#ef4444",
    speaking: "#fbbf24",
  },
  emerald: {
    idle: "#10b981",
    listening: "#34d399",
    thinking: "#84cc16",
    speaking: "#06b6d4",
  },
};

const stateStyles: Record<OrbState, { from: string; to: string; shadow: string; duration: string }> = {
  idle: {
    from: "from-[#4ca8e8]",
    to: "to-[#1a5f9e]",
    shadow: "shadow-[#4ca8e8]/40",
    duration: "duration-[3000ms]",
  },
  listening: {
    from: "from-[#4ca8e8]",
    to: "to-[#2dd4bf]",
    shadow: "shadow-[#4ca8e8]/60",
    duration: "duration-[1500ms]",
  },
  thinking: {
    from: "from-[#6ec4ff]",
    to: "to-[#a855f7]",
    shadow: "shadow-[#6ec4ff]/70",
    duration: "duration-[800ms]",
  },
  speaking: {
    from: "from-[#5ab8f0]",
    to: "to-[#3b82f6]",
    shadow: "shadow-[#5ab8f0]/60",
    duration: "duration-[1200ms]",
  },
};

function FallbackOrb({ state = "idle" }: { state?: OrbState }) {
  const style = stateStyles[state] || stateStyles.idle;

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden min-h-[250px]">
      <div
        className={`absolute inset-[10%] rounded-full bg-gradient-to-br ${style.from} ${style.to} opacity-20 blur-2xl animate-pulse ${style.duration}`}
      />
      <div
        className={`absolute inset-[20%] rounded-full bg-gradient-to-br ${style.from} ${style.to} opacity-30 blur-xl animate-pulse ${style.duration}`}
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className={`relative w-[55%] max-w-[200px] aspect-square rounded-full bg-gradient-to-br ${style.from} ${style.to} shadow-2xl ${style.shadow} animate-pulse ${style.duration}`}
      >
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] rounded-full bg-white/30 blur-md" />
        <div className="absolute -inset-[15%] rounded-full border border-white/10 animate-spin" style={{ animationDuration: "8s" }} />
        <div className="absolute -inset-[25%] rounded-full border border-white/5 animate-spin" style={{ animationDuration: "12s", animationDirection: "reverse" }} />
      </div>

      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-1.5 h-1.5 rounded-full bg-gradient-to-br ${style.from} ${style.to} opacity-60 animate-ping`}
          style={{
            top: `${20 + (i * 12) % 60}%`,
            left: `${10 + (i * 17) % 80}%`,
            animationDuration: "2s",
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

export function JarvisOrb({
  state = "idle",
  theme = "cobalt",
  statusText = "NEURAL LINK ACTIVE",
  subStatusText,
  showOverlay = true,
}: JarvisOrbProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);
  const electronsRef = useRef<THREE.Points | null>(null);
  const targetStateRef = useRef<OrbState>(state);
  const targetThemeRef = useRef<OrbTheme>(theme);

  const animRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const currentRadius = useRef(1.5);
  const currentColor = useRef(new THREE.Color(themeColors[theme][state]));
  const currentSpeed = useRef(0.5);
  const currentScale = useRef(1.0);

  const particleCount = 2000;

  useEffect(() => {
    targetStateRef.current = state;
  }, [state]);

  useEffect(() => {
    targetThemeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    if (!mountRef.current) return;
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = mountRef.current;

    try {
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.z = 4;
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        console.warn("[JarvisOrb] Contexto WebGL perdido. Alternando para modo 2D.");
        setHasWebGL(false);
      };
      renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

      // Sphere Base Particles
      const positions = new Float32Array(particleCount * 3);
      const basePositions = new Float32Array(particleCount * 3);
      const randomOffsets = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;

        const x = Math.cos(theta) * Math.sin(phi);
        const y = Math.sin(theta) * Math.sin(phi);
        const z = Math.cos(phi);

        basePositions[i * 3] = x;
        basePositions[i * 3 + 1] = y;
        basePositions[i * 3 + 2] = z;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        randomOffsets[i * 3] = Math.random() * 2 * Math.PI;
        randomOffsets[i * 3 + 1] = Math.random() * 2 * Math.PI;
        randomOffsets[i * 3 + 2] = Math.random() * 2 * Math.PI;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("basePosition", new THREE.BufferAttribute(basePositions, 3));
      geometry.setAttribute("randomOffset", new THREE.BufferAttribute(randomOffsets, 3));

      const pointsMaterial = new THREE.PointsMaterial({
        color: new THREE.Color(themeColors[theme][state]),
        size: 0.03,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, pointsMaterial);
      scene.add(points);
      pointsRef.current = points;

      // Interconnecting lines
      const linesGeometry = new THREE.BufferGeometry();
      const linesMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(themeColors[theme][state]),
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
      });
      const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
      scene.add(lines);
      linesRef.current = lines;

      // Electrons / Energy sparks
      const electronCount = 3;
      const ePositions = new Float32Array(electronCount * 3);
      const eGeometry = new THREE.BufferGeometry();
      eGeometry.setAttribute("position", new THREE.BufferAttribute(ePositions, 3));
      const eMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.08,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const electrons = new THREE.Points(eGeometry, eMaterial);
      scene.add(electrons);
      electronsRef.current = electrons;

      const handleResize = () => {
        if (!container || !camera || !renderer) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener("resize", handleResize);

      const animate = () => {
        animRef.current = requestAnimationFrame(animate);
        timeRef.current += 0.016;

        const st = targetStateRef.current;
        const th = targetThemeRef.current;
        const colorHex = themeColors[th]?.[st] || themeColors.cobalt.idle;

        let targetRadius = 1.5;
        let targetSpeed = 0.5;
        let targetScale = 1.0;

        if (st === "idle") {
          targetRadius = 1.5;
          targetSpeed = 0.5;
        } else if (st === "listening") {
          targetRadius = 1.2;
          targetSpeed = 1.0;
        } else if (st === "thinking") {
          targetRadius = 1.0;
          targetSpeed = 2.5;
        } else if (st === "speaking") {
          targetRadius = 1.3;
          targetSpeed = 1.5;
          targetScale = 1.0 + Math.sin(timeRef.current * 8) * 0.08;
        }

        currentRadius.current += (targetRadius - currentRadius.current) * 0.05;
        currentSpeed.current += (targetSpeed - currentSpeed.current) * 0.05;
        currentScale.current += (targetScale - currentScale.current) * 0.1;

        const targetCol = new THREE.Color(colorHex);
        currentColor.current.lerp(targetCol, 0.05);

        pointsMaterial.color.copy(currentColor.current);
        linesMaterial.color.copy(currentColor.current);

        points.rotation.y += 0.005 * currentSpeed.current;
        points.rotation.x += 0.002 * currentSpeed.current;
        points.scale.set(currentScale.current, currentScale.current, currentScale.current);

        lines.rotation.copy(points.rotation);
        lines.scale.copy(points.scale);
        electrons.rotation.copy(points.rotation);
        electrons.scale.copy(points.scale);

        const posAttr = geometry.getAttribute("position");
        const baseAttr = geometry.getAttribute("basePosition");
        const offAttr = geometry.getAttribute("randomOffset");

        const positionsArray = posAttr.array as Float32Array;
        const baseArray = baseAttr.array as Float32Array;
        const offArray = offAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;

          const xOff = Math.sin(timeRef.current * 2 + offArray[i3]) * 0.1 * currentSpeed.current;
          const yOff = Math.cos(timeRef.current * 2.5 + offArray[i3 + 1]) * 0.1 * currentSpeed.current;
          const zOff = Math.sin(timeRef.current * 1.5 + offArray[i3 + 2]) * 0.1 * currentSpeed.current;

          positionsArray[i3] = baseArray[i3] * currentRadius.current + xOff;
          positionsArray[i3 + 1] = baseArray[i3 + 1] * currentRadius.current + yOff;
          positionsArray[i3 + 2] = baseArray[i3 + 2] * currentRadius.current + zOff;
        }

        posAttr.needsUpdate = true;

        if (st === "thinking" || st === "listening" || timeRef.current % 0.1 < 0.02) {
          let maxConnectDistance = 0.3;
          if (st === "thinking") maxConnectDistance = 0.45;
          if (st === "idle") maxConnectDistance = 0.2;

          const lineIndices = [];
          let eIndex = 0;
          const electronArr = eGeometry.getAttribute("position").array as Float32Array;

          const pCount = st === "thinking" ? 400 : 200;

          for (let i = 0; i < pCount; i++) {
            for (let j = i + 1; j < pCount; j++) {
              const dx = positionsArray[i * 3] - positionsArray[j * 3];
              const dy = positionsArray[i * 3 + 1] - positionsArray[j * 3 + 1];
              const dz = positionsArray[i * 3 + 2] - positionsArray[j * 3 + 2];
              const distSq = dx * dx + dy * dy + dz * dz;

              if (distSq < maxConnectDistance * maxConnectDistance) {
                lineIndices.push(i, j);

                if ((st === "thinking" || st === "speaking") && eIndex < electronCount && Math.random() > 0.99) {
                  const lerpFactor = (Math.sin(timeRef.current * 15) + 1) / 2;
                  electronArr[eIndex * 3] = positionsArray[i * 3] + dx * lerpFactor;
                  electronArr[eIndex * 3 + 1] = positionsArray[i * 3 + 1] + dy * lerpFactor;
                  electronArr[eIndex * 3 + 2] = positionsArray[i * 3 + 2] + dz * lerpFactor;
                  eIndex++;
                }
              }
            }
          }

          linesGeometry.setIndex(lineIndices);
          eGeometry.getAttribute("position").needsUpdate = true;
        }

        try {
          renderer.render(scene, camera);
        } catch (e) {}
      };

      animate();

      return () => {
        window.removeEventListener("resize", handleResize);
        if (animRef.current) cancelAnimationFrame(animRef.current);
        try {
          geometry.dispose();
          pointsMaterial.dispose();
          linesGeometry.dispose();
          linesMaterial.dispose();
          eGeometry.dispose();
          eMaterial.dispose();
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        } catch (e) {}
      };
    } catch (err) {
      console.warn("WebGL initialization failed in JarvisOrb, falling back to CSS:", err);
      setHasWebGL(false);
    }
  }, []);

  const badgeGlowClass =
    theme === "flame"
      ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-amber-500/20"
      : theme === "emerald"
      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20"
      : "bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-cyan-500/20";

  const dotGlowClass =
    theme === "flame"
      ? "bg-amber-400 shadow-[0_0_10px_#f59e0b]"
      : theme === "emerald"
      ? "bg-emerald-400 shadow-[0_0_10px_#10b981]"
      : "bg-cyan-400 shadow-[0_0_10px_#38bdf8]";

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center">
      {!hasWebGL ? (
        <FallbackOrb state={state} />
      ) : (
        <div ref={mountRef} className="w-full h-full relative min-h-[300px]" />
      )}

      {showOverlay && (
        <div className="absolute bottom-4 flex flex-col items-center gap-1.5 z-10 pointer-events-none">
          <div className={`px-3 py-1 rounded-full border text-[11px] font-mono tracking-widest uppercase backdrop-blur-md flex items-center gap-2 shadow-lg transition-all ${badgeGlowClass}`}>
            <span className={`w-2 h-2 rounded-full animate-ping ${dotGlowClass}`} />
            <span>{statusText}</span>
          </div>

          {subStatusText && (
            <span className="text-[12px] text-cyan-200 font-medium tracking-wide bg-slate-950/80 px-3 py-0.5 rounded-md border border-cyan-900/50 backdrop-blur-md shadow-md animate-pulse">
              {subStatusText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
