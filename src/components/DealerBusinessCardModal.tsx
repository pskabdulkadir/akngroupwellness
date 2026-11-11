import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink, 
  QrCode, 
  Award, 
  CheckCircle2,
  Smartphone,
  Send,
  Zap,
  Globe
} from 'lucide-react';
import { Reseller, generateBusinessCardLink, generateRegisterLink, generateBulkMarketingMessage, generateWhatsAppUrlForMessage, generateTelegramUrlForMessage } from '../utils/resellerManager';

interface DealerBusinessCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reseller: Reseller;
  isVisitorView?: boolean; // When opened by a prospective customer clicking ?view=card
  onStartRegistration?: (referralCode: string) => void;
}

export const DealerBusinessCardModal: React.FC<DealerBusinessCardModalProps> = ({
  isOpen,
  onClose,
  reseller,
  isVisitorView = false,
  onStartRegistration,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [highResQrUrl, setHighResQrUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [downloadingCard, setDownloadingCard] = useState<boolean>(false);

  const cardPageUrl = generateBusinessCardLink(reseller.referralCode);
  const registrationUrl = generateRegisterLink(reseller.referralCode);

  // Generate QR Code dynamically
  useEffect(() => {
    if (!isOpen || !reseller.referralCode) return;

    setIsGenerating(true);
    // 1. Standard QR for UI display
    QRCode.toDataURL(registrationUrl, {
      width: 400,
      margin: 1.5,
      color: {
        dark: '#022c22', // deep emerald
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch(console.error);

    // 2. High-Res 1024x1024 QR with margin for export
    QRCode.toDataURL(registrationUrl, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#022c22',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setHighResQrUrl(url);
        setIsGenerating(false);
      })
      .catch(() => setIsGenerating(false));
  }, [isOpen, reseller.referralCode, registrationUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cardPageUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(reseller.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Download high-resolution QR code PNG with dealer title banner
  const handleDownloadQrPng = () => {
    if (!highResQrUrl) return;

    // Create a composite canvas with dealer code and branding
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1400);
    bgGrad.addColorStop(0, '#021814');
    bgGrad.addColorStop(0.5, '#042f2e');
    bgGrad.addColorStop(1, '#021814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 1400);

    // Header AuraBio text
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AuraBio Frekans & Biyo-Rezonans', 600, 90);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px sans-serif';
    ctx.fillText('Yetkili Bayi & Doğrulanmış Referans Ağı', 600, 130);

    // Dealer Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(reseller.resellerName, 600, 200);

    // Draw QR Code in white rounded card
    const qrImg = new Image();
    qrImg.onload = () => {
      // White container
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(150, 260, 900, 900, 32);
      ctx.fill();

      // QR
      ctx.drawImage(qrImg, 180, 290, 840, 840);

      // Bottom Referral Code Box
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.roundRect(250, 1200, 700, 100, 24);
      ctx.fill();

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`KOD: ${reseller.referralCode}`, 600, 1262);

      ctx.fillStyle = '#64748b';
      ctx.font = '18px sans-serif';
      ctx.fillText('Kameranızı açarak karekodu taratın veya doğrudan kaydolun', 600, 1340);

      // Trigger download
      const link = document.createElement('a');
      link.download = `AuraBio-Karekod-${reseller.referralCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    qrImg.src = highResQrUrl;
  };

  // Download entire digital business card as PNG
  const handleDownloadCardImage = async () => {
    if (!cardRef.current) return;
    try {
      setDownloadingCard(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#020617',
        logging: false,
        onclone: (clonedDoc) => {
          // Remove any elements or styles that might inject unsupported oklch
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style) {
              const bg = htmlEl.style.backgroundColor;
              if (bg && bg.includes('oklch')) {
                htmlEl.style.backgroundColor = '#0f172a';
              }
              const color = htmlEl.style.color;
              if (color && color.includes('oklch')) {
                htmlEl.style.color = '#f8fafc';
              }
              const border = htmlEl.style.borderColor;
              if (border && border.includes('oklch')) {
                htmlEl.style.borderColor = '#10b981';
              }
            }
          });
        }
      });
      const link = document.createElement('a');
      link.download = `AuraBio-Kartvizit-${reseller.referralCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download card error:', err);
    } finally {
      setDownloadingCard(false);
    }
  };

  const shareText = `🌟 *AuraBio Frekans Yetkili Bayi Dijital Kartviziti*\n\n🏢 *Bayi:* ${reseller.resellerName}\n🔑 *Bayi Kodu:* ${reseller.referralCode}\n\n🪪 Dijital Kartvizitimi incelemek ve canlı frekans sistemini ücretsiz test etmek için karekodu okutabilir veya bağlantıya tıklayabilirsiniz:\n🔗 ${cardPageUrl}`;
  const waShareUrl = generateWhatsAppUrlForMessage(shareText);
  const tgShareUrl = generateTelegramUrlForMessage(shareText, cardPageUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden my-auto">
        
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner">
              <QrCode className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Dijital Bayi Kartviziti & Karekod</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {reseller.referralCode}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Kişiselleştirilmiş yüksek çözünürlüklü tanıtım kartı ve bağlantı merkezi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6">

          {/* THE PHYSICAL BUSINESS CARD COMPONENT (Captured for PNG Download) */}
          <div 
            ref={cardRef}
            className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950/40 to-slate-950 p-6 sm:p-7 border-2 border-emerald-500/40 shadow-2xl text-slate-100 overflow-hidden space-y-6"
            style={{
              backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(20, 184, 166, 0.12) 0%, transparent 40%)'
            }}
          >
            {/* Holographic Watermark / Seal */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 backdrop-blur-sm text-emerald-300 text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Yetkili Doğrulanmış Bayi</span>
            </div>

            {/* Top Brand Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-950">
                ⚡
              </div>
              <div>
                <div className="text-xs font-black tracking-wider text-emerald-400 uppercase">AuraBio Technologies</div>
                <div className="text-[10px] text-slate-400">Kuantum Biyo-Rezonans & Frekans Sistemleri</div>
              </div>
            </div>

            {/* Card Main Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center pt-2">
              
              {/* Left Column: Dealer Credentials */}
              <div className="sm:col-span-7 space-y-3">
                <div>
                  <div className="text-[11px] text-emerald-400/90 font-medium">Yetkili Temsilcilik / Merkez:</div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    {reseller.resellerName}
                  </h3>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  {reseller.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-mono text-[11px]">{reseller.phone}</span>
                    </div>
                  )}
                  {reseller.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[11px] text-slate-300">{reseller.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-slate-300">AuraBio Resmi Frekans Ağı</span>
                  </div>
                </div>

                {/* Referral Code Badge */}
                <div className="pt-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/50 shadow-inner">
                    <span className="text-[10px] text-slate-400 font-semibold">Bayi Kodu:</span>
                    <span className="font-mono font-black text-xs text-emerald-300">{reseller.referralCode}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: High Contrast QR Code */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-white text-slate-950 shadow-xl border-2 border-emerald-400/60">
                {isGenerating || !qrDataUrl ? (
                  <div className="w-36 h-36 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                    <Sparkles className="w-6 h-6 animate-spin text-emerald-600" />
                    <span>Karekod Üretiliyor...</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-center">
                    <img 
                      src={qrDataUrl} 
                      alt={`Karekod - ${reseller.referralCode}`} 
                      className="w-36 h-36 mx-auto rounded-lg"
                    />
                    <div className="text-[9px] font-bold text-slate-800 uppercase tracking-tight">
                      Kayıt & Canlı Demo İçin Taratın
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Card Footer */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>30 Dakika Canlı Ücretsiz Demo Tanımlı</span>
              </span>
              <span className="font-mono text-emerald-400/80">aurabio.io</span>
            </div>

          </div>

          {/* VISITOR ACTION (If opened via ?view=card URL by prospective client) */}
          {isVisitorView && (
            <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Hoş Geldiniz! {reseller.resellerName} Özel Daveti İle Buradasınız</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Bu yetkili bayi bağlantısı üzerinden sisteme kaydolarak 30 dakikalık canlı Biyo-Rezonans ve Frekans seansını hemen ücretsiz deneyimleyebilirsiniz.
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onStartRegistration) {
                    onStartRegistration(reseller.referralCode);
                  }
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>✨ Bu Bayi İle Kayıt Ol & Demoyu Başlat</span>
              </button>
            </div>
          )}

          {/* ACTION BUTTONS (Download, Copy & Share) */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Kartvizit & Karekod İndirme / Paylaşım Seçenekleri:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* 1. Download QR Code PNG */}
              <button
                onClick={handleDownloadQrPng}
                disabled={isGenerating || !highResQrUrl}
                className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer shadow-sm"
              >
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-white text-xs">Karekod PNG İndir</div>
                  <div className="text-[10px] text-slate-400">Yüksek çözünürlüklü (1024px)</div>
                </div>
              </button>

              {/* 2. Download Business Card Image */}
              <button
                onClick={handleDownloadCardImage}
                disabled={downloadingCard}
                className="p-3 rounded-2xl bg-slate-950 border border-teal-500/30 hover:border-teal-500 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer shadow-sm"
              >
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-white text-xs">{downloadingCard ? 'Görsel Hazırlanıyor...' : 'Kartviziti Görsel Olarak İndir'}</div>
                  <div className="text-[10px] text-slate-400">Sosyal medyada paylaşmak için</div>
                </div>
              </button>

              {/* 3. Copy Card Web Link */}
              <button
                onClick={handleCopyLink}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer shadow-sm"
              >
                <div className="p-2 rounded-xl bg-slate-800 text-slate-300 shrink-0">
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <div className="text-white text-xs">{copiedLink ? 'Link Kopyalandı!' : 'Kartvizit Linkini Kopyala'}</div>
                  <div className="text-[10px] text-slate-400">Tıklanabilir web bağlantısı</div>
                </div>
              </button>

              {/* 4. Copy Referral Code */}
              <button
                onClick={handleCopyCode}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer shadow-sm"
              >
                <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 font-mono text-xs font-bold shrink-0">
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : '#'}
                </div>
                <div className="text-left">
                  <div className="text-white text-xs">{copiedCode ? 'Kod Kopyalandı!' : 'Bayi Kodunu Kopyala'}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">{reseller.referralCode}</div>
                </div>
              </button>

            </div>

            {/* Direct Social Share Quick Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <a
                href={waShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950 transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>WhatsApp ile Kartvizit Gönder</span>
              </a>
              <a
                href={tgShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-950 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Telegram'da Paylaş</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
