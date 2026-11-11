export type PackageId =
  | 'PKG_MINI_DENEME'
  | 'PKG_BRONZ_BASLANGIC'
  | 'PKG_GUMUS_STANDART'
  | 'PKG_GUMUS_PLUS'
  | 'PKG_ALTIN_DANISMAN'
  | 'PKG_ALTIN_PRO'
  | 'PKG_PLATIN_KLINIK'
  | 'PKG_SAFIR_KURUMSAL'
  | 'PKG_ZUMRUT_MASTER'
  | 'PKG_YAKUT_ELIT'
  | 'PKG_TITANYUM_ENTEGRE'
  | 'PKG_ELMAS_BOLGE'
  | 'PKG_MASTER_FRANCHISE'
  | 'PKG_ENTERPRISE_MEGA'
  | 'PAKET_A'
  | 'PAKET_B'
  | 'PAKET_C'
  | 'PAKET_D'
  | 'CUSTOM';

export interface PackageDefinition {
  id: Exclude<PackageId, 'CUSTOM'>;
  code: string;
  badgeCategory: string;
  name: string;
  sessionCredits: number;
  sessionCreditsLabel: string;
  defaultPrice: number;
  perSessionCostLabel: string;
  unitSessionCostLabel?: string;
  rankOrder: number; // 1 = Paket A, 2 = Paket B, 3 = Paket C, 4 = Paket D
  equivalentTierLabel: string;
  imageUrl: string;
  isPopular?: boolean;
  isFlagship?: boolean;
  description: string;
  shortDescription?: string;
  includedFeatures: string[];
  features: string[];
}

export const IMAGE_ASSETS = {
  heroHub: '/src/assets/images/hero_frequency_hub_1791604064536.jpg',
  tierStarter: '/src/assets/images/pkg_tier_starter_1791604076167.jpg',
  tierClinical: '/src/assets/images/pkg_tier_clinical_1791604087128.jpg',
  tierGemstone: '/src/assets/images/pkg_tier_gemstone_1791604097925.jpg',
  tierEnterprise: '/src/assets/images/pkg_tier_enterprise_1791604108626.jpg',
};

const RAW_FREKANS_PACKAGES: Array<Omit<PackageDefinition, 'features' | 'unitSessionCostLabel' | 'shortDescription'>> = [
  {
    id: 'PKG_MINI_DENEME',
    code: 'MİNİ DENEME',
    badgeCategory: 'MİNİ DENEME',
    name: 'Mini Başlangıç & Deneme Paketi',
    sessionCredits: 32,
    sessionCreditsLabel: '32 Seans Kredisi',
    defaultPrice: 101,
    perSessionCostLabel: '$3.16/seans',
    rankOrder: 1,
    equivalentTierLabel: 'Paket A (1–2. Kariyer Uygunluğu)',
    imageUrl: IMAGE_ASSETS.tierStarter,
    description:
      'Bireysel frekans analizi ve temel seans uygulamalarına giriş için tasarlanmış başlangıç kredi havuzu paketi.',
    includedFeatures: [
      '32 Bayi Seans Kredisi Havuzu (156 $/seans birim maliyet)',
      'Temel Biyo-Frekans Kamera & Spektrum Analiz Modülü Erişimi',
      'Monoline Küresel Tek Hat Sıra Kaydı & %20 Direkt Sponsorluk Hakkı',
      '1. Kariyer (Emmâre) ve 2. Kariyer (Levvâme) Kişisel Hacim Şartı',
    ],
  },
  {
    id: 'PKG_BRONZ_BASLANGIC',
    code: 'BRONZ BAŞLANGIÇ',
    badgeCategory: 'BAŞLANGIÇ & BİREYSEL',
    name: 'Bronz Başlangıç & Seans Paketi',
    sessionCredits: 70,
    sessionCreditsLabel: '70 Seans Kredisi',
    defaultPrice: 201,
    perSessionCostLabel: '$2.87/seans',
    rankOrder: 1,
    equivalentTierLabel: 'Paket A+ (1–2. Kariyer Uygunluğu)',
    imageUrl: IMAGE_ASSETS.tierStarter,
    description:
      'Bireysel uygulayıcılar için genişletilmiş 70 seanslık kredi havuzu ve danışan takip paneli.',
    includedFeatures: [
      '70 Bayi Seans Kredisi Havuzu (142 $/seans birim maliyet)',
      'Danışan Biyo-Rezonans Raporlama & PDF Çıktı Modülü',
      'Monoline Tek Hat Komisyon Motoru Aktif Entegrasyonu',
      'Emmâre & Levvâme Mertebeleri Kişisel Hacim Uygunluğu',
    ],
  },
  {
    id: 'PKG_GUMUS_STANDART',
    code: 'GÜMÜŞ STANDART',
    badgeCategory: 'STANDART TERAPİST',
    name: 'Gümüş Standart Terapist Paketi',
    sessionCredits: 115,
    sessionCreditsLabel: '115 Seans Kredisi',
    defaultPrice: 302,
    perSessionCostLabel: '$2.63/seans',
    rankOrder: 2,
    equivalentTierLabel: 'Paket B (3–4. Kariyer Uygunluğu)',
    imageUrl: IMAGE_ASSETS.tierStarter,
    description:
      'Aktif terapistler için 115 seans kredisi ve çoklu frekans protokolü kütüphanesi.',
    includedFeatures: [
      '115 Bayi Seans Kredisi Havuzu (130 $/seans birim maliyet)',
      'Gelişmiş Terapist Frekans Protokolleri ve Seans Geçmişi',
      '3. Kariyer (Mülhime) & 4. Kariyer (Mutmainne) Paket B Alışveriş Şartı',
      '4. Üst Derinliğe Kadar Monoline Komisyon Kilidi Altyapısı',
    ],
  },
  {
    id: 'PKG_GUMUS_PLUS',
    code: 'GÜMÜŞ PLUS',
    badgeCategory: 'TERAPİST & PRATİSYEN',
    name: 'Gümüş Plus Terapist Paketi',
    sessionCredits: 160,
    sessionCreditsLabel: '160 Seans Kredisi',
    defaultPrice: 402,
    perSessionCostLabel: '$2.51/seans',
    rankOrder: 2,
    equivalentTierLabel: 'Paket B+ (3–4. Kariyer Uygunluğu)',
    imageUrl: IMAGE_ASSETS.tierStarter,
    description:
      'Yoğun danışan trafiğine sahip terapist ve pratisyenler için 160 seanslık avantajlı kredi paketi.',
    includedFeatures: [
      '160 Bayi Seans Kredisi Havuzu (125 $/seans birim maliyet)',
      'Kamera Tabanlı Aura & Frekans Spektrum Analiz Paketi',
      'Mülhime & Mutmainne Kariyer Mertebeleri Paket B Alışveriş Desteği',
      'Bayi Alt Ekip (Unilevel 7 Derinlik) İzleme Paneli',
    ],
  },
  {
    id: 'PKG_ALTIN_DANISMAN',
    code: 'ALTIN DANIŞMAN',
    badgeCategory: 'DANIŞMAN & KOÇ',
    name: 'Altın Danışman Paketi',
    sessionCredits: 215,
    sessionCreditsLabel: '215 Seans Kredisi',
    defaultPrice: 503,
    perSessionCostLabel: '$2.34/seans',
    rankOrder: 3,
    equivalentTierLabel: 'Paket C (5–6. Kariyer Uygunluğu)',
    imageUrl: IMAGE_ASSETS.tierClinical,
    description:
      'Profesyonel yaşam koçları ve bütünsel sağlık danışmanları için 215 seanslık yüksek verimli paket.',
    includedFeatures: [
      '215 Bayi Seans Kredisi Havuzu (116 $/seans birim maliyet)',
      'Altın Seviye Holistik Frekans & Rezonans Sentezleyici',
      '5. Kariyer (Râziye) & 6. Kariyer (Marziyye) Paket C Alışveriş Şartı',
      '%6 ve %8 Kariyer Fonu Ek Havuz Payı Adaylık Yetkisi',
    ],
  },
  {
    id: 'PKG_ALTIN_PRO',
    code: 'ALTIN PRO',
    badgeCategory: 'EN POPÜLER & F/P',
    name: 'Altın Pro Danışman Paketi',
    sessionCredits: 270,
    sessionCreditsLabel: '270 Seans Kredisi',
    defaultPrice: 603,
    perSessionCostLabel: '$2.23/seans',
    rankOrder: 3,
    equivalentTierLabel: 'Paket C+ (5–6. Kariyer Uygunluğu)',
    imageUrl: IMAGE_ASSETS.tierClinical,
    isPopular: true,
    description:
      'En yüksek fiyat/performans oranına sahip profesyonel danışman paketi; 270 seans kredisi ve klinik analitik araçları içerir.',
    includedFeatures: [
      '270 Bayi Seans Kredisi Havuzu (111 $/seans birim maliyet)',
      'Pro Kamera Biyo-Frekans Tarama + Otomatik Seans Planlayıcı',
      '5. Kariyer (Râziye) & 6. Kariyer (Marziyye) Paket C Tam Uygunluğu',
      'Dinamik Kampanya QR Üreteci ve Öncelikli Çekim Onayı',
    ],
  },
  {
    id: 'PKG_PLATIN_KLINIK',
    code: 'PLATİN KLİNİK',
    badgeCategory: 'UZMAN KLİNİK',
    name: 'Platin Klinik & Uzman Paketi',
    sessionCredits: 500,
    sessionCreditsLabel: '500 Seans Kredisi',
    defaultPrice: 1005,
    perSessionCostLabel: '$2.01/seans',
    rankOrder: 4,
    equivalentTierLabel: 'Paket D (7. Kariyer Kâmile Uygunluğu)',
    imageUrl: IMAGE_ASSETS.tierClinical,
    description:
      'Uzman klinikler ve çoklu terapist merkezleri için 500 seans kredili kurumsal başlangıç paketi.',
    includedFeatures: [
      '500 Bayi Seans Kredisi Havuzu (100 $/seans birim maliyet)',
      'Çoklu Operatör / Terapist Alt Hesap Tanımlama Desteği',
      '7. Kariyer (Kâmile) Paket D Alışveriş Şartı Tam Uygunluğu',
      '7 Derinlik (%25) ve %10 Kâmile Kariyer Havuz Payı Uygunluğu',
    ],
  },
  {
    id: 'PKG_SAFIR_KURUMSAL',
    code: 'SAFİR KURUMSAL',
    badgeCategory: 'SAFİR KURUMSAL',
    name: 'Safir Kurumsal Merkez Paketi',
    sessionCredits: 650,
    sessionCreditsLabel: '650 Seans Kredisi',
    defaultPrice: 1206,
    perSessionCostLabel: '$1.86/seans',
    rankOrder: 4,
    equivalentTierLabel: 'Paket D (7. Kariyer Kâmile Uygunluğu)',
    imageUrl: IMAGE_ASSETS.tierGemstone,
    description:
      'Kurumsal sağlıklı yaşam merkezleri için 650 seans kredisi ve düşük birim seans maliyeti.',
    includedFeatures: [
      '650 Bayi Seans Kredisi Havuzu (92 $/seans birim maliyet)',
      'Safir Kurumsal Marka Başlığı ile Özelleştirilmiş Danışan Raporları',
      '7. Kariyer (Kâmile) Paket D Alışveriş Uygunluğu',
      'Kurumsal IBAN & TRC20 Hızlı Komisyon Mutabakatı',
    ],
  },
  {
    id: 'PKG_ZUMRUT_MASTER',
    code: 'ZÜMRÜT MASTER',
    badgeCategory: 'ZÜMRÜT MASTER',
    name: 'Zümrüt Master Klinik Paketi',
    sessionCredits: 800,
    sessionCreditsLabel: '800 Seans Kredisi',
    defaultPrice: 1407,
    perSessionCostLabel: '$1.76/seans',
    rankOrder: 4,
    equivalentTierLabel: 'Paket D (7. Kariyer Kâmile Uygunluğu)',
    imageUrl: IMAGE_ASSETS.tierGemstone,
    description:
      'Yüksek kapasiteli master klinikler için 800 seans kredisi ve gelişmiş spektral veri analitiği.',
    includedFeatures: [
      '800 Bayi Seans Kredisi Havuzu (87 $/seans birim maliyet)',
      'Zümrüt Master Frekans Kütüphanesi & Özel Rezonans Algoritmaları',
      '7. Kariyer (Kâmile) Zirve Mertebesi Paket D Uygunluğu',
      'Bölgesel Alt Bayi Yetiştirme & Sponsorluk Yetkisi',
    ],
  },
  {
    id: 'PKG_YAKUT_ELIT',
    code: 'YAKUT ELİT',
    badgeCategory: 'YAKUT ELİT',
    name: 'Yakut Elit Sağlık Paketi',
    sessionCredits: 950,
    sessionCreditsLabel: '950 Seans Kredisi',
    defaultPrice: 1608,
    perSessionCostLabel: '$1.69/seans',
    rankOrder: 4,
    equivalentTierLabel: 'Paket D (7. Kariyer Kâmile Uygunluğu)',
    imageUrl: IMAGE_ASSETS.tierGemstone,
    description:
      'Elit sağlık ve bütünsel terapi merkezleri için 950 seanslık yüksek hacimli kredi paketi.',
    includedFeatures: [
      '950 Bayi Seans Kredisi Havuzu (84 $/seans birim maliyet)',
      'VIP Danışan Portföy Yönetimi & Uzaktan Seans Senkronizasyonu',
      '7. Kariyer (Kâmile) Zirve Mertebesi Paket D Uygunluğu',
      'Yüksek Tutarlı Siparişlerde Anında %20 Sponsor + %25 Ağ Dağıtımı',
    ],
  },
  {
    id: 'PKG_TITANYUM_ENTEGRE',
    code: 'TİTANYUM ENTEGRE',
    badgeCategory: 'TİTANYUM ENTEGRE',
    name: 'Titanyum Entegre Tıp Paketi',
    sessionCredits: 1100,
    sessionCreditsLabel: '1100 Seans Kredisi',
    defaultPrice: 1809,
    perSessionCostLabel: '$1.64/seans',
    rankOrder: 4,
    equivalentTierLabel: 'Paket D (7. Kariyer Kâmile Uygunluğu)',
    imageUrl: IMAGE_ASSETS.tierGemstone,
    description:
      'Tamamlayıcı ve entegre tıp merkezleri için 1.100 seans kredisi ve API/Webhook entegrasyon desteği.',
    includedFeatures: [
      '1.100 Bayi Seans Kredisi Havuzu (81 $/seans birim maliyet)',
      'Klinik CRM Sistemleri ile Doğrudan Webhook & API Senkronizasyonu',
      '7. Kariyer (Kâmile) Zirve Mertebesi Paket D Uygunluğu',
      'Özel Teknik Destek ve Klinik Kurulum Danışmanlığı',
    ],
  },
  {
    id: 'PKG_ELMAS_BOLGE',
    code: 'ELMAS DİSTRİBÜTÖR',
    badgeCategory: 'BÖLGE DİSTRİBÜTÖRÜ',
    name: 'Elmas Bölge Distribütör Paketi',
    sessionCredits: 1300,
    sessionCreditsLabel: '1300 Seans Kredisi',
    defaultPrice: 2010,
    perSessionCostLabel: '$1.55/seans',
    rankOrder: 4,
    equivalentTierLabel: 'Paket D+ (Bölge Distribütörlüğü)',
    imageUrl: IMAGE_ASSETS.tierEnterprise,
    description:
      'İl ve bölge distribütörleri için 1.300 seans kredisi, alt bayi kredi transferi ve bölge temsil yetkisi.',
    includedFeatures: [
      '1.300 Bayi Seans Kredisi Havuzu (76 $/seans birim maliyet)',
      'Bölge Distribütörlüğü Lisansı & Alt Bayi Seans Kredisi Tahsisi',
      '7. Kariyer (Kâmile) + %10 Kariyer Fonu Havuz Payı Önceliği',
      'Bölgesel Pazarlama & QR Kampanya Yönetim Konsolu',
    ],
  },
  {
    id: 'PKG_MASTER_FRANCHISE',
    code: 'MASTER FRANCHISE',
    badgeCategory: 'MASTER FRANCHISE',
    name: 'Master Franchise & Çoklu Şube Paketi',
    sessionCredits: 3000,
    sessionCreditsLabel: '3000 Seans Kredisi',
    defaultPrice: 4021,
    perSessionCostLabel: '$1.34/seans',
    rankOrder: 4,
    equivalentTierLabel: 'Paket D+ (Master Franchise)',
    imageUrl: IMAGE_ASSETS.tierEnterprise,
    description:
      'Birden fazla şubeye sahip zincir merkezler ve Master Franchise yatırımcıları için 3.000 seans kredisi.',
    includedFeatures: [
      '3.000 Bayi Seans Kredisi Havuzu (66 $/seans birim maliyet)',
      'Çoklu Şube Merkezi Yönetim Paneli & Sınırsız Terapist Alt Hesabı',
      '7. Kariyer (Kâmile) Zirve Yetkisi ve Kurumsal Havuz Payı',
      'White-Label Raporlama ve Özel Etki Alanı (Domain) Yönlendirmesi',
    ],
  },
  {
    id: 'PKG_ENTERPRISE_MEGA',
    code: 'ENTERPRISE MEGA',
    badgeCategory: 'ENTERPRISE MEGA AĞ',
    name: 'Enterprise Mega Ağ & Holding Paketi',
    sessionCredits: 5000,
    sessionCreditsLabel: '5000 Seans Kredisi',
    defaultPrice: 6031,
    perSessionCostLabel: '$1.21/seans',
    rankOrder: 4,
    equivalentTierLabel: 'Paket D+ (Enterprise Mega Ağ)',
    imageUrl: IMAGE_ASSETS.tierEnterprise,
    description:
      'Ulusal ve uluslararası sağlık grupları, holdingler ve mega ağ liderleri için 5.000 seans kredili kurumsal paket.',
    includedFeatures: [
      '5.000 Bayi Seans Kredisi Havuzu (60 $/seans en düşük birim maliyet)',
      'Enterprise Ölçekte Sınırsız Şube ve Uluslararası Monoline Ağ Desteği',
      '7. Kariyer (Kâmile) + Özel Kurumsal SLA ve Dedicated Sunucu Hattı',
      'Tüm Alt Ağ Ciro ve Komisyon Analitiği (Real-Time BI Export)',
    ],
  },
];

