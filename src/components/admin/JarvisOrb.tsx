import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type OrbTheme = "cobalt" | "flame" | "emerald";
export type OrbState = "idle" | "listening" | "thinking" | "speaking";
export type OrbEmotion =
  | "neutro"
  | "alegre"
  | "empolgado"
  | "calmo"
  | "serio"
  | "empatico"
  | "curioso"
  | "surpreso";

export interface JarvisOrbProps {
  state?: OrbState;
  theme?: OrbTheme;
  emotion?: OrbEmotion;
  statusText?: string;
  subStatusText?: string;
  showOverlay?: boolean;
  audioBass?: number; // 0.0 - 1.0 (modula escala e batimento)
  audioTreble?: number; // 0.0 - 1.0 (modula vibração de superfície)
  audioAmplitude?: number; // 0.0 - 1.0 (amplitude geral)
}

function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

// Cores temáticas primárias e secundárias por estado
const themeColorPalette: Record<
  OrbTheme,
  Record<OrbState, { primary: string; secondary: string }>
> = {
  cobalt: {
    idle: { primary: "#00f0ff", secondary: "#0284c7" },
    listening: { primary: "#10b981", secondary: "#a7f3d0" },
    thinking: { primary: "#a855f7", secondary: "#ec4899" },
    speaking: { primary: "#00f5ff", secondary: "#38bdf8" },
  },
  flame: {
    idle: { primary: "#f59e0b", secondary: "#d97706" },
    listening: { primary: "#34d399", secondary: "#10b981" },
    thinking: { primary: "#ef4444", secondary: "#f97316" },
    speaking: { primary: "#fbbf24", secondary: "#ea580c" },
  },
  emerald: {
    idle: { primary: "#10b981", secondary: "#059669" },
    listening: { primary: "#34d399", secondary: "#6ee7b7" },
    thinking: { primary: "#8b5cf6", secondary: "#6366f1" },
    speaking: { primary: "#06b6d4", secondary: "#14b8a6" },
  },
};

// Shaders GLSL de partículas com Ruído Simplex 3D e atenuação de profundidade
const vertexShader = `
  // Simplex 3D noise (Ian McEwan, Stefan Gustavson, Ashima Arts)
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0);
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  attribute float aSize;
  attribute float aPhase;

  uniform float uTime;
  uniform float uRadius;
  uniform float uScale;
  uniform float uNoiseFreq;
  uniform float uNoiseAmp;
  uniform float uNoiseSpeed;
  uniform float uPixelRatio;

  varying float vDepth;
  varying float vNoise;
  varying vec3 vNormal;

  void main() {
    vec3 norm = normalize(position);
    vNormal = norm;

    // Amostragem de ruído tridimensional em rotação contínua
    vec3 noiseCoord = norm * uNoiseFreq + vec3(0.0, 0.0, uTime * uNoiseSpeed + aPhase * 0.15);
    float n = snoise(noiseCoord);
    vNoise = n;

    // Deslocamento esférico radial
    vec3 displaced = norm * (uRadius + n * uNoiseAmp) * uScale;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Fator de profundidade: partículas próximas à câmera ganham maior intensidade e volume
    float depthFactor = clamp((4.5 + mvPosition.z) / 4.0, 0.25, 1.6);
    vDepth = depthFactor;

    gl_PointSize = aSize * (uPixelRatio * 26.0 / -mvPosition.z) * (0.8 + depthFactor * 0.4);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uSecondaryColor;
  uniform float uAlpha;
  uniform float uBrightness;

  varying float vDepth;
  varying float vNoise;
  varying vec3 vNormal;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Brilho radial suave (partícula em disco com halo)
    float alpha = smoothstep(0.5, 0.04, dist);

    // Gradiente sutil entre cor primária e secundária modulado pelo ruído
    vec3 col = mix(uColor, uSecondaryColor, clamp(vNoise * 0.5 + 0.5, 0.0, 1.0));

    // Núcleo branco suave nas partículas frontais mais brilhantes
    col = mix(col, vec3(1.0), smoothstep(0.28, 0.0, dist) * 0.35 * uBrightness);

    gl_FragColor = vec4(col * (0.85 + 0.35 * vDepth) * uBrightness, alpha * uAlpha);
  }
`;

