import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Sparkles, 
  Rotate3d, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Activity, 
  Volume2, 
  Info, 
  ShieldCheck, 
  Compass, 
  Camera as CameraIcon, 
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Eye,
  Radio,
  Sliders,
  Columns,
  ArrowRight,
  TrendingUp,
  Flame,
  Zap,
  Tag,
  RefreshCw
} from 'lucide-react';
import { ScanResult, LetaifEnergy, ChakraEnergy } from '../types';
import { LETAIF_POINTS, CHAKRA_GUIDE } from '../data/letaifData';
import { soundEngine } from '../utils/soundEngine';

interface BioAura3DSimulatorProps {
  scanResult: ScanResult;
  preScanResult?: ScanResult | null;
  onSelectFrequencyForTreatment?: (selection: any) => void;
  heightClassName?: string;
  showControlPanel?: boolean;
  initialComparisonMode?: 'post' | 'pre' | 'split' | 'morph';
}

type VisualizationMode = 'all' | 'letaif' | 'chakras' | 'aura';
type ComparisonMode = 'post' | 'pre' | 'split' | 'morph';

interface ProjectedPin {
  id: string;
  name: string;
  arabic: string;
  color: string;
  worldPos: THREE.Vector3;
  screenX: number;
  screenY: number;
  visible: boolean;
  detectedHz: number;
  loadedHz: number;
  preLevel: number;
  postLevel: number;
  deltaPercent: number;
}

