import { ScanResult } from '../types';
import { db, doc, setDoc, deleteDoc, collection, getDocs, limit, query, onSnapshot, Unsubscribe } from '../lib/db';

const STORAGE_KEY_SCANS = 'aurabio_scan_history_v1';
const USER_SCANS_PREFIX = 'aurabio_user_scans_';
const DELETED_SCANS_PREFIX = 'aurabio_deleted_scans_';
const MAX_SCANS_LIMIT = 40;

/**
 * Strips huge snapshot base64 payloads if needed to keep localStorage footprint lightweight (< 200KB)
 */
function sanitizeScanForLocalStorage(scan: ScanResult, includeSnapshot: boolean = true): ScanResult {
  if (!scan) return scan;
  
  // If snapshot is a large base64 data URL, trim or remove for compact local storage if needed
  const hasLargeSnapshot = (scan.snapshotUrl && scan.snapshotUrl.length > 50000) || 
                           (scan.photoSnapshotUrl && scan.photoSnapshotUrl.length > 50000);
  
  if (!includeSnapshot || hasLargeSnapshot) {
    // If we need to keep snapshot, downsample/truncate or omit large base64 from localStorage
    const sanitized: ScanResult = { ...scan };
    if (!includeSnapshot) {
      delete sanitized.snapshotUrl;
      delete sanitized.photoSnapshotUrl;
    }
    return sanitized;
  }
  return scan;
}

/**
 * Safely writes JSON array to LocalStorage with progressive fallbacks on quota exceeded
 */
function safeSetItemWithPruning(key: string, scans: ScanResult[]): void {
  // Attempt 1: Full list
  try {
    localStorage.setItem(key, JSON.stringify(scans));
    return;
  } catch (err1) {
    console.warn(`[Storage] Quota exceeded on ${key}, attempting with 20 items...`, err1);
  }

  // Attempt 2: 20 items
  try {
    const pruned20 = scans.slice(0, 20);
    localStorage.setItem(key, JSON.stringify(pruned20));
    return;
  } catch (err2) {
    console.warn(`[Storage] Quota still exceeded, removing snapshots from records...`, err2);
  }

  // Attempt 3: Strip snapshot URLs from all items (which take 95% of space)
  try {
    const noSnapshots = scans.slice(0, 25).map(s => sanitizeScanForLocalStorage(s, false));
    localStorage.setItem(key, JSON.stringify(noSnapshots));
    return;
  } catch (err3) {
    console.warn(`[Storage] Quota still exceeded, reducing to 10 lightweight items...`, err3);
  }

  // Attempt 4: 10 lightweight items
  try {
    const ultraLight = scans.slice(0, 10).map(s => sanitizeScanForLocalStorage(s, false));
    localStorage.setItem(key, JSON.stringify(ultraLight));
    return;
  } catch (err4) {
    console.error(`[Storage] Critical LocalStorage quota exceeded. Clearing old key:`, err4);
    try {
      localStorage.removeItem(key);
      const single = scans.slice(0, 3).map(s => sanitizeScanForLocalStorage(s, false));
      localStorage.setItem(key, JSON.stringify(single));
    } catch {
      // Ignore if browser storage is completely blocked
    }
  }
}

/**
 * Get list of deleted scan IDs to prevent re-sync from cloud
 */
function getDeletedScanIds(userUid?: string): Set<string> {
  const ids = new Set<string>();
  try {
    const globalRaw = localStorage.getItem(`${DELETED_SCANS_PREFIX}global`);
    if (globalRaw) {
      const parsed = JSON.parse(globalRaw);
      if (Array.isArray(parsed)) parsed.forEach((id) => ids.add(id));
    }
    if (userUid && userUid !== 'guest') {
      const userRaw = localStorage.getItem(`${DELETED_SCANS_PREFIX}${userUid}`);
      if (userRaw) {
        const parsed = JSON.parse(userRaw);
        if (Array.isArray(parsed)) parsed.forEach((id) => ids.add(id));
      }
    }
  } catch {
    // Ignore
  }
  return ids;
}

function markScanAsDeleted(id: string, userUid?: string): void {
  try {
    const key = `${DELETED_SCANS_PREFIX}${userUid && userUid !== 'guest' ? userUid : 'global'}`;
    const raw = localStorage.getItem(key);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(key, JSON.stringify(list.slice(-300)));
    }
  } catch {
    // Ignore
  }
}

/**
 * Save scan result to LocalStorage and Firestore cloud database with user association
 */
