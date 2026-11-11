import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Calendar, 
  CheckCircle2, 
  Play, 
  VolumeX, 
  Volume2, 
  Sparkles, 
  Sun, 
  Moon, 
  Sunrise, 
  X, 
  Award, 
  Flame, 
  ArrowRight, 
  Clock, 
  Zap, 
  Shield, 
  ChevronRight,
  RefreshCw,
  Info,
  FileText,
  Download
} from 'lucide-react';
import { 
  TRANSFORMATION_JOURNEYS, 
  HolisticJourneyProgram, 
  HolisticJourneyDay, 
  DailySessionProtocol 
} from '../data/transformationJourneys';
import { UserMember } from '../utils/authManager';
import { doc, getDoc, setDoc, db } from '../lib/db';
import { soundEngine } from '../utils/soundEngine';
import { downloadHolisticJourneyReportWord, downloadHolisticJourneyReportPDF } from '../utils/moduleReportsExport';

interface HolisticJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserMember | null;
}

export const HolisticJourneyModal: React.FC<HolisticJourneyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [selectedProgram, setSelectedProgram] = useState<HolisticJourneyProgram>(TRANSFORMATION_JOURNEYS[0]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [activeSessionSlot, setActiveSessionSlot] = useState<'morning' | 'midday' | 'evening'>('morning');
  
  // Progress State
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [streak, setStreak] = useState<number>(1);
  const [activeRunningSession, setActiveRunningSession] = useState<DailySessionProtocol | null>(null);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState<number>(0);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  // Load progress from localStorage and Firestore
  useEffect(() => {
    if (!isOpen) return;

    const storageKey = `aurabio_journey_${selectedProgram.id}_progress`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.completedSessions) setCompletedSessions(parsed.completedSessions);
        if (parsed.streak) setStreak(parsed.streak);
        if (parsed.currentDay) setSelectedDayNumber(parsed.currentDay);
      }
    } catch {}

    // If logged in, fetch from Firestore
    if (currentUser?.uid && navigator.onLine) {
      const fetchDb = async () => {
        try {
          const docRef = doc(db, 'users', currentUser.uid, 'journeyProgress', selectedProgram.id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data?.completedSessions) setCompletedSessions(data.completedSessions);
            if (data?.streak) setStreak(data.streak);
            if (data?.currentDay) setSelectedDayNumber(data.currentDay);
          }
        } catch (e) {
          console.warn('Firestore journey load warning:', e);
        }
      };
      fetchDb();
    }
  }, [isOpen, selectedProgram.id, currentUser?.uid]);

  // Session timer countdown & breathwork loop
  useEffect(() => {
    if (!activeRunningSession || sessionSecondsLeft <= 0) {
      if (sessionSecondsLeft === 0 && activeRunningSession) {
        handleSessionComplete(activeRunningSession.id);
      }
      return;
    }

    const timer = setInterval(() => {
      setSessionSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Breathwork phase loop (4s inhale, 4s hold, 4s exhale)
    const breathTimer = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        return 'inhale';
      });
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(breathTimer);
    };
  }, [activeRunningSession, sessionSecondsLeft]);

  if (!isOpen) return null;

  const currentDayData = selectedProgram.days.find((d) => d.dayNumber === selectedDayNumber) || selectedProgram.days[0];
  const middaySession = currentDayData.middaySession;

  const handleStartSession = (session: DailySessionProtocol) => {
    setActiveRunningSession(session);
    setSessionSecondsLeft(session.durationMinutes * 60);

    // Play synthesized frequencies
    soundEngine.startAdaptiveBioFrequency(
      session.frequencyHz,
      session.binauralHz,
      session.binauralHz < 4 ? 'delta' : session.binauralHz < 8 ? 'theta' : 'alpha',
      0.55,
      ((session as any).natureSound as any) || 'ocean'
    );
  };

  const handleStopSession = () => {
    soundEngine.stopAll();
    setActiveRunningSession(null);
    setSessionSecondsLeft(0);
  };

  const handleSessionComplete = (sessionId: string) => {
    soundEngine.playCompletionChimeSequence();
    soundEngine.stopAll();
    setActiveRunningSession(null);
    setSessionSecondsLeft(0);

    const nextCompleted = Array.from(new Set([...completedSessions, sessionId]));
    setCompletedSessions(nextCompleted);

    // Save to local storage
    const storageKey = `aurabio_journey_${selectedProgram.id}_progress`;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        completedSessions: nextCompleted,
        streak: streak + 1,
        currentDay: Math.min(7, selectedDayNumber + 1),
        lastCompletedAt: new Date().toISOString(),
      }));
    } catch {}

    // Save to Firestore
    if (currentUser?.uid && navigator.onLine) {
      const docRef = doc(db, 'users', currentUser.uid, 'journeyProgress', selectedProgram.id);
      setDoc(docRef, {
        journeyId: selectedProgram.id,
        userId: currentUser.uid,
        completedSessions: nextCompleted,
        completedDays: [selectedDayNumber],
        currentDay: Math.min(7, selectedDayNumber + 1),
        streak: streak + 1,
        lastCompletedAt: new Date().toISOString(),
        isFinished: nextCompleted.length >= 21,
      }, { merge: true }).catch((err) => console.warn('Save journey progress error:', err));
    }
  };

  const isDayCompleted = (dayNum: number) => {
    const day = selectedProgram.days.find((d) => d.dayNumber === dayNum);
    if (!day) return false;
    return (
      completedSessions.includes(day.morningSession.id) &&
      (!day.middaySession || completedSessions.includes(day.middaySession.id)) &&
      completedSessions.includes(day.eveningSession.id)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl shadow-teal-950/70 flex flex-col scrollbar-none">
        
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 via-emerald-500/20 to-cyan-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-inner">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  7 Günlük AI Bütünsel Arınma & Dönüşüm Kampları
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Otomatik Seans Yöneticisi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Günde 3 Vakit (Sabah • Öğle • Gece) Biyo-Rezonans & Solfeggio Frekans Yolculuğu
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleStopSession();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Program Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TRANSFORMATION_JOURNEYS.map((prog) => (
              <button
                key={prog.id}
                onClick={() => setSelectedProgram(prog)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  selectedProgram.id === prog.id
                    ? 'bg-gradient-to-r from-teal-500/25 to-emerald-500/25 text-teal-200 border-teal-500/50 shadow-md shadow-teal-950'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{prog.title}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-teal-500/20 text-[9px] text-teal-300 font-bold">
                    {(prog as any).badge || prog.difficulty || '7 Gün'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Active Running Session Overlay if In Progress */}
          {activeRunningSession && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 border-2 border-teal-500/60 shadow-2xl shadow-teal-950/80 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    Canlı Seans Yayını Devam Ediyor
                  </span>
                </div>
                <div className="text-lg font-black font-mono text-teal-200">
                  {Math.floor(sessionSecondsLeft / 60)}:{(sessionSecondsLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-base font-bold text-white">{activeRunningSession.title}</div>
                  <div className="text-xs text-slate-300">{activeRunningSession.guidanceText}</div>
                  <div className="text-[11px] text-teal-400/90 font-mono mt-1">
                    {activeRunningSession.frequencyHz} Hz Solfeggio • {activeRunningSession.binauralHz} Hz Binaural • {activeRunningSession.natureSound}
                  </div>
                </div>

                {/* Animated Breathwork Circle */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-1000 ${
                    breathPhase === 'inhale' ? 'scale-110 bg-teal-500/30 border-teal-400 text-teal-200 shadow-lg shadow-teal-500/50' :
                    breathPhase === 'hold' ? 'scale-105 bg-amber-500/30 border-amber-400 text-amber-200' :
                    'scale-90 bg-indigo-500/30 border-indigo-400 text-indigo-200'
                  }`}>
                    {breathPhase === 'inhale' ? 'NEFES AL' : breathPhase === 'hold' ? 'TUT' : 'VER'}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">{activeRunningSession.breathwork} Modu</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={handleStopSession}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Durdur
                </button>
                <button
                  onClick={() => handleSessionComplete(activeRunningSession.id)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tamamlandı Olarak İşaretle</span>
                </button>
              </div>
            </div>
          )}

          {/* 7-Day Interactive Timeline Navigation Bar */}
          <div className="p-4 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-teal-400">
                <Calendar className="w-4 h-4" />
                <span>7 Günlük İlerleme Çizelgesi</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Flame className="w-3.5 h-3.5" />
                <span>{streak} Günlük Seri</span>
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {selectedProgram.days.map((day) => {
                const isSelected = selectedDayNumber === day.dayNumber;
                const completed = isDayCompleted(day.dayNumber);

                return (
                  <button
                    key={day.dayNumber}
                    onClick={() => setSelectedDayNumber(day.dayNumber)}
                    className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl transition-all border relative ${
                      isSelected
                        ? 'bg-teal-500/25 border-teal-400 text-white shadow-lg shadow-teal-950/70 scale-105'
                        : completed
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/30'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs font-bold">Gün {day.dayNumber}</span>
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full mt-1.5" style={{ backgroundColor: day.colorHex }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Detailed Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-5">
            
            {/* Day Header Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow" style={{ backgroundColor: currentDayData.colorHex }}>
                    Gün {currentDayData.dayNumber}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {currentDayData.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">{currentDayData.subtitle}</p>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold">
                {currentDayData.chakraOrLetaif}
              </div>
            </div>

            {/* Daily Affirmation & Dhikr Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  Günün Kutsal Olumlaması
                </div>
                <div className="text-xs text-slate-200 italic leading-relaxed">
                  "{currentDayData.sacredAffirmation}"
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Günün Zikri & Bija Mantrası
                </div>
                <div className="text-xs text-amber-200 font-semibold leading-relaxed">
                  {currentDayData.sacredDhikrOrMantra}
                </div>
              </div>
            </div>

            {/* 3 Daily Time Slots: Morning, Midday, Evening */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Günün 3 Vakit Frekans Seansı
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* 1. Morning */}
                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  completedSessions.includes(currentDayData.morningSession.id)
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Sunrise className="w-4 h-4" />
                        <span>Sabah Uyanışı</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {currentDayData.morningSession.durationMinutes} Dk
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">{currentDayData.morningSession.title}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {currentDayData.morningSession.focusArea}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartSession(currentDayData.morningSession)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Sabahı Başlat</span>
                  </button>
                </div>

                {/* 2. Midday */}
                {middaySession && (
                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  completedSessions.includes(middaySession.id)
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs font-bold text-teal-400">
                        <Sun className="w-4 h-4" />
                        <span>Öğle Dengesi</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {middaySession.durationMinutes} Dk
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">{middaySession.title}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {middaySession.focusArea}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartSession(middaySession)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Öğleyi Başlat</span>
                  </button>
                </div>
                )}

                {/* 3. Evening */}
                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  completedSessions.includes(currentDayData.eveningSession.id)
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs font-bold text-indigo-400">
                        <Moon className="w-4 h-4" />
                        <span>Gece Arınması</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {currentDayData.eveningSession.durationMinutes} Dk
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">{currentDayData.eveningSession.title}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {currentDayData.eveningSession.focusArea}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartSession(currentDayData.eveningSession)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Geceyi Başlat</span>
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer & Export Action */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                downloadHolisticJourneyReportPDF({
                  programTitle: selectedProgram.title,
                  programSubtitle: selectedProgram.subtitle,
                  currentDay: selectedDayNumber,
                  totalDays: selectedProgram.totalDays,
                  streak,
                  completedSessionsCount: completedSessions.length,
                  totalSessionsCount: (selectedProgram.totalDays ?? selectedProgram.durationDays) * 3,
                  userName: currentUser?.fullName || 'Değerli Kullanıcı',
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-500/40 text-xs font-bold transition-all active:scale-95 shadow cursor-pointer"
              title="7 Günlük Kamp Raporu (PDF) İndir"
            >
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>Kamp Raporu PDF</span>
            </button>

            <button
              onClick={() => {
                downloadHolisticJourneyReportWord({
                  programTitle: selectedProgram.title,
                  programSubtitle: selectedProgram.subtitle,
                  currentDay: selectedDayNumber,
                  totalDays: selectedProgram.totalDays,
                  streak,
                  completedSessionsCount: completedSessions.length,
                  totalSessionsCount: (selectedProgram.totalDays ?? selectedProgram.durationDays) * 3,
                  userName: currentUser?.fullName || 'Değerli Kullanıcı',
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all active:scale-95 shadow cursor-pointer"
              title="7 Günlük Kamp Raporu (Word .doc) İndir"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Kamp Raporu Word</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-400" />
              <span>7 Günlük Bütünsel Arınma & Çakra Dengeleme Matrisi</span>
            </div>
            <button
              onClick={() => {
                handleStopSession();
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
