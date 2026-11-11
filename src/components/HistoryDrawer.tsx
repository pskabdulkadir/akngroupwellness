import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  Sparkles, 
  Calendar, 
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Tag
} from 'lucide-react';
import { ScanResult } from '../types';
import { PageNavBar } from './PageNavBar';

interface HistoryViewProps {
  scans: ScanResult[];
  onSelectScan: (scan: ScanResult) => void;
  onDeleteScan: (id: string) => void;
  onClearHistory: () => void;
  onStartNewScan: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  scans,
  onSelectScan,
  onDeleteScan,
  onClearHistory,
  onStartNewScan,
  onGoBack,
  onGoHome,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [deletedId, setDeletedId] = useState<string | null>(null);

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletedId(id);
    onDeleteScan(id);
  };

  const handleConfirmClear = () => {
    onClearHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Navigation Bar */}
      <PageNavBar
        title="Biyo-Enerji & Tarama Geçmişi"
        subtitle="Optik aurik taramalar, frekans seansları ve karşılaştırmalı gelişim"
        icon={<History className="w-4 h-4 text-purple-400" />}
        badge={`${scans.length} Kayıt`}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <History className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Biyo-Enerji & Tarama Geçmişi</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {scans.length} Kayıt
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Daha önce gerçekleştirilen optik taramalar, frekans seansları ve karşılaştırmalı gelişim kayıtları.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {scans.length > 0 && !showClearConfirm && (
            <button
              id="btn-open-clear-confirm"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Geçmişi Temizle</span>
            </button>
          )}

          {/* Inline Confirmation without window.confirm (Safe in iframe) */}
          {showClearConfirm && (
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-rose-950/90 border border-rose-500/60 animate-fade-in">
              <span className="text-xs text-rose-200 font-medium px-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Tüm kayıtlar silinsin mi?
              </span>
              <button
                id="btn-confirm-clear-yes"
                onClick={handleConfirmClear}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                Evet, Temizle
              </button>
              <button
                id="btn-confirm-clear-no"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                İptal
              </button>
            </div>
          )}

          <button
            onClick={onStartNewScan}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Yeni Tarama Yap</span>
          </button>
        </div>
      </div>

      {/* History List */}
      {scans.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
          <History className="w-12 h-12 text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">Henüz Kaydedilmiş Tarama Yok</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Kamera ekranından ilk optik biyo-enerji taramanızı başlatın. Sonuçlar burada otomatik olarak arşivlenecektir.
          </p>
          <button
            onClick={onStartNewScan}
            className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
          >
            İlk Taramayı Başlat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scans.map((scan) => (
            <div
              key={scan.id}
              onClick={() => onSelectScan(scan)}
              className="relative p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-emerald-950/20"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(scan.timestamp).toLocaleString('tr-TR')}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {scan.isAfterTreatment && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        Frekans Sonrası
                      </span>
                    )}

                    {/* Dedicated Delete Button for Each Report */}
                    <button
                      id={`delete-scan-${scan.id}`}
                      onClick={(e) => handleDeleteItem(e, scan.id)}
                      title="Bu Raporu Sil"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 border border-transparent transition-all z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  {scan.snapshotUrl ? (
                    <div className="w-12 h-12 rounded-2xl border-2 overflow-hidden shrink-0 shadow-md transition-transform group-hover:scale-105 bg-black flex items-center justify-center" style={{ borderColor: scan.auraHex }}>
                      <img
                        src={scan.snapshotUrl}
                        alt="Snapshot"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105"
                      style={{ borderColor: scan.auraHex, backgroundColor: `${scan.auraHex}22` }}
                    >
                      <Sparkles className="w-5 h-5" style={{ color: scan.auraHex }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                      {scan.dominantAuraColor}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      Duygu: <span className="text-slate-200 font-medium">{scan.emotionalState?.primary || 'Dengeli'}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Frekans</span>
                    <span className="text-xs font-mono font-bold text-emerald-300">{scan.frequencyHz} Hz</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Biyo-Enerji</span>
                    <span className="text-xs font-mono font-bold text-teal-300">%{scan.bioEnergyLevel}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Huzur</span>
                    <span className="text-xs font-mono font-bold text-amber-300">%{scan.emotionalState?.tranquilityLevel || 80}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-emerald-400 font-semibold group-hover:text-emerald-300">
                <span>Detaylı Raporu İncele</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
