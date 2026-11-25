# Monoline, Bayilik, Kariyer ve Komisyon Sistemi Raporu

**İnceleme kapsamı:** Depodaki kaynak kod, varsayılan iş kuralları, sunucu uç noktaları ve PostgreSQL şeması. Bu belge hukuki, mali veya yatırım tavsiyesi değildir. Kaynakta görülen özellikler canlı ortamda yapılandırılan değerlerle değişebilir.

## 1. Yönetici özeti

Sistem, bayi kayıtları ve siparişlerle başlayan; sponsor ağacı, küresel Monoline sırası ve kariyer şartları üzerinden komisyon/hak ediş hesaplayan bir işleyiş içeriyor. Komisyonlar üye cüzdanında bekleyen veya çekilebilir bakiye olarak tutuluyor; çekim talebi ve bayi kredisi hareketleri ayrıca kaydediliyor.

Kodda siparişe bağlı komisyon ve fon kalemleri tanımlı:

- **Direkt sponsor primi:** varsayılan %20.
- **Unilevel sponsor ağacı:** 7 seviyede toplam %25.
- **Monoline sıra teşviki:** 7 üst sırada toplam %5.
- **Sistem fonu:** sipariş tutarının %5'i.
- **Matching:** doğrudan sponsor olunan üyenin aynı siparişte kazandığı uygun Unilevel ve Monoline komisyonları üzerinden kariyere göre %10, %15, %20 veya %25.

Direkt sponsor, Unilevel, Monoline ve sistem fonu yüzdelerinin aritmetik toplamı %55'tir; Matching ve kariyer havuzu bu toplamın dışında ayrı kurallara tabidir. Tutarların her siparişte belirli bir kullanıcıya nakit olarak ödenmesi garanti değildir. Alıcının bulunmaması, pasif/kilitli olması, kariyer derinliği, sipariş/ödeme kontrolleri ve havuz yönlendirmeleri sonucu değiştirebilir. Bu oranlar kazanç vaadi, işletme kârı hesabı veya fiilî ödeme garantisi değildir.

Kodda raporlanması gereken önemli operasyonel notlar:

1. Yeni bayi kaydı başlangıçta ödeme bekleyen, pasif ve kilitli oluşturuluyor; yetki ve aktiflik ödeme/tamamlama adımlarına bağlı.
2. Üretim ortamında bazı sanal POS/checkout uçları 503 döndürüyor; sponsor cüzdanıyla bayi paketi ödeme akışı ise ayrı bir yol.
3. Çekim talebi cüzdandan düşülüp `PENDING` kaydediliyor; bu kayıt tek başına banka transferinin gerçekleştiğini göstermez.
4. Sunucu çekim talebinde stopajı 0, net tutarı brüt tutara eşit kaydeder. Fatura yüklemek kesinti, iade veya ödeme onayı oluşturmaz; vergi uygulaması mali uzmanla doğrulanmalıdır.
5. Varsayılan kariyer matrisinde tüm seviyeler için minimum paket Mini ve kişisel hacim $0’dır; aktiflik ve seviye bazlı ekip koşulları ayrıca uygulanır.

## 2. Sistemin temel kavramları

### Sponsor ağacı (Unilevel)

Kayıt sırasında üyeye bir sponsor bağlanır. Sipariş veren üyenin `sponsor_id` alanından yukarı doğru ebeveyn zinciri izlenerek 7 derinliğe kadar komisyon hesaplanır. Bu, kayıt/referral ilişkisidir.

### Küresel Monoline sırası

Üyeler ayrıca `global_line_id` / şema tarafında `monoline_position` ile sıralanır. Monoline ödemesi sponsor ağacındaki ebeveyn zincirini değil, sipariş verenin sıra numarasının üstündeki uygun pozisyonları tarar. Sponsor ağacı ve Monoline yerleşimi aynı ilişki değildir.

### Aktif bayi ve aktiflik dönemi

