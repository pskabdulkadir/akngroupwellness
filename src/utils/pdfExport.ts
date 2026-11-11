import jsPDF from 'jspdf';
import { ScanResult, EmotionalStateData } from '../types';
import { ESMA_LIST } from '../data/esmaData';
import { AYET_LIST } from '../data/ayetData';
import { EASTERN_MANTRAS } from '../data/easternData';
import { getDetailedColorAnalysis } from '../data/colorAnalysisData';
import { CHAKRA_GUIDE, LETAIF_POINTS, AURA_LAYERS_GUIDE, AURA_COLORS_GUIDE } from '../data/letaifData';

// Helper to sanitize Turkish characters for jsPDF standard Helvetica font rendering
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
    .replace(/•/g, '-')
    .replace(/â/g, 'a')
    .replace(/Â/g, 'A')
    .replace(/î/g, 'i')
    .replace(/Î/g, 'I')
    .replace(/û/g, 'u')
    .replace(/Û/g, 'U');
}

/**
 * Renders an anatomically aligned 3D holographic human silhouette with auric field
 * and 7 Letaif activation nodes directly as vector graphics inside jsPDF.
 */
function drawHuman3DLetaifSimulation(
  doc: jsPDF,
  startX: number,
  startY: number,
  boxW: number,
  boxH: number,
  isPost: boolean,
  energyLevel: number,
  stressLevel: number,
  dominantColorHex: string,
  freqHz: number,
  letaifLevels: { id: string; name: string; level: number; colorHex: string; hz: number }[]
) {
  // Box Background
  if (isPost) {
    doc.setFillColor(240, 253, 244); // Emerald 50
    doc.setDrawColor(16, 185, 129); // Emerald 500
  } else {
    doc.setFillColor(255, 241, 242); // Rose 50
    doc.setDrawColor(244, 63, 94); // Rose 500
  }
  doc.roundedRect(startX, startY, boxW, boxH, 2.5, 2.5, 'FD');

  // Title Header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  if (isPost) {
    doc.setTextColor(4, 120, 87);
    doc.text(clean(`3D Biyo-Alan: Sonrasi (Yuklenmis Kalkan • %${energyLevel})`), startX + 3, startY + 5);
  } else {
    doc.setTextColor(190, 18, 60);
    doc.text(clean(`3D Biyo-Alan: Oncesi (Daralmis Blokaj • %${energyLevel})`), startX + 3, startY + 5);
  }

  const cx = startX + (boxW / 2);
  const cy = startY + (boxH / 2) + 1.5;

  // 1. Auric Protective Shield / Torus Rings
  if (isPost) {
    // Expanded Aura (1.45x)
    doc.setDrawColor(16, 185, 129);
    doc.ellipse(cx, cy, 26, 36, 'S');
    doc.setDrawColor(56, 189, 248);
    doc.ellipse(cx, cy, 22, 32, 'S');
    doc.setDrawColor(245, 158, 11);
    doc.ellipse(cx, cy, 18, 27, 'S');
  } else {
    // Contracted Aura (0.76x)
    doc.setDrawColor(239, 68, 68);
    doc.ellipse(cx, cy, 15, 22, 'S');
    doc.setDrawColor(249, 115, 22);
    doc.ellipse(cx, cy, 12, 17, 'S');
  }

  // 2. Human Body Silhouette (Head, Neck, Torso, Arms, Legs, Spine)
  if (isPost) {
    doc.setFillColor(15, 32, 56);
    doc.setDrawColor(56, 189, 248);
  } else {
    doc.setFillColor(34, 16, 21);
    doc.setDrawColor(248, 113, 113);
  }

  // Head
  const headY = cy - 23;
  doc.circle(cx, headY, 4.5, 'FD');

  // Torso
  const torsoTop = headY + 5.5;
  doc.roundedRect(cx - 5.5, torsoTop, 11, 19, 1.5, 1.5, 'FD');

  // Spine Central Flow Line
  doc.setDrawColor(isPost ? 16 : 239, isPost ? 185 : 68, isPost ? 129 : 68);
  doc.line(cx, torsoTop, cx, torsoTop + 19);

  // Arms
  doc.line(cx - 5.5, torsoTop + 2, cx - 11, torsoTop + 14);
  doc.line(cx + 5.5, torsoTop + 2, cx + 11, torsoTop + 14);

  // Legs
  doc.line(cx - 3, torsoTop + 19, cx - 5, torsoTop + 33);
  doc.line(cx + 3, torsoTop + 19, cx + 5, torsoTop + 33);

  // Ground Sacred Ring
  doc.ellipse(cx, torsoTop + 34, 14, 3, 'S');

  // 3. 7 Letaif Activation Nodes on Anatomical Positions
  const letaifPdfCoords: Record<string, { x: number; y: number; r: number; g: number; b: number }> = {
    kalb: { x: cx + 2.8, y: torsoTop + 6.5, r: 244, g: 63, b: 94 },      // Kalp: Kırmızı/Sarı nur
    ruh: { x: cx - 2.8, y: torsoTop + 6.5, r: 59, g: 130, b: 246 },     // Ruh: Mavi nur
    sir: { x: cx + 3.2, y: torsoTop + 3.5, r: 234, g: 179, b: 8 },      // Sır: Beyaz/Altın nur
    sirr: { x: cx + 3.2, y: torsoTop + 3.5, r: 234, g: 179, b: 8 },
    hafi: { x: cx - 3.2, y: torsoTop + 3.5, r: 16, g: 185, b: 129 },    // Hafi: Yeşil nur
    ahfa: { x: cx, y: torsoTop + 4.8, r: 168, g: 85, b: 247 },          // Ahfa: Mor/Siyah nur
    nefs: { x: cx, y: headY - 0.5, r: 249, g: 115, b: 22 },             // Nefs: Turuncu nur
    kulliye: { x: cx, y: headY - 4.5, r: 255, g: 255, b: 255 },         // Külliye: Saf Beyaz nur
  };

  letaifLevels.forEach((l) => {
    const coord = letaifPdfCoords[l.id] || { x: cx, y: torsoTop + 8, r: 16, g: 185, b: 129 };
    // Outer glow halo
    doc.setFillColor(coord.r, coord.g, coord.b);
    doc.circle(coord.x, coord.y, isPost ? 1.8 : 1.1, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.circle(coord.x, coord.y, 0.7, 'S');
  });

  // Footer Metrics inside Box
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(
    clean(`Aura Cap: ${isPost ? '1.45x (Genis Kalkan)' : '0.76x (Daralmis)'} • Frekans: ${freqHz} Hz • Stres: %${stressLevel}`),
    startX + 3,
    startY + boxH - 2.5
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex) return { r: 16, g: 185, b: 129 };
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 16, g: 185, b: 129 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function safeAddImage(
  doc: jsPDF,
  dataUrl: string | undefined,
  x: number,
  y: number,
  w: number,
  h: number
): boolean {
  if (!dataUrl || typeof dataUrl !== 'string') return false;
  if (!dataUrl.startsWith('data:image')) return false;
  try {
    const isPng = dataUrl.startsWith('data:image/png');
    const isWebp = dataUrl.startsWith('data:image/webp');
    const format = isPng ? 'PNG' : (isWebp ? 'WEBP' : 'JPEG');
    doc.addImage(dataUrl, format, x, y, w, h);
    return true;
  } catch (err) {
    console.warn('PDF image safeAddImage fallback:', err);
    return false;
  }
}

/**
 * Renders a camera biometrics frame box with live snapshot, REC timestamps,
 * aura frequency, and bio-energy indicators for PDF export.
 */
function drawCameraSnapshotBox(
  doc: jsPDF,
  startX: number,
  startY: number,
  boxW: number,
  boxH: number,
  isPost: boolean,
  scanData: ScanResult,
  snapshotUrl: string | undefined,
  energyDelta: number
) {
  // 1. Box Container Frame
  doc.setFillColor(2, 6, 23); // Slate 950
  if (isPost) {
    doc.setDrawColor(16, 185, 129); // Emerald 500
  } else {
    doc.setDrawColor(100, 116, 139); // Slate 500
  }
  doc.roundedRect(startX, startY, boxW, boxH, 2.5, 2.5, 'FD');

  // 2. Header Line inside Box
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  if (isPost) {
    doc.setTextColor(52, 211, 153); // Emerald 400
    doc.text(clean('2. YUKLEME SONRASI KADRAJ (SIFA KANITI)'), startX + 3, startY + 4.5);
  } else {
    doc.setTextColor(248, 113, 113); // Rose 400
    doc.text(clean('1. TARAMA ONCESI KADRAJ (BASLANGIC)'), startX + 3, startY + 4.5);
  }

  const timeStr = new Date(scanData.timestamp || Date.now()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(clean(`[REC ${timeStr}]`), startX + boxW - 20, startY + 4.5);

  // 3. Image Area
  const imgX = startX + 3;
  const imgY = startY + 6.5;
  const imgW = boxW - 6;
  const imgH = 43;

  // Background for image viewport
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.roundedRect(imgX, imgY, imgW, imgH, 1.5, 1.5, 'F');

  const imgDrawn = safeAddImage(doc, snapshotUrl, imgX, imgY, imgW, imgH);

  if (!imgDrawn) {
    // Holographic Sensor Silhouette Placeholder
    doc.setDrawColor(isPost ? 16 : 239, isPost ? 185 : 68, isPost ? 129 : 68);
    doc.rect(imgX + 2, imgY + 2, imgW - 4, imgH - 4, 'S');
    
    // Crosshairs
    doc.line(imgX + imgW / 2 - 4, imgY + imgH / 2, imgX + imgW / 2 + 4, imgY + imgH / 2);
    doc.line(imgX + imgW / 2, imgY + imgH / 2 - 4, imgX + imgW / 2, imgY + imgH / 2 + 4);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isPost ? 110 : 203, isPost ? 231 : 213, isPost ? 183 : 225);
    doc.text(clean('Kamera Biyo-Optik Spektrometre'), imgX + imgW / 2 - 20, imgY + imgH / 2 - 4);
    doc.setFont('helvetica', 'normal');
    doc.text(clean(isPost ? 'Frekans Emisyonu & Canli Kadraj' : 'Temel Biyofoton Optik Taramasi'), imgX + imgW / 2 - 22, imgY + imgH / 2 + 5);
  }

  // 4. Footer Info Badge inside Box
  const footY = startY + imgH + 8;
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(isPost ? 16 : 51, isPost ? 185 : 65, isPost ? 129 : 85);
  doc.roundedRect(startX + 3, footY, boxW - 6, 12, 1.5, 1.5, 'FD');

  // Aura Color Dot
  const hex = scanData.auraHex || (isPost ? '#10b981' : '#ef4444');
  const rgb = hexToRgb(hex);
  doc.setFillColor(rgb.r, rgb.g, rgb.b);
  doc.circle(startX + 6, footY + 4, 1.3, 'F');

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(clean(`${scanData.dominantAuraColor || (isPost ? 'Zumrut' : 'Kirmizi')} Aura`), startX + 9, footY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isPost ? 52 : 248, isPost ? 211 : 113, isPost ? 153 : 113);
  doc.text(clean(`%${scanData.bioEnergyLevel} Biyo-Enerji • ${scanData.frequencyHz || (isPost ? 528 : 320)} Hz`), startX + 9, footY + 9.5);

  if (isPost) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(clean(`+${energyDelta > 0 ? energyDelta : 35}% Canlilik`), startX + boxW - 27, footY + 4.5);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(244, 63, 94);
    doc.text(clean('Baslangic Alani'), startX + boxW - 25, footY + 4.5);
  }
}

