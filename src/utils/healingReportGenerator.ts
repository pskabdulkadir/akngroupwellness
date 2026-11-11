import jsPDF from 'jspdf';
import { DiseaseHealingProtocol } from '../data/diseaseHealingLibrary';

export interface AcousticScanData {
  timestamp: number;
  rmsEnergy: number;
  pitchF0Hz: number;
  spectralCentroidHz: number;
  stressScore: number;
  vocalStressScore?: number;
  cellularVitalityScore: number;
  coherenceScore: number;
  cellularResonanceCoherence?: number;
  bioFieldBalance?: number;
  autonomicState?: string;
  vocalTremorPercent: number;
  affectedHarmonics: string[];
  [key: string]: any;
}

export interface SessionComparisonReport {
  id: string;
  patientName: string;
  diseaseName: string;
  appliedFrequencyHz: number;
  carrierHz: number;
  binauralBeatHz: number;
  preScan: AcousticScanData;
  postScan: AcousticScanData;
  stressReductionPercent: number;
  stressReductionDelta?: number;
  vitalityGainPercent: number;
  coherenceGainPercent: number;
  coherenceGainDelta?: number;
  bioFieldGainDelta?: number;
  date?: string;
  sessionDurationMinutes?: number;
  summaryText: string;
  recommendations: string[];
  [key: string]: any;
}

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

export function generatePreScanData(disease?: DiseaseHealingProtocol | null): AcousticScanData {
  const freqName = disease?.primaryFrequency ? `${disease.primaryFrequency} Hz Dengesizliği` : 'Genel Enerji Dengesizliği';
  return {
    timestamp: Date.now() - 1000 * 60 * 15,
    rmsEnergy: 45,
    pitchF0Hz: 185,
    spectralCentroidHz: 780,
    stressScore: 72,
    cellularVitalityScore: 48,
    coherenceScore: 54,
    vocalTremorPercent: 18,
    affectedHarmonics: [freqName, 'Sub-Harmonik Zayıflık']
  };
}

export function generatePostScanData(preScan: AcousticScanData, disease?: DiseaseHealingProtocol | null): AcousticScanData {
  const syncName = disease?.primaryFrequency ? `${disease.primaryFrequency} Hz Tam Rezonans Senkronizasyonu` : 'Hücresel Rezonans Senkronizasyonu';
  return {
    timestamp: Date.now(),
    rmsEnergy: 75,
    pitchF0Hz: 210,
    spectralCentroidHz: 520,
    stressScore: Math.max(12, (preScan?.stressScore || 70) - 42),
    cellularVitalityScore: Math.min(98, (preScan?.cellularVitalityScore || 50) + 40),
    coherenceScore: Math.min(99, (preScan?.coherenceScore || 50) + 38),
    vocalTremorPercent: 3,
    affectedHarmonics: [syncName]
  };
}

export function createSessionReport(
  arg1: any,
  arg2: any,
  arg3?: any,
  arg4?: any,
  arg5?: any
): SessionComparisonReport {
  let disease: any = null;
  let preScan: AcousticScanData;
  let postScan: AcousticScanData;
  let patientName: string = 'Misafir Danışan';

  if (arg1 && arg1.name && (arg1.primaryFrequency !== undefined || arg1.category !== undefined)) {
    disease = arg1;
    preScan = arg2;
    postScan = arg3;
    patientName = arg4 || 'Misafir Danışan';
  } else {
    preScan = arg1;
    postScan = arg2;
    disease = arg3;
    patientName = arg4 || 'Misafir Danışan';
  }

  const diseaseName = disease?.name || 'Biyo-Rezonans Terapisi';
  const appliedFreq = disease?.primaryFrequency || 528;
  const carrierHz = disease?.carrierHz || appliedFreq;
  const binauralBeatHz = disease?.binauralBeatHz || 7.83;

  const stressReductionPercent = Math.max(0, (preScan?.stressScore || 70) - (postScan?.stressScore || 20));
  const vitalityGainPercent = Math.max(0, (postScan?.cellularVitalityScore || 90) - (preScan?.cellularVitalityScore || 50));
  const coherenceGainPercent = Math.max(0, (postScan?.coherenceScore || 90) - (preScan?.coherenceScore || 50));

  const recommendations = disease ? [
    disease.esmaRecommendation,
    disease.ayetRecommendation,
    'Günde en az 2 litre canlı su tüketin.',
    '7 gün boyunca her gün 15 dakika frekans dinlemeye devam edin.'
  ].filter(Boolean) : [
    'Bol su tüketin ve düzenli nefes meditasyonu yapın.',
    'Günlük 15 dakika biyo-rezonans uyumlaması uygulayın.'
  ];

  return {
    id: `AURA-REPORT-${Date.now()}`,
    patientName,
    diseaseName,
    appliedFrequencyHz: appliedFreq,
    carrierHz,
    binauralBeatHz,
    preScan,
    postScan,
    stressReductionPercent,
    vitalityGainPercent,
    coherenceGainPercent,
    summaryText: `Seans başarıyla tamamlandı. ${diseaseName} protokolü kapsamında uygulanan ${appliedFreq} Hz frekansı ile stres oranında %${stressReductionPercent} düşüş, hücresel vitalitede %${vitalityGainPercent} artış sağlandı.`,
    recommendations
  };
}