export const FREKANS_PACKAGES: PackageDefinition[] = RAW_FREKANS_PACKAGES.map((pkg) => ({
  ...pkg,
  unitSessionCostLabel: pkg.perSessionCostLabel,
  shortDescription: pkg.description,
  features: pkg.includedFeatures,
}));

export const PACKAGES: Record<Exclude<PackageId, 'CUSTOM'>, PackageDefinition> = {
  PKG_MINI_DENEME: FREKANS_PACKAGES[0],
  PKG_BRONZ_BASLANGIC: FREKANS_PACKAGES[1],
  PKG_GUMUS_STANDART: FREKANS_PACKAGES[2],
  PKG_GUMUS_PLUS: FREKANS_PACKAGES[3],
  PKG_ALTIN_DANISMAN: FREKANS_PACKAGES[4],
  PKG_ALTIN_PRO: FREKANS_PACKAGES[5],
  PKG_PLATIN_KLINIK: FREKANS_PACKAGES[6],
  PKG_SAFIR_KURUMSAL: FREKANS_PACKAGES[7],
  PKG_ZUMRUT_MASTER: FREKANS_PACKAGES[8],
  PKG_YAKUT_ELIT: FREKANS_PACKAGES[9],
  PKG_TITANYUM_ENTEGRE: FREKANS_PACKAGES[10],
  PKG_ELMAS_BOLGE: FREKANS_PACKAGES[11],
  PKG_MASTER_FRANCHISE: FREKANS_PACKAGES[12],
  PKG_ENTERPRISE_MEGA: FREKANS_PACKAGES[13],
  PAKET_A: {
    ...FREKANS_PACKAGES[0],
    id: 'PAKET_A',
    code: 'Paket A (Mini / Bronz)',
  },
  PAKET_B: {
    ...FREKANS_PACKAGES[2],
    id: 'PAKET_B',
    code: 'Paket B (Gümüş Serisi)',
  },
  PAKET_C: {
    ...FREKANS_PACKAGES[5],
    id: 'PAKET_C',
    code: 'Paket C (Altın Pro Serisi)',
  },
  PAKET_D: {
    ...FREKANS_PACKAGES[6],
    id: 'PAKET_D',
    code: 'Paket D (Platin & Kurumsal)',
  },
};

export interface CareerLegRequirement {
  minCareerLevel: number; // 2: Levvâme, 3: Mülhime, 4: Mutmainne, 5: Râziye, 6: Marziyye
  minCareerTitle: string;
  requiredCount: number; // Farklı kollarda (leg) gereken adet
}

