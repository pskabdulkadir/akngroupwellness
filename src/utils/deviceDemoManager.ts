import { 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  onSnapshot,
  query,
  where,
  limit,
  db,
  ensureFirebaseAuthUser
} from '../lib/db';
import { getStoredReferralCode, detectAndSaveReferralCodeFromUrl } from './resellerManager';
import { ADMIN_PHONE_CLEAN } from './authManager';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const DEMO_DURATION_MINUTES = 30;
export const DEMO_DURATION_SECONDS = DEMO_DURATION_MINUTES * 60; // 1800 seconds
export const DEMO_DURATION_MS = DEMO_DURATION_SECONDS * 1000; // 1,800,000 ms

const STORAGE_DEVICE_UUID = 'aurabio_device_uuid_v3';
const STORAGE_DEMO_START_TIME = 'aurabio_demo_start_time_v3';
const STORAGE_DEMO_EXPIRED = 'aurabio_demo_expired_v3';
const STORAGE_DEMO_STARTED = 'aurabio_demo_started_v3';
const STORAGE_DEMO_LAST_TICK = 'aurabio_demo_last_tick_v3';
const STORAGE_DEMO_RENEWAL_PENDING = 'aurabio_demo_renewal_pending_v3';
const STORAGE_DEMO_RENEWAL_REQ_DATA = 'aurabio_demo_renewal_req_data_v3';
const COOKIE_DEVICE_UUID = 'aurabio_device_uuid_v3';

// Cookie storage helpers for cross-browser & private window persistence
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  } catch {
    return null;
  }
}

function setCookie(name: string, val: string, days = 365): void {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(val)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {
    // ignore
  }
}

export interface DeviceSessionDoc {
  deviceUUID: string;
  hardwareHash?: string;
  firstSeenTimestamp: number;
  expiresAtTimestamp: number;
  lastActiveTimestamp: number;
  isExpired: boolean;
  isDemoExpired?: boolean;
  remainingSeconds?: number;
  resetCount?: number;
  referralCode?: string;
  lastActiveAt?: string | any;
  isStarted?: boolean;
  userAgent?: string;
  screenResolution?: string;
  timezone?: string;
  referredByCode?: string;
  clientIp?: string;
  createdAt: string;
  approvedByAdmin?: boolean;
  lastResetAt?: string;
  renewalRequested?: boolean;
  renewalRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  renewalRequestedAt?: string;
  renewalRequesterName?: string;
  renewalRequesterPhone?: string;
  renewalRequesterNote?: string;
  [key: string]: any;
}

export interface DeviceDemoStatus {
  deviceUUID: string;
  isInitialized: boolean;
  isStarted: boolean; // whether the user/device explicitly started the 30-min demo
  isActive: boolean; // true ONLY if demo is running (explicitly started, within 30 mins and not expired)
  isExpired: boolean; // true if 30 minutes expired
  totalSeconds: number; // 1800
  elapsedSeconds: number;
  remainingSeconds: number;
  remainingMinutes: number;
  formattedTime: string; // "30:00" or "28:45" or "00:00"
  demoStartTime: number;
  demoExpiresAt: number;
  percentageRemaining: number; // 0 to 100
  warningLevel: 'normal' | 'warning' | 'critical'; // normal > 10m, warning 5-10m, critical < 5m
}

/**
 * Generates a stable deterministic 32-bit hex hash from a string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

let fpPromise: Promise<any> | null = null;
let resolvedFpVisitorId: string | null = null;

// Initialize FingerprintJS visitor asynchronously
if (typeof window !== 'undefined') {
  try {
    fpPromise = FingerprintJS.load();
    fpPromise.then(fp => fp.get()).then(result => {
      if (result && result.visitorId) {
        resolvedFpVisitorId = result.visitorId.toUpperCase();
      }
    }).catch(err => {
      console.debug('FingerprintJS load notice:', err);
    });
  } catch (e) {
    console.debug('FingerprintJS init notice:', e);
  }
}

/**
 * Deterministic multi-attribute device & browser hardware fingerprinting.
 * Computes deep hardware characteristics (Canvas, WebGL GPU, AudioContext, Screen, Platform)
 * that remain identical even in Incognito/Private windows and across storage clears.
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-ctx';
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', sans-serif";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('AuraBio-Quantum-BioFrekans-2026', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('AuraBio-Quantum-BioFrekans-2026', 4, 17);
    const dataUrl = canvas.toDataURL();
    return simpleHash(dataUrl);
  } catch {
    return 'canvas-err';
  }
}

function getWebGLFingerprint(): string {
  try {
    const glCanvas = document.createElement('canvas');
    const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    
    const parts: string[] = [];
    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      parts.push(`v:${vendor}|r:${renderer}`);
    }
    
    // Additional WebGL precision parameters
    try {
      const maxTex = (gl as any).getParameter((gl as any).MAX_TEXTURE_SIZE) || 0;
      const maxRender = (gl as any).getParameter((gl as any).MAX_RENDERBUFFER_SIZE) || 0;
      const maxVert = (gl as any).getParameter((gl as any).MAX_VERTEX_ATTRIBS) || 0;
      parts.push(`p:${maxTex}_${maxRender}_${maxVert}`);
    } catch {
      // ignore
    }
    
    return simpleHash(parts.join(';'));
  } catch {
    return 'webgl-err';
  }
}

function getAudioFingerprint(): string {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return 'no-audio';
    
    const context = new AudioContextClass();
    const sampleRate = context.sampleRate || 44100;
    const maxChannels = context.destination?.maxChannelCount || 2;
    const baseLatency = (context as any).baseLatency || 0;
    context.close().catch(() => {});
    return `aud:${sampleRate}_${maxChannels}_${baseLatency}`;
  } catch {
    return 'aud-std';
  }
}

/**
 * Deterministic Hardware Hash based entirely on unchangeable device traits
 */