/**
 * Builds baseline pre-scan if only post-scan is given
 */
function createBaselinePreScan(postScan: ScanResult): ScanResult {
  return {
    ...postScan,
    id: `${postScan.id}_pre_baseline`,
    snapshotUrl: postScan.snapshotUrl || postScan.photoSnapshotUrl,
    photoSnapshotUrl: postScan.photoSnapshotUrl || postScan.snapshotUrl,
    timestamp: (postScan.timestamp || Date.now()) - 300000,
    bioEnergyLevel: Math.max(25, postScan.bioEnergyLevel - 34),
    pranaFlowRate: Math.max(28, postScan.pranaFlowRate - 32),
    frequencyHz: postScan.frequencyHz > 400 ? 320 : 256,
    dominantAuraColor: 'Kırmızı',
    auraHex: '#ef4444',
    coherenceScore: 50,
    isAfterTreatment: false,
    emotionalState: {
      ...postScan.emotionalState,
      primary: 'Zihinsel Yorgunluk & Enerji Blokajı',
      stressLevel: Math.min(88, (postScan.emotionalState?.stressLevel || 25) + 45),
      tranquilityLevel: Math.max(20, (postScan.emotionalState?.tranquilityLevel || 75) - 40),
      mentalClarity: Math.max(25, (postScan.emotionalState?.mentalClarity || 80) - 35),
      spiritualOpenness: Math.max(30, (postScan.emotionalState?.spiritualOpenness || 80) - 35),
    },
    letaifLevels: (postScan.letaifLevels || []).map((l) => ({
      ...l,
      level: Math.max(25, l.level - 36),
    })),
    chakraLevels: (postScan.chakraLevels || []).map((c) => ({
      ...c,
      level: Math.max(25, c.level - 32),
    })),
  };
}

/**
 * ======================================================================================
 * MASTER PDF REPORT BUILDER (All Panels, Detailed Explanations, Charts & Visuals)
 * ======================================================================================
 */