export interface CareerTier {
  level: number; // 1..7
  title: string;
  subtitle?: string;
  label: string;
  minPackageId: Exclude<PackageId, 'CUSTOM'>;
  minPackageLabel: string;
  minPackageRank: number; // 1=Paket A, 2=Paket B, 3=Paket C, 4=Paket D
  minPersonalVolume: number; // Kişisel alışveriş şartı (USD)
  minActiveDirects: number; // Direkt aktif referans şartı
  minGroupVolume: number; // Grup Ciro Şartı - PGV (USD)
  enforceMaxSingleLegPercent: boolean; // %50 Dengeli Kol Kuralı aktif mi
  maxSingleLegPercent: number; // Tek bir koldan gelebilecek maksimum ciro oranı (Varsayılan: %50)
  requiredDownlineCareers: CareerLegRequirement[]; // Farklı kollarda yetiştirilmesi gereken kariyerli alt ekip şartları
  organizationRuleSummary: string; // Organizasyon ve alt ekip kariyer kuralı özeti
  idealNetworkRatioLabel: string; // Örn: '%40 - %50'
  idealNetworkPyramidPercent: number; // 1.000 kişilik piramitte ideal yüzde: 40, 25, 17.5, 10, 5, 2, 0.5
  idealCountPer1000: number; // 1.000 kişilik aktif ağda ideal bayi sayısı: 400, 250, 175, 100, 50, 20, 5
  unlockedDepth: number; // 1..7
  depthCommissionPercent: number; // 7, 5, 4, 3, 2, 2, 2
  poolBonusRate: number;
  poolBonusLabel: string;
  fixedCareerBonusAmount?: number; // Yönetici tarafından belirlenen net kariyer bonusu (USD)
  enforceStrictOrganizationRules?: boolean; // Grup cirosu, %50 kuralı ve alt ekip kariyer şartlarının terfide zorunlu kontrolü
  meaning: string;
}

export const INITIAL_CAREER_TIERS: CareerTier[] = [
  {
    level: 1,
    title: 'Emmâre',
    subtitle: 'Başlangıç',
    label: '1. Kariyer',
    minPackageId: 'PKG_MINI_DENEME',
    minPackageLabel: 'Kişisel Aktiflik Yeterlidir',
    minPackageRank: 1,
    minPersonalVolume: 0,

    minActiveDirects: 0,
    minGroupVolume: 0,
    enforceMaxSingleLegPercent: false,
    maxSingleLegPercent: 100,
    requiredDownlineCareers: [],
    organizationRuleSummary: 'Organizasyon şartı yok (Başlangıç mertebesi).',
    idealNetworkRatioLabel: '%40 - %50',
    idealNetworkPyramidPercent: 40.0,
    idealCountPer1000: 400,
    unlockedDepth: 1,
    depthCommissionPercent: 7,
    poolBonusRate: 0.02,
    poolBonusLabel: '1. Derinlik (Unilevel %7 + Monoline %1.50) · Kısıt Yok',
    fixedCareerBonusAmount: 1000,
    enforceStrictOrganizationRules: true,
    meaning:
      'Kişisel Aktiflik — 1. Derinlik (Unilevel %7 + Monoline %1.50) hak edişi açıktır, kısıt yok.',
  },
  {
    level: 2,
    title: 'Levvâme',
    subtitle: 'Kendi Ekibini Kurmaya Başlayan',
    label: '2. Kariyer',
    minPackageId: 'PKG_MINI_DENEME',
    minPackageLabel: 'Kişisel Aktiflik Yeterlidir',
    minPackageRank: 1,
    minPersonalVolume: 0,

    minActiveDirects: 10,
    minGroupVolume: 2000,
    enforceMaxSingleLegPercent: false,
    maxSingleLegPercent: 100,
    requiredDownlineCareers: [],
    organizationRuleSummary: 'En az 10 Aktif Direkt Referans + $2.000 Ekip Cirosu (PGV). Alt kariyer şartı yok.',
    idealNetworkRatioLabel: '%20 - %25',
    idealNetworkPyramidPercent: 25.0,
    idealCountPer1000: 250,
    unlockedDepth: 2,
    depthCommissionPercent: 5,
    poolBonusRate: 0.03,
    poolBonusLabel: '2. Derinlik (+ Unilevel %5 + Monoline %1.00) · Kısıt Yok',
    fixedCareerBonusAmount: 2500,
    enforceStrictOrganizationRules: true,
    meaning:
      'Kişisel Aktiflik + En az 10 Aktif Üye + $2.000 Ekip Cirosu — 2. Derinlik (+ Unilevel %5 + Monoline %1.00) hak edişi.',
  },
  {
    level: 3,
    title: 'Mülhime',
    subtitle: 'Lider Adayı',
    label: '3. Kariyer',
    minPackageId: 'PKG_MINI_DENEME',
    minPackageLabel: 'Kişisel Aktiflik Yeterlidir',
    minPackageRank: 1,
    minPersonalVolume: 0,

    minActiveDirects: 20,
    minGroupVolume: 5000,
    enforceMaxSingleLegPercent: false,
    maxSingleLegPercent: 100,
    requiredDownlineCareers: [],
    organizationRuleSummary: 'En az 20 Aktif Direkt Referans + $5.000 Ekip Cirosu (PGV). Alt kariyer şartı yok.',
    idealNetworkRatioLabel: '%15 - %18',
    idealNetworkPyramidPercent: 17.5,
    idealCountPer1000: 175,
    unlockedDepth: 3,
    depthCommissionPercent: 4,
    poolBonusRate: 0.04,
    poolBonusLabel: '3. Derinlik (+ Unilevel %4 + Monoline %0.80) · Kısıt Yok',
    fixedCareerBonusAmount: 5000,
    enforceStrictOrganizationRules: true,
    meaning:
      'Kişisel Aktiflik + En az 20 Aktif Üye + $5.000 Ekip Cirosu — 3. Derinlik (+ Unilevel %4 + Monoline %0.80) hak edişi.',
  },
  {
    level: 4,
    title: 'Mutmainne',
    subtitle: 'Takım Lideri',
    label: '4. Kariyer',
    minPackageId: 'PKG_MINI_DENEME',
    minPackageLabel: 'Kişisel Aktiflik Yeterlidir',
    minPackageRank: 1,
    minPersonalVolume: 0,

    minActiveDirects: 50,
    minGroupVolume: 10000,
    enforceMaxSingleLegPercent: true,
    maxSingleLegPercent: 50,
    requiredDownlineCareers: [
      { minCareerLevel: 2, minCareerTitle: 'Levvâme', requiredCount: 1 },
    ],
    organizationRuleSummary:
      'Direkt referanslarından en az 1 tanesinin "Levvâme" (2. Kariyer) mertebesine ulaşmış olması gerekir.',
    idealNetworkRatioLabel: '%8 - %10',
    idealNetworkPyramidPercent: 10.0,
    idealCountPer1000: 100,
    unlockedDepth: 4,
    depthCommissionPercent: 3,
    poolBonusRate: 0.05,
    poolBonusLabel: '4. Derinlik (+ Unilevel %3 + Monoline %0.60) · Max %50 Tek Kol',
    fixedCareerBonusAmount: 10000,
    enforceStrictOrganizationRules: true,
    meaning:
      'Kişisel Aktiflik + En az 50 Aktif Üye + $10.000 Ekip Cirosu + En az 1 "Levvâme" Kol — 4. Derinlik (+ Unilevel %3 + Monoline %0.60).',
  },
  {
    level: 5,
    title: 'Râziye',
    subtitle: 'Organizasyon Yöneticisi',
    label: '5. Kariyer',
    minPackageId: 'PKG_MINI_DENEME',
    minPackageLabel: 'Kişisel Aktiflik Yeterlidir',
    minPackageRank: 1,
    minPersonalVolume: 0,

    minActiveDirects: 100,
    minGroupVolume: 50000,
    enforceMaxSingleLegPercent: true,
    maxSingleLegPercent: 50,
    requiredDownlineCareers: [
      { minCareerLevel: 3, minCareerTitle: 'Mülhime', requiredCount: 2 },
    ],
    organizationRuleSummary:
      'Farklı kollarında (leg) en az 2 adet "Mülhime" (3. Kariyer) kariyerinde bayi yetiştirmiş olmak.',
    idealNetworkRatioLabel: '%4 - %5',
    idealNetworkPyramidPercent: 5.0,
    idealCountPer1000: 50,
    unlockedDepth: 5,
    depthCommissionPercent: 2,
    poolBonusRate: 0.06,
    poolBonusLabel: '5. Derinlik (+ Unilevel %2 + Monoline %0.50) · Max %50 Tek Kol',
    fixedCareerBonusAmount: 20000,
    enforceStrictOrganizationRules: true,
    meaning:
      'Kişisel Aktiflik + En az 100 Aktif Üye + $50.000 Ekip Cirosu + Farklı kollarda 2 adet "Mülhime" — 5. Derinlik (+ Unilevel %2 + Monoline %0.50).',
  },
  {
    level: 6,
    title: 'Marziyye',
    subtitle: 'Üst Seviye Lider',
    label: '6. Kariyer',
    minPackageId: 'PKG_MINI_DENEME',
    minPackageLabel: 'Kişisel Aktiflik Yeterlidir',
    minPackageRank: 1,
    minPersonalVolume: 0,

    minActiveDirects: 500,
    minGroupVolume: 350000,
    enforceMaxSingleLegPercent: true,
    maxSingleLegPercent: 50,
    requiredDownlineCareers: [
      { minCareerLevel: 4, minCareerTitle: 'Mutmainne', requiredCount: 2 },
      { minCareerLevel: 3, minCareerTitle: 'Mülhime', requiredCount: 1 },
    ],
    organizationRuleSummary:
      'Farklı kollarında en az 2 adet "Mutmainne" (4. Kariyer) + 1 adet "Mülhime" (3. Kariyer) yetiştirmiş olmak.',
    idealNetworkRatioLabel: '%1.5 - %2',
    idealNetworkPyramidPercent: 2.0,
    idealCountPer1000: 20,
    unlockedDepth: 6,
    depthCommissionPercent: 2,
    poolBonusRate: 0.08,
    poolBonusLabel: '6. Derinlik (+ Unilevel %2 + Monoline %0.30) · Max %50 Tek Kol',
    fixedCareerBonusAmount: 35000,
    enforceStrictOrganizationRules: true,
    meaning:
      'Kişisel Aktiflik + En az 500 Aktif Üye + $350.000 Ekip Cirosu + Farklı kollarda 2 "Mutmainne" + 1 "Mülhime" — 6. Derinlik (+ Unilevel %2 + Monoline %0.30).',
  },
  {
    level: 7,
    title: 'Kâmile',
    subtitle: 'Zirve - Şirket Hissedarı / Sponsoru',
    label: '7. Kariyer',
    minPackageId: 'PKG_MINI_DENEME',
    minPackageLabel: 'Kişisel Aktiflik Yeterlidir',
    minPackageRank: 1,
    minPersonalVolume: 0,

    minActiveDirects: 1000,
    minGroupVolume: 1000000,
    enforceMaxSingleLegPercent: true,
    maxSingleLegPercent: 50,
    requiredDownlineCareers: [
      { minCareerLevel: 5, minCareerTitle: 'Râziye', requiredCount: 2 },
      { minCareerLevel: 4, minCareerTitle: 'Mutmainne', requiredCount: 2 },
    ],
    organizationRuleSummary:
      'Farklı kollarında en az 2 adet "Râziye" (5. Kariyer) + 2 adet "Mutmainne" (4. Kariyer) yetiştirmiş olmak.',
    idealNetworkRatioLabel: '%0.5 - %1',
    idealNetworkPyramidPercent: 0.5,
    idealCountPer1000: 5,
    unlockedDepth: 7,
    depthCommissionPercent: 2,
    poolBonusRate: 0.10,
    poolBonusLabel: '7. Derinliğin Tamamı (+ Unilevel %2 + Monoline %0.30) · Max %50 Tek Kol',
    fixedCareerBonusAmount: 50000,
    enforceStrictOrganizationRules: true,
    meaning:
      'Kişisel Aktiflik + En az 1000 Aktif Üye + $1.000.000 Ekip Cirosu + Farklı kollarda 2 "Râziye" + 2 "Mutmainne" — 7. Derinliğin Tamamı (+ Unilevel %2 + Monoline %0.30) + %10 Sistem Fonu Havuz Payı.',
  },
];

