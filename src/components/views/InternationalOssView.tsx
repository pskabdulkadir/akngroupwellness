import React, { useState } from 'react';
import { EU_OSS_COUNTRIES, TCMB_RATES } from '../../services/taxEngine';
import { OssDeclarationRecord, Distributor } from '../../types/accounting';
import {
  Globe,
  FileSpreadsheet,
  CheckCircle2,
  Shield,
  Download,
  Percent,
  Search,
} from 'lucide-react';

interface InternationalOssViewProps {
  ossRecords: OssDeclarationRecord[];
  distributors: Distributor[];
}

export const InternationalOssView: React.FC<InternationalOssViewProps> = ({
  ossRecords,
  distributors,
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<'2026-Q4'>('2026-Q4');
  const [viesVatInput, setViesVatInput] = useState('DE284920194');
  const [viesCheckResult, setViesCheckResult] = useState<{
    valid: boolean;
    name: string;
    address: string;
    reverseChargeEligible: boolean;
  } | null>({
    valid: true,
    name: 'Bavaria Cloud Solutions GmbH',
    address: 'Maximilianstraße 35, 80539 München, Germany',
    reverseChargeEligible: true,
  });

  const foreignDistributors = distributors.filter((d) => d.country && d.country !== 'TR');

  const totalOssVatEUR = ossRecords.reduce((sum, r) => sum + r.vatAmountEUR, 0);
  const totalOssVatTRY = ossRecords.reduce((sum, r) => sum + r.vatAmountTRY, 0);
  const totalTaxableEUR = ossRecords.reduce((sum, r) => sum + r.taxableBaseEUR, 0);

  const handleViesVerify = () => {
    if (viesVatInput.startsWith('DE') || viesVatInput.startsWith('FR')) {
      setViesCheckResult({
        valid: true,
        name: 'Enterprise Tech Europe BV',
        address: 'Keizersgracht 421, Amsterdam, Netherlands',
        reverseChargeEligible: true,
      });
    } else {
      setViesCheckResult({
        valid: false,
        name: 'Geçersiz VIES Numarası',
        address: '-',
        reverseChargeEligible: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Uluslararası Dijital Vergi &amp; AB One Stop Shop (OSS)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Avrupa Birliği (AB) B2C dijital hizmet KDV tespiti, B2B Reverse Charge mekanizması ve Çifte Vergilendirmeyi Önleme Anlaşmaları (ÇVÖA)
          </p>
        </div>

        <button
          onClick={() => alert('AB One Stop Shop (OSS) Üç Aylık Beyanname XML/PDF paketi indirildi.')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>AB OSS Beyanname Paketi (XML)</span>
        </button>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            AB B2C Matrah Hasılatı (EUR)
          </span>
          <div className="text-2xl font-bold text-slate-900">
            €{totalTaxableEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] font-sans text-slate-400">
            TCMB Karşılığı: {(totalTaxableEUR * TCMB_RATES.EUR).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            Ödenecek AB OSS KDV Toplamı
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            €{totalOssVatEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] font-sans text-emerald-600 font-semibold">
            {totalOssVatTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY (TCMB: {TCMB_RATES.EUR.toFixed(2)})
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-sans text-slate-500 font-medium">
            ÇVÖA Mukimlik Takibi
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {foreignDistributors.length} Global Bayi
          </div>
          <span className="text-[10px] font-sans text-blue-600 font-medium">
            Almanya &amp; AB İndirimli Stopaj (%10)
          </span>
        </div>
      </div>

      {/* AB OSS Çeyrek Dönem KDV Dağılım Tablosu */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              AB Üyesi Ülkelere Yapılan B2C Dijital Satışlar &amp; Yerel KDV Oranları
            </h3>
            <p className="text-xs text-slate-500">
              Tüketim ülkesi prensibine göre tahsil edilen yerel KDV ve OSS beyanı
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
            Dönem: 2026-Q4
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Tüketici Ülkesi</th>
                <th className="py-3 px-4">İşlem Türü</th>
                <th className="py-3 px-4 text-right">Vergi Matrahı (EUR)</th>
                <th className="py-3 px-4 text-center">Yerel KDV %</th>
                <th className="py-3 px-4 text-right">Hesaplanan KDV (EUR)</th>
                <th className="py-3 px-4 text-right">TRY Karşılığı</th>
                <th className="py-3 px-4 text-center">Vergi Senaryosu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {ossRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                    {r.countryName} ({r.countryCode})
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600">
                    {r.salesType === 'B2C_DIGITAL_SERVICE' ? 'Dijital Lisans / Hizmet' : 'Fiziksel Ürün'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900">
                    €{r.taxableBaseEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900">
                    %{Math.round(r.vatRate * 100)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                    €{r.vatAmountEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {r.vatAmountTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      OSS Beyanına Dahil
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AB B2B VIES KDV Doğrulama ve ÇVÖA Paneli */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VIES Kontrolü */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              AB B2B VIES KDV Numarası Doğrulama (Reverse Charge)
            </h3>
            <p className="text-xs text-slate-500">
              Kurumsal AB müşterisinin KDV numarasını sorgulayarak ters paylaştırma (%0 KDV) uygunluğunu denetleyin
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={viesVatInput}
                onChange={(e) => setViesVatInput(e.target.value)}
                placeholder="Örn: DE284920194, FR94821039"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono text-slate-900"
              />
              <button
                onClick={handleViesVerify}
                className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                VIES Sorgula
              </button>
            </div>

            {viesCheckResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  viesCheckResult.valid
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-red-50/60 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{viesCheckResult.valid ? 'VIES Geçerli (B2B)' : 'Geçersiz KDV No'}</span>
                  <span className="text-[10px] font-mono">
                    {viesCheckResult.reverseChargeEligible
                      ? 'Reverse Charge KDV %0 Uygulanabilir'
                      : 'B2C Yerel KDV Uygulanmalıdır'}
                  </span>
                </div>
                {viesCheckResult.valid && (
                  <div className="space-y-1 text-[11px] pt-1">
                    <p className="font-semibold text-slate-800">{viesCheckResult.name}</p>
                    <p className="text-slate-600">{viesCheckResult.address}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Çifte Vergilendirmeyi Önleme Anlaşmaları (ÇVÖA) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Çifte Vergilendirmeyi Önleme Anlaşmaları (ÇVÖA)
            </h3>
            <p className="text-xs text-slate-500">
              Yabancı bayilere yapılan komisyon ödemelerinde stopaj oranları
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Almanya Mukimi Bayi (Hans Becker)</span>
                <span className="font-mono text-emerald-700">İndirimli Stopaj: %10</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Almanya Vergi Dairesinden onaylı Mukimlik Belgesi (Ansässigkeitsbescheinigung) sistemde kayıtlı olduğundan standart %20 yerine ÇVÖA 12. maddesi gereği %10 uygulanır.
              </p>
            </div>

            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>ABD Mukimi Bayi (Belgesiz)</span>
                <span className="font-mono text-amber-700">Standart Stopaj: %20</span>
              </div>
              <p className="text-[11px] text-slate-600">
                IRS Form 6166 mukimlik belgesi sisteme yüklenmediği sürece GVK 94 genel stopaj oranı (%20) uygulanır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