export function getRawHardwareHash(): string {
  if (typeof window === 'undefined') return 'HARDWARE-SERVER';

  const traits: string[] = [];

  // 1. Canvas Fingerprint
  traits.push(`cv:${getCanvasFingerprint()}`);

  // 2. WebGL GPU Fingerprint
  traits.push(`gl:${getWebGLFingerprint()}`);

  // 3. Audio Stack
  traits.push(`au:${getAudioFingerprint()}`);

  // 4. Screen Geometry & Color Depth
  try {
    traits.push(`sc:${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);
    traits.push(`dp:${window.devicePixelRatio || 1}`);
    traits.push(`tc:${navigator.maxTouchPoints || 0}`);
  } catch {
    traits.push('sc:std');
  }

  // 5. Timezone & Locale
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const offset = new Date().getTimezoneOffset();
    traits.push(`tz:${tz}_${offset}`);
    traits.push(`lg:${navigator.language || 'tr'}`);
  } catch {
    traits.push('tz:std');
  }

  // 6. CPU & Memory & Platform
  try {
    traits.push(`pl:${navigator.platform || 'web'}`);
    traits.push(`hc:${navigator.hardwareConcurrency || 4}`);
    if ((navigator as any).deviceMemory) {
      traits.push(`dm:${(navigator as any).deviceMemory}`);
    }
  } catch {
    traits.push('pl:std');
  }

  const raw = traits.join('||');
  const h1 = simpleHash(raw).toUpperCase().padStart(8, '0');
  const h2 = simpleHash(raw.split('').reverse().join('')).toUpperCase().padStart(8, '0');
  return `HW-${h1}-${h2}`;
}

/**
 * Deterministic multi-attribute device & browser hardware fingerprinting
 */
export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'DEV-SERVER-NODE';
  }

  // 1. Check all multi-layer storage caches (Cookie, LocalStorage, SessionStorage)
  try {
    const fromCookie = getCookie(COOKIE_DEVICE_UUID);
    if (fromCookie && fromCookie.startsWith('DEV-AURA-')) {
      return fromCookie;
    }
    const fromLocal = localStorage.getItem(STORAGE_DEVICE_UUID);
    if (fromLocal && fromLocal.startsWith('DEV-AURA-')) {
      setCookie(COOKIE_DEVICE_UUID, fromLocal, 365);
      return fromLocal;
    }
    const fromSession = sessionStorage.getItem(STORAGE_DEVICE_UUID);
    if (fromSession && fromSession.startsWith('DEV-AURA-')) {
      setCookie(COOKIE_DEVICE_UUID, fromSession, 365);
      return fromSession;
    }
  } catch {
    // continue
  }

  // 2. Generate deterministic hardware hash
  const hwHash = getRawHardwareHash();
  const cleanParts = hwHash.replace('HW-', '').split('-');
  const part1 = cleanParts[0] || 'AURA';
  const part2 = cleanParts[1] || 'FREQ';
  const deviceUUID = `DEV-AURA-${part1.substring(0, 4)}-${part2.substring(0, 4)}-${part1.substring(4, 8) || '2026'}`;

  // Persist across all layers
  try {
    localStorage.setItem(STORAGE_DEVICE_UUID, deviceUUID);
    sessionStorage.setItem(STORAGE_DEVICE_UUID, deviceUUID);
    setCookie(COOKIE_DEVICE_UUID, deviceUUID, 365);
  } catch {
    // ignore
  }

  return deviceUUID;
}

// In-memory status state
let cachedDemoStatus: DeviceDemoStatus | null = null;
const listeners = new Set<(status: DeviceDemoStatus) => void>();

/**
 * Format seconds into mm:ss (e.g. 1725 -> "28:45")
 */
export function formatDemoTime(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Synchronous getter for current local demo state.
 * Guarantees that the demo begins on first visit and persists its exact start timestamp,
 * so page reloads continue counting down in the background instead of restarting.
 */
export function getDeviceDemoStatus(): DeviceDemoStatus {
  if (typeof window === 'undefined') {
    return {
      deviceUUID: 'DEV-SERVER',
      isInitialized: true,
      isStarted: false,
      isActive: false,
      isExpired: false,
      totalSeconds: DEMO_DURATION_SECONDS,
      elapsedSeconds: 0,
      remainingSeconds: DEMO_DURATION_SECONDS,
      remainingMinutes: DEMO_DURATION_MINUTES,
      formattedTime: '30:00',
      demoStartTime: 0,
      demoExpiresAt: 0,
      percentageRemaining: 100,
      warningLevel: 'normal'
    };
  }

  const deviceUUID = generateDeviceFingerprint();
  const isLocallyExpired = localStorage.getItem(STORAGE_DEMO_EXPIRED) === 'true' || 
                           getCookie(STORAGE_DEMO_EXPIRED) === 'true';

  let startTime = 0;
  try {
    const rawStart = localStorage.getItem(STORAGE_DEMO_START_TIME) || getCookie(STORAGE_DEMO_START_TIME);
    if (rawStart) {
      startTime = parseInt(rawStart, 10);
    }
  } catch {
    // ignore
  }

  // If this device was already marked expired
  if (isLocallyExpired) {
    const expiredStatus: DeviceDemoStatus = {
      deviceUUID,
      isInitialized: true,
      isStarted: true,
      isActive: false,
      isExpired: true,
      totalSeconds: DEMO_DURATION_SECONDS,
      elapsedSeconds: DEMO_DURATION_SECONDS,
      remainingSeconds: 0,
      remainingMinutes: 0,
      formattedTime: '00:00',
      demoStartTime: startTime || 0,
      demoExpiresAt: startTime ? startTime + DEMO_DURATION_MS : 0,
      percentageRemaining: 0,
      warningLevel: 'critical'
    };
    cachedDemoStatus = expiredStatus;
    return expiredStatus;
  }

  const isStarted = localStorage.getItem(STORAGE_DEMO_STARTED) === 'true' || 
                    getCookie(STORAGE_DEMO_STARTED) === 'true';

  // If the user has NOT clicked the 30-minute demo button yet:
  if (!isStarted || !startTime || isNaN(startTime) || startTime <= 0) {
    const unstartedStatus: DeviceDemoStatus = {
      deviceUUID,
      isInitialized: true,
      isStarted: false,
      isActive: false,
      isExpired: false,
      totalSeconds: DEMO_DURATION_SECONDS,
      elapsedSeconds: 0,
      remainingSeconds: DEMO_DURATION_SECONDS,
      remainingMinutes: DEMO_DURATION_MINUTES,
      formattedTime: '30:00',
      demoStartTime: 0,
      demoExpiresAt: 0,
      percentageRemaining: 100,
      warningLevel: 'normal'
    };
    cachedDemoStatus = unstartedStatus;
    return unstartedStatus;
  }

  const now = Date.now();
  const expiresAt = startTime + DEMO_DURATION_MS;
  const elapsedMs = Math.max(0, now - startTime);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remainingSeconds = Math.max(0, DEMO_DURATION_SECONDS - elapsedSeconds);
  const isExpired = remainingSeconds <= 0;

  if (isExpired) {
    try {
      localStorage.setItem(STORAGE_DEMO_EXPIRED, 'true');
      setCookie(STORAGE_DEMO_EXPIRED, 'true', 365);
    } catch {
      // ignore
    }
  }

  const percentageRemaining = Math.max(0, Math.min(100, (remainingSeconds / DEMO_DURATION_SECONDS) * 100));

  let warningLevel: 'normal' | 'warning' | 'critical' = 'normal';
  if (remainingSeconds <= 5 * 60) {
    warningLevel = 'critical'; // under 5 minutes
  } else if (remainingSeconds <= 10 * 60) {
    warningLevel = 'warning'; // 5 to 10 minutes
  }

  const status: DeviceDemoStatus = {
    deviceUUID,
    isInitialized: true,
    isStarted: true,
    isActive: !isExpired && remainingSeconds > 0,
    isExpired,
    totalSeconds: DEMO_DURATION_SECONDS,
    elapsedSeconds,
    remainingSeconds,
    remainingMinutes: Math.ceil(remainingSeconds / 60),
    formattedTime: formatDemoTime(remainingSeconds),
    demoStartTime: startTime,
    demoExpiresAt: expiresAt,
    percentageRemaining,
    warningLevel
  };

  cachedDemoStatus = status;
  return status;
}

/**
 * Start the 30-minute demo session for this device (Explicit user button click).
 * Preserves the original start timestamp if the demo was already running so the timer
 * keeps decreasing in the background and NEVER restarts on button clicks.
 * If expired, it cannot be restarted unless admin has approved it or forceReset is true.
 */
export async function startDeviceDemoSession(overrideRefCode?: string, forceReset = false): Promise<DeviceDemoStatus> {
  const deviceUUID = generateDeviceFingerprint();
  const hwHash = getRawHardwareHash();
  const currentStatus = getDeviceDemoStatus();
  const now = Date.now();
  const refCode = overrideRefCode || detectAndSaveReferralCodeFromUrl() || getStoredReferralCode() || '';

  // If already expired and NOT force-reset by admin: verify if admin approved in Firestore
  if (currentStatus.isExpired && !forceReset) {
    try {
      await ensureFirebaseAuthUser();
      const docRef = doc(db, 'device_sessions', deviceUUID);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const remote = snap.data() as DeviceSessionDoc;
        const remoteApproved = remote.approvedByAdmin === true || remote.renewalRequestStatus === 'approved';
        if (remoteApproved && (remote.expiresAtTimestamp || 0) > now) {
          // Admin has approved a fresh session!
          localStorage.removeItem(STORAGE_DEMO_EXPIRED);
          setCookie(STORAGE_DEMO_EXPIRED, '', -1);
          localStorage.removeItem(STORAGE_DEMO_RENEWAL_PENDING);
          localStorage.setItem(STORAGE_DEMO_START_TIME, (remote.firstSeenTimestamp || now).toString());
          setCookie(STORAGE_DEMO_START_TIME, (remote.firstSeenTimestamp || now).toString(), 365);
          localStorage.setItem(STORAGE_DEMO_STARTED, 'true');
          setCookie(STORAGE_DEMO_STARTED, 'true', 365);
          const updated = getDeviceDemoStatus();
          notifyListeners(updated);
          return updated;
        }
      }
    } catch {
      // ignore
    }

    // Still expired and not approved by admin -> keep expired
    return currentStatus;
  }

  // Preserve existing demoStartTime if already started and active
  const startTime = (!forceReset && currentStatus.demoStartTime > 0 && !currentStatus.isExpired)
    ? currentStatus.demoStartTime
    : now;
  const expiresAt = startTime + DEMO_DURATION_MS;

  // 1. Save locally across all storage layers
  try {
    localStorage.setItem(STORAGE_DEMO_START_TIME, startTime.toString());
    localStorage.setItem(STORAGE_DEMO_STARTED, 'true');
    if (!currentStatus.isExpired || forceReset) {
      localStorage.removeItem(STORAGE_DEMO_EXPIRED);
      setCookie(STORAGE_DEMO_EXPIRED, '', -1);
    }
    setCookie(STORAGE_DEMO_START_TIME, startTime.toString(), 365);
    setCookie(STORAGE_DEMO_STARTED, 'true', 365);
  } catch {
    // ignore
  }

  // 2. Sync to Firestore
  try {
    await ensureFirebaseAuthUser();
    const docRef = doc(db, 'device_sessions', deviceUUID);
    const newSession: Partial<DeviceSessionDoc> = {
      deviceUUID,
      hardwareHash: hwHash,
      firstSeenTimestamp: startTime,
      expiresAtTimestamp: expiresAt,
      lastActiveTimestamp: now,
      isExpired: now >= expiresAt,
      isStarted: true,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
      referredByCode: refCode,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, newSession, { merge: true });
  } catch (err) {
    console.debug('Start demo Firestore sync notice:', err);
  }

  const updated = getDeviceDemoStatus();
  notifyListeners(updated);
  return updated;
}

/**
 * Initializes device demo on startup, validating with Firestore device_sessions collection
 * and hardware fingerprint matching to prevent timer resets across private windows or storage clears.
 */
export async function initializeDeviceDemo(): Promise<DeviceDemoStatus> {
  const localStatus = getDeviceDemoStatus();
  const deviceUUID = localStatus.deviceUUID;
  const hwHash = getRawHardwareHash();

  // Check and detect URL referral code synchronously
  const refCode = detectAndSaveReferralCodeFromUrl() || getStoredReferralCode() || '';

  try {
    await ensureFirebaseAuthUser();
    const docRef = doc(db, 'device_sessions', deviceUUID);
    let snap = await getDoc(docRef);

    // If direct UUID document is not found, search by immutable hardware hash
    if (!snap.exists()) {
      try {
        const hwQuery = query(collection(db, 'device_sessions'), where('hardwareHash', '==', hwHash), limit(1));
        const hwQuerySnap = await getDocs(hwQuery);
        if (!hwQuerySnap.empty) {
          snap = hwQuerySnap.docs[0];
        }
      } catch (e) {
        console.debug('Hardware query fallback notice:', e);
      }
    }

    const now = Date.now();

    if (snap && snap.exists()) {
      const data = snap.data() as DeviceSessionDoc;
      const remoteStartTime = data.firstSeenTimestamp || 0;
      const remoteExpiresAt = data.expiresAtTimestamp || (remoteStartTime > 0 ? remoteStartTime + DEMO_DURATION_MS : 0);
      const isAdminApproved = data.approvedByAdmin === true || data.renewalRequestStatus === 'approved';
      const remoteIsStarted = data.isStarted === true;

      let effectiveStartTime = remoteStartTime;
      let effectiveExpiresAt = remoteExpiresAt;
      let isNowExpired = false;

      if (isAdminApproved && remoteExpiresAt > now) {
        // Admin approved this device for a new demo session
        effectiveStartTime = remoteStartTime || now;
        effectiveExpiresAt = remoteExpiresAt;
        isNowExpired = false;
        localStorage.removeItem(STORAGE_DEMO_EXPIRED);
        setCookie(STORAGE_DEMO_EXPIRED, '', -1);
        localStorage.removeItem(STORAGE_DEMO_RENEWAL_PENDING);
        localStorage.setItem(STORAGE_DEMO_START_TIME, effectiveStartTime.toString());
        setCookie(STORAGE_DEMO_START_TIME, effectiveStartTime.toString(), 365);
        localStorage.setItem(STORAGE_DEMO_STARTED, 'true');
        setCookie(STORAGE_DEMO_STARTED, 'true', 365);
      } else if (remoteIsStarted && remoteStartTime > 0) {
        // Regular 1-time 30-min demo check for devices that already started
        effectiveStartTime = remoteStartTime;
        effectiveExpiresAt = remoteExpiresAt > 0 ? remoteExpiresAt : remoteStartTime + DEMO_DURATION_MS;
        isNowExpired = Boolean(data.isExpired) || (effectiveExpiresAt > 0 && now >= effectiveExpiresAt);

        localStorage.setItem(STORAGE_DEMO_START_TIME, effectiveStartTime.toString());
        setCookie(STORAGE_DEMO_START_TIME, effectiveStartTime.toString(), 365);
        localStorage.setItem(STORAGE_DEMO_STARTED, 'true');
        setCookie(STORAGE_DEMO_STARTED, 'true', 365);
      } else if (localStatus.isStarted && localStatus.demoStartTime > 0) {
        // Local device has started demo
        effectiveStartTime = localStatus.demoStartTime;
        effectiveExpiresAt = effectiveStartTime + DEMO_DURATION_MS;
        isNowExpired = now >= effectiveExpiresAt;

        localStorage.setItem(STORAGE_DEMO_START_TIME, effectiveStartTime.toString());
        setCookie(STORAGE_DEMO_START_TIME, effectiveStartTime.toString(), 365);
        localStorage.setItem(STORAGE_DEMO_STARTED, 'true');
        setCookie(STORAGE_DEMO_STARTED, 'true', 365);
      } else {
        // Device has NOT started demo yet
        isNowExpired = false;
        effectiveStartTime = 0;
        effectiveExpiresAt = 0;
      }

      if (isNowExpired) {
        localStorage.setItem(STORAGE_DEMO_EXPIRED, 'true');
        setCookie(STORAGE_DEMO_EXPIRED, 'true', 365);
      } else if (!data.isExpired) {
        localStorage.removeItem(STORAGE_DEMO_EXPIRED);
      }

      // Update session in Firestore
      try {
        setDoc(doc(db, 'device_sessions', snap.id), {
          deviceUUID: snap.id,
          hardwareHash: hwHash,
          firstSeenTimestamp: effectiveStartTime,
          expiresAtTimestamp: effectiveExpiresAt,
          lastActiveTimestamp: now,
          isStarted: effectiveStartTime > 0,
          isExpired: isNowExpired,
          referredByCode: refCode || data.referredByCode || ''
        }, { merge: true });
      } catch (e) {
        console.debug('Firestore lastActive update warning:', e);
      }
    } else {
      // First time this physical device is recorded on Firestore -> Register without starting demo yet
      const newSession: DeviceSessionDoc = {
        deviceUUID,
        hardwareHash: hwHash,
        firstSeenTimestamp: 0,
        expiresAtTimestamp: 0,
        lastActiveTimestamp: now,
        isExpired: false,
        isStarted: false,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
        timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
        referredByCode: refCode,
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(docRef, newSession, { merge: true });
      } catch (e) {
        console.debug('Firestore new device session save warning:', e);
      }
    }
  } catch (err) {
    console.debug('Device demo Firestore check fallback to local:', err);
  }

  // Setup Firestore real-time listener on this device document
  try {
    const docRef = doc(db, 'device_sessions', deviceUUID);
    onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const remote = snapshot.data() as DeviceSessionDoc;
        const now = Date.now();
        const isAdminApproved = remote.approvedByAdmin === true || remote.renewalRequestStatus === 'approved';
        
        // If admin approved demo renewal or reset this device
        if (isAdminApproved && remote.isStarted && (remote.expiresAtTimestamp || 0) > now) {
          localStorage.removeItem(STORAGE_DEMO_RENEWAL_PENDING);
          localStorage.removeItem(STORAGE_DEMO_EXPIRED);
          localStorage.setItem(STORAGE_DEMO_START_TIME, (remote.firstSeenTimestamp || now).toString());
          localStorage.setItem(STORAGE_DEMO_STARTED, 'true');
          setCookie(STORAGE_DEMO_START_TIME, (remote.firstSeenTimestamp || now).toString(), 365);
          setCookie(STORAGE_DEMO_STARTED, 'true', 365);
          const updated = getDeviceDemoStatus();
          notifyListeners(updated);
        } else if (remote.renewalRequestStatus === 'pending') {
          localStorage.setItem(STORAGE_DEMO_RENEWAL_PENDING, 'true');
        } else if (remote.renewalRequestStatus === 'rejected') {
          localStorage.removeItem(STORAGE_DEMO_RENEWAL_PENDING);
        } else if (remote.isExpired === true || (remote.expiresAtTimestamp && now >= remote.expiresAtTimestamp && !isAdminApproved)) {
          localStorage.setItem(STORAGE_DEMO_EXPIRED, 'true');
          setCookie(STORAGE_DEMO_EXPIRED, 'true', 365);
          const updated = getDeviceDemoStatus();
          notifyListeners(updated);
        }
      }
    }, (err) => {
      console.debug('Device snapshot listener note:', err);
    });
  } catch (e) {
    // ignore
  }

  const finalStatus = getDeviceDemoStatus();
  notifyListeners(finalStatus);
  return finalStatus;
}

/**
 * Notifies all subscribers about status changes
 */
function notifyListeners(status: DeviceDemoStatus) {
  listeners.forEach(cb => {
    try {
      cb(status);
    } catch (e) {
      console.error('Demo listener error:', e);
    }
  });
}

/**
 * Subscribes to real-time timer updates (fires every second)
 */
export function subscribeToDeviceDemo(callback: (status: DeviceDemoStatus) => void): () => void {
  listeners.add(callback);
  
  // Immediately call with current status
  callback(getDeviceDemoStatus());

  // Setup interval ticker if not already running
  const intervalId = setInterval(() => {
    const updated = getDeviceDemoStatus();
    notifyListeners(updated);
  }, 1000);

  return () => {
    listeners.delete(callback);
    clearInterval(intervalId);
  };
}

/**
 * Explicitly marks this device's demo session as expired in both storage and Firestore
 */
export async function markDeviceDemoExpired(): Promise<void> {
  try {
    localStorage.setItem(STORAGE_DEMO_EXPIRED, 'true');
    setCookie(STORAGE_DEMO_EXPIRED, 'true', 365);
  } catch {
    // ignore
  }

  const deviceUUID = generateDeviceFingerprint();
  try {
    await ensureFirebaseAuthUser();
    const docRef = doc(db, 'device_sessions', deviceUUID);
    await setDoc(docRef, {
      isExpired: true,
      lastActiveTimestamp: Date.now()
    }, { merge: true });
  } catch (e) {
    console.debug('Mark expired firestore sync:', e);
  }

  const updated = getDeviceDemoStatus();
  notifyListeners(updated);
}

/**
 * Request administrator approval via WhatsApp to renew/reset the 30-minute demo
 */
export async function requestDemoRenewal(data?: {
  fullName?: string;
  phone?: string;
  note?: string;
}): Promise<{ success: boolean; whatsappUrl: string; deviceUUID: string }> {
  const deviceUUID = generateDeviceFingerprint();
  const cleanName = data?.fullName?.trim() || 'Misafir Ziyaretçi';
  const cleanPhone = data?.phone?.trim() || '';
  const cleanNote = data?.note?.trim() || '';
  const nowIso = new Date().toISOString();

  // Save state locally as pending approval
  try {
    localStorage.setItem(STORAGE_DEMO_RENEWAL_PENDING, 'true');
    localStorage.setItem(STORAGE_DEMO_RENEWAL_REQ_DATA, JSON.stringify({
      fullName: cleanName,
      phone: cleanPhone,
      note: cleanNote,
      requestedAt: nowIso
    }));
  } catch (e) {
    // ignore
  }

  // Update Firestore device session
  try {
    await ensureFirebaseAuthUser();
    const docRef = doc(db, 'device_sessions', deviceUUID);
    await setDoc(docRef, {
      deviceUUID,
      renewalRequested: true,
      renewalRequestStatus: 'pending',
      renewalRequestedAt: nowIso,
      renewalRequesterName: cleanName,
      renewalRequesterPhone: cleanPhone,
      renewalRequesterNote: cleanNote,
      lastActiveTimestamp: Date.now()
    }, { merge: true });
  } catch (err) {
    console.debug('Firestore demo renewal request note:', err);
  }

  // Build admin WhatsApp approval request URL
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aurabio.app';
  const message = `🌟 *AuraBio Frekans — 30 Dk Demo Tekrarı & Yenileme Onay Talebi*

👤 *Talep Eden:* ${cleanName}
📱 *İletişim Tel:* ${cleanPhone || 'Belirtilmedi'}
🆔 *Cihaz Kimliği:* \`${deviceUUID}\`
📅 *Talep Tarihi:* ${new Date().toLocaleString('tr-TR')}
${cleanNote ? `💬 *Not:* ${cleanNote}\n` : ''}
⚠️ *Talep Durumu:* 30 dakikalık deneme sürem tamamlandı. Sistemi tekrar test etmek ve incelemek için demo süremin yenilenmesini talep ediyorum.

👉 *Yönetici Onay Paneli:*
${appUrl} (Yönetici Paneli > Cihaz Demo Takibi menüsünden tek tıkla onaylayabilirsiniz)`;

  const whatsappUrl = `https://wa.me/${ADMIN_PHONE_CLEAN}?text=${encodeURIComponent(message)}`;

  return {
    success: true,
    whatsappUrl,
    deviceUUID
  };
}

/**
 * Get current device's renewal request status
 */
export function getDemoRenewalState(): {
  isPending: boolean;
  requestedAt?: string;
  requesterName?: string;
  requesterPhone?: string;
} {
  if (typeof window === 'undefined') return { isPending: false };
  try {
    const isPending = localStorage.getItem(STORAGE_DEMO_RENEWAL_PENDING) === 'true';
    const rawData = localStorage.getItem(STORAGE_DEMO_RENEWAL_REQ_DATA);
    let parsed: any = {};
    if (rawData) {
      try { parsed = JSON.parse(rawData); } catch { /* ignore */ }
    }
    return {
      isPending,
      requestedAt: parsed.requestedAt,
      requesterName: parsed.fullName,
      requesterPhone: parsed.phone
    };
  } catch {
    return { isPending: false };
  }
}

/**
 * Cancel or clear pending renewal state locally
 */
export function clearDemoRenewalPendingState(): void {
  try {
    localStorage.removeItem(STORAGE_DEMO_RENEWAL_PENDING);
    localStorage.removeItem(STORAGE_DEMO_RENEWAL_REQ_DATA);
  } catch {
    // ignore
  }
}

/**
 * ADMIN: Approve demo renewal and start fresh 30-minute session
 */
export async function adminApproveDemoRenewal(deviceUUID: string, extraMinutes: number = 30): Promise<boolean> {
  try {
    await ensureFirebaseAuthUser();
    const now = Date.now();
    const newExpires = now + (extraMinutes * 60 * 1000);
    const docRef = doc(db, 'device_sessions', deviceUUID);

    await setDoc(docRef, {
      deviceUUID,
      renewalRequested: false,
      renewalRequestStatus: 'approved',
      firstSeenTimestamp: now,
      expiresAtTimestamp: newExpires,
      lastActiveTimestamp: now,
      isExpired: false,
      isStarted: true,
      approvedByAdmin: true,
      lastResetAt: new Date().toISOString()
    }, { merge: true });

    // If it's the current device running in this browser, also reset locally
    const currentDeviceUUID = generateDeviceFingerprint();
    if (deviceUUID === currentDeviceUUID) {
      clearDemoRenewalPendingState();
      resetDeviceDemoForTest();
    }

    return true;
  } catch (err) {
    console.error('Admin approve demo renewal failed:', err);
    return false;
  }
}

/**
 * ADMIN: Reject demo renewal request
 */
export async function adminRejectDemoRenewal(deviceUUID: string): Promise<boolean> {
  try {
    await ensureFirebaseAuthUser();
    const docRef = doc(db, 'device_sessions', deviceUUID);
    await setDoc(docRef, {
      renewalRequested: false,
      renewalRequestStatus: 'rejected',
      lastActiveTimestamp: Date.now()
    }, { merge: true });

    const currentDeviceUUID = generateDeviceFingerprint();
    if (deviceUUID === currentDeviceUUID) {
      clearDemoRenewalPendingState();
    }

    return true;
  } catch (err) {
    console.error('Admin reject demo renewal failed:', err);
    return false;
  }
}

/**
 * Reset demo for testing or admin preview (development only)
 */
export function resetDeviceDemoForTest(): void {
  try {
    localStorage.removeItem(STORAGE_DEMO_START_TIME);
    localStorage.removeItem(STORAGE_DEMO_EXPIRED);
    localStorage.removeItem(STORAGE_DEMO_STARTED);
    localStorage.removeItem(STORAGE_DEMO_LAST_TICK);
    localStorage.removeItem(STORAGE_DEMO_RENEWAL_PENDING);
    localStorage.setItem(STORAGE_DEMO_START_TIME, Date.now().toString());
    localStorage.setItem(STORAGE_DEMO_STARTED, 'true');
    setCookie(STORAGE_DEMO_START_TIME, Date.now().toString(), 365);
    setCookie(STORAGE_DEMO_STARTED, 'true', 365);
  } catch {
    // ignore
  }
  const updated = getDeviceDemoStatus();
  notifyListeners(updated);
}

/**
 * ADMIN: Get all tracked device demo sessions from Firestore
 */
export async function adminGetAllDeviceSessions(): Promise<DeviceSessionDoc[]> {
  try {
    await ensureFirebaseAuthUser();
    const snapshot = await getDocs(collection(db, 'device_sessions'));
    const list: DeviceSessionDoc[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as DeviceSessionDoc);
    });
    // Sort by last active / created descending
    return list.sort((a, b) => (b.lastActiveTimestamp || 0) - (a.lastActiveTimestamp || 0));
  } catch (err) {
    console.error('Error fetching device sessions for admin:', err);
    return [];
  }
}