export const BioAura3DSimulator: React.FC<BioAura3DSimulatorProps> = ({
  scanResult,
  preScanResult,
  onSelectFrequencyForTreatment,
  heightClassName = 'h-[560px]',
  showControlPanel = true,
  initialComparisonMode = 'morph',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simulation & Comparison modes
  const [viewMode, setViewMode] = useState<VisualizationMode>('all');
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>(initialComparisonMode);
  const [morphProgress, setMorphProgress] = useState<number>(100); // 0 = Pre-scan, 100 = Post-scan
  const [isSimulatingLoading, setIsSimulatingLoading] = useState<boolean>(false);
  const [simulationStatusText, setSimulationStatusText] = useState<string>('');
  const [showFrequencyPins, setShowFrequencyPins] = useState<boolean>(false);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [projectedPins, setProjectedPins] = useState<ProjectedPin[]>([]);
  const [activeBottomCategory, setActiveBottomCategory] = useState<'letaif' | 'chakras'>('letaif');

  const [selectedNode, setSelectedNode] = useState<{
    type: 'letaif' | 'chakra';
    id: string;
    name: string;
    arabicOrSanskrit: string;
    color: string;
    level: number;
    description: string;
    esmaOrMantra: string;
    frequencyHz: number;
    effect: string;
    preLevel?: number;
    delta?: number;
  } | null>(null);

  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  // Three.js internal references
  const threeRefs = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    animationFrameId: number | null;
    auraParticles: THREE.Points | null;
    particlesGeometry: THREE.BufferGeometry | null;
    initialParticlePositions: Float32Array | null;
    particleColorsArray: Float32Array | null;
    humanMeshGroup: THREE.Group | null;
    letaifGroup: THREE.Group | null;
    chakraGroup: THREE.Group | null;
    splitLeftGroup: THREE.Group | null;
    splitRightGroup: THREE.Group | null;
    spineFlowLine: THREE.Line | null;
    clock: THREE.Clock;
    isDragging: boolean;
    previousMousePosition: { x: number; y: number };
    targetRotation: { x: number; y: number };
    currentRotation: { x: number; y: number };
    cameraDistance: number;
    raycaster: THREE.Raycaster;
    mouseVector: THREE.Vector2;
    interactiveObjects: THREE.Object3D[];
    currentMorphVal: number;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    animationFrameId: null,
    auraParticles: null,
    particlesGeometry: null,
    initialParticlePositions: null,
    particleColorsArray: null,
    humanMeshGroup: null,
    letaifGroup: null,
    chakraGroup: null,
    splitLeftGroup: null,
    splitRightGroup: null,
    spineFlowLine: null,
    clock: new THREE.Clock(),
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    targetRotation: { x: 0.1, y: 0 },
    currentRotation: { x: 0.1, y: 0 },
    cameraDistance: 4.8,
    raycaster: new THREE.Raycaster(),
    mouseVector: new THREE.Vector2(),
    interactiveObjects: [],
    currentMorphVal: 1.0,
  });

  // Calculate Pre vs Post Metrics
  const comparisonData = useMemo(() => {
    // Post scan data (After frequency treatment / completed scan)
    const postEnergy = Math.max(10, Math.min(100, scanResult.bioEnergyLevel || 85));
    const postStress = Math.max(0, Math.min(100, scanResult.stressIndex || 18));
    const postCoherence = Math.max(10, Math.min(100, scanResult.coherenceScore || 92));
    const postFreq = scanResult.frequencyHz || 528;
    const postHex = scanResult.auraHex || '#10b981';
    const postSecondaryHex = scanResult.auraSecondaryHex || '#38bdf8';

    // Pre scan baseline (Before frequency loading)
    let preEnergy = preScanResult ? preScanResult.bioEnergyLevel : Math.max(20, postEnergy - 34);
    let preStress = preScanResult ? (preScanResult.stressIndex || 68) : Math.min(90, postStress + 46);
    let preCoherence = preScanResult ? (preScanResult.coherenceScore || 45) : Math.max(25, postCoherence - 38);
    let preFreq = preScanResult ? preScanResult.frequencyHz : 320; // 320 Hz typical blockage baseline
    let preHex = preScanResult ? (preScanResult.auraHex || '#ef4444') : '#e11d48'; // Contracted crimson/red

    // Energy deltas
    const energyDelta = postEnergy - preEnergy;
    const stressDelta = preStress - postStress;
    const coherenceDelta = postCoherence - preCoherence;

    // Aura scales: Pre = 0.76 (contracted), Post = 1.48 (expanded)
    const preAuraScale = 0.76;
    const postAuraScale = 1.45;

    // Letaif baseline mapping
    const letaifComparison = LETAIF_POINTS.map((l, idx) => {
      const existingPostL = (scanResult.letaifLevels || [])[idx];
      const pLevel = existingPostL ? existingPostL.level : Math.min(99, Math.round(postEnergy + (idx % 3) * 4));
      const preL = Math.max(22, Math.round(pLevel - 38 + (idx % 4) * 3));
      const delta = pLevel - preL;

      // Real frequency mapping
      const baseBlockageHz = 280 + (idx * 35);
      const loadedHealingHz = l.esmaFrequency || (432 + idx * 48);

      return {
        id: l.id,
        name: l.name,
        arabicName: l.arabicName,
        colorHex: l.colorHex,
        preLevel: preL,
        postLevel: pLevel,
        delta,
        detectedHz: baseBlockageHz,
        loadedHz: loadedHealingHz,
        location: l.location,
        esma: l.esma,
        spiritualMeaning: l.spiritualMeaning,
        effectOnBody: l.effectOnBody,
        dhikrCount: l.dhikrCount,
      };
    });

    // Chakra baseline mapping
    const chakraComparison = CHAKRA_GUIDE.map((c, idx) => {
      const existingPostC = (scanResult.chakraLevels || [])[idx];
      const pLevel = existingPostC ? existingPostC.level : Math.min(99, Math.round(postEnergy + ((idx + 2) % 3) * 4));
      const preC = Math.max(24, Math.round(pLevel - 36 + (idx % 4) * 3));
      const delta = pLevel - preC;

      return {
        id: c.id,
        name: c.name,
        sanskrit: c.sanskrit,
        colorHex: c.colorHex,
        preLevel: preC,
        postLevel: pLevel,
        delta,
        frequencyHz: c.frequencyHz,
        location: c.location,
        bijaMantra: c.bijaMantra,
        spiritualMeaning: c.spiritualMeaning,
        effectOnBody: c.effectOnBody,
        balancedTraits: c.balancedTraits,
      };
    });

    return {
      preEnergy,
      postEnergy,
      energyDelta,
      preStress,
      postStress,
      stressDelta,
      preCoherence,
      postCoherence,
      coherenceDelta,
      preFreq,
      postFreq,
      preHex,
      postHex,
      postSecondaryHex,
      preAuraScale,
      postAuraScale,
      letaifComparison,
      chakraComparison,
    };
  }, [scanResult, preScanResult]);

  // Sync morph progress with comparison mode
  useEffect(() => {
    if (comparisonMode === 'pre') {
      setMorphProgress(0);
    } else if (comparisonMode === 'post') {
      setMorphProgress(100);
    }
  }, [comparisonMode]);

  // Three.js Scene Setup & Geometry Construction
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 500;

    // 1. Scene & Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.35, threeRefs.current.cameraDistance);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
    } catch (glErr) {
      console.debug('WebGL context initialization notice:', glErr);
      return;
    }

    threeRefs.current.renderer = renderer;
    threeRefs.current.scene = scene;
    threeRefs.current.camera = camera;
    threeRefs.current.interactiveObjects = [];

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.25);
    mainLight.position.set(2, 4, 3);
    scene.add(mainLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    backLight.position.set(-2, -1, -3);
    scene.add(backLight);

    const auraPointLight = new THREE.PointLight(new THREE.Color(comparisonData.postHex), 2.5, 7);
    auraPointLight.position.set(0, 0.6, 0.6);
    scene.add(auraPointLight);

    // 3. Ground Sacred Ring & Torus Base
    const groundGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(0.8, 1.9, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(comparisonData.postHex),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = -1.6;
    groundGroup.add(ringMesh);
    scene.add(groundGroup);

    // Helper to build a human silhouette mesh hierarchy
    const createHumanSilhouette = (isPre: boolean = false) => {
      const group = new THREE.Group();
      const baseMat = new THREE.MeshStandardMaterial({
        color: isPre ? 0x221015 : 0x0c1e33,
        emissive: new THREE.Color(isPre ? comparisonData.preHex : comparisonData.postHex),
        emissiveIntensity: isPre ? 0.22 : 0.45,
        roughness: 0.2,
        metalness: 0.75,
        transparent: true,
        opacity: 0.78,
      });

      const wireMat = new THREE.MeshBasicMaterial({
        color: isPre ? 0xf87171 : 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: isPre ? 0.25 : 0.35,
      });

      // Head
      const headGeo = new THREE.SphereGeometry(0.24, 20, 20);
      const head = new THREE.Mesh(headGeo, baseMat);
      head.position.y = 1.32;
      head.add(new THREE.Mesh(headGeo, wireMat));
      group.add(head);

      // Neck
      const neckGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.18, 16);
      const neck = new THREE.Mesh(neckGeo, baseMat);
      neck.position.y = 1.1;
      group.add(neck);

      // Torso / Chest
      const torsoGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.85, 20);
      const torso = new THREE.Mesh(torsoGeo, baseMat);
      torso.position.y = 0.58;
      torso.add(new THREE.Mesh(torsoGeo, wireMat));
      group.add(torso);

      // Pelvis
      const pelvisGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.32, 18);
      const pelvis = new THREE.Mesh(pelvisGeo, baseMat);
      pelvis.position.y = 0.02;
      group.add(pelvis);

      // Arms
      const armGeo = new THREE.CylinderGeometry(0.065, 0.05, 0.75, 12);
      const leftArm = new THREE.Mesh(armGeo, baseMat);
      leftArm.position.set(-0.38, 0.55, 0);
      leftArm.rotation.z = 0.18;
      group.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, baseMat);
      rightArm.position.set(0.38, 0.55, 0);
      rightArm.rotation.z = -0.18;
      group.add(rightArm);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.09, 0.06, 1.15, 16);
      const leftLeg = new THREE.Mesh(legGeo, baseMat);
      leftLeg.position.set(-0.16, -0.68, 0);
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, baseMat);
      rightLeg.position.set(0.16, -0.68, 0);
      group.add(rightLeg);

      return { group, baseMat, wireMat };
    };

    // 4. Main Single Human Silhouette Group
    const { group: humanGroup, baseMat: humanBaseMat } = createHumanSilhouette(false);
    threeRefs.current.humanMeshGroup = humanGroup;
    scene.add(humanGroup);

    // 5. Build 7 Letaif Energy Spheres
    const letaifGroup = new THREE.Group();
    threeRefs.current.letaifGroup = letaifGroup;

    // Precise Anatomical Positions for 7 Letaif
    const letaifCoords: Record<string, [number, number, number]> = {
      kalb: [0.15, 0.42, 0.18],       // Kalp: Sol göğüs (sağdan bakışta x=0.15)
      ruh: [-0.15, 0.42, 0.18],       // Ruh: Sağ göğüs
      sir: [0.16, 0.70, 0.16],        // Sır: Sol göğüs üstü
      hafi: [-0.16, 0.70, 0.16],      // Hafi: Sağ göğüs üstü
      ahfa: [0.0, 0.56, 0.18],        // Ahfa: Göğüs ortası (merkez)
      nefs: [0.0, 1.28, 0.16],        // Nefs: İki kaş arası / Alın
      kulliye: [0.0, 1.54, 0.12],     // Külliye: Baş tepesi / Taç
    };

    comparisonData.letaifComparison.forEach((l) => {
      const pos = letaifCoords[l.id] || [0, 0.5, 0.15];
      const nodeGroup = new THREE.Group();
      nodeGroup.name = l.id;
      nodeGroup.position.set(pos[0], pos[1], pos[2]);

      // Glowing Inner Core
      const coreGeo = new THREE.SphereGeometry(0.065, 24, 24);
      const coreMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(l.colorHex),
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.name = `core_${l.id}`;
      nodeGroup.add(coreMesh);

      // Pulsing Halo
      const haloGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(l.colorHex),
        transparent: true,
        opacity: 0.45,
        wireframe: true,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.name = `halo_${l.id}`;
      nodeGroup.add(haloMesh);

      // User data for raycasting interaction
      nodeGroup.userData = {
        type: 'letaif',
        id: l.id,
        name: l.name,
        arabic: l.arabicName,
        color: l.colorHex,
        level: l.postLevel,
        preLevel: l.preLevel,
        delta: l.delta,
        detectedHz: l.detectedHz,
        loadedHz: l.loadedHz,
      };

      threeRefs.current.interactiveObjects.push(coreMesh, haloMesh);
      letaifGroup.add(nodeGroup);
    });

    scene.add(letaifGroup);

    // 6. Build 7 Chakras Group
    const chakraGroup = new THREE.Group();
    threeRefs.current.chakraGroup = chakraGroup;

    const chakraCoords: Record<string, [number, number, number]> = {
      root: [0, -0.05, 0.05],
      sacral: [0, 0.18, 0.08],
      solar: [0, 0.40, 0.12],
      heart: [0, 0.60, 0.14],
      throat: [0, 0.95, 0.12],
      third_eye: [0, 1.30, 0.14],
      crown: [0, 1.56, 0.08],
    };

    CHAKRA_GUIDE.forEach((c) => {
      const pos = chakraCoords[c.id] || [0, 0.5, 0.1];
      const cGroup = new THREE.Group();
      cGroup.name = c.id;
      cGroup.position.set(pos[0], pos[1], pos[2]);

      const torusGeo = new THREE.TorusGeometry(0.11, 0.018, 12, 28);
      const torusMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(c.colorHex),
        transparent: true,
        opacity: 0.65,
        wireframe: true,
      });
      const torusMesh = new THREE.Mesh(torusGeo, torusMat);
      torusMesh.rotation.x = Math.PI / 2;
      torusMesh.name = `torus_${c.id}`;
      cGroup.add(torusMesh);

      cGroup.userData = {
        type: 'chakra',
        id: c.id,
        name: c.name,
        arabic: c.sanskrit,
        color: c.colorHex,
        level: Math.round(comparisonData.postEnergy),
      };

      threeRefs.current.interactiveObjects.push(torusMesh);
      chakraGroup.add(cGroup);
    });

    scene.add(chakraGroup);

    // 7. Spine Kundalini Energy Line
    const spineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.15, 0.02),
      new THREE.Vector3(0, 0.35, 0.08),
      new THREE.Vector3(0, 0.85, 0.09),
      new THREE.Vector3(0, 1.45, 0.06),
    ]);
    const spineGeo = new THREE.BufferGeometry().setFromPoints(spineCurve.getPoints(40));
    const spineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
    });
    const spineLine = new THREE.Line(spineGeo, spineMat);
    threeRefs.current.spineFlowLine = spineLine;
    scene.add(spineLine);

    // 8. 3D Aura Parçacık Alanı (3000 Reactive Dynamic Particles with Dual-State Color & Scale Morph)
    const particleCount = 3000;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);

    const postBaseColor = new THREE.Color(comparisonData.postHex);
    const postSecondaryColor = new THREE.Color(comparisonData.postSecondaryHex);
    const preBaseColor = new THREE.Color(comparisonData.preHex);
    const preSecondaryColor = new THREE.Color('#78716c'); // Dull gray/amber for pre state
    const goldColor = new THREE.Color('#f59e0b');

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      const r = (0.75 + Math.random() * 0.95);
      const x = r * Math.sin(phi) * Math.cos(theta) * 0.88;
      const y = (r * Math.cos(phi) * 1.55) + 0.25;
      const z = r * Math.sin(phi) * Math.sin(theta) * 0.82;

      particlePositions[idx] = x;
      particlePositions[idx + 1] = y;
      particlePositions[idx + 2] = z;

      initialPositions[idx] = x;
      initialPositions[idx + 1] = y;
      initialPositions[idx + 2] = z;

      // Color assignment
      const heightRatio = (y + 1.2) / 3.0;
      const mixedColor = postBaseColor.clone().lerp(heightRatio > 0.6 ? goldColor : postSecondaryColor, Math.random() * 0.7);

      particleColors[idx] = mixedColor.r;
      particleColors[idx + 1] = mixedColor.g;
      particleColors[idx + 2] = mixedColor.b;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    // Radial Glow Texture
    const canvasP = document.createElement('canvas');
    canvasP.width = 64;
    canvasP.height = 64;
    const ctxP = canvasP.getContext('2d');
    if (ctxP) {
      const grad = ctxP.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.25, 'rgba(255,255,255,0.75)');
      grad.addColorStop(0.65, 'rgba(255,255,255,0.18)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctxP.fillStyle = grad;
      ctxP.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvasP);

    const particlesMat = new THREE.PointsMaterial({
      size: 0.08,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const auraPoints = new THREE.Points(particlesGeo, particlesMat);
    threeRefs.current.auraParticles = auraPoints;
    threeRefs.current.particlesGeometry = particlesGeo;
    threeRefs.current.initialParticlePositions = initialPositions;
    threeRefs.current.particleColorsArray = particleColors;
    scene.add(auraPoints);

    // 9. Animation & Render Loop
    let lastPinUpdate = 0;

    const animate = () => {
      const elapsedTime = threeRefs.current.clock.getElapsedTime();

      // Smooth Auto-rotation
      if (isAutoRotating && !threeRefs.current.isDragging) {
        threeRefs.current.targetRotation.y += 0.005;
      }

      threeRefs.current.currentRotation.x += (threeRefs.current.targetRotation.x - threeRefs.current.currentRotation.x) * 0.08;
      threeRefs.current.currentRotation.y += (threeRefs.current.targetRotation.y - threeRefs.current.currentRotation.y) * 0.08;

      const rotObjects = [humanGroup, letaifGroup, chakraGroup, spineLine, groundGroup, auraPoints];
      rotObjects.forEach((obj) => {
        if (obj) {
          obj.rotation.y = threeRefs.current.currentRotation.y;
          obj.rotation.x = threeRefs.current.currentRotation.x;
        }
      });

      // Target morph value (0.0 = Pre, 1.0 = Post)
      const morphFactor = threeRefs.current.currentMorphVal;

      // Dynamic Aura Scale based on morphFactor: Pre = 0.76, Post = 1.45
      const currentAuraScale = THREE.MathUtils.lerp(comparisonData.preAuraScale, comparisonData.postAuraScale, morphFactor);
      const currentPulseSpeed = THREE.MathUtils.lerp(0.8, 1.8, morphFactor);

      // Animate and Color Morph Particles
      if (threeRefs.current.particlesGeometry && threeRefs.current.initialParticlePositions) {
        const positions = threeRefs.current.particlesGeometry.attributes.position.array as Float32Array;
        const colors = threeRefs.current.particlesGeometry.attributes.color.array as Float32Array;
        const initial = threeRefs.current.initialParticlePositions;

        const pulse = Math.sin(elapsedTime * currentPulseSpeed * 2.2) * (0.04 + (1 - morphFactor) * 0.03);

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          const ox = initial[idx];
          const oy = initial[idx + 1];
          const oz = initial[idx + 2];

          const wave = Math.sin(elapsedTime * 2.2 + oy * 3.5) * 0.04;
          const expansion = currentAuraScale * (1.0 + pulse + wave);

          positions[idx] = ox * expansion;
          positions[idx + 1] = oy + Math.sin(elapsedTime * 1.5 + ox * 2.0) * 0.02;
          positions[idx + 2] = oz * expansion;

          // Color morph from Pre (crimson/dull gray) to Post (emerald/cyan/gold)
          const heightRatio = (oy + 1.2) / 3.0;
          const targetPreCol = preBaseColor.clone().lerp(preSecondaryColor, Math.random() * 0.4);
          const targetPostCol = postBaseColor.clone().lerp(heightRatio > 0.6 ? goldColor : postSecondaryColor, Math.random() * 0.7);
          const activeColor = targetPreCol.lerp(targetPostCol, morphFactor);

          colors[idx] = activeColor.r;
          colors[idx + 1] = activeColor.g;
          colors[idx + 2] = activeColor.b;
        }

        threeRefs.current.particlesGeometry.attributes.position.needsUpdate = true;
        threeRefs.current.particlesGeometry.attributes.color.needsUpdate = true;
      }

      // Update Human Body Glow Color & Emissive intensity
      if (humanBaseMat) {
        const activeEmissive = preBaseColor.clone().lerp(postBaseColor, morphFactor);
        humanBaseMat.emissive.copy(activeEmissive);
        humanBaseMat.emissiveIntensity = THREE.MathUtils.lerp(0.2, 0.45, morphFactor);
      }

      // Animate Letaif Halos (Scale & Intensity based on morph)
      if (threeRefs.current.letaifGroup) {
        threeRefs.current.letaifGroup.children.forEach((child) => {
          const halo = child.getObjectByName(`halo_${child.name}`) as THREE.Mesh | undefined;
          if (halo) {
            const baseScale = THREE.MathUtils.lerp(0.65, 1.35, morphFactor);
            const pulse = Math.sin(elapsedTime * (2.0 + morphFactor * 2.0) + child.position.y * 5.0) * 0.25;
            const finalScale = Math.max(0.3, baseScale + pulse);
            halo.scale.set(finalScale, finalScale, finalScale);
          }
        });
      }

      // Animate Chakras
      if (threeRefs.current.chakraGroup) {
        threeRefs.current.chakraGroup.children.forEach((cMesh, idx) => {
          cMesh.rotation.z += 0.02 * (idx % 2 === 0 ? 1 : -1);
          const cScale = THREE.MathUtils.lerp(0.7, 1.2, morphFactor) + Math.sin(elapsedTime * 2.5 + idx) * 0.1;
          cMesh.scale.set(cScale, cScale, cScale);
        });
      }

      // Project 3D Coordinates to 2D HTML Screen Coordinates for Floating Frequency Pins
      const now = performance.now();
      if (showFrequencyPins && containerRef.current && camera && now - lastPinUpdate > 30) {
        lastPinUpdate = now;
        const rect = containerRef.current.getBoundingClientRect();
        const pinsList: ProjectedPin[] = [];

        comparisonData.letaifComparison.forEach((l) => {
          const rawPos = letaifCoords[l.id] || [0, 0.5, 0.15];
          const worldV = new THREE.Vector3(rawPos[0], rawPos[1], rawPos[2]);

          // Apply rotation of letaif group
          worldV.applyEuler(letaifGroup.rotation);

          // Project into NDC (-1 to 1)
          const proj = worldV.clone().project(camera);

          // Visible if in front of camera
          const isVisible = proj.z < 1.0;
          const screenX = ((proj.x + 1) * rect.width) / 2;
          const screenY = ((-proj.y + 1) * rect.height) / 2;

          pinsList.push({
            id: l.id,
            name: l.name,
            arabic: l.arabicName,
            color: l.colorHex,
            worldPos: worldV,
            screenX,
            screenY,
            visible: isVisible && screenX > 20 && screenX < rect.width - 20 && screenY > 20 && screenY < rect.height - 20,
            detectedHz: l.detectedHz,
            loadedHz: l.loadedHz,
            preLevel: l.preLevel,
            postLevel: l.postLevel,
            deltaPercent: l.delta,
          });
        });

        setProjectedPins(pinsList);
      }

      renderer.render(scene, camera);
      threeRefs.current.animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !threeRefs.current.renderer || !threeRefs.current.camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      threeRefs.current.camera.aspect = w / h;
      threeRefs.current.camera.updateProjectionMatrix();
      threeRefs.current.renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (threeRefs.current.animationFrameId) {
        cancelAnimationFrame(threeRefs.current.animationFrameId);
      }
      renderer.dispose();
    };
  }, [comparisonData, showFrequencyPins]);

  // Keep morph ref updated smoothly
  useEffect(() => {
    threeRefs.current.currentMorphVal = morphProgress / 100;
  }, [morphProgress]);

  // Update Layer Visibility based on viewMode
  useEffect(() => {
    const { auraParticles, letaifGroup, chakraGroup, humanMeshGroup, spineFlowLine } = threeRefs.current;
    if (auraParticles) auraParticles.visible = viewMode === 'all' || viewMode === 'aura';
    if (letaifGroup) letaifGroup.visible = viewMode === 'all' || viewMode === 'letaif';
    if (chakraGroup) chakraGroup.visible = viewMode === 'all' || viewMode === 'chakras';
    if (humanMeshGroup) humanMeshGroup.visible = true;
    if (spineFlowLine) spineFlowLine.visible = viewMode === 'all' || viewMode === 'chakras' || viewMode === 'letaif';
  }, [viewMode]);

  // Orbit Drag Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    threeRefs.current.isDragging = true;
    threeRefs.current.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!threeRefs.current.isDragging) return;
    const deltaX = e.clientX - threeRefs.current.previousMousePosition.x;
    const deltaY = e.clientY - threeRefs.current.previousMousePosition.y;

    threeRefs.current.targetRotation.y += deltaX * 0.008;
    threeRefs.current.targetRotation.x = Math.max(
      -Math.PI / 4, 
      Math.min(Math.PI / 4, threeRefs.current.targetRotation.x + deltaY * 0.008)
    );
    threeRefs.current.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (containerRef.current && threeRefs.current.camera && threeRefs.current.scene) {
      const rect = containerRef.current.getBoundingClientRect();
      threeRefs.current.mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      threeRefs.current.mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      threeRefs.current.raycaster.setFromCamera(threeRefs.current.mouseVector, threeRefs.current.camera);
      const intersects = threeRefs.current.raycaster.intersectObjects(threeRefs.current.interactiveObjects, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && !hitObj.userData?.type && hitObj.parent) {
          hitObj = hitObj.parent;
        }

        if (hitObj && hitObj.userData?.type) {
          const u = hitObj.userData;
          if (u.type === 'letaif') {
            const lInfo = LETAIF_POINTS.find((l) => l.id === u.id) || LETAIF_POINTS[0];
            setSelectedNode({
              type: 'letaif',
              id: u.id,
              name: u.name,
              arabicOrSanskrit: u.arabic,
              color: u.color,
              level: u.level,
              preLevel: u.preLevel,
              delta: u.delta,
              description: lInfo.spiritualMeaning,
              esmaOrMantra: `${lInfo.esma} (${lInfo.dhikrCount.toLocaleString('tr-TR')} Zikir)`,
              frequencyHz: lInfo.esmaFrequency,
              effect: lInfo.effectOnBody,
            });
          }
        }
      }
    }
    threeRefs.current.isDragging = false;
  };

  const handleZoom = (delta: number) => {
    if (!threeRefs.current.camera) return;
    threeRefs.current.cameraDistance = Math.max(2.5, Math.min(8.0, threeRefs.current.cameraDistance + delta));
    threeRefs.current.camera.position.z = threeRefs.current.cameraDistance;
  };

  const handleResetView = () => {
    threeRefs.current.targetRotation = { x: 0.1, y: 0 };
    threeRefs.current.cameraDistance = 4.8;
    if (threeRefs.current.camera) {
      threeRefs.current.camera.position.set(0, 0.35, 4.8);
    }
  };

  // High-Resolution Snapshot Capture
  const handleSnapshotPNG = () => {
    if (!canvasRef.current) return;
    setIsCapturing(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `AuraBio-3D-Letaif-Karsilastirma-${scanResult.id || 'scan'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('3D snapshot error:', err);
    } finally {
      setTimeout(() => setIsCapturing(false), 1200);
    }
  };

  // Trigger Frequency Sound
  const handlePlaySelectedFrequency = (hz: number, title: string) => {
    soundEngine.playFrequency(hz, 0.45);
    setIsAudioActive(true);
    if (onSelectFrequencyForTreatment) {
      onSelectFrequencyForTreatment({
        name: title,
        type: 'frequency',
        frequencyHz: hz,
      });
    }
  };

  // Interactive Live Frequency Loading & Morphing Simulation (Animasyon)
  const handleStartLoadingSimulation = () => {
    if (isSimulatingLoading) return;
    setIsSimulatingLoading(true);
    setComparisonMode('morph');
    setMorphProgress(0);
    setSimulationStatusText('⚡ Frekans Yükleme Başlatılıyor... Aurik Blokajlar Taranıyor (%0)');

    // Start with low baseline tone
    soundEngine.playFrequency(320, 0.3);

    const startTime = Date.now();
    const duration = 4800; // 4.8 seconds transition

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      
      // Smooth cubic ease-out
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const currentPct = Math.round(eased * 100);
      setMorphProgress(currentPct);

      if (currentPct < 30) {
        setSimulationStatusText(`⚡ Frekans Yükleniyor (%${currentPct}): Kök & Sakral Letaif Açılıyor...`);
      } else if (currentPct < 70) {
        setSimulationStatusText(`✨ Kalp & Ruh Letaifi Nur Rezonansına Ulaştı (%${currentPct}) • 528 Hz Uyumlanıyor...`);
      } else if (currentPct < 99) {
        setSimulationStatusText(`🌟 Külliye & Ahfa Nurları Genişliyor (%${currentPct}) • Aurik Torus Kalkanı Aktif!`);
      }

      if (progress >= 1.0) {
        clearInterval(interval);
        setMorphProgress(100);
        setSimulationStatusText(`🎉 Frekans Yüklemesi Başarıyla Tamamlandı! Biyo-Enerji +%${comparisonData.energyDelta} Gelişti.`);
        setIsSimulatingLoading(false);
        soundEngine.playFrequency(528, 0.5); // Final 528 Hz Love/Miracle frequency ring
        setTimeout(() => setSimulationStatusText(''), 6000);
      }
    }, 40);
  };

  // Current active dynamic values based on morph progress
  const activeEnergy = Math.round(
    THREE.MathUtils.lerp(comparisonData.preEnergy, comparisonData.postEnergy, morphProgress / 100)
  );
  const activeStress = Math.round(
    THREE.MathUtils.lerp(comparisonData.preStress, comparisonData.postStress, morphProgress / 100)
  );
  const activeCoherence = Math.round(
    THREE.MathUtils.lerp(comparisonData.preCoherence, comparisonData.postCoherence, morphProgress / 100)
  );
  const activeAuraExpansion = Math.round(
    THREE.MathUtils.lerp(-24, 45, morphProgress / 100)
  );

  return (
    <div className="w-full bg-slate-950/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
      {/* 3D Viewer Header */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <Rotate3d className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-1.5">
                <span>3D Canlı Letaif ve Aura Görselleştiricisi</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono">
                  Öncesi / Sonrası Karşılaştırmalı
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Frekans yüklemesi sonrası genişleyen aurik kalkan ve 7 Letaif nur aktivasyonu
            </p>
          </div>
        </div>

        {/* Comparison State Switches & Morph Simulation Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setComparisonMode('pre');
                setMorphProgress(0);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                comparisonMode === 'pre'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3 text-red-400" />
              <span>Öncesi (Pre-Scan)</span>
            </button>

            <button
              onClick={() => {
                setComparisonMode('post');
                setMorphProgress(100);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                comparisonMode === 'post'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span>Sonrası (Yüklenmiş)</span>
            </button>

            <button
              onClick={() => setComparisonMode('morph')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                comparisonMode === 'morph'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3 h-3 text-cyan-300" />
              <span>Morf Kaydırıcı</span>
            </button>
          </div>

          <button
            onClick={handleStartLoadingSimulation}
            disabled={isSimulatingLoading}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-200 fill-current animate-pulse" />
            <span>{isSimulatingLoading ? 'Yükleniyor...' : '✨ Dönüşüm Simülasyonunu Oynat'}</span>
          </button>
        </div>
      </div>

      {/* Morph Slider Bar (When in Morph Mode) */}
      <div className="px-5 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <span className="text-red-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            Tarama Öncesi (%0)
          </span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Frekans Yükleme Sonrası (%100)
          </span>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md min-w-[240px]">
          <input
            type="range"
            min="0"
            max="100"
            value={morphProgress}
            onChange={(e) => {
              setMorphProgress(Number(e.target.value));
              setComparisonMode('morph');
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="font-mono font-bold text-indigo-300 w-12 text-right">
            %{morphProgress}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFrequencyPins(!showFrequencyPins)}
            className={`px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              showFrequencyPins
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3 h-3" />
            <span>Frekans Pinleri {showFrequencyPins ? 'Açık' : 'Kapalı'}</span>
          </button>
        </div>
      </div>

      {/* Simulation Live Progress Banner */}
      {simulationStatusText && (
        <div className="px-5 py-2 bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 border-b border-indigo-500/40 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2 text-indigo-200 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{simulationStatusText}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
            Rezonans Artışı: +%{Math.round((morphProgress / 100) * comparisonData.energyDelta)}
          </span>
        </div>
      )}

      {/* 3D Canvas Stage Container */}
      <div 
        ref={containerRef}
        className={`w-full ${heightClassName} relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 cursor-grab active:cursor-grabbing select-none overflow-hidden`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full block"
        />

        {/* 3D In-Scene Overlaid Floating Frequency Pins */}
        {showFrequencyPins && projectedPins.map((pin) => {
          if (!pin.visible) return null;
          const isElevated = morphProgress > 50;

          return (
            <div
              key={pin.id}
              style={{
                transform: `translate(${pin.screenX}px, ${pin.screenY}px) translate(-50%, -100%)`,
              }}
              className="absolute top-0 left-0 pointer-events-auto transition-transform duration-75 z-20"
            >
              <div 
                onClick={() => {
                  handlePlaySelectedFrequency(pin.loadedHz, pin.name);
                  const lInfo = LETAIF_POINTS.find(l => l.id === pin.id) || LETAIF_POINTS[0];
                  setSelectedNode({
                    type: 'letaif',
                    id: pin.id,
                    name: pin.name,
                    arabicOrSanskrit: pin.arabic,
                    color: pin.color,
                    level: pin.postLevel,
                    preLevel: pin.preLevel,
                    delta: pin.deltaPercent,
                    description: lInfo.spiritualMeaning,
                    esmaOrMantra: `${lInfo.esma} (${lInfo.dhikrCount.toLocaleString('tr-TR')} Zikir)`,
                    frequencyHz: lInfo.esmaFrequency,
                    effect: lInfo.effectOnBody,
                  });
                }}
                className="group p-1.5 sm:p-2 rounded-2xl bg-slate-950/85 hover:bg-slate-900 backdrop-blur-md border border-indigo-500/40 hover:border-indigo-400 shadow-xl text-[10px] cursor-pointer transition-all hover:scale-105 active:scale-95 space-y-0.5 min-w-[140px]"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: pin.color, boxShadow: `0 0 8px ${pin.color}` }}
                    />
                    <strong className="text-slate-200 font-bold leading-none">{pin.name}</strong>
                  </div>
                  <span className="text-amber-300 font-arabic text-[9px]">{pin.arabic}</span>
                </div>

                <div className="flex items-center justify-between gap-1 text-[9px] pt-0.5 border-t border-slate-800 text-slate-400">
                  <span>Tespit: <strong className="text-red-400 font-mono">{pin.detectedHz}Hz</strong></span>
                  <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
                  <span>Şifa: <strong className="text-emerald-400 font-mono">{pin.loadedHz}Hz</strong></span>
                </div>

                <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
                  <span className="text-slate-400">Aktivasyon:</span>
                  <span className={`font-bold ${isElevated ? 'text-emerald-400' : 'text-amber-400'}`}>
                    %{Math.round(THREE.MathUtils.lerp(pin.preLevel, pin.postLevel, morphProgress / 100))}
                    <span className="text-[8px] text-emerald-300 ml-0.5">(+%{pin.deltaPercent})</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Floating In-Scene Controls (Top Right) */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            title={isAutoRotating ? 'Otomatik Dönüşü Durdur' : 'Otomatik Dönüşü Başlat'}
            className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 ${
              isAutoRotating 
                ? 'bg-indigo-600/80 text-white border-indigo-400' 
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${isAutoRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>

          <button
            onClick={() => handleZoom(-0.6)}
            title="Yakınlaştır (+)"
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleZoom(0.6)}
            title="Uzaklaştır (-)"
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetView}
            title="Açıyı Sıfırla"
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <Compass className="w-4 h-4" />
          </button>

          <button
            onClick={handleSnapshotPNG}
            disabled={isCapturing}
            title="3D Simülasyonu PNG Olarak Kaydet"
            className="p-2.5 rounded-2xl bg-emerald-600/80 hover:bg-emerald-500 text-white border border-emerald-400 backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <CameraIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Dynamic Metrics Card (Top Left) */}
        <div className="absolute top-4 left-4 z-20 space-y-2 pointer-events-none">
          <div className="p-3.5 rounded-3xl bg-slate-900/85 backdrop-blur-md border border-slate-800 text-xs shadow-xl space-y-2 max-w-[250px]">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-[10px] uppercase font-bold text-indigo-300">
                {morphProgress < 30 ? '🔴 TESPİT EDİLEN ÖNCEKİ DURUM' : morphProgress > 70 ? '🟢 FREKANS YÜKLENMİŞ DURUM' : '🟡 DÖNÜŞÜM AŞAMASI'}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">%{morphProgress}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Biyo-Enerji:</span>
              <div className="flex items-center gap-1 font-mono">
                <strong className={morphProgress > 50 ? 'text-emerald-400' : 'text-amber-400'}>
                  %{activeEnergy}
                </strong>
                <span className="text-[10px] text-emerald-300">
                  (+%{Math.round((morphProgress / 100) * comparisonData.energyDelta)})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Aurik Genişlik:</span>
              <strong className={`font-mono ${activeAuraExpansion >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                {activeAuraExpansion >= 0 ? `+${activeAuraExpansion}% (Geniş)` : `${activeAuraExpansion}% (Dar)`}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Stres İndeksi:</span>
              <strong className={`font-mono ${activeStress < 30 ? 'text-emerald-400' : 'text-red-400'}`}>
                %{activeStress}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Uyum / Koherans:</span>
              <strong className="text-indigo-400 font-mono">%{activeCoherence}</strong>
            </div>
          </div>
        </div>

        {/* Selected Node (Letaif / Chakra) Interactive Popup Overlay */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-30 animate-fade-in pointer-events-auto">
            <div className="p-4 rounded-3xl bg-slate-900/95 backdrop-blur-xl border-2 border-indigo-500/50 shadow-2xl shadow-indigo-950/80 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-4 h-4 rounded-full shadow-lg shrink-0" 
                    style={{ backgroundColor: selectedNode.color, boxShadow: `0 0 12px ${selectedNode.color}` }}
                  />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                      {selectedNode.type === 'chakra' ? '🌈 7 ÇAKRA MERKEZİ DETAYI' : '✨ LETAİF NUR MERKEZİ DETAYI'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{selectedNode.name}</span>
                      <span className="text-xs font-arabic text-amber-300">{selectedNode.arabicOrSanskrit}</span>
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-lg bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Önceki Durum:</span>
                  <strong className="text-red-400 font-mono">%{selectedNode.preLevel || 45} (Daralmış)</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Yükleme Sonrası:</span>
                  <strong className="text-emerald-400 font-mono">%{selectedNode.level} (+%{selectedNode.delta || 40})</strong>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedNode.description}
              </p>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="text-slate-400">
                  Önerilen Esma: <strong className="text-amber-300">{selectedNode.esmaOrMantra}</strong>
                </div>

                <button
                  onClick={() => handlePlaySelectedFrequency(selectedNode.frequencyHz, selectedNode.name)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{selectedNode.frequencyHz} Hz Dinle</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Panel & Quick Letaif Selector */}
      {showControlPanel && (
        <div className="p-4 sm:p-5 bg-slate-900/95 border-t border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  3D DÖNÜŞÜM RAPORU: +%{comparisonData.energyDelta} BİYO-ENERJİ ARTIŞI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Frekans yüklemesi sonrasında aurik koruma alanınız <strong>{comparisonData.preAuraScale}x</strong> daralmış çapından <strong>{comparisonData.postAuraScale}x</strong> genişliğe ulaştı. 7 Letaif merkezindeki nur parlaklığı ve hücresel koherans maksimum dengeye kavuştu.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
              <button
                onClick={() => handlePlaySelectedFrequency(comparisonData.postFreq, `${scanResult.dominantAuraColor} Şifa Frekansı`)}
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Şifa Frekansını Çal ({comparisonData.postFreq} Hz)</span>
              </button>
            </div>
          </div>

          {/* Bottom Interactive Energy Centers Toolbar (Letaif & Çakra Butonları) */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setActiveBottomCategory('letaif')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeBottomCategory === 'letaif'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>7 Letaif Nurları</span>
                </button>
                <button
                  onClick={() => setActiveBottomCategory('chakras')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeBottomCategory === 'chakras'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-300" />
                  <span>7 Çakra Merkezleri</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 italic hidden sm:inline-block">
                Tıklayarak açıklama, zikir/mantra ve ses frekansını dinleyebilirsiniz
              </span>
            </div>

            {/* Buttons list for selected category */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
              {activeBottomCategory === 'letaif' ? (
                comparisonData.letaifComparison.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setSelectedNode({
                        type: 'letaif',
                        id: l.id,
                        name: l.name,
                        arabicOrSanskrit: l.arabicName,
                        color: l.colorHex,
                        level: l.postLevel,
                        preLevel: l.preLevel,
                        delta: l.delta,
                        description: `${l.spiritualMeaning} • Konum: ${l.location}`,
                        esmaOrMantra: `${l.esma} (${l.dhikrCount.toLocaleString('tr-TR')} Zikir)`,
                        frequencyHz: l.loadedHz,
                        effect: l.effectOnBody,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
                      selectedNode?.id === l.id
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: l.colorHex }} />
                    <span>{l.name.replace(' Letaifi', '')}</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">(+%{l.delta})</span>
                  </button>
                ))
              ) : (
                comparisonData.chakraComparison.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedNode({
                        type: 'chakra',
                        id: c.id,
                        name: `${c.name} (${c.sanskrit})`,
                        arabicOrSanskrit: c.sanskrit,
                        color: c.colorHex,
                        level: c.postLevel,
                        preLevel: c.preLevel,
                        delta: c.delta,
                        description: `${c.spiritualMeaning} • ${c.balancedTraits} • Konum: ${c.location}`,
                        esmaOrMantra: `Bija: ${c.bijaMantra} (${c.frequencyHz} Hz)`,
                        frequencyHz: c.frequencyHz,
                        effect: c.effectOnBody,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
                      selectedNode?.id === c.id
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.colorHex }} />
                    <span>{c.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">(+%{c.delta})</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
