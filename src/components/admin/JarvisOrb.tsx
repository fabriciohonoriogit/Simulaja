import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface JarvisOrbProps {
  state?: OrbState;
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
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      {/* Outer glow rings */}
      <div
        className={`absolute inset-[10%] rounded-full bg-gradient-to-br ${style.from} ${style.to} opacity-20 blur-2xl animate-pulse ${style.duration}`}
      />
      <div
        className={`absolute inset-[20%] rounded-full bg-gradient-to-br ${style.from} ${style.to} opacity-30 blur-xl animate-pulse ${style.duration}`}
        style={{ animationDelay: "0.5s" }}
      />

      {/* Main orb */}
      <div
        className={`relative w-[55%] aspect-square rounded-full bg-gradient-to-br ${style.from} ${style.to} shadow-2xl ${style.shadow} animate-pulse ${style.duration}`}
      >
        {/* Inner highlight */}
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] rounded-full bg-white/30 blur-md" />
        {/* Rotating ring */}
        <div className="absolute -inset-[15%] rounded-full border border-white/10 animate-spin" style={{ animationDuration: "8s" }} />
        <div className="absolute -inset-[25%] rounded-full border border-white/5 animate-spin" style={{ animationDuration: "12s", animationDirection: "reverse" }} />
      </div>

      {/* Floating particles */}
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