// Shaders do Núcleo de Energia (Core Glow)
const coreVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coreFragmentShader = `
  uniform vec3 uColor;
  uniform float uCorePulse;
  uniform float uAlpha;
  varying vec3 vNormal;

  void main() {
    // Efeito fresnel radial para sensação de esfera translúcida de energia
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.4);
    float innerPulse = 0.5 + 0.3 * sin(uCorePulse);
    vec3 finalColor = uColor * (innerPulse + fresnel * 1.5);
    gl_FragColor = vec4(finalColor, (0.35 + fresnel * 0.5) * innerPulse * uAlpha);
  }
`;

function FallbackOrb({ state = "idle" }: { state?: OrbState }) {
  const styles: Record<OrbState, { color: string; border: string; glow: string }> = {
    idle: { color: "bg-cyan-500", border: "border-cyan-400/50", glow: "shadow-[0_0_35px_rgba(6,182,212,0.4)]" },
    listening: { color: "bg-emerald-500", border: "border-emerald-400/50", glow: "shadow-[0_0_35px_rgba(16,185,129,0.5)]" },
    thinking: { color: "bg-purple-500", border: "border-purple-400/50", glow: "shadow-[0_0_35px_rgba(168,85,247,0.5)]" },
    speaking: { color: "bg-cyan-400", border: "border-cyan-300", glow: "shadow-[0_0_45px_rgba(6,182,212,0.7)]" },
  };

  const current = styles[state] || styles.idle;

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden min-h-[260px]">
      <div className={`w-36 h-36 rounded-full border ${current.border} ${current.glow} animate-pulse relative flex items-center justify-center`}>
        <div className={`w-28 h-28 rounded-full ${current.color} opacity-40 blur-xl animate-ping`} />
        <div className={`w-20 h-20 rounded-full ${current.color} opacity-80 shadow-inner`} />
      </div>
    </div>
  );
}

