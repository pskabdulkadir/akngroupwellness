import jsPDF from 'jspdf';
import { MEMBERSHIP_PACKAGES, BANK_INFO, ADMIN_PHONE, ADMIN_EMAILS } from '../utils/authManager';
import { TOTAL_HEALING_COUNT } from '../data/healingLibrary';
import { CAREER_TIERS, FREKANS_PACKAGES, MONOLINE_DEPTH_RATES } from '../types/monoline';
import { formatUsd } from './currency';

const PACKAGE_COUNT = FREKANS_PACKAGES.length;

/**
 * Downloads a Word-compatible .doc file (HTML-based Word format with official styling, tables and formatting)
 * Word opens this natively and perfectly preserves tables, colors, headings, bullet points and fonts.
 */
export function downloadTechnicalReportWord(): void {
  const content = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset='utf-8'>
    <title>AuraBio Frekans - Teknik Bilgilendirme, İş Sunumu ve Katalog</title>
    <style>
      body {
        font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #1e293b;
        background-color: #ffffff;
        margin: 20mm;
      }
      h1 {
        font-size: 20pt;
        color: #047857;
        border-bottom: 2pt solid #10b981;
        padding-bottom: 6pt;
        margin-top: 18pt;
        margin-bottom: 10pt;
      }
      h2 {
        font-size: 14pt;
        color: #0f172a;
        border-left: 4pt solid #059669;
        padding-left: 8pt;
        margin-top: 16pt;
        margin-bottom: 8pt;
      }
      h3 {
        font-size: 12pt;
        color: #334155;
        margin-top: 12pt;
        margin-bottom: 6pt;
      }
      p {
        margin-bottom: 8pt;
        text-align: justify;
      }
      ul, ol {
        margin-top: 4pt;
        margin-bottom: 8pt;
        padding-left: 20pt;
      }
      li {
        margin-bottom: 4pt;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10pt;
        margin-bottom: 14pt;
        font-size: 9.5pt;
      }
      th {
        background-color: #064e3b;
        color: #ffffff;
        font-weight: bold;
        text-align: left;
        padding: 7pt;
        border: 1pt solid #047857;
      }
      td {
        padding: 6pt;
        border: 1pt solid #cbd5e1;
        vertical-align: top;
      }
      tr:nth-child(even) {
        background-color: #f8fafc;
      }
      .badge {
        display: inline-block;
        padding: 2pt 6pt;
        background-color: #ecfdf5;
        color: #047857;
        font-weight: bold;
        border-radius: 4pt;
        border: 1pt solid #a7f3d0;
      }
      .highlight-box {
        background-color: #f0fdf4;
        border-left: 4pt solid #10b981;
        padding: 10pt;
        margin-top: 10pt;
        margin-bottom: 12pt;
        border-radius: 0 6pt 6pt 0;
      }
      .footer-note {
        font-size: 9pt;
        color: #64748b;
        border-top: 1pt solid #e2e8f0;
        padding-top: 8pt;
        margin-top: 24pt;
        text-align: center;
      }
    </style>
  </head>
  <body>

    <div style="text-align: center; margin-bottom: 20pt;">
      <div style="font-size: 16pt; font-weight: bold; color: #047857; letter-spacing: 1.5pt; margin-bottom: 6pt;">AKN GLOBAL GROUP LTD</div>
      <h1 style="border: none; margin-top: 2pt; margin-bottom: 4pt; color: #064e3b;">AURABIO FREKANS — TEKNİK BİLGİLENDİRME VE İŞ SUNUMU</h1>
      <p style="font-size: 13pt; font-weight: bold; color: #059669; margin-top: 0;">TEKNİK BİLGİLENDİRME, İŞ SUNUMU VE ${PACKAGE_COUNT} FREKANS PAKETİ KATALOĞU</p>
      <p style="font-size: 9pt; color: #64748b;">Kaynak kodundaki uygulama akışlarının özeti • Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}</p>
    </div>

    <div class="highlight-box">
      <strong>TEKNİK ÖZET:</strong> AuraBio Frekans; kamera ve mikrofon girdilerinden uygulama içi görseller üreten araçlar, Web Audio tabanlı ses içerikleri, isteğe bağlı Bluetooth bağlantısı, MindSpace, mandala ve harita ekranları, <strong>11 bölümlü uygulama raporu</strong>, <strong>${TOTAL_HEALING_COUNT} kayıtlı ses/frekans içeriği</strong> ve <strong>${PACKAGE_COUNT} frekans paketi</strong> içerir. Bu özellikler tıbbi ölçüm, tanı veya tedavi kanıtı değildir. Ödeme sağlayıcısı sandbox test ortamıdır; banka hareketleri CSV ile kullanıcı tarafından içe aktarılır. Sağlık etkinliği, canlı banka/POS bağlantısı, lisans ve mevzuat uygunluğu bu raporla doğrulanmış sayılmaz.
    </div>

    <h2>1. UYGULAMA ÖZELLİKLERİ VE TEKNİK SINIRLAR</h2>
    <ul>
      <li><strong>Kamera raporu:</strong> Kamera girdisinden renk ve rehberlik görselleri üretir; çakra, aura, organ veya sağlık durumu ölçümü değildir.</li>
      <li><strong>Mikrofon karşılaştırması:</strong> Kısa ses örneklerini uygulama içinde karşılaştırır; hücresel değişim veya klinik sonuç ölçmez.</li>
      <li><strong>Web Audio:</strong> Tarayıcıda ses üretimi ve dinleme oturumları sunar.</li>
      <li><strong>MindSpace:</strong> Günlük, zaman dilimi ve sesli rehberlik araçları içerir; tıbbi/psikolojik değerlendirme değildir.</li>
      <li><strong>Bluetooth:</strong> Uyumlu tarayıcı ve cihazla nabız verisi görüntülenebilir; cihaz uyumu ve ölçüm doğruluğu ayrıca teyit edilmelidir.</li>
      <li><strong>Mandala, harita ve rehberli içerikler:</strong> Uygulama içi görsel ve etkileşimli deneyimler sunar; sağlık etkisi veya gerçek zamanlı kapsam garanti edilmez.</li>
      <li><strong>Frekans kütüphanesi:</strong> ${TOTAL_HEALING_COUNT} kayıtlı içerik, dinleme ve seçme arayüzlerinde sunulur; tedavi etkinliği doğrulanmış değildir.</li>
      <li><strong>Tarama raporu:</strong> 11 bölümden oluşur ve bölümler açılır listeden seçilir. İzin verilirse mikrofon ses seviyesi/spektrumu; destek varsa ortam ışığı ve manyetik alan okumaları kaydedilir. Ham ses tutulmaz; bu veriler paranormal ölçüm değildir, paranormal olasılık hesaplanmaz. Mikrofon göreli seviyesi kalibre edilmiş dB SPL değildir; kamera yüzdesi fiziksel enerji ölçümü değildir.</li>
      <li><strong>Wellness ve bayi araçları:</strong> Paket, cüzdan, komisyon ve çekim akışları ekranda sunulur. Hak ediş, bakiye ve banka ödemesi ayrı durumlar olup koşullara tabidir.</li>
      <li><strong>Akıllı Muhasebe:</strong> Finans kayıtlarını ve kullanıcı tarafından CSV ile içe aktarılan banka ekstresi verilerini inceleme ekranlarında gösterir; canlı banka bağlantısı değildir.</li>
    </ul>

    <h2>2. BAYİ PANELİ VE GELİR HESAPLAMA VARSAYIMLARI</h2>
    <p>Aşağıdaki oranlar kodda yer alan varsayılan hesaplama kurallarını özetler. Bunlar gelir, yatırım getirisi, komisyon hakkı veya ödeme garantisi değildir; yürürlükteki koşullar ve sipariş durumu panelden doğrulanmalıdır.</p>
    <ul>
      <li><strong>Direkt sponsor:</strong> Kodda varsayılan nominal oran %20 olarak tanımlıdır.</li>
      <li><strong>Unilevel:</strong> Varsayılan derinlik oranları %7, %5, %4, %3, %2, %2 ve %2'dir.</li>
      <li><strong>Global Monoline:</strong> Sponsor ağacından bağımsız yedi üst sıra için toplam nominal %5 oran bulunur; uygun olmayan pay havuza aktarılabilir.</li>
      <li><strong>Matching:</strong> Doğrudan sponsor olunan üyenin aynı siparişteki uygun Unilevel ve Monoline komisyonları üzerinden kariyer seviyesine göre %10, %15, %20 veya %25 hesaplanabilir.</li>
      <li><strong>Kariyer/havuz:</strong> Kariyer, aktiflik, sipariş ve diğer sistem kuralları hesaplamayı etkiler. Sabit kariyer bonusu ile terfi sırasında kaydedilen tek seferlik rank-up hediyesi ayrı kalemlerdir.</li>
      <li><strong>Ödeme ve çekim:</strong> Komisyon hak edişi, çekilebilir bakiye, yönetici onayı ve banka transferi farklı durumlardır. Onay, transferin gerçekleştiğini kanıtlamaz.</li>
      <li><strong>Simülatör:</strong> Örnek sonuçlar kullanıcı girdilerine ve basitleştirilmiş varsayımlara dayanır; gerçek kazanç veya yatırım geri dönüşü öngörüsü değildir.</li>
    </ul>

    <h2>3. ÖDEME, BANKA VE MEVZUAT SINIRLARI</h2>
    <div class="highlight-box">
      <strong>DOĞRULAMA NOTU:</strong><br>
      • Kodda varsayılan kart sağlayıcısı sandbox test ortamıdır; canlı sanal POS veya sertifikasyon doğrulanmamıştır.<br>
      • Banka hareketleri Akıllı Muhasebe ekranına CSV ile kullanıcı tarafından aktarılır; doğrudan banka bağlantısı değildir.<br>
      • Çekim talebinin onaylanması gerçek banka transferi anlamına gelmez; banka çıkışı ayrıca mutabakat gerektirir.<br>
      • Vergi, stopaj, tüketici ve sağlık mevzuatına uygunluk bu teknik raporla doğrulanmış sayılmaz; yetkili uzman incelemesi gerekir.<br>
      • Bu uygulama tıbbi cihaz veya sağlık hizmeti olarak doğrulanmamıştır; raporlar ve ses içerikleri tanı/tedavi yerine kullanılmamalıdır.
    </div>

    <h2>4. ${PACKAGE_COUNT} FREKANS PAKETİ</h2>
    <p>Bayi Back-Office üzerinden sunulan ${PACKAGE_COUNT} katalog paketi. Paket fiyatı USD cinsindendir ve krediler 1 USD = 1 Kredi kuralıyla tanımlanır. Paket alımında ek sabit kredi bonusu uygulanmaz:</p>
    <table>
      <thead>
        <tr>
          <th>Kademe</th>
          <th>Paket Adı</th>
          <th>Kategori</th>
          <th>Seans Kredisi</th>
          <th>Birim Maliyet</th>
          <th>Paket Fiyatı</th>
          <th>Nominal %20 hesap örneği</th>
        </tr>
      </thead>
      <tbody>
        ${FREKANS_PACKAGES.map(pkg => `
          <tr>
            <td><strong>#${pkg.rankOrder}</strong></td>
            <td><strong>${pkg.name}</strong></td>
            <td>${pkg.badgeCategory}</td>
            <td><strong>${pkg.sessionCreditsLabel}</strong></td>
            <td>${pkg.unitSessionCostLabel}</td>
            <td><strong style="color: #047857;">${formatUsd(pkg.defaultPrice)}</strong></td>
            <td>${formatUsd(pkg.defaultPrice * 0.2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>5. SES VE FREKANS KÜTÜPHANESİ</h2>
    <p>Kodda ${TOTAL_HEALING_COUNT} içerik altı tematik kategori altında listelenmiştir. Kategori başlıkları ve sayımları uygulamanın kütüphane verilerinden türetilir. İçerik isimleri veya frekans değerleri tedavi etkinliği, klinik yarar ya da hastalığa özgü protokol kanıtı olarak yorumlanmamalıdır.</p>

    <h2>6. BİREYSEL ÜYELİK VE SÜRELİ LİSANS PAKETLERİ</h2>
    <table>
      <thead>
        <tr>
          <th>Paket Adı</th>
          <th>Süre / Kapsam</th>
          <th>Fiyat</th>
          <th>Öne Çıkan Özellikler</th>
        </tr>
      </thead>
      <tbody>
        ${MEMBERSHIP_PACKAGES.map(pkg => `
          <tr>
            <td><strong>${pkg.name}</strong> ${pkg.popular ? '<span class="badge">Popüler</span>' : ''}</td>
            <td>${pkg.durationText}</td>
            <td><strong style="color: #047857;">${pkg.priceText}</strong></td>
            <td>${pkg.features.join(' • ')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>7. ÜRETİCİ VE İLETİŞİM BİLGİLERİ</h2>
    <table>
      <tr>
        <td style="width: 30%;"><strong>Kurumsal Yapı:</strong></td>
        <td>AKN GLOBAL GROUP LTD • AuraBio Kuantum Biyo-Rezonans &amp; Frekans Enstitüsü</td>
      </tr>
      <tr>
        <td><strong>Resmi Banka:</strong></td>
        <td>${BANK_INFO.bankName}</td>
      </tr>
      <tr>
        <td><strong>Hesap Sahibi:</strong></td>
        <td>${BANK_INFO.accountHolder}</td>
      </tr>
      <tr>
        <td><strong>IBAN Numarası:</strong></td>
        <td><strong style="font-family: monospace; color: #047857;">${BANK_INFO.iban}</strong></td>
      </tr>
      <tr>
        <td><strong>İletişim &amp; WhatsApp:</strong></td>
        <td>${ADMIN_PHONE}</td>
      </tr>
      <tr>
        <td><strong>E-Posta:</strong></td>
        <td>${ADMIN_EMAILS.join(', ')}</td>
      </tr>
    </table>

    <h2>8. VERİTABANI, KREDİ DEFTERİ VE İŞLEM GÜVENLİĞİ</h2>
    <ul>
      <li>Bayi paket kredileri 1 USD = 1 Kredi kuralıyla sunucu kataloğundan belirlenir; paket alımında sabit ek kredi bonusu yoktur.</li>
      <li>Yönetici kredi düzeltmeleri PostgreSQL transaction’ı içinde kullanıcı kilidi, reseller_credits bakiyesi, idempotency ve credit_ledger kaydıyla işlenir.</li>
      <li>PostgreSQL bağlantısı pg.Pool üzerinden DATABASE_URL ve SSL ayarlarıyla kurulur; varsayılan havuz sınırı 10 bağlantı, bağlantı zaman aşımı 10 saniyedir.</li>
      <li>Veritabanı yazımı doğrulanamazsa sistem yeni yazma isteklerini geçici olarak durdurur ve kurtarma kontrolünü dakikada bir dener. 503 yanıtında yeniden göndermeden önce sipariş ve kredi defteri kontrol edilmelidir.</li>
      <li>Portalın durum okuma isteği DB hatasında 3 saniyeden başlayıp en fazla 60 saniyeye kadar bekler; aynı anda ikinci bir polling isteği başlatılmaz. Harici istemcilerin tekrar deneme davranışı ayrıca kontrol edilmelidir.</li>
      <li>PgBouncer kullanımı ve transaction/session pooling modu canlı DATABASE_URL ile doğrulanmalıdır; bağlantı URL’i uygulama kodundan görülemez.</li>
    </ul>

    <div class="footer-note">
      Kaynak kodundaki uygulama özelliklerini özetleyen bilgilendirme belgesidir; bağımsız teknik denetim, sağlık etkinliği, gelir, ödeme veya mevzuat uygunluğu sertifikası değildir.<br>
      © ${new Date().getFullYear()} AKN GLOBAL GROUP LTD • AuraBio Frekans.
    </div>

  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff', content], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AuraBio_Frekans_Teknik_Rapor_ve_Katalog_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a high-fidelity vector PDF version of the Business Presentation & Technical Catalog using jsPDF
 */
export function downloadTechnicalReportPDF(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  let y = 16;

  // Helper to add clean sanitized text (Turkish char normalization for PDF standard font)
  const clean = (t: string) => {
    if (!t) return '';
    return t
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
      .replace(/â/g, 'a')
      .replace(/Â/g, 'A')
      .replace(/î/g, 'i')
      .replace(/û/g, 'u')
      .replace(/₺/g, 'USD')
      .replace(/’/g, "'")
      .replace(/‘/g, "'")
      .replace(/“/g, '"')
      .replace(/”/g, '"');
  };

  const checkPage = (heightNeeded: number) => {
    if (y + heightNeeded > pageHeight - margin) {
      doc.addPage();
      y = 16;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(clean('AuraBio Frekans - Teknik Bilgilendirme ve Katalog'), margin, 10);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 12, pageWidth - margin, 12);
      y = 18;
    }
  };

  // Header Banner
  doc.setFillColor(6, 78, 59); // Dark emerald
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('AURABIO FREKANS & MONOLINE 7 NEFIS MLM KATALOGU'), margin + 5, y + 9);
  
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(clean(`Teknik Bilgilendirme, ${PACKAGE_COUNT} Frekans Paketi ve Is Sunumu`), margin + 5, y + 16);
  doc.text(clean(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), pageWidth - margin - 34, y + 16);

  y += 30;

  // Section 1: Executive Summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('1. UYGULAMA OZETI VE TEKNIK SINIRLAR'), margin, y);
  y += 5;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');
  const summaryText = clean(
    `AuraBio Frekans; kamera ve mikrofon girdilerinden uygulama ici gorseller, Web Audio tabanli ses icerikleri, istege bagli Bluetooth, MindSpace, mandala ve harita ekranlari, 11 bolumlu uygulama raporu, paranormal olcum yapilmadigi bilgisi, ${TOTAL_HEALING_COUNT} ses/frekans icerigi ve ${PACKAGE_COUNT} frekans paketi sunar. Gorseller tibbi olcum, tani veya tedavi kaniti degildir. Kart odemesi sandbox test ortamindadir; banka hareketleri CSV ile kullanici tarafindan aktarilir. Canli banka/POS, saglik etkinligi, lisans ve mevzuat uygunlugu bu raporla dogrulanmis sayilmaz.`
  );
  const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 2 * margin - 8);
  const summaryHeight = Math.max(30, summaryLines.length * 4 + 10);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, summaryHeight, 2, 2, 'FD');
  doc.text(summaryLines, margin + 4, y + 5);
  y += summaryHeight + 5;

  // Section 2: Bayi paneli gelir hesaplama varsayımları
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('2. BAYI PANELI GELIR HESAPLAMA VARSAYIMLARI'), margin, y);
  y += 5;

  const mlmItems = [
    'Varsayilan nominal direkt sponsor orani: %20.',
    'Unilevel derinlik oranlari: %7, %5, %4, %3, %2, %2 ve %2.',
    'Yedi Global Monoline ust sirasi icin toplam nominal %5 oran tanimlidir; uygun olmayan pay havuza aktarilabilir.',
    'Matching, dogrudan sponsor olunan uyenin ayni siparisteki uygun Unilevel ve Monoline komisyonlari uzerinden kariyere gore %10, %15, %20 veya %25 olabilir.',
    'Sabit kariyer bonusu ve terfi sirasinda kaydedilen tek seferlik rank-up hediyesi ayri odul kalemleridir.',
    'Komisyon, cekilebilir bakiye, yonetici onayi ve banka transferi farkli durumlardir.',
    'Simulator sonuclari ornek hesaptir; gelir, ROI veya odeme garantisi degildir.',
    'Kart odemesi sandbox test ortamidir; canli POS ve sertifikasyon dogrulanmamistir.',
    'Banka hareketleri CSV ile kullanici tarafindan aktarilir; canli banka baglantisi yoktur.',
    'Saglik etkinligi ve mevzuat uygunlugu bu raporla bagimsiz olarak dogrulanmamistir.'
  ];

  mlmItems.forEach((item) => {
    const lines = doc.splitTextToSize(clean(item), pageWidth - 2 * margin - 6);
    const rowHeight = Math.max(7, lines.length * 3.6 + 3);
    checkPage(rowHeight + 1);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, rowHeight, 1, 1, 'FD');
    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(lines, margin + 3, y + 4.8);
    y += rowHeight + 1.5;
  });

  y += 2;
  checkPage(45);

  // Section 3: 7 Nefis Mertebesi Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('3. KARIYER VE DERINLIK KOSULLARI'), margin, y);
  y += 5;

  CAREER_TIERS.forEach((tier) => {
    checkPage(8);
    const depthRule = MONOLINE_DEPTH_RATES.find((d) => d.depth === tier.unlockedDepth);
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 6.8, 1, 1, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text(
      clean(
        `${tier.label}: ${tier.title} | Min: ${tier.minPackageLabel} & ${tier.minActiveDirects} Direkt Uye | ${tier.unlockedDepth}. Derinlik (%${depthRule?.percentage || 0}) | Havuz: ${tier.poolBonusLabel}`
      ),
      margin + 3,
      y + 4.5
    );
    y += 7.8;
  });

  y += 3;
  checkPage(50);

  // Section 4: Frekans paketleri
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(clean(`4. ${PACKAGE_COUNT} FREKANS PAKETI`), margin, y);
  y += 5;

  FREKANS_PACKAGES.forEach((pkg) => {
    checkPage(7.5);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 6.5, 1, 1, 'FD');
    doc.setFontSize(7.4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      clean(`#${pkg.rankOrder} ${pkg.name} (${pkg.sessionCreditsLabel} - ${pkg.unitSessionCostLabel})`),
      margin + 3,
      y + 4.4
    );
    doc.setTextColor(4, 120, 87);
    doc.text(
      clean(`${formatUsd(pkg.defaultPrice)}  |  Nominal %20 hesap: ${formatUsd(pkg.defaultPrice * 0.2)}`),
      pageWidth - margin - 68,
      y + 4.4
    );
    y += 7.3;
  });

  y += 3;
  checkPage(30);

  // Iletisim bilgileri
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 22, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(clean(`AKN GLOBAL GROUP LTD | HESAP SAHIBI: ${BANK_INFO.accountHolder}`), margin + 4, y + 6);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(clean(`BANKA: ${BANK_INFO.bankName}  |  IBAN: ${BANK_INFO.iban}`), margin + 4, y + 12);
  doc.text(clean(`ILETISIM & WHATSAPP: ${ADMIN_PHONE}  |  E-POSTA: ${ADMIN_EMAILS[0]}`), margin + 4, y + 17.5);

  y += 3;
  checkPage(38);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('5. VERITABANI, KREDI DEFTERI VE ISLEM GUVENLIGI'), margin, y);
  y += 5;
  const persistenceItems = [
    'Paket kredileri sunucu katalogundaki 1 USD = 1 Kredi kuralina gore belirlenir; paket alimina sabit bonus eklenmez.',
    'Yonetici kredi duzeltmeleri PostgreSQL transaction, kullanici satir kilidi, reseller_credits, idempotency ve credit_ledger ile islenir.',
    'pg.Pool DATABASE_URL ve SSL ayarlariyla calisir; varsayilan havuz siniri 10, baglanti zaman asimi 10 saniyedir.',
    'Yazma dogrulanamazsa mutasyonlar gecici olarak durur ve kurtarma kontrolu dakikada bir calisir. 503 sonrasi tekrar gondermeden once siparis ve kredi defteri kontrol edilmelidir.',
    'Portal durum okumasi DB hatasinda 3 saniyeden en fazla 60 saniyeye geri cekilir; ayni anda ikinci polling istegi baslatilmaz.',
    'PgBouncer kullanimi ve transaction/session pooling modu canli DATABASE_URL ile dogrulanmalidir.',
  ];
  persistenceItems.forEach((item) => {
    checkPage(12);
    doc.setFontSize(7.7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(clean(`• ${item}`), pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 1.5;
  });

  doc.save(`AuraBio_Frekans_Teknik_Rapor_ve_Katalog_${new Date().toISOString().slice(0, 10)}.pdf`);
}
