/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActiveTab, ScanResult } from '../types';
import { DiseaseHealingProtocol, DISEASE_HEALING_LIBRARY } from '../data/diseaseHealingLibrary';
import { getScanHistory } from './storage';
import { TreatmentSelection } from '../components/FrequencyLoadingModal';

export interface AppNavigationState {
  activeTab: ActiveTab;
  tabHistory: ActiveTab[];
  activeModal: string | null;
  reportId?: string | null;
  diseaseId?: string | null;
  acousticStep?: 'pre_scan' | 'in_session' | 'post_scan' | 'report' | null;
  subTab?: string | null;
  category?: string | null;
  activeTreatment?: TreatmentSelection | null;
  comparisonPreId?: string | null;
  comparisonPostId?: string | null;
  comparisonName?: string | null;
}

const STORAGE_KEY_NAV_STATE = 'aurabio_navigation_state_v2';
const REFERRAL_PARAM_KEYS = ['ref', 'referral', 'bayi', 'bayiKodu', 'r'];
const STORAGE_KEY_ACTIVE_TREATMENT = 'aurabio_active_treatment_v2';
const STORAGE_KEY_LAST_PRE_SCAN = 'aurabio_last_pre_scan_v2';

export const VALID_TABS: ActiveTab[] = [
  'camera', 
  'circadian',
  'healing', 
  'mandala', 
  'heatmap', 
  'mindspace', 
  'islamic', 
  'eastern', 
  'mythology', 
  'letaif', 
  'history'
];

/**
 * Parse state from current URL hash and fallback to localStorage/sessionStorage
 */