export const CAREER_TIERS = INITIAL_CAREER_TIERS;

// V2.0 SQL Table: career_rules (SELECT * FROM career_rules ORDER BY level ASC)
export interface CareerRuleRecord {
  level: number;
  title: string;
  min_personal_volume: number;
  min_direct_refs: number;
  min_group_volume: number;
  depth_unlocked: number;
  pool_share_percent: number;
}

export const INITIAL_CAREER_RULES: CareerRuleRecord[] = INITIAL_CAREER_TIERS.map((t) => ({
  level: t.level,
  title: t.title,
  min_personal_volume: t.minPersonalVolume,
  min_direct_refs: t.minActiveDirects,
  min_group_volume: t.minGroupVolume,
  depth_unlocked: t.unlockedDepth,
  pool_share_percent: Math.round(t.poolBonusRate * 100),
}));

/**
 * Section 4: getSubCareerCount(client, userId, requiredCareerLevel)
 * Kullanıcının farklı direkt sponsorluk kollarında (legs) en az `requiredCareerLevel`
 * aktif veya maksimum kariyer seviyesine ulaşmış kaç alt kolu olduğunu döndürür.
 */
export function getSubCareerCount(
  allMembers: MonolineMember[],
  userId: string | number,
  requiredCareerLevel: number
): number {
  const targetMember = allMembers.find(
    (m) => m && (m.user_id === String(userId) || m.id === Number(userId))
  );
  if (!targetMember) return 0;

  const directChildren = allMembers.filter(
    (m) => m && (m.sponsor_id === targetMember.user_id || m.sponsor_db_id === targetMember.id)
  );

  let qualifiedLegsCount = 0;

  for (const directChild of directChildren) {
    const visited = new Set<string>([directChild.user_id]);
    const queue: MonolineMember[] = [directChild];
    let maxLevelInLeg = directChild.active_career_level || directChild.career_level || 1;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const effLvl = curr.active_career_level || curr.career_level || 1;
      if (effLvl > maxLevelInLeg) {
        maxLevelInLeg = effLvl;
      }
      const subChildren = allMembers.filter(
        (m) =>
          m &&
          (m.sponsor_id === curr.user_id || m.sponsor_db_id === curr.id) &&
          !visited.has(m.user_id)
      );
      for (const sc of subChildren) {
        visited.add(sc.user_id);
        queue.push(sc);
      }
    }

    if (maxLevelInLeg >= requiredCareerLevel) {
      qualifiedLegsCount++;
    }
  }

  return qualifiedLegsCount;
}

export interface MemberLegSummary {
  rootDirectMemberId: string;
  rootDirectMemberName: string;
  rootDirectCareerLevel: number;
  rootDirectCareerTitle: string;
  legTotalVolume: number;
  legRolling30dVolume: number;
  leg_vol_30d?: number; // SQL: SUM(group_volume_30d + personal_volume_30d) as leg_vol
  capped_leg_vol_30d?: number; // SQL: vol > maxCapPerLeg ? maxCapPerLeg : vol
  is_capped_by_50_rule?: boolean;
  legMemberCount: number;
  maxCareerLevelInLeg: number;
  maxCareerTitleInLeg: string;
}

export interface MemberOrganizationEvaluation {
  activeDirectsCount: number;
  sponsorTreeGroupVolume: number;
  rolling30dSponsorTreeVolume: number;
  effectiveGroupVolume: number; // Max of sponsor tree volume & monoline group volume (or rolling 30-day PGV)
  total_gv_30d: number; // Section 4: let totalGV = parseFloat(user.group_volume_30d)
  max_cap_per_leg: number; // Section 4: let maxCapPerLeg = totalGV * 0.50
  adjusted_gv: number; // Section 4: adjustedGV += vol > maxCapPerLeg ? maxCapPerLeg : vol
  target_active_level: number; // Section 4: targetActiveLevel (1..7)
  max_career_level: number; // Section 4: GREATEST(max_career_level, targetActiveLevel)
  sub_career_counts: Record<number, number>; // getSubCareerCount(client, userId, 2..5)
  legs: MemberLegSummary[];
  strongestLegVolume: number;
  otherLegsVolume: number;
  strongestLegSharePercent: number;
  tierChecks: Array<{
    level: number;
    title: string;
    personalOk: boolean;
    directsOk: boolean;
    groupVolumeOk: boolean;
    legBalanceOk: boolean;
    effectiveGroupVolumeAfterCap: number;
    downlineCareersOk: boolean;
    downlineCareersDetail: string;
    packageOk?: boolean;
    passPackage?: boolean;
    allStrictCriteriaMet: boolean;
    passPV: boolean;
    passRefs: boolean;
    passGV: boolean;
    passTeam: boolean;
  }>;
}

/**
 * Üyenin sponsorluk kollarını (legs), 30 günlük hareketli ekip cirosunu (Rolling 30-Day PGV),
 * %50 güçlü kol kuralını (adjustedGV / maxCapPerLeg) ve farklı kollardaki kariyerli alt ekip şartlarını analiz eder.
 */
