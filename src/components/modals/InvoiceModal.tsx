import React, { useState } from 'react';
import { Invoice, CompanyProfile, COMPANY_PROFILE } from '../../types/accounting';
import { generateUblTrXml } from '../../services/gibIntegrator';
import { X, Printer, Download, Code, CheckCircle2, ShieldCheck, Mail, Send } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  companyProfile?: CompanyProfile;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose, companyProfile }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'xml'>('visual');
  const [emailSent, setEmailSent] = useState(false);

  if (!invoice) return null;

  const profile = companyProfile || COMPANY_PROFILE;
  const isGlobal = invoice.scenario === 'IHRACAT';
  const xmlContent = generateUblTrXml(invoice, profile);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${invoice.invoiceNumber}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900 font-mono">
              {invoice.invoiceNumber}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ETTN: {invoice.ettn}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {invoice.scenario}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'visual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Görsel Fatura
              </button>
              <button
                onClick={() => setActiveTab('xml')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'xml' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                UBL-TR XML
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
              title="Yazdır / PDF Kaydet"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadXml}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
              title="XML İndir"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleSendEmail}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
              title="Müşteriye Yeniden E-Posta Gönder"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {emailSent && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2 text-xs font-medium text-emerald-800 flex items-center gap-2 no-print">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Fatura PDF ve XML dosyası müşterinin {invoice.customer.email} adresine başarıyla iletildi.
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-100/50">
          {activeTab === 'xml' ? (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto select-all leading-relaxed">
              <pre>{xmlContent}</pre>
            </div>
          ) : (
            /* Yasal Resmi GİB e-Fatura / e-Arşiv Görünümü */
            <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-8 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0 text-slate-900 font-sans text-xs leading-normal">
              {/* Top Banner & Crest */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider">
                        AKN
                      </div>
                      <div>
                        <h1 className="text-base font-bold text-slate-900 tracking-tight">
                          {profile.legalName}
                        </h1>
                        <p className="text-[11px] text-slate-600">
                          {profile.address}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 text-[11px] text-slate-600 space-y-0.5">
                      <p>
                        <span className="font-semibold text-slate-800">VKN:</span> {profile.vkn} ·{' '}
                        <span className="font-semibold text-slate-800">Vergi Dairesi:</span> {profile.taxOffice}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">Ticaret Sicil No:</span> {profile.tradeRegistryNumber} ·{' '}
                        <span className="font-semibold text-slate-800">Mersis:</span> {profile.mersisNumber}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">İletişim:</span> {profile.email} · {profile.website}
                      </p>
                    </div>
                  </div>

                  {/* Fatura Başlığı ve Karekod */}
                  <div className="text-right flex flex-col items-end">
                    <div className="border border-slate-400 px-3 py-1 bg-slate-50 text-center mb-2">
                      <span className="font-bold text-sm tracking-wider uppercase">
                        {invoice.scenario === 'IHRACAT'
                          ? 'e-ARŞİV FATURA (HİZMET İHRACI)'
                          : invoice.customer.isCorporate && invoice.customer.isGibRegistered
                          ? 'e-FATURA'
                          : 'e-ARŞİV FATURA'}
                      </span>
                    </div>
                    {/* Simulated GİB QR Code */}
                    <div className="w-16 h-16 border border-slate-300 p-1 bg-white flex flex-col items-center justify-center text-[8px] text-slate-500 font-mono mb-1">
                      <div className="grid grid-cols-4 gap-0.5 w-full h-full p-0.5 bg-slate-900/10">
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-slate-400 rounded-xs"></div>
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-slate-600 rounded-xs"></div>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">GİB Karekod</span>
                  </div>
                </div>
              </div>

              {/* Fatura Meta Bilgileri ve Alıcı */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Sol: Alıcı Bilgileri */}
                <div className="border border-slate-200 p-3 rounded-xs bg-slate-50/50 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 pb-1 mb-1">
                    SAYIN (ALICI)
                  </div>
                  <p className="font-bold text-slate-900">{invoice.customer.name}</p>
                  <p className="text-slate-700">{invoice.customer.address}</p>
                  <p className="text-slate-700">
                    {invoice.customer.city} / {invoice.customer.country}
                  </p>
                  <div className="pt-1 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {invoice.customer.isCorporate ? 'VKN:' : 'TCKN:'}
                    </span>{' '}
                    <span className="font-mono">{invoice.customer.taxNumber}</span>
                    {invoice.customer.taxOffice && (
                      <span className="ml-2 font-mono">· {invoice.customer.taxOffice}</span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px]">E-Posta: {invoice.customer.email}</p>
                </div>

                {/* Sağ: Belge Bilgileri */}
                <div className="border border-slate-200 p-3 rounded-xs bg-slate-50/50 space-y-1 text-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 pb-1 mb-1">
                    BELGE BİLGİLERİ
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Fatura No:</span>
                    <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Düzenleme Tarihi:</span>
                    <span className="font-mono">{invoice.issueDate} {invoice.issueTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Fatura Tipi:</span>
                    <span className="font-mono">{invoice.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Senaryo:</span>
                    <span className="font-mono">{invoice.scenario}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Para Birimi:</span>
                    <span className="font-mono font-semibold">{invoice.currency}</span>
                  </div>
                  {isGlobal && (
                    <div className="flex justify-between text-amber-900">
                      <span className="font-semibold">TCMB Kuru (USD Alış):</span>
                      <span className="font-mono font-bold">{invoice.exchangeRateTCMB.toFixed(4)} TRY</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">ETTN (UUID):</span>
                    <span className="font-mono text-[10px] text-slate-600">{invoice.ettn}</span>
                  </div>
                </div>
              </div>

              {/* Kalemler Tablosu */}
              <div className="border border-slate-200 rounded-xs overflow-hidden mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[11px] font-semibold border-b border-slate-200">
                      <th className="py-2 px-3">Sıra</th>
                      <th className="py-2 px-3">Mal / Hizmet Açıklaması</th>
                      <th className="py-2 px-3 text-right">Miktar</th>
                      <th className="py-2 px-3 text-right">Birim Fiyat</th>
                      <th className="py-2 px-3 text-right">KDV %</th>
                      <th className="py-2 px-3 text-right">KDV Tutarı</th>
                      <th className="py-2 px-3 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-slate-900">{item.description}</p>
                          {item.vatExemptionCode && (
                            <p className="text-[10px] text-amber-700 mt-0.5">
                              İstisna Kodu: {item.vatExemptionCode} - {item.vatExemptionReason}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{item.quantity} Adet</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                          {invoice.currency}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          %{Math.round(item.vatRate * 100)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {item.vatAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                          {invoice.currency}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                          {invoice.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Alt Toplamlar ve Notlar */}
              <div className="grid grid-cols-2 gap-6 items-start mb-6">
                {/* Notlar & Mevzuat Beyanı */}
                <div className="border border-slate-200 p-3 rounded-xs bg-slate-50/60 space-y-1.5 text-[10px] text-slate-600">
                  <p className="font-bold text-slate-800">YASAL NOTLAR & AÇIKLAMALAR:</p>
                  {invoice.notes.map((note, i) => (
                    <p key={i} className="leading-relaxed">
                      · {note}
                    </p>
                  ))}
                  <p className="text-slate-500 pt-1">
                    Özel Entegratör: <span className="font-semibold text-slate-700">{invoice.integrator} API</span> · Durum:{' '}
                    <span className="font-semibold text-emerald-700">{invoice.gibStatus.description}</span>
                  </p>
                </div>

                {/* Toplam Matrah ve KDV Özeti */}
                <div className="border border-slate-200 rounded-xs p-3 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Mal / Hizmet Toplam Tutarı (Matrah):</span>
                    <span className="font-mono font-medium">
                      {invoice.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                      {invoice.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Hesaplanan KDV (%{isGlobal ? '0' : '20'}):</span>
                    <span className="font-mono font-medium">
                      {invoice.vatTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                      {invoice.currency}
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between text-slate-900 font-bold text-sm">
                    <span>Ödenecek Genel Toplam:</span>
                    <span className="font-mono text-emerald-700">
                      {invoice.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                      {invoice.currency}
                    </span>
                  </div>
                  {isGlobal && (
                    <div className="bg-amber-50 border border-amber-200 p-2 rounded-xs text-[11px] text-amber-900 flex justify-between font-mono">
                      <span>Resmi Muhasebe Karşılığı (TRY):</span>
                      <span className="font-bold">
                        {invoice.grandTotalTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Alt İmza & Mali Mühür Doğrulama Alanı */}
              <div className="border-t border-slate-300 pt-4 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    Bu fatura 5070 sayılı Elektronik İmza Kanunu kapsamında e-İmza / Mali Mühür ile imzalanmıştır.
                  </span>
                </div>
                <div className="text-right font-mono">
                  Zaman Damgası: {invoice.gibStatus.signedAt || invoice.issueDate}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Entegratör: {invoice.integrator}</span>
            <span>·</span>
            <span>GİB Kod: {invoice.gibStatus.code}</span>
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
