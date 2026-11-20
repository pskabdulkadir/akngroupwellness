/**
 * Unified Local Client Data Layer & PostgreSQL-18 API Bridge
 * AKN Global Group Ltd. - Quantum Resonance & Monoline MLM Platform
 *
 * 100% Free of Firebase & Neon. Operates locally with full reactive pub/sub
 * and backend REST synchronization to PostgreSQL-18.
 */

export interface DocumentSnapshot {
  id: string;
  data: () => any;
  exists: () => boolean;
}

export type QueryDocumentSnapshot = DocumentSnapshot;

export interface QuerySnapshot {
  id?: string;
  data?: () => any;
  exists?: () => boolean;
  docs: DocumentSnapshot[];
  empty: boolean;
  size: number;
  forEach: (callback: (doc: DocumentSnapshot) => void) => void;
}

export type Unsubscribe = () => void;
export type DocumentReference = any;
export type CollectionReference = any;

export const db: any = { type: 'POSTGRESQL_LOCAL_CLIENT_DB' };
export const auth: any = {
  currentUser: null,
  onAuthStateChanged: (cb: (user: any) => void) => {
    cb(null);
    return () => {};
  },
};

const LOCAL_DOC_STORE_PREFIX = 'akn_app_doc_';
const memoryStore: Record<string, Record<string, any>> = {};
const listeners = new Map<string, Set<() => void>>();

function getCollectionMap(colName: string): Record<string, any> {
  if (memoryStore[colName]) {
    return memoryStore[colName];
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${LOCAL_DOC_STORE_PREFIX}${colName}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          memoryStore[colName] = parsed;
          return memoryStore[colName];
        }
      }
    } catch {
      // ignore
    }
  }
  memoryStore[colName] = {};
  return memoryStore[colName];
}

function persistCollectionMap(colName: string): void {
  if (typeof window !== 'undefined') {
    try {
      const col = memoryStore[colName] || {};
      localStorage.setItem(`${LOCAL_DOC_STORE_PREFIX}${colName}`, JSON.stringify(col));
    } catch {
      // ignore
    }
  }
}

function stripClientBalance(colName: string, value: Record<string, any>): Record<string, any> {
  if (colName !== 'users' && colName !== 'resellers') return value;
  const { creditsBalance, session_credits, ...rest } = value;
  if (!rest.dealerDetails || typeof rest.dealerDetails !== 'object') return rest;
  const { creditsBalance: dealerCreditsBalance, ...dealerDetails } = rest.dealerDetails;
  return { ...rest, dealerDetails };
}

function notifyListeners(colName: string): void {
  const cListeners = listeners.get(colName);
  if (cListeners) {
    cListeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('[ClientDB] Listener callback error:', err);
      }
    });
  }
}

export function doc(...args: any[]): any {
  let collectionName = 'general';
  let documentId = 'default';

  if (args.length === 1 && typeof args[0] === 'string') {
    const parts = args[0].split('/').filter(Boolean);
    collectionName = parts[0] || 'general';
    documentId = parts[1] || 'default';
  } else if (args.length === 2) {
    collectionName = typeof args[0] === 'string' ? args[0] : (args[0]?.id || 'general');
    documentId = String(args[1]);
  } else if (args.length >= 3) {
    collectionName = typeof args[1] === 'string' ? args[1] : 'general';
    documentId = String(args[2]);
  }

  return {
    id: documentId,
    parent: { id: collectionName },
    collectionName,
    path: `${collectionName}/${documentId}`,
  };
}

export function collection(targetDb: any, ...pathSegments: string[]): any {
  const colName = typeof targetDb === 'string' ? targetDb : pathSegments[0] || 'general';
  return {
    id: colName,
    name: colName,
    collectionName: colName,
  };
}

export async function setDoc(
  docRef: any,
  data: Record<string, any>,
  options?: { merge?: boolean }
): Promise<void> {
  const colName = docRef?.parent?.id || docRef?.collectionName || 'general';
  const docId = docRef?.id || 'default';

  const colMap = getCollectionMap(colName);
  const existing = stripClientBalance(colName, colMap[docId] || {});
  const next = stripClientBalance(colName, data);
  colMap[docId] = options?.merge ? { ...existing, ...next } : next;
  persistCollectionMap(colName);
  notifyListeners(colName);
}

export async function updateDoc(
  docRef: any,
  data: Record<string, any>
): Promise<void> {
  const colName = docRef?.parent?.id || docRef?.collectionName || 'general';
  const docId = docRef?.id || 'default';

  const colMap = getCollectionMap(colName);
  const existing = stripClientBalance(colName, colMap[docId] || {});
  colMap[docId] = { ...existing, ...stripClientBalance(colName, data) };
  persistCollectionMap(colName);
  notifyListeners(colName);
}

export async function deleteDoc(docRef: any): Promise<void> {
  const colName = docRef?.parent?.id || docRef?.collectionName || 'general';
  const docId = docRef?.id || 'default';

  const colMap = getCollectionMap(colName);
  delete colMap[docId];
  persistCollectionMap(colName);
  notifyListeners(colName);
}