export function saveScanResult(result: ScanResult, userInfo?: { uid?: string; email?: string; fullName?: string }): void {
  try {
    const targetUid = userInfo?.uid || result.userUid || result.userId || 'guest';
    const targetEmail = userInfo?.email || result.userEmail || '';
    const targetName = userInfo?.fullName || result.userName || 'Misafir Danışan';

    const enrichedResult: ScanResult = {
      ...result,
      userUid: targetUid,
      userId: targetUid,
      userEmail: targetEmail,
      userName: targetName,
    };

    // 1. Update global cached scan history using safe pruning
    const existing = getScanHistory();
    const updated = [enrichedResult, ...existing.filter((s) => s.id !== result.id)].slice(0, MAX_SCANS_LIMIT);
    safeSetItemWithPruning(STORAGE_KEY_SCANS, updated);
    window.dispatchEvent(new CustomEvent('aurabio_scans_updated'));

    // 2. If user is logged in, also update isolated user-specific storage key
    if (targetUid && targetUid !== 'guest') {
      try {
        const userKey = `${USER_SCANS_PREFIX}${targetUid}`;
        const userExisting = getUserScanHistory(targetUid, targetEmail);
        const userUpdated = [enrichedResult, ...userExisting.filter((s) => s.id !== result.id)].slice(0, MAX_SCANS_LIMIT);
        safeSetItemWithPruning(userKey, userUpdated);
      } catch (err) {
        console.debug('User-specific local storage write notice:', err);
      }
    }

    // 3. Asynchronously sync to Firestore collection 'scan_records'
    try {
      const docRef = doc(db, 'scan_records', result.id);
      const payload = {
        ...enrichedResult,
        syncedAt: new Date().toISOString()
      };
      setDoc(docRef, payload, { merge: true }).catch((err) => {
        console.debug('Firestore scan save notice (saved to local cache):', err?.message);
      });
    } catch (fsErr) {
      console.debug('Firestore scan write notice:', fsErr);
    }
  } catch (err) {
    console.error('Failed to save scan history to LocalStorage/Firestore:', err);
  }
}

/**
 * Get cached scan history from LocalStorage (global)
 */
export function getScanHistory(): ScanResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SCANS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed as ScanResult[];
  } catch (err) {
    console.error('Failed to read scan history from LocalStorage:', err);
    return [];
  }
}

/**
 * Get scan history belonging EXCLUSIVELY to a specific user member.
 * Other members' reports are strictly filtered out and never returned.
 */
export function getUserScanHistory(userUid?: string, userEmail?: string): ScanResult[] {
  try {
    const deletedIds = getDeletedScanIds(userUid);

    if (!userUid || userUid === 'guest') {
      const allScans = getScanHistory();
      return allScans.filter(s => (!s.userUid || s.userUid === 'guest') && !deletedIds.has(s.id));
    }

    // Check user-isolated key first
    const userKey = `${USER_SCANS_PREFIX}${userUid}`;
    const userSpecificData = localStorage.getItem(userKey);
    let userSpecificScans: ScanResult[] = [];
    if (userSpecificData) {
      try {
        const parsed = JSON.parse(userSpecificData);
        if (Array.isArray(parsed)) userSpecificScans = parsed;
      } catch {
        userSpecificScans = [];
      }
    }

    // Also search global cache for any scans matching this user's UID or Email
    const globalScans = getScanHistory();
    const matchedGlobal = globalScans.filter((s) => {
      if (s.userUid && s.userUid === userUid) return true;
      if (s.userId && s.userId === userUid) return true;
      if (userEmail && s.userEmail && s.userEmail.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    });

    // Merge and deduplicate by scan ID, excluding any deleted IDs
    const mergedMap = new Map<string, ScanResult>();
    userSpecificScans.forEach(s => {
      if (!deletedIds.has(s.id)) mergedMap.set(s.id, s);
    });
    matchedGlobal.forEach(s => {
      if (!deletedIds.has(s.id)) mergedMap.set(s.id, s);
    });

    const result = Array.from(mergedMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, MAX_SCANS_LIMIT);

    return result;
  } catch (err) {
    console.error('Failed to get user scan history:', err);
    return [];
  }
}

/**
 * Fetch and synchronize scans for a SPECIFIC user from Firestore cloud database.
 * Strictly ignores documents belonging to any other user and deleted items.
 */
export async function syncUserScansFromFirestore(userUid: string, userEmail?: string): Promise<ScanResult[]> {
  try {
    if (!userUid || userUid === 'guest') {
      return getUserScanHistory(userUid, userEmail);
    }

    const deletedIds = getDeletedScanIds(userUid);
    const scansCol = collection(db, 'scan_records');
    const q = query(scansCol, limit(100));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const userScans: ScanResult[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as ScanResult;
        if (data && data.id && data.timestamp && !deletedIds.has(data.id)) {
          // Strictly verify that this scan belongs to this specific user
          const isMatch =
            (data.userUid && data.userUid === userUid) ||
            (data.userId && data.userId === userUid) ||
            (userEmail && data.userEmail && data.userEmail.toLowerCase() === userEmail.toLowerCase());

          if (isMatch) {
            userScans.push({
              ...data,
              userUid: userUid,
              userId: userUid,
              userEmail: userEmail || data.userEmail,
            });
          }
        }
      });

      if (userScans.length > 0) {
        const local = getUserScanHistory(userUid, userEmail);
        const mergedMap = new Map<string, ScanResult>();
        
        userScans.forEach(s => {
          if (!deletedIds.has(s.id)) mergedMap.set(s.id, s);
        });
        local.forEach(s => {
          if (!deletedIds.has(s.id)) mergedMap.set(s.id, s);
        });

        const merged = Array.from(mergedMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, MAX_SCANS_LIMIT);

        // Update isolated user storage
        const userKey = `${USER_SCANS_PREFIX}${userUid}`;
        safeSetItemWithPruning(userKey, merged);

        window.dispatchEvent(new CustomEvent('aurabio_scans_updated'));
        return merged;
      }
    }
  } catch (err) {
    console.debug('Firestore user scan fetch notice:', err);
  }

  return getUserScanHistory(userUid, userEmail);
}