Komisyon/çekim uygunluğu; hesabın aktif olması, kilitli olmaması ve bazı işlemlerde aktiflik süresinin geçerli olmasına bağlıdır. Veritabanı şeması aktiflik son kullanma zamanını ve aktif/kilitli bayraklarını tutar. Kayıt sırasında ise yeni bayi varsayılan olarak aktif değildir ve kilitlidir.

### PGV ve kollar

Kariyer koşullarında PGV, grup hacmi olarak kullanılır. Sol ve sağ kol hacimleri ayrıca tutulabilir; bazı kariyer seviyelerinde tek bir kolun toplam hacme katkısı en fazla %50 ile sınırlanır. Aktif direkt sayısı ve farklı kollarda yetişen kariyerli alt bayi sayısı da terfi şartlarına katılır.

## 3. Bayilikten siparişe ve komisyona uçtan uca akış

### 3.1. Başvuru ve sponsor seçimi

1. Bayilik kayıt ekranı, sponsor referans kodunun seçilmesini/doğrulanmasını ister. URL üzerinden bayi kayıt modu ve sponsor bilgisi taşınabilir. (Kaynak: `src/components/AuthModal.tsx:107–123, 199–264, 287–310, 340–382`)
2. Bayilik başvurusunda firma adı zorunlu tutulur; firma, vergi, faaliyet alanı, iletişim ve adres gibi ayrıntılar da toplanabilir. Bayinin sol/sağ kol tercihi `AUTO`, `LEFT` veya `RIGHT` olabilir. (Kaynak: `src/components/AuthModal.tsx:137–167, 340–370`)
3. Sunucu sponsor bilgisini kullanıcı ID'si, referans kodu veya e-posta üzerinden çözebilir. Bazı koşullarda sponsor gönderilmezse yeni kayıt son üyeye bağlanır; bu davranış kayıt arayüzünün sponsor zorunluluğundan farklıdır. (Kaynak: `server.ts:8273–8317`)
4. Açık sol/sağ tercih sunucuya aktarılır; otomatik yerleşimde sponsorun daha az dolu kolu seçilebilir. Yönetici sponsor, sıra ve kol bilgilerini sonradan düzenleyebilir. (Kaynak: `server.ts:8337–8348`; `src/components/AdminDealerManagementTab.tsx:142–159, 182–200, 331–338`)

### 3.2. İlk kayıt durumu ve bayi paketi

1. Yeni bayi kaydı, bayi rolüyle ve ödeme bekleyen/pasif/kilitli statülerle oluşturulur; bir Monoline sıra numarası ve kayıt siparişi oluşturulur. (Kaynak: `server.ts:8354–8410, 8441–8459`)
2. Yeni bayi ödeme ekranında tek bir bayi paketi seçerek ilerlemelidir; ilgili sözleşme onayları ödeme başlatılmadan kaydedilir. (Kaynak: `src/components/PaymentModal.tsx:292–346`)
3. Yeni kayıt için iki ödeme yolu bulunur:
   - **Sponsor cüzdanı:** sponsor oturumu ve bakiye kontrolüyle `/api/v1/wallet/purchase-package` çağrılır; başarılı işlemden sonra bayi kredileri tanımlanıp kayıt tamamlanır. (Kaynak: `src/components/PaymentModal.tsx:350–400`; `server.ts:11512–11659`)
   - **Sanal POS:** istemci kart ödemesi başlatır; ödeme sağlayıcısı ve sunucu callback süreciyle devam eder. Ancak bazı ilgili sunucu uçları üretim ortamında 503 ile kapalıdır (ayrıntı için 8. bölüm).
4. Paket satın alma/ödeme başarılı olduğunda seans kredisi, sipariş kaydı ve bayi aktifliğiyle ilgili işlemler yürütülür. Paket içeriği ve satış tutarları yapılandırma/ürün kataloğuna göre değişebilir. (Kaynak: `server.ts:7455–7561, 11512–11739`)

### 3.3. Ödenmiş siparişten komisyon hesaplamaya