export function evaluateMemberOrganizationMetrics(
  member: MonolineMember | undefined | null,
  allMembers: MonolineMember[] = [],
  tiers: CareerTier[] = INITIAL_CAREER_TIERS,
  useRolling30dPgv = true
): MemberOrganizationEvaluation {
  const safeMember: MonolineMember =
    member ||
    allMembers[0] || {
      user_id: 'fallback-member',
      full_name: 'Seçili Bayi Yok',
      global_line_id: 1,
      sponsor_id: null,
      career_level: 1,
      career_title: 'Emmâre',
      max_career_level: 1,
      max_career_title: 'Emmâre',
      active_career_level: 1,
      active_career_title: 'Emmâre',
      personal_volume: 0,
      group_volume: 0,
      rolling_30d_personal_volume: 0,
      rolling_30d_pgv: 0,
      highest_package_id: null,
      is_active: false,
      is_locked: false,
      total_earned: 0,
      pool_earnings: 0,
      joined_at: new Date().toISOString(),
    };

  const directChildren = allMembers.filter((m) => m && m.sponsor_id === safeMember.user_id);
  const activeDirectsCount = directChildren.filter((m) => m.is_active).length;

  const rawLegs: MemberLegSummary[] = directChildren.map((directChild) => {
    // Bu direkt referans kolunun (leg) altındaki tüm alt ağacı bul
    const visited = new Set<string>([directChild.user_id]);
    const queue: MonolineMember[] = [directChild];
    let legVol = 0;
    let legRollingVol = 0;
    let maxLvl = directChild.active_career_level || directChild.career_level || 1;
    let maxTitle = directChild.active_career_title || directChild.career_title || 'Emmâre';

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const pVol = curr.personal_volume || 0;
      const raw30d =
        typeof curr.personal_volume_30d === 'number'
          ? curr.personal_volume_30d
          : typeof curr.rolling_30d_personal_volume === 'number'
          ? curr.rolling_30d_personal_volume
          : pVol;
      const rVol = curr.is_active !== false ? Math.max(pVol, raw30d) : raw30d;
      legVol += pVol;
      legRollingVol += rVol;
      const effLvl = curr.active_career_level || curr.career_level || 1;
      const effTitle = curr.active_career_title || curr.career_title || 'Emmâre';
      if (effLvl > maxLvl) {
        maxLvl = effLvl;
        maxTitle = effTitle;
      }
      const subChildren = allMembers.filter(
        (m) => m && m.sponsor_id === curr.user_id && !visited.has(m.user_id)
      );
      for (const sc of subChildren) {
        visited.add(sc.user_id);
        queue.push(sc);
      }
    }

    const chosenLegVol = useRolling30dPgv ? legRollingVol : legVol;

    return {
      rootDirectMemberId: directChild.user_id,
      rootDirectMemberName: directChild.full_name,
      rootDirectCareerLevel: directChild.active_career_level || directChild.career_level,
      rootDirectCareerTitle: directChild.active_career_title || directChild.career_title,
      legTotalVolume: chosenLegVol,
      legRolling30dVolume: legRollingVol,
      leg_vol_30d: chosenLegVol,
      legMemberCount: visited.size,
      maxCareerLevelInLeg: maxLvl,
      maxCareerTitleInLeg: maxTitle,
    };
  });

  rawLegs.sort((a, b) => b.legTotalVolume - a.legTotalVolume);

  const sponsorTreeGroupVolume = rawLegs.reduce((sum, l) => sum + l.legTotalVolume, 0);
  const rolling30dSponsorTreeVolume = rawLegs.reduce((sum, l) => sum + l.legRolling30dVolume, 0);
  const baseGroupVol = useRolling30dPgv
    ? typeof safeMember.group_volume_30d === 'number'
      ? safeMember.group_volume_30d
      : typeof safeMember.rolling_30d_pgv === 'number'
      ? safeMember.rolling_30d_pgv
      : safeMember.group_volume || 0
    : safeMember.group_volume || 0;
  const effectiveGroupVolume = Math.max(sponsorTreeGroupVolume, baseGroupVol);

  // Section 4: 1. Kol (Leg) Bazlı Ciro Analizi (%50 Kol Denge Kuralı)
  // let totalGV = parseFloat(user.group_volume_30d);
  // let maxCapPerLeg = totalGV * 0.50; // En fazla %50'si 1 koldan gelebilir
  // let adjustedGV = 0;
  // legs.rows.forEach(leg => { let vol = parseFloat(leg.leg_vol); adjustedGV += vol > maxCapPerLeg ? maxCapPerLeg : vol; });
  const totalGV = sponsorTreeGroupVolume > 0 ? sponsorTreeGroupVolume : effectiveGroupVolume;
  const maxCapPerLeg = Math.round(totalGV * 0.5 * 100) / 100;
  let adjustedGV = 0;

  const legs: MemberLegSummary[] = rawLegs.map((leg) => {
    const vol = leg.legTotalVolume;
    const cappedVol = vol > maxCapPerLeg ? maxCapPerLeg : vol;
    adjustedGV = Math.round((adjustedGV + cappedVol) * 100) / 100;
    return {
      ...leg,
      leg_vol_30d: vol,
      capped_leg_vol_30d: cappedVol,
      is_capped_by_50_rule: vol > maxCapPerLeg && totalGV > 0,
    };
  });

  const strongestLegVolume = legs[0]?.legTotalVolume || 0;
  const otherLegsVolume = Math.max(0, sponsorTreeGroupVolume - strongestLegVolume);
  const strongestLegSharePercent =
    sponsorTreeGroupVolume > 0
      ? Math.round((strongestLegVolume / sponsorTreeGroupVolume) * 1000) / 10
      : 0;

  const effectivePersonalVolume = useRolling30dPgv
    ? Math.max(
        safeMember.personal_volume || 0,
        typeof safeMember.personal_volume_30d === 'number'
          ? safeMember.personal_volume_30d
          : typeof safeMember.rolling_30d_personal_volume === 'number'
          ? safeMember.rolling_30d_personal_volume
          : safeMember.personal_volume || 0
      )
    : safeMember.personal_volume || 0;

  const subCareerCounts: Record<number, number> = {
    2: getSubCareerCount(allMembers, safeMember.user_id, 2),
    3: getSubCareerCount(allMembers, safeMember.user_id, 3),
    4: getSubCareerCount(allMembers, safeMember.user_id, 4),
    5: getSubCareerCount(allMembers, safeMember.user_id, 5),
  };

  const activityExpiresMs = safeMember.activity_expires_at
    ? new Date(safeMember.activity_expires_at).getTime()
    : 0;
  const isActivityValid = safeMember.is_active && activityExpiresMs > Date.now();

  let targetActiveLevel = 1; // Emmâre Varsayılan
  let sequentialChainAlive = true;

  const tierChecks = tiers.map((tier) => {
    // Kişisel Şart: Tüm kariyerler için yalnızca aktiflik yapılması yeterlidir
    const personalOk = isActivityValid;
    const directsOk = activeDirectsCount >= tier.minActiveDirects;

    // %50 Kuralı (Maksimum Tek Kol Kuralı): Tek bir koldan hedef cironun veya toplam GV'nin en fazla %50'si sayılır
    const maxAllowedFromSingleLeg =
      tier.enforceMaxSingleLegPercent && tier.minGroupVolume > 0
        ? (tier.minGroupVolume * (tier.maxSingleLegPercent || 50)) / 100
        : Infinity;

    const cappedLegsSum =
      legs.length > 0
        ? legs.reduce((sum, l) => sum + Math.min(l.legTotalVolume, maxAllowedFromSingleLeg), 0)
        : effectiveGroupVolume;

    const effectiveGroupVolumeAfterCap = tier.enforceMaxSingleLegPercent
      ? cappedLegsSum
      : effectiveGroupVolume;

    const groupVolumeOk = effectiveGroupVolume >= (tier.minGroupVolume || 0);
    const legBalanceOk =
      !tier.enforceMaxSingleLegPercent ||
      tier.minGroupVolume <= 0 ||
      effectiveGroupVolumeAfterCap >= tier.minGroupVolume;

    // Farklı kollarda (distinct legs) kariyerli alt ekip kontrolü
    const sortedReqs = [...(tier.requiredDownlineCareers || [])].sort(
      (a, b) => b.minCareerLevel - a.minCareerLevel
    );
    const usedLegIds = new Set<string>();
    let downlineCareersOk = true;
    const reqDetails: string[] = [];

    for (const req of sortedReqs) {
      let matchedForReq = 0;
      for (const leg of legs) {
        if (usedLegIds.has(leg.rootDirectMemberId)) continue;
        if (leg.maxCareerLevelInLeg >= req.minCareerLevel) {
          usedLegIds.add(leg.rootDirectMemberId);
          matchedForReq++;
          if (matchedForReq >= req.requiredCount) break;
        }
      }
      if (matchedForReq < req.requiredCount) {
        downlineCareersOk = false;
      }
      reqDetails.push(`${matchedForReq}/${req.requiredCount} ${req.minCareerTitle}`);
    }

    // Package Rank Check (minPackageRank) - Kişisel şart olarak yalnızca aktiflik yeterlidir
    const packageOk = isActivityValid;

    // Section 4 explicit passPV, passRefs, passGV, passTeam checks
    // Kişisel şart: Tüm kariyerler için yalnızca aktiflik yapılması yeterlidir
    const passPV = isActivityValid;
    const passRefs = activeDirectsCount >= (tier.minActiveDirects || 0);
    const passGV = effectiveGroupVolumeAfterCap >= (tier.minGroupVolume || 0);
    const passTeam = downlineCareersOk;
    const passPackage = isActivityValid;

    const downlineCareersDetail =
      reqDetails.length > 0 ? reqDetails.join(' + ') : 'Alt kariyer şartı yok';

    const allStrictCriteriaMet =
      personalOk && directsOk && groupVolumeOk && legBalanceOk && downlineCareersOk && packageOk;

    if (sequentialChainAlive) {
      if (tier.level === 1 || (personalOk && passRefs && passGV && passTeam && packageOk)) {
        targetActiveLevel = tier.level;
      } else {
        sequentialChainAlive = false;
      }
    }

    return {
      level: tier.level,
      title: tier.title,
      personalOk,
      directsOk,
      groupVolumeOk,
      legBalanceOk,
      effectiveGroupVolumeAfterCap,
      downlineCareersOk,
      downlineCareersDetail,
      packageOk,
      passPackage,
      allStrictCriteriaMet,
      passPV,
      passRefs,
      passGV,
      passTeam,
    };
  });

  const computedMaxCareerLevel = Math.max(
    safeMember.max_career_level || safeMember.career_level || 1,
    targetActiveLevel
  );

  return {
    activeDirectsCount,
    sponsorTreeGroupVolume,
    rolling30dSponsorTreeVolume,
    effectiveGroupVolume,
    total_gv_30d: totalGV,
    max_cap_per_leg: maxCapPerLeg,
    adjusted_gv: adjustedGV,
    target_active_level: targetActiveLevel,
    max_career_level: computedMaxCareerLevel,
    sub_career_counts: subCareerCounts,
    legs,
    strongestLegVolume,
    otherLegsVolume,
    strongestLegSharePercent,
    tierChecks,
  };
}

export interface DepthDistributionRule {
  depth: number;
  percentage: number;
  rate: number;
  label: string;
}

export interface UnilevelInfinityRule {
  career_level: number;
  career_title: string;
  infinity_bonus_percent: number;
  matching_bonus_percent: number;
}

export const UNILEVEL_INFINITY_RULES: UnilevelInfinityRule[] = [
  { career_level: 1, career_title: 'Emmâre', infinity_bonus_percent: 0.0, matching_bonus_percent: 0.0 },
  { career_level: 2, career_title: 'Levvâme', infinity_bonus_percent: 0.0, matching_bonus_percent: 0.0 },
  { career_level: 3, career_title: 'Mülhime', infinity_bonus_percent: 0.0, matching_bonus_percent: 10.0 },
  { career_level: 4, career_title: 'Mutmainne', infinity_bonus_percent: 2.0, matching_bonus_percent: 15.0 },
  { career_level: 5, career_title: 'Râziye', infinity_bonus_percent: 4.0, matching_bonus_percent: 20.0 },
  { career_level: 6, career_title: 'Marziyye', infinity_bonus_percent: 7.0, matching_bonus_percent: 25.0 },
  { career_level: 7, career_title: 'Kâmile (Sâfiye)', infinity_bonus_percent: 10.0, matching_bonus_percent: 25.0 },
];

export const INITIAL_MONOLINE_DEPTH_RATES: DepthDistributionRule[] = [
  { depth: 1, percentage: 7, rate: 0.07, label: '1. Üst Derinlik' },
  { depth: 2, percentage: 5, rate: 0.05, label: '2. Üst Derinlik' },
  { depth: 3, percentage: 4, rate: 0.04, label: '3. Üst Derinlik' },
  { depth: 4, percentage: 3, rate: 0.03, label: '4. Üst Derinlik' },
  { depth: 5, percentage: 2, rate: 0.02, label: '5. Üst Derinlik' },
  { depth: 6, percentage: 2, rate: 0.02, label: '6. Üst Derinlik' },
  { depth: 7, percentage: 2, rate: 0.02, label: '7. Üst Derinlik' },
];

export const MONOLINE_DEPTH_RATES = INITIAL_MONOLINE_DEPTH_RATES;

export interface SystemDistributionParameters {
  system_fund_percent: number;
  direct_sponsor_percent: number;
  monoline_total_percent: number;
  depth_percentages: number[];
  unilevel_depth_percentages?: number[]; // Motor 1: Sponsorlu Unilevel (%25)
  monoline_incentive_percentages?: number[]; // Motor 2: Küresel Monoline Sıra Teşviki (%5)
  unilevel_infinity_max_percent?: number;
  fast_roi_bonus_percent?: number;
  career_pool_percent?: number;
}

export type MemberRegion = 'DOMESTIC' | 'INTERNATIONAL';

export type WithdrawalChannel = 'TR_IBAN' | 'SWIFT' | 'SEPA' | 'WISE' | 'TRC20';

export interface BankAndCryptoDetails {
  iban_holder_name: string;
  bank_name: string;
  iban: string; // SQL: wallets.iban
  trc20_address: string; // SQL: wallets.crypto_trc20
  preferred_method: 'IBAN' | 'TRC20';
  swift_code?: string;
  wise_account?: string;
}

export interface TwoFactorAuthConfig {
  enabled: boolean;
  secret_key: string;
  verified_at: string | null;
  backup_codes: string[];
}