/**
 * Delete a scan result from both LocalStorage and Firestore
 */
export function deleteScanResult(id: string, userUid?: string): void {
  try {
    // 1. Mark as deleted in blacklist to prevent re-sync
    markScanAsDeleted(id, userUid);

    // 2. Global storage
    const existing = getScanHistory();
    const updated = existing.filter((item) => item.id !== id);
    safeSetItemWithPruning(STORAGE_KEY_SCANS, updated);

    // 3. User-specific storage
    if (userUid && userUid !== 'guest') {
      const userKey = `${USER_SCANS_PREFIX}${userUid}`;
      const userScans = getUserScanHistory(userUid).filter(item => item.id !== id);
      safeSetItemWithPruning(userKey, userScans);
    }

    // 4. Notify all listeners
    window.dispatchEvent(new CustomEvent('aurabio_scans_updated'));

    // 5. Delete from Firestore
    try {
      const docRef = doc(db, 'scan_records', id);
      deleteDoc(docRef).catch((err) => console.debug('Firestore delete scan notice:', err?.message));
    } catch (fsErr) {
      console.debug('Firestore delete notice:', fsErr);
    }
  } catch (err) {
    console.error('Failed to delete scan item:', err);
  }
}

/**
 * Clear all scan history (or user-specific scan history)
 */
export function clearScanHistory(userUid?: string): void {
  try {
    if (userUid && userUid !== 'guest') {
      const userKey = `${USER_SCANS_PREFIX}${userUid}`;
      
      // Get all current user scans and blacklist them
      try {
        const currentScans = getUserScanHistory(userUid);
        currentScans.forEach((s) => {
          markScanAsDeleted(s.id, userUid);
          try {
            deleteDoc(doc(db, 'scan_records', s.id)).catch(() => {});
          } catch {}
        });
      } catch {}

      localStorage.removeItem(userKey);
      
      // Also remove this user's scans from global cache
      const globalScans = getScanHistory().filter(s => s.userUid !== userUid && s.userId !== userUid);
      localStorage.setItem(STORAGE_KEY_SCANS, JSON.stringify(globalScans));
    } else {
      try {
        const currentScans = getScanHistory();
        currentScans.forEach((s) => {
          markScanAsDeleted(s.id, 'global');
          try {
            deleteDoc(doc(db, 'scan_records', s.id)).catch(() => {});
          } catch {}
        });
      } catch {}
      localStorage.removeItem(STORAGE_KEY_SCANS);
    }
    window.dispatchEvent(new CustomEvent('aurabio_scans_updated'));
  } catch (err) {
    console.error('Failed to clear scan history:', err);
  }
}

/**
 * Pull scans from Firestore to ensure cloud history is synchronized
 */