1. Sunucu sipariş kimliğini, ödeme ve sözleşme durumunu doğrular; tekrar işlenmeyi önlemek için sipariş kimliği ve komisyon kayıtlarında benzersizlik/idempotency kontrolleri kullanılır. (Kaynak: `server.ts:7412–7493, 7505–7561`; `monoline_schema.sql:135–158, 161–177, 206–217`)
2. Sipariş tutarı hesaplama tabanıdır. Sistem fonu, direkt sponsor primi, Unilevel ve Monoline dağıtımı ayrı türlerde kaydedilir. (Kaynak: `server.ts:2015–2041, 2045–2075, 2136–2157`)
3. Komisyon hak edişleri üyenin bölgesel cüzdanına yazılır. Cayma koruması etkinse ilk olarak bekleyen bakiye oluşur; serbest bırakma zamanı ve statü komisyon günlüğünde tutulur. (Kaynak: `server.ts:2007–2012, 2057–2074`; `monoline_schema.sql:78–96, 135–158`)
4. Uygun olmayan ya da bulunamayan hak sahibi için dağıtım havuza/devredilmemiş komisyon kaydına yönlendirilebilir; bu tutarın doğrudan başka bir üyeye ödeneceği varsayılmamalıdır. (Kaynak: `server.ts:2093–2134, 2192–2243`)

## 4. Varsayılan sipariş komisyon oranları

İlk kaynak noktası `src/config/businessRules.ts:8–33` olsa da sunucu çalışma zamanı kendi aktif iş kurallarıyla hesaplama yapar. Yönetici ayarları canlı oranları değiştirebilir. Aşağıdaki tablo kod deposundaki **varsayılan** değerleri gösterir:

| Komisyon türü | Sıra/derinlik | Varsayılan oran | Toplam |
|---|---:|---:|---:|
| Direkt sponsor primi | Doğrudan sponsor | %20 | %20 |
| Unilevel | 1. derinlik | %7 | |
| Unilevel | 2. derinlik | %5 | |
| Unilevel | 3. derinlik | %4 | |
| Unilevel | 4. derinlik | %3 | |
| Unilevel | 5. derinlik | %2 | |
| Unilevel | 6. derinlik | %2 | |
| Unilevel | 7. derinlik | %2 | **%25** |
| Monoline sıra teşviki | 1. üst sıra | %1,50 | |
| Monoline sıra teşviki | 2. üst sıra | %1,00 | |
| Monoline sıra teşviki | 3. üst sıra | %0,80 | |
| Monoline sıra teşviki | 4. üst sıra | %0,60 | |
| Monoline sıra teşviki | 5. üst sıra | %0,50 | |
| Monoline sıra teşviki | 6. üst sıra | %0,30 | |
| Monoline sıra teşviki | 7. üst sıra | %0,30 | **%5** |
| Sistem fonu | Siparişten ayrılan | %5 | %5 |

(Kaynak: `src/config/businessRules.ts:19–32`; Unilevel hesap döngüsü `server.ts:2136–2157`; Monoline `server.ts:2327–2347`; Matching `server.ts:2505–2535`, oran matrisi `src/types/monoline.ts:1054–1062`.)

### Örnek hesap — yalnızca matematiksel gösterim

Varsayılan oranlarla **$1.000** sipariş için brüt hesap:

- Direkt sponsor: $200
- Unilevel 7 derinliğin toplamı: $250
- Monoline 7 sıranın toplamı: $50
- Sistem fonu: $50
- Brüt teorik dağıtım toplamı: $550 (%55)

Bu örnekte derinlik/sıra alıcılarının tümünün bulunduğu, aktif ve gerekli hak ediş koşullarını karşıladığı varsayılmıştır. Kodda uygun olmayan tutarlar havuza gidebilir. Matching ve kariyer havuzu bu aritmetik örneğe dahil değildir; bekleyen bakiye, iade/clawback, bölgesel para birimi, yönetici ayarları, vergi, banka masrafı veya şirket maliyeti de hesaba katılmamıştır. Bu tutarlar kişisel kazanç veya garanti edilmiş ödeme değildir.

### Hak sahipliği ve havuza devir

