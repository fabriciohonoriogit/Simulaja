import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbState, OrbEmotion } from "@/components/admin/JarvisOrb";

export interface JarvisSaturnNebulaProps {
  state?: OrbState;
  emotion?: OrbEmotion;
  audioAmplitude?: number; // 0.0 a 1.0
  audioBass?: number;
  audioTreble?: number;
  mode?: "saturn" | "nebula";
}

export function JarvisSaturnNebula({
  state = "idle",
  audioAmplitude = 0,
  audioBass = 0,
  audioTreble = 0,
  mode = "saturn",
}: JarvisSaturnNebulaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const audioAmpRef = useRef(audioAmplitude);
  const audioBassRef = useRef(audioBass);
  const audioTrebleRef = useRef(audioTreble);
  const [currentMode, setCurrentMode] = useState<"saturn" | "nebula">(mode);

  useEffect(() => {
    stateRef.current = state;
    audioAmpRef.current = audioAmplitude;
    audioBassRef.current = audioBass;
    audioTrebleRef.current = audioTreble;
  }, [state, audioAmplitude, audioBass, audioTreble]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensões do container
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // Cena, Câmera e Renderizador WebGL
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2.5, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Grupo Cósmico Central (com inclinação axial de Saturno: ~26.7 graus)
    const cosmicGroup = new THREE.Group();
    cosmicGroup.rotation.z = THREE.MathUtils.degToRad(26.7);
    cosmicGroup.rotation.x = THREE.MathUtils.degToRad(12);
    scene.add(cosmicGroup);

    // ==========================================
    // 1. GERAÇÃO DE TEXTURA PROCEDURAL DE SATURNO
    // ==========================================
    const createBandedTexture = (isNebula: boolean) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.Texture();

      // Gradiente de faixas atmosféricas procedurais
      const grad = ctx.createLinearGradient(0, 0, 0, 512);

      if (isNebula) {
        // Cores estilo Buraco Negro Dourado / Nebulosa
        grad.addColorStop(0.0, "#050711");
        grad.addColorStop(0.15, "#2b0a3d");
        grad.addColorStop(0.3, "#f59e0b");
        grad.addColorStop(0.48, "#fbbf24");
        grad.addColorStop(0.5, "#ffffff");
        grad.addColorStop(0.52, "#f59e0b");
        grad.addColorStop(0.7, "#8b5cf6");
        grad.addColorStop(0.85, "#3b0764");
        grad.addColorStop(1.0, "#050711");
      } else {
        // Cores de Saturno Cósmico Tecnológico
        grad.addColorStop(0.0, "#07172b");
        grad.addColorStop(0.12, "#0a2540");
        grad.addColorStop(0.24, "#00f2fe");
        grad.addColorStop(0.35, "#1e3a8a");
        grad.addColorStop(0.48, "#8b5cf6");
        grad.addColorStop(0.52, "#e0f2fe");
        grad.addColorStop(0.65, "#0284c7");
        grad.addColorStop(0.78, "#00f2fe");
        grad.addColorStop(0.9, "#0f172a");
        grad.addColorStop(1.0, "#050711");
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Ruído sutil nas faixas atmosféricas
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
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

    // ==========================================
    // 2. ESFERA PLANETÁRIA COM SHADER DE ATMOSFERA
    // ==========================================
    const planetRadius = 1.5;
    const planetGeom = new THREE.SphereGeometry(planetRadius, 64, 64);
    const planetTex = createBandedTexture(currentMode === "nebula");

    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.35,
      metalness: 0.25,
      bumpScale: 0.05,
    });
    const planetMesh = new THREE.Mesh(planetGeom, planetMat);
    cosmicGroup.add(planetMesh);

    // Brilho Atmosférico (Fresnel Glow) ao redor do planeta
    const atmosphereGeom = new THREE.SphereGeometry(planetRadius * 1.05, 32, 32);
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
          intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity * 1.8;
          gl_FragColor = vec4(glow, intensity * 0.75);
        }
      `,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeom, atmosphereMat);
    cosmicGroup.add(atmosphereMesh);

    // ==========================================
    // 3. ANÉIS MAJESTOSOS DE SATURNO (CASSINI DIVISION)
    // ==========================================
    const createRingTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.Texture();

      // Gradiente radial para os anéis com divisões escuras (Divisão de Cassini)
      const grad = ctx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0.0, "rgba(0, 0, 0, 0)"); // Vazio próximo ao planeta
      grad.addColorStop(0.15, "rgba(0, 242, 254, 0.2)"); // Início Anel C
      grad.addColorStop(0.25, "rgba(139, 92, 246, 0.7)"); // Anel B interno denso
      grad.addColorStop(0.48, "rgba(255, 255, 255, 0.95)"); // Anel B brilhante
      grad.addColorStop(0.55, "rgba(0, 0, 0, 0.05)"); // Divisão de Cassini
      grad.addColorStop(0.60, "rgba(0, 0, 0, 0)"); // Vazio Cassini
      grad.addColorStop(0.68, "rgba(0, 242, 254, 0.85)"); // Anel A
      grad.addColorStop(0.85, "rgba(245, 158, 11, 0.65)"); // Anel A externo
      grad.addColorStop(0.95, "rgba(236, 72, 153, 0.4)"); // Borda fina F
      grad.addColorStop(1.0, "rgba(0, 0, 0, 0)"); // Espaço profundo

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 64);

      // Estrias finas de poeira nos anéis
      for (let x = 150; x < 950; x += 3) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
          ctx.fillRect(x, 0, 1, 64);
        }
      }

      const ringTexture = new THREE.CanvasTexture(canvas);
      return ringTexture;
    };

    const ringInnerRadius = 1.9;
    const ringOuterRadius = 3.6;
    const ringGeom = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 128);

    // Ajuste das coordenadas UV do RingGeometry para mapeamento radial
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
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2; // Coloca no equador de Saturno
    cosmicGroup.add(ringMesh);

    // ==========================================
    // 4. NUVEM DE POEIRA ESTELAR & NEBULOSA CÓSMICA
    // ==========================================
    const starCount = 1200;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const color1 = new THREE.Color("#00F2FE");
    const color2 = new THREE.Color("#8B5CF6");
    const color3 = new THREE.Color("#F59E0B");

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      // Distribuição orbital toroidal
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.0 + Math.random() * 4.5;
      const spreadY = (Math.random() - 0.5) * 1.8;

      starPositions[idx] = Math.cos(angle) * radius;
      starPositions[idx + 1] = spreadY;
      starPositions[idx + 2] = Math.sin(angle) * radius;

      // Mistura gradiente de cores cósmicas
      const randColor = Math.random();
      const chosenColor = randColor < 0.45 ? color1 : randColor < 0.8 ? color2 : color3;
      starColors[idx] = chosenColor.r;
      starColors[idx + 1] = chosenColor.g;
      starColors[idx + 2] = chosenColor.b;
    }

    starGeom.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeom.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starField = new THREE.Points(starGeom, starMat);
    cosmicGroup.add(starField);

    // ==========================================
    // 5. ILUMINAÇÃO SOLAR CÓSMICA
    // ==========================================
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(6, 4, 5);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0a192f, 0.8);
    scene.add(ambientLight);

    const blueBackLight = new THREE.PointLight(0x8b5cf6, 2.0, 10);
    blueBackLight.position.set(-5, -2, -4);
    scene.add(blueBackLight);

    // ==========================================
    // 6. LOOP DE ANIMAÇÃO COM INTERATIVIDADE
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      const currentState = stateRef.current;
      const amp = audioAmpRef.current;

      // Velocidade de rotação de acordo com o estado do Jarvis
      let rotationSpeed = 0.35;
      if (currentState === "thinking") rotationSpeed = 1.2;
      else if (currentState === "speaking") rotationSpeed = 0.7;
      else if (currentState === "listening") rotationSpeed = 0.2;

      // Rotação do planeta em torno de seu próprio eixo
      planetMesh.rotation.y += delta * rotationSpeed;
      // Rotação lenta dos anéis
      ringMesh.rotation.z += delta * (rotationSpeed * 0.4);
      // Rotação da poeira estelar cósmica
      starField.rotation.y += delta * (rotationSpeed * 0.25);

      // Reatividade sonora ao vivo (modulação dos anéis e atmosfera)
      const pulseScale = 1.0 + amp * 0.22;
      ringMesh.scale.set(pulseScale, pulseScale, pulseScale);
      starMat.size = 0.045 + amp * 0.04;

      // Modula cor atmosférica de acordo com o estado
      if (currentState === "listening") {
        atmosphereMat.uniforms.glowColor.value.set("#10B981"); // Verde esmeralda ouvindo
      } else if (currentState === "thinking") {
        atmosphereMat.uniforms.glowColor.value.set("#F59E0B"); // Dourado pensando
      } else if (currentState === "speaking") {
        atmosphereMat.uniforms.glowColor.value.set("#EC4899"); // Magenta falando
      } else {
        atmosphereMat.uniforms.glowColor.value.set("#00F2FE"); // Ciano padrão
      }

      // Leve flutuação cósmica no grupo
      cosmicGroup.position.y = Math.sin(time * 1.2) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    // Redimensionamento responsivo
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 320;
      const newH = container.clientHeight || 320;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
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
  }, [currentMode]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Canvas 3D */}
      <div ref={containerRef} className="w-full h-full min-h-[260px] cursor-grab active:cursor-grabbing" />

      {/* Seletor Cósmico de Estilo (Saturno vs Nebulosa Dourada) */}
      <div className="absolute bottom-1 flex items-center gap-1.5 p-1 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-lg z-10">
        <button
          onClick={() => setCurrentMode("saturn")}
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
            currentMode === "saturn"
              ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,242,254,0.5)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🪐 Saturno
        </button>
        <button
          onClick={() => setCurrentMode("nebula")}
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
            currentMode === "nebula"
              ? "bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          ✨ Nebulosa Dourada
        </button>
      </div>
    </div>
  );
}
