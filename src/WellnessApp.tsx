/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { ReportModal } from './components/ReportModal';
import { FrequencyPanel } from './components/FrequencyPanel';
import { EasternPanel } from './components/EasternPanel';
import { GuideView } from './components/GuideModal';
import { HistoryView } from './components/HistoryDrawer';
import { TreatmentSelection } from './components/FrequencyLoadingModal';
import { ComparisonModal } from './components/ComparisonModal';
import { AuthModal } from './components/AuthModal';
import { PaymentModal } from './components/PaymentModal';
import { Vpos3DSecureModal } from './components/Vpos3DSecureModal';
import { MembershipWaitingOverlay } from './components/MembershipWaitingOverlay';
import { AdminPanelModal, ADMIN_SESSION_KEY, ADMIN_TAB_KEY } from './components/AdminPanelModal';
import { subscribeToSiteContent } from './utils/siteContentManager';
import { clearAdminToken } from './utils/adminSession';
import { ResellerDashboardModal } from './components/ResellerDashboardModal';
import { DealerBusinessCardModal } from './components/DealerBusinessCardModal';
import { UserGuideModal } from './components/UserGuideModal';
import { MedicalDisclaimerModal } from './components/MedicalDisclaimerModal';
import { MindSpaceStudio } from './components/MindSpaceStudio';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { SleepModeModal } from './components/SleepModeModal';
import { AncientHealingMatrix } from './components/AncientHealingMatrix';
import { TechnicalReportModal } from './components/TechnicalReportModal';
import { BusinessPresentationModal } from './components/BusinessPresentationModal';
import { HealingEncyclopediaModal } from './components/HealingEncyclopediaModal';
import { DiseaseDetailModal } from './components/DiseaseDetailModal';
import { AcousticSessionWorkflowModal, WorkflowStep } from './components/AcousticSessionWorkflowModal';
import { WearableBridgeModal } from './components/WearableBridgeModal';
import { HolisticJourneyModal } from './components/HolisticJourneyModal';
import { MandalaGenerator } from './components/MandalaGenerator';
import { GlobalHeatmapView } from './components/GlobalHeatmapView';
import { CircadianSynchronizerView } from './components/CircadianSynchronizerView';
import { VoiceIntentionForgeModal } from './components/VoiceIntentionForgeModal';
import { DreamDecoderModal } from './components/DreamDecoderModal';
import { GroupAuraSyncModal } from './components/GroupAuraSyncModal';
import { AuraJournalModal } from './components/AuraJournalModal';
import { DemoCountdownBanner } from './components/DemoCountdownBanner';
import { VoiceErrorToast } from './components/VoiceErrorToast';
import { useKeyboardAvoidance } from './hooks/useKeyboardAvoidance';
import { DemoExpiredModal } from './components/DemoExpiredModal';
import { CampaignsModal } from './components/CampaignsModal';
import { MonolineMlmPortalModal, MonolineSubTab } from './components/MonolineMlmPortalModal';
import { syncFrekansWithMonolineEngine } from './utils/monolineSyncBridge';
import { DiseaseHealingProtocol } from './data/diseaseHealingLibrary';
import { ActiveTab, ScanResult } from './types';
import { getScanHistory, saveScanResult, deleteScanResult, clearScanHistory, syncScansFromFirestore } from './utils/storage';
import { soundEngine } from './utils/soundEngine';
import { voiceAssistant } from './utils/voiceAssistant';
import { exportScanReportToPDF } from './utils/pdfExport';
import { generatePostScanComparisonResult } from './utils/bioEngine';
import { 
  UserMember, 
  getActiveMemberSession, 
  fetchMemberProfile, 
  subscribeToMemberStatus, 
  logoutMemberSession, 
  checkMemberAccess 
} from './utils/authManager';
import { 
  Reseller,
  getActiveResellerSession,
  deductScanCreditFromDealer, 
  getStoredReferralCode, 
  clearStoredReferralCode,
  getResellerByCode, 
  detectAndSaveReferralCodeFromUrl 
} from './utils/resellerManager';
import { 
  initializeDeviceDemo, 
  subscribeToDeviceDemo, 
  getDeviceDemoStatus, 
  DeviceDemoStatus 
} from './utils/deviceDemoManager';
import {
  parseCurrentUrlState,
  buildHashString,
  persistNavigationState,
  saveLastPreScan,
  getLastPreScan,
  findDiseaseById,
  findScanReportById,
  VALID_TABS,
  AppNavigationState
} from './utils/navigationState';