/**
 * ADMIN: Reset / Extend 30-minute demo for a specific device
 */
export async function adminResetDeviceDemo(deviceUUID: string, extraMinutes: number = 30): Promise<boolean> {
  try {
    await ensureFirebaseAuthUser();
    const now = Date.now();
    const newExpires = now + (extraMinutes * 60 * 1000);
    const docRef = doc(db, 'device_sessions', deviceUUID);

    await setDoc(docRef, {
      deviceUUID,
      firstSeenTimestamp: now,
      expiresAtTimestamp: newExpires,
      lastActiveTimestamp: now,
      isExpired: false,
      isStarted: true,
      approvedByAdmin: true,
      lastResetAt: new Date().toISOString()
    }, { merge: true });

    // If it's the current device running in this browser, also reset locally
    const currentDeviceUUID = generateDeviceFingerprint();
    if (deviceUUID === currentDeviceUUID) {
      resetDeviceDemoForTest();
    }

    return true;
  } catch (err) {
    console.error('Admin reset device demo failed:', err);
    return false;
  }
}

/**
 * ADMIN: Instantly expire a device demo session
 */
export async function adminExpireDeviceDemo(deviceUUID: string): Promise<boolean> {
  try {
    await ensureFirebaseAuthUser();
    const docRef = doc(db, 'device_sessions', deviceUUID);
    await setDoc(docRef, {
      isExpired: true,
      lastActiveTimestamp: Date.now()
    }, { merge: true });

    const currentDeviceUUID = generateDeviceFingerprint();
    if (deviceUUID === currentDeviceUUID) {
      markDeviceDemoExpired();
    }

    return true;
  } catch (err) {
    console.error('Admin expire device demo failed:', err);
    return false;
  }
}

/**
 * ADMIN: Delete a device record
 */
export async function adminDeleteDeviceSession(deviceUUID: string): Promise<boolean> {
  try {
    await ensureFirebaseAuthUser();
    const docRef = doc(db, 'device_sessions', deviceUUID);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Admin delete device session failed:', err);
    return false;
  }
}
