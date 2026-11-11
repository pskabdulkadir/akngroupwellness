import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Printer, 
  Send, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  Building2, 
  FileText, 
  ShieldCheck, 
  QrCode, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Calendar,
  ExternalLink,
  Edit2,
  Save,
  Share2,
  AlertCircle,
  Loader2,
  Trash2,
  FileDown
} from 'lucide-react';
import { 
  DigitalInvoice, 
  generateInvoiceWhatsAppShareUrl, 
  saveDigitalInvoice,
  deleteDigitalInvoice,
  numberToTurkishWords
} from '../utils/invoiceManager';
import { 
  downloadInvoicePDF, 
  shareInvoiceViaWhatsAppWithPDF 
} from '../utils/invoicePdfExporter';

interface DigitalInvoiceModalProps {
  isOpen?: boolean;
  invoice: DigitalInvoice;
  onClose: () => void;
  isAdmin?: boolean;
  onInvoiceUpdated?: (updated: DigitalInvoice) => void;
  onInvoiceDeleted?: (invoiceId: string) => void;
}

export const DigitalInvoiceModal: React.FC<DigitalInvoiceModalProps> = ({
  isOpen = true,
  invoice: initialInvoice,
  onClose,
  isAdmin = false,
  onInvoiceUpdated,
  onInvoiceDeleted,
}) => {
  if (isOpen === false) return null;

  const [invoice, setInvoice] = useState<DigitalInvoice>(initialInvoice);
  const [copiedEttn, setCopiedEttn] = useState(false);
  const [copiedInvoiceNo, setCopiedInvoiceNo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Edit fields
  const [editCompanyName, setEditCompanyName] = useState(invoice.recipient.companyName);
  const [editTaxNumber, setEditTaxNumber] = useState(invoice.recipient.taxNumber);
  const [editTaxOffice, setEditTaxOffice] = useState(invoice.recipient.taxOffice);
  const [editAddress, setEditAddress] = useState(invoice.recipient.address);
  const [editPhone, setEditPhone] = useState(invoice.recipient.phone);
  const [editEmail, setEditEmail] = useState(invoice.recipient.email);
  const [editStatus, setEditStatus] = useState(invoice.status);
  const [editNotes, setEditNotes] = useState(invoice.notes);
  const [editItemDesc, setEditItemDesc] = useState(invoice.items?.[0]?.description || 'AuraBio Yetkili Bayi Lisansı ve Frekans Kredisi');
  const [editItemPrice, setEditItemPrice] = useState(invoice.items?.[0]?.unitPrice || invoice.subtotal);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Generate real QR code for https://akngroupfrekans.web.app/
  useEffect(() => {
    QRCode.toDataURL('https://akngroupfrekans.web.app/', {
      width: 140,
      margin: 1,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    })
    .then(url => setQrCodeDataUrl(url))
    .catch(err => console.error('QR code generation error:', err));
  }, []);

  const handleCopyEttn = () => {
    navigator.clipboard.writeText(invoice.ettn);
    setCopiedEttn(true);
    setTimeout(() => setCopiedEttn(false), 2500);
  };

  const handleCopyInvoiceNo = () => {
    navigator.clipboard.writeText(invoice.invoiceNumber);
    setCopiedInvoiceNo(true);
    setTimeout(() => setCopiedInvoiceNo(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Direct High-Resolution PDF Download
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadInvoicePDF(invoice);
      setStatusMsg('Fatura PDF formatında başarıyla cihazınıza indirildi.');
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (e) {
      console.error('PDF download error:', e);
      setStatusMsg('Fatura PDF oluşturulurken bir sorun oluştu.');
      setTimeout(() => setStatusMsg(null), 3500);
    } finally {
      setPdfLoading(false);
    }
  };

  // WhatsApp Sending with PDF generation and download
  const handleSendWhatsApp = async () => {
    setWhatsAppLoading(true);
    try {
      const res = await shareInvoiceViaWhatsAppWithPDF(invoice, invoice.recipient.phone);
      const updated: DigitalInvoice = {
        ...invoice,
        status: 'sent_whatsapp',
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setInvoice(updated);
      if (onInvoiceUpdated) onInvoiceUpdated(updated);
      setStatusMsg('Fatura PDF formatında oluşturuldu, indirildi ve WhatsApp paylaşımına aktarıldı.');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (e) {
      console.error('WhatsApp send error:', e);
      const shareUrl = generateInvoiceWhatsAppShareUrl(invoice);
      window.open(shareUrl, '_blank');
    } finally {
      setWhatsAppLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaveLoading(true);
    try {
      const sub = Number(editItemPrice) || invoice.subtotal;
      const kdv = Math.round(sub * 0.20 * 100) / 100;
      const grand = sub + kdv;

      const updated: DigitalInvoice = {
        ...invoice,
        subtotal: sub,
        kdvTotal: kdv,
        grandTotal: grand,
        grandTotalInWords: numberToTurkishWords(grand),
        recipient: {
          ...invoice.recipient,
          companyName: editCompanyName.trim() || invoice.recipient.companyName,
          taxNumber: editTaxNumber.trim() || invoice.recipient.taxNumber,
          taxOffice: editTaxOffice.trim() || invoice.recipient.taxOffice,
          address: editAddress.trim() || invoice.recipient.address,
          phone: editPhone.trim() || invoice.recipient.phone,
          email: editEmail.trim() || invoice.recipient.email,
        },
        items: [
          {
            id: 'item-1',
            description: editItemDesc.trim() || 'AuraBio Yetkili Bayi Lisansı',
            quantity: 1,
            unit: 'Adet',
            unitPrice: sub,
            kdvRate: 20,
            kdvAmount: kdv,
            totalAmount: grand
          }
        ],
        status: editStatus,
        notes: editNotes.trim(),
        updatedAt: new Date().toISOString(),
      };

      await saveDigitalInvoice(updated);
      setInvoice(updated);
      setIsEditing(false);
      if (onInvoiceUpdated) onInvoiceUpdated(updated);
      setStatusMsg('Fatura bilgileri başarıyla güncellendi.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (e) {
      alert('Fatura güncellenirken hata oluştu.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteDigitalInvoice(invoice.id);
      if (onInvoiceDeleted) onInvoiceDeleted(invoice.id);
      onClose();
    } catch (e) {
      alert('Fatura silinirken bir hata meydana geldi.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="print:hidden p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-slate-100">
                  Resmi Dijital E-Arşiv Fatura
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  {invoice.invoiceNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  invoice.status === 'sent_whatsapp'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                    : invoice.status === 'paid'
                    ? 'bg-blue-950 text-blue-300 border border-blue-500/50'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {invoice.status === 'sent_whatsapp' ? 'WhatsApp Gönderildi' : invoice.status === 'paid' ? 'Ödendi' : 'Düzenlendi'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                GİB 509 VUK Uyumlu Elektronik Mali Mühürlü Dijital Fatura
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isEditing 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Fatura Detaylarını Düzenle"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Kapat' : 'Düzenle'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Faturayı Kalıcı Olarak Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Faturayı Sil</span>
                </button>
              </>
            )}

            {/* Direct PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950 transition-all cursor-pointer"
              title="Faturayı PDF Formatında İndir"
            >
              {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              <span>{pdfLoading ? 'PDF İndiriliyor...' : 'PDF İndir'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={whatsAppLoading}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer"
              title="Bayinin WhatsApp Numarasına Fatura Detaylarını ve PDF'ini Gönder"
            >
              {whatsAppLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{whatsAppLoading ? 'Gönderiliyor...' : 'WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Yazdır"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Yazdır</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status notification banner */}
        {statusMsg && (
          <div className="p-3 bg-emerald-950/90 border-b border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between px-6 shrink-0">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {statusMsg}
            </span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Admin Inline Edit Panel */}
        {isEditing && isAdmin && (
          <div className="p-4 bg-slate-950 border-b border-amber-500/40 space-y-3 shrink-0 text-xs">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Edit2 className="w-4 h-4" />
              <span>Fatura, Tutar ve Bayi Bilgilerini Düzenle</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Bayi / Firma Unvanı:</label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={e => setEditCompanyName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Vergi No / TCKN:</label>
                <input
                  type="text"
                  value={editTaxNumber}
                  onChange={e => setEditTaxNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Vergi Dairesi:</label>
                <input
                  type="text"
                  value={editTaxOffice}
                  onChange={e => setEditTaxOffice(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Hizmet / Kalem Açıklaması:</label>
                <input
                  type="text"
                  value={editItemDesc}
                  onChange={e => setEditItemDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Net Tutar (KDV Hariç ₺):</label>
                <input
                  type="number"
                  value={editItemPrice}
                  onChange={e => setEditItemPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Fatura Durumu:</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                >
                  <option value="issued">Düzenlendi (issued)</option>
                  <option value="sent_whatsapp">WhatsApp Gönderildi (sent_whatsapp)</option>
                  <option value="paid">Ödendi / Tamamlandı (paid)</option>
                  <option value="cancelled">İptal Edildi (cancelled)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Telefon / WhatsApp:</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">E-Posta:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Alıcı Adresi:</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saveLoading}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center">
          
          {/* A4 Paper Canvas */}
          <div 
            ref={printAreaRef}
            className="w-full max-w-3xl bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl font-sans text-xs space-y-6 print:m-0 print:p-6 print:shadow-none print:w-full print:max-w-none print:rounded-none"
          >
            {/* Header: Logo, GIB Badge & Invoice Details */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b-2 border-slate-900 pb-5">
              {/* Left Brand */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-700 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-sm tracking-tighter">
                    AKN
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                      {invoice.issuer.companyName || 'AKN GLOBAL GROUP LTD'}
                    </h1>
                    <p className="text-[10px] text-slate-600 font-semibold tracking-wide">
                      {invoice.issuer.title || 'AuraBio Frekans Sistemleri ve Biyorezonans Yazılım Çözümleri'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: e-Arşiv Badge & Header Info */}
              <div className="text-right space-y-1 self-stretch sm:self-auto flex flex-col items-end">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-700 text-white font-bold text-[11px] rounded tracking-wide uppercase shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>e-Arşiv Fatura</span>
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-900 pt-1">
                  Fatura No: <span className="text-red-700">{invoice.invoiceNumber}</span>
                </div>
                <div className="text-[10px] text-slate-600">
                  Fatura Tarihi: <strong>{invoice.issueDate}</strong> - {invoice.issueTime}
                </div>
                <div className="text-[10px] text-slate-600">
                  Fatura Tipi: <strong>{invoice.invoiceType}</strong>
                </div>
              </div>
            </div>

            {/* ETTN & QR Code Section */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-0.5 text-left w-full">
                <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                  <span>ETTN (Elektronik Takip Numarası):</span>
                  <button 
                    onClick={handleCopyEttn}
                    className="text-slate-700 hover:text-slate-900 inline-flex items-center gap-0.5 print:hidden cursor-pointer"
                    title="ETTN Kopyala"
                  >
                    {copiedEttn ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="font-mono text-[11px] font-bold text-slate-800 select-all break-all">
                  {invoice.ettn}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="Web Adresi Karekod" className="w-12 h-12 rounded object-contain" />
                ) : (
                  <QrCode className="w-10 h-10 text-slate-800" />
                )}
                <div className="text-[9px] text-slate-500 leading-tight">
                  <div className="font-bold text-slate-800">Dijital Karekod</div>
                  <div className="text-purple-700 font-semibold">akngroupfrekans.web.app</div>
                </div>
              </div>
            </div>

            {/* Issuer & Recipient Side-by-Side Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Satıcı (Issuer) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>SATICI BİLGİLERİ</span>
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="font-bold text-slate-900 text-xs">{invoice.issuer.companyName}</div>
                  <div className="text-slate-600 text-[10px] font-medium">{invoice.issuer.title}</div>
                  <div className="text-slate-800">
                    <strong>Yetkili:</strong> {invoice.issuer.accountHolder || 'Abdulkadir Kan'}
                  </div>
                  <div className="text-slate-700">
                    <strong>V.D. / V.No:</strong> {invoice.issuer.taxOffice} - {invoice.issuer.taxNumber}
                  </div>
                  <div className="text-slate-700">
                    <strong>Mersis No:</strong> {invoice.issuer.mersisNo}
                  </div>

                  {/* Exact Request: Adres: Dijital Adres (Karekod) and clickable link */}
                  <div className="text-slate-800 text-[11px] pt-0.5">
                    <strong>Adres:</strong> Dijital Adres (Karekod)
                  </div>

                  {/* QR & Web Link Card */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2.5 mt-1">
                    {qrCodeDataUrl && (
                      <img src={qrCodeDataUrl} alt="Web Sitesi Karekodu" className="w-11 h-11 rounded border border-slate-100 shrink-0" />
                    )}
                    <div className="text-[10px] leading-tight space-y-0.5">
                      <div className="font-bold text-slate-800">Resmi Web & Frekans Portalı:</div>
                      <a 
                        href="https://akngroupfrekans.web.app/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-purple-700 font-bold hover:underline break-all block"
                      >
                        https://akngroupfrekans.web.app/
                      </a>
                      <div className="text-[9px] text-slate-500">Karekodu taratarak portala ulaşabilirsiniz</div>
                    </div>
                  </div>

                  <div className="text-slate-700 text-[10px] flex items-center gap-2 pt-0.5 flex-wrap">
                    <span><strong>Tel:</strong> {invoice.issuer.phone}</span>
                    <span>•</span>
                    <span><strong>E-Posta:</strong> {invoice.issuer.email}</span>
                  </div>
                </div>
              </div>

              {/* Alıcı / Bayi (Recipient) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>ALICI (BAYİ / HİZMET ALAN)</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="font-bold text-slate-900">{invoice.recipient.companyName || invoice.recipient.fullName}</div>
                  <div className="text-slate-700">
                    <strong>Yetkili:</strong> {invoice.recipient.fullName}
                  </div>
                  <div className="text-slate-700">
                    <strong>V.D. / V.No (TCKN):</strong> {invoice.recipient.taxOffice} - {invoice.recipient.taxNumber}
                  </div>
                  {invoice.recipient.referralCode && (
                    <div className="text-slate-700 font-mono text-[10px]">
                      <strong>Bayi Referans Kodu:</strong> {invoice.recipient.referralCode}
                    </div>
                  )}
                  <div className="text-slate-700 text-[10px]">
                    <strong>Adres:</strong> {invoice.recipient.address || 'Türkiye'}
                  </div>
                  <div className="text-slate-600 text-[10px] flex items-center gap-2 pt-0.5">
                    <span>Tel: {invoice.recipient.phone || '-'}</span>
                    <span>•</span>
                    <span>E-Posta: {invoice.recipient.email || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold">
                      <th className="py-2.5 px-3 rounded-l-lg">Sıra</th>
                      <th className="py-2.5 px-3">Mal / Hizmet Açıklaması</th>
                      <th className="py-2.5 px-3 text-center">Miktar</th>
                      <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                      <th className="py-2.5 px-3 text-center">KDV %</th>
                      <th className="py-2.5 px-3 text-right">KDV Tutarı</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">Toplam Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{item.description}</div>
                          <div className="text-[10px] text-slate-500">
                            AuraBio Frekans Dijital Seans & Biyorezonans Lisans Hizmeti
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold">
                          {item.quantity} {item.unit || 'Adet'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          %{item.kdvRate || 20}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {item.kdvAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {item.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations & Summary Section */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-2">
              {/* Payment & Bank Notice */}
              <div className="space-y-2 text-[10px] text-slate-600 flex-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 uppercase text-[9px]">
                    ÖDEME & BANKA BİLGİLERİ:
                  </div>
                  <div><strong>Ödeme Türü:</strong> {invoice.paymentMethod === 'HAVALE_EFT' ? 'Banka Havalesi / EFT' : 'Kredi Kartı / Diğer'}</div>
                  <div><strong>Banka:</strong> {invoice.issuer.bankName}</div>
                  <div><strong>Hesap Sahibi:</strong> {invoice.issuer.accountHolder}</div>
                  <div className="font-mono font-bold text-slate-900"><strong>IBAN:</strong> {invoice.issuer.iban}</div>
                  {invoice.paymentReference && (
                    <div><strong>Açıklama / Referans:</strong> {invoice.paymentReference}</div>
                  )}
                </div>

                <div className="text-[9px] text-slate-500 italic leading-tight">
                  * {invoice.notes}
                </div>
              </div>

              {/* Totals Table */}
              <div className="w-full sm:w-72 space-y-1 text-[11px] bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Mal / Hizmet Toplamı:</span>
                  <span className="font-mono font-semibold">{invoice.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hesaplanan KDV (%20):</span>
                  <span className="font-mono font-semibold">{invoice.kdvTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                </div>
                <div className="border-t border-slate-300 pt-1.5 flex justify-between text-slate-900 font-bold text-sm">
                  <span>ÖDENECEK TOPLAM:</span>
                  <span className="font-mono text-red-700">{invoice.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                </div>
              </div>
            </div>

            {/* In Words Total */}
            <div className="p-2.5 bg-slate-100 rounded-lg text-center text-[10px] font-bold text-slate-800 uppercase tracking-wide border border-slate-200">
              # YALNIZ {invoice.grandTotalInWords || 'TÜRK LİRASIDIR'} #
            </div>

            {/* Official Digital Stamp & E-Signature Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
              <div className="space-y-0.5 text-center sm:text-left">
                <div>Bu fatura 509 Sıra No'lu VUK Genel Tebliği uyarınca elektronik ortamda düzenlenmiştir.</div>
                <div>Elektronik imzalı aslı ile aynı hukuki geçerliliğe sahiptir.</div>
              </div>

              {/* Digital Seal / Mühür */}
              <div className="border-2 border-dashed border-purple-600/80 p-3 rounded-xl text-center space-y-0.5 bg-purple-50/50">
                <div className="font-bold text-purple-950 text-[10px] uppercase tracking-wide">
                  {invoice.issuer.companyName || 'AKN GLOBAL GROUP LTD'}
                </div>
                <div className="text-[9px] text-purple-800 font-mono font-bold">
                  ELEKTRONİK MALİ MÜHÜR VE E-İMZA
                </div>
                <div className="text-[8px] text-slate-700 font-medium">
                  Yetkili: Abdulkadir Kan • {invoice.issuer.phone || '05425783748'}
                </div>
                <div className="text-[8px] text-slate-500 font-mono">
                  Zaman Damgası: {invoice.issueDate} {invoice.issueTime}
                </div>
              </div>
            </div>

            {/* Exact Required Disclaimer at the bottom */}
            <div className="pt-3 border-t border-slate-300 text-center text-[10px] font-bold text-rose-700 bg-rose-50/70 p-2.5 rounded-xl border border-rose-200">
              * Bu belge sadece bilgilendirme amaçlıdır, farklı bir amaç ile kullanılamaz, fatura yerine geçmez.
            </div>

          </div>
        </div>

        {/* Bottom Bar Controls (Print Hidden) */}
        <div className="print:hidden p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>Fatura No:</span>
            <strong className="text-slate-200 font-mono">{invoice.invoiceNumber}</strong>
            <button 
              onClick={handleCopyInvoiceNo}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Fatura Numarasını Kopyala"
            >
              {copiedInvoiceNo ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span>PDF İndir</span>
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={whatsAppLoading}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              {whatsAppLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>WhatsApp ile Gönder</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-100">Faturayı Kalıcı Olarak Sil</h4>
                  <p className="text-xs text-rose-300/90">Bu e-Arşiv faturası sistemden silinecektir.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fatura No:</span>
                  <span className="font-mono font-bold text-slate-200">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Alıcı:</span>
                  <span className="font-semibold text-slate-200">{invoice.recipient.companyName || invoice.recipient.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Toplam Tutar:</span>
                  <span className="font-mono font-bold text-emerald-400">{invoice.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/70"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{deleteLoading ? 'Siliniyor...' : 'Evet, Faturayı Sil'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
