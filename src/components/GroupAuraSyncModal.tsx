import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Plus, 
  LogIn, 
  Copy, 
  Check, 
  Play, 
  Square, 
  Radio, 
  Share2, 
  Sparkles, 
  Crown, 
  Activity, 
  Volume2, 
  X, 
  CheckCircle2, 
  HeartHandshake, 
  ShieldCheck, 
  Flame, 
  Moon, 
  RefreshCw, 
  Globe 
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs, Unsubscribe, db } from '../lib/db';
import { GroupAuraRoom, GroupAuraMember } from '../types';
import { soundEngine } from '../utils/soundEngine';
import { UserMember } from '../utils/authManager';

interface GroupAuraSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserMember | null;
}

const PRESET_GROUP_SESSIONS = [
  {
    title: 'Kolektif Aile Huzuru & Sekinet',
    freqHz: 432,
    binauralHz: 7.83,
    intention: 'Aile içi sevgi, huzur ve negatif stresin nötrlenmesi',
    badge: '432 Hz Solfeggio',
  },
  {
    title: '528Hz DNA & Hücresel Şifa Çemberi',
    freqHz: 528,
    binauralHz: 8.0,
    intention: 'Grup genelinde biyo-alan güçlendirme ve hücresel yenilenme',
    badge: '528 Hz Hücresel',
  },
  {
    title: 'Ofis & Ekip Zihinsel Odak Rezonansı',
    freqHz: 741,
    binauralHz: 14.0,
    intention: 'Kolektif zihinsel netlik, ilham ve yüksek yaratıcılık',
    badge: '741 Hz Beta/Odak',
  },
  {
    title: 'Gece Kolektif Uyku Tüneli & Dinlenme',
    freqHz: 174,
    binauralHz: 1.5,
    intention: 'Derin uyku, melatonin salgısı ve gece hücresel detoksu',
    badge: '174 Hz Delta',
  },
  {
    title: 'Manevi Koruma & Kirlian Aura Kalkanı',
    freqHz: 396,
    binauralHz: 6.0,
    intention: 'Tüm aile üyelerinin aurasını koruma ve negatif enerjileri savuşturma',
    badge: '396 Hz Kök Kalkan',
  },
];

