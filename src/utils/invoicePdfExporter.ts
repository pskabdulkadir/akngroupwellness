import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { DigitalInvoice, generateInvoiceWhatsAppShareUrl, saveDigitalInvoice } from './invoiceManager';
import { formatUsd } from './currency';

// Clean text for jsPDF standard font rendering without character corruption
function trClean(t: string | undefined | null): string {
  if (!t) return '';
  return String(t)
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c')
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/₺/g, 'USD')
    .replace(/•/g, '-');
}

/**
 * Generates an official, high-resolution vector PDF of the e-Arşiv Invoice directly with jsPDF.
 * 100% immune to html2canvas / CSS parser errors (such as oklch color parsing).
 */
export async function generateInvoicePdfBlob(invoice: DigitalInvoice): Promise<{ blob: Blob; fileName: string; dataUrl: string }> {
  // Generate QR Code data URL
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL('https://akngroupfrekans.web.app/', {
      width: 200,
      margin: 1,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    });
  } catch (e) {
    console.warn('QR code generation notice:', e);
  }

  // Create A4 PDF in portrait (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let currentY = 14;

  // Background subtle border
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin - 4, margin - 4, contentWidth + 8, 277, 3, 3);

  // 1. HEADER SECTION
  // Left: Logo Box & Company Title
  doc.setFillColor(107, 33, 168); // Purple-800
  doc.roundedRect(margin, currentY, 14, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('AKN', margin + 7, currentY + 9, { align: 'center' });

  // Company Name & Subtitle
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(trClean(invoice.issuer.companyName || 'AKN GLOBAL GROUP LTD'), margin + 17, currentY + 6);
  
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(trClean(invoice.issuer.title || 'AuraBio Frekans Sistemleri ve Biyorezonans Yazilim Cozumleri'), margin + 17, currentY + 11);

  // Right Header: e-Arşiv Fatura Badge & Info
  doc.setFillColor(185, 28, 28); // red-700
  doc.roundedRect(pageWidth - margin - 36, currentY, 36, 6, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('e-Arsiv Fatura', pageWidth - margin - 18, currentY + 4.2, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Fatura No: ${invoice.invoiceNumber}`, pageWidth - margin, currentY + 10.5, { align: 'right' });

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Tarih: ${invoice.issueDate} - ${invoice.issueTime}`, pageWidth - margin, currentY + 14.5, { align: 'right' });
  doc.text(`Tip: ${trClean(invoice.invoiceType || 'SATIS')}`, pageWidth - margin, currentY + 18, { align: 'right' });

  currentY += 21;

  // Header bottom border line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 3;

  // 2. ETTN & QR CODE BAR
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 16, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('ETTN (ELEKTRONIK TAKIP NUMARASI)', margin + 3, currentY + 5);

  doc.setTextColor(30, 41, 59);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text(invoice.ettn, margin + 3, currentY + 11);

  // QR Code Image in ETTN Bar
  if (qrCodeDataUrl) {
    try {
      doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - margin - 29, currentY + 1.5, 13, 13);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text('Dijital Karekod', pageWidth - margin - 14, currentY + 6);
      doc.setTextColor(107, 33, 168);
      doc.text('akngroupfrekans.web.app', pageWidth - margin - 14, currentY + 10);
    } catch (qrErr) {
      console.warn('QR embed warning:', qrErr);
    }
  }

  currentY += 19;

  // 3. ISSUER & RECIPIENT BOXES (Side-by-side)
  const boxWidth = (contentWidth - 4) / 2; // ~89mm each
  const boxHeight = 44;

  // Satıcı Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SATICI BILGILERI', margin + 3, currentY + 5);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 3, currentY + 6.5, margin + boxWidth - 3, currentY + 6.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(trClean(invoice.issuer.companyName), margin + 3, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Yetkili: ${trClean(invoice.issuer.accountHolder || 'Abdulkadir Kan')}`, margin + 3, currentY + 16);
  doc.text(`V.D. / V.No: ${trClean(invoice.issuer.taxOffice)} - ${trClean(invoice.issuer.taxNumber)}`, margin + 3, currentY + 20.5);
  doc.text(`Mersis No: ${trClean(invoice.issuer.mersisNo)}`, margin + 3, currentY + 25);
  doc.text(`Adres: Dijital Adres (Karekod)`, margin + 3, currentY + 29.5);
  doc.setTextColor(107, 33, 168);
  doc.text(`https://akngroupfrekans.web.app/`, margin + 3, currentY + 34);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tel: ${invoice.issuer.phone}  |  E-Posta: ${invoice.issuer.email}`, margin + 3, currentY + 39);

  // Alıcı Box
  const recipientX = margin + boxWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(recipientX, currentY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ALICI (BAYI / HIZMET ALAN)', recipientX + 3, currentY + 5);
  doc.setDrawColor(226, 232, 240);
  doc.line(recipientX + 3, currentY + 6.5, recipientX + boxWidth - 3, currentY + 6.5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const recipientName = trClean(invoice.recipient.companyName || invoice.recipient.fullName);
  doc.text(recipientName.length > 38 ? recipientName.slice(0, 38) + '...' : recipientName, recipientX + 3, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Yetkili: ${trClean(invoice.recipient.fullName)}`, recipientX + 3, currentY + 16);
  doc.text(`V.D. / V.No (TCKN): ${trClean(invoice.recipient.taxOffice)} - ${trClean(invoice.recipient.taxNumber)}`, recipientX + 3, currentY + 20.5);
  if (invoice.recipient.referralCode) {
    doc.text(`Bayi Kodu: ${trClean(invoice.recipient.referralCode)}`, recipientX + 3, currentY + 25);
  }
  const rawAddr = trClean(invoice.recipient.address || 'Turkiye');
  const addrText = `Adres: ${rawAddr.length > 42 ? rawAddr.slice(0, 42) + '...' : rawAddr}`;
  doc.text(addrText, recipientX + 3, currentY + (invoice.recipient.referralCode ? 29.5 : 25));
  doc.setTextColor(71, 85, 105);
  doc.text(`Tel: ${invoice.recipient.phone || '-'}  |  E-Posta: ${invoice.recipient.email || '-'}`, recipientX + 3, currentY + 39);

  currentY += boxHeight + 4;

  // 4. ITEMS TABLE (Proper columns with auto-wrapping to prevent overlap)
  // Total width: 182mm (14mm to 196mm)
  // Col 1: SIRA -> 8mm (14 to 22) -> center: 18
  // Col 2: ACIKLAMA -> 74mm (22 to 96) -> left: 24, max width: 70
  // Col 3: MIKTAR -> 18mm (96 to 114) -> center: 105
  // Col 4: BIRIM FIYAT -> 23mm (114 to 137) -> right: 135
  // Col 5: KDV % -> 13mm (137 to 150) -> center: 143.5
  // Col 6: KDV TUTARI -> 22mm (150 to 172) -> right: 170
  // Col 7: TOPLAM TUTAR -> 24mm (172 to 196) -> right: 194

  // Table Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SIRA', 18, currentY + 4.8, { align: 'center' });
  doc.text('MAL / HIZMET ACIKLAMASI', 24, currentY + 4.8);
  doc.text('MIKTAR', 105, currentY + 4.8, { align: 'center' });
  doc.text('BIRIM FIYAT', 135, currentY + 4.8, { align: 'right' });
  doc.text('KDV %', 143.5, currentY + 4.8, { align: 'center' });
  doc.text('KDV TUTARI', 170, currentY + 4.8, { align: 'right' });
  doc.text('TOPLAM TUTAR', 194, currentY + 4.8, { align: 'right' });

  currentY += 7;

  // Table Rows
  invoice.items.forEach((item, idx) => {
    // Wrap long description into max 70mm width
    const descLines: string[] = doc.splitTextToSize(trClean(item.description), 70);
    const subText = 'AuraBio Frekans Dijital Seans & Biyorezonans Lisans Hizmeti';
    const subLines: string[] = doc.splitTextToSize(subText, 70);

    const textBlockHeight = (descLines.length * 3.4) + (subLines.length * 2.8) + 4;
    const rowHeight = Math.max(14, textBlockHeight);

    // Row background zebra
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }
    // Bottom border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

    // 1. Sıra No
    doc.setTextColor(100, 116, 139);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(String(idx + 1), 18, currentY + 5.5, { align: 'center' });

    // 2. Açıklama (Multi-line safe)
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    descLines.forEach((line, lIdx) => {
      doc.text(line, 24, currentY + 4.2 + (lIdx * 3.3));
    });

    // Açıklama alt başlığı
    const subStartY = currentY + 4.2 + (descLines.length * 3.3) + 0.6;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    subLines.forEach((sLine, sIdx) => {
      doc.text(sLine, 24, subStartY + (sIdx * 2.7));
    });

    // 3. Miktar
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`${item.quantity} ${trClean(item.unit || 'Paket')}`, 105, currentY + 5.5, { align: 'center' });

    // 4. Birim Fiyat
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(formatUsd(item.unitPrice, 2), 135, currentY + 5.5, { align: 'right' });

    // 5. KDV %
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`%${item.kdvRate || 20}`, 143.5, currentY + 5.5, { align: 'center' });

    // 6. KDV Tutarı
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(formatUsd(item.kdvAmount, 2), 170, currentY + 5.5, { align: 'right' });

    // 7. Toplam Tutar
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(formatUsd(item.totalAmount, 2), 194, currentY + 5.5, { align: 'right' });

    currentY += rowHeight;
  });

  currentY += 4;

  // 5. SUMMARY & BANK INFO (Side-by-side)
  const bankBoxWidth = contentWidth - 68; // ~114mm
  const totalsBoxWidth = 64; // ~64mm
  const summaryBoxHeight = 32;

  // Bank Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, bankBoxWidth, summaryBoxHeight, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ODEME VE BANKA BILGILERI:', margin + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Odeme Turu: ${invoice.paymentMethod === 'HAVALE_EFT' ? 'Banka Havalesi / EFT' : 'Kredi Karti / Cari'}`, margin + 3, currentY + 10);
  doc.text(`Banka: ${trClean(invoice.issuer.bankName)}`, margin + 3, currentY + 14.5);
  doc.text(`Hesap Sahibi: ${trClean(invoice.issuer.accountHolder)}`, margin + 3, currentY + 19);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`IBAN: ${invoice.issuer.iban}`, margin + 3, currentY + 24);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(`* ${trClean(invoice.notes)}`, margin + 3, currentY + 28.5);

  // Totals Box
  const totalsX = margin + bankBoxWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsX, currentY, totalsBoxWidth, summaryBoxHeight, 2, 2, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Mal / Hizmet Toplami:', totalsX + 3, currentY + 7);
  doc.setFont('courier', 'normal');
  doc.text(formatUsd(invoice.subtotal, 2), totalsX + totalsBoxWidth - 3, currentY + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('Hesaplanan KDV (%20):', totalsX + 3, currentY + 14);
  doc.setFont('courier', 'normal');
  doc.text(formatUsd(invoice.kdvTotal, 2), totalsX + totalsBoxWidth - 3, currentY + 14, { align: 'right' });

  // Divider inside totals
  doc.setDrawColor(203, 213, 225);
  doc.line(totalsX + 3, currentY + 18, totalsX + totalsBoxWidth - 3, currentY + 18);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ODENECEK TOPLAM:', totalsX + 3, currentY + 25);

  doc.setTextColor(185, 28, 28); // red-700
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text(formatUsd(invoice.grandTotal, 2), totalsX + totalsBoxWidth - 3, currentY + 25, { align: 'right' });

  currentY += summaryBoxHeight + 3;

  // 6. IN WORDS TOTAL
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`# YALNIZ ${trClean(invoice.grandTotalInWords || 'USD')} #`, pageWidth / 2, currentY + 4.8, { align: 'center' });

  currentY += 10;

  // 7. ELECTRONIC SEAL & FOOTER
  const sealBoxWidth = 66;
  const sealX = pageWidth - margin - sealBoxWidth;

  // Legal note on left
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text("Bu fatura 509 Sira No'lu VUK Genel Tebligi uyarinca elektronik ortamda duzenlenmistir.", margin, currentY + 4);
  doc.text('Elektronik imzali asli ile ayni hukuki gecerlilige sahiptir.', margin, currentY + 8);

  // Digital Seal on right
  doc.setFillColor(250, 245, 255); // purple-50
  doc.setDrawColor(147, 51, 234); // purple-600
  doc.setLineWidth(0.4);
  doc.roundedRect(sealX, currentY, sealBoxWidth, 14, 2, 2, 'FD');

  doc.setTextColor(88, 28, 135); // purple-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(trClean(invoice.issuer.companyName || 'AKN GLOBAL GROUP LTD'), sealX + sealBoxWidth / 2, currentY + 4, { align: 'center' });

  doc.setTextColor(126, 34, 206); // purple-700
  doc.setFont('courier', 'bold');
  doc.setFontSize(6);
  doc.text('ELEKTRONIK MALI MUHUR VE E-IMZA', sealX + sealBoxWidth / 2, currentY + 7.5, { align: 'center' });

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text(`Yetkili: Abdulkadir Kan  |  Zaman: ${invoice.issueDate} ${invoice.issueTime}`, sealX + sealBoxWidth / 2, currentY + 11.5, { align: 'center' });

  currentY += 17;

  // 8. MANDATORY DISCLAIMER BOX
  doc.setFillColor(255, 241, 242); // rose-50
  doc.setDrawColor(253, 164, 175); // rose-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'FD');

  doc.setTextColor(190, 18, 60); // rose-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  const disclaimerText = trClean('* Bu belge sadece bilgilendirme amaclidir, farkli bir amac ile kullanilamaz, fatura yerine gecmez.');
  doc.text(disclaimerText, pageWidth / 2, currentY + 4.5, { align: 'center' });

  const blob = doc.output('blob');
  const fileName = `E-Arsiv_Fatura_${invoice.invoiceNumber}_${invoice.issueDate || new Date().toISOString().slice(0, 10)}.pdf`;
  const dataUrl = URL.createObjectURL(blob);

  return { blob, fileName, dataUrl };
}