export async function syncScansFromFirestore(): Promise<ScanResult[]> {
  try {
    const scansCol = collection(db, 'scan_records');
    const q = query(scansCol, limit(50));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const cloudScans: ScanResult[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as ScanResult;
        if (data.id && data.timestamp) {
          cloudScans.push(data);
        }
      });

      if (cloudScans.length > 0) {
        const local = getScanHistory();
        const mergedMap = new Map<string, ScanResult>();
        
        // Merge cloud first, then local
        cloudScans.forEach(s => mergedMap.set(s.id, s));
        local.forEach(s => mergedMap.set(s.id, s));

        const merged = Array.from(mergedMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, MAX_SCANS_LIMIT);

        safeSetItemWithPruning(STORAGE_KEY_SCANS, merged);
        window.dispatchEvent(new CustomEvent('aurabio_scans_updated'));
        return merged;
      }
    }
  } catch (err) {
    console.debug('Firestore scan fetch notice:', err);
  }
  return getScanHistory();
}

export function getStorageUsageInfo(userUid?: string): { count: number; maxLimit: number; estimatedKb: number } {
  try {
    const scans = userUid ? getUserScanHistory(userUid) : getScanHistory();
    const data = JSON.stringify(scans);
    return {
      count: scans.length,
      maxLimit: MAX_SCANS_LIMIT,
      estimatedKb: Math.round((data.length * 2) / 1024),
    };
  } catch {
    return { count: 0, maxLimit: MAX_SCANS_LIMIT, estimatedKb: 0 };
  }
}

const LAST_PRE_SCAN_KEY = 'aurabio_last_pre_scan';

export function saveLastPreScan(scan: ScanResult | null): void {
  try {
    if (scan) {
      const sanitized = sanitizeScanForLocalStorage(scan, false);
      localStorage.setItem(LAST_PRE_SCAN_KEY, JSON.stringify(sanitized));
    } else {
      localStorage.removeItem(LAST_PRE_SCAN_KEY);
    }
  } catch {
    // Ignore quota errors
  }
}

export function getLastPreScan(): ScanResult | null {
  try {
    const raw = localStorage.getItem(LAST_PRE_SCAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * ADMIN: Fetch the full scan history across all members/dealers from Firestore (`scan_records`).
 */
export async function getAllScanRecordsAdmin(): Promise<ScanResult[]> {
  const deletedIds = getDeletedScanIds('global');
  try {
    const scansCol = collection(db, 'scan_records');
    const snap = await getDocs(scansCol);
    const list: ScanResult[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as ScanResult;
      if (data && data.id && !deletedIds.has(data.id)) {
        list.push({ ...data, id: docSnap.id });
      }
    });
    list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    return list;
  } catch (err) {
    console.debug('Fetch all scan records notice:', err);
    return getScanHistory();
  }
}

/**
 * ADMIN: Real-time live subscription to the whole `scan_records` collection
 * (new scans appear instantly in the admin history panel without refreshing).
 */
export function subscribeToScanRecords(onList: (list: ScanResult[]) => void): Unsubscribe {
  try {
    const scansCol = collection(db, 'scan_records');
    const unsub = onSnapshot(scansCol, (snap) => {
      const list: ScanResult[] = [];
      const deletedIds = getDeletedScanIds('global');
      snap.forEach((docSnap: any) => {
        const data = docSnap.data() as ScanResult;
        if (data && data.id && !deletedIds.has(data.id)) {
          list.push({ ...data, id: docSnap.id });
        }
      });
      list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      onList(list);
    });
    return unsub;
  } catch (err) {
    console.debug('Subscribe scan records notice:', err);
    return () => {};
  }
}

/**
 * ADMIN: Bulk-delete a set of scan records from Firestore + all local storages.
 */
export async function deleteScanRecordsByIds(ids: string[], userUid?: string): Promise<number> {
  let deleted = 0;
  for (const id of ids) {
    deleteScanResult(id, userUid);
    deleted++;
  }
  return deleted;
}

/**
 * ADMIN: Clear EVERY scan record in the system (whole `scan_records` Firestore collection).
 */
export async function clearAllScanRecords(): Promise<number> {
  let deleted = 0;
  try {
    const scansCol = collection(db, 'scan_records');
    const snap = await getDocs(scansCol);
    const ids = snap.docs.map(d => d.id);
    // Delete in bounded parallel batches to avoid overwhelming the connection
    const BATCH = 50;
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH);
      await Promise.all(chunk.map(async (id) => {
        try {
          await deleteDoc(doc(db, 'scan_records', id));
          markScanAsDeleted(id, 'global');
          deleted++;
        } catch (err) {
          console.debug('Delete scan record notice:', err);
        }
      }));
    }
  } catch (err) {
    console.debug('Clear all scan records Firestore notice:', err);
  }
  localStorage.removeItem(STORAGE_KEY_SCANS);
  window.dispatchEvent(new CustomEvent('aurabio_scans_updated'));
  return deleted;
}