export function JarvisOrb({
  state = "idle",
  theme = "cobalt",
  emotion = "neutro",
  statusText = "NEURAL LINK ACTIVE",
  subStatusText,
  showOverlay = true,
  audioBass = 0,
  audioTreble = 0,
  audioAmplitude = 0,
}: JarvisOrbProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  // Referências Three.js
  const animRef = useRef<number | null>(null);
  const targetStateRef = useRef<OrbState>(state);
  const targetThemeRef = useRef<OrbTheme>(theme);
  const targetEmotionRef = useRef<OrbEmotion>(emotion);

  const audioBassRef = useRef(audioBass);
  const audioTrebleRef = useRef(audioTreble);
  const audioAmpRef = useRef(audioAmplitude);

  // Monitoramento de Performance (FPS dinâmico)
  const fpsSamples = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const currentDrawCount = useRef<number>(10000);

  useEffect(() => {
    targetStateRef.current = state;
  }, [state]);

  useEffect(() => {
    targetThemeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    targetEmotionRef.current = emotion;
  }, [emotion]);

  useEffect(() => {
    audioBassRef.current = audioBass;
    audioTrebleRef.current = audioTreble;
    audioAmpRef.current = audioAmplitude;
  }, [audioBass, audioTreble, audioAmplitude]);

  useEffect(() => {
    if (!mountRef.current) return;
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = mountRef.current;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let points: THREE.Points | null = null;
    let coreMesh: THREE.Mesh | null = null;
    let geometry: THREE.BufferGeometry | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let coreMaterial: THREE.ShaderMaterial | null = null;

    try {
      scene = new THREE.Scene();

      const width = container.clientWidth || 320;
      const height = container.clientHeight || 320;

      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.z = 4.2;

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        console.warn("[JarvisOrb] Contexto WebGL perdido. Alternando para modo fallback.");
        setHasWebGL(false);
      };
      renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

      // ========================================================
      // 1. GERAÇÃO DA ESFERA DE FIBONACCI (8.000 a 12.000 pontos)
      // ========================================================
      const particleCount = 10000;
      currentDrawCount.current = particleCount;

      const positions = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const phases = new Float32Array(particleCount);

      // Ângulo de ouro em radianos: pi * (3 - sqrt(5))
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < particleCount; i++) {
        const y = 1 - (i / (particleCount - 1)) * 2; // de 1 a -1
        const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = goldenAngle * i;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Variação orgânica suave de tamanho das partículas
        sizes[i] = 0.85 + Math.random() * 1.5;
        phases[i] = Math.random() * Math.PI * 2;
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

      const palette = themeColorPalette[theme]?.[state] || themeColorPalette.cobalt.idle;
      const initialPrimary = new THREE.Color(palette.primary);
      const initialSecondary = new THREE.Color(palette.secondary);

      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uRadius: { value: 1.55 },
          uScale: { value: 1.0 },
          uNoiseFreq: { value: 1.25 },
          uNoiseAmp: { value: 0.14 },
          uNoiseSpeed: { value: 0.5 },
          uColor: { value: initialPrimary },
          uSecondaryColor: { value: initialSecondary },
          uAlpha: { value: 0.8 },
          uBrightness: { value: 1.0 },
          uPixelRatio: { value: renderer.getPixelRatio() },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);

      // ========================================================
      // 2. NÚCLEO CENTRAL DE ENERGIA (Glow Radial / Bloom Suave)
      // ========================================================
      const coreGeometry = new THREE.SphereGeometry(0.72, 32, 32);
      coreMaterial = new THREE.ShaderMaterial({
        vertexShader: coreVertexShader,
        fragmentShader: coreFragmentShader,
        uniforms: {
          uColor: { value: initialPrimary },
          uCorePulse: { value: 0 },
          uAlpha: { value: 0.7 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
      scene.add(coreMesh);

      // Redimensionamento responsivo
      const handleResize = () => {
        if (!container || !camera || !renderer) return;
        const w = container.clientWidth || 320;
        const h = container.clientHeight || 320;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        if (material) {
          material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
        }
      };
      window.addEventListener("resize", handleResize);

      // ========================================================
      // 3. LOOP DE ANIMAÇÃO & TRANSIÇÕES SUAVES (Easing ~500ms)
      // ========================================================
      const lerpColor = new THREE.Color();
      const lerpSecondary = new THREE.Color();

      // Variáveis dinâmicas interpoladas
      let currentRadius = 1.55;
      let currentScale = 1.0;
      let currentNoiseAmp = 0.14;
      let currentNoiseFreq = 1.25;
      let currentNoiseSpeed = 0.5;
      let currentBrightness = 1.0;
      let currentCorePulse = 0;

      const animate = (time: number) => {
        animRef.current = requestAnimationFrame(animate);

        // Monitoramento de performance (FPS)
        const now = performance.now();
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        if (delta > 0) {
          const fps = 1 / delta;
          fpsSamples.current.push(fps);
          if (fpsSamples.current.length > 45) {
            fpsSamples.current.shift();
            const avgFps = fpsSamples.current.reduce((a, b) => a + b, 0) / fpsSamples.current.length;
            if (avgFps < 45 && currentDrawCount.current > 5000 && geometry) {
              currentDrawCount.current = 5000;
              geometry.setDrawRange(0, 5000);
            } else if (avgFps >= 55 && currentDrawCount.current < particleCount && geometry) {
              currentDrawCount.current = particleCount;
              geometry.setDrawRange(0, particleCount);
            }
          }
        }

        const sec = time * 0.001;
        const st = targetStateRef.current;
        const th = targetThemeRef.current;
        const em = targetEmotionRef.current;
        const colors = themeColorPalette[th]?.[st] || themeColorPalette.cobalt.idle;

        // Modificadores de emoção
        let emotionAmpMod = 1.0;
        let emotionSpeedMod = 1.0;
        let emotionBrightnessMod = 1.0;

        if (em === "empolgado") {
          emotionAmpMod = 1.35;
          emotionSpeedMod = 1.4;
          emotionBrightnessMod = 1.25;
        } else if (em === "calmo") {
          emotionAmpMod = 0.75;
          emotionSpeedMod = 0.65;
          emotionBrightnessMod = 0.9;
        } else if (em === "serio") {
          emotionAmpMod = 0.85;
          emotionSpeedMod = 0.85;
          emotionBrightnessMod = 0.95;
        } else if (em === "alegre" || em === "surpreso") {
          emotionAmpMod = 1.2;
          emotionSpeedMod = 1.2;
          emotionBrightnessMod = 1.15;
        }

        // Metas de interpolação baseadas no estado
        let targetRadius = 1.55;
        let targetScale = 1.0;
        let targetNoiseAmp = 0.14;
        let targetNoiseFreq = 1.25;
        let targetNoiseSpeed = 0.55;
        let targetBrightness = 1.0;

        if (st === "idle") {
          targetRadius = 1.55;
          targetScale = 1.0 + Math.sin(sec * 1.5) * 0.035; // Respiração lenta
          targetNoiseAmp = 0.13 * emotionAmpMod;
          targetNoiseFreq = 1.2;
          targetNoiseSpeed = 0.5 * emotionSpeedMod;
          targetBrightness = 1.0 * emotionBrightnessMod;
        } else if (st === "listening") {
          // Verde/branco, reage à amplitude do microfone
          const micReaction = Math.min(1.0, audioAmpRef.current * 1.8);
          targetRadius = 1.45;
          targetScale = 1.0 + micReaction * 0.25;
          targetNoiseAmp = (0.16 + micReaction * 0.25) * emotionAmpMod;
          targetNoiseFreq = 1.6;
          targetNoiseSpeed = (0.8 + micReaction * 0.8) * emotionSpeedMod;
          targetBrightness = 1.15 * emotionBrightnessMod;
        } else if (st === "thinking") {
          // Roxo/violeta, partículas contraem para o centro e giram mais rápido
          targetRadius = 1.25;
          targetScale = 0.92 + Math.sin(sec * 6.0) * 0.05; // Pulso rápido
          targetNoiseAmp = 0.28 * emotionAmpMod;
          targetNoiseFreq = 2.4;
          targetNoiseSpeed = 1.9 * emotionSpeedMod;
          targetBrightness = 1.25 * emotionBrightnessMod;
        } else if (st === "speaking") {
          // Ciano vibrante, graves para escala geral e agudos para vibração de casca
          const bass = audioBassRef.current || Math.sin(sec * 8.0) * 0.2 + 0.2;
          const treble = audioTrebleRef.current || Math.cos(sec * 12.0) * 0.15 + 0.15;

          targetRadius = 1.6;
          targetScale = 1.0 + bass * 0.28;
          targetNoiseAmp = (0.18 + treble * 0.35) * emotionAmpMod;
          targetNoiseFreq = 1.8;
          targetNoiseSpeed = (1.1 + treble * 0.8) * emotionSpeedMod;
          targetBrightness = 1.3 * emotionBrightnessMod;
        }

        // Interpolação suave (lerp) com fator ~0.08 (~400-500ms)
        const lerpFactor = 0.08;
        currentRadius += (targetRadius - currentRadius) * lerpFactor;
        currentScale += (targetScale - currentScale) * lerpFactor;
        currentNoiseAmp += (targetNoiseAmp - currentNoiseAmp) * lerpFactor;
        currentNoiseFreq += (targetNoiseFreq - currentNoiseFreq) * lerpFactor;
        currentNoiseSpeed += (targetNoiseSpeed - currentNoiseSpeed) * lerpFactor;
        currentBrightness += (targetBrightness - currentBrightness) * lerpFactor;
        currentCorePulse += 0.05 * currentNoiseSpeed;

        // Atualização de cores com transição suave
        lerpColor.set(colors.primary);
        lerpSecondary.set(colors.secondary);

        if (material) {
          material.uniforms.uTime.value = sec;
          material.uniforms.uRadius.value = currentRadius;
          material.uniforms.uScale.value = currentScale;
          material.uniforms.uNoiseAmp.value = currentNoiseAmp;
          material.uniforms.uNoiseFreq.value = currentNoiseFreq;
          material.uniforms.uNoiseSpeed.value = currentNoiseSpeed;
          material.uniforms.uBrightness.value = currentBrightness;
          material.uniforms.uColor.value.lerp(lerpColor, lerpFactor);
          material.uniforms.uSecondaryColor.value.lerp(lerpSecondary, lerpFactor);
        }

        if (coreMaterial) {
          coreMaterial.uniforms.uColor.value.lerp(lerpColor, lerpFactor);
          coreMaterial.uniforms.uCorePulse.value = currentCorePulse;
          coreMaterial.uniforms.uAlpha.value = st === "thinking" ? 0.85 : 0.65;
        }

        // Rotação constante elegante da esfera e do núcleo
        if (points) {
          const rotSpeed = st === "thinking" ? 0.012 : 0.0035;
          points.rotation.y += rotSpeed * currentNoiseSpeed;
          points.rotation.x = Math.sin(sec * 0.3) * 0.12;
        }

        if (coreMesh) {
          coreMesh.scale.set(
            currentScale * 0.72,
            currentScale * 0.72,
            currentScale * 0.72
          );
        }

        try {
          renderer.render(scene, camera);
        } catch {}
      };

      animate(0);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (animRef.current) cancelAnimationFrame(animRef.current);
        try {
          geometry?.dispose();
          material?.dispose();
          coreGeometry?.dispose();
          coreMaterial?.dispose();
          renderer?.dispose();
          if (container && renderer?.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        } catch {}
      };
    } catch (err) {
      console.warn("[JarvisOrb] Erro ao instanciar WebGL:", err);
      setHasWebGL(false);
    }
  }, []);

  const badgeGlowClass =
    theme === "flame"
      ? "bg-amber-950/80 border-amber-500/40 text-amber-300 shadow-amber-500/20"
      : theme === "emerald"
      ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20"
      : "bg-cyan-950/80 border-cyan-500/40 text-cyan-300 shadow-cyan-500/20";

  const dotGlowClass =
    theme === "flame"
      ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]"
      : theme === "emerald"
      ? "bg-emerald-400 shadow-[0_0_8px_#10b981]"
      : "bg-cyan-400 shadow-[0_0_8px_#38bdf8]";

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Vinheta radial e grade sutil de ancoragem holográfica */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,rgba(2,6,23,0.75)_65%,transparent_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4912_1px,transparent_1px),linear-gradient(to_bottom,#082f4912_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      {!hasWebGL ? (
        <FallbackOrb state={state} />
      ) : (
        <div ref={mountRef} className="w-full h-full relative min-h-[280px]" />
      )}

      {/* Rótulo inferior discreto e minimalista */}
      {showOverlay && (
        <div className="absolute bottom-2 flex flex-col items-center gap-1 z-10 pointer-events-none">
          <div
            className={`px-3 py-0.5 rounded-full border text-[10.5px] font-mono tracking-widest uppercase backdrop-blur-md flex items-center gap-2 shadow-md transition-all ${badgeGlowClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotGlowClass} ${state !== "idle" ? "animate-ping" : ""}`} />
            <span>
              {state.toUpperCase()} // {statusText}
            </span>
          </div>
          {subStatusText && (
            <span className="text-[10px] text-slate-400 font-mono tracking-wide">
              {subStatusText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
