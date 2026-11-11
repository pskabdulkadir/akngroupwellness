import React, { useState, useEffect } from 'react';
import { 
  Dna, 
  Play, 
  Pause, 
  Sparkles, 
  Calendar, 
  User, 
  Radio, 
  CheckCircle2, 
  Flame, 
  Volume2, 
  Info
} from 'lucide-react';
import { PersonalBioResonanceProfile } from '../types';
import { calculatePersonalBioResonance, getSavedPersonalResonance } from '../utils/resonanceMatcher';
import { soundEngine } from '../utils/soundEngine';

interface BioResonanceCardProps {
  initialFullName?: string;
}

export const BioResonanceCard: React.FC<BioResonanceCardProps> = ({ initialFullName = '' }) => {
  const [fullName, setFullName] = useState<string>(initialFullName || 'Ahmet Yılmaz');
  const [birthDate, setBirthDate] = useState<string>('1990-05-15');
  const [profile, setProfile] = useState<PersonalBioResonanceProfile | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [resonanceVolume, setResonanceVolume] = useState<number>(0.7);

  useEffect(() => {
    const saved = getSavedPersonalResonance();
    if (saved) {
      setProfile(saved);
      setFullName(saved.fullName);
      setBirthDate(saved.birthDate);
    } else {
      const generated = calculatePersonalBioResonance(fullName, birthDate);
      setProfile(generated);
    }
  }, []);

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) return;
    const computed = calculatePersonalBioResonance(fullName, birthDate);
    setProfile(computed);

    if (isPlaying) {
      soundEngine.startPersonalResonance(computed.personalBaseFreqHz, computed.signatureBinauralHz, resonanceVolume);
    }
  };

  const togglePlayback = async () => {
    if (!profile) return;

    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    } else {
      await soundEngine.unlockAudio();
      await soundEngine.startPersonalResonance(
        profile.personalBaseFreqHz,
        profile.signatureBinauralHz,
        resonanceVolume
      );
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (isPlaying) {
        soundEngine.stop();
      }
    };
  }, [isPlaying]);

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl animate-fade-in shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Dna className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Bio-Resonance Frequency Matcher</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Kişisel Akustik İmza
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Adınız ve doğum tarihinizden türetilen ömürlük ana frekansınız ve rezonans akordunuz
            </p>
          </div>
        </div>
      </div>

      {/* Form Input: Name & Birth Date */}
      <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>Adınız ve Soyadınız</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Örn: Ahmet Yılmaz"
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-4 flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Doğum Tarihi</span>
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>

        <div className="sm:col-span-2 flex items-end">
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 cursor-pointer"
          >
            Hesapla
          </button>
        </div>
      </form>

      {/* Computed Profile Display */}
      {profile && (
        <div className="flex flex-col gap-5 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
          
          {/* Card Top: Title & Frequency Badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-850 gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{profile.harmonicTitle}</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Kişi: <strong className="text-slate-200">{profile.fullName}</strong> • Yaşam Yolu Sayısı: <strong className="text-emerald-400">{profile.lifePathNumber}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                {profile.personalBaseFreqHz} Hz
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold">
                +{profile.signatureBinauralHz} Hz
              </span>
            </div>
          </div>

          {/* Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">İlişkili Çakra</span>
              <span className="text-xs font-bold text-slate-200 truncate block">
                {profile.associatedChakra}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Aura Elementi</span>
              <span className="text-xs font-bold text-amber-300">
                {profile.astralElement}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Tohum Ses (Bija)</span>
              <span className="text-xs font-bold text-indigo-300">
                {profile.sanskritNote}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Tavsiye Süre</span>
              <span className="text-xs font-bold text-emerald-400">
                Günlük {profile.recommendedDailyMinutes} Dk.
              </span>
            </div>
          </div>

          {/* Acoustic Blueprint Description */}
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
            {profile.acousticBlueprint}
          </p>

          {/* Action Player Bar */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Saf Harmonik Sinüs Dalgası & Stereo İki-Yarıküre Senkronizasyonu
            </span>

            <button
              onClick={togglePlayback}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-rose-900/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900/80'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Kişisel Frekansı Durdur</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Özel Frekansımı Çal ({profile.personalBaseFreqHz} Hz)</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