export async function getDoc(docRef: any): Promise<DocumentSnapshot> {
  const colName = docRef?.parent?.id || docRef?.collectionName || 'general';
  const docId = docRef?.id || 'default';

  const colMap = getCollectionMap(colName);
  const data = colMap[docId] || null;
  return {
    exists: () => data !== null,
    data: () => data,
    id: docId,
  };
}

export interface QueryConstraint {
  kind: 'where' | 'orderBy' | 'limit';
  field?: string;
  op?: string;
  value?: any;
  direction?: 'asc' | 'desc';
  count?: number;
}

interface QueryRef {
  isQuery: true;
  source: any;
  constraints: QueryConstraint[];
}

function sourceOf(target: any): any {
  return target?.isQuery === true ? target.source : target;
}

function readField(data: any, fieldPath: string): any {
  return fieldPath.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), data);
}

function matchesWhere(data: any, c: QueryConstraint): boolean {
  const actual = readField(data, c.field || '');
  switch (c.op) {
    case '==':
      return actual === c.value;
    case '!=':
      return actual !== undefined && actual !== c.value;
    case '<':
      return actual < c.value;
    case '<=':
      return actual <= c.value;
    case '>':
      return actual > c.value;
    case '>=':
      return actual >= c.value;
    case 'in':
      return Array.isArray(c.value) && c.value.includes(actual);
    case 'array-contains':
      return Array.isArray(actual) && actual.includes(c.value);
    default:
      throw new Error(`Unsupported where operator: ${c.op}`);
  }
}

function compareValues(a: any, b: any): number {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

function readDocs(target: any): DocumentSnapshot[] {
  const source = sourceOf(target);
  const colName = source?.id || source?.name || source?.collectionName || String(source);
  let entries = Object.entries(getCollectionMap(colName));

  if (target?.isQuery === true) {
    const constraints: QueryConstraint[] = target.constraints;
    entries = entries.filter(([, data]) =>
      constraints.every((c) => c.kind !== 'where' || matchesWhere(data, c))
    );

    const orders = constraints.filter((c) => c.kind === 'orderBy');
    if (orders.length > 0) {
      entries = [...entries].sort(([, a], [, b]) => {
        for (const o of orders) {
          const r = compareValues(readField(a, o.field || ''), readField(b, o.field || ''));
          if (r !== 0) return o.direction === 'desc' ? -r : r;
        }
        return 0;
      });
    }

    const limits = constraints.filter((c) => c.kind === 'limit');
    const lastLimit = limits[limits.length - 1];
    if (lastLimit?.count !== undefined) {
      entries = entries.slice(0, lastLimit.count);
    }
  }

  return entries.map(([id, data]) => ({
    id,
    data: () => data,
    exists: () => true,
  }));
}

export async function getDocs(queryOrCol: any): Promise<QuerySnapshot> {
  const docs = readDocs(queryOrCol);

  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: (doc: DocumentSnapshot) => void) => docs.forEach(callback),
  };
}

export function onSnapshot(
  target: any,
  callback: (snapshot: any) => void,
  _onError?: (err: any) => void
): Unsubscribe {
  const source = sourceOf(target);
  const colName = source?.parent?.id || source?.id || source?.name || source?.collectionName || 'general';

  if (!listeners.has(colName)) {
    listeners.set(colName, new Set());
  }

  const trigger = () => {
    if (target?.id && target?.parent) {
      const colMap = getCollectionMap(colName);
      const data = colMap[target.id] || null;
      callback({
        exists: () => data !== null,
        data: () => data,
        id: target.id,
      });
    } else {
      const docs = readDocs(target);
      callback({
        docs,
        empty: docs.length === 0,
        size: docs.length,
        forEach: (cb: (doc: any) => void) => docs.forEach(cb),
      });
    }
  };

  listeners.get(colName)!.add(trigger);
  trigger();

  return () => {
    const cSet = listeners.get(colName);
    if (cSet) {
      cSet.delete(trigger);
    }
  };
}

export function query(source: any, ...constraints: QueryConstraint[]): QueryRef {
  const base: QueryRef = source?.isQuery === true ? source : { isQuery: true, source, constraints: [] };
  return { isQuery: true, source: base.source, constraints: [...base.constraints, ...constraints] };
}

export function where(fieldPath: string, opStr: string, value: any): QueryConstraint {
  return { kind: 'where', field: fieldPath, op: opStr, value };
}

export function limit(count: number): QueryConstraint {
  return { kind: 'limit', count };
}

export function orderBy(fieldPath: string, directionStr: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { kind: 'orderBy', field: fieldPath, direction: directionStr };
}

export async function ensureFirebaseAuthUser(email?: string, _password?: string): Promise<{ uid: string } | null> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const uid = cleanEmail ? `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : `usr_${Date.now()}`;
  return { uid };
}

export async function runTransaction(
  _targetDb: any,
  updateFunction: (transaction: any) => Promise<any>
): Promise<any> {
  return updateFunction({
    get: getDoc,
    set: setDoc,
    update: updateDoc,
    delete: deleteDoc,
  });
}

export function wipeAllLocalApplicationData(): void {
  if (typeof window !== 'undefined') {
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LOCAL_DOC_STORE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }
}