- Direkt sponsor bulunamaz veya pasif/kilitliyse varsayılan mantıkta direkt sponsor tutarı devredilmemiş havuza yöneltilir. (Kaynak: `server.ts:2053–2059, 2093–2134`)
- Unilevel'de sponsor ağacında ilgili derinlikte kişi yoksa o katmanın payı havuza devredilir. (Kaynak: `server.ts:2184–2206, 2228–2243`)
- Unilevel hak sahipliği için üyenin aktif ve kilitsiz olması gerekir. `lockActive` açıksa aktif kariyer seviyesinin ilgili derinliğe yetmesi de beklenir. (Kaynak: `server.ts:2246–2257`)
- Varsayılan `DYNAMIC_COMPRESSION_ENABLED: false`: pasif sponsorları atlayıp payı ilk aktif üst sponsora verme davranışı kapalı. `SKIP_PASSIVE_MONOLINE_ENABLED: false`: Monoline pasiflerini dinamik atlama seçeneği de varsayılan olarak kapalı. (Kaynak: `src/config/businessRules.ts:31–32`)
- Monoline motoru, global sıra bakımından üstteki yedi pozisyonu tarar; sponsor ağacıyla aynı değildir. Pasif/uygun olmayan alıcılara ait tutarlar varsayılan kurallara göre havuza gidebilir. (Kaynak: `server.ts:2327–2347`; komisyon modeli `monoline_schema.sql:135–158`)
- Matching, doğrudan sponsor olunan üyenin aynı siparişte kazandığı uygun Unilevel ve Monoline komisyonlarını baz alır. Sponsorun aktif/kilitsiz olması ve Matching ayarının açık olması gerekir; oran kariyer düzeyine göre %10–%25'tir. Bu kalem %55 temel dağıtım toplamına dahil değildir. (Kaynak: `server.ts:2505–2535`; `src/types/monoline.ts:1054–1062`.)

## 5. Kariyerler, terfi şartları ve havuz hakları

Aşağıdaki veriler `INITIAL_CAREER_TIERS` içindeki varsayılan kariyer matrisidir (`src/types/monoline.ts:426–637`). Her kariyerde varsayılan asgari paket Mini, kişisel hacim $0 ve aktiflik şartı notu vardır; gerçek hesaplama ayrıca aktif üyelik, aktif direkt sayısı, PGV, kol dengesi ve alt ekip kariyer şartlarını kontrol eder.

| Seviye | Kariyer | Aktif direkt | PGV | Farklı kollarda alt kariyer şartı | Derinlik | Havuz oranı | Sabit kariyer bonusu |
|---:|---|---:|---:|---|---:|---:|---:|
| 1 | Emmâre | 0 | $0 | Yok | 1 | %2 | $1.000 |
| 2 | Levvâme | 10 | $2.000 | Yok | 2 | %3 | $2.500 |
| 3 | Mülhime | 20 | $5.000 | Yok | 3 | %4 | $5.000 |
| 4 | Mutmainne | 50 | $10.000 | 1 Levvâme | 4 | %5 | $10.000 |
| 5 | Râziye | 100 | $50.000 | Farklı kollarda 2 Mülhime | 5 | %6 | $20.000 |
| 6 | Marziyye | 500 | $350.000 | Farklı kollarda 2 Mutmainne + 1 Mülhime | 6 | %8 | $35.000 |
| 7 | Kâmile | 1.000 | $1.000.000 | Farklı kollarda 2 Râziye + 2 Mutmainne | 7 | %10 | $50.000 |

Ek notlar:

- 4–7. seviyelerde tek kol katkısı en fazla %50 olacak biçimde işaretlenmiştir. Varsayılan matris bu şartı `enforceMaxSingleLegPercent` ile etkin gösterir. (Kaynak: `src/types/monoline.ts:521–540, 552–571, 583–603, 615–635`)
- Derinlik 1–7, Unilevel kapısını açar; tablodaki oranlar ilgili derinlik yüzdeleridir. Monoline oranları ayrı bir dağıtım motorudur. Kariyer havuz payı da sipariş komisyonu yüzdelerinden ayrı kavramdır. (Kaynak: `src/types/monoline.ts:417–420, 426–637`)
- PGV, sunucu kodunda hareketli son 30 günlük siparişlerden hesaplanır. (Kaynak: `server.ts:1041–1094`)
- Aktif kariyer dinamik hesaplanabilir; maksimum ulaşılan kariyer ayrı tutulur. Bu nedenle “ulaşılan en yüksek unvan” ile o anda aktif olan derinlik aynı olmayabilir. (Kaynak: `server.ts:1189–1237`)
- Üst kariyerlerde farklı kolların ayrı ayrı nitelikli olması önemlidir; aynı koldaki birden fazla lider farklı kol şartını karşılamaz. (Kaynak: `src/types/monoline.ts:525–529, 556–560, 587–592, 619–624`)
- Kariyer havuz yüzdeleri ve sabit kariyer bonusları varsayılan matris alanlarıdır. Havuz dağıtımı ayrıca nitelik ve yönetici/dağıtım akışına bağlıdır; % oranı tek başına garanti edilmiş ödeme değildir. Havuz dağıtım örneği: `server.ts:9772–9863`.
- Yönetici API'si 7 kariyer katmanının direkt, grup hacmi, alt kariyer, kol tavanı, derinlik, havuz ve bonus alanlarını değiştirebilir ve kariyerleri yeniden hesaplatabilir. (Kaynak: `server.ts:7127–7235`.)

### Paket ve kariyer şartları

Varsayılan kariyer matrisinde tüm seviyelerin `minPackageId` değeri Mini, `minPersonalVolume` değeri $0’dır. Bu, kariyer şartlarının bulunmadığı anlamına gelmez: aktif üyelik, aktif direkt sayısı, son 30 günlük grup hacmi, kol dengesi ve gerekli alt kariyer koşulları ayrıca değerlendirilir. Yönetici tarafından değiştirilen canlı `careerTiers` farklı olabilir. (Kaynak: `src/types/monoline.ts:426–637`; hesaplama `src/types/monoline.ts:913–986`.)

### Kariyer matrisi bonusu ve tek seferlik ödül

Matristeki `fixedCareerBonusAmount` kariyer seviyesi için tanımlı sabit bonus alanıdır; `RANK_UP_GIFT` ise terfi anında ayrı ödül kaydı olarak izlenir. Bu iki kalem aynı ödeme değildir ve raporlama/muhasebede ayrı tutulmalıdır. (Kaynak: `src/types/monoline.ts:426–637, 1191–1220`; ödül API filtreleri `server.ts`.)

## 6. Cüzdan, bekleyen bakiye, cayma koruması ve çekim

### Cüzdan türleri ve kayıtlar

- Bölgesel kullanılabilir ve bekleyen USD bakiyeleri; kazanım, çekim, sponsor, Unilevel ve Monoline kazanç toplamları saklanır. Şema banka bilgilerini ve ek cüzdan verisini de içerir. (Kaynak: `src/types/monoline.ts:1141–1156`; `monoline_schema.sql:78–96`.)
- Sistem cüzdanında sistem, devredilmemiş komisyon ve kariyer havuz bakiyeleri ayrı alanlardır. (Kaynak: `monoline_schema.sql:118–130`.)
- Sipariş, komisyon, seans kredisi, kredi defteri ve çekim talepleri ayrı tablolarda izlenir. İstek kimliği/benzersiz kayıtlar tekrarlı finansal işlemi engellemeye yardım eder. (Kaynak: `monoline_schema.sql:135–217`.)

### Bekleyen tutardan çekilebilir bakiyeye

Varsayılan cayma koruma süresi 14 gündür (`src/config/businessRules.ts:27–30`). Komisyon başlangıçta bölgesel bekleyen bakiyede tutulabilir; vade serbest bırakma işiyle geldiğinde çekilebilir bakiyeye aktarılır. İade/clawback durumları için ayrı koruma ve geri alma akışları vardır. Serbest bırakmanın gerçek ortamdaki otomatik tetiklenme sıklığı yalnızca kaynak koddan doğrulanamaz. (Kaynak: `server.ts:2007–2012, 9931–10030`; `monoline_schema.sql:78–96, 135–158`.)

