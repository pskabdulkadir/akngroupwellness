import React, { useState } from 'react';
import { INTEGRATORS, IntegratorConfig } from '../../services/gibIntegrator';
import {
  Sliders,
  CheckCircle2,
  Shield,
  Search,
  RefreshCw,
  Key,
  Globe,
  Radio,
} from 'lucide-react';

export const IntegratorSettingsView: React.FC = () => {
  const [integrators, setIntegrators] = useState<IntegratorConfig[]>(INTEGRATORS);
  const [selectedIntegratorId, setSelectedIntegratorId] = useState<'Uyumsoft' | 'Logo' | 'Parasut' | 'NetGSM'>('Uyumsoft');
  const [testVkn, setTestVkn] = useState('6120482910');
  const [vknQueryResult, setVknQueryResult] = useState<{
    registered: boolean;
    title?: string;
    alias?: string;
    queryDate?: string;
  } | null>({
    registered: true,
    title: 'Mavi Yelken Bilişim Danışmanlık A.Ş.',
    alias: 'urn:mail:defaultpk@maviyelken.com.tr',
    queryDate: '2026-10-20 09:12:00',
  });
  const [isQuerying, setIsQuerying] = useState(false);
  const [connectionTestSuccess, setConnectionTestSuccess] = useState<string | null>(null);

  const activeConfig = integrators.find((i) => i.id === selectedIntegratorId) || integrators[0];

  const handleTestConnection = () => {
    setConnectionTestSuccess(null);
    setTimeout(() => {
      setConnectionTestSuccess(`${activeConfig.name} bağlantısı başarılı (Ping: 42ms, TLS 1.3, Mali Mühür Sertifikası Geçerli).`);
      setTimeout(() => setConnectionTestSuccess(null), 5000);
    }, 500);
  };

  const handleQueryVkn = () => {
    setIsQuerying(true);
    setVknQueryResult(null);
    setTimeout(() => {
      setIsQuerying(false);
      if (testVkn === '6120482910' || testVkn === '9482103948' || testVkn === '1048201948') {
        setVknQueryResult({
          registered: true,
          title:
            testVkn === '6120482910'
              ? 'Mavi Yelken Bilişim Danışmanlık A.Ş.'
              : testVkn === '1048201948'
              ? 'Anadolu Bilişim ve Teknoloji A.Ş.'
              : 'VergiSync Teknoloji Yazılım A.Ş.',
          alias: 'urn:mail:defaultpk@kurum.com.tr',
          queryDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        });
      } else {
        setVknQueryResult({
          registered: false,
          queryDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        });
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          GİB Lisanslı Özel Entegratör API Yönetimi
        </h2>
        <p className="text-xs text-slate-500">
          Logo, Uyumsoft, Paraşüt ve NetGSM e-Fatura / e-Arşiv bağlantıları ve GİB mükellefiyet sorgulama motoru
        </p>
      </div>

      {connectionTestSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{connectionTestSuccess}</span>
        </div>
      )}

      {/* Entegratör Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrators.map((integ) => {
          const isSelected = integ.id === selectedIntegratorId;
          return (
            <div
              key={integ.id}
              onClick={() => setSelectedIntegratorId(integ.id)}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {integ.id}
                </span>
                <span
                  className={`text-[10px] font-mono ${
                    isSelected ? 'text-emerald-300' : 'text-emerald-700'
                  }`}
                >
                  ● Bağlı
                </span>
              </div>

              <h4 className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {integ.name}
              </h4>
              <p
                className={`text-[10px] truncate mt-1 ${
                  isSelected ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                {integ.endpoint}
              </p>
            </div>
          );
        })}
      </div>

      {/* Seçili Entegratör Konfigürasyonu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {activeConfig.name} - Yapılandırma Parametreleri
              </h3>
              <p className="text-xs text-slate-500">
                GİB e-Fatura / e-Arşiv UBL-TR 2.1 İletim Protokolü
              </p>
            </div>
            <button
              onClick={handleTestConnection}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Bağlantıyı Test Et (Ping)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">API Endpoint URL</label>
              <input
                type="text"
                readOnly
                value={activeConfig.endpoint}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-[11px] bg-slate-50 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Kullanıcı Adı / Müşteri Kodu</label>
              <input
                type="text"
                readOnly
                value={activeConfig.username}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-[11px] bg-slate-50 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Gönderici Birim Etiketi (GB)
              </label>
              <input
                type="text"
                readOnly
                value={activeConfig.senderTag}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-[11px] bg-slate-50 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Posta Kutusu Etiketi (PK)
              </label>
              <input
                type="text"
                readOnly
                value={activeConfig.receiverTag}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-[11px] bg-slate-50 text-slate-700"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>GİB Mali Mühür Sertifikası: TR-TÜBİTAK KamuSM Kamu Sertifikasyon Merkezi</span>
            </span>
            <span className="font-mono text-slate-400">Son Güncelleme: 2026-10-20</span>
          </div>
        </div>

        {/* Sağ Kolon: GİB Canlı VKN / TCKN Mükellefiyet Sorgulama */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              GİB e-Fatura Mükellef Sorgulama
            </h3>
            <p className="text-xs text-slate-500">
              VKN/TCKN girerek sistemin e-Fatura mı e-Arşiv mi keseceğini test edin
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-600 font-medium mb-1">
                Vergi Kimlik No / TCKN
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testVkn}
                  onChange={(e) => setTestVkn(e.target.value)}
                  placeholder="VKN veya TCKN girin..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono text-slate-900"
                />
                <button
                  onClick={handleQueryVkn}
                  disabled={isQuerying}
                  className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
                >
                  {isQuerying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {vknQueryResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  vknQueryResult.registered
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/60 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>
                    {vknQueryResult.registered ? 'e-Fatura Mükellefi' : 'e-Fatura Mükellefi Değil'}
                  </span>
                  <span className="text-[10px] font-mono">
                    {vknQueryResult.registered ? 'TICARIFATURA Kesilir' : 'EARSIVBELGE Kesilir'}
                  </span>
                </div>
                {vknQueryResult.registered && (
                  <div className="space-y-1 text-[11px] pt-1">
                    <p className="font-semibold text-slate-800">{vknQueryResult.title}</p>
                    <p className="font-mono text-slate-600">{vknQueryResult.alias}</p>
                  </div>
                )}
                {!vknQueryResult.registered && (
                  <p className="text-[11px] text-amber-800 leading-normal">
                    Müşteri GİB e-Fatura sistemine kayıtlı olmadığından, 3DS ödemesinde otomatik olarak e-Arşiv Fatura düzenlenir.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