export default function WellnessApp({
  onOpenSmartAccounting,
}: {
  onOpenSmartAccounting?: () => void;
} = {}) {
  useKeyboardAvoidance();
  const initialNav = useRef<Partial<AppNavigationState>>(parseCurrentUrlState()).current;

  // 1. Navigation & History State
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => initialNav.activeTab || 'camera');
  const [tabHistory, setTabHistory] = useState<ActiveTab[]>(() => initialNav.tabHistory || []);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(() => getScanHistory());
  const [currentReport, setCurrentReport] = useState<ScanResult | null>(() => findScanReportById(initialNav.reportId));

  // 2. Frequency Loading & Treatment State
  const [activeTreatment, setActiveTreatment] = useState<TreatmentSelection | null>(() => initialNav.activeTreatment || null);
  const [lastPreScan, setLastPreScan] = useState<ScanResult | null>(() => getLastPreScan());
  const [pendingComparisonTreatment, setPendingComparisonTreatment] = useState<TreatmentSelection | null>(null);
  const [autoStartPostScan, setAutoStartPostScan] = useState<boolean>(false);
  
  // 3. Comparison Modal State
  const [comparisonPair, setComparisonPair] = useState<{ pre: ScanResult; post: ScanResult; name: string } | null>(() => {
    if (initialNav.comparisonPreId && initialNav.comparisonPostId) {
      const pre = findScanReportById(initialNav.comparisonPreId);
      const post = findScanReportById(initialNav.comparisonPostId);
      if (pre && post) {
        return { pre, post, name: initialNav.comparisonName || 'Biyo-Akustik Karşılaştırma' };
      }
    }
    return null;
  });

  // 4. Audio Status Tracker
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  // 5. Membership & Authentication State
  const [currentUser, setCurrentUser] = useState<UserMember | null>(() => getActiveMemberSession());
  const [demoStatus, setDemoStatus] = useState<DeviceDemoStatus>(() => getDeviceDemoStatus());
  const [isGuestDemoActive, setIsGuestDemoActive] = useState<boolean>(() => {
    const st = getDeviceDemoStatus();
    return Boolean(st.isStarted && !st.isExpired && st.remainingSeconds > 0);
  });
  const [isExpiredModalDismissed, setIsExpiredModalDismissed] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => {
    if (initialNav.activeModal === 'auth') return true;
    const member = getActiveMemberSession();
    const st = getDeviceDemoStatus();
    // Link ilk tıklandığında: Demo otomatik başlamaz, Bayi Giriş & Üye Paneli açılır
    if (!member && !st.isStarted && !st.isExpired) {
      return true;
    }
    return false;
  });
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register' | 'dealer'>('login');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(() => initialNav.activeModal === 'payment');
  const [isResellerDashboardOpen, setIsResellerDashboardOpen] = useState<boolean>(() => initialNav.activeModal === 'reseller_dashboard' || initialNav.activeModal === 'reseller' || initialNav.activeModal === 'bayi' || initialNav.activeModal === 'dealer' || initialNav.activeModal === 'member_dashboard' || initialNav.activeModal === 'profile');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => initialNav.activeModal === 'admin');
  useEffect(() => {
    if (!isAdminOpen) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_TAB_KEY);
      clearAdminToken();
    }
  }, [isAdminOpen]);
  const [, setSiteContentVersion] = useState<number>(0);
  useEffect(() => subscribeToSiteContent(() => setSiteContentVersion((v) => v + 1)), []);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(() => initialNav.activeModal === 'user_guide');
  const [isTechnicalReportOpen, setIsTechnicalReportOpen] = useState<boolean>(() => initialNav.activeModal === 'technical_report' || initialNav.activeModal === 'technical');
  const [isBusinessPresentationOpen, setIsBusinessPresentationOpen] = useState<boolean>(() => initialNav.activeModal === 'business_presentation' || initialNav.activeModal === 'presentation' || initialNav.activeModal === 'sunum');
  const [isSOSModalOpen, setIsSOSModalOpen] = useState<boolean>(() => initialNav.activeModal === 'sos');
  const [isSleepModalOpen, setIsSleepModalOpen] = useState<boolean>(() => initialNav.activeModal === 'sleep');
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState<boolean>(() => initialNav.activeModal === 'encyclopedia');
  const [isWearableModalOpen, setIsWearableModalOpen] = useState<boolean>(() => initialNav.activeModal === 'wearable');
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState<boolean>(() => initialNav.activeModal === 'journey');
  const [isFrequencyForgeModalOpen, setIsFrequencyForgeModalOpen] = useState<boolean>(() => initialNav.activeModal === 'forge');
  const [isDreamDecoderModalOpen, setIsDreamDecoderModalOpen] = useState<boolean>(() => initialNav.activeModal === 'dream');
  const [isGroupAuraModalOpen, setIsGroupAuraModalOpen] = useState<boolean>(() => initialNav.activeModal === 'group');
  const [isJournalModalOpen, setIsJournalModalOpen] = useState<boolean>(() => initialNav.activeModal === 'journal');
  const [isCampaignsModalOpen, setIsCampaignsModalOpen] = useState<boolean>(() => initialNav.activeModal === 'campaigns');
  const [isMonolineModalOpen, setIsMonolineModalOpen] = useState<boolean>(() => initialNav.activeModal === 'monoline');
  const [monolineInitialSubTab, setMonolineInitialSubTab] = useState<MonolineSubTab>(
    () => (initialNav.subTab as MonolineSubTab) || 'packages'
  );
  const [visitorCardReseller, setVisitorCardReseller] = useState<Reseller | null>(null);
  const [selectedDiseaseDetail, setSelectedDiseaseDetail] = useState<DiseaseHealingProtocol | null>(() => findDiseaseById(initialNav.diseaseId));
  const [scanWorkflowDisease, setScanWorkflowDisease] = useState<DiseaseHealingProtocol | null>(() => {
    if (initialNav.activeModal === 'acoustic_session') {
      return findDiseaseById(initialNav.diseaseId);
    }
    return null;
  });
  const [acousticWorkflowStep, setAcousticWorkflowStep] = useState<WorkflowStep>(() => initialNav.acousticStep || 'pre_scan');
  
  // 6. Mandatory Medical Disclaimer State
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aurabio_medical_disclaimer_accepted_v1') === 'true';
    } catch {
      return false;
    }
  });

  // 7. Offline Network Status
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Compute current active modal key for URL sync
  const getActiveModalKey = useCallback((): string | null => {
    if (scanWorkflowDisease) return 'acoustic_session';
    if (selectedDiseaseDetail) return 'disease';
    if (currentReport) return 'report';
    if (comparisonPair) return 'comparison';
    if (isEncyclopediaOpen) return 'encyclopedia';
    if (isUserGuideOpen) return 'user_guide';
    if (isTechnicalReportOpen) return 'technical_report';
    if (isBusinessPresentationOpen) return 'business_presentation';
    if (isAdminOpen) return 'admin';
    if (isSOSModalOpen) return 'sos';
    if (isSleepModalOpen) return 'sleep';
    if (isWearableModalOpen) return 'wearable';
    if (isJourneyModalOpen) return 'journey';
    if (isFrequencyForgeModalOpen) return 'forge';
    if (isDreamDecoderModalOpen) return 'dream';
    if (isGroupAuraModalOpen) return 'group';
    if (isJournalModalOpen) return 'journal';
    if (isCampaignsModalOpen) return 'campaigns';
    if (isMonolineModalOpen) return 'monoline';
    if (isResellerDashboardOpen) return 'reseller_dashboard';
    if (isAuthModalOpen) return 'auth';
    if (isPaymentModalOpen) return 'payment';
    return null;
  }, [
    scanWorkflowDisease,
    selectedDiseaseDetail,
    currentReport,
    comparisonPair,
    isEncyclopediaOpen,
    isUserGuideOpen,
    isTechnicalReportOpen,
    isBusinessPresentationOpen,
    isAdminOpen,
    isSOSModalOpen,
    isSleepModalOpen,
    isWearableModalOpen,
    isJourneyModalOpen,
    isFrequencyForgeModalOpen,
    isDreamDecoderModalOpen,
    isGroupAuraModalOpen,
    isJournalModalOpen,
    isMonolineModalOpen,
    isResellerDashboardOpen,
    isAuthModalOpen,
    isPaymentModalOpen,
  ]);

  // Synchronize entire state to URL Hash & Storage
  const syncStateToUrlAndStorage = useCallback((pushHistory = false) => {
    const activeModal = getActiveModalKey();
    const stateObj: Partial<AppNavigationState> = {
      activeTab,
      tabHistory,
      activeModal,
      reportId: currentReport ? currentReport.id : null,
      diseaseId: scanWorkflowDisease?.id || selectedDiseaseDetail?.id || null,
      acousticStep: scanWorkflowDisease ? acousticWorkflowStep : null,
      activeTreatment,
      comparisonPreId: comparisonPair?.pre.id || null,
      comparisonPostId: comparisonPair?.post.id || null,
      comparisonName: comparisonPair?.name || null,
      subTab: isMonolineModalOpen ? monolineInitialSubTab : null,
    };

    persistNavigationState(stateObj);

    const hashStr = buildHashString(stateObj);
    if (window.location.hash !== hashStr) {
      if (pushHistory) {
        window.history.pushState(stateObj, '', hashStr);
      } else {
        window.history.replaceState(stateObj, '', hashStr);
      }
    }
  }, [
    activeTab,
    tabHistory,
    getActiveModalKey,
    currentReport,
    scanWorkflowDisease,
    selectedDiseaseDetail,
    acousticWorkflowStep,
    activeTreatment,
    comparisonPair,
    isMonolineModalOpen,
    monolineInitialSubTab,
  ]);

  // Trigger sync on state changes
  useEffect(() => {
    syncStateToUrlAndStorage(false);
  }, [syncStateToUrlAndStorage]);

  // Debounced Automatic Voice Narration on Tab and Modal Navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeModal = getActiveModalKey();
      if (activeModal) {
        if (activeModal === 'user_guide') voiceAssistant.speakPageNarration('userGuide');
        else if (activeModal === 'encyclopedia') voiceAssistant.speakPageNarration('healingEncyclopedia');
        else if (activeModal === 'sos') voiceAssistant.speakPageNarration('emergencySOS');
        else if (activeModal === 'sleep') voiceAssistant.speakPageNarration('sleepMode');
        else if (activeModal === 'wearable') voiceAssistant.speakPageNarration('wearableBridge');
        else if (activeModal === 'journey') voiceAssistant.speakPageNarration('holisticJourney');
        else if (activeModal === 'forge') voiceAssistant.speakPageNarration('voiceIntentionForge');
        else if (activeModal === 'dream') voiceAssistant.speakPageNarration('dreamDecoder');
        else if (activeModal === 'group') voiceAssistant.speakPageNarration('groupAuraSync');
        else if (activeModal === 'journal') voiceAssistant.speakPageNarration('auraJournal');
        else if (activeModal === 'reseller_dashboard') voiceAssistant.speakPageNarration('reseller');
        else if (activeModal === 'report') voiceAssistant.speakPageNarration('reportModal');
        else if (activeModal === 'technical_report') voiceAssistant.speakPageNarration('technicalReport');
      } else if (activeTab) {
        voiceAssistant.speakPageNarration(activeTab);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    activeTab,
    getActiveModalKey,
    isUserGuideOpen,
    isEncyclopediaOpen,
    isSOSModalOpen,
    isSleepModalOpen,
    isWearableModalOpen,
    isJourneyModalOpen,
    isFrequencyForgeModalOpen,
    isDreamDecoderModalOpen,
    isGroupAuraModalOpen,
    isJournalModalOpen,
    isResellerDashboardOpen,
    isTechnicalReportOpen,
    currentReport
  ]);

  // Navigate to a new tab forward with history recording
  const handleNavigate = useCallback((tab: ActiveTab, replaceHistory = false) => {
    setAutoStartPostScan(false);
    setActiveTab((prevTab) => {
      if (prevTab === tab) return tab;
      if (!replaceHistory) {
        setTabHistory((history) => {
          if (history.length > 0 && history[history.length - 1] === prevTab) {
            return history;
          }
          const updated = [...history, prevTab];
          return updated.slice(-30);
        });
      }
      return tab;
    });
  }, []);

  // Universal Step-by-Step Back Navigation
  const handleGoBack = useCallback(() => {
    setAutoStartPostScan(false);

    // 1. Acoustic Session Workflow Step-Back
    if (scanWorkflowDisease) {
      if (acousticWorkflowStep === 'report') {
        setAcousticWorkflowStep('post_scan');
        return;
      }
      if (acousticWorkflowStep === 'post_scan') {
        setAcousticWorkflowStep('in_session');
        return;
      }
      if (acousticWorkflowStep === 'in_session') {
        soundEngine.stop();
        setIsAudioPlaying(false);
        setAcousticWorkflowStep('pre_scan');
        return;
      }
      // Step is 'pre_scan': Close workflow and step back to disease detail or encyclopedia
      soundEngine.stop();
      setIsAudioPlaying(false);
      const dis = scanWorkflowDisease;
      setScanWorkflowDisease(null);
      setSelectedDiseaseDetail(dis);
      return;
    }

    // 2. Disease Detail Step-Back -> Returns to Encyclopedia
    if (selectedDiseaseDetail) {
      setSelectedDiseaseDetail(null);
      setIsEncyclopediaOpen(true);
      return;
    }

    // 3. Comparison Modal Step-Back -> Returns to post scan report
    if (comparisonPair) {
      const postRep = comparisonPair.post;
      setComparisonPair(null);
      setCurrentReport(postRep);
      return;
    }

    // 4. Report Modal Step-Back -> Closes report and returns to underlying view
    if (currentReport) {
      setCurrentReport(null);
      return;
    }

    // 5. Open Tool & Guide Modals Step-Back -> Closes modal
    if (isEncyclopediaOpen) { setIsEncyclopediaOpen(false); return; }
    if (isUserGuideOpen) { setIsUserGuideOpen(false); return; }
    if (isTechnicalReportOpen) { setIsTechnicalReportOpen(false); return; }
    if (isAdminOpen) { setIsAdminOpen(false); return; }
    if (isSOSModalOpen) { setIsSOSModalOpen(false); return; }
    if (isSleepModalOpen) { setIsSleepModalOpen(false); return; }
    if (isWearableModalOpen) { setIsWearableModalOpen(false); return; }
    if (isJourneyModalOpen) { setIsJourneyModalOpen(false); return; }
    if (isFrequencyForgeModalOpen) { setIsFrequencyForgeModalOpen(false); return; }
    if (isDreamDecoderModalOpen) { setIsDreamDecoderModalOpen(false); return; }
    if (isGroupAuraModalOpen) { setIsGroupAuraModalOpen(false); return; }
    if (isJournalModalOpen) { setIsJournalModalOpen(false); return; }
    if (isResellerDashboardOpen) { setIsResellerDashboardOpen(false); return; }
    if (isPaymentModalOpen) { setIsPaymentModalOpen(false); return; }

    // 6. Active Treatment in Camera HUD Step-Back -> Stop and return to the frequency selection panel
    if (activeTreatment) {
      soundEngine.stop();
      setIsAudioPlaying(false);
      setActiveTreatment(null);
      if (tabHistory.length > 0) {
        const prevTab = tabHistory[tabHistory.length - 1];
        setTabHistory((h) => h.slice(0, -1));
        setActiveTab(prevTab);
        return;
      }
      return;
    }

    // 7. Tab History Stack Step-Back
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory((h) => h.slice(0, -1));
      setActiveTab(prevTab);
      return;
    }

    // 8. If on a sub-panel with empty history, return to camera
    if (activeTab !== 'camera') {
      setActiveTab('camera');
    }
  }, [
    scanWorkflowDisease,
    acousticWorkflowStep,
    selectedDiseaseDetail,
    comparisonPair,
    currentReport,
    isEncyclopediaOpen,
    isUserGuideOpen,
    isTechnicalReportOpen,
    isAdminOpen,
    isSOSModalOpen,
    isSleepModalOpen,
    isWearableModalOpen,
    isJourneyModalOpen,
    isFrequencyForgeModalOpen,
    isDreamDecoderModalOpen,
    isGroupAuraModalOpen,
    isJournalModalOpen,
    isPaymentModalOpen,
    activeTreatment,
    tabHistory,
    activeTab,
  ]);

  // Return to home (camera) and close all modal overlays
  const handleGoHome = useCallback(() => {
    setScanWorkflowDisease(null);
    setSelectedDiseaseDetail(null);
    setComparisonPair(null);
    setCurrentReport(null);
    setIsEncyclopediaOpen(false);
    setIsUserGuideOpen(false);
    setIsTechnicalReportOpen(false);
    setIsAdminOpen(false);
    setIsSOSModalOpen(false);
    setIsSleepModalOpen(false);
    setIsWearableModalOpen(false);
    setIsJourneyModalOpen(false);
    setIsFrequencyForgeModalOpen(false);
    setIsDreamDecoderModalOpen(false);
    setIsGroupAuraModalOpen(false);
    setIsJournalModalOpen(false);
    handleNavigate('camera');
  }, [handleNavigate]);

  // Handle Browser Native Back / Forward and PopState Navigation
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseCurrentUrlState();
      
      if (parsed.activeTab && VALID_TABS.includes(parsed.activeTab)) {
        setActiveTab(parsed.activeTab);
      }

      if (parsed.reportId) {
        const rep = findScanReportById(parsed.reportId);
        setCurrentReport(rep);
      } else if (parsed.activeModal !== 'report') {
        setCurrentReport(null);
      }

      if (parsed.diseaseId && parsed.activeModal === 'disease') {
        setSelectedDiseaseDetail(findDiseaseById(parsed.diseaseId));
      } else if (parsed.activeModal !== 'disease') {
        setSelectedDiseaseDetail(null);
      }

      if (parsed.diseaseId && parsed.activeModal === 'acoustic_session') {
        setScanWorkflowDisease(findDiseaseById(parsed.diseaseId));
        if (parsed.acousticStep) setAcousticWorkflowStep(parsed.acousticStep);
      } else if (parsed.activeModal !== 'acoustic_session') {
        setScanWorkflowDisease(null);
      }

      if (parsed.comparisonPreId && parsed.comparisonPostId) {
        const pre = findScanReportById(parsed.comparisonPreId);
        const post = findScanReportById(parsed.comparisonPostId);
        if (pre && post) {
          setComparisonPair({ pre, post, name: parsed.comparisonName || 'Karşılaştırma Raporu' });
        }
      } else {
        setComparisonPair(null);
      }

      setIsEncyclopediaOpen(parsed.activeModal === 'encyclopedia');
      setIsUserGuideOpen(parsed.activeModal === 'user_guide');
      setIsTechnicalReportOpen(parsed.activeModal === 'technical_report');
      setIsBusinessPresentationOpen(parsed.activeModal === 'business_presentation');
      setIsAdminOpen(parsed.activeModal === 'admin');
      setIsSOSModalOpen(parsed.activeModal === 'sos');
      setIsSleepModalOpen(parsed.activeModal === 'sleep');
      setIsWearableModalOpen(parsed.activeModal === 'wearable');
      setIsJourneyModalOpen(parsed.activeModal === 'journey');
      setIsFrequencyForgeModalOpen(parsed.activeModal === 'forge');
      setIsDreamDecoderModalOpen(parsed.activeModal === 'dream');
      setIsGroupAuraModalOpen(parsed.activeModal === 'group');
      setIsJournalModalOpen(parsed.activeModal === 'journal');
      setIsMonolineModalOpen(parsed.activeModal === 'monoline');
      if (parsed.activeModal === 'monoline' && parsed.subTab) {
        setMonolineInitialSubTab(parsed.subTab as MonolineSubTab);
      }
      setIsResellerDashboardOpen(parsed.activeModal === 'reseller_dashboard' || parsed.activeModal === 'member_dashboard' || parsed.activeModal === 'profile');
      setIsAuthModalOpen(parsed.activeModal === 'auth');
      setIsPaymentModalOpen(parsed.activeModal === 'payment');
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Audio Playing status with Sound Engine
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAudioPlaying(soundEngine.getIsPlaying());
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Sync scan history with Firestore cloud
  useEffect(() => {
    syncScansFromFirestore().then((scans) => {
      if (scans && scans.length > 0) {
        setScanHistory(scans);
      }
    });

    // Synchronize real Frekans records, resellers, and orders with Monoline 7 Nefis MLM Engine
    syncFrekansWithMonolineEngine().catch(() => {});

    const handleScansUpdated = () => {
      setScanHistory(getScanHistory());
    };
    window.addEventListener('aurabio_scans_updated', handleScansUpdated);
    return () => window.removeEventListener('aurabio_scans_updated', handleScansUpdated);
  }, []);

  // Multi-layer cross-browser device demo timer and Firestore sync
  useEffect(() => {
    // Detect URL referral code early
    const detectedRef = detectAndSaveReferralCodeFromUrl();

    // Check specific marketing view parameters (?view=card, ?view=presentation, ?view=technical, ?view=register)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      const refParam = urlParams.get('ref') || detectedRef || getStoredReferralCode();

      if (viewParam === 'card') {
        getResellerByCode(refParam || '').then((reseller) => {
          if (reseller) {
            setVisitorCardReseller(reseller);
          }
        }).catch(console.error);
      } else if (viewParam === 'presentation') {
        setIsBusinessPresentationOpen(true);
      } else if (viewParam === 'technical') {
        setIsTechnicalReportOpen(true);
      } else if (viewParam === 'register') {
        setAuthModalInitialMode('register');
        setIsAuthModalOpen(true);
      }

      // Check if ?demo=1 or ?trial=1 is passed in URL
      if (urlParams.get('demo') === '1' || urlParams.get('trial') === '1') {
        const currentSt = getDeviceDemoStatus();
        if (!currentSt.isExpired) {
          setIsGuestDemoActive(true);
        }
      }
    }

    // Initialize with central Firestore
    initializeDeviceDemo().then((status) => {
      setDemoStatus(status);
      if (status.isStarted && !status.isExpired && status.remainingSeconds > 0) {
        setIsGuestDemoActive(true);
      } else if (status.isExpired && !currentUser) {
        setIsGuestDemoActive(false);
        soundEngine.stop();
        setIsAudioPlaying(false);
      }
    }).catch(console.debug);

    // Subscribe to live ticking demo status (background wall clock persistence)
    const unsubscribeDemo = subscribeToDeviceDemo((status) => {
      setDemoStatus(status);
      if (status.isStarted && !status.isExpired && status.remainingSeconds > 0) {
        setIsGuestDemoActive(true);
      } else if (status.isExpired) {
        setIsGuestDemoActive(false);
        if (!currentUser) {
          soundEngine.stop();
          setIsAudioPlaying(false);
        }
      }
    });

    return () => unsubscribeDemo();
  }, [currentUser]);

  // Real-time membership status listener
  useEffect(() => {
    if (!currentUser?.uid) return;

    fetchMemberProfile(currentUser.uid).then((profile) => {
      if (profile) setCurrentUser(profile);
    });

    const unsubscribe = subscribeToMemberStatus(currentUser.uid, (updatedMember) => {
      if (updatedMember) {
        setCurrentUser(updatedMember);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Rehydrate local session updates immediately without waiting for a Firestore round trip.
  useEffect(() => {
    const handleSessionUpdated = (event: Event) => {
      const detail = (event as CustomEvent<UserMember | null>).detail;
      const nextUser = detail || getActiveMemberSession();
      if (nextUser?.uid && nextUser.email) {
        setCurrentUser(nextUser);
      } else if (detail === null) {
        setCurrentUser(null);
      }
    };

    const handleOpenDealerRegistration = () => {
      setIsMonolineModalOpen(false);
      setIsResellerDashboardOpen(false);
      setIsAdminOpen(false);
      setIsBusinessPresentationOpen(false);
      setIsTechnicalReportOpen(false);
      setIsCampaignsModalOpen(false);
      setAuthModalInitialMode('dealer');
      setIsAuthModalOpen(true);
    };

    const handleOpenResellerDashboard = () => {
      setIsMonolineModalOpen(false);
      setIsResellerDashboardOpen(true);
    };

    window.addEventListener('aurabio_session_updated', handleSessionUpdated);
    window.addEventListener('aurabio_open_dealer_registration', handleOpenDealerRegistration);
    window.addEventListener('aurabio_open_reseller_dashboard', handleOpenResellerDashboard);
    return () => {
      window.removeEventListener('aurabio_session_updated', handleSessionUpdated);
      window.removeEventListener('aurabio_open_dealer_registration', handleOpenDealerRegistration);
      window.removeEventListener('aurabio_open_reseller_dashboard', handleOpenResellerDashboard);
    };
  }, []);

  const handleAuthSuccess = (user: UserMember) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    const access = checkMemberAccess(user);
    if (!access.isAllowed) {
      setIsPaymentModalOpen(true);
    }
  };

  const handleLogout = () => {
    clearStoredReferralCode();
    logoutMemberSession();
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  const handleRefreshMemberStatus = async () => {
    if (!currentUser?.uid) return;
    const refreshed = await fetchMemberProfile(currentUser.uid);
    if (refreshed) {
      setCurrentUser(refreshed);
    }
  };

  const handleScanComplete = (result: ScanResult) => {
    saveScanResult(result, {
      uid: currentUser?.uid,
      email: currentUser?.email,
      fullName: currentUser?.fullName
    });
    setScanHistory((prev) => [result, ...prev.filter(s => s.id !== result.id)]);

    // Deduct credit from Dealer/Reseller credit pool in real-time
    // (Atomic Firestore transaction + unique requestId prevents double-spend on double triggers)
    deductScanCreditFromDealer(currentUser?.uid, {
      scanCost: 1,
      requestId: result?.id || `SCAN-${Date.now()}`
    }).then((res) => {
      if (res.success && typeof res.remainingCredits === 'number') {
        if (currentUser) {
          setCurrentUser((prev) => prev ? { ...prev, creditsBalance: res.remainingCredits } : prev);
        }
        // If credits run out (0 or less), automatically redirect dealer to package purchase modal
        if (res.remainingCredits <= 0 && (currentUser?.role === 'dealer' || currentUser?.dealerDetails)) {
          setTimeout(() => {
            setIsResellerDashboardOpen(true);
          }, 1500);
        }
      }
    }).catch(console.error);

    if (autoStartPostScan && lastPreScan && pendingComparisonTreatment) {
      setComparisonPair({
        pre: lastPreScan,
        post: result,
        name: pendingComparisonTreatment.name,
      });
      setAutoStartPostScan(false);
      setPendingComparisonTreatment(null);
    } else {
      setCurrentReport(result);
      setLastPreScan(result);
      saveLastPreScan(result);
    }
  };

  const handleSelectFrequency = (selection: TreatmentSelection) => {
    setActiveTreatment(selection);
    handleNavigate('camera');
  };

  const handleApplyDirectFrequency = (freqHz: number, binauralHz: number, name: string) => {
    soundEngine.startAdaptiveBioFrequency(freqHz, binauralHz, 'alpha', 0.55, 'ocean');
    setActiveTreatment({
      frequencyHz: freqHz,
      name: name,
      durationMinutes: 10,
      binauralHz: binauralHz,
      natureSound: 'ocean',
      brainwaveMode: 'alpha',
      breathwork: 'box',
      volume: 0.55,
      type: 'frequency',
      description: `${freqHz} Hz Biyo-akustik Rezonans Seansı`,
      targetCenter: 'Biyometrik Denge',
    });
    handleNavigate('camera');
  };

  const handleCompleteTreatment = (treatmentParam?: TreatmentSelection) => {
    soundEngine.stop();
    setIsAudioPlaying(false);

    const treatment = treatmentParam || activeTreatment || {
      name: '528 Hz Hücresel Şifa Rezonansı',
      frequencyHz: 528,
      type: 'frequency',
      durationMinutes: 10,
      description: '528 Hz Biyo-akustik Frekans Seansı',
    };

    let preScan = lastPreScan;
    if (!preScan && scanHistory.length > 0) {
      preScan = scanHistory[0];
    }

    if (preScan) {
      const postScan = generatePostScanComparisonResult(preScan, treatment);
      saveScanResult(postScan);
      setScanHistory((prev) => [postScan, ...prev]);
      setLastPreScan(postScan);
      saveLastPreScan(postScan);

      setComparisonPair({
        pre: preScan,
        post: postScan,
        name: treatment?.name || '528 Hz Hücresel Şifa Rezonansı',
      });
    }

    setActiveTreatment(null);
    setAutoStartPostScan(false);
  };

  const handleStopAudio = () => {
    soundEngine.stop();
    setIsAudioPlaying(false);
  };

  const handleClearHistory = () => {
    clearScanHistory();
    setScanHistory([]);
  };

  const handleDeleteScan = (id: string) => {
    deleteScanResult(id);
    setScanHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const access = checkMemberAccess(currentUser);
  const isGuestDemoValid = Boolean(!currentUser);
  const isAppAllowed = Boolean(currentUser ? access.isAllowed : isGuestDemoValid);
  const isAppLocked = false;

  // Determine if back button can be used
  const canGoBack = Boolean(
    tabHistory.length > 0 ||
    activeTab !== 'camera' ||
    activeTreatment ||
    currentReport ||
    selectedDiseaseDetail ||
    scanWorkflowDisease ||
    comparisonPair ||
    isEncyclopediaOpen ||
    isUserGuideOpen ||
    isTechnicalReportOpen ||
    isAdminOpen ||
    isSOSModalOpen ||
    isSleepModalOpen ||
    isWearableModalOpen ||
    isJourneyModalOpen ||
    isFrequencyForgeModalOpen ||
    isDreamDecoderModalOpen ||
    isGroupAuraModalOpen ||
    isJournalModalOpen ||
    isCampaignsModalOpen ||
    isResellerDashboardOpen
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        onGoBack={handleGoBack}
        onGoHome={handleGoHome}
        canGoBack={canGoBack}
        isAudioPlaying={isAudioPlaying}
        onStopAudio={handleStopAudio}
        scanCount={scanHistory.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAdminModal={() => setIsAdminOpen(true)}
        onOpenAuthModal={(mode) => {
          setAuthModalInitialMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
        onOpenDealerModal={() => {
          if (currentUser) {
            setMonolineInitialSubTab('backoffice');
            setIsMonolineModalOpen(true);
          } else {
            setAuthModalInitialMode('dealer');
            setIsAuthModalOpen(true);
          }
        }}
        onOpenEncyclopedia={() => setIsEncyclopediaOpen(true)}
        onOpenSOSModal={() => setIsSOSModalOpen(true)}
        onOpenSleepModal={() => setIsSleepModalOpen(true)}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
        onOpenTechnicalReport={() => setIsTechnicalReportOpen(true)}
        onOpenBusinessPresentation={() => setIsBusinessPresentationOpen(true)}
        onOpenWearableModal={() => setIsWearableModalOpen(true)}
        onOpenJourneyModal={() => setIsJourneyModalOpen(true)}
        onOpenFrequencyForgeModal={() => setIsFrequencyForgeModalOpen(true)}
        onOpenDreamDecoderModal={() => setIsDreamDecoderModalOpen(true)}
        onOpenGroupAuraModal={() => setIsGroupAuraModalOpen(true)}
        onOpenJournalModal={() => setIsJournalModalOpen(true)}
        onOpenCampaignsModal={() => setIsCampaignsModalOpen(true)}
        onOpenMonolineModal={(subTab) => {
          setMonolineInitialSubTab(subTab && subTab !== 'admin' ? subTab : 'packages');
          setIsMonolineModalOpen(true);
        }}
        onOpenSmartAccounting={onOpenSmartAccounting}
        isOnline={isOnline}
      />

      {/* 30-Minute Free Demo Countdown Banner (Active Guest Mode) */}
      {isGuestDemoValid && (
        <DemoCountdownBanner
          demoStatus={demoStatus}
          onOpenRegister={() => {
            setAuthModalInitialMode('register');
            setIsAuthModalOpen(true);
          }}
          onOpenLogin={() => {
            setAuthModalInitialMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenDealer={() => {
            setAuthModalInitialMode('dealer');
            setIsAuthModalOpen(true);
          }}
          onOpenPresentation={() => {
            setIsBusinessPresentationOpen(true);
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pb-24 lg:pb-8 transition-all duration-300">
        {activeTab === 'camera' && (
          <CameraView
            onScanComplete={handleScanComplete}
            onOpenFrequencySelector={() => handleNavigate('islamic')}
            onOpenUserGuide={() => setIsUserGuideOpen(true)}
            preScanData={lastPreScan || undefined}
            isTransmitting={Boolean(activeTreatment)}
            activeFrequency={activeTreatment?.frequencyHz}
            autoStartScan={autoStartPostScan}
            activeTreatment={activeTreatment}
            onCompleteTreatment={handleCompleteTreatment}
            onCancelTreatment={() => {
              soundEngine.stop();
              setActiveTreatment(null);
            }}
          />
        )}

        {activeTab === 'circadian' && (
          <CircadianSynchronizerView
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onApplyFrequency={handleApplyDirectFrequency}
          />
        )}

        {activeTab === 'healing' && (
          <AncientHealingMatrix
            onSelectFrequency={handleSelectFrequency}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
          />
        )}

        {activeTab === 'mandala' && (
          <MandalaGenerator
            initialFrequency={activeTreatment?.frequencyHz || 528}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
          />
        )}

        {activeTab === 'heatmap' && (
          <GlobalHeatmapView
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onApplyFrequency={handleApplyDirectFrequency}
          />
        )}

        {activeTab === 'mindspace' && (
          <MindSpaceStudio
            onSaveResultAsScan={(scan) => {
              saveScanResult(scan);
              setScanHistory(getScanHistory());
            }}
            onOpenReportModal={(scan) => {
              saveScanResult(scan);
              setScanHistory(getScanHistory());
              setCurrentReport(scan);
            }}
            onOpenFrequencySelector={() => handleNavigate('islamic')}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
          />
        )}

        {activeTab === 'islamic' && (
          <FrequencyPanel
            initialTab="esma"
            onSelectFrequency={handleSelectFrequency}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
          />
        )}

        {activeTab === 'eastern' && (
          <EasternPanel
            initialSubTab="mantras"
            onSelectFrequency={handleSelectFrequency}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
          />
        )}

        {activeTab === 'mythology' && (
          <EasternPanel
            initialSubTab="elements"
            onSelectFrequency={handleSelectFrequency}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
          />
        )}

        {activeTab === 'letaif' && (
          <GuideView
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            scans={scanHistory}
            onSelectScan={(scan) => setCurrentReport(scan)}
            onDeleteScan={handleDeleteScan}
            onClearHistory={handleClearHistory}
            onStartNewScan={() => {
              setAutoStartPostScan(false);
              handleNavigate('camera');
            }}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
          />
        )}
      </main>

      {/* Modal 1: Detailed Scan Report with direct frequency load buttons & menu picker */}
      {currentReport && (
        <ReportModal
          scanResult={currentReport}
          preScanResult={lastPreScan || (comparisonPair?.pre) || undefined}
          onClose={() => setCurrentReport(null)}
          onGoBack={handleGoBack}
          onSelectFrequencyForTreatment={(selection) => {
            setCurrentReport(null);
            setLastPreScan(currentReport);
            saveLastPreScan(currentReport);
            handleSelectFrequency(selection);
          }}
          onOpenGuide={() => {
            setCurrentReport(null);
            handleNavigate('letaif');
          }}
          onNavigateTab={(tab) => {
            setCurrentReport(null);
            setLastPreScan(currentReport);
            saveLastPreScan(currentReport);
            handleNavigate(tab as any);
          }}
          onOpenComparison={() => {
            if (comparisonPair) {
              setCurrentReport(null);
            }
          }}
          comparisonPairAvailable={Boolean(comparisonPair)}
        />
      )}

      {/* Modal 2: Before & After Comparative Transformation */}
      {comparisonPair && (
        <ComparisonModal
          preScan={comparisonPair.pre}
          postScan={comparisonPair.post}
          treatmentName={comparisonPair.name}
          onClose={() => setComparisonPair(null)}
          onNewScan={() => {
            setComparisonPair(null);
            setAutoStartPostScan(false);
            handleNavigate('camera');
          }}
          onViewDetailedReport={() => {
            const postReport = comparisonPair.post;
            setComparisonPair(null);
            setCurrentReport(postReport);
          }}
        />
      )}

      {/* Modal 2.9: 30-Minute Free Demo Expired Lock Modal */}
      {demoStatus.isExpired && !currentUser && !isExpiredModalDismissed && (
        <DemoExpiredModal
          isOpen={demoStatus.isExpired && !currentUser && !isExpiredModalDismissed}
          demoStatus={demoStatus}
          onClose={() => {
            setIsExpiredModalDismissed(true);
            setIsGuestDemoActive(true);
          }}
          onOpenRegister={() => {
            setAuthModalInitialMode('register');
            setIsAuthModalOpen(true);
          }}
          onOpenLogin={() => {
            setAuthModalInitialMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenDealer={() => {
            setAuthModalInitialMode('dealer');
            setIsAuthModalOpen(true);
          }}
          onOpenPresentation={() => {
            setIsBusinessPresentationOpen(true);
          }}
        />
      )}

      {/* Modal 3: Authentication (Login / Register / Dealer Application / Instant 30-Min Demo) */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          allowClose={true}
          initialMode={authModalInitialMode}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          onStartDemo={() => {
            setIsGuestDemoActive(true);
            setIsAuthModalOpen(false);
          }}
        />
      )}

      {/* Modal 3.5: Bayi ve İş Ortaklığı Paneli (Dealer & Reseller Portal) */}
      {isResellerDashboardOpen && (
        <ResellerDashboardModal
          isOpen={isResellerDashboardOpen}
          onClose={() => setIsResellerDashboardOpen(false)}
          currentUser={currentUser}
          onOpenAuthModal={() => {
            setIsResellerDashboardOpen(false);
            setAuthModalInitialMode('dealer');
            setIsAuthModalOpen(true);
          }}
          onOpenBusinessPresentation={() => {
            setIsBusinessPresentationOpen(true);
          }}
          onOpenTechnicalReport={() => {
            setIsTechnicalReportOpen(true);
          }}
          onOpenMonolineModal={(subTab) => {
            setIsResellerDashboardOpen(false);
            setMonolineInitialSubTab(subTab || 'packages');
            setIsMonolineModalOpen(true);
          }}
          onGoToCamera={() => {
            setIsResellerDashboardOpen(false);
            handleNavigate('camera');
          }}
        />
      )}

      {/* Modal 3.6: Dış Ziyaretçi / Müşteri Dijital Bayi Kartviziti & Karekod Görünümü */}
      {visitorCardReseller && (
        <DealerBusinessCardModal
          isOpen={Boolean(visitorCardReseller)}
          onClose={() => setVisitorCardReseller(null)}
          reseller={visitorCardReseller}
          isVisitorView={true}
          onStartRegistration={() => {
            setVisitorCardReseller(null);
            setAuthModalInitialMode('register');
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* Modal 4: Payment & Cart Panel */}
      {currentUser && isPaymentModalOpen && (
        <PaymentModal
          user={currentUser}
          onClose={() => setIsPaymentModalOpen(false)}
          onProceedToWaiting={() => setIsPaymentModalOpen(false)}
          onDemoActivated={(updated) => {
            setCurrentUser(updated);
            setIsPaymentModalOpen(false);
          }}
          allowClose={true}
          isExpiredNotice={access.isExpired}
        />
      )}
      <Vpos3DSecureModal />

      {/* Modal 5: Membership Approval Waiting Screen */}
      {currentUser && 
       !access.isAllowed && 
       currentUser.role !== 'dealer' &&
       currentUser.dealerStatus !== 'approved' &&
       !currentUser.dealerDetails &&
       !currentUser.isDealerRequested &&
       !isResellerDashboardOpen &&
       !isBusinessPresentationOpen &&
       !isTechnicalReportOpen &&
       !isUserGuideOpen &&
       !isEncyclopediaOpen &&
       !isAdminOpen &&
       !isPaymentModalOpen && 
       !isAuthModalOpen && (
        <MembershipWaitingOverlay
          user={currentUser}
          onRefresh={handleRefreshMemberStatus}
          onLogout={handleLogout}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          onOpenDealerDashboard={() => setIsResellerDashboardOpen(true)}
          onDismiss={() => {
            // Allow exploring
            setCurrentUser(prev => prev ? { ...prev, isAllowed: true } : null);
          }}
        />
      )}

      {/* Modal 6: Dedicated Admin Portal */}
      {isAdminOpen && (
        <AdminPanelModal
          onClose={() => setIsAdminOpen(false)}
          onMemberUpdated={handleRefreshMemberStatus}
          onOpenSmartAccounting={onOpenSmartAccounting}
        />
      )}

      {/* Modal 7: Comprehensive Interactive User Guide */}
      {isUserGuideOpen && (
        <UserGuideModal
          isOpen={isUserGuideOpen}
          onClose={() => setIsUserGuideOpen(false)}
        />
      )}

      {/* Modal 7.5: Kurumsal & Teknik Is Sunumu Raporu */}
      {isTechnicalReportOpen && (
        <TechnicalReportModal
          isOpen={isTechnicalReportOpen}
          onClose={() => setIsTechnicalReportOpen(false)}
        />
      )}

      {/* Modal 7.6: Dijital Gelir Modeli ve Bayilik İş Sunum Raporu */}
      {isBusinessPresentationOpen && (
        <BusinessPresentationModal
          isOpen={isBusinessPresentationOpen}
          onClose={() => setIsBusinessPresentationOpen(false)}
          currentUser={currentUser}
          onOpenAuthModal={(mode) => {
            setIsBusinessPresentationOpen(false);
            setAuthModalInitialMode(mode || 'register');
            setIsAuthModalOpen(true);
          }}
          onOpenResellerModal={() => {
            setIsBusinessPresentationOpen(false);
            setIsResellerDashboardOpen(true);
          }}
          onOpenDealerBusinessCard={async () => {
            setIsBusinessPresentationOpen(false);
            const activeSession = getActiveResellerSession();
            if (activeSession) {
              setVisitorCardReseller(activeSession);
            } else {
              const code = getStoredReferralCode();
              if (code) {
                const match = await getResellerByCode(code);
                if (match) setVisitorCardReseller(match);
              }
            }
          }}
        />
      )}

      {/* Modal 8: Mandatory Medical Disclaimer */}
      <MedicalDisclaimerModal
        isOpen={Boolean(currentUser && !isDisclaimerAccepted)}
        onAccept={() => {
          try {
            localStorage.setItem('aurabio_medical_disclaimer_accepted_v1', 'true');
          } catch (e) {
            console.warn(e);
          }
          setIsDisclaimerAccepted(true);
        }}
      />

      {/* Modal 9: 1-Minute Emergency SOS Panic & Stress Reliever */}
      <EmergencySOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
      />

      {/* Modal 10: Bio-Sync Sleep Soundscape (Night Sleep Tunnel) */}
      <SleepModeModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
      />

      {/* Modal 11: 🌿 Şifa Ansiklopedisi & 50+ Hastalık Frekans Matrisi */}
      <HealingEncyclopediaModal
        isOpen={isEncyclopediaOpen}
        onClose={() => setIsEncyclopediaOpen(false)}
        onGoBack={handleGoBack}
        onSelectDiseaseForDetail={(disease) => setSelectedDiseaseDetail(disease)}
        onStartScanWorkflow={(disease) => {
          setIsEncyclopediaOpen(false);
          setScanWorkflowDisease(disease);
        }}
      />

      {/* Modal 12: Hastalık Detay & Reçete Görünümü */}
      <DiseaseDetailModal
        disease={selectedDiseaseDetail}
        isOpen={Boolean(selectedDiseaseDetail)}
        onClose={() => setSelectedDiseaseDetail(null)}
        onGoBack={handleGoBack}
        onStartScanWorkflow={(disease) => {
          setSelectedDiseaseDetail(null);
          setIsEncyclopediaOpen(false);
          setScanWorkflowDisease(disease);
        }}
      />

      {/* Modal 13: 10 Saniyelik Ön/Son Biyo-Akustik Tarama & Karşılaştırma Raporu */}
      <AcousticSessionWorkflowModal
        disease={scanWorkflowDisease}
        isOpen={Boolean(scanWorkflowDisease)}
        onClose={() => setScanWorkflowDisease(null)}
        onGoBack={handleGoBack}
        patientName={currentUser?.fullName || 'Misafir Danışan'}
        initialStep={acousticWorkflowStep}
        onStepChange={(st) => setAcousticWorkflowStep(st)}
      />

      {/* Modal 14: Aura-Sync Akıllı Saat & Biyometrik Canlı Köprü (Web Bluetooth) */}
      <WearableBridgeModal
        isOpen={isWearableModalOpen}
        onClose={() => setIsWearableModalOpen(false)}
        onApplyFrequency={handleApplyDirectFrequency}
      />

      {/* Modal 15: 7 Günlük AI Bütünsel Arınma & Çakra Kampları */}
      <HolisticJourneyModal
        isOpen={isJourneyModalOpen}
        onClose={() => setIsJourneyModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Modal 16: 🎙️ Sesli & Niyetli Frekans Labirenti (Voice-Intention Frequency Forge) */}
      <VoiceIntentionForgeModal
        isOpen={isFrequencyForgeModalOpen}
        onClose={() => setIsFrequencyForgeModalOpen(false)}
      />

      {/* Modal 17: 🌙 AI Rüya & Bilinçaltı Çözümleyicisi (Dream & Subconscious Decoder) */}
      <DreamDecoderModal
        isOpen={isDreamDecoderModalOpen}
        onClose={() => setIsDreamDecoderModalOpen(false)}
      />

      {/* Modal 18: 👥 Kurumsal & Aile Çemberi (Family & Group Aura Sync) */}
      <GroupAuraSyncModal
        isOpen={isGroupAuraModalOpen}
        onClose={() => setIsGroupAuraModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Modal 19: 🧠 AI Yaşam Koçu & Günlük Günlük (Aura-Journal & AI Inner Voice Reflector) */}
      <AuraJournalModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Modal 20: 🎁 Özel Kampanyalar, İndirimler & Duyuru Paneli */}
      <CampaignsModal
        isOpen={isCampaignsModalOpen}
        onClose={() => setIsCampaignsModalOpen(false)}
        onOpenAuth={(tab) => {
          setIsCampaignsModalOpen(false);
          setAuthModalInitialMode(tab === 'register' ? 'dealer' : 'login');
          setIsAuthModalOpen(true);
        }}
        onOpenPayment={() => {
          setIsCampaignsModalOpen(false);
          if (currentUser) {
            setIsPaymentModalOpen(true);
          } else {
            setAuthModalInitialMode('dealer');
            setIsAuthModalOpen(true);
          }
        }}
      />

      {/* Modal 21: Monoline 7 Nefis Mertebesi MLM & Back-Office Sistemi (Dealer View — Admin/SQL Hidden) */}
      <MonolineMlmPortalModal
        isOpen={isMonolineModalOpen}
        onClose={() => setIsMonolineModalOpen(false)}
        onSubTabChange={setMonolineInitialSubTab}
        onGoToCamera={() => {
          setIsMonolineModalOpen(false);
          handleNavigate('camera');
        }}
        initialSubTab={monolineInitialSubTab}
        isAdminAuthenticated={false}
        onOpenSmartAccounting={onOpenSmartAccounting}
      />

      <VoiceErrorToast />

    </div>
  );
}