/**
 * Downloads the invoice as a PDF file directly to user's computer or mobile device.
 */
export async function downloadInvoicePDF(invoice: DigitalInvoice): Promise<void> {
  const { blob, fileName } = await generateInvoicePdfBlob(invoice);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(link.href);
  }, 2000);
}

/**
 * Handles sending the invoice via WhatsApp:
 * 1. Generates and downloads the pure vector PDF to user's device
 * 2. If Web Share API supports file sharing (mobile / modern browser), invokes native share with the PDF file
 * 3. Opens WhatsApp Web / App with pre-filled invoice message
 * 4. Automatically updates invoice status to 'sent_whatsapp'
 */
export async function shareInvoiceViaWhatsAppWithPDF(
  invoice: DigitalInvoice,
  customPhone?: string
): Promise<{ sharedViaNative: boolean; downloaded: boolean }> {
  let sharedViaNative = false;
  let downloaded = false;

  try {
    const { blob, fileName } = await generateInvoicePdfBlob(invoice);
    
    // Check if Web Share API with files is supported
    const pdfFile = new File([blob], fileName, { type: 'application/pdf' });
    
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: `E-Arşiv Fatura ${invoice.invoiceNumber}`,
          text: `Sayın ${invoice.recipient.companyName || invoice.recipient.fullName}, AKN Global Group Ltd resmi e-Arşiv faturanız ektedir.`
        });
        sharedViaNative = true;
      } catch (shareErr: any) {
        if (shareErr.name !== 'AbortError') {
          console.warn('Native share notice:', shareErr);
        }
      }
    }

    // Always trigger download if not shared via native picker or on desktop
    if (!sharedViaNative) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(link.href);
      }, 2000);
      downloaded = true;
    }

    // Open WhatsApp URL with formatted text
    const whatsappUrl = generateInvoiceWhatsAppShareUrl(invoice, customPhone || invoice.recipient.phone);
    window.open(whatsappUrl, '_blank');

    // Update status in Firestore & LocalStorage
    const updated: DigitalInvoice = {
      ...invoice,
      status: 'sent_whatsapp',
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveDigitalInvoice(updated);

    return { sharedViaNative, downloaded };
  } catch (err) {
    console.error('Share invoice via WhatsApp error:', err);
    // Fallback standard WhatsApp link
    const whatsappUrl = generateInvoiceWhatsAppShareUrl(invoice, customPhone || invoice.recipient.phone);
    window.open(whatsappUrl, '_blank');
    return { sharedViaNative: false, downloaded: false };
  }
}
