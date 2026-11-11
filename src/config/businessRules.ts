/**
 * İş Kuralları ve Çift Motorlu Hibrit Komisyon Mimarisi Konfigürasyonu
 *
 * Motor 1: Sponsorlu Unilevel (Sponsor Ağacı - Toplam %25)
 * Motor 2: Küresel Monoline Sıra Teşviki (Global Line - Toplam %5)
 */

export interface BusinessRulesConfig {
  UNILEVEL_DEPTH_PERCENTAGES: number[];
  MONOLINE_INCENTIVE_PERCENTAGES: number[];
  DIRECT_SPONSOR_BONUS_PERCENT: number;
  SYSTEM_FUND_PERCENT: number;
  CLAWBACK_PROTECTION_DAYS: number;
  MAX_SINGLE_LEG_PERCENT: number;
  DYNAMIC_COMPRESSION_ENABLED: boolean; // Pasif sponsorların dinamik sıkıştırma ile atlanıp ilk aktif lidere prim bağlanması
  SKIP_PASSIVE_MONOLINE_ENABLED: boolean; // Monoline sırasında fiziki kaydırma yapmadan pasifleri dinamik taramayla atlama
}

export const BUSINESS_RULES: BusinessRulesConfig = {
  // Motor 1: Sponsorlu Unilevel (Sponsor Ağacı - Toplam %25)
  UNILEVEL_DEPTH_PERCENTAGES: [7, 5, 4, 3, 2, 2, 2],

  // Motor 2: Küresel Monoline Sıra Teşviki (Global Line - Toplam %5)
  MONOLINE_INCENTIVE_PERCENTAGES: [1.50, 1.00, 0.80, 0.60, 0.50, 0.30, 0.30],

  // Diğer Sabitler
  DIRECT_SPONSOR_BONUS_PERCENT: 20, // %20 Direkt Sponsor Satış Primi
  SYSTEM_FUND_PERCENT: 5,           // %5 Sistem Fonu
  CLAWBACK_PROTECTION_DAYS: 14,     // 14 Günlük Korumalı Bekleyen Bakiye
  MAX_SINGLE_LEG_PERCENT: 50,       // Kademe 4+ Tek Kol Katkı Sınırı (%50)
  DYNAMIC_COMPRESSION_ENABLED: false, // Varsayılan: Havuz Devri (Seçenek B); Dinamik Sıkıştırma (Seçenek A) istendiğinde true yapılır
  SKIP_PASSIVE_MONOLINE_ENABLED: false, // Varsayılan: Sıra havuz devri (Fiziki kaydırma yok); Aktif tarama istendiğinde true yapılır
};

export type BusinessRules = BusinessRulesConfig;