export function JarvisOrb({ state = "idle" }: JarvisOrbProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  // Guardamos refs dos objetos mutáveis da cena
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);
  const electronsRef = useRef<THREE.Points | null>(null);
  const targetStateRef = useRef<OrbState>(state);

  // Animação/Valores
  const animRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // "Alvos" de lerp
  const currentRadius = useRef(1.5);
  const currentColor = useRef(new THREE.Color("#4ca8e8"));
  const currentSpeed = useRef(0.5);
  const currentScale = useRef(1.0);

  // Geometria
  const particleCount = 2000;

  useEffect(() => {
    targetStateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!mountRef.current) return;
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = mountRef.current;

    try {
      // Configurações Three.js
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Câmera
      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.z = 4;
      cameraRef.current = camera;

      // Renderer
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

      // Posições base das partículas em uma esfera
      const positions = new Float32Array(particleCount * 3);
      const basePositions = new Float32Array(particleCount * 3);
      const randomOffsets = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        // Posição aleatória na superfície da esfera usando coordenadas esféricas
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
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('basePosition', new THREE.BufferAttribute(basePositions, 3));
      geometry.setAttribute('randomOffset', new THREE.BufferAttribute(randomOffsets, 3));

      // Material dos pontos
      const pointsMaterial = new THREE.PointsMaterial({
        color: 0x4ca8e8,
        size: 0.03,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });

      const points = new THREE.Points(geometry, pointsMaterial);
      scene.add(points);
      pointsRef.current = points;

      // Linhas
      const linesGeometry = new THREE.BufferGeometry();
      const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x4ca8e8,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
      });
      const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
      scene.add(lines);
      linesRef.current = lines;

      // Elétrons
      const electronCount = 3;
      const ePositions = new Float32Array(electronCount * 3);
      const eGeometry = new THREE.BufferGeometry();
      eGeometry.setAttribute('position', new THREE.BufferAttribute(ePositions, 3));
      const eMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.08,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      const electrons = new THREE.Points(eGeometry, eMaterial);
      scene.add(electrons);
      electronsRef.current = electrons;

      // Handle resize
      const handleResize = () => {
        if (!container || !camera || !renderer) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener('resize', handleResize);

      // Loop de animação
      const animate = () => {
        animRef.current = requestAnimationFrame(animate);
        timeRef.current += 0.016; // ~60fps step

        const st = targetStateRef.current;

        // Determina alvos baseados no estado
        let targetRadius = 1.5;
        let targetColorHex = "#4ca8e8";
        let targetSpeed = 0.5;
        let targetScale = 1.0;

        if (st === "idle") {
          targetRadius = 1.5;
          targetColorHex = "#4ca8e8";
          targetSpeed = 0.5;
        } else if (st === "listening") {
          targetRadius = 1.2;
          targetColorHex = "#4ca8e8";
          targetSpeed = 1.0;
        } else if (st === "thinking") {
          targetRadius = 1.0;
          targetColorHex = "#6ec4ff";
          targetSpeed = 2.5;
        } else if (st === "speaking") {
          targetRadius = 1.3;
          targetColorHex = "#5ab8f0";
          targetSpeed = 1.5;
          // Pulsação suave se estiver falando (1.3 a 1.45)
          targetScale = 1.0 + Math.sin(timeRef.current * 8) * 0.08;
        }

        // Lerp (interpolação)
        currentRadius.current += (targetRadius - currentRadius.current) * 0.05;
        currentSpeed.current += (targetSpeed - currentSpeed.current) * 0.05;
        currentScale.current += (targetScale - currentScale.current) * 0.1;

        const targetCol = new THREE.Color(targetColorHex);
        currentColor.current.lerp(targetCol, 0.05);

        // Atualiza cores
        pointsMaterial.color.copy(currentColor.current);
        linesMaterial.color.copy(currentColor.current);

        // Atualiza rotação
        points.rotation.y += 0.005 * currentSpeed.current;
        points.rotation.x += 0.002 * currentSpeed.current;
        points.scale.set(currentScale.current, currentScale.current, currentScale.current);

        lines.rotation.copy(points.rotation);
        lines.scale.copy(points.scale);

        electrons.rotation.copy(points.rotation);
        electrons.scale.copy(points.scale);

        // Anima posições com "ruído"
        const posAttr = geometry.getAttribute('position');
        const baseAttr = geometry.getAttribute('basePosition');
        const offAttr = geometry.getAttribute('randomOffset');

        // Limite de conexões e cálculo
        const positionsArray = posAttr.array as Float32Array;
        const baseArray = baseAttr.array as Float32Array;
        const offArray = offAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;

          // Movimento flutuante
          const xOff = Math.sin(timeRef.current * 2 + offArray[i3]) * 0.1 * currentSpeed.current;
          const yOff = Math.cos(timeRef.current * 2.5 + offArray[i3+1]) * 0.1 * currentSpeed.current;
          const zOff = Math.sin(timeRef.current * 1.5 + offArray[i3+2]) * 0.1 * currentSpeed.current;

          positionsArray[i3] = baseArray[i3] * currentRadius.current + xOff;
          positionsArray[i3+1] = baseArray[i3+1] * currentRadius.current + yOff;
          positionsArray[i3+2] = baseArray[i3+2] * currentRadius.current + zOff;
        }

        posAttr.needsUpdate = true;

        // Atualiza linhas (apenas se thinking ou listening para economizar)
        if (st === "thinking" || st === "listening" || timeRef.current % 0.1 < 0.02) {
          let maxConnectDistance = 0.3;
          if (st === "thinking") maxConnectDistance = 0.45;
          if (st === "idle") maxConnectDistance = 0.2;

          const lineIndices = [];
          let eIndex = 0;
          const electronArr = eGeometry.getAttribute('position').array as Float32Array;

          // O(n^2) simplificado, testar apenas um subconjunto a cada frame
          const pCount = st === "thinking" ? 400 : 200;

          for (let i = 0; i < pCount; i++) {
            for (let j = i + 1; j < pCount; j++) {
              const dx = positionsArray[i*3] - positionsArray[j*3];
              const dy = positionsArray[i*3+1] - positionsArray[j*3+1];
              const dz = positionsArray[i*3+2] - positionsArray[j*3+2];
              const distSq = dx*dx + dy*dy + dz*dz;

              if (distSq < maxConnectDistance * maxConnectDistance) {
                lineIndices.push(i, j);

                // Elétrons pulando (só no thinking/speaking)
                if ((st === "thinking" || st === "speaking") && eIndex < electronCount && Math.random() > 0.99) {
                  const lerpFactor = (Math.sin(timeRef.current * 15) + 1) / 2; // 0 to 1
                  electronArr[eIndex*3] = positionsArray[i*3] + dx * lerpFactor;
                  electronArr[eIndex*3+1] = positionsArray[i*3+1] + dy * lerpFactor;
                  electronArr[eIndex*3+2] = positionsArray[i*3+2] + dz * lerpFactor;
                  eIndex++;
                }
              }
            }
          }

          linesGeometry.setIndex(lineIndices);
          eGeometry.getAttribute('position').needsUpdate = true;
        }

        try {
          renderer.render(scene, camera);
        } catch (e) {
          console.warn("Erro de renderização WebGL:", e);
        }
      };

      animate();

      return () => {
        window.removeEventListener('resize', handleResize);
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

  if (!hasWebGL) {
    return <FallbackOrb state={state} />;
  }

  return <div ref={mountRef} className="w-full h-full relative" />;
}
