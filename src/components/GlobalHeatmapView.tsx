import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Radio, 
  Users, 
  Activity, 
  Sparkles, 
  Heart, 
  Zap, 
  Send, 
  Volume2, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft,
  Flame,
  Search,
  FileText,
  Download
} from 'lucide-react';
import { 
  heatmapService, 
  GlobalHeatmapNode, 
  GlobalStatsData 
} from '../utils/heatmapService';
import { soundEngine } from '../utils/soundEngine';
import { downloadGlobalHeatmapReportWord, downloadGlobalHeatmapReportPDF } from '../utils/moduleReportsExport';
import { PageNavBar } from './PageNavBar';

interface GlobalHeatmapViewProps {
  onGoBack?: () => void;
  onGoHome?: () => void;
  onApplyFrequency?: (freqHz: number, binauralHz: number, name: string) => void;
}

export const GlobalHeatmapView: React.FC<GlobalHeatmapViewProps> = ({
  onGoBack,
  onGoHome,
  onApplyFrequency,
}) => {
  const [nodes, setNodes] = useState<GlobalHeatmapNode[]>([]);
  const [stats, setStats] = useState<GlobalStatsData>(heatmapService.getStats());
  const [selectedNode, setSelectedNode] = useState<GlobalHeatmapNode | null>(null);
  const [intentionInput, setIntentionInput] = useState<string>('Küresel Barış, Birlik & Kalp Şifası');
  const [chosenFreq, setChosenFreq] = useState<number>(528);
  const [hasBroadcasted, setHasBroadcasted] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    const unsub = heatmapService.subscribe((newNodes, newStats) => {
      setNodes(newNodes);
      setStats(newStats);
      if (!selectedNode && newNodes.length > 0) {
        setSelectedNode(newNodes[0]);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  const handleBroadcast = async () => {
    await heatmapService.emitAnonymousPing(chosenFreq, 7.83, intentionInput);
    setHasBroadcasted(true);
    setTimeout(() => setHasBroadcasted(false), 4000);
  };

  const handleJoinResonance = (node: GlobalHeatmapNode) => {
    if (onApplyFrequency) {
      onApplyFrequency(node.frequencyHz, node.binauralHz, `${node.cityName} Rezonansı`);
    } else {
      soundEngine.startAdaptiveBioFrequency(node.frequencyHz, node.binauralHz, 'alpha', 0.5, 'ocean');
    }
  };

  // Convert lat/lng to normalized 0-100% SVG coordinates
  const getMapPosition = (lat: number, lng: number) => {
    // Equirectangular projection mapping
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(10, Math.min(90, y)) };
  };

  const filteredNodes = nodes.filter((n) => 
    n.cityName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    n.country.toLowerCase().includes(searchFilter.toLowerCase()) ||
    n.intention.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      
      {/* Universal Page Navigation Bar with Back & Home */}
      <PageNavBar
        title="Anonim Küresel Huzur & Frekans Isı Haritası"
        subtitle="Dünya Genelinde Canlı Kolektif Rezonans & Niyet Yayını"
        icon={<Globe className="w-4 h-4 text-cyan-400" />}
        badge={`${stats.totalActivePings} Aktif Rezonatör`}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
      />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950 border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-teal-500/20 to-emerald-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                Anonim Küresel Huzur & Frekans Isı Haritası
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Canlı Rezonans
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dünya Genelinde Canlı Frekans Seansları, Toplu Niyet Ağı & Biyo-Rezonans Koheransı
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              downloadGlobalHeatmapReportPDF({
                totalActiveMeditators: stats.totalActiveMeditators,
                highestResonanceCity: stats.highestResonanceCity,
                dominantIntention: stats.dominantIntention,
                globalCoherenceScore: stats.globalCoherenceScore,
                totalCountries: 32,
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all active:scale-95 shadow cursor-pointer"
            title="Küresel Huzur Raporu (PDF) İndir"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>PDF Rapor</span>
          </button>

          <button
            onClick={() => {
              downloadGlobalHeatmapReportWord({
                totalActiveMeditators: stats.totalActiveMeditators,
                highestResonanceCity: stats.highestResonanceCity,
                dominantIntention: stats.dominantIntention,
                globalCoherenceScore: stats.globalCoherenceScore,
                totalCountries: 32,
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all active:scale-95 shadow cursor-pointer"
            title="Küresel Huzur Raporu (Word .doc) İndir"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Word Rapor</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold">{stats.totalActiveMeditators} Canlı Meditatör</span>
          </div>
        </div>
      </div>

      {/* 4 Global Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Aktif Seanslar</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalActiveMeditators}</div>
          <div className="text-[10px] text-slate-400">32 Ülkede anlık dinleme</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Küresel Koherans</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-300">%{stats.globalCoherencePercent}</div>
          <div className="text-[10px] text-slate-400">Harmonik rezonans uyumu</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Günün Lider Frekansı</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">{stats.topFrequencyToday} Hz</div>
          <div className="text-[10px] text-slate-400">528 Hz DNA & Kalp Mucizesi</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Bugünkü Niyetler</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300">{stats.totalPingsToday}</div>
          <div className="text-[10px] text-slate-400">Pozitif enerji dalgası</div>
        </div>

      </div>

      {/* Main Map & Interactive Nodes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: World Heatmap Map Canvas View */}
        <div className="lg:col-span-8 p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col space-y-4">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Canlı Küresel Biyo-Rezonans Haritası</span>
            </span>
            <span className="text-[11px] text-slate-400">Noktalara tıklayarak rezonansa katılın</span>
          </div>

          {/* Interactive World Map Canvas */}
          <div className="relative w-full aspect-[2/1] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            
            {/* World Grid Lines Background */}
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Equator & Prime Meridian */}
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
            </svg>

            {/* Glowing Resonance Nodes */}
            {nodes.map((node) => {
              const pos = getMapPosition(node.latitude ?? 0, node.longitude ?? 0);
              const isSelected = selectedNode?.id === node.id;

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-10"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                      node.frequencyHz === 528 ? 'bg-emerald-400' :
                      node.frequencyHz === 432 ? 'bg-amber-400' :
                      node.frequencyHz === 963 ? 'bg-purple-400' : 'bg-cyan-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 border border-white shadow-lg ${
                      node.frequencyHz === 528 ? 'bg-emerald-500' :
                      node.frequencyHz === 432 ? 'bg-amber-500' :
                      node.frequencyHz === 963 ? 'bg-purple-500' : 'bg-cyan-500'
                    }`}></span>
                  </span>

                  {/* Tooltip on hover */}
                  <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-slate-900/95 border border-slate-700 text-[10px] font-bold text-white whitespace-nowrap shadow-xl pointer-events-none transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    {node.cityName} • {node.frequencyHz} Hz
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Node Quick Action Bar */}
          {selectedNode && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{selectedNode.cityName}, {selectedNode.country}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedNode.frequencyHz} Hz
                  </span>
                  <span className="text-xs text-slate-400">({selectedNode.meditatorCount} kişi)</span>
                </div>
                <div className="text-xs text-indigo-300 italic">
                  "{selectedNode.intention}"
                </div>
              </div>

              <button
                onClick={() => handleJoinResonance(selectedNode)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all shrink-0"
              >
                <Volume2 className="w-4 h-4" />
                <span>Bu Şehrin Rezonansına Katıl</span>
              </button>
            </div>
          )}

        </div>

        {/* Right 4 Cols: Broadcast Your Intention & Live Feed */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Broadcast Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/40 space-y-3 shadow-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Ortak Barış Çemberine Niyet Gönder</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Anonim niyetinizi ve seçtiğiniz şifa frekansını küresel ağa ekleyin. Tüm dünyadaki meditasyon yapanlarla rezonansa girin.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={intentionInput}
                onChange={(e) => setIntentionInput(e.target.value)}
                placeholder="Niyetinizi yazın (ör: Kalp Şifası, Barış...)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <div className="flex items-center gap-2">
                <select
                  value={chosenFreq}
                  onChange={(e) => setChosenFreq(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                >
                  <option value={432}>432 Hz - Evrensel Barış</option>
                  <option value={528}>528 Hz - Kalp Şifası & DNA</option>
                  <option value={639}>639 Hz - Sevgi & İletişim</option>
                  <option value={741}>741 Hz - Sezgi & Berraklık</option>
                  <option value={963}>963 Hz - Taç Çakra & Nur</option>
                </select>

                <button
                  onClick={handleBroadcast}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all shrink-0"
                >
                  {hasBroadcasted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Send className="w-4 h-4" />}
                  <span>{hasBroadcasted ? 'Yayımlandı!' : 'Yayınla'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Node Feed List */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Canlı Rezonans Akışı
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{nodes.length} Nokta</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Şehir veya niyet ara..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-none">
              {filteredNodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedNode?.id === node.id
                      ? 'bg-indigo-950/40 border-indigo-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{node.cityName}</span>
                    <span className="text-[10px] font-bold text-emerald-400">{node.frequencyHz} Hz</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {node.intention}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