export const GroupAuraSyncModal: React.FC<GroupAuraSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'room' | 'create' | 'join'>('room');
  const [currentRoom, setCurrentRoom] = useState<GroupAuraRoom | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomIntention, setNewRoomIntention] = useState('Kolektif huzur, sevgi ve biyo-rezonans uyumu');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSyncPlaying, setIsSyncPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const unsubscribeRoomRef = useRef<Unsubscribe | null>(null);
  const myMemberIdRef = useRef<string>(currentUser?.uid || `guest-${Math.random().toString(36).substring(2, 7)}`);
  const myDisplayName = currentUser?.fullName || 'Misafir Danışan';

  // Load last active room from localStorage or default demo room
  useEffect(() => {
    try {
      const storedRoomJson = localStorage.getItem('aurabio_active_group_room');
      if (storedRoomJson) {
        const parsed = JSON.parse(storedRoomJson) as GroupAuraRoom;
        setCurrentRoom(parsed);
        listenToFirestoreRoom(parsed.roomId);
      }
    } catch {}

    return () => {
      if (unsubscribeRoomRef.current) {
        unsubscribeRoomRef.current();
        unsubscribeRoomRef.current = null;
      }
    };
  }, []);

  // Real-time Firestore Listener
  const listenToFirestoreRoom = (roomId: string) => {
    if (unsubscribeRoomRef.current) {
      unsubscribeRoomRef.current();
      unsubscribeRoomRef.current = null;
    }

    try {
      const roomDocRef = doc(db, 'groupAuraRooms', roomId);
      const unsub = onSnapshot(roomDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as GroupAuraRoom;
          setCurrentRoom(data);

          // Handle Synchronized Playback across all devices
          if (data.isPlaying && !soundEngine.getIsPlaying()) {
            soundEngine.startAdaptiveBioFrequency(
              data.activeFrequencyHz,
              data.activeBinauralHz,
              'alpha',
              0.55,
              'ocean'
            );
            setIsSyncPlaying(true);
          } else if (!data.isPlaying && isSyncPlaying) {
            soundEngine.stop();
            setIsSyncPlaying(false);
          }
        }
      }, (err) => {
        console.warn('Firestore group room listener notice:', err);
      });

      unsubscribeRoomRef.current = unsub;
    } catch (e) {
      console.warn('Firestore room sync fallback to local mode:', e);
    }
  };

  // Create New Room Handler
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      setErrorMessage('Lütfen odaya bir isim veriniz.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const generatedCode = `AURA-${Math.floor(1000 + Math.random() * 9000)}`;
    const roomId = `room-${Date.now()}`;
    const myUid = myMemberIdRef.current;

    const initialMember: GroupAuraMember = {
      uid: myUid,
      displayName: myDisplayName,
      email: currentUser?.email || '',
      status: 'Oda Yöneticisi • Hazır',
      joinedAt: Date.now(),
      lastHeartbeat: Date.now(),
      isHost: true,
      currentAuraColor: '#10b981',
      energyLevel: 96,
    };

    const newRoom: GroupAuraRoom = {
      roomId,
      roomCode: generatedCode,
      roomName: newRoomName.trim(),
      description: newRoomIntention.trim(),
      hostUid: myUid,
      hostName: myDisplayName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeFrequencyHz: 432,
      activeBinauralHz: 7.83,
      activeSessionTitle: 'Kolektif Aile Huzuru & Sekinet',
      isPlaying: false,
      targetIntention: newRoomIntention.trim(),
      members: {
        [myUid]: initialMember,
      },
      memberCount: 1,
      coherenceScore: 94,
    };

    try {
      await setDoc(doc(db, 'groupAuraRooms', roomId), newRoom);
    } catch (e) {
      console.warn('Saved room locally as fallback:', e);
    }

    try {
      localStorage.setItem('aurabio_active_group_room', JSON.stringify(newRoom));
    } catch {}

    setCurrentRoom(newRoom);
    listenToFirestoreRoom(roomId);
    setActiveTab('room');
    setIsLoading(false);
  };

  // Join Room by Code
  const handleJoinRoom = async () => {
    const code = joinRoomCode.trim().toUpperCase();
    if (!code) {
      setErrorMessage('Lütfen 6-8 haneli oda kodunu giriniz.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const myUid = myMemberIdRef.current;
      const joinedMember: GroupAuraMember = {
        uid: myUid,
        displayName: myDisplayName,
        email: currentUser?.email || '',
        status: 'Rezonansa Katıldı • Canlı',
        joinedAt: Date.now(),
        lastHeartbeat: Date.now(),
        isHost: false,
        currentAuraColor: '#2dd4bf',
        energyLevel: 92,
      };

      // Check if current loaded room matches
      if (currentRoom && currentRoom.roomCode === code) {
        const updatedMembers = {
          ...currentRoom.members,
          [myUid]: joinedMember,
        };
        const updatedRoom: GroupAuraRoom = {
          ...currentRoom,
          members: updatedMembers,
          memberCount: Object.keys(updatedMembers).length,
          coherenceScore: Math.min(99, 90 + Object.keys(updatedMembers).length * 2),
        };

        try {
          await updateDoc(doc(db, 'groupAuraRooms', currentRoom.roomId), {
            [`members.${myUid}`]: joinedMember,
            memberCount: Object.keys(updatedMembers).length,
          });
        } catch {}

        setCurrentRoom(updatedRoom);
        setActiveTab('room');
        return;
      }

      // Query Firestore for room with matching roomCode
      const q = query(collection(db, 'groupAuraRooms'), where('roomCode', '==', code));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const foundDoc = snap.docs[0];
        const roomData = foundDoc.data() as GroupAuraRoom;
        const updatedMembers = {
          ...roomData.members,
          [myUid]: joinedMember,
        };
        const updatedRoom: GroupAuraRoom = {
          ...roomData,
          members: updatedMembers,
          memberCount: Object.keys(updatedMembers).length,
        };

        try {
          await updateDoc(doc(db, 'groupAuraRooms', roomData.roomId), {
            [`members.${myUid}`]: joinedMember,
            memberCount: Object.keys(updatedMembers).length,
          });
        } catch {}

        try {
          localStorage.setItem('aurabio_active_group_room', JSON.stringify(updatedRoom));
        } catch {}

        setCurrentRoom(updatedRoom);
        listenToFirestoreRoom(roomData.roomId);
        setActiveTab('room');
      } else {
        setErrorMessage(`"${code}" koduna ait aktif bir canlı oda bulunamadı. Lütfen oda kodunu kontrol edin veya yeni bir canlı rezonans odası oluşturun.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Odaya bağlanılamadı. Lütfen internet bağlantınızı ve oda kodunu kontrol ediniz.');
    } finally {
      setIsLoading(false);
    }
  };

  // Host triggers/changes frequency for all room members
  const handleHostSelectSession = async (session: typeof PRESET_GROUP_SESSIONS[0]) => {
    if (!currentRoom) return;

    const isHost = currentRoom.hostUid === myMemberIdRef.current;
    if (!isHost) {
      // Regular members can still request or test play locally
      await soundEngine.startAdaptiveBioFrequency(
        session.freqHz,
        session.binauralHz,
        'alpha',
        0.55,
        'ocean'
      );
      setIsSyncPlaying(true);
      return;
    }

    const updatedRoom: GroupAuraRoom = {
      ...currentRoom,
      activeFrequencyHz: session.freqHz,
      activeBinauralHz: session.binauralHz,
      activeSessionTitle: session.title,
      targetIntention: session.intention,
      isPlaying: true,
      updatedAt: Date.now(),
    };

    setCurrentRoom(updatedRoom);
    await soundEngine.startAdaptiveBioFrequency(
      session.freqHz,
      session.binauralHz,
      'alpha',
      0.55,
      'ocean'
    );
    setIsSyncPlaying(true);

    try {
      await updateDoc(doc(db, 'groupAuraRooms', currentRoom.roomId), {
        activeFrequencyHz: session.freqHz,
        activeBinauralHz: session.binauralHz,
        activeSessionTitle: session.title,
        targetIntention: session.intention,
        isPlaying: true,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn('Firestore update fallback:', e);
    }
  };

  // Host Stops Session for everyone
  const handleToggleRoomAudio = async () => {
    if (!currentRoom) return;

    if (isSyncPlaying) {
      soundEngine.stop();
      setIsSyncPlaying(false);

      if (currentRoom.hostUid === myMemberIdRef.current) {
        try {
          await updateDoc(doc(db, 'groupAuraRooms', currentRoom.roomId), {
            isPlaying: false,
            updatedAt: Date.now(),
          });
        } catch {}
      }
    } else {
      await soundEngine.startAdaptiveBioFrequency(
        currentRoom.activeFrequencyHz,
        currentRoom.activeBinauralHz,
        'alpha',
        0.55,
        'ocean'
      );
      setIsSyncPlaying(true);

      if (currentRoom.hostUid === myMemberIdRef.current) {
        try {
          await updateDoc(doc(db, 'groupAuraRooms', currentRoom.roomId), {
            isPlaying: true,
            updatedAt: Date.now(),
          });
        } catch {}
      }
    }
  };

  const handleCopyCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (!isOpen) return null;

  const isHost = currentRoom?.hostUid === myMemberIdRef.current;
  const memberList: GroupAuraMember[] = currentRoom ? (Object.values(currentRoom.members || {}) as GroupAuraMember[]) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/90 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              <Users className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Kurumsal & Aile Çemberi (Group Aura Sync)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Canlı Firestore Bulutu
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tüm bağlı cihazlarda aynı anda ortak frekans seansı başlatın ve grup aurasını eşitleyin
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isSyncPlaying) soundEngine.stop();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/70 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('room')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'room'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Aktif Çember Odası
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Yeni Oda Oluştur
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'join'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Koda Göre Katıl
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* TAB 1: ACTIVE ROOM VIEW */}
          {activeTab === 'room' && (
            <>
              {currentRoom ? (
                <div className="space-y-4">
                  
                  {/* Room Status Banner */}
                  <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/40 p-4 sm:p-5 space-y-3 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {currentRoom.roomName}
                          </h3>
                          {isHost && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-400" />
                              Yöneticisiniz
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Yönetici: <span className="text-slate-200 font-medium">{currentRoom.hostName}</span>
                        </p>
                      </div>

                      {/* Invite Code Badge & Copy */}
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/50 flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">Davet Kodu:</span>
                          <span className="text-xs font-mono font-bold text-emerald-300">
                            {currentRoom.roomCode}
                          </span>
                        </div>
                        <button
                          onClick={handleCopyCode}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Davet Kodunu Kopyala"
                        >
                          {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Active Broadcast Therapy Bar */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                          Ortak Yayınlanan Frekans:
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-white">
                          {currentRoom.activeSessionTitle} ({currentRoom.activeFrequencyHz} Hz + {currentRoom.activeBinauralHz} Hz)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {currentRoom.targetIntention}
                        </div>
                      </div>

                      <button
                        onClick={handleToggleRoomAudio}
                        className={`py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all shrink-0 cursor-pointer ${
                          isSyncPlaying
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 animate-pulse'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950'
                        }`}
                      >
                        {isSyncPlaying ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-white" />
                            <span>Seansı Durdur</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                            <span>{isHost ? 'Ortak Yayını Başlat' : 'Odayı Dinle'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Coherence & Member Count */}
                    <div className="grid grid-cols-2 gap-2 text-center pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Grup Enerji Uyumu (Coherence)</div>
                        <div className="text-sm font-bold text-emerald-300 flex items-center justify-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>%{currentRoom.coherenceScore || 94} Senkronize</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Bağlı Katılımcı Sayısı</div>
                        <div className="text-sm font-bold text-teal-300 flex items-center justify-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{memberList.length || 1} Kişi Odada</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Host Quick Session Picker */}
                  {isHost && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        Host Kontrolü: Ortak Frekans Seansı Değiştir
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PRESET_GROUP_SESSIONS.map((sess, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleHostSelectSession(sess)}
                            className={`p-2.5 rounded-xl text-left border transition-all active:scale-[0.99] flex items-center justify-between ${
                              currentRoom.activeFrequencyHz === sess.freqHz
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                                : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold">{sess.title}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                                {sess.intention}
                              </div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700 shrink-0 ml-1">
                              {sess.badge}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connected Members Live Status List */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-teal-400" />
                        Canlı Bağlı Üyeler ve Durumları
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {memberList.length} Aktif Cihaz
                      </span>
                    </span>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                      {memberList.map((m, idx) => (
                        <div
                          key={m.uid || idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-3 h-3 rounded-full animate-pulse shadow-xs"
                              style={{ backgroundColor: m.currentAuraColor || '#10b981' }}
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <span>{m.displayName}</span>
                                {m.isHost && (
                                  <Crown className="w-3 h-3 text-amber-400" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {m.status || '432Hz Dinliyor'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-right">
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              %{m.energyLevel || 95} Biyo-Uyum
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                /* No Room Joined State */
                <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Henüz Bir Çember Odasına Katılmadınız</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Aileniz veya çalışma ekibiniz için yeni bir oda oluşturabilir ya da var olan bir davet koduyla odaya katılabilirsiniz.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('create')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
                    >
                      Yeni Oda Oluştur
                    </button>
                    <button
                      onClick={() => setActiveTab('join')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs transition-all"
                    >
                      Kod ile Katıl
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: CREATE NEW ROOM */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Yeni Aura Çemberi Odası Oluştur</h3>
                <p className="text-xs text-slate-400">
                  Oda yöneticisi olarak odadaki tüm cihazların frekansını tek tıkla eşzamanlı yönetebilirsiniz.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Oda Adı:
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Örn: Kan Ailesi Huzur Çemberi veya Ofis Ekip Odası"
                    className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Kolektif Niyet / Amaç:
                  </label>
                  <input
                    type="text"
                    value={newRoomIntention}
                    onChange={(e) => setNewRoomIntention(e.target.value)}
                    placeholder="Örn: Aile içi sevgi, huzur ve negatif stresin nötrlenmesi"
                    className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="text-xs text-rose-300 bg-rose-950/30 border border-rose-500/40 p-2.5 rounded-xl">
                  {errorMessage}
                </div>
              )}

              <button
                onClick={handleCreateRoom}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/80 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Odayı Başlat ve Davet Kodu Üret</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: JOIN EXISTING ROOM */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Mevcut Bir Çember Odasına Katıl</h3>
                <p className="text-xs text-slate-400">
                  Oda yöneticinizin sizinle paylaştığı 6-8 haneli kodu girerek canlı frekans ağına bağlanın.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Davet Kodu:
                </label>
                <input
                  type="text"
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                  placeholder="Örn: AURA-7729"
                  className="w-full p-3 text-sm font-mono tracking-wider text-center uppercase rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              {errorMessage && (
                <div className="text-xs text-rose-300 bg-rose-950/30 border border-rose-500/40 p-2.5 rounded-xl">
                  {errorMessage}
                </div>
              )}

              <button
                onClick={handleJoinRoom}
                disabled={isLoading || !joinRoomCode.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xl shadow-teal-950/80 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Çember Odasına Katıl ve Eşzamanlan</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firebase Firestore Real-Time Senkronizasyonu</span>
          </div>
          <button
            onClick={() => {
              if (isSyncPlaying) soundEngine.stop();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
