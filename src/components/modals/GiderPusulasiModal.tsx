import React from 'react';
import { CommissionPayout, CompanyProfile, COMPANY_PROFILE } from '../../types/accounting';
import { X, Printer, ShieldCheck, FileText } from 'lucide-react';

interface GiderPusulasiModalProps {
  commission: CommissionPayout | null;
  onClose: () => void;
  companyProfile?: CompanyProfile;
}

export const GiderPusulasiModal: React.FC<GiderPusulasiModalProps> = ({ commission, onClose, companyProfile }) => {
  if (!commission) return null;

  const profile = companyProfile || COMPANY_PROFILE;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-100 rounded-md text-amber-800">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                {commission.documentNumber} · GİDER PUSULASI
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                İlişkili Fatura: {commission.invoiceNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/v1/accounting/vouchers/${commission.documentNumber}/xml`}
              target="_blank"
              rel="noopener noreferrer"
              download={`${commission.documentNumber}.xml`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              GİB XML İndir
            </a>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Yazdır / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Resmi 213 Sayılı VUK Madde 234 Uyarınca Gider Pusulası */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-100/50">
          <div className="bg-white border-2 border-slate-400 p-8 max-w-2xl mx-auto rounded-sm print:border-none print:p-0 text-slate-900 text-xs">
            {/* Üst Başlık */}
            <div className="text-center border-b-2 border-slate-800 pb-3 mb-6">
              <h2 className="text-lg font-bold tracking-widest uppercase text-slate-900">
                G İ D E R   P U S U L A S I
              </h2>
              <p className="text-[10px] text-slate-600 mt-1">
                213 Sayılı Vergi Usul Kanunu Madde 234 ve 193 Sayılı Gelir Vergisi Kanunu Madde 94 Uyarınca Tanzim Edilmiştir
              </p>
            </div>

            {/* Belge ve Şirket Bilgileri */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-slate-300 p-3 bg-slate-50/50 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 pb-1">
                  DÜZENLEYEN KURUM (İŞVEREN)
                </p>
                <p className="font-bold text-slate-900">{profile.legalName}</p>
                <p className="text-slate-600 text-[11px]">{profile.address}</p>
                <p className="text-slate-600 text-[11px]">
                  <span className="font-semibold text-slate-800">VKN:</span> {profile.vkn} · {profile.taxOffice}
                </p>
              </div>

              <div className="border border-slate-300 p-3 bg-slate-50/50 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 pb-1">
                  BELGE DETAYLARI
                </p>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pusula No:</span>
                  <span className="font-mono font-bold">{commission.documentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tarih:</span>
                  <span className="font-mono">{commission.payoutDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ödeme Şekli:</span>
                  <span className="font-mono">Banka EFT / Havale</span>
                </div>
              </div>
            </div>

            {/* Bayi (Hak Sahibi) Bilgileri */}
            <div className="border border-slate-300 p-3 bg-slate-50/50 mb-6 space-y-1.5">
              <p className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 pb-1">
                HİZMETİ VEREN / HAK SAHİBİ (BİREYSEL BAYİ)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 text-[10px]">Adı Soyadı / Unvanı:</span>
                  <p className="font-bold text-slate-900">{commission.distributorName}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">T.C. Kimlik No:</span>
                  <p className="font-mono font-bold text-slate-800">
                    {/* Masked TCKN */}
                    {commission.distributorId === 'dist-01' ? '28491029481' : '48192049182'}
                  </p>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 text-[10px]">IBAN / Hesap No:</span>
                <p className="font-mono text-slate-700">TR33 0006 2000 0000 0123 4567 89 (Garanti BBVA)</p>
              </div>
            </div>

            {/* Hakediş ve Vergi Kesintisi Tablosu */}
            <div className="border border-slate-300 overflow-hidden mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-[11px] font-semibold border-b border-slate-300">
                    <th className="py-2 px-3">Görülen Hizmetin / Komisyonun Niteliği</th>
                    <th className="py-2 px-3 text-right">Referans Satış Matrahı</th>
                    <th className="py-2 px-3 text-right">Komisyon Oranı</th>
                    <th className="py-2 px-3 text-right">Brüt Komisyon Hakedişi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  <tr>
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-900">
                        Monoline Ağ Pazarlaması Lisans Satış Aracılık Primi (Tier {commission.tierLevel})
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Fatura Referansı: {commission.invoiceNumber}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {commission.baseAmountTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      %{(commission.commissionRate * 100).toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {commission.grossCommissionTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Vergi Dökümü (Stopaj & Net) */}
            <div className="flex justify-end mb-8">
              <div className="w-72 border border-slate-300 bg-slate-50/50 p-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Brüt Hakediş Tutarı:</span>
                  <span className="font-mono font-medium">
                    {commission.grossCommissionTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
                <div className="flex justify-between text-red-700 font-medium">
                  <span>Gelir Vergisi Stopajı (%20):</span>
                  <span className="font-mono">
                    -{commission.withholdingAmountTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
                {commission.stampTaxAmountTRY ? (
                  <div className="flex justify-between text-red-700 text-[11px]">
                    <span>Damga Vergisi (‰9.48):</span>
                    <span className="font-mono">
                      -{commission.stampTaxAmountTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                ) : null}
                <div className="border-t-2 border-slate-400 pt-2 flex justify-between text-slate-900 font-bold text-sm">
                  <span>Net Ödenecek Tutar:</span>
                  <span className="font-mono text-emerald-700">
                    {commission.netPayableTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
              </div>
            </div>

            {/* İmza Blokları */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300">
              <div className="text-center space-y-8">
                <p className="font-semibold text-slate-800">DÜZENLEYEN (İŞVEREN)</p>
                <div className="h-12 flex items-center justify-center">
                  <div className="border border-dashed border-slate-300 w-36 h-12 flex items-center justify-center text-[10px] text-slate-400">
                    Şirket Kaşesi &amp; İmza
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">VERGİSYNC TEKNOLOJİ YAZILIM A.Ş.</p>
              </div>

              <div className="text-center space-y-8">
                <p className="font-semibold text-slate-800">TESLİM EDEN (HAK SAHİBİ BAYİ)</p>
                <div className="h-12 flex items-center justify-center">
                  <div className="border border-dashed border-slate-300 w-36 h-12 flex items-center justify-center text-[10px] text-slate-400">
                    Elektronik 2FA Onaylı İmza
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">{commission.distributorName}</p>
              </div>
            </div>

            <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400">
              Bu gider pusulası Gelir İdaresi Başkanlığı e-Belge ve Muhtasar Beyanname tevkifat standartlarına uygun olarak elektronik ortamda oluşturulmuştur.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Stopaj Oranı: %20</span>
            <span>·</span>
            <span>Muhtasar Kodu: 012 / GVK 94</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