### Çekim koşulları ve limitler

- Hesabın aktif ve kilitsiz olması gerekir; aktiflik süresi dolduysa talep reddedilir. (Kaynak: `server.ts:6641–6667`.)
- Asgari çekim varsayılan olarak $50; kullanılabilir bölgesel bakiyenin talebi karşılaması gerekir. (Kaynak: `server.ts:6695–6702`; limit tanımları `src/types/monoline.ts:1180–1189`.)
- Günlük üst sınır kariyer seviyesine göre uygulanır; varsayılan basamaklar sırasıyla $5.000, $10.000, $20.000, $35.000, $50.000, $75.000 ve $100.000 olarak tanımlıdır. (Kaynak: `src/types/monoline.ts:1180–1189`; kontrol `server.ts:6704–6729`.)
- Çekim yalnızca IBAN'a yöneliktir; hesap sahibi adı üye adıyla eşleşmelidir. Bölgeye göre IBAN doğrulaması ve SWIFT seçilmişse BIC doğrulaması yapılır. (Kaynak: `server.ts:6732–6768`; `src/utils/withdrawalPayout.ts:17–64`.)
- Başarılı talepte tutar cüzdandan düşülür ve kayıt `PENDING` açılır; bu, bankanın ödeme yaptığı anlamına gelmez. (Kaynak: `server.ts:6670–6675, 6770–6775, 6828–6879`.)
- Kodda banka ekstresi eşleşmesi/ödeme kanıtı olmadan talebi fiilî ödeme olarak kesinleştiren bir akış doğrulanamadı; ilgili yönetici/settlement yolları kanıt yokluğunda 422 döndürür. (Kaynak: `server.ts:6979–6995, 8928–8934, 12593–12601`.)

### Stopaj ve vergi notu

Sunucu çekim talebinde `taxDeduction = 0` ve `netAmount = grossAmount` kaydeder; bayi ekranı da bu kayıt davranışını açıkça belirtir. Fatura alanı belge incelemesi içindir; yükleme kesinti, vergi iadesi veya banka ödemesi onayı anlamına gelmez. Kod kaydı gerçek vergi yükümlülüğünü belirlemez; canlı mali uygulama mali müşavir ve işlem kayıtlarıyla ayrıca doğrulanmalıdır. (Kaynak: `server.ts:6770–6775, 6792–6825, 6828–6867`; `src/components/DealerBackOfficeView.tsx:3172–3182, 3230–3257`.)

## 7. Paketler, bayi kredileri ve bayi operasyonları

- Ürün kataloğunda Mini/başlangıç paketinden daha yüksek paketlere kadar USD tutarları ve seans/kredi içerikleri bulunur. Paket tutarı ve içerik canlı katalog veya bölgesel fiyat ayarına göre doğrulanmalıdır. (Kaynak: `src/types/monoline.ts:51–200, 201–345`.)
- Bayi back-office paket/kredi satın alımı yapabilir; cüzdan bakiyesi ve sözleşme onayları sunucuda kontrol edilerek seans kredisi kredi defterine yazılır. (Kaynak: `src/components/DealerBackOfficeView.tsx:1338–1448`; `server.ts:11512–11739`.)
- Bayiler referral kodu ile yeni bayi davet edebilir, alt ekip ve sıra/kol bilgilerini yönetebilir; yönetici arama, detay, durum ve cüzdan işlemleri ayrı arayüzlerde bulunur. (Kaynak: `src/components/DealerBackOfficeView.tsx:1251–1268, 1953–1973`; `src/components/AdminDealerManagementTab.tsx:90–250`.)
- P2P/cüzdan transferi ve kredi hareketleri için istek kimliğiyle tekilleştirme, işlem defteri ve sunucu tarafı bakiye kontrolleri kullanılır. (Kaynak: `server.ts:11512–11757`; `monoline_schema.sql:182–217`.)