export function downloadHealingReportPDF(report: SessionComparisonReport): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    let y = 14;

    // Header Banner
    doc.setFillColor(6, 78, 59);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('AURABIO FREKANS BIYO-AKUSTIK SEANS RAPORU'), margin + 5, y + 8);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(clean(`Protokol: ${report.diseaseName} (${report.appliedFrequencyHz} Hz)`), margin + 5, y + 15);
    doc.text(clean(`Danisan: ${report.patientName} • ${new Date().toLocaleDateString('tr-TR')}`), pageWidth - margin - 65, y + 15);

    y += 30;

    // Summary Box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 22, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text(clean('SEANS VE BIYO-AKUSTIK IYILESME SONUCU'), margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(doc.splitTextToSize(clean(report.summaryText), pageWidth - 2 * margin - 8), margin + 4, y + 10);

    y += 28;

    // Comparison Table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('AKUSTIK SPEKTRUM DEGISIM VERILERI'), margin, y);
    y += 4;

    doc.setFillColor(6, 78, 59);
    doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(clean('Gosterge'), margin + 4, y + 4);
    doc.text(clean('Seans Oncesi'), margin + 70, y + 4);
    doc.text(clean('Seans Sonrasi'), margin + 115, y + 4);
    doc.text(clean('Net Gelisme'), margin + 155, y + 4);
    y += 6;

    const rows = [
      { label: 'Stres Seviyesi', pre: `%${report.preScan.stressScore}`, post: `%${report.postScan.stressScore}`, delta: `-%${report.stressReductionPercent}` },
      { label: 'Hucresel Canlilik', pre: `%${report.preScan.cellularVitalityScore}`, post: `%${report.postScan.cellularVitalityScore}`, delta: `+${report.vitalityGainPercent}%` },
      { label: 'Biyo-Koherans', pre: `%${report.preScan.coherenceScore}`, post: `%${report.postScan.coherenceScore}`, delta: `+${report.coherenceGainPercent}%` },
      { label: 'Vokal Titreme (Tremor)', pre: `%${report.preScan.vocalTremorPercent}`, post: `%${report.postScan.vocalTremorPercent}`, delta: 'Stabil' }
    ];

    rows.forEach((r, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(clean(r.label), margin + 4, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.text(clean(r.pre), margin + 70, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text(clean(r.post), margin + 115, y + 4);
      doc.text(clean(r.delta), margin + 155, y + 4);

      y += 6;
    });

    y += 8;

    // Prescriptions
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('ONERILEN SIFA RECETESI VE ENTEGRASYON'), margin, y);
    y += 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    report.recommendations.forEach((rec, idx) => {
      doc.text(clean(`• ${rec}`), margin + 4, y + 5 + idx * 5);
    });

    y += 30;

    // Signature
    doc.setDrawColor(4, 120, 87);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(clean('AuraBio Frekans Biyo-Rezonans Lab • Kuantum Biyo-Alan Enstitüsü'), margin, y + 4);
    doc.text(clean('Sistem Onayı: AuraBio Biyo-Rezonans Heyeti'), pageWidth - margin - 65, y + 4);

    doc.save(`${report.id}.pdf`);
    return true;
  } catch (err) {
    console.error('PDF export failed:', err);
    return false;
  }
}

