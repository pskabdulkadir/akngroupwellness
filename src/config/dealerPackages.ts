export interface DealerPackage {
  id: string;
  name: string;
  scanCredits: number;
  price: number;
  priceText: string;
  badge: string;
  popular?: boolean;
  targetAudience: string;
  unitCostText: string;
  features: string[];
}

export const DEFAULT_DEALER_PACKAGES: DealerPackage[] = [
  {
    id: 'pkg-5k',
    name: 'Mini Deneme',
    scanCredits: 101,
    price: 101,
    priceText: '$101',
    badge: 'MİNİ DENEME',
    targetAudience: 'Sistemi düşük bütçeyle denemek isteyen bireysel kullanıcı ve uygulayıcılar.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '101 Adet Tam Biyo-Rezonans & Çakra Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Temel Aura ve Frekans Analiz Modülleri',
      'Web & Mobil Uyumlu Arayüz',
      'WhatsApp Destek Hattı'
    ]
  },
  {
    id: 'pkg-10k',
    name: 'Bronz Başlangıç',
    scanCredits: 201,
    price: 201,
    priceText: '$201',
    badge: 'BAŞLANGIÇ & BİREYSEL',
    targetAudience: 'Sisteme yeni adım atan bireysel terapist ve danışmanlar.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '201 Adet Tam Biyo-Rezonans & Çakra Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Tam Yetkili Bayi Paneli & Danışan Kaydı',
      'Özel Davet Linki & Referans Kodu (?ref=)',
      'Standart WhatsApp Canlı Destek Hattı'
    ]
  },
  {
    id: 'pkg-15k',
    name: 'Gümüş Standart',
    scanCredits: 302,
    price: 302,
    priceText: '$302',
    badge: 'STANDART TERAPİST',
    targetAudience: 'Düzenli danışan alan bireysel koçlar ve bio-enerji uygulayıcıları.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '302 Adet Tam Biyo-Rezonans & Çakra Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Organ, Çakra ve Meridyen Raporlama',
      'Danışan Takip Modülü',
      'Hızlı WhatsApp Destek Hizmeti'
    ]
  },
  {
    id: 'pkg-20k',
    name: 'Gümüş Plus',
    scanCredits: 402,
    price: 402,
    priceText: '$402',
    badge: 'TERAPİST & PRATİSYEN',
    targetAudience: 'Düzenli seans yapan holistik sağlık koçları ve pratisyenler.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '402 Adet Tam Biyo-Rezonans & Çakra Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Detaylı Organ, Çakra ve Letaif Analiz Raporları',
      'Danışan Kayıt & Takip Sistemi',
      'Öncelikli Frekans & Biyo-Rezonans Desteği'
    ]
  },
  {
    id: 'pkg-25k',
    name: 'Altın Danışman',
    scanCredits: 503,
    price: 503,
    priceText: '$503',
    badge: 'DANIŞMAN & KOÇ',
    targetAudience: 'Genişleyen danışan tabanına sahip profesyonel terapistler.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '503 Adet Tam Biyo-Rezonans & Çakra Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Gelişmiş PDF Rapor Dışa Aktarma',
      'Özel Frekans Listeleri & Protokoller',
      'Öncelikli Canlı Destek'
    ]
  },
  {
    id: 'pkg-30k',
    name: 'Altın Pro',
    scanCredits: 603,
    price: 603,
    priceText: '$603',
    badge: 'EN POPÜLER & F/P',
    popular: true,
    targetAudience: 'Yoğun danışan kabul eden profesyonel terapistler ve merkezler.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '603 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Gelişmiş PDF Rapor Dışa Aktarma & Arşivleme',
      'Özel Frekans Listeleri & Özel Protokol Tanımlama',
      'Kendi Danışanlarına Özel Fiyat Belirleme Özgürlüğü',
      'Öncelikli VIP WhatsApp Desteği'
    ]
  },
  {
    id: 'pkg-50k',
    name: 'Platin Klinik',
    scanCredits: 1005,
    price: 1005,
    priceText: '$1.005',
    badge: 'UZMAN KLİNİK',
    targetAudience: 'Geniş danışan portföyüne sahip klinikler ve bio-frekans merkezleri.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '1.005 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Çoklu Terapist ve Danışan Yönetim Desteği',
      'Özel Alt Bayilik (Sub-dealer) Oluşturma Yetkisi',
      '7/24 Kesintisiz VIP Destek & Heyet Danışmanlığı'
    ]
  },
  {
    id: 'pkg-60k',
    name: 'Safir Kurumsal',
    scanCredits: 1206,
    price: 1206,
    priceText: '$1.206',
    badge: 'SAFİR KURUMSAL',
    targetAudience: 'Çoklu seans odası bulunan sağlıklı yaşam ve holistik merkezler.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '1.206 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Grup Aura Senkronizasyonu & Çoklu Tarama',
      'Özel Kurumsal Logo ve Rapor Başlığı Entegrasyonu',
      'Genişletilmiş Frekans Kütüphanesi & Özel Eğitim Desteği'
    ]
  },
  {
    id: 'pkg-70k',
    name: 'Zümrüt Master',
    scanCredits: 1407,
    price: 1407,
    priceText: '$1.407',
    badge: 'ZÜMRÜT MASTER',
    targetAudience: 'Bölgesel sağlık merkezleri ve uzman klinik ağları.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '1.407 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Gelişmiş AI Biyo-Rezonans ve Frekans Öneri Modülü',
      'Limitsiz Danışan Geçmişi ve Otomatik Seans Takibi',
      'Öncelikli Yeni Modül & Frekans Güncelleme Desteği'
    ]
  },
  {
    id: 'pkg-80k',
    name: 'Yakut Elit',
    scanCredits: 1608,
    price: 1608,
    priceText: '$1.608',
    badge: 'YAKUT ELİT',
    targetAudience: 'Yüksek hacimli estetik, wellness ve bioenerji merkezleri.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '1.608 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Gelişmiş Organ Grafikleri & 3D Biyo-Aura Simülatörü',
      'Alt Terapist Kullanıcı Yetkilendirme Sistemi',
      'Özel Heyet Eğitimi ve Uygulayıcı Katılım Sertifikasyonu'
    ]
  },
  {
    id: 'pkg-90k',
    name: 'Titanyum Entegre',
    scanCredits: 1809,
    price: 1809,
    priceText: '$1.809',
    badge: 'TİTANYUM ENTEGRE',
    targetAudience: 'Entegre ve fonksiyonel tıp hekimleri ile hastane departmanları.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '1.809 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Tüm Kuantum Frekans Veritabanı ve Letaif Haritaları',
      'Özel Veri Entegrasyon Protokolleri',
      '7/24 Birebir VIP Teknik & Danışmanlık Hattı'
    ]
  },
  {
    id: 'pkg-100k',
    name: 'Elmas Bölge',
    scanCredits: 2010,
    price: 2010,
    priceText: '$2.010',
    badge: 'BÖLGE DİSTRİBÜTÖRÜ',
    targetAudience: 'İl ve bölge distribütörleri, franchise temsilcileri.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '2.010 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Alt Bayi Açma & Alt Bayilere Kredi Dağıtım Havuzu',
      'Bölge Temsilciliği ve Öncelikli Danışan Yönlendirme Hakkı',
      'Sistem Heyeti İle Birebir Kurulum & VIP Danışmanlık'
    ]
  },
  {
    id: 'pkg-200k',
    name: 'Master Franchise',
    scanCredits: 4021,
    price: 4021,
    priceText: '$4.021',
    badge: 'MASTER FRANCHISE',
    targetAudience: 'Çok şubeli sağlık grupları, franchise ağları ve master organizasyonlar.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '4.021 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Sınırsız Şube ve Alt Bayi Ağı Kurma İmkanı',
      'Özel Marka (Whitelabel Görünüm) & Rapor Özelleştirmesi',
      'Heyet Tarafından Yerinde / Canlı Kurulum ve Sürekli VIP Destek'
    ]
  },
  {
    id: 'pkg-300k',
    name: 'Enterprise Mega',
    scanCredits: 6031,
    price: 6031,
    priceText: '$6.031',
    badge: 'ENTERPRISE MEGA AĞ',
    targetAudience: 'Ulusal ve uluslararası sağlık ağları, yatırımcılar ve holdingler.',
    unitCostText: '$1.00 / Seans Maliyeti',
    features: [
      '6.031 Adet Tam Biyo-Rezonans Seans Kredisi',
      'Süre Sınırı Yok (Kredileriniz Asla Yanmaz)',
      'Merkezi Kredi ve Bayi Yönetim Platformu',
      'Tüm Gelecek Modül ve Veri Güncellemelerine Ömür Boyu Erişim',
      'Özel Ayrılmış Bulut Sunucu & VIP Mimari Destek'
    ]
  }
];
