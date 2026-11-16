export type ParanormalArchiveCategory =
  | 'ottoman-historical'
  | 'classical-havas'
  | 'sufi-hagiography'
  | 'islamic-folklore'
  | 'global-historical-accounts';

export interface ParanormalArchiveItem {
  id: string;
  title: string;
  category: ParanormalArchiveCategory;
  centuryOrPeriod: string;
  narrative: string;
  symptomsOrPhenomena: string[];
  spiritualReflection: string;
  disclaimer: string;
  historicalSource: string;
  sourceUrl?: string;
  frequencyHz: number;
  palette: string;
}

export interface SpiritualFrequencyProtocol {
  id: string;
  title: string;
  frequencyHz: number;
  spiritualBasis: string;
  reflectionText: string;
  applicationSteps: [string, string, string];
  disclaimer: string;
}

const DISCLAIMER = 'Bu içerik tarihsel tanıklık, folklor veya tartışmalı iddia niteliğindedir; paranormal açıklaması doğrulanmış değildir. Tıbbi ya da psikiyatrik tanı/tedavi sunmaz.';
const REFLECTION_PROTOCOL = 'İsterseniz sakin bir ortamda kısa nefes farkındalığı veya kişisel dua/tefekkür uygulayın. İsteğe bağlı ambient tonun frekansı yalnızca ses tasarımı seçimidir; vaka ya da manevi metinle kanıtlanmış bir etkisi yoktur. Süregelen korku, uykusuzluk veya sıkıntıda sağlık uzmanından destek alın.';