## 8. Ödeme, finansal işlem ve sistem sınırları

### Ödeme entegrasyonunda görülen sınırlama

- İstemcide POS başlatma/callback işlemleri bulunur. (Kaynak: `src/utils/paymentProcessor.ts:81–175`.)
- Sunucu tarafında ilgili POS başlatma/callback uçları üretim ortamında 503 döndürür; genel checkout uç noktası da 503 döndürmektedir. (Kaynak: `server.ts:8665–8672, 11837–11838, 11859–11863, 11940–11944`.)
- Bu nedenle bu kod halinden üretimde kartla bayi kaydının uçtan uca başarılı olacağını doğrulamak mümkün değildir. Sponsor cüzdanı ile paket ödemesi ayrı bir API akışıdır.

### Veritabanı ve finansal bütünlük

- Ana Monoline finansal modeli PostgreSQL şemasını kullanır; kullanıcı, cüzdan, sistem havuzu, komisyon günlüğü, sipariş, bayi kredisi, idempotency, çekim ve gider pusulası verileri ayrıştırılmıştır. (Kaynak: `monoline_schema.sql:12–57, 78–130, 135–217, 220–230`.)
- Sipariş/komisyon tablolarında sipariş bazlı benzersiz indeksler ve kredi/istek tablolarında `request_id` benzersizlikleri vardır. (Kaynak: `monoline_schema.sql:135–158, 163–177, 192–217`.)
- Ana sunucu veritabanı bağlantısı ve transaction kullanımı `server/db.ts` içindedir; işlem yollarında atomik transaction ve satır kilidi kullanılabilir. (Kaynak: `server/db.ts:66–105, 184–234`; örnek çekim `server.ts:6678–6680`.)
- Frekans uygulamasında bazı kullanıcı/bayi/sipariş verileri ayrıca localStorage/Firestore üzerinden tutulup Monoline köprüsüyle eşitlenebilir; bu paralel veri yolları canlı ortamda senkronizasyon durumunun ayrıca izlenmesini gerektirir. (Kaynak: `src/utils/authManager.ts:1200–1221, 1301–1305`; `src/utils/dealerOrderManager.ts:32–57, 146–153`; `src/utils/monolineSyncBridge.ts:191–213, 328–375, 421–486, 533–559`.)

## 9. Yönetici ve yapılandırma yüzeyi

Yönetici arayüzü bayi/üye yönetimi, komisyon iş kuralları, kariyer matrisi, başvuru onayı, paket, ödeme, banka/çekim ve raporlama işlevlerini içerir. (Kaynak: `src/components/AdminPanelModal.tsx:156–173`.)

Yönetici tarafından değiştirilebilir alanlara örnekler:

- Direkt sponsor, Unilevel ve Monoline yüzdeleri; sistem fonu; cayma koruma günü; tek kol tavanı ve pasif sponsor davranış seçenekleri. (Kaynak: `src/components/CommissionEngineSettingsView.tsx:34–72, 132–218`; `server.ts:7861–7933`.)
- 7 kariyer kademesinin aktif direkt, kişisel/grup hacim, alt kariyer sayısı, kol dengesi, açılan derinlik, havuz ve sabit bonus alanları. (Kaynak: `server.ts:7127–7235`.)
- Bayi sponsor/sıra/kol, durum ve cüzdan düzeltmeleri; cüzdan düzeltmesinde gerekçe ve istek kimliğiyle kayıt. (Kaynak: `src/components/AdminDealerManagementTab.tsx:142–250, 331–338`.)

Yönetici ayarlarının kalıcı saklanma biçimi uç nokta ve mevcut deployment yapılandırmasıyla ayrıca teyit edilmelidir; kaynakta bir değerin varsayılan olması, canlı ortamda da aynı olduğu anlamına gelmez.

## 10. Kayıt ve raporlama için izlenebilir temel tablolar