export interface MonolineMember {
  id: number; // SQL: users.id (BigInt, PK)
  user_id: string; // SQL: users.external_app_user_id (String, Unique)
  global_line_id: number; // SQL: users.monoline_position (BigSerial, Unique, Indexed)
  ref_code: string; // SQL: users.ref_code (String, Unique)
  full_name: string;
  email: string;
  phone: string;
  city: string;
  country_code?: string; // Kayıtta seçilen ülke (ISO 3166-1 alpha-2). Bölge bu değerden türetilir.
  joined_at: string;
  sponsor_id: string | null;
  sponsor_db_id: number | null; // SQL: users.sponsor_id (BigInt, FK -> users.id)
  fast_start_awarded?: boolean;
  highest_package_id: Exclude<PackageId, 'CUSTOM'> | null;
  session_credits: number;
  personal_volume: number;
  group_volume: number;
  personal_volume_30d?: number; // SQL: users.personal_volume_30d NUMERIC(15,2) DEFAULT 0.00
  group_volume_30d?: number; // SQL: users.group_volume_30d NUMERIC(15,2) DEFAULT 0.00
  active_direct_referrals_30d?: number; // SQL: users.active_direct_referrals_30d INT DEFAULT 0
  rolling_30d_personal_volume?: number; // V2.0: Hareketli 30 Günlük Kişisel Ciro ($)
  rolling_30d_pgv?: number; // V2.0: Hareketli 30 Günlük Ekip Cirosu - Rolling 30-Day PGV ($)
  active_direct_referrals: number;
  career_level: number; // SQL: users.career_level (SmallInt, Default: 1)
  career_title: string;
  max_career_level?: number; // SQL: users.max_career_level INT DEFAULT 1 (Kazanılan En Yüksek Unvan)
  max_career_title?: string; // V2.0: Profilde kalan en yüksek kariyer unvanı
  active_career_level?: number; // SQL: users.active_career_level INT DEFAULT 1 (O Ay Hak Edilen Aktif Kariyer)
  active_career_title?: string; // V2.0: Dönemsel hak ediş yetkisi unvanı
  monoline_position?: number; // SQL: users.monoline_position BIGSERIAL UNIQUE
  pool_leadership_points?: number; // V2.0: Dinamik Havuz Dağıtımı (Dynamic Pool Split Engine) liderlik puanı
  manual_career_override: number | null;
  unlocked_depth: number;
  wallets: {
    sponsor_wallet: number;
    monoline_wallet: number;
    career_pool_wallet: number;
    unilevel_wallet?: number; // Motor 1: Sponsorlu Unilevel 7 Derinlik Cüzdanı
    monoline_incentive_wallet?: number; // Motor 2: Küresel Monoline Sıra Teşvik Cüzdanı
    infinity_wallet?: number; // V2.2: Unilevel Sonsuzluk Fark Primi (%2..%10)
    matching_wallet?: number; // V2.2: Liderlik Eşleşme Bonusu (%10..%25)
    fast_roi_wallet?: number; // V2.2: "3 Getir Bedavaya Getir" +%15 Amortisman Bonusu
    total_earnings: number;
    system_fund_balance: number; // SQL: wallets.system_fund_balance (Decimal(15,2), Default: 0)
    total_withdrawn: number;
    wallet_domestic_usd?: number; // Yurt içi üyelerden doğan USD bakiyesi
    wallet_international_usd?: number; // Yurt dışı üyelerden doğan USD bakiyesi (yurt içiyle karıştırılmaz)
    pending_domestic_usd?: number; // Yurt içi 14 gün bekleyen USD bakiyesi
    pending_international_usd?: number; // Yurt dışı 14 gün bekleyen USD bakiyesi
  };
  bank_details: BankAndCryptoDetails;
  two_factor: TwoFactorAuthConfig;
  is_active: boolean; // SQL: users.is_active (Boolean, Default: true)
  is_locked: boolean;
  activity_expires_at: string; // SQL: users.activity_expires_at (Timestamp, 30 günlük süre sonu)
  welcome_bonus_granted?: boolean; // İlk bayi kaydında bir defaya mahsus 32+32 (64) hoşgeldin bonusu tanımlandı mı
  welcome_bonus_credits?: number; // Tanımlanan hoşgeldin bonusu kredi miktarı (32+32 = 64)
  // V2.1 Patch: Hukuki Onay, Vergi/Stopaj ve Güvenlik İzleri (ALTER TABLE users)
  tc_identity_no?: string; // VARCHAR(11) UNIQUE -- Stopaj ve Fatura için zorunlu
  has_tax_company?: boolean; // BOOLEAN DEFAULT FALSE -- Şirketi var mı? (Varsa fatura keser, stopaj düşülmez)
  last_login_ip?: string; // VARCHAR(45)
  device_fingerprint?: string;
  kvkk_approved_at?: string; // TIMESTAMP
  contract_version?: string; // VARCHAR(20) DEFAULT 'v2.0'
  daily_withdrawal_limit?: number; // Kariyer seviyesine göre günlük maksimum çekim limiti (Velocity Limit)
  password?: string; // Bayi giriş şifresi (Panel giriş ve yetkilendirme)
  assigned_leg?: 'LEFT' | 'RIGHT' | 'AUTO'; // Kol tercihi: Sol Kol / Sağ Kol / Otomatik
  left_leg_volume?: number; // Sol kol ciro hacmi
  right_leg_volume?: number; // Sağ kol ciro hacmi
}

// V2.1 Velocity Limits: Kariyer seviyesine göre günlük maksimum çekim limiti ($)
export const DAILY_WITHDRAWAL_LIMITS_BY_CAREER: Record<number, number> = {
  1: 5000, // Emmâre: Günlük 5.000 $
  2: 10000, // Levvâme: Günlük 10.000 $
  3: 20000, // Mülhime: Günlük 20.000 $
  4: 35000, // Mutmainne: Günlük 35.000 $
  5: 50000, // Râziye: Günlük 50.000 $
  6: 75000, // Mardiyye: Günlük 75.000 $
  7: 100000, // Sâfiye: Günlük 100.000 $
};

// V2.1 Kariyer Atlama Tek Seferlik Ödülleri (Rank-Up Cash / Gift Bonus)
export const RANK_UP_REWARDS_BY_CAREER: Record<
  number,
  { description: string; cash_value: number }
> = {
  2: {
    description: '2. Kariyer (Levvâme) Gümüş Liderlik Rozeti & Başlangıç Nakit Ödülü',
    cash_value: 1500,
  },
  3: {
    description: '3. Kariyer (Mülhime) Altın Yaka Rozeti & Tek Seferlik Kariyer Nakit Ödülü',
    cash_value: 4000,
  },
  4: {
    description: '4. Kariyer (Mutmainne) Özel Tasarım Kol Saati + Nakit Kariyer Ödülü',
    cash_value: 10000,
  },
  5: {
    description: '5. Kariyer (Râziye) Amiral Gemisi Akıllı Telefon / Tablet + Liderlik Ödülü',
    cash_value: 25000,
  },
  6: {
    description: '6. Kariyer (Mardiyye) VIP Liderlik Tatili + Kurumsal Ofis Desteği',
    cash_value: 50000,
  },
  7: {
    description: '7. Kariyer (Sâfiye) Lüks Araç Katkı Fonu & Elmas Liderlik Ödülü',
    cash_value: 125000,
  },
};

// SQL Table 6: activity_logs (Aktiflik, Süre Uzatma, Cron Tespiti ve Çekim Engel Logları)
export interface ActivityLogRecord {
  id: number; // BigInt, PK
  user_id: number; // BigInt, FK -> users.id
  external_user_id: string;
  user_full_name: string;
  action_type:
    | 'PACKAGE_RENEWAL'
    | 'CRON_EXPIRED_DEACTIVATED'
    | 'ADMIN_MANUAL_UPDATE'
    | 'WITHDRAWAL_BLOCKED_INACTIVE'
    | 'WELCOME_BONUS_GRANTED'
    | 'P2P_TRANSFER_SENT'
    | 'P2P_TRANSFER_RECEIVED';
  timestamp?: string;
  previous_expires_at: string | null;
  new_expires_at: string | null;
  is_active_after: boolean;
  description: string;
  created_at: string;
}

export type UnclaimedTransferReasonCode =
  | 'POOL_TRANSFER_NO_YETKI'
  | 'POOL_TRANSFER_INACTIVE'
  | 'POOL_TRANSFER_NO_UPLINE'
  | 'POOL_TRANSFER_NO_SPONSOR'
  | 'POOL_TRANSFER_NO_USER';

// V2.0 SQL Table 7: unclaimed_commissions (Ayrıştırılmış Devir Muhasebesi)
export interface UnclaimedCommissionRecord {
  id: number;
  order_id: string;
  source_user_id: number;
  source_external_id: string;
  source_user_name: string;
  intended_user_id: number | null;
  intended_external_id: string | null;
  intended_user_name: string | null;
  intended_monoline_position: number | null;
  commission_type: 'SPONSOR' | 'MONOLINE_DEPTH' | 'UNILEVEL_COMMISSION' | 'MONOLINE_INCENTIVE';
  depth_level: number | null;
  amount: number;
  reason_code: UnclaimedTransferReasonCode;
  reason_detail: string;
  member_max_career_level?: number;
  member_active_career_level?: number;
  created_at: string;
}

// V2.0 Asenkron Kuyruk (BullMQ / Redis) İşlem Kaydı
export interface BullMqJobRecord {
  job_id: string;
  queue_name:
    | 'commission-processing'
    | 'bullmq:order-commission'
    | 'bullmq:order-refund'
    | 'bullmq:clawback-release';
  job_name?: string; // 'process-commission'
  order_id: string;
  user_id: string;
  order_amount: number;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  worker_id: string;
  redis_lock_key: string;
  attempts_made: number;
  max_attempts?: number; // { attempts: 3 }
  backoff_ms?: number; // { backoff: 5000 }
  enqueued_at: string;
  completed_at: string | null;
  processing_ms: number;
  result_summary: string;
}

export interface V2ArchitectureConfig {
  use_rolling_30d_pgv: boolean; // Hareketli 30 günlük ekip cirosu baz alınır
  use_dynamic_active_career: boolean; // max_career_level vs active_career_level ayrımı
  async_queue_enabled: boolean; // BullMQ / Redis Asenkron Kuyruk Mimarisi
  dynamic_compression_enabled?: boolean; // V2.2 Revizyon 1: Monoline 7 Derinlik Dinamik Sıkıştırma
  dynamic_compression_mode?: 'FULL_COMPRESSION' | 'HYBRID_50_50' | 'FUND_SWEEP'; // 2️⃣ Hibrit Dinamik Sıkıştırma Modu
  unilevel_infinity_enabled?: boolean; // V2.2 Revizyon 1: %10 Unilevel Sonsuzluk Fark Primi
  matching_bonus_enabled?: boolean; // V2.2 Revizyon 2: %10..%25 Liderlik Eşleşme Bonusu
  fast_roi_3x15_enabled?: boolean; // V2.2 Revizyon 3: "3 Getir Bedavaya Getir" +%15 Amortisman Bonusu
  fomo_48h_countdown_enabled?: boolean; // 1️⃣ Geri Sayım Sayacı (48 Saat) ve FOMO Bildirim Sistemi
  p2p_voucher_transfer_enabled?: boolean; // 3️⃣ P2P İç Bakiye Transferi & Aktivasyon Kodu (Voucher)
  fast_start_window_days?: number; // 4️⃣ Hızlı Başlangıç (Fast-Start) Süresi (14 Gün veya 30 Gün)
  welcome_30d_double_bonus_enabled?: boolean; // 4️⃣ İlk 30 Gün Hoş Geldin Duble Bonusu (Admin Aç/Kapat)
  whatsapp_business_push_enabled?: boolean; // 5️⃣ Anlık WhatsApp Business API & Push Bildirim Entegrasyonu
}

export type CommissionLogStatusType =
  | 'PENDING_14D'
  | 'RELEASED'
  | 'REFUNDED_CANCELLED'
  | 'POOL_TRANSFER_NO_YETKI'
  | 'POOL_TRANSFER_INACTIVE'
  | 'POOL_TRANSFER_NO_UPLINE'
  | 'POOL_TRANSFER_NO_SPONSOR'
  | 'POOL_TRANSFER_NO_USER'
  | 'SYSTEM_FUND'
  | 'FRAUD_REVIEW';