export const PARANORMAL_ARCHIVE_ITEMS: ParanormalArchiveItem[] = [
  {
    id: 'fox-sisters',
    frequencyHz: 285,
    title: 'Fox kardeşler ve Hydesville anlatısı',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1848 · Hydesville, ABD',
    narrative: 'Margaret ve Kate Fox, evlerinde duydukları tıklama seslerini görünmeyen bir varlıkla iletişim olarak yorumladıklarını anlattı. Olay, dönemin spiritüalizm hareketinin yayılmasında etkili oldu. Margaret Fox daha sonra bazı seansların hileli olduğunu söyledi; anlatı doğrulanmış paranormal kanıt sayılmaz.',
    symptomsOrPhenomena: ['Evde tıklama sesleri duyulduğuna ilişkin tanıklık'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Ann Braude, Radical Spirits; dönemin basın kayıtları',
    palette: 'from-violet-950 via-slate-900 to-indigo-950',
  },
  {
    id: 'versailles',
    frequencyHz: 396,
    title: 'Versailles bahçelerindeki “zaman kayması”',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1901 · Versailles, Fransa',
    narrative: 'Anne Moberly ve Eleanor Jourdain, Petit Trianon çevresinde geçmişe aitmiş gibi görünen kişiler ve sahneler gördüklerini yazdı. Daha sonra yayımladıkları anı; çevreyi tanıma, beklenti ve algı yanılmaları üzerinden de açıklanmıştır. Olağanüstü yorum kanıtlanmış değildir.',
    symptomsOrPhenomena: ['Geçmiş döneme ait olduğunu düşündükleri kişileri gördükleri yönünde tanıklık'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Moberly ve Jourdain, An Adventure (1911)',
    palette: 'from-amber-950 via-slate-900 to-rose-950',
  },
  {
    id: 'fatima',
    frequencyHz: 528,
    title: 'Fâtıma güneş olayı anlatısı',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1917 · Fâtıma, Portekiz',
    narrative: 'Üç çocuk Meryem Ana’yı gördüklerini söyledi; 13 Ekim’de toplanan kalabalığın bir kısmı güneşin hareket ettiğini veya renk değiştirdiğini bildirdi. Tanıklıklar birbirinden farklıdır ve olayın açıklaması üzerinde uzlaşma yoktur. Kayıt, dini deneyim ve tarihsel tanıklık olarak aktarılır.',
    symptomsOrPhenomena: ['Güneşin görünümünde değişiklik algılandığına ilişkin toplu tanıklıklar'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Fâtıma tanıklıkları ve 1917 tarihli Portekiz gazeteleri',
    palette: 'from-sky-950 via-slate-900 to-yellow-950',
  },
  {
    id: 'loch-ness',
    frequencyHz: 174,
    title: 'Loch Ness canavarı ve “cerrah fotoğrafı”',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1934 · İskoçya',
    narrative: 'Loch Ness’te büyük bir yaratık görüldüğüne dair anlatılar eski olsa da 1934’te yayımlanan ünlü fotoğraf uzun süre kanıt gibi gösterildi. Fotoğrafın 1990’larda oyuncak bir denizaltı maketiyle hazırlandığı itiraf edildi. Göl gözlemleri sürmüş olsa da bu fotoğraf sahte kabul edilir.',
    symptomsOrPhenomena: ['Gölde büyük bir şekil görüldüğü yönünde tanıklıklar'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Mackal, The Monsters of Loch Ness; 1994 itirafı ve arşiv haberleri',
    palette: 'from-cyan-950 via-slate-900 to-blue-950',
  },
  {
    id: 'flatwoods',
    frequencyHz: 285,
    title: 'Flatwoods canavarı tanıklıkları',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1952 · Batı Virginia, ABD',
    narrative: 'Bir grup çocuk ve yetişkin, gökyüzündeki parlak bir cismin ardından ormanda iri, başlıklı bir şekil gördüklerini bildirdi. Sis, karanlık, baykuş ve dönemin korku anlatıları olası açıklamalar arasında anıldı. Görüşme kayıtları tanıklıkları belgeler; varlığın niteliğini doğrulamaz.',
    symptomsOrPhenomena: ['Parlak ışık ve ormanda şekil görüldüğü yönünde tanıklık'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Braxton County Historical Society arşivi; çağdaş yerel basın',
    palette: 'from-emerald-950 via-slate-900 to-lime-950',
  },
  {
    id: 'hill-abduction',
    frequencyHz: 396,
    title: 'Betty ve Barney Hill UFO anlatısı',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1961 · New Hampshire, ABD',
    narrative: 'Hill çifti, yolculuk sırasında ışıklı bir cisim gördüklerini ve sonrasında zaman kaybı yaşadıklarını anlattı. Hipnoz seanslarıyla şekillenen ayrıntılar, hafıza telkini ve uyku/algı süreçleri açısından eleştirilmiştir. Bu anlatı popüler kültürde etkili olsa da uzaylı kaçırılmasının kanıtı değildir.',
    symptomsOrPhenomena: ['Işıklı cisim görüldüğü ve zaman aralığının hatırlanmadığı yönünde anlatım'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'John G. Fuller, The Interrupted Journey (1966)',
    palette: 'from-indigo-950 via-slate-900 to-fuchsia-950',
  },
  {
    id: 'pascagoula',
    frequencyHz: 432,
    title: 'Pascagoula nehir kıyısı karşılaşma iddiası',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1973 · Mississippi, ABD',
    narrative: 'Charles Hickson ve Calvin Parker, nehir kıyısında balık tutarken kendilerini bir araca götüren varlıklar gördüklerini bildirdi. Polis görüşmesi ve dönemin haberleri olayın anlatısını kayda geçirdi; kayıtlar iddianın doğruluğunu bağımsız biçimde kanıtlamaz.',
    symptomsOrPhenomena: ['Varlıklarla karşılaşma ve götürülme iddiası'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Jackson County Sheriff kayıtları ve 1973 yerel basını',
    palette: 'from-teal-950 via-slate-900 to-blue-950',
  },
  {
    id: 'enfield',
    frequencyHz: 285,
    title: 'Enfield poltergeist vakası',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1977–1979 · Londra, Birleşik Krallık',
    narrative: 'Bir aile evinde vurma sesleri ve hareket eden eşyalar olduğunu bildirdi. Araştırmacılar, gazeteciler ve polis eve gitti; bazı olayların çocuklar tarafından taklit edildiği de gözlendi. Tanıklıklar çelişkilidir ve vaka hem paranormal iddiaların hem de kuşkucu incelemelerin örneği olarak anılır.',
    symptomsOrPhenomena: ['Vurma sesleri duyulduğu ve eşyaların hareket ettiği iddiası'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Society for Psychical Research kayıtları; çağdaş haber arşivi',
    palette: 'from-rose-950 via-slate-900 to-purple-950',
  },
  {
    id: 'rendlesham',
    frequencyHz: 432,
    title: 'Rendlesham Ormanı ışıkları',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1980 · Suffolk, Birleşik Krallık',
    narrative: 'ABD Hava Kuvvetleri personeli, üs yakınında ormanda ışıklar gördüğünü bildirdi. Olay raporları ve ses kaydı yayımlandı. Yıldız, deniz feneri ve çevresel ışıklar gibi açıklamalar öne sürülmüştür; her ayrıntı üzerinde uzlaşı bulunmaz.',
    symptomsOrPhenomena: ['Orman yakınında ışıklar görüldüğü yönünde personel raporları'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Halt memorandum ve ABD Ulusal Arşivleri',
    palette: 'from-lime-950 via-slate-900 to-emerald-950',
  },
  {
    id: 'broad-haven',
    frequencyHz: 528,
    title: 'Broad Haven okul bahçesi gözlemi',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1977 · Galler, Birleşik Krallık',
    narrative: 'Öğrenciler okul yakınında gümüş renkli, disk biçimli bir cisim gördüklerini anlattı. Yetişkin tanıkların ifadeleri de yerel basında yayımlandı. Çizimler ve haberler gözlemlerin kaydıdır; tanımlanamayan bir cismin dünya dışı olduğu sonucunu tek başına desteklemez.',
    symptomsOrPhenomena: ['Disk biçimli cisim görüldüğü yönünde öğrenci tanıklıkları'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'BBC Wales arşivi ve 1977 yerel gazete kayıtları',
    palette: 'from-slate-800 via-slate-900 to-cyan-950',
  },
  {
    id: 'allagash',
    frequencyHz: 174,
    title: 'Allagash su yolu UFO anlatısı',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1976 · Maine, ABD',
    narrative: 'Dört arkadaş, kano gezisi sırasında parlak bir ışık ve sonrasında açıklayamadıkları bir zaman aralığı yaşadıklarını söyledi. Yıllar sonra hipnozla hatırladıkları ayrıntılar tartışmalıdır; hipnoz güvenilir anı doğrulama yöntemi değildir.',
    symptomsOrPhenomena: ['Parlak ışık görüldüğü ve zaman aralığının açıklanamadığı yönünde anlatım'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Raymond E. Fowler, The Allagash Abductions (1993)',
    palette: 'from-blue-950 via-slate-900 to-teal-950',
  },
  {
    id: 'aurora-legend',
    frequencyHz: 396,
    title: 'Aurora uzay gemisi kasabası efsanesi',
    category: 'global-historical-accounts',
    centuryOrPeriod: '1897 · Teksas, ABD',
    narrative: 'Bir gazete haberi, Aurora yakınında düşen hava gemisinde dünya dışı bir pilot bulunduğunu ileri sürdü. Hikâye yıllar içinde yerel efsaneye dönüştü; haberin güvenilirliği ve mezar iddiası tartışmalıdır. Bağımsız doğrulama olmadığı için folklor olarak değerlendirilir.',
    symptomsOrPhenomena: ['Düşen hava gemisi ve pilot bulunduğu yönünde gazete iddiası'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Dallas Morning News, 19 Nisan 1897; Texas folklor araştırmaları',
    palette: 'from-orange-950 via-slate-900 to-amber-950',
  },
  {
    id: 'ibrahim-adham-call',
    frequencyHz: 639,
    title: 'İbrâhim b. Edhem’in av sırasında duyduğu ses rivayeti',
    category: 'sufi-hagiography',
    centuryOrPeriod: '8. yüzyıl şahsiyeti; menkıbe kaynakları daha geç dönem',
    narrative: 'TDV İslâm Ansiklopedisi, İbrâhim b. Edhem’in hizmetçisi İbrâhim b. Beşşâr’dan aktarılan bir rivayeti kaydeder: av sırasında iki kez “Bunun için mi yaratıldın?” anlamında bir ses duyduğu, üçüncüde atının eyerinden geldiğini düşündüğü ses üzerine zühd yolunu seçtiği anlatılır. Bu, menkıbevî dönüşüm rivayetidir; paranormal ses olayı olarak doğrulanmış değildir.',
    symptomsOrPhenomena: ['Av sırasında işitildiği rivayet edilen uyarıcı söz'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'TDV İslâm Ansiklopedisi, “İbrâhim b. Edhem” maddesi; rivayet kaynağı olarak İbrâhim b. Beşşâr aktarımı',
    sourceUrl: 'https://islamansiklopedisi.org.tr/ibrahim-b-edhem',
    palette: 'from-amber-950 via-slate-900 to-yellow-950',
  },
  {
    id: 'fudayl-repentance',
    frequencyHz: 528,
    title: 'Fudayl b. İyâz’ın Kur’an ayetini işitmesi',
    category: 'sufi-hagiography',
    centuryOrPeriod: '8. yüzyıl şahsiyeti; menkıbe kaynakları daha geç dönem',
    narrative: 'TDV İslâm Ansiklopedisi’ndeki biyografik rivayete göre Fudayl, bir duvarın yanında Kur’an okunurken Hadîd sûresi 57:16’nın anlamını işitir ve bunu tövbeye çağrı olarak yorumlar. Anlatı, işitilen sözün manevi dönüşümle ilişkilendirildiği bir sûfî menkıbesidir; bağımsız olağanüstü olay kanıtı değildir.',
    symptomsOrPhenomena: ['Kur’an tilavetinin işitilmesi ve kişisel dönüşüm rivayeti'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'TDV İslâm Ansiklopedisi, “Fudayl b. İyâz” maddesi',
    sourceUrl: 'https://islamansiklopedisi.org.tr/fudayl-b-iyaz',
    palette: 'from-emerald-950 via-slate-900 to-teal-950',
  },
  {
    id: 'yunus-emre-vilayetname',
    frequencyHz: 639,
    title: 'Yunus Emre’nin Tapduk Emre’ye yöneliş menkıbesi',
    category: 'sufi-hagiography',
    centuryOrPeriod: 'Menkıbe, 15. yüzyıl sonlarına tarihlenen Vilâyetnâme geleneğinde aktarılır',
    narrative: 'Vilâyetnâme anlatısında Yunus Emre, Hacı Bektaş’tan buğdayla ayrıldıktan sonra manevi nasip istemek üzere geri döner ve Tapduk Emre’ye yönlendirilir. Kırk yıl hizmet etmesi ve sonunda şiir söylemeye başlaması, eserde manevi olgunlaşma menkıbesi olarak anlatılır. Bu anlatı tarihsel olarak doğrulanmış biyografi değil, menkıbe geleneğidir.',
    symptomsOrPhenomena: ['Manevi yöneliş, hizmet ve şiirsel ilham anlatısı'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'TDV İslâm Ansiklopedisi, “Yûnus Emre” maddesi; Vilâyetnâme-i Hacı Bektâş-ı Velî anlatısı',
    sourceUrl: 'https://islamansiklopedisi.org.tr/yunus-emre',
    palette: 'from-cyan-950 via-slate-900 to-emerald-950',
  },
  {
    id: 'evliya-celebi-dream',
    frequencyHz: 432,
    title: 'Evliya Çelebi’nin seyahate çıkış rüyası',
    category: 'ottoman-historical',
    centuryOrPeriod: '1630 · Osmanlı dönemi',
    narrative: 'Evliya Çelebi, Seyahatnâme’de Ahi Çelebi Camii’nde Hz. Peygamber’i gördüğü rüyayı ve “Şefaat yâ Resûlellah” yerine “Seyahat yâ Resûlellah” deyişini aktarır. Anlatı, yazarın kendi eserindeki rüya ve seyahat başlangıcı rivayetidir; bağımsız tarihsel doğrulama veya doğaüstü kanıt olarak sunulmaz.',
    symptomsOrPhenomena: ['Yazarın kendi eserinde aktardığı rüya anlatısı'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Evliya Çelebi, Seyahatnâme; TDV İslâm Ansiklopedisi, “Evliya Çelebi” maddesi',
    sourceUrl: 'https://islamansiklopedisi.org.tr/evliya-celebi',
    palette: 'from-indigo-950 via-slate-900 to-sky-950',
  },
  {
    id: 'sari-saltuk-dragon',
    frequencyHz: 396,
    title: 'Sarı Saltuk ve yedi başlı ejderha menkıbesi',
    category: 'islamic-folklore',
    centuryOrPeriod: '13. yüzyıl şahsiyeti; anlatı 15. yüzyılda derlenen Saltuknâme’de',
    narrative: 'Saltuknâme geleneğinde Sarı Saltuk’un yedi başlı ejderhayı yenerek bir kale kumandanının Müslüman olmasına vesile olduğu anlatılır. TDV maddesi bu anlatıyı Sarı Saltuk menkıbeleri içinde aktarır; tarihsel olay kanıtı olarak değil, kahramanlık ve dinî menkıbe olarak kaydedilmelidir.',
    symptomsOrPhenomena: ['Ejderha ve olağanüstü kahramanlık anlatısı'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Ebülhayr-ı Rûmî, Saltuknâme; TDV İslâm Ansiklopedisi, “Sarı Saltuk” maddesi',
    sourceUrl: 'https://islamansiklopedisi.org.tr/sari-saltuk',
    palette: 'from-rose-950 via-slate-900 to-orange-950',
  },
  {
    id: 'shams-rumi-meeting',
    frequencyHz: 741,
    title: 'Şems-i Tebrîzî ile Mevlânâ’nın karşılaşma rivayeti',
    category: 'sufi-hagiography',
    centuryOrPeriod: '13. yüzyıl; olayın menkıbevî anlatımları 14. yüzyıl kaynaklarında',
    narrative: 'Ahmed Eflâkî’nin Menâḳıbü’l-ʿÂrifîn adlı eserinde Şems’in Konya’da Mevlânâ’nın önünü kesip Bâyezîd-i Bistâmî ile Hz. Muhammed’in sözleri üzerine soru sorduğu karşılaşma anlatılır. Bu, Mevlevî menâkıbnâmesinde korunan bir rivayettir; anlatının diyalogları bağımsız tutanak değildir.',
    symptomsOrPhenomena: ['Sûfîler arasında geçen karşılaşma ve soru-cevap rivayeti'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Ahmed Eflâkî, Menâḳıbü’l-ʿÂrifîn; TDV İslâm Ansiklopedisi, “Şems-i Tebrîzî” maddesi',
    sourceUrl: 'https://islamansiklopedisi.org.tr/sems-i-tebrizi',
    palette: 'from-violet-950 via-slate-900 to-fuchsia-950',
  },
  {
    id: 'rabia-hagiography',
    frequencyHz: 639,
    title: 'Râbia el-Adeviyye’nin zühd ve Allah sevgisi menkıbeleri',
    category: 'sufi-hagiography',
    centuryOrPeriod: '8. yüzyıl şahsiyeti; menkıbeler sonraki tasavvuf kaynaklarında',
    narrative: 'Ferîdüddin Attâr’ın Teẕkiretü’l-evliyâʾ adlı eserinde Râbia el-Adeviyye’ye ayrılmış bölüm, onun zühd hayatını, sözlerini ve Allah sevgisini örnekleyen menkıbeler içerir. TDV maddesi, Attâr’ın eserini Râbia hakkındaki önemli kaynaklardan biri olarak tanımlar. Bu kayıt belirli bir doğaüstü olayı değil, hagiografik anlatı geleneğini özetler.',
    symptomsOrPhenomena: ['Zühd ve ilahî sevgi temalı menkıbeler'],
    spiritualReflection: REFLECTION_PROTOCOL,
    disclaimer: DISCLAIMER,
    historicalSource: 'Ferîdüddin Attâr, Teẕkiretü’l-evliyâʾ; TDV İslâm Ansiklopedisi, “Râbia el-Adeviyye” ve “Teẕkiretü’l-evliyâʾ” maddeleri',
    sourceUrl: 'https://islamansiklopedisi.org.tr/rabia-el-adeviyye',
    palette: 'from-pink-950 via-slate-900 to-amber-950',
  },
];

const PROTOCOL_DISCLAIMER = 'Bu içerik manevi tefekkür ve kişisel rahatlama içindir. Frekans değeri yalnızca ses üretim ayarıdır; ayet veya Esma ile bilimsel/tedavi edici bir bağlantısı, aura ya da çakra üzerinde kanıtlanmış etkisi yoktur. Rahatsızlık hissederseniz sesi durdurun. Sağlık hizmetinin yerine geçmez.';

export const SPIRITUAL_FREQUENCY_PROTOCOLS: SpiritualFrequencyProtocol[] = [
  {
    id: 'calm-focus',
    title: 'Sakin odak ve Es-Selâm tefekkürü',
    frequencyHz: 432,
    spiritualBasis: 'Es-Selâm isminin anlamı üzerine kişisel tefekkür; okuma isteğe bağlıdır.',
    reflectionText: 'Şu an yalnızca bulunduğunuz yeri fark edin. Nefesi değiştirmeye çalışmadan, dikkatinizi nazikçe nefes alışverişinize ve seçtiğiniz tefekkür cümlesine geri getirin.',
    applicationSteps: [
      'Rahat bir pozisyon alın; sesi düşük seviyede başlatın veya sessizce devam edin.',
      'Nefesi tutmadan, zorlamadan birkaç doğal nefes alışverişini izleyin.',
      'Es-Selâm isminin anlamını düşünün; bitirirken çevrenizde gördüğünüz üç şeyi fark edin.',
    ],
    disclaimer: PROTOCOL_DISCLAIMER,
  },
  {
    id: 'dua-reflection',
    title: 'Dua ve ayet üzerine tefekkür',
    frequencyHz: 528,
    spiritualBasis: 'Kullanıcının tercihine göre Âyetü’l-Kürsî (Bakara 2:255), İhlâs, Felak veya Nâs sûrelerini kendi kaynağından okuma ya da dinleme.',
    reflectionText: 'Bir ayet veya dua seçip anlamına odaklanın. Ses tonu yalnızca arka plan sesidir; kutsal metnin parçası değildir ve metnin etkisini ölçmez.',
    applicationSteps: [
      'İsterseniz okumak veya dinlemek için kendinizin güvendiği bir metin kaynağı seçin.',
      'Metni acele etmeden takip edin; dikkatiniz dağılırsa nazikçe tekrar anlamına dönün.',
      'Seansı istediğiniz an sonlandırın ve kendinize nasıl hissettiğinizi yargısızca sorun.',
    ],
    disclaimer: PROTOCOL_DISCLAIMER,
  },
  {
    id: 'renewal-intention',
    title: 'Yenilenme niyeti ve tefekkür',
    frequencyHz: 741,
    spiritualBasis: 'Kişisel dua, şükür veya Esmaü’l-Hüsna’dan seçilen bir ismin anlamı üzerine tefekkür.',
    reflectionText: '“Yıldız yükseltme” ve “enerji arındırma” ifadeleri burada yalnızca kişisel gelişim metaforlarıdır. Bir ölçüm, fiziksel değişim veya doğaüstü etki iddiası taşımaz.',
    applicationSteps: [
      'Dikkatinizi rahat bir oturuşa ve odadaki seslere verin.',
      'Nefes verirken omuzlarınızı serbest bırakın; rahat değilse egzersizi bırakın.',
      'Kişisel niyetinizi sessizce belirleyip seansı kısa bir çevre farkındalığıyla tamamlayın.',
    ],
    disclaimer: PROTOCOL_DISCLAIMER,
  },
];
