import jsPDF from 'jspdf';
import { MEMBERSHIP_PACKAGES, BANK_INFO, ADMIN_PHONE, ADMIN_EMAILS } from '../utils/authManager';
import { TOTAL_HEALING_COUNT } from '../data/healingLibrary';
import { CAREER_TIERS, FREKANS_PACKAGES, MONOLINE_DEPTH_RATES } from '../types/monoline';
import { formatUsd } from './currency';

/**
 * Downloads a Word-compatible .doc file (HTML-based Word format with official styling, tables and formatting)
 * Word opens this natively and perfectly preserves tables, colors, headings, bullet points and fonts.
 */
export function downloadTechnicalReportWord(): void {
  const content = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset='utf-8'>
    <title>AuraBio Frekans v6.0 - İş Sunum Raporu, Katalog ve Monoline 7 Nefis MLM Sistemi</title>
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
      <h1 style="border: none; margin-top: 2pt; margin-bottom: 4pt; color: #064e3b;">AURABIO FREKANS BİYO-REZONANS &amp; MONOLINE 7 NEFİS MLM SİSTEMİ</h1>
      <p style="font-size: 13pt; font-weight: bold; color: #059669; margin-top: 0;">RESMİ İŞ SUNUM RAPORU, DİJİTAL KATALOG, TEKNİK MİMARİ VE 15 BAYİ PAKETİ TEKLİFİ</p>
      <p style="font-size: 9pt; color: #64748b;">Kurumsal Üretici: AuraBio Kuantum Biyo-Rezonans &amp; Frekans Enstitüsü • Sistem Sürümü: v6.0 Enterprise</p>
    </div>

    <div class="highlight-box">
      <strong>YÖNETİCİ ÖZETİ (v6.0 Enterprise):</strong> AuraBio Frekans; modern optik foton spektrometresi, <strong>3D Biyo-Aura &amp; Çakra Simülatörü</strong>, <strong>Aura-Sync Akıllı Saat Biyometrik Canlı Köprüsü (Web BLE)</strong>, <strong>MindSpace Studio (Aura-Journal, Circadian, Voice Forge, Dream Decoder, Group Sync)</strong>, <strong>AI Kutsal Geometri Mandala Üreticisi</strong>, <strong>7 Günlük Bütünsel Arınma Kampları</strong>, <strong>Anonim Küresel Frekans Haritası</strong>, <strong>50+ Hastalık Şifa Ansiklopedisi</strong>, <strong>10s Ön/Son Vokal Biyo-Akustik Tarama Motoru</strong>, <strong>8 Sekmeli Entegre Biyo-Rezonans Raporlama</strong>, Doğu-Batı sentezi <strong>${TOTAL_HEALING_COUNT}+ Kadim Şifa Frekansı</strong> ve küresel tek hatlı <strong>Monoline 7 Nefis Mertebesi MLM &amp; 15 Kredi Havuzu Paketi</strong> mimarisini tek bir dijital platformda birleştiren yeni nesil Kuantum Biyo-Rezonans ve Gelir Ortaklığı Ekosistemidir.
    </div>

    <h2>1. TEMEL SİSTEM ÖZELLİKLERİ VE BİYO-REZONANS TEKNOLOJİLERİ (v6.0 Enterprise)</h2>
    <ul>
      <li><strong>📷 Canlı Optik &amp; 3D Biyo-Aura Spektrometre:</strong> Kamera üzerinden foton ve renk tayfı analiziyle 7 ana çakra, 7 aura katmanı ve 5 kalp letaifinin enerjetik durumunu 3D simülatör üzerinde canlı haritalandırır.</li>
      <li><strong>🎙️ 10 Saniyelik Ön / Son Biyo-Akustik Tarama Motoru:</strong> Mikrofon üzerinden vokal harmonik ve temel frekans (F0) analizi. Seans öncesi (Pre-Scan) ve seans sonrası (Post-Scan) ses kayıtlarını karşılaştırarak hücrelerdeki biyo-rezonans denge artışını somut grafiklerle raporlar.</li>
      <li><strong>🧠 MindSpace Studio &amp; Yaşam Koçu (Aura-Journal):</strong> Bütüncül terapötik perspektif ve kadim arketipler (Esma, Çakra, Element) süzgecinde sesli veya yazılı günlük analizi, duygu yoğunluk eğrileri, kişiselleştirilmiş içsel rehberlik ve frekans reçeteleri.</li>
      <li><strong>☀️ 24 Saatlik Biyo-Ritim &amp; Circadian Synchronizer:</strong> Geleneksel Çin Tıbbı (TCM) 24 saatlik organ meridyen saatleri, biyolojik kortizol/melatonin hormon fazları ve ışık dalga boyu optimizasyonu.</li>
      <li><strong>🎛️ Sesli &amp; Niyetli Frekans Labirenti (Voice-Intention Forge):</strong> Web Audio API çoklu osilatör mimarisi ile niyetin ses tonu üzerinden spektral analizi, taşıyıcı ve harmonik frekans sentezi, 7.83 Hz Schumann rezonansı eşliğinde interaktif labirent akortlama.</li>
      <li><strong>🌙 Rüya &amp; Bilinçaltı Çözümleyicisi (Dream Decoder):</strong> Rüya metni veya ses kaydından Jungiyen/Kadim arketipleri, psiko-spiritüel anlamları ve bloke çakraları saptayıp gece frekansı reçetesi hazırlayan analiz motoru.</li>
      <li><strong>👥 Kurumsal &amp; Aile Çemberi (Group Aura Sync):</strong> Çoklu cihazların sesle veya QR kodla eşleştiği, ortak HRV ve biyo-alan tutarlılık indeksi (Group Coherence) üreten kolektif frekans çemberi.</li>
      <li><strong>⌚ Aura-Sync Akıllı Saat Köprüsü (Web BLE):</strong> Standart Bluetooth GATT Kalp Hızı Profili (UUID 0x180D) ile anlık nabız ve HRV okuma. Taşikardi veya stres anında otomatik frekans gevşeme adaptasyonu.</li>
      <li><strong>🌌 Kutsal Geometri Mandala Üreticisi:</strong> HTML5 Canvas tabanlı Çakra ve Solfejyo frekansına göre dinamik Yaşam Çiçeği, Torus, Sri Yantra ve Metatron Küpü geometrileri. Yüksek çözünürlüklü PNG ve PDF dışa aktarma.</li>
      <li><strong>🧭 7 Günlük Bütünsel Arınma Kampları (Holistic Journey):</strong> Kökten Taç çakraya kadar Sabah (Uyanış), Öğle (Hizalanma) ve Gece (Hücresel Detoks) mikro seanslarıyla yapılandırılmış program ve bulut ilerleme sistemi.</li>
      <li><strong>🌍 Anonim Küresel Frekans Haritası (Heatmap):</strong> Dünya genelinde o anda aktif olan biyo-rezonans seanslarını, baskın küresel niyet dalgasını ve kıtasal enerji dağılımını canlı görselleştirme.</li>
      <li><strong>🌿 Şifa Ansiklopedisi &amp; 50+ Hastalık Frekans Matrisi:</strong> Nörolojik, kardiyovasküler, metabolik, psikosomatik, iskelet-kas, bağışıklık ve kadim enerjetik alanlarda 50'den fazla hastalığın Solfejyo, Rife ve Sufi makam frekans reçeteleri ve 3 aşamalı iyileşme takvimleri.</li>
      <li><strong>📊 8 Sekmeli Entegre Raporlama &amp; Dönüşüm Karşılaştırması:</strong> İlim Kapı, Genel Bakış, Duygular, Aura Katmanları, Çakralar, Letaifler, Kişisel Reçeteler ve Tüm İnovasyonlar sekmeleri. Yüklenen şifa frekansının otomatik rapora işlenmesi ve PDF/Word dışa aktarımı.</li>
      <li><strong>Evrensel 6'lı Kadim Şifa Kütüphanesi (${TOTAL_HEALING_COUNT}+ Frekans):</strong> İslami Esma &amp; Şifa Sureleri, Uzak Doğu 7 Çakra &amp; Solfejyo Matrisi, 5 Kadim Element &amp; Schumann Rezonansı, Anadolu Sufi Mûsikîsi 25 Makam Terapisi, Şamanik Davul Teta Transı ve Keltik-İskandinav Rün Akustiği.</li>
    </ul>

    <h2>2. ÇİFT MOTORLU HİBRİT KOMİSYON MİMARİSİ &amp; 7 NEFİS MERTEBESİ MLM GELİR MODELİ</h2>
    <p>AuraBio Frekans bayilik ekosistemi, çalışan liderleri ödüllendiren Unilevel ve pasif üyeleri sistemde tutan Küresel Monoline hattını aynı anda çalıştıran Çift Motorlu Hibrit Komisyon Mimarisi ile çalışır:</p>
    <ul>
      <li><strong>1. Danışan Seans Geliri (Perakende Kâr):</strong> Bayiler seans kredi havuzundan $1.21 – $3.16 birim maliyetle kullandıkları seansları danışanlarına $30 – $70 aralığında uygulayarak yüksek perakende kâr elde eder.</li>
      <li><strong>2. %20 Direkt Sponsor Satış Primi:</strong> Bayinin kendi referans koduyla davet ettiği üyelerin satın aldığı tüm paketlerden anında <strong>%20 Direkt Sponsor Primi</strong> Sponsor Cüzdanına yansır.</li>
      <li><strong>3. Motor 1 — Ekip Kurma &amp; Liderlik Kazancı (Unilevel 7 Derinlik - %25):</strong> &ldquo;Kendi ekibinizi kurun, dikeyde 7 derinliğe kadar oluşan tüm cirodan %25'e varan pay alın!&rdquo; (1. Derinlik %7, 2. Derinlik %5, 3. Derinlik %4, 4. Derinlik %3, 5-7. Derinlik %2; 8. ebeveynde durur).</li>
      <li><strong>4. Motor 2 — Küresel Sıra Pasif Teşviki (Monoline Global Line - %5):</strong> &ldquo;Sisteme erken dahil olmanın avantajını yaşayın! Arkanızdan gelen küresel sıranın ilk 7 derinliğinden %5'lik havuzdan sembolik teşvik primi kazanın.&rdquo; (1. Sıra %1.50, 2. Sıra %1.00, 3. Sıra %0.80, 4. Sıra %0.60, 5. Sıra %0.50, 6-7. Sıra %0.30).</li>
      <li><strong>5. %5 Sistem Fonu &amp; 7 Nefis Kariyer Havuzu:</strong> Her siparişin %5'i Sistem / Kariyer Havuzuna aktarılır. 7 Nefis Mertebesine ulaşan bayiler havuzdan ek pay (%2 - %10) ve yönetici tarafından cüzdanlarına anında aktarılan Kariyer Bonusları kazanır.</li>
      <li><strong>5. Liderlik Eşleşme Bonusu (Matching %20):</strong> Alt ekibinizdeki liderlerin kazançları üzerinden 1. Nesil %10, 2. Nesil %5 ve 3. Nesil %5 oranında doğrudan cüzdanınıza yatan liderlik primi.</li>
      <li><strong>6. Unilevel Sonsuzluk Primi (Infinity %1 - %7):</strong> Kariyer basamağınıza göre 8. derinlikten sonsuz derinliğe kadar tüm organizasyon cironuzdan aldığınız diferansiyel fark primi.</li>
      <li><strong>7. &ldquo;3 Getir Bedavaya Getir&rdquo; Fast-ROI İkramiyesi (+%15):</strong> İlk 3 direkt satışınızda %60 sponsor primine ek olarak anında +%15 Fast-ROI ikramiyesi ödenir; toplam %75 nakit iade ile paket maliyetiniz sıfırlanır.</li>
      <li><strong>8. 48 Saatlik FOMO Kaçırma Koruması &amp; Kurtarma:</strong> Pasife düşen bayinin alt ekibinden komisyon kaçmasını engelleyen geri sayım ve tek tıkla kurtarma mekanizması.</li>
      <li><strong>9. Bayiler Arası P2P Transfer &amp; Aktivasyon Kuponları:</strong> Bayiler kazanç bakiyelerini alt bayilerine aktarabilir veya üyelik hediye kuponları oluşturabilir.</li>
      <li><strong>10. Esnek 30 Günlük Aktiflik Kuralı:</strong> Her ay zorunlu paket alımı yoktur; 1 paket satın alma VEYA 1 yeni üye kaydetme ile aktiflik ücretsiz korunur.</li>
    </ul>

    <h2>3. BDDK &amp; TCMB YASAL UYUM STANDARTLARI (3D SECURE SANAL POS &amp; RESMİ TR IBAN)</h2>
    <div class="highlight-box">
      <strong>MEVZUAT VE GÜVENLİK GÜVENCESİ:</strong><br>
      • <strong>256-Bit SSL 3D Secure Sanal POS:</strong> Tüm paket alımları PCI-DSS sertifikalı lisanslı Sanal POS üzerinden Kredi/Banka Kartı ile tahsil edilir; elden nakit veya kripto kabul edilmez.<br>
      • <strong>4'lü Yasal Sözleşme Onayı (v6.0):</strong> Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi, KVKK Aydınlatma Metni ve MLM Bayilik Sözleşmesi zaman damgası ve IP kaydıyla saklanır.<br>
      • <strong>14 Günlük Cayma Koruması &amp; Bloke Havuzu:</strong> Yasal cayma süresince komisyonlar Pending Balance havuzunda güvende tutulur; iptallerde Clawback iadesi yapılır.<br>
      • <strong>Resmi TR IBAN Banka Transferi:</strong> Komisyon çekimleri yalnızca bayinin kendi adına kayıtlı Türkiye Cumhuriyeti banka hesabına (TR IBAN) transfer edilir.<br>
      • <strong>%20 Kurumsal Fatura / Stopaj İadesi:</strong> Fatura kesen şirket sahibi bayiler %20 vergi kesintisini geri alabilir.
    </div>

    <h2>4. 14 RESMİ BAYİLİK &amp; SEANS KREDİSİ HAVUZU ALIŞVERİŞ PAKETİ</h2>
    <p>Bayi Back-Office üzerinden satın alınabilen ve anında seans kredisi + Monoline komisyon dağıtımı tetikleyen 14 resmi paket:</p>
    <table>
      <thead>
        <tr>
          <th>Kademe</th>
          <th>Paket Adı</th>
          <th>Kategori</th>
          <th>Seans Kredisi</th>
          <th>Birim Maliyet</th>
          <th>Paket Fiyatı</th>
          <th>%20 Sponsor Primi</th>
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

    <h2>4. EVRENSEL 6'LI KADİM ŞİFA EKOLÜ VE FREKANS DAĞILIMI</h2>
    <table>
      <thead>
        <tr>
          <th>Ekol / Kategori</th>
          <th>İçerik</th>
          <th>Frekans Aralığı</th>
          <th>Terapötik Etki &amp; Enstrüman Karakteri</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. İslami Kadim Şifa</strong></td>
          <td>52 Frekans</td>
          <td>111 Hz – 999 Hz</td>
          <td>Ebced tabanlı Esma-i Hüsna titreşimleri (Ya Şafi 391 Hz, Ya Vedud 432 Hz vb.), Kur'an şifa ayetleri, 4-7-8 zikir nefesi ve ney tınıları.</td>
        </tr>
        <tr>
          <td><strong>2. Çakra &amp; Solfejyo</strong></td>
          <td>50 Frekans</td>
          <td>174 Hz – 963 Hz</td>
          <td>7 temel çakra, antik solfejyo oktavları, Prana dolaşımı ve 7 metal alaşımlı Tibet şarkı söyleyen çanakları.</td>
        </tr>
        <tr>
          <td><strong>3. 5 Element &amp; Doğa</strong></td>
          <td>50 Frekans</td>
          <td>194.18 Hz – 852 Hz</td>
          <td>Toprak (194 Hz), Su (417 Hz), Ateş (528 Hz), Hava (639 Hz), Eter (741 Hz) ve Schumann 7.83 Hz yerküre rezonansı.</td>
        </tr>
        <tr>
          <td><strong>4. Anadolu Sufi Mûsikîsi</strong></td>
          <td>50 Frekans</td>
          <td>216 Hz – 528 Hz</td>
          <td>Selçuklu ve Osmanlı darüşşifalarında uygulanan 25 kadim makam terapisi (Rast, Hicaz, Nihavend, Buselik vb.) ve Mevlevi ney taksimleri.</td>
        </tr>
        <tr>
          <td><strong>5. Şamanik Davul Transı</strong></td>
          <td>50 Frekans</td>
          <td>136.1 Hz – 432 Hz</td>
          <td>Beyni 4.5 Hz derin Teta bandına indiren 120-135 BPM monoritmik davul vuruşları, Sibirya/Altay köklenme ritimleri, ateş akustiği.</td>
        </tr>
        <tr>
          <td><strong>6. Kelt &amp; İskandinav</strong></td>
          <td>50 Frekans</td>
          <td>285 Hz – 741 Hz</td>
          <td>13 Kutsal Kelt ağacı (Ogham takvimi), gümüş telli Keltik arp, Tagelharpa yaylısı ve Futhark rün biyo-alan koruması.</td>
        </tr>
      </tbody>
    </table>

    <h2>5. BİREYSEL ÜYELİK VE SÜRELİ LİSANS PAKETLERİ</h2>
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

    <h2>6. RESMİ ÜRETİCİ &amp; İLETİŞİM BİLGİLERİ</h2>
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

    <div class="footer-note">
      Bu resmi iş sunum raporu ve katalog AKN GLOBAL GROUP LTD bünyesindeki AuraBio Frekans Kuantum Biyo-Rezonans ve Monoline 7 Nefis MLM Sistemi (v6.0 Enterprise) tarafından oluşturulmuştur.<br>
      © ${new Date().getFullYear()} AKN GLOBAL GROUP LTD • AuraBio Frekans. Tüm Hakları Saklıdır.
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
  link.download = `AuraBio_Frekans_Is_Sunumu_ve_Katalog_v6_${new Date().toISOString().slice(0, 10)}.doc`;
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
      doc.text(clean('AuraBio Frekans - Resmi Is Sunum Raporu, Katalog & Monoline 7 Nefis MLM (v6.0)'), margin, 10);
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
  doc.text(clean('Resmi Is Sunum Raporu, Biyo-Rezonans Mimarisi, 15 Bayi Paketi ve Gelir Modeli'), margin + 5, y + 16);
  doc.text(clean(`Surum: v6.0 • Tarih: ${new Date().toLocaleDateString('tr-TR')}`), pageWidth - margin - 52, y + 16);

  y += 30;

  // Section 1: Executive Summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('1. SISTEM TANIMI VE YONETICI OZETI (v6.0 ENTERPRISE)'), margin, y);
  y += 5;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 28, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');
  const summaryText = clean(
    `AuraBio Frekans; canli optik foton spektrometresi, 3D Biyo-Aura Simulatoru, 10s On/Son Vokal Biyo-Akustik Tarama, Aura-Sync Akilli Saat Koprusu (Web BLE), MindSpace Studio, Kutsal Geometri Mandala Ureticisi, 7 Gunluk Arinma Kamplari, 50+ Hastalik Sifa Ansiklopedisi, 8 Sekmeli Raporlama, ${TOTAL_HEALING_COUNT}+ Kadim Sifa Frekansi ve Kuresel Tek Hatli Monoline 7 Nefis MLM (%20 Direkt Sponsor + %25 7 Derinlik Tek Hat + %50 Kariyer Havuzu) gelir ortakligini tek bir platformda birlestiren yeni nesil sistemdir.`
  );
  doc.text(doc.splitTextToSize(summaryText, pageWidth - 2 * margin - 8), margin + 4, y + 5);
  y += 33;

  // Section 2: Monoline 7 Nefis MLM & 4 Revenue Streams
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('2. MONOLINE 7 NEFIS MLM VE 4 KAPILI GELIR ORTAKLIGI MODELI'), margin, y);
  y += 5;

  const mlmItems = [
    '1. Danisan Seans Kari: 15 kredi paketinde $1.21-$3.16 birim maliyet ile $30-$70 seans uygulamasi.',
    '2. %20 Direkt Sponsor Primi: Referans kodunuzla kaydolan uyelerin her paket alimindan aninda %20 nakit komisyon.',
    '3. Motor 1 (%25 Unilevel 7 Derinlik): Ust 7 kademeye %7, %5, %4, %3, %2, %2, %2 seklinde sponsor agacindan dagitim.',
    '4. Motor 2 (%5 Kuresel Monoline Tesviki): Kuresel kuyrukta ust 7 siraya %1.50, %1.00, %0.80, %0.60, %0.50, %0.30, %0.30.',
    '5. %5 Sistem/Kariyer Fonu & Bonuslar: Nefs-i Emmare -> Nefs-i Kamile 7 mertebe havuz payi (%2-%10) ve anlik cuzdana bonus.',
    '6. Liderlik Eslesme Bonusu (Matching %20): 1. Nesil %10, 2. Nesil %5, 3. Nesil %5 derinlik kazanci.',
    '7. 3 Getir Bedavaya Getir (+%15 Fast-ROI): Ilk 3 direkt satista toplam %75 nakit iade ile paket maliyeti sifirlama.',
    '8. Yasal Uyum: BDDK/TCMB 3D Secure Sanal POS, 14 Gun Cayma Blokesi, Sahsi TR IBAN ve %20 Stopaj/Fatura Iadesi.'
  ];

  mlmItems.forEach((item) => {
    checkPage(8);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 7, 1, 1, 'FD');
    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(clean(item), margin + 3, y + 4.8);
    y += 8.5;
  });

  y += 2;
  checkPage(45);

  // Section 3: 7 Nefis Mertebesi Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('3. 7 NEFIS MERTEBESI KARIYER VE DERINLIK KILIDI MATRISI'), margin, y);
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

  // Section 4: 15 Official Packages
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('4. 14 RESMI BAYILIK VE SEANS KREDISI HAVUZU ALISVERIS PAKETI'), margin, y);
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
      clean(`${formatUsd(pkg.defaultPrice)}  |  Sponsor (%20): ${formatUsd(pkg.defaultPrice * 0.2)}`),
      pageWidth - margin - 68,
      y + 4.4
    );
    y += 7.3;
  });

  y += 3;
  checkPage(30);

  // Section 5: Official Contact & Bank Info
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

  doc.save(`AuraBio_Frekans_Is_Sunumu_ve_Katalog_v6_${new Date().toISOString().slice(0, 10)}.pdf`);
}