// SQL Table 3: system_wallet (3. SİSTEM ŞİRKET VE DEVİR HAVUZU)
export interface SystemWalletRecord {
  id: number; // INT PRIMARY KEY DEFAULT 1
  system_pool_balance: number; // NUMERIC(15,2) DEFAULT 0.00 -- %5 Fon
  unclaimed_pool_balance: number; // NUMERIC(15,2) DEFAULT 0.00 -- Yetkisizlik/Pasiflikten Devredenler
  updated_at: string; // TIMESTAMP DEFAULT CURRENT_TIMESTAMP
}

// SQL Table 5: orders_log (5. SİPARİŞ HAREKETLERİ & CAYMA/İADE TAKİP TABLOSU)
export interface OrderLogRecord {
  order_id: string; // VARCHAR(100) PRIMARY KEY
  user_id: number; // BIGINT REFERENCES users(id)
  external_user_id: string;
  user_full_name: string;
  package_id: string; // VARCHAR(50)
  amount: number; // NUMERIC(15,2) NOT NULL
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FRAUD_REVIEW'; // VARCHAR(20) DEFAULT 'COMPLETED'
  merchant_oid?: string;
  transaction_id?: string;
  payment_method?: string;
  client_ip?: string;
  created_at: string; // TIMESTAMP DEFAULT CURRENT_TIMESTAMP
}

// SQL Table 4: commission_logs (4. DETAYLI KOMİSYON VE İŞLEM GÜNLÜĞÜ)
export interface CommissionLogRecord {
  id: number; // BigInt, PK
  order_id: string; // String (Unique per order context)
  source_user_id: number; // BigInt
  source_external_id: string;
  source_user_name: string;
  target_user_id: number | null; // BigInt (0 veya null = SYSTEM_POOL / Havuza Devir)
  target_external_id: string;
  target_user_name: string;
  type:
    | 'SPONSOR'
    | 'UNILEVEL_COMMISSION'
    | 'MONOLINE_INCENTIVE'
    | 'MONOLINE_DEPTH'
    | 'SYSTEM_POOL'
    | 'UNILEVEL_INFINITY'
    | 'MATCHING_BONUS'
    | 'FAST_ROI_BONUS'; // Dual-Engine: 'UNILEVEL_COMMISSION', 'MONOLINE_INCENTIVE'
  commission_type:
    | 'SPONSOR'
    | 'UNILEVEL_COMMISSION'
    | 'MONOLINE_INCENTIVE'
    | 'MONOLINE_DEPTH'
    | 'CAREER_POOL'
    | 'SYSTEM_POOL'
    | 'UNILEVEL_INFINITY'
    | 'MATCHING_BONUS'
    | 'FAST_ROI_BONUS';
  depth_level: number | null; // Int, Nullable (1 ile 7 arası derinlik seviyesi)
  region?: MemberRegion; // Komisyonu üreten alımın bölgesi (cüzdan yönlendirmesi için)
  amount_usd?: number; // Bölgesel USD cüzdanına yazılan tutar
  amount: number; // Decimal(15,2)
  status?: CommissionLogStatusType; // 'PENDING_14D', 'RELEASED', 'REFUNDED_CANCELLED', 'POOL_TRANSFER_NO_YETKI', 'POOL_TRANSFER_INACTIVE', 'FRAUD_REVIEW'
  clawback_status?: 'PENDING_14D' | 'RELEASED_TO_BALANCE' | 'CLAWBACK_REFUNDED' | 'SYSTEM_FUND' | 'FRAUD_REVIEW';
  release_at?: string | null; // Çekilebilir Bakiyeye Geçiş Tarihi (+14 Gün)
  released_at?: string | null;
  refunded_at?: string | null;
  transfer_reason_code?: UnclaimedTransferReasonCode | 'PAID' | null;
  created_at: string;
}

