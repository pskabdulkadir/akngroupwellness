import jsPDF from 'jspdf';

function clean(t: string): string {
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
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/→/g, '->')
    .replace(/➔/g, '->')
    .replace(/•/g, '-');
}

function triggerWordDownload(htmlContent: string, filename: string) {
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateStandardWordTemplate(title: string, subtitle: string, bodyHtml: string): string {
  return `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset='utf-8'>
    <title>${title}</title>
    <style>
      body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #0f172a; margin: 20mm; }
      h1 { font-size: 18pt; color: #064e3b; border-bottom: 2pt solid #10b981; padding-bottom: 6pt; margin-top: 10pt; }
      h2 { font-size: 13pt; color: #047857; border-left: 4pt solid #059669; padding-left: 8pt; margin-top: 14pt; }
      table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; font-size: 10pt; }
      th { background-color: #064e3b; color: #fff; padding: 7pt; border: 1pt solid #047857; text-align: left; }
      td { padding: 6pt; border: 1pt solid #cbd5e1; vertical-align: middle; }
      tr:nth-child(even) { background-color: #f8fafc; }
      .box { background-color: #f0fdf4; border: 1pt solid #10b981; padding: 10pt; border-radius: 4pt; margin-bottom: 12pt; }
    </style>
  </head>
  <body>
    <div style="text-align: center; margin-bottom: 14pt;">
      <div style="font-size: 14pt; font-weight: bold; color: #047857;">AURABIO FREKANS KUANTUM BİYO-REZONANS SİSTEMİ</div>
      <h1>${title}</h1>
      <p style="font-size: 11pt; color: #059669; font-weight: bold; margin-top: 0;">${subtitle}</p>
      <p style="font-size: 9pt; color: #64748b;">Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}</p>
    </div>
    ${bodyHtml}
    <div style="margin-top: 24pt; border-top: 1pt solid #047857; padding-top: 8pt; text-align: right;">
      <strong>AuraBio Biyo-Rezonans Heyeti</strong><br>
      <em>AuraBio Frekans Kuantum Biyo-Rezonans & Frekans Enstitüsü</em>
    </div>
  </body>
  </html>
  `;
}

export function downloadHolisticJourneyReportWord(paramsOrProgram: any, completedDays?: number): void {
  const title = paramsOrProgram?.programTitle || paramsOrProgram?.title || '7 Günlük Bütünsel Arınma Kampı';
  const subtitle = paramsOrProgram?.programSubtitle || paramsOrProgram?.subtitle || 'Biyo-Alan & Çakra Hizalanma Raporu';
  const day = paramsOrProgram?.currentDay || completedDays || 1;
  const user = paramsOrProgram?.userName || 'Değerli Kullanıcı';

  const body = `
    <div class="box">
      <strong>KAMP VE ARINMA ÖZETİ:</strong><br>
      Sayın <strong>${user}</strong>, 7 Günlük Bütünsel Arınma Kampında <strong>${day}. Gün</strong> başarıyla tamamlanmıştır. Kökten Taç çakraya enerji akışı dengelenmiş ve hücresel arınma protokolü aktiftir.
    </div>
    <h2>GÜNLÜK HİZALANMA VE SEANS VERİLERİ</h2>
    <table>
      <tr><td><strong>Kullanıcı / Danışan:</strong></td><td>${user}</td></tr>
      <tr><td><strong>Tamamlanan Gün:</strong></td><td>${day} / 7 Gün</td></tr>
      <tr><td><strong>Uygulanan Seanslar:</strong></td><td>Sabah (Güneş & Kök), Öğle (Kalp & Hizalanma), Gece (Hücresel Detoks)</td></tr>
      <tr><td><strong>Genel Dengeleme Puanı:</strong></td><td style="color: #047857; font-weight: bold;">%94 Tam Uyum</td></tr>
    </table>
  `;

  triggerWordDownload(generateStandardWordTemplate(title, subtitle, body), `AuraBio_7_Gunluk_Kamp_Raporu_${day}_Gun.doc`);
}

export function downloadHolisticJourneyReportPDF(paramsOrProgram: any, completedDays?: number): void {
  const title = paramsOrProgram?.programTitle || paramsOrProgram?.title || '7 Gunluk Butunsel Arinma Kampi';
  const day = paramsOrProgram?.currentDay || completedDays || 1;
  const user = paramsOrProgram?.userName || 'Degerli Danisan';

  const doc = new jsPDF();
  doc.setFillColor(6, 78, 59);
  doc.rect(14, 14, 182, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('AURABIO FREKANS - 7 GUNLUK ARINMA KAMPI RAPORU'), 18, 22);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(clean(`Danisan: ${user} • Gun: ${day}/7 • Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 18, 29);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(clean(`Sayin ${user}, 7 Gunluk Butunsel Arinma programinda ${day}. gun basariyla tamamlanmistir.`), 14, 45);
  doc.text(clean('Kokten Taca enerji merkezlerindeki blokajlar temizlenmis ve hucre koheransi saglanmistir.'), 14, 52);

  doc.save(`AuraBio_7_Gunluk_Kamp_Raporu_${day}_Gun.pdf`);
}

export function downloadWearableReportWord(data: any): void {
  const body = `
    <div class="box">
      <strong>CANLI BİYOMETRİK SENSÖR VERİLERİ (BLE GATT):</strong><br>
      Aura-Sync akıllı saat köprüsü üzerinden okunan anlık kardiyovasküler ve HRV otonom sinir sistemi verileri.
    </div>
    <table>
      <tr><td><strong>Bağlı Cihaz:</strong></td><td>${data?.deviceName || 'Biyo-Sensör (GATT Heart Rate)'}</td></tr>
      <tr><td><strong>Canlı Nabız (Heart Rate):</strong></td><td><strong>${data?.heartRate || 72} BPM</strong></td></tr>
      <tr><td><strong>Kalp Hızı Değişkenliği (HRV):</strong></td><td><strong>${data?.hrv || 60} ms</strong></td></tr>
      <tr><td><strong>Stres Yükü İndeksi:</strong></td><td>%${data?.stressLevel || 28} (Normal / Sakin)</td></tr>
    </table>
  `;
  triggerWordDownload(generateStandardWordTemplate('BİYOMETRİK SENSÖR & NABIZ RAPORU', 'Aura-Sync Akıllı Saat Canlı Köprüsü', body), 'AuraBio_Biyometrik_Sensor_Raporu.doc');
}

export function downloadWearableReportPDF(data: any): void {
  const doc = new jsPDF();
  doc.setFillColor(6, 78, 59);
  doc.rect(14, 14, 182, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('AURABIO FREKANS - BIYOMETRIK SENSOR RAPORU'), 18, 22);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(clean(`Cihaz: ${data?.deviceName || 'Bio-Sensor'} • Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 18, 29);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(clean(`Nabiz: ${data?.heartRate || 72} BPM | HRV: ${data?.hrv || 60} ms | Stres: %${data?.stressLevel || 28}`), 14, 45);

  doc.save('AuraBio_Biyometrik_Sensor_Raporu.pdf');
}

export function downloadMindSpaceReportWord(sessions: any[]): void {
  const body = `
    <div class="box">
      <strong>MINDSPACE STUDIO ZİHİN VE FREKANS SEANSLARI:</strong><br>
      Toplam ${sessions?.length || 0} adet meditasyon, nefes ve bio-rezonans seansı başarıyla kaydedilmiştir.
    </div>
    <table>
      <thead><tr><th>Tarih</th><th>Süre</th><th>Taşıyıcı Hz</th><th>Başlangıç Stres</th><th>Bitiş Stres</th></tr></thead>
      <tbody>
        ${(sessions || []).slice(0, 10).map((s: any) => `
          <tr>
            <td>${s.dateFormatted || new Date(s.timestamp || Date.now()).toLocaleDateString('tr-TR')}</td>
            <td>${s.durationMinutes || 15} Dk</td>
            <td>${s.carrierFrequencyHz || 528} Hz</td>
            <td>%${s.initialStress || 70}</td>
            <td style="color: #047857; font-weight: bold;">%${s.finalStress || 20}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  triggerWordDownload(generateStandardWordTemplate('MINDSPACE STUDIO SEANS RAPORU', 'Zihin Laboratuvarı & Günlük Arşivi', body), 'AuraBio_MindSpace_Seans_Raporu.doc');
}

export function downloadMindSpaceReportPDF(sessions: any[]): void {
  const doc = new jsPDF();
  doc.setFillColor(6, 78, 59);
  doc.rect(14, 14, 182, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('AURABIO MINDSPACE STUDIO SEANS RAPORU'), 18, 22);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(clean(`Toplam Seans: ${sessions?.length || 0} • Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 18, 29);

  doc.save('AuraBio_MindSpace_Seans_Raporu.pdf');
}

export function downloadMandalaReportWord(data?: any): void {
  const body = `
    <div class="box">
      <strong>KUTSAL GEOMETRİ MANDALA SENTEZİ:</strong><br>
      Kuantum Çakra rezonansına göre hesaplanan Yaşam Çiçeği, Torus ve Metatron Küpü geometrik frekans matrisi.
    </div>
  `;
  triggerWordDownload(generateStandardWordTemplate('KUTSAL GEOMETRİ MANDALA RAPORU', 'Frekans Tabanlı Geometrik Şifa', body), 'AuraBio_Mandala_Raporu.doc');
}

export function downloadMandalaReportPDF(data?: any): void {
  const doc = new jsPDF();
  doc.setFillColor(6, 78, 59);
  doc.rect(14, 14, 182, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('AURABIO KUTSAL GEOMETRI MANDALA RAPORU'), 18, 22);
  doc.save('AuraBio_Mandala_Raporu.pdf');
}

export function downloadCircadianReportWord(data?: any): void {
  const body = `
    <div class="box">
      <strong>24 SAATLİK SİRKADİYEN RİTİM & ORGAN MERİDYENLERİ:</strong><br>
      Geleneksel Çin Tıbbı organ saatleri, melatonin-kortizol hormon döngüsü ve optimum biyolojik şifa zamanlaması.
    </div>
  `;
  triggerWordDownload(generateStandardWordTemplate('SİRKADİYEN RİTİM & BİYO-SAAT RAPORU', 'Organ Meridyen Fazları ve Işık Spektrumu', body), 'AuraBio_Sirkadiyen_Raporu.doc');
}

export function downloadCircadianReportPDF(data?: any): void {
  const doc = new jsPDF();
  doc.setFillColor(6, 78, 59);
  doc.rect(14, 14, 182, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('AURABIO SIRKADIYEN RITIM & ORGAN MERIDYEN RAPORU'), 18, 22);
  doc.save('AuraBio_Sirkadiyen_Raporu.pdf');
}

export function downloadHeatmapReportWord(data?: any): void {
  const body = `
    <div class="box">
      <strong>KÜRESEL HUZUR VE FREKANS ISI HARİTASI:</strong><br>
      Dünya genelinde o anda aktif olan biyo-rezonans seansları ve kolektif frekans koherans verileri.
    </div>
  `;
  triggerWordDownload(generateStandardWordTemplate('KÜRESEL FREKANS ISI HARİTASI RAPORU', 'Kolektif Bilinç ve Rezonans Analizi', body), 'AuraBio_IsiHaritasi_Raporu.doc');
}

export function downloadHeatmapReportPDF(data?: any): void {
  const doc = new jsPDF();
  doc.setFillColor(6, 78, 59);
  doc.rect(14, 14, 182, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(clean('AURABIO KURESEL HUZUR ISI HARITASI RAPORU'), 18, 22);
  doc.save('AuraBio_IsiHaritasi_Raporu.pdf');
}

export const downloadGlobalHeatmapReportWord = downloadHeatmapReportWord;
export const downloadGlobalHeatmapReportPDF = downloadHeatmapReportPDF;