export function parseCurrentUrlState(): Partial<AppNavigationState> {
  const result: Partial<AppNavigationState> = {};
  
  try {
    const rawHash = window.location.hash.replace(/^#/, '');
    const searchStr = window.location.search ? window.location.search.replace(/^\?/, '') : '';
    const pathname = window.location.pathname || '';

    if (rawHash === 'member-panel' || rawHash === 'profil' || rawHash === 'profile' || pathname.includes('/member-panel') || pathname.includes('/profil')) {
      result.activeModal = 'reseller_dashboard';
    }

    if (rawHash === 'bayi' || rawHash === 'bayi-paneli' || rawHash === 'reseller' || rawHash === 'dealer' || rawHash === 'reseller-dashboard' || pathname.includes('/bayi') || pathname.includes('/reseller')) {
      result.activeModal = 'reseller_dashboard';
    }

    if (rawHash === 'presentation' || rawHash === 'is-sunumu' || rawHash === 'sunum' || rawHash === 'business-presentation' || pathname.includes('/presentation') || pathname.includes('/sunum')) {
      result.activeModal = 'business_presentation';
    }

    if (rawHash === 'technical' || rawHash === 'teknik-rapor' || rawHash === 'technical-report' || pathname.includes('/technical')) {
      result.activeModal = 'technical_report';
    }

    if (rawHash === 'admin' || rawHash === 'yonetici' || pathname.includes('/admin')) {
      result.activeModal = 'admin';
    }

    // Check search params (e.g. ?ref=AURA-BAYI-5521&view=presentation or ?modal=business_presentation)
    if (searchStr) {
      const sParams = new URLSearchParams(searchStr);
      const viewParam = sParams.get('view') || sParams.get('sayfa');
      const modalSearch = sParams.get('modal');
      if (viewParam === 'presentation' || viewParam === 'sunum' || viewParam === 'business-presentation' || modalSearch === 'business_presentation' || modalSearch === 'presentation') {
        result.activeModal = 'business_presentation';
      }
      if (viewParam === 'bayi' || viewParam === 'reseller' || modalSearch === 'reseller' || modalSearch === 'bayi' || modalSearch === 'dealer' || modalSearch === 'reseller_dashboard') {
        result.activeModal = 'reseller_dashboard';
      }
      if (modalSearch === 'auth' || modalSearch === 'login' || modalSearch === 'register') {
        result.activeModal = 'auth';
      }
      if (modalSearch === 'technical' || modalSearch === 'technical_report') {
        result.activeModal = 'technical_report';
      }
    }

    if (rawHash) {
      const params = new URLSearchParams(rawHash);
      
      const tabParam = params.get('tab') as ActiveTab;
      if (tabParam && VALID_TABS.includes(tabParam)) {
        result.activeTab = tabParam;
      }
      
      const modalParam = params.get('modal') || params.get('view');
      if (modalParam) {
        if (modalParam === 'profile' || modalParam === 'member-panel' || modalParam === 'member_panel' || modalParam === 'reseller' || modalParam === 'bayi' || modalParam === 'dealer' || modalParam === 'reseller_dashboard') {
          result.activeModal = 'reseller_dashboard';
        } else if (modalParam === 'presentation' || modalParam === 'is_sunumu' || modalParam === 'business_presentation' || modalParam === 'sunum') {
          result.activeModal = 'business_presentation';
        } else if (modalParam === 'technical' || modalParam === 'technical_report') {
          result.activeModal = 'technical_report';
        } else {
          result.activeModal = modalParam;
        }
      }

      const reportParam = params.get('report') || params.get('reportId');
      if (reportParam) {
        result.reportId = reportParam;
        if (!result.activeModal) result.activeModal = 'report';
      }

      const diseaseParam = params.get('disease') || params.get('diseaseId');
      if (diseaseParam) {
        result.diseaseId = diseaseParam;
        if (!result.activeModal) result.activeModal = 'disease';
      }

      const acousticParam = params.get('acoustic') || params.get('acoustic_session');
      if (acousticParam) {
        result.diseaseId = acousticParam;
        result.activeModal = 'acoustic_session';
        const step = params.get('step') as any;
        if (step) result.acousticStep = step;
      }

      const subParam = params.get('sub') || params.get('subTab');
      if (subParam) result.subTab = subParam;

      const catParam = params.get('cat') || params.get('category');
      if (catParam) result.category = catParam;

      const compPre = params.get('pre');
      const compPost = params.get('post');
      if (compPre && compPost) {
        result.activeModal = 'comparison';
        result.comparisonPreId = compPre;
        result.comparisonPostId = compPost;
        result.comparisonName = params.get('name') || 'Biyo-Akustik Karşılaştırma';
      }
    }
    const urlParams = new URLSearchParams(searchStr);
    const hasReferralParam = REFERRAL_PARAM_KEYS.some((key) => (urlParams.get(key) || '').trim() !== '');
    const hasExplicitRoute = rawHash !== '' || urlParams.has('view') || urlParams.has('modal') || urlParams.has('sayfa');
    if (hasReferralParam && !hasExplicitRoute && !result.activeModal) {
      result.activeModal = 'auth';
    }
  } catch (err) {
    console.warn('URL Hash parsing error:', err);
  }

  // Fallback to persisted storage if URL hash was empty or partial
  try {
    const storedJson = localStorage.getItem(STORAGE_KEY_NAV_STATE) || sessionStorage.getItem(STORAGE_KEY_NAV_STATE);
    if (storedJson) {
      const stored = JSON.parse(storedJson);
      if (!result.activeTab && stored.activeTab && VALID_TABS.includes(stored.activeTab)) {
        result.activeTab = stored.activeTab;
      }
      if (!result.activeModal && stored.activeModal) {
        result.activeModal = stored.activeModal;
        result.reportId = stored.reportId;
        result.diseaseId = stored.diseaseId;
        result.acousticStep = stored.acousticStep;
      }
      if (!result.subTab && stored.subTab) {
        result.subTab = stored.subTab;
      }
      if (Array.isArray(stored.tabHistory)) {
        result.tabHistory = stored.tabHistory.filter((t: any) => VALID_TABS.includes(t));
      }
    }
  } catch (err) {
    console.warn('LocalStorage nav state parse error:', err);
  }

  // Restore active treatment if saved
  try {
    const treatmentJson = localStorage.getItem(STORAGE_KEY_ACTIVE_TREATMENT);
    if (treatmentJson) {
      result.activeTreatment = JSON.parse(treatmentJson);
    }
  } catch (err) {
    console.warn('Active treatment parse error:', err);
  }

  return result;
}

/**
 * Format navigation state into a clean URL hash string
 */
export function buildHashString(state: Partial<AppNavigationState>): string {
  const params = new URLSearchParams();
  
  if (state.activeTab && VALID_TABS.includes(state.activeTab)) {
    params.set('tab', state.activeTab);
  } else {
    params.set('tab', 'camera');
  }

  if (state.activeModal) {
    params.set('modal', state.activeModal);
  }

  if (state.reportId) {
    params.set('report', state.reportId);
  }

  if (state.diseaseId) {
    params.set('disease', state.diseaseId);
  }

  if (state.acousticStep) {
    params.set('step', state.acousticStep);
  }

  if (state.subTab) {
    params.set('sub', state.subTab);
  }

  if (state.category) {
    params.set('cat', state.category);
  }

  if (state.comparisonPreId && state.comparisonPostId) {
    params.set('pre', state.comparisonPreId);
    params.set('post', state.comparisonPostId);
    if (state.comparisonName) params.set('name', state.comparisonName);
  }

  return '#' + params.toString();
}

/**
 * Persist navigation state to localStorage and sessionStorage
 */
export function persistNavigationState(state: Partial<AppNavigationState>): void {
  try {
    const json = JSON.stringify({
      activeTab: state.activeTab || 'camera',
      tabHistory: state.tabHistory || [],
      activeModal: state.activeModal || null,
      reportId: state.reportId || null,
      diseaseId: state.diseaseId || null,
      acousticStep: state.acousticStep || null,
      subTab: state.subTab || null,
      category: state.category || null,
      comparisonPreId: state.comparisonPreId || null,
      comparisonPostId: state.comparisonPostId || null,
      comparisonName: state.comparisonName || null,
    });
    localStorage.setItem(STORAGE_KEY_NAV_STATE, json);
    sessionStorage.setItem(STORAGE_KEY_NAV_STATE, json);

    if (state.activeTreatment) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TREATMENT, JSON.stringify(state.activeTreatment));
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_TREATMENT);
    }
  } catch (err) {
    console.warn('Failed to persist navigation state:', err);
  }
}

/**
 * Save/get last pre-scan data for comparative evaluation
 */
export function saveLastPreScan(scan: ScanResult | null): void {
  try {
    if (scan) {
      localStorage.setItem(STORAGE_KEY_LAST_PRE_SCAN, JSON.stringify(scan));
    } else {
      localStorage.removeItem(STORAGE_KEY_LAST_PRE_SCAN);
    }
  } catch (e) {
    console.warn(e);
  }
}

export function getLastPreScan(): ScanResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_PRE_SCAN);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return null;
}

/**
 * Resolve Disease protocol object from ID
 */
export function findDiseaseById(id?: string | null): DiseaseHealingProtocol | null {
  if (!id) return null;
  const cleanId = id.toLowerCase();
  return DISEASE_HEALING_LIBRARY.find((d) => d.id === id || (d.name && d.name.toLowerCase() === cleanId)) || null;
}

/**
 * Resolve Scan report object from ID or 'latest'
 */
export function findScanReportById(id?: string | null): ScanResult | null {
  if (!id) return null;
  const history = getScanHistory();
  if (id === 'latest') return history[0] || null;
  return history.find((s) => s.id === id) || null;
}