// SQL Table 4: withdrawal_requests (V2.1 Vergi ve Kesinti Detaylı Çekim Tablosu Güncellemesi)
export interface WithdrawalRequestRecord {
  id: number; // BigInt, PK
  user_id: number; // BigInt, FK -> users.id
  external_user_id: string;
  user_full_name: string;
  monoline_position: number;
  career_title: string;
  career_level?: number;
  amount: number; // Decimal(15,2) (= gross_amount)
  gross_amount?: number; // V2.1 NUMERIC(15,2) NOT NULL -- Talep edilen Brüt
  tax_deduction?: number; // V2.1 NUMERIC(15,2) DEFAULT 0.00 -- %20 Stopaj Kesintisi
  net_amount?: number; // V2.1 NUMERIC(15,2) NOT NULL -- Bankaya Yatacak Net Tutar
  tax_rate_percent?: number; // %20 (Şahıs / Gider Pusulası) veya %0 (Vergi Mükellefi Şirket)
  has_tax_company?: boolean;
  tc_identity_no?: string;
  method: 'IBAN' | 'TRC20';
  payout_method: 'IBAN' | 'TRC20'; // Enum: 'IBAN', 'TRC20'
  payout_address: string; // Text
  region?: MemberRegion;
  currency?: 'TRY' | 'USD';
  channel?: WithdrawalChannel;
  bank_details: {
    method: 'IBAN' | 'TRC20';
    holder_name: string;
    bank_name?: string;
    iban?: string;
    trc20_address?: string;
    swift_code?: string;
    wise_account?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // Enum: 'PENDING', 'APPROVED', 'REJECTED'
  admin_note?: string | null;
  created_at: string;
  processed_at?: string | null;
  tax_refund_status?: 'NONE' | 'PENDING_ADMIN_APPROVAL' | 'APPROVED_CREDITED' | 'REJECTED';
  tax_refund_invoice_id?: number | null;
  invoice_no?: string;
  invoice_file_name?: string;
  invoice_file_type?: string;
  invoice_data_url?: string;
  bank_settlement_ref?: string;
  payout_provider?: string;
}

export interface TaxRefundInvoiceRecord {
  id: number;
  refund_code: string;
  withdrawal_id: number | string;
  user_id: number;
  external_user_id: string;
  user_full_name: string;
  career_title: string;
  career_level?: number;
  gross_withdrawal_amount: number;
  tax_deducted_amount: number; // %20 kesilen ve iade talep edilen vergi tutarı
  net_withdrawal_amount: number;
  invoice_no: string;
  tax_office_and_id?: string;
  invoice_file_name: string;
  invoice_file_type: string;
  invoice_file_size: number;
  invoice_data_url: string; // Cihazdan yüklenen fatura (Görsel/PDF base64 dataURL)
  iban: string;
  bank_name: string;
  holder_name: string;
  status: 'PENDING_ADMIN_APPROVAL' | 'APPROVED_CREDITED' | 'REJECTED';
  requested_at: string;
  processed_at?: string | null;
  admin_note?: string | null;
}

// Bayi Şikayet, Öneri ve Geri Bildirim Bildirim Modeli
export interface DealerFeedbackTicket {
  id: string; // örn: TKT-2026-101
  user_id: string;
  member_name: string;
  member_email?: string;
  member_phone?: string;
  member_ref_code?: string;
  member_career_level?: number;
  member_career_title?: string;
  type: 'COMPLAINT' | 'SUGGESTION' | 'REQUEST' | 'INQUIRY';
  subject: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: string;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';
  admin_reply?: string;
  admin_replied_at?: string;
  admin_replied_by?: string;
  created_at: string;
  updated_at: string;
}

// V2.1 SQL Table: user_rewards_log (3. KARİYER TEK SEFERLİK ÖDÜL & HEDİYE TAKİP TABLOSU)
export interface UserRewardLogRecord {
  id: number; // BIGSERIAL PRIMARY KEY
  user_id: number; // BIGINT REFERENCES users(id)
  external_user_id: string;
  user_full_name: string;
  career_level: number; // INT NOT NULL
  career_title: string;
  reward_type: 'RANK_UP_GIFT' | 'FAST_START'; // VARCHAR(50)
  reward_description: string; // VARCHAR(255)
  cash_value: number; // NUMERIC(15,2) DEFAULT 0.00
  is_delivered: boolean; // BOOLEAN DEFAULT FALSE
  earned_at: string; // TIMESTAMP DEFAULT CURRENT_TIMESTAMP
}
export type UserRewardRecord = UserRewardLogRecord;

// V2.1 SQL Table: notification_outbox (4. BİLDİRİM KUYRUĞU TABLOSU - SMS / WHATSAPP / PUSH)
export interface NotificationOutboxRecord {
  id: number; // BIGSERIAL PRIMARY KEY
  user_id: number; // BIGINT REFERENCES users(id)
  external_user_id: string;
  user_full_name: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP'; // VARCHAR(20)
  title?: string;
  trigger_type?:
    | 'SPONSOR_COMMISSION_EARNED'
    | 'DEPTH_COMMISSION_EARNED'
    | 'ACTIVITY_EXPIRY_3D_WARNING'
    | 'FOMO_LOST_COMMISSION'
    | 'FOMO_48H_COUNTDOWN_ALERT'
    | 'RANK_UP_REWARD'
    | 'FAST_START_BONUS'
    | 'WELCOME_30D_DOUBLE_BONUS'
    | 'P2P_VOUCHER_RECEIVED'
    | 'FRAUD_ALERT';
  order_amount?: number;
  commission_amount?: number;
  buyer_name?: string;
  message: string; // TEXT
  status: 'SENT' | 'FAILED'; // VARCHAR(20)
  created_at: string; // TIMESTAMP DEFAULT CURRENT_TIMESTAMP
}

// 1️⃣ Geri Sayım Sayacı (48 Saat) ve FOMO Bildirim Sistemi Kaydı
export interface FomoCountdownAlertRecord {
  id: number;
  user_id: number;
  external_user_id: string;
  user_full_name: string;
  source_order_id: string;
  source_buyer_name: string;
  source_order_amount: number;
  at_risk_commission_amount: number;
  depth_level: number;
  reason: 'INACTIVE_EXPIRED' | 'INSUFFICIENT_CAREER_DEPTH';
  warning_message: string;
  expires_at: string; // +48 saat geri sayım bitiş zamanı
  remaining_seconds: number;
  status: 'COUNTDOWN_ACTIVE_48H' | 'RESCUED_BY_RENEWAL' | 'TRANSFERRED_TO_SYSTEM_POOL';
  created_at: string;
}

export interface WalletTransactionRecord {
  id: number;
  transaction_id: string;
  user_id: number;
  external_user_id: string;
  user_full_name?: string;
  transaction_type:
    | 'PACKAGE_PURCHASE_WALLET'
    | 'MEMBER_REGISTRATION_WALLET'
    | 'CREDIT_PURCHASE_WALLET'
    | 'PAYOUT'
    | 'DEALER_PAYOUT';
  request_id?: string;
  direction?: 'DEBIT' | 'CREDIT';
  amount: number;
  balance_before?: number;
  balance_after?: number;
  order_id: string;
  related_user_id?: string;
  package_id?: string;
  description: string;
  status?: 'COMPLETED';
  created_at: string;
}

// 3️⃣ P2P İç Bakiye Transferi (p2p_transfer) Kaydı
export interface P2PTransferRecord {
  id: number;
  tx_code: string;
  from_user_id: number;
  from_external_id: string;
  from_user_name: string;
  to_user_id: number;
  to_external_id: string;
  to_user_name: string;
  amount: number;
  transfer_type: 'WALLET_TO_WALLET' | 'DIRECT_PACKAGE_ACTIVATION' | 'VOUCHER_MINT';
  package_id?: string | null;
  voucher_code?: string | null;
  note: string;
  status: 'COMPLETED';
  created_at: string;
}

// 3️⃣ Aktivasyon Kupon Kodu (Voucher) Kaydı
export interface ActivationVoucherRecord {
  id: number;
  voucher_code: string;
  creator_user_id: number;
  creator_external_id: string;
  creator_user_name: string;
  package_id: string;
  package_name: string;
  amount: number;
  session_credits: number;
  status: 'ACTIVE_UNUSED' | 'REDEEMED';
  redeemed_by_user_id?: number | null;
  redeemed_by_external_id?: string | null;
  redeemed_by_user_name?: string | null;
  redeemed_at?: string | null;
  created_at: string;
}

// V2.1 Anti-Fraud & Risk Engine Kaydı (Self-Referral Lock & IP/Cihaz Çakışması)
export interface FraudRiskAlertRecord {
  id: number;
  order_id?: string;
  user_id: number;
  external_user_id: string;
  user_full_name: string;
  rule_code: 'IP_COLLISION_24H' | 'SELF_REFERRAL_LOCK' | 'VELOCITY_LIMIT_EXCEEDED';
  ip_address: string;
  device_fingerprint?: string;
  status: 'FRAUD_REVIEW' | 'CLEARED_APPROVED' | 'REJECTED_BLOCKED';
  details: string;
  created_at: string;
}

export interface WebhookLogRecord {
  id: string;
  endpoint: string;
  http_status: number;
  status: 'SUCCESS' | 'FAILED' | 'IDEMPOTENT_REJECTED';
  order_id: string;
  user_id: string;
  order_amount: number;
  payload_json: string;
  response_message: string;
  processing_ms: number;
  created_at: string;
}

export interface CronJobExecutionRecord {
  id: string;
  trigger_type:
    | 'NIGHTLY_CRON'
    | 'POST_COMMISSION_EVENT'
    | 'MANUAL_ADMIN'
    | 'ACTIVITY_EXPIRY_CRON'
    | 'CLAWBACK_RELEASE_CRON'
    | 'RESTORE_DATA';
  evaluated_users_count: number;
  upgrades_count: number;
  deactivated_count?: number;
  released_commissions_count?: number;
  released_commissions_amount?: number;
  upgrades: Array<{
    user_id: string;
    full_name: string;
    old_level: number;
    old_title: string;
    new_level: number;
    new_title: string;
  }>;
  deactivated_users?: Array<{
    user_id: string;
    full_name: string;
    expired_at: string;
  }>;
  executed_at: string;
}

export interface DepthPayoutDetail {
  depth: number;
  rate_percent: number;
  calculated_amount: number;
  recipient_user_id: string | null;
  recipient_name: string | null;
  recipient_global_line_id: number | null;
  recipient_career_level: number;
  recipient_career_title: string;
  recipient_max_career_level?: number;
  recipient_max_career_title?: string;
  recipient_active_career_level?: number;
  recipient_active_career_title?: string;
  recipient_unlocked_depth: number;
  status:
    | 'PAID_TO_MEMBER'
    | 'TRANSFERRED_TO_POOL_CAREER_LOCK'
    | 'TRANSFERRED_TO_POOL_INACTIVE'
    | 'TRANSFERRED_TO_POOL_NO_UPLINE';
  transfer_reason_code?: UnclaimedTransferReasonCode | 'PAID';
  status_reason: string;
}

export interface OrderCommissionPayload {
  user_id: string;
  order_id: string;
  order_amount: number;
  package_id: string;
  timestamp?: string;
  enforce_career_depth_lock?: boolean;
  order_type?: 'ACTIVITY_RENEWAL' | 'STANDARD_ORDER' | 'ACTIVATION';
  payment_method?: 'CARD_3D' | 'CREDIT_CARD_3D' | 'BANK_EFT' | 'USDT_TRC20' | 'WALLET_BALANCE';
  merchant_oid?: string;
  transaction_id?: string;
  client_ip?: string;
  device_fingerprint?: string;
  card_fingerprint?: string;
}

export interface CommissionTransaction {
  transaction_id: string;
  order_id: string;
  buyer_user_id: string;
  buyer_name: string;
  buyer_global_line_id: number;
  package_id: string;
  session_credits_added: number;
  order_amount: number;
  timestamp: string;
  order_type?: 'ACTIVITY_RENEWAL' | 'STANDARD_ORDER' | 'ACTIVATION';
  activity_extended?: boolean;
  enforce_career_depth_lock: boolean;
  clawback_status?: 'PENDING_14D' | 'RELEASED_TO_BALANCE' | 'REFUNDED' | 'FRAUD_REVIEW';
  clawback_release_at?: string;
  refunded_at?: string | null;
  bullmq_job_id?: string;
  fraud_flagged?: boolean;
  fraud_reason?: string | null;
  system_fund_base_amount: number;
  system_fund_unclaimed_overflow: number;
  system_fund_total_added: number;
  direct_sponsor: {
    sponsor_user_id: string | null;
    sponsor_name: string | null;
    sponsor_global_line_id: number | null;
    rate_percent: number;
    amount_paid: number;
    redirected_to_pool: number;
    reason_code?: UnclaimedTransferReasonCode | 'PAID';
    note: string;
  };
  monoline_upline_payouts: DepthPayoutDetail[];
  unilevel_upline_payouts?: DepthPayoutDetail[]; // Motor 1: Sponsorlu Unilevel 7 Derinlik (%25)
  monoline_incentive_payouts?: DepthPayoutDetail[]; // Motor 2: Küresel Monoline Sıra Teşviki (%5)
  total_unilevel_distributed?: number;
  total_monoline_incentive_distributed?: number;
  unilevel_infinity_payouts?: Array<{
    recipient_user_id: string;
    recipient_name: string;
    career_level: number;
    career_title: string;
    unilevel_generation: number;
    member_infinity_percent: number;
    differential_percent: number;
    amount_paid: number;
  }>;
  matching_bonus_payouts?: Array<{
    sponsor_user_id: string;
    sponsor_name: string;
    sponsor_career_level: number;
    sponsor_career_title: string;
    downline_user_id: string;
    downline_name: string;
    downline_commission_earned: number;
    matching_percent: number;
    amount_paid: number;
  }>;
  compressed_skipped_members?: Array<{
    user_id: string;
    full_name: string;
    global_line_id: number;
    career_level: number;
    reason: string;
  }>;
  unclaimed_transfers?: UnclaimedCommissionRecord[];
  total_distributed_to_upline: number;
  total_infinity_distributed?: number;
  total_matching_distributed?: number;
  career_upgrades_triggered: Array<{
    user_id: string;
    full_name: string;
    old_level: number;
    old_title: string;
    new_level: number;
    new_title: string;
  }>;
}

export interface PoolDistributionRecord {
  distribution_id: string;
  timestamp: string;
  pool_balance_before: number;
  total_distributed: number;
  pool_balance_after: number;
  distribution_mode?: 'DYNAMIC_POINTS_SPLIT' | 'TIER_PERCENTAGE_SPLIT';
  total_leadership_points?: number;
  tier_Allocations: Array<{
    career_level: number;
    career_title: string;
    bonus_rate_percent: number;
    tier_pool_amount: number;
    qualified_member_count: number;
    amount_per_member: number;
    recipients: Array<{
      user_id: string;
      full_name: string;
      amount: number;
      leadership_points?: number;
      point_share_percent?: number;
    }>;
  }>;
}

export interface SystemStateResponse {
  members: MonolineMember[];
  career_tiers: CareerTier[];
  distribution_params: SystemDistributionParameters;
  business_rules?: any;
  activity_logs: ActivityLogRecord[];
  transactions: CommissionTransaction[];
  commission_logs: CommissionLogRecord[];
  system_wallet?: SystemWalletRecord;
  orders_log?: OrderLogRecord[];
  unclaimed_commissions?: UnclaimedCommissionRecord[];
  queue_jobs?: BullMqJobRecord[];
  v2_architecture_config?: V2ArchitectureConfig;
  unilevel_infinity_rules?: UnilevelInfinityRule[];
  withdrawal_requests: WithdrawalRequestRecord[];
  tax_refund_invoices?: TaxRefundInvoiceRecord[];
  feedback_tickets?: DealerFeedbackTicket[];
  user_rewards_log?: UserRewardLogRecord[];
  notification_outbox?: NotificationOutboxRecord[];
  fomo_countdown_alerts?: FomoCountdownAlertRecord[];
  p2p_transfers?: P2PTransferRecord[];
  wallet_transactions?: WalletTransactionRecord[];
  activation_vouchers?: ActivationVoucherRecord[];
  fraud_alerts?: FraudRiskAlertRecord[];
  webhook_logs: WebhookLogRecord[];
  cron_logs: CronJobExecutionRecord[];
  pool_distributions: PoolDistributionRecord[];
  system_metrics: {
    total_orders_count: number;
    total_order_volume: number;
    total_session_credits_issued: number;
    system_career_fund_balance: number;
    system_career_fund_cumulative: number;
    total_sponsor_commissions_paid: number;
    total_monoline_commissions_paid: number;
    total_career_pool_bonuses_paid: number;
    total_infinity_bonuses_paid?: number;
    total_matching_bonuses_paid?: number;
    total_fast_roi_bonuses_paid?: number;
    total_field_payout_amount?: number;
    company_net_profit_amount?: number;
    company_net_profit_percent?: number;
    total_withdrawn_amount: number;
    pending_withdrawals_amount: number;
    pending_withdrawals_count: number;
    idempotent_blocked_count: number;
    enforce_career_depth_lock: boolean;
    active_dealers_count?: number;
    expired_dealers_count?: number;
    total_pending_clawback_balance?: number;
    total_unclaimed_pool_transfers?: number;
    unclaimed_no_yetki_amount?: number;
    unclaimed_inactive_amount?: number;
    unclaimed_no_user_amount?: number;
    total_tax_withheld_amount?: number;
    total_rewards_cash_value?: number;
    fraud_review_count?: number;
    notifications_sent_count?: number;
  };
}