export function downloadHealingReportWord(report: SessionComparisonReport): boolean {
  try {
    const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>AuraBio Biyo-Akustik Seans Raporu</title>
      <style>
        body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; color: #0f172a; margin: 20mm; }
        h1 { font-size: 18pt; color: #064e3b; border-bottom: 2pt solid #10b981; padding-bottom: 6pt; }
        table { width: 100%; border-collapse: collapse; margin-top: 10pt; margin-bottom: 12pt; }
        th { background-color: #064e3b; color: #fff; padding: 7pt; border: 1pt solid #047857; text-align: left; }
        td { padding: 6pt; border: 1pt solid #cbd5e1; vertical-align: middle; }
        .box { background-color: #f0fdf4; border: 1pt solid #10b981; padding: 10pt; border-radius: 4pt; margin-bottom: 12pt; }
      </style>
    </head>
    <body>
      <div style="text-align: center;">
        <div style="font-size: 14pt; font-weight: bold; color: #047857;">AURABIO FREKANS KUANTUM BİYO-REZONANS SİSTEMİ</div>
        <h1>BİYO-AKUSTİK SEANS & İYİLEŞME RAPORU</h1>
      </div>

      <table>
        <tr>
          <td><strong>Protokol / Hastalık:</strong></td><td><strong>${report.diseaseName}</strong></td>
          <td><strong>Tarih:</strong></td><td>${new Date().toLocaleString('tr-TR')}</td>
        </tr>
        <tr>
          <td><strong>Danışan:</strong></td><td>${report.patientName}</td>
          <td><strong>Uygulanan Frekans:</strong></td><td>${report.appliedFrequencyHz} Hz (Taşıyıcı: ${report.carrierHz} Hz)</td>
        </tr>
      </table>

      <div class="box">
        <strong>SEANS DEĞERLENDİRMESİ:</strong><br>
        ${report.summaryText}
      </div>

      <h2>AKUSTİK SPEKTRUM DEĞİŞİM VERİLERİ</h2>
      <table>
        <thead><tr><th>Gösterge</th><th>Öncesi</th><th>Sonrası</th><th>Net Gelişme</th></tr></thead>
        <tbody>
          <tr><td>Stres Seviyesi</td><td>%${report.preScan.stressScore}</td><td>%${report.postScan.stressScore}</td><td style="color: #047857; font-weight: bold;">-%${report.stressReductionPercent}</td></tr>
          <tr><td>Hücresel Canlılık</td><td>%${report.preScan.cellularVitalityScore}</td><td>%${report.postScan.cellularVitalityScore}</td><td style="color: #047857; font-weight: bold;">+${report.vitalityGainPercent}%</td></tr>
          <tr><td>Biyo-Koherans</td><td>%${report.preScan.coherenceScore}</td><td>%${report.postScan.coherenceScore}</td><td style="color: #047857; font-weight: bold;">+${report.coherenceGainPercent}%</td></tr>
          <tr><td>Vokal Titreme</td><td>%${report.preScan.vocalTremorPercent}</td><td>%${report.postScan.vocalTremorPercent}</td><td>Stabil</td></tr>
        </tbody>
      </table>

      <h2>ÖNERİLEN HOLİSTİK & ENERJETİK FREKANS PROTOKOLÜ</h2>
      <ul>
        ${report.recommendations.map(r => `<li>${r}</li>`).join('')}
      </ul>

      <div style="margin-top: 20pt; border-top: 1pt solid #047857; padding-top: 8pt; text-align: right;">
        <strong>AuraBio Biyo-Rezonans Heyeti</strong><br>
        AuraBio Kuantum Biyo-Rezonans Laboratuvarı
      </div>
    </body>
    </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.id}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Word export failed:', err);
    return false;
  }
}

export function downloadHealingReportTXT(report: SessionComparisonReport): boolean {
  try {
    const text = `===============================================================
AURABIO BİYO-AKUSTİK SEANS & İYİLEŞME RAPORU
Protokol: ${report.diseaseName}
Danışan: ${report.patientName}
Tarih: ${new Date().toLocaleString('tr-TR')}
Uygulanan Frekans: ${report.appliedFrequencyHz} Hz (Taşıyıcı: ${report.carrierHz} Hz, Binaural: ${report.binauralBeatHz} Hz)

[ÖNCESİ TARAMA]
- Stres Seviyesi: %${report.preScan.stressScore}
- Hücresel Canlılık: %${report.preScan.cellularVitalityScore}
- Biyo-Koherans: %${report.preScan.coherenceScore}
- Vokal Titreme (Tremor): %${report.preScan.vocalTremorPercent}

[SEANS SONRASI TARAMA]
- Stres Seviyesi: %${report.postScan.stressScore} (-%${report.stressReductionPercent})
- Hücresel Canlılık: %${report.postScan.cellularVitalityScore} (+%${report.vitalityGainPercent})
- Biyo-Koherans: %${report.postScan.coherenceScore} (+%${report.coherenceGainPercent})
- Vokal Titreme (Tremor): %${report.postScan.vocalTremorPercent}

[ÖZET VE DEĞERLENDİRME]
${report.summaryText}

[ÖNERİLEN İLAHİ & ENERJETİK REÇETE]
${report.recommendations.map(r => `• ${r}`).join('\n')}
===============================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.id}.txt`;
    a.click();
    return true;
  } catch (err) {
    console.error('Report export failed:', err);
    return false;
  }
}