| Veri | Amaç | Kaynak |
|---|---|---|
| `users` | Kimlik, sponsor, referral, sıra, kariyer, PGV, aktiflik ve kol | `monoline_schema.sql:12–51` |
| `wallets` | Kullanılabilir/bekleyen bakiye ve kazanç türleri | `monoline_schema.sql:78–96` |
| `system_wallet` | Sistem, devredilmemiş ve kariyer havuzları | `monoline_schema.sql:118–130` |
| `commission_logs` | Sipariş, kaynak/hedef üye, tür, derinlik, tutar, statü ve release tarihi | `monoline_schema.sql:135–158` |
| `orders_log` | Sipariş, paket, tutar, ödeme yöntemi ve sağlayıcı referansı | `monoline_schema.sql:161–177` |
| `reseller_credits`, `credit_ledger` | Seans kredisi bakiyesi ve değişim geçmişi | `monoline_schema.sql:180–203` |
| `idempotency_keys` | Tekrarlı isteklerin önlenmesi | `monoline_schema.sql:205–217` |
| `withdrawal_requests` | Çekim talebi ve durum/ödeme bilgileri | Şema devamı ve `server.ts:6828–6867` |
| `expense_vouchers` | Gider pusulası ve vergi/ödeme kayıtları | `monoline_schema.sql:220–230` |

## 11. Koddan çıkarılamayan veya canlıda ayrıca doğrulanması gerekenler

- Canlı sistemde aktif olan oranlar, kariyer matrisleri, paket fiyatları ve bölgesel döviz kuru; yönetici tarafından değiştirilebilir.
- Üretim ödeme sağlayıcısının mevcut erişilebilirliği ve kapalı uçların dışındaki ödeme düzeni.
- Komisyon serbest bırakma işinin canlı cron tetikleme sıklığı ve başarısız işlerin yeniden denenme/izlenme prosedürü.
- Çekim talebinden banka hesabına fiilî para gönderme için kullanılan harici işlem ve banka mutabakatının tamamlanma SLA'sı.
- Gerçek vergi/stopaj yükümlülüğü, gider pusulası ve fatura uygulaması; sunucunun sıfır kesinti kaydetmesi yasal yükümlülüğü belirlemez.
- Kuralların ve kariyer düzenlemelerinin deployment yeniden başlatıldıktan sonra nereden yüklendiği ve canlıdaki son değerleri.
- Matching oranlarının canlı yapılandırması ve her hak sahibinin uygunluğu.

## 12. Önemli kaynak dosyaları

- `server.ts` — kayıt, ödeme/sipariş, komisyon, kariyer, cüzdan, çekim, serbest bırakma ve yönetici API akışları.
- `src/config/businessRules.ts` — varsayılan komisyon oranları ve koruma/atlama ayarları.
- `src/types/monoline.ts` — paketler, kariyer matrisi, cüzdan ve iş alanı tipleri.
- `src/services/commissionService.ts` — komisyon dağıtımıyla ilgili servis implementasyonu; aktif sunucu işlem noktaları ayrıca `server.ts` içinden doğrulanmalıdır.
- `src/components/AuthModal.tsx` — kayıt, sponsor seçimi ve bayilik formu.
- `src/components/PaymentModal.tsx` — bayi kayıt paketi ve ödeme seçimi.
- `src/components/DealerBackOfficeView.tsx` — bayi cüzdanı, paket/kredi ve çekim arayüzü.
- `src/components/AdminDealerManagementTab.tsx` — yönetici bayi/üye işlemleri.
- `src/components/CommissionEngineSettingsView.tsx` — komisyon motoru ayarları.
- `src/utils/monolineSyncBridge.ts` — Frekans ve Monoline veri eşitleme köprüsü.
- `monoline_schema.sql`, `server/db.ts` — PostgreSQL veri modeli ve DB işlemleri.

---

**Not:** Bu rapor kaynak kodun mevcut halinin açıklamasıdır. Finansal oranlar veya uygunluk şartlarının canlı sistemdeki değerleri yönetici ayarları, veritabanı, işlem günlükleri ve sözleşmelerle karşılaştırılmadan kesin kabul edilmemelidir.