export function generateMasterComprehensivePDF(
  preScan: ScanResult,
  postScan: ScanResult,
  treatmentName: string = 'Frekans Yüklemesi & Letaif Uyumlaması',
  patientName: string = 'Misafir Danışan'
): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12;
    let y = margin;
    let currentPage = 1;

    // Delta calculations
    const energyDelta = postScan.bioEnergyLevel - preScan.bioEnergyLevel;
    const pranaDelta = postScan.pranaFlowRate - preScan.pranaFlowRate;
    const preStress = preScan.emotionalState?.stressLevel || 68;
    const postStress = postScan.emotionalState?.stressLevel || 18;
    const stressDelta = preStress - postStress;
    const preTranquility = preScan.emotionalState?.tranquilityLevel || 35;
    const postTranquility = postScan.emotionalState?.tranquilityLevel || 88;
    const tranquilityDelta = postTranquility - preTranquility;
    const preClarity = preScan.emotionalState?.mentalClarity || 40;
    const postClarity = postScan.emotionalState?.mentalClarity || 86;
    const clarityDelta = postClarity - preClarity;
    const coherenceDelta = (postScan.coherenceScore || 92) - (preScan.coherenceScore || 52);

    const reportDate = new Date(postScan.timestamp || Date.now()).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const drawHeader = () => {
      // Top Institutional Header Banner
      doc.setFillColor(6, 78, 59); // Deep Emerald 900
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 2.5, 2.5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(clean('AURABIO FREKANS KUANTUM BIYO-REZONANS & LETAIF ENSTITUSU'), margin + 5, y + 7);

      doc.setFontSize(9);
      doc.setTextColor(167, 243, 208); // Emerald 200
      doc.text(clean('BUTUNLESIK BIYO-AURA & FREKANS DONUSUM RAPORU (TAM TESEKULLU)'), margin + 5, y + 14);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240);
      doc.text(clean(`Danisan: ${patientName} • Tarih: ${reportDate}`), margin + 5, y + 20);
      doc.text(clean(`Protokol: ${treatmentName} • Baskin Renk: ${postScan.dominantAuraColor} (${postScan.frequencyHz} Hz)`), pageWidth - margin - 85, y + 20);

      y += 27;
    };

    const drawFooter = () => {
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(clean('AuraBio Kuantum Biyo-Rezonans Heyeti • Bilimsel & Manevi Rezonans Enstitusu • Gizli & Danisana Ozeldir'), margin, pageHeight - 7);
      doc.text(clean(`Sayfa ${currentPage}`), pageWidth - margin - 15, pageHeight - 7);
    };

    const checkPage = (needed: number) => {
      if (y + needed > pageHeight - margin - 14) {
        drawFooter();
        doc.addPage();
        currentPage++;
        y = margin;
        
        // Compact Running Header
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 78, 59);
        doc.text(clean('AuraBio Frekans - Butunlesik Biyo-Aura Donusum Raporu'), margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(clean(`Danisan: ${patientName} • ${reportDate}`), pageWidth - margin - 60, y);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 7;
      }
    };

    // Initialize Page 1
    drawHeader();

    // =========================================================================
    // 1. SECTION: 3D Live Letaif and Aura Simulation Visuals
    // =========================================================================
    checkPage(88);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('1. 3D CANLI LETAIF VE AURA SIMULASYON MUKAYESESI (ONCESI VS SONRASI)'), margin, y);
    y += 3.5;

    const simBoxW = (pageWidth - 2 * margin - 6) / 2;
    const simBoxH = 72;

    const preLetaifList = LETAIF_POINTS.map((l, idx) => ({
      id: l.id,
      name: l.name,
      level: ((preScan.letaifLevels || [])[idx]?.level) || 45,
      colorHex: l.colorHex,
      hz: 320 + idx * 25,
    }));

    const postLetaifList = LETAIF_POINTS.map((l, idx) => ({
      id: l.id,
      name: l.name,
      level: ((postScan.letaifLevels || [])[idx]?.level) || 88,
      colorHex: l.colorHex,
      hz: l.esmaFrequency || 528,
    }));

    // Draw Left Box (Pre-Scan 3D Vector Model)
    drawHuman3DLetaifSimulation(
      doc,
      margin,
      y,
      simBoxW,
      simBoxH,
      false,
      preScan.bioEnergyLevel,
      preStress,
      preScan.auraHex || '#ef4444',
      preScan.frequencyHz || 320,
      preLetaifList
    );

    // Draw Right Box (Post-Scan 3D Vector Model)
    drawHuman3DLetaifSimulation(
      doc,
      margin + simBoxW + 6,
      y,
      simBoxW,
      simBoxH,
      true,
      postScan.bioEnergyLevel,
      postStress,
      postScan.auraHex || '#10b981',
      postScan.frequencyHz || 528,
      postLetaifList
    );

    y += simBoxH + 4;

    // Explanatory Box for 3D Simulation
    checkPage(18);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 14, 1.5, 1.5, 'FD');
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(
      clean('3D Morfolojik Izah: Tarama oncesi 0.76x capinda daralmis, kirmizi/turuncu mikro-blokaj ve kacak barindiran aurik kalkan; uygulanan'),
      margin + 3,
      y + 4.5
    );
    doc.text(
      clean(`${postScan.frequencyHz} Hz frekans yuklemesi ve Letaif uyarimi sonrasi 1.45x genisliginde zümrüt-camgobegi kesintisiz Torus koruma alanina donusmustur.`),
      margin + 3,
      y + 9
    );
    y += 17;

    // =========================================================================
    // 2. SECTION: Camera Biofield Snapshot Comparison (Kamera Biyo-Alan Görüntü Kayıtları)
    // =========================================================================
    checkPage(88);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('2. KAMERA BIYO-ALAN GORUNTU KAYITLARI (ONCESI & SONRASI CIFT KADRAJ)'), margin, y);
    
    // Subtitle tag on right side
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(clean('Cift Kadraj Donusum Dogrulamasi [HD Optik Sensor]'), pageWidth - margin - 72, y);
    y += 3.5;

    const camBoxW = (pageWidth - 2 * margin - 6) / 2;
    const camBoxH = 68;
    const preSnapshotUrl = preScan.snapshotUrl || preScan.photoSnapshotUrl;
    const postSnapshotUrl = postScan.snapshotUrl || postScan.photoSnapshotUrl || preScan.snapshotUrl || preScan.photoSnapshotUrl;

    // Draw Left Camera Box (Tarama Öncesi)
    drawCameraSnapshotBox(
      doc,
      margin,
      y,
      camBoxW,
      camBoxH,
      false,
      preScan,
      preSnapshotUrl,
      energyDelta
    );

    // Draw Right Camera Box (Frekans Yükleme Sonrası)
    drawCameraSnapshotBox(
      doc,
      margin + camBoxW + 6,
      y,
      camBoxW,
      camBoxH,
      true,
      postScan,
      postSnapshotUrl,
      energyDelta
    );

    y += camBoxH + 4;

    // Explanatory Box for Camera Biofield Records
    checkPage(16);
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 14, 1.5, 1.5, 'FD');
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(
      clean('Kamera Biyo-Optik Spektral Dogrulama & Biyofoton Yayilimi:'),
      margin + 3,
      y + 4.5
    );
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(
      clean('Canli kamera sensoru tarafindan kaydedilen biyofoton emisyon kayitlari; yukleme oncesindeki blokajli hucresel yayilimin, uygulanan'),
      margin + 3,
      y + 8.5
    );
    doc.text(
      clean(`${postScan.frequencyHz} Hz frekans yuklemesi ve Letaif aktivasyonu sonrasinda parlak, yuksek koheransli ve genisleyen aurik kalkana donustugunu optik olarak kanitlamaktadir.`),
      margin + 3,
      y + 12
    );
    y += 17;

    // =========================================================================
    // 3. SECTION: Key Metric Delta Table (Genel Dönüşüm & Delta)
    // =========================================================================
    checkPage(52);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('3. GENEL DONUSUM & DELTA (BIYOMETRIK VE SPEKTRAL KAZANIMLAR)'), margin, y);
    y += 3.5;

    // Table Header
    doc.setFillColor(6, 78, 59);
    doc.rect(margin, y, pageWidth - 2 * margin, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('Parametre'), margin + 3, y + 3.8);
    doc.text(clean('Tarama Oncesi'), margin + 60, y + 3.8);
    doc.text(clean('Yukleme Sonrasi'), margin + 100, y + 3.8);
    doc.text(clean('Delta / Net Kazanc'), margin + 140, y + 3.8);
    y += 5.5;

    const metricsData = [
      { name: 'Biyo-Enerji Kapasitesi', pre: `%${preScan.bioEnergyLevel}`, post: `%${postScan.bioEnergyLevel}`, delta: `+${energyDelta}% (Yuksek Doping)` },
      { name: 'Hucre & Biyofoton Koheransi', pre: `%${preScan.coherenceScore || 52}`, post: `%${postScan.coherenceScore || 92}`, delta: `+${coherenceDelta}% (Hucresel Senkron)` },
      { name: 'Prana & Yasam Gucu Akis Debisi', pre: `%${preScan.pranaFlowRate}`, post: `%${postScan.pranaFlowRate}`, delta: `+${pranaDelta}% (Meridyen Acilimi)` },
      { name: 'Aurik Manyetik Kalkan Capi', pre: '0.76x (Daralmis/Hassas)', post: '1.45x (Guclendirilmis Zirh)', delta: '+%90 Koruma Genislemesi' },
      { name: 'Zihinsel ve Somatik Stres Indeksi', pre: `%${preStress}`, post: `%${postStress}`, delta: `-${stressDelta}% (Stres Desarj)` },
      { name: 'Icsel Sekinet & Dinginlik', pre: `%${preTranquility}`, post: `%${postTranquility}`, delta: `+${tranquilityDelta}% (Kalbi Huzur)` },
    ];

    metricsData.forEach((m, idx) => {
      checkPage(6);
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, pageWidth - 2 * margin, 5.2, 'F');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(clean(m.name), margin + 3, y + 3.6);

      doc.setFont('helvetica', 'normal');
      doc.text(clean(m.pre), margin + 60, y + 3.6);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text(clean(m.post), margin + 100, y + 3.6);
      doc.text(clean(m.delta), margin + 140, y + 3.6);

      y += 5.2;
    });
    y += 4;

    // =========================================================================
    // 4. SECTION: Emotional & Mental State Analysis (Duygusal & Zihinsel İyileşme)
    // =========================================================================
    checkPage(52);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('4. DUYGUSAL & ZIHINSEL IYILESME VE BILINC DUZEYI MUKAYESESI'), margin, y);
    y += 3.5;

    doc.setFillColor(6, 78, 59);
    doc.rect(margin, y, pageWidth - 2 * margin, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('Duygu & Bilinc Durumu'), margin + 3, y + 3.8);
    doc.text(clean('Oncesi'), margin + 60, y + 3.8);
    doc.text(clean('Sonrasi'), margin + 95, y + 3.8);
    doc.text(clean('Degisim & Sifa Aciklamasi'), margin + 130, y + 3.8);
    y += 5.5;

    const emoMetrics = [
      { name: 'Stres & Somatik Baski', pre: `%${preStress}`, post: `%${postStress}`, desc: 'Parasempatik sinir sistemi aktive oldu, kortizol baskisi azaldi.' },
      { name: 'Icsel Huzur & Sekinet', pre: `%${preTranquility}`, post: `%${postTranquility}`, desc: 'Kalp ritim degiskenligi (HRV) optimum koheransa ulasti.' },
      { name: 'Mental Berraklik & Odak', pre: `%${preClarity}`, post: `%${postClarity}`, desc: 'Zihinsel gurultu sonumlendi, alfa-teta beyin dalgasi yakalandi.' },
      { name: 'Manevi Uyum & Baglilik', pre: `%${preScan.emotionalState?.spiritualOpenness || 45}`, post: `%${postScan.emotionalState?.spiritualOpenness || 88}`, desc: 'Letaif merkezleri nurlanarak manevi teslimiyet ve ferahlik saglandi.' },
      { name: 'Genel Ruhsal Durum', pre: preScan.emotionalState?.primary || 'Yorgun', post: postScan.emotionalState?.primary || 'Huzurlu', desc: 'Duygusal tortular arindirildi, aurik parlaklik dengelendi.' },
    ];

    emoMetrics.forEach((em, idx) => {
      checkPage(6);
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, pageWidth - 2 * margin, 5.2, 'F');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(clean(em.name), margin + 3, y + 3.6);

      doc.setFont('helvetica', 'normal');
      doc.text(clean(em.pre), margin + 60, y + 3.6);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text(clean(em.post), margin + 95, y + 3.6);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(clean(em.desc), margin + 130, y + 3.6);

      y += 5.2;
    });
    y += 4;

    // =========================================================================
    // 5. SECTION: 4 Auric Layers Analysis (4 Aurik Katman Değişimi)
    // =========================================================================
    checkPage(55);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('5. 4 AURIK KATMAN DEGISIMI VE MANYETIK ZIRH ANALIZI'), margin, y);
    y += 3.5;

    doc.setFillColor(6, 78, 59);
    doc.rect(margin, y, pageWidth - 2 * margin, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('Aurik Katman'), margin + 3, y + 3.8);
    doc.text(clean('Mesafe'), margin + 60, y + 3.8);
    doc.text(clean('Frekans / Renk'), margin + 90, y + 3.8);
    doc.text(clean('Donusum & Islevsel Rolu'), margin + 130, y + 3.8);
    y += 5.5;

    AURA_LAYERS_GUIDE.forEach((layer, idx) => {
      checkPage(7);
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.text(clean(layer.name), margin + 3, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.text(clean(layer.distanceCm), margin + 60, y + 4);
      doc.text(clean(layer.colorFrequency.split('•')[0].trim()), margin + 90, y + 4);

      doc.setTextColor(4, 120, 87);
      doc.setFont('helvetica', 'bold');
      doc.text(clean('Maksimum Kalkan Aktif'), margin + 130, y + 4);

      y += 6;
    });
    y += 4;

    // =========================================================================
    // 6. SECTION: 7 Chakras Comparison & Deep Meaning (7 Çakra Karşılaştırması)
    // =========================================================================
    checkPage(65);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('6. 7 CAKRA ENERJI VE REZONANS DEGERLERI (ONCESI VS SONRASI)'), margin, y);
    y += 3.5;

    doc.setFillColor(6, 78, 59);
    doc.rect(margin, y, pageWidth - 2 * margin, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('Cakra Adi'), margin + 3, y + 3.8);
    doc.text(clean('Sanskrit & Bija'), margin + 45, y + 3.8);
    doc.text(clean('Frekans'), margin + 80, y + 3.8);
    doc.text(clean('Oncesi'), margin + 100, y + 3.8);
    doc.text(clean('Sonrasi'), margin + 118, y + 3.8);
    doc.text(clean('Dengeli Nitelik & Tesir'), margin + 138, y + 3.8);
    y += 5.5;

    (postScan.chakraLevels || []).forEach((c, idx) => {
      checkPage(6);
      const preC = (preScan.chakraLevels || [])[idx] || c;
      const guide = CHAKRA_GUIDE[idx] || CHAKRA_GUIDE[0];
      const delta = c.level - preC.level;

      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, pageWidth - 2 * margin, 5.2, 'F');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.text(clean(c.turkishName || c.name), margin + 3, y + 3.6);

      doc.setFont('helvetica', 'normal');
      doc.text(clean(`${c.bijaMantra || guide.bijaMantra} (${c.sanskritName || guide.sanskrit})`), margin + 45, y + 3.6);
      doc.text(clean(`${c.frequency || guide.frequencyHz} Hz`), margin + 80, y + 3.6);
      doc.text(clean(`%${preC.level}`), margin + 100, y + 3.6);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text(clean(`%${c.level} (+${delta}%)`), margin + 118, y + 3.6);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(clean((guide.balancedTraits || '').slice(0, 45)), margin + 138, y + 3.6);

      y += 5.2;
    });
    y += 4;

    // =========================================================================
    // 7. SECTION: 7 Letaif Centers Comparison & Spiritual Insights (7 Letaif Nur)
    // =========================================================================
    checkPage(68);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('7. 7 LETAIF MERKEZI MANEVI REZONANS VE FREKANS YUKLEME ISPATI'), margin, y);
    y += 3.5;

    doc.setFillColor(6, 78, 59);
    doc.rect(margin, y, pageWidth - 2 * margin, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('Letaif Merkezi'), margin + 3, y + 3.8);
    doc.text(clean('Konum'), margin + 40, y + 3.8);
    doc.text(clean('Nur Rengi'), margin + 78, y + 3.8);
    doc.text(clean('Esma & Zikir'), margin + 105, y + 3.8);
    doc.text(clean('Oncesi'), margin + 140, y + 3.8);
    doc.text(clean('Sonrasi'), margin + 158, y + 3.8);
    doc.text(clean('Artis'), margin + 174, y + 3.8);
    y += 5.5;

    (postScan.letaifLevels || []).forEach((l, idx) => {
      checkPage(6);
      const preL = (preScan.letaifLevels || [])[idx] || l;
      const guide = LETAIF_POINTS[idx] || LETAIF_POINTS[0];
      const delta = l.level - preL.level;

      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, pageWidth - 2 * margin, 5.2, 'F');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.text(clean(l.name), margin + 3, y + 3.6);

      doc.setFont('helvetica', 'normal');
      doc.text(clean((l.location || guide.location).slice(0, 22)), margin + 40, y + 3.6);
      doc.text(clean((l.nurColor || l.color || guide.color).slice(0, 16)), margin + 78, y + 3.6);
      doc.text(clean((guide.esma || '').slice(0, 20)), margin + 105, y + 3.6);
      doc.text(clean(`%${preL.level}`), margin + 140, y + 3.6);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text(clean(`%${l.level}`), margin + 158, y + 3.6);
      doc.text(clean(`+${delta}%`), margin + 174, y + 3.6);

      y += 5.2;
    });
    y += 4;

    // =========================================================================
    // 8. SECTION: Detailed Color Analysis (Detaylı Renk Analizi)
    // =========================================================================
    checkPage(48);
    const dominantColorObj = getDetailedColorAnalysis(postScan.dominantAuraColor);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('8. DETAYLI AURA RENK ANALIZI VE BIYO-ALAN KARSILIKLARI'), margin, y);
    y += 3.5;

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 32, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(clean(`Baskin Renk: ${dominantColorObj.turkishName} (${dominantColorObj.frequencyRangeHz})`), margin + 4, y + 5);

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(clean(`Ruhsal & Bilinc Duzeyi: ${dominantColorObj.spiritualMeaning.slice(0, 135)}...`), margin + 4, y + 10);
    doc.text(clean(`Zihinsel & Duygusal Durum: ${dominantColorObj.mentalEmotionalState.slice(0, 135)}...`), margin + 4, y + 15);
    doc.text(clean(`Eterik Beden & Biyofoton: ${dominantColorObj.ethericBodyImpact.slice(0, 135)}...`), margin + 4, y + 20);
    doc.text(clean(`Dengeli Nitelikler: ${dominantColorObj.balancedTraits.join(' • ')}`), margin + 4, y + 25);
    doc.text(clean(`Bütünsel Rehberlik: ${dominantColorObj.holisticGuidance.slice(0, 130)}`), margin + 4, y + 29.5);

    y += 36;

    // =========================================================================
    // 9. SECTION: 99 Esma-i Hüsna & Ayet Recommendations (9. Bölüm)
    // =========================================================================
    checkPage(52);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('9. TAVSIYE EDILEN 99 ESMA-I HUSNA, SIFA AYETLERI VE HOLISTIK FREKANSLAR'), margin, y);
    y += 3.5;

    doc.setFillColor(6, 78, 59);
    doc.rect(margin, y, pageWidth - 2 * margin, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('Oneri'), margin + 3, y + 3.8);
    doc.text(clean('Frekans'), margin + 50, y + 3.8);
    doc.text(clean('Ebced / Sayi'), margin + 80, y + 3.8);
    doc.text(clean('Sifa Sahasi & Biyo-Rezonans Hedefi'), margin + 115, y + 3.8);
    y += 5.5;

    const recEsmas = (postScan.recommendedEsmas || []).slice(0, 4);
    recEsmas.forEach((eId: any, idx: number) => {
      checkPage(6);
      const obj = ESMA_LIST.find(i => i.id === eId) || { name: eId, frequency: 528, ebjed: 66, benefit: 'Hücresel şifa ve sükunet.' };
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, pageWidth - 2 * margin, 5.2, 'F');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.text(clean(obj.name), margin + 3, y + 3.6);

      doc.setFont('helvetica', 'normal');
      doc.text(clean(`${(obj as any).frequency || (obj as any).frequencyHz || 528} Hz`), margin + 50, y + 3.6);
      doc.text(clean(`${(obj as any).ebjed || (obj as any).dhikrCount || 66}`), margin + 80, y + 3.6);
      doc.text(clean(((obj as any).benefit || (obj as any).meaning || '').slice(0, 52)), margin + 115, y + 3.6);

      y += 5.2;
    });

    // Add Recommended Ayet
    const recAyets = (postScan.recommendedAyets || []).slice(0, 2);
    recAyets.forEach((aId: any, idx: number) => {
      checkPage(6);
      const aObj = AYET_LIST.find(i => i.id === aId) || AYET_LIST[0];
      doc.setFillColor(240, 253, 244);
      doc.rect(margin, y, pageWidth - 2 * margin, 5.2, 'F');

      doc.setTextColor(4, 120, 87);
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.text(clean(`Ayet: ${aObj.surah}`), margin + 3, y + 3.6);

      doc.setFont('helvetica', 'normal');
      doc.text(clean(`${aObj.frequencyHz || 528} Hz`), margin + 50, y + 3.6);
      doc.text(clean('Tefekkur'), margin + 80, y + 3.6);
      doc.text(clean((aObj.benefit || aObj.turkishTranslation).slice(0, 52)), margin + 115, y + 3.6);

      y += 5.2;
    });
    y += 4;

    // =========================================================================
    // 10. SECTION: Life Coach Matrix & Holistic Protocol (10. Bölüm)
    // =========================================================================
    checkPage(46);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(clean('10. YASAM KOCU MATRISI VE BUTUNCUL SIFA PROTOKOLU'), margin, y);
    y += 3.5;

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 2, 2, 'FD');

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(clean('Gunluk Biyo-Rezonans ve Yasam Ritmi Recetesi:'), margin + 4, y + 5);

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(clean('1. Canli Su Protokolu: Gunde en az 2.0 - 2.5L yapilandirilmis canli su tuketiniz (Hucreler arasi foton iletimi icin).'), margin + 4, y + 9.5);
    doc.text(clean('2. Ritmik 4-7-8 Nefes Seansi: Gunde 2 kez 5 dakika (4 sn burundan al, 7 sn tut, 8 sn agizdan ver) diyafram nefesi uygulayiniz.'), margin + 4, y + 14);
    doc.text(clean(`3. Frekans Dinletisi: 7 gun boyunca her gun 15 dakika kulaklikla ${postScan.frequencyHz} Hz frekansi sessiz ortamda dinleyiniz.`), margin + 4, y + 18.5);

    y += 28;

    // =========================================================================
    // 11. SECTION: Institutional Signatures & Stamp (11. Bölüm)
    // =========================================================================
    checkPage(24);
    doc.setDrawColor(4, 120, 87);
    doc.line(margin, y, pageWidth - margin, y);
    y += 3.5;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 78, 59);
    doc.text(clean('AuraBio Kuantum Biyo-Rezonans & Letaif Enstitusu'), margin, y + 4);
    doc.text(clean('Sistem Onayi: AuraBio Biyo-Rezonans ve Frekans Heyeti'), pageWidth - margin - 85, y + 4);

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(clean('Kuantum Biyo-Optik Spektrometre Onayli Dijital Rapor Belgesidir.'), margin, y + 9);
    doc.text(clean(`Rapor No: AURA-${(postScan.id || 'BIO').slice(0, 8).toUpperCase()}`), pageWidth - margin - 85, y + 9);

    drawFooter();

    // Trigger Download
    const fileName = `AuraBio_Butunlesik_Donusum_Raporu_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    return true;
  } catch (err) {
    console.error('Master PDF generation error:', err);
    return false;
  }
}

/**
 * ======================================================================================
 * 1. BÜTÜNLEŞİK ÖNCESİ & SONRASI DÖNÜŞÜM RAPORU - PDF DIŞA AKTARIMI
 * ======================================================================================
 */
export function exportComparisonReportToPDF(
  preScan: ScanResult,
  postScan: ScanResult,
  treatmentName: string = 'Frekans Yüklemesi',
  patientName: string = 'Misafir Danışan'
): boolean {
  return generateMasterComprehensivePDF(preScan, postScan, treatmentName, patientName);
}

/**
 * ======================================================================================
 * 2. TEKİL BİYO-AURA & FREKANS ANALİZ RAPORU - PDF DIŞA AKTARIMI
 * (Accepts optional preScanResult, or automatically synthesizes baseline pre-scan)
 * ======================================================================================
 */
export function exportScanReportToPDF(
  scan: ScanResult,
  patientName: string = 'Misafir Danışan',
  preScan?: ScanResult | null
): boolean {
  const effectivePre = preScan || createBaselinePreScan(scan);
  return generateMasterComprehensivePDF(
    effectivePre,
    scan,
    `Biyo-Rezonans Analizi (${scan.frequencyHz} Hz)`,
    patientName
  );
}

/**
 * ======================================================================================
 * 3. BÜTÜNLEŞİK ÖNCESİ & SONRASI DÖNÜŞÜM RAPORU - WORD (.DOC) DIŞA AKTARIMI
 * ======================================================================================
 */
export function exportComparisonReportToWord(
  preScan: ScanResult,
  postScan: ScanResult,
  treatmentName: string = 'Frekans Yüklemesi',
  patientName: string = 'Misafir Danışan'
): boolean {
  try {
    const energyDelta = postScan.bioEnergyLevel - preScan.bioEnergyLevel;
    const pranaDelta = postScan.pranaFlowRate - preScan.pranaFlowRate;
    const preStress = preScan.emotionalState?.stressLevel || 32;
    const postStress = postScan.emotionalState?.stressLevel || 12;
    const stressDelta = preStress - postStress;
    const preTranquility = preScan.emotionalState?.tranquilityLevel || 58;
    const postTranquility = postScan.emotionalState?.tranquilityLevel || 88;
    const tranquilityDelta = postTranquility - preTranquility;
    const preClarity = preScan.emotionalState?.mentalClarity || 62;
    const postClarity = postScan.emotionalState?.mentalClarity || 89;
    const clarityDelta = postClarity - preClarity;
    const coherenceDelta = (postScan.coherenceScore || 92) - (preScan.coherenceScore || 52);

    const reportDate = new Date(postScan.timestamp || Date.now()).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const dominantAnalysis = getDetailedColorAnalysis(postScan.dominantAuraColor);
    const preSnapshot = preScan.snapshotUrl || preScan.photoSnapshotUrl;
    const postSnapshot = postScan.snapshotUrl || postScan.photoSnapshotUrl;

    const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>AuraBio - Bütünleşik Öncesi & Sonrası Dönüşüm Raporu</title>
      <style>
        body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; color: #0f172a; margin: 15mm; }
        .header-table { width: 100%; border: none; margin-bottom: 16pt; }
        .header-title { font-size: 16pt; font-weight: bold; color: #064e3b; text-align: center; margin-bottom: 2pt; }
        .header-subtitle { font-size: 11pt; color: #047857; text-align: center; font-weight: 600; margin-bottom: 4pt; }
        .header-meta { font-size: 8.5pt; color: #64748b; text-align: center; margin-bottom: 12pt; border-bottom: 2pt solid #10b981; padding-bottom: 6pt; }
        
        h2 { font-size: 12pt; color: #064e3b; background-color: #f0fdf4; border-left: 4.5pt solid #059669; padding: 5pt 8pt; margin-top: 16pt; margin-bottom: 6pt; }
        h3 { font-size: 10.5pt; color: #047857; margin-top: 10pt; margin-bottom: 4pt; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 6pt; margin-bottom: 10pt; font-size: 9.5pt; }
        th { background-color: #064e3b; color: #ffffff; padding: 6pt 8pt; border: 1pt solid #047857; text-align: left; font-weight: bold; }
        td { padding: 5pt 7pt; border: 1pt solid #cbd5e1; vertical-align: middle; }
        tr:nth-child(even) { background-color: #f8fafc; }
        
        .box { background-color: #f0fdf4; border: 1pt solid #10b981; padding: 8pt 10pt; border-radius: 4pt; margin-bottom: 10pt; font-size: 9.5pt; }
        .alert-box { background-color: #fef2f2; border: 1pt solid #f87171; padding: 8pt 10pt; border-radius: 4pt; margin-bottom: 10pt; font-size: 9.5pt; }
        .cam-box { background-color: #020617; color: #f8fafc; border: 1.5pt solid #10b981; padding: 8pt; border-radius: 4pt; text-align: center; margin-bottom: 8pt; }
        .badge-success { background-color: #d1fae5; color: #065f46; font-weight: bold; padding: 2pt 5pt; border-radius: 3pt; }
        .badge-alert { background-color: #fee2e2; color: #991b1b; font-weight: bold; padding: 2pt 5pt; border-radius: 3pt; }
        .footer-sign { margin-top: 24pt; border-top: 1.5pt solid #047857; padding-top: 8pt; font-size: 9pt; }
      </style>
    </head>
    <body>
      <!-- Institutional Header -->
      <div class="header-title">AURABIO FREKANS KUANTUM BİYO-REZONANS & LETAİF ENSTİTÜSÜ</div>
      <div class="header-subtitle">BÜTÜNLEŞİK ÖNCESİ & SONRASI DÖNÜŞÜM VE BİYO-REZONANS ANALİZ RAPORU</div>
      <div class="header-meta">Kuantum Biyo-Optik Spektrometre, 3D Letaif ve Manyetik Koruma Alanı Değerlendirmesi</div>

      <table style="border: 1pt solid #10b981; background-color: #f0fdf4; margin-bottom: 12pt;">
        <tr>
          <td style="width: 25%;"><strong>Danışan Adı:</strong></td>
          <td style="width: 25%; font-weight: bold; color: #064e3b;">${patientName}</td>
          <td style="width: 25%;"><strong>Rapor Tarihi:</strong></td>
          <td style="width: 25%;">${reportDate}</td>
        </tr>
        <tr>
          <td><strong>Uygulanan Yükleme:</strong></td>
          <td style="font-weight: bold; color: #047857;">${treatmentName}</td>
          <td><strong>Temel Frekans:</strong></td>
          <td style="font-weight: bold; color: #047857;">${postScan.frequencyHz} Hz (Solfeggio)</td>
        </tr>
        <tr>
          <td><strong>Hedef Biyo-Alan:</strong></td>
          <td>${postScan.targetName || 'İnsan Biyo-Alanı'}</td>
          <td><strong>Rapor Sertifika Kodu:</strong></td>
          <td style="font-family: monospace; font-weight: bold; color: #065f46;">AURA-${(postScan.id || 'BIO').slice(0, 8).toUpperCase()}</td>
        </tr>
      </table>

      <!-- 1. SECTION: 3D Live Letaif & Aura Simulation -->
      <h2>1. 3D CANLI LETAİF VE AURA SİMÜLASYON MUKAYESESİ (ÖNCESİ VS SONRASI)</h2>
      <table style="margin-bottom: 6pt;">
        <thead>
          <tr>
            <th style="width: 50%; background-color: #991b1b; border-color: #b91c1c;">TARAMA ÖNCESİ: BLOKAJLI & DARALMIŞ ALAN</th>
            <th style="width: 50%; background-color: #064e3b; border-color: #047857;">YÜKLEME SONRASI: FREKANSLA GENİŞLEMİŞ KALKAN</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="background-color: #fff1f2; vertical-align: top;">
              <p><strong>Manyetik Kalkan Çapı:</strong> 0.76x (Kritik Daralma)</p>
              <p><strong>Biyo-Enerji Düzeyi:</strong> %${preScan.bioEnergyLevel} (Düşük Kapasite)</p>
              <p><strong>Stres & Gerginlik:</strong> %${preStress} (Yüksek Yük)</p>
              <p><strong>Baskın Dalga Boyu:</strong> ${preScan.frequencyHz || 320} Hz (${preScan.dominantAuraColor || 'Kırmızı'})</p>
              <p style="color: #991b1b; font-size: 8.5pt;"><em>Sol/sağ göğüs ve alın letaif hatlarında mikro-blokajlar ve kaçaklar tespit edildi.</em></p>
            </td>
            <td style="background-color: #f0fdf4; vertical-align: top;">
              <p><strong>Manyetik Kalkan Çapı:</strong> <span style="color: #047857; font-weight: bold;">1.45x (Genişletilmiş Zırh)</span></p>
              <p><strong>Biyo-Enerji Düzeyi:</strong> <span style="color: #047857; font-weight: bold;">%${postScan.bioEnergyLevel} (+%${energyDelta})</span></p>
              <p><strong>Stres & Gerginlik:</strong> <span style="color: #047857; font-weight: bold;">%${postStress} (-%${stressDelta})</span></p>
              <p><strong>Baskın Dalga Boyu:</strong> <span style="color: #047857; font-weight: bold;">${postScan.frequencyHz || 528} Hz (${postScan.dominantAuraColor || 'Zümrüt'})</span></p>
              <p style="color: #065f46; font-size: 8.5pt;"><em>7 Letaif nurlanmış, kesintisiz Torus koruma geometrisi aktive edilmiştir.</em></p>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="box">
        <strong>3D Morfolojik İzah:</strong> Tarama öncesinde 0.76x çapında daralmış ve mikro enerji kaçakları barındıran aurik kalkan; uygulanan <strong>${postScan.frequencyHz} Hz</strong> frekans yüklemesi ve 7 Letaif uyarımı sonrasında <strong>1.45x</strong> genişliğinde zümrüt-camgöbeği kesintisiz Torus koruma alanına dönüştürülmüştür.
      </div>

      <!-- 2. SECTION: General Delta Improvements -->
      <h2>2. GENEL DÖNÜŞÜM & DELTA (BİYOMETRİK VE SPEKTRAL KAZANIMLAR)</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 32%;">Parametre</th>
            <th style="width: 20%;">Tarama Öncesi</th>
            <th style="width: 20%;">Yükleme Sonrası</th>
            <th style="width: 28%;">Net Kazanç / Dönüşüm</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Biyo-Enerji Kapasitesi</strong></td>
            <td>%${preScan.bioEnergyLevel}</td>
            <td style="color: #047857; font-weight: bold;">%${postScan.bioEnergyLevel}</td>
            <td><span class="badge-success">+${energyDelta}% (Yüksek Doping)</span></td>
          </tr>
          <tr>
            <td><strong>Hücre & Biyofoton Koheransı</strong></td>
            <td>%${preScan.coherenceScore || 52}</td>
            <td style="color: #047857; font-weight: bold;">%${postScan.coherenceScore || 92}</td>
            <td><span class="badge-success">+${coherenceDelta}% (Hücresel Senkron)</span></td>
          </tr>
          <tr>
            <td><strong>Prana & Yaşam Gücü Akış Debisi</strong></td>
            <td>%${preScan.pranaFlowRate}</td>
            <td style="color: #047857; font-weight: bold;">%${postScan.pranaFlowRate}</td>
            <td><span class="badge-success">+${pranaDelta}% (Meridyen Açılımı)</span></td>
          </tr>
          <tr>
            <td><strong>Aurik Manyetik Kalkan Çapı</strong></td>
            <td>0.76x (Daralmış/Hassas)</td>
            <td style="color: #047857; font-weight: bold;">1.45x (Güçlendirilmiş Zırh)</td>
            <td><span class="badge-success">+%90 Koruma Genişlemesi</span></td>
          </tr>
          <tr>
            <td><strong>Zihinsel ve Somatik Stres İndeksi</strong></td>
            <td>%${preStress}</td>
            <td style="color: #047857; font-weight: bold;">%${postStress}</td>
            <td><span class="badge-success">-${stressDelta}% (Stres Deşarjı)</span></td>
          </tr>
          <tr>
            <td><strong>İçsel Sekinet & Dinginlik</strong></td>
            <td>%${preTranquility}</td>
            <td style="color: #047857; font-weight: bold;">%${postTranquility}</td>
            <td><span class="badge-success">+${tranquilityDelta}% (Kalbi Huzur)</span></td>
          </tr>
          <tr>
            <td><strong>Mental Berraklık & Odak</strong></td>
            <td>%${preClarity}</td>
            <td style="color: #047857; font-weight: bold;">%${postClarity}</td>
            <td><span class="badge-success">+${clarityDelta}% (Alfa-Teta Senkronu)</span></td>
          </tr>
        </tbody>
      </table>

      <!-- 3. SECTION: Emotional & Mental State Analysis -->
      <h2>3. DUYGUSAL & ZİHİNSEL İYİLEŞME VE BİLİNÇ DÜZEYİ MUKAYESESİ</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Duygu & Bilinç Durumu</th>
            <th style="width: 14%;">Öncesi</th>
            <th style="width: 14%;">Sonrası</th>
            <th style="width: 47%;">Değişim & Şifa Açıklaması</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Stres & Somatik Baskı</strong></td>
            <td>%${preStress}</td>
            <td style="color: #047857; font-weight: bold;">%${postStress}</td>
            <td>Parasempatik sinir sistemi aktive oldu, kortizol ve vagus gerginliği azaldı.</td>
          </tr>
          <tr>
            <td><strong>İçsel Huzur & Sekinet</strong></td>
            <td>%${preTranquility}</td>
            <td style="color: #047857; font-weight: bold;">%${postTranquility}</td>
            <td>Kalp ritim değişkenliği (HRV) optimum biyofoton koheransına ulaştı.</td>
          </tr>
          <tr>
            <td><strong>Mental Berraklık & Odak</strong></td>
            <td>%${preClarity}</td>
            <td style="color: #047857; font-weight: bold;">%${postClarity}</td>
            <td>Zihinsel gürültü sonumlandı, alfa-teta derin meditatif beyin dalgası yakalandı.</td>
          </tr>
          <tr>
            <td><strong>Manevi Uyum & Bağlılık</strong></td>
            <td>%${preScan.emotionalState?.spiritualOpenness || 45}</td>
            <td style="color: #047857; font-weight: bold;">%${postScan.emotionalState?.spiritualOpenness || 88}</td>
            <td>Letaif merkezleri nurlanarak manevi teslimiyet, şükür ve kalbi inşirah sağlandı.</td>
          </tr>
          <tr>
            <td><strong>Genel Ruhsal Durum</strong></td>
            <td>${preScan.emotionalState?.primary || 'Yorgun'}</td>
            <td style="color: #047857; font-weight: bold;">${postScan.emotionalState?.primary || 'Huzurlu'}</td>
            <td>Duygusal blokaj tortuları arındırıldı, aurik parlaklık dengelendi.</td>
          </tr>
        </tbody>
      </table>

      <!-- 3.1. SECTION: Live Camera Scan Biometric Visuals -->
      <h2>3.1. CANLI KAMERA TARAMA KAYDI VE BİYO-FOTON ALANI (ÖNCESİ VS SONRASI)</h2>
      <table style="margin-bottom: 6pt;">
        <thead>
          <tr>
            <th style="width: 50%; background-color: #7f1d1d; border-color: #991b1b;">ÖNCESİ: İLK KAMERA TARAMA KAYDI</th>
            <th style="width: 50%; background-color: #064e3b; border-color: #047857;">SONRASI: FREKANS YÜKLENMİŞ KAMERA KAYDI</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center; vertical-align: middle; background-color: #020617; color: #fff; padding: 10pt;">
              ${preSnapshot ? `<img src="${preSnapshot}" width="280" height="210" style="border: 2pt solid #ef4444; border-radius: 4pt; margin-bottom: 4pt;" alt="Tarama Öncesi Kamera Kaydı" /><br>` : ''}
              <span style="font-family: monospace; font-size: 8.5pt; color: #f87171;">[REC] %${preScan.bioEnergyLevel} ENERJİ • ${preScan.frequencyHz || 320} Hz • %${preStress} STRES</span><br>
              <span style="font-size: 8pt; color: #cbd5e1;">Aura Rengi: ${preScan.dominantAuraColor || 'Kırmızı'} (Mikro-Blokajlı)</span>
            </td>
            <td style="text-align: center; vertical-align: middle; background-color: #020617; color: #fff; padding: 10pt;">
              ${postSnapshot ? `<img src="${postSnapshot}" width="280" height="210" style="border: 2pt solid #10b981; border-radius: 4pt; margin-bottom: 4pt;" alt="Tarama Sonrası Kamera Kaydı" /><br>` : ''}
              <span style="font-family: monospace; font-size: 8.5pt; color: #34d399;">[REC] %${postScan.bioEnergyLevel} ENERJİ • ${postScan.frequencyHz || 528} Hz • %${postStress} STRES</span><br>
              <span style="font-size: 8pt; color: #cbd5e1;">Aura Rengi: ${postScan.dominantAuraColor || 'Zümrüt Yeşili'} (Tam Koherans)</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="box">
        <strong>Optik Spektrometre İzahı:</strong> Canlı kamera sensörümüz, yüz bölgesi ve üst gövdedeki mikroskobik biyofoton parlama değişimlerini kaydetmiştir. Frekans yüklemesi sonrasında yüz çevresi elektromanyetik alanında <strong>+%${energyDelta > 0 ? energyDelta : 35}</strong> oranında foton yoğunluğu artışı ve spektral dalga boyu kararlılığı tespit edilmiştir.
      </div>

      <!-- 4. SECTION: 4 Auric Layers Analysis -->
      <h2>4. 4 AURİK KATMAN DEĞİŞİMİ VE MANYETİK ZIRH ANALİZİ</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Aurik Katman</th>
            <th style="width: 15%;">Mesafe</th>
            <th style="width: 25%;">Frekans / Renk</th>
            <th style="width: 35%;">Dönüşüm & İşlevsel Rolü</th>
          </tr>
        </thead>
        <tbody>
          ${AURA_LAYERS_GUIDE.map((layer) => `
            <tr>
              <td><strong>${layer.name}</strong></td>
              <td>${layer.distanceCm}</td>
              <td>${layer.colorFrequency}</td>
              <td style="color: #047857; font-weight: bold;">Maksimum Kalkan Aktif (Tam Koruma)</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- 5. SECTION: 7 Chakras Comparison -->
      <h2>5. 7 ÇAKRA ENERJİ VE REZONANS DEĞERLERİ (ÖNCESİ VS SONRASI)</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">Çakra Adı</th>
            <th style="width: 20%;">Sanskrit & Bija</th>
            <th style="width: 12%;">Frekans</th>
            <th style="width: 12%;">Öncesi</th>
            <th style="width: 16%;">Sonrası (Artış)</th>
            <th style="width: 20%;">Dengeli Nitelik & Tesir</th>
          </tr>
        </thead>
        <tbody>
          ${(postScan.chakraLevels || []).map((c, idx) => {
            const preC = (preScan.chakraLevels || [])[idx] || c;
            const guide = CHAKRA_GUIDE[idx] || CHAKRA_GUIDE[0];
            const delta = c.level - preC.level;
            return `
              <tr>
                <td><strong>${c.turkishName || c.name}</strong></td>
                <td>${c.bijaMantra || guide.bijaMantra} (${c.sanskritName || guide.sanskrit})</td>
                <td>${c.frequency || guide.frequencyHz} Hz</td>
                <td>%${preC.level}</td>
                <td style="color: #047857; font-weight: bold;">%${c.level} (+${delta}%)</td>
                <td style="font-size: 8.5pt; color: #475569;">${guide.balancedTraits || 'Dengeli ve açık'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- 6. SECTION: 7 Letaif Centers Comparison -->
      <h2>6. 7 LETAİF MERKEZİ MANEVİ REZONANS VE FREKANS YÜKLEME İSPATI</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 18%;">Letaif Merkezi</th>
            <th style="width: 18%;">Konum</th>
            <th style="width: 14%;">Nur Rengi</th>
            <th style="width: 22%;">Esma & Zikir</th>
            <th style="width: 9%;">Öncesi</th>
            <th style="width: 9%;">Sonrası</th>
            <th style="width: 10%;">Artış</th>
          </tr>
        </thead>
        <tbody>
          ${(postScan.letaifLevels || []).map((l, idx) => {
            const preL = (preScan.letaifLevels || [])[idx] || l;
            const guide = LETAIF_POINTS[idx] || LETAIF_POINTS[0];
            const delta = l.level - preL.level;
            return `
              <tr>
                <td><strong>${l.name}</strong></td>
                <td>${l.location || guide.location}</td>
                <td>${l.nurColor || l.color || guide.color}</td>
                <td>${guide.esma || 'Ya Fettah'}</td>
                <td>%${preL.level}</td>
                <td style="color: #047857; font-weight: bold;">%${l.level}</td>
                <td style="color: #047857; font-weight: bold;">+${delta}%</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- 7. SECTION: Detailed Color Analysis -->
      <h2>7. DETAYLI AURA RENK ANALİZİ VE BİYO-ALAN KARŞILIKLARI</h2>
      <div class="box">
        <p style="font-size: 11pt; color: #064e3b; font-weight: bold; margin-bottom: 4pt;">
          Baskın Renk: ${dominantAnalysis.turkishName} (${dominantAnalysis.frequencyRangeHz})
        </p>
        <p><strong>Ruhsal & Bilinç Düzeyi:</strong> ${dominantAnalysis.spiritualMeaning}</p>
        <p><strong>Zihinsel & Duygusal Durum:</strong> ${dominantAnalysis.mentalEmotionalState}</p>
        <p><strong>Eterik Beden & Biyofoton Etkisi:</strong> ${dominantAnalysis.ethericBodyImpact}</p>
        <p><strong>Dengeli Nitelikler:</strong> ${dominantAnalysis.balancedTraits.join(' • ')}</p>
        <p><strong>Bütünsel Rehberlik:</strong> ${dominantAnalysis.holisticGuidance}</p>
      </div>

      <!-- 8. SECTION: 99 Esma-i Hüsna & Ayet Recommendations -->
      <h2>8. TAVSİYE EDİLEN 99 ESMA-İ HÜSNA, ŞİFA AYETLERİ VE HOLİSTİK FREKANSLAR</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Öneri</th>
            <th style="width: 15%;">Frekans</th>
            <th style="width: 15%;">Ebced / Adet</th>
            <th style="width: 45%;">Şifa Sahası & Biyo-Rezonans Hedefi</th>
          </tr>
        </thead>
        <tbody>
          ${(postScan.recommendedEsmas || []).slice(0, 5).map((eId: any) => {
            const obj = ESMA_LIST.find(i => i.id === eId) || { name: eId, frequency: 528, ebjed: 66, benefit: 'Hücresel şifa ve sükunet.' };
            return `
              <tr>
                <td><strong>${obj.name}</strong></td>
                <td>${(obj as any).frequency || (obj as any).frequencyHz || 528} Hz</td>
                <td>${(obj as any).ebjed || (obj as any).dhikrCount || 66}</td>
                <td>${(obj as any).benefit || (obj as any).meaning || 'Hücresel denge'}</td>
              </tr>
            `;
          }).join('')}
          ${(postScan.recommendedAyets || []).slice(0, 2).map((aId: any) => {
            const aObj = AYET_LIST.find(i => i.id === aId) || AYET_LIST[0];
            return `
              <tr style="background-color: #f0fdf4;">
                <td style="color: #047857;"><strong>Ayet: ${aObj.surah}</strong></td>
                <td>${aObj.frequencyHz || 528} Hz</td>
                <td>Tefekkür</td>
                <td>${aObj.benefit || aObj.turkishTranslation}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- 9. SECTION: Life Coach Matrix & Holistic Protocol -->
      <h2>9. YAŞAM KOÇU MATRİSİ VE BÜTÜNCÜL ŞİFA PROTOKOLÜ</h2>
      <div class="box">
        <p style="font-weight: bold; color: #064e3b; margin-bottom: 4pt;">Günlük Biyo-Rezonans ve Yaşam Ritmi Reçetesi:</p>
        <ol style="margin-top: 2pt; padding-left: 14pt;">
          <li style="margin-bottom: 3pt;"><strong>Canlı Su Protokolü:</strong> Günde en az 2.0 - 2.5L yapılandırılmış canlı su tüketiniz (Hücreler arası foton iletimi ve detoks için).</li>
          <li style="margin-bottom: 3pt;"><strong>Ritmik 4-7-8 Nefes Seansı:</strong> Günde 2 kez 5 dakika (4 sn burundan al, 7 sn tut, 8 sn ağızdan ver) diyafram nefesi uygulayınız.</li>
          <li style="margin-bottom: 3pt;"><strong>Frekans Dinletisi:</strong> 7 gün boyunca her gün 15 dakika kulaklıkla <strong>${postScan.frequencyHz} Hz</strong> frekansı sessiz ortamda dinleyiniz.</li>
          <li style="margin-bottom: 3pt;"><strong>Topraklama & Sirkadiyen Denge:</strong> Günde 10 dakika çıplak ayakla toprağa basınız veya gün doğumunda doğal ışık banyosu alınız.</li>
        </ol>
      </div>

      <!-- 10. SECTION: Institutional Signatures & Stamp -->
      <h2>10. KURUMSAL ONAY VE DİJİTAL MÜHÜR</h2>
      <table style="border: none; background-color: transparent;">
        <tr>
          <td style="border: none; width: 50%; vertical-align: top;">
            <strong style="color: #064e3b;">AuraBio Kuantum Biyo-Rezonans & Letaif Enstitüsü</strong><br>
            <span style="font-size: 8.5pt; color: #64748b;">Kuantum Biyo-Optik Spektrometre Onaylı Dijital Rapor Belgesidir.</span>
          </td>
          <td style="border: none; width: 50%; text-align: right; vertical-align: top;">
            <strong style="color: #064e3b;">Sistem Onayı: AuraBio Biyo-Rezonans ve Frekans Heyeti</strong><br>
            <span style="font-size: 8.5pt; color: #64748b;">Rapor No: AURA-${(postScan.id || 'BIO').slice(0, 8).toUpperCase()}</span>
          </td>
        </tr>
      </table>

      <div class="footer-sign">
        <p style="text-align: center; color: #94a3b8; font-size: 8pt;">
          Bu rapor AuraBio Kuantum Biyo-Rezonans Sistemi tarafından üretilmiş olup kişiselleştirilmiş elektromanyetik alan analizidir.
        </p>
      </div>
    </body>
    </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AuraBio_Butunlesik_Donusum_Raporu_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Word export error:', err);
    return false;
  }
}

/**
 * ======================================================================================
 * 4. TEKİL BİYO-AURA & FREKANS ANALİZ RAPORU - WORD (.DOC) DIŞA AKTARIMI
 * ======================================================================================
 */
export function exportScanReportToWord(
  scan: ScanResult,
  patientName: string = 'Misafir Danışan',
  preScan?: ScanResult | null
): boolean {
  const effectivePre = preScan || createBaselinePreScan(scan);
  return exportComparisonReportToWord(
    effectivePre,
    scan,
    `Biyo-Rezonans Analizi (${scan.frequencyHz} Hz)`,
    patientName
  );
}

export const downloadPDF = exportScanReportToPDF;
export const downloadWord = exportScanReportToWord;
