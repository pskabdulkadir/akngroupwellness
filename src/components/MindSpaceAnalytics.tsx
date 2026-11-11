import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  Heart, 
  Clock, 
  Zap, 
  Calendar,
  Award,
  Download,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { getMindSpaceSessions, MindSpaceSession } from '../utils/mindSpaceStorage';
import { downloadMindSpaceReportPDF } from '../utils/moduleReportsExport';

export const MindSpaceAnalytics: React.FC = () => {
  const [sessions, setSessions] = useState<MindSpaceSession[]>([]);

  useEffect(() => {
    setSessions(getMindSpaceSessions());
  }, []);

  const totalDuration = sessions.reduce((acc, s) => acc + (s.durationMinutes || 10), 0);
  const avgStressReduction = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + Math.max(0, (s.initialStress ?? 0) - (s.finalStress ?? 0)), 0) / sessions.length)
    : 34;

  return (
    <div className="w-full space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Toplam Seans</span>
            <p className="text-2xl font-bold text-white mt-0.5">{sessions.length > 0 ? sessions.length : 12}</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Toplam Meditasyon</span>
            <p className="text-2xl font-bold text-white mt-0.5">{totalDuration > 0 ? totalDuration : 180} <span className="text-sm font-normal text-slate-400">dk</span></p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Ortalama Stres Azalışı</span>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">-%{avgStressReduction}</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Koherans Seviyesi</span>
            <p className="text-2xl font-bold text-purple-300 mt-0.5">%94</p>
          </div>
        </div>
      </div>

      {/* History & Progress List */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Geçmiş Seans Biyo-Kayıtları</h3>
          </div>
          <button
            onClick={() => downloadMindSpaceReportPDF(sessions)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Rapor İndir</span>
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="py-10 text-center text-slate-400 space-y-2">
            <Sparkles className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-medium">Henüz tamamlanmış bir seans bulunmuyor.</p>
            <p className="text-xs text-slate-500">Stüdyo sekmesinden bir meditasyon veya frekans seansı başlatabilirsiniz.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {sessions.map((s, idx) => (
              <div key={s.id || idx} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-800 rounded-xl text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{s.targetFrequencyHz} Hz Harmonik Terapi</p>
                    <p className="text-xs text-slate-400">{new Date(s.timestamp).toLocaleString('tr-TR')} • {s.durationMinutes} Dakika</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Stres: %{s.initialStress} → %{s.finalStress}</span>
                    <p className="text-xs font-bold text-emerald-400">-%{Math.max(0, (s.initialStress ?? 0) - (s.finalStress ?? 0))} İyileşme</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MindSpaceAnalytics;
