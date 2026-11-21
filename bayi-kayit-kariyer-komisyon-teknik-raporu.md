# İlk Bayi Kaydından Kariyer ve Komisyonlara Teknik İnceleme Raporu

## 1. Yönetici özeti

Bu rapor, uygulamadaki bayi başvurusu ve kayıt, ödeme doğrulama, paket/kredi yükleme, sipariş senkronizasyonu, kariyer hesaplama, komisyon dağıtımı, 14 günlük bekletme, çekim ve Akıllı Muhasebe olay kuyruğunu kaynak kod üzerinden izler. İnceleme statiktir; canlı veritabanı, ödeme sağlayıcısı hesabı veya gerçek banka/GİB bağlantısı incelenmemiştir.

Kodda nominal komisyon kuralları ve kariyer eşikleri tanımlı olsa da, bunlar tek başına gerçek tahsilat, sözleşmesel garanti veya doğrulanmış vergi kuralı anlamına gelmez. En önemli teknik bulgular:

1. POS adaptörü şu an `SANDBOX_TEST_POS` sağlayıcısını kullanıyor; üretim sağlayıcısı bağlantısı kodda tamamlanmış görünmüyor (`server/paymentProviders.ts:78-105,176-183`, `server.ts:11190-11195`).
2. Sunucudaki kamuya açık üye kayıt yolunda `pending_payment` varsayılanı ve `skip_initial_order` davranışı, ödeme onayı olmadan kredi/komisyon oluşturma riski taşıyor (`server.ts:7668-7682,7800-7817`).
3. 14 gün sonunda komisyon bakiyesi serbest bırakılabilir; ancak gider pusulası üretim fonksiyonu şu an resmi belge üretmeden `generatedCount: 0` döndürüyor (`server.ts:12033-12046,12095-12105`).
4. Kariyer tanımlarındaki “aktif kariyer dönemseldir” açıklaması ile kodun kariyer düşürmeme davranışı birbiriyle tam örtüşmüyor (`server.ts:1185-1208`).
5. Firma/bireysel stopaj oranları kodda varsayılmıştır; bu oranların hukuken geçerli olduğu bu incelemeyle doğrulanmış değildir (`server.ts:6276-6284`).
6. Akıllı Muhasebe’de yeni sipariş olayları vergi/fatura inceleme durumunda tutulur; otomatik resmi fatura veya dengeli yevmiye kaydı oluşturulmuş sayılmaz (`server.ts:2736-2771`, `src/SmartAccountingApp.tsx:715-795`).
7. Ticari planda bulunmayan Infinity kariyer fark primi yeni siparişler için kapatılmıştır; geçmiş komisyon kayıtları ve bakiyeler korunur (`server.ts`, `src/types/monoline.ts:1054-1062`).
8. Render canlı başlatmada `/opt/render/project/src/server/bonusWallets` modülü bulunamadı hatası görüldü. Yerel depoda bu import ve modül yok; Render kaynağı ve başlatma komutu doğrulanmadan konu kapatılmış sayılmamalıdır.

## 2. Uçtan uca işlem haritası

```text
Bayi başvurusu / üyelik
  ├─ Ödeme bekleyen başvuru: PENDING, pasif/kilitli, kredi yok
  ├─ Yönetici onaylı/yerel reseller kaydı: ayrı yol; ödeme kanıtı her zaman aranmayabilir
  └─ Paket/üyelik siparişi
       ├─ 3D Secure kart tahsilatı (uygun bayi kaydında sponsor cüzdanı seçeneği)
       ├─ Sunucu sepet toplamını, ülke fiyatını, sözleşmeleri ve ödeme kanıtını doğrular
       └─ processOrderCommission
            ├─ paket kredisi + paket bonusu
            ├─ kişisel/grup hacimleri güncellenir
            ├─ kariyerler yeniden hesaplanır
            ├─ doğrudan sponsor + Unilevel + Monoline + ek bonuslar hesaplanır
            ├─ komisyon 14 gün bekleyen bakiyeye yazılır
            └─ accounting_events: NEEDS_REVIEW / DRAFT_REQUIRED
                  ├─ 14 gün sonra çekilebilir bakiye
                  ├─ mali müşavir onayı bekleyen belge süreci
                  └─ çekim / ödeme onayı / dış banka mutabakatı
```

### 2.1 Bayi başvurusu ve ilk kayıt

- `AuthModal` bayi başvurusunu `registerMember` akışına yönlendirir (`src/components/AuthModal.tsx:274-321`).
- `authManager.registerMember`, ödeme bekleyen başvuruda kullanıcıyı `PENDING`, bayi statüsünü `pending`, erişimi kapalı ve krediyi sıfır olarak oluşturur (`src/utils/authManager.ts:1018-1083`). Bu yolun daha güvenli davranışı ödeme onayını beklemektir.
- Sunucudaki kayıt handler’ı `/api/v1/members`, `/api/v1/register` ve `/api/v1/members/register` yollarını yönetir (`server.ts:7931-7934`). `pending_payment` gelmezse varsayılan değer ödeme beklemeyen kayıt yönündedir (`server.ts:7668-7682`).
- `skip_initial_order` dalı, ödeme kanıtı olmadan üye aktif hale getirilip paket kredisi ve bonusu verilmesine imkân verebilir; bu alan için yönetici yetkisi denetimi ayrıca doğrulanmalıdır (`server.ts:7800-7817`).
- Doğrudan yönetici bayi oluşturma isteği seçilen `country_code` değerini Monoline üyelik API’sine taşır; bölgesel fiyatın Firestore ve Monoline kayıtlarında aynı ülkeye dayanması gerekir (`src/utils/authManager.ts`, `server.ts` üyelik handler’ı).
- Kayıt yolu içinde bellek state’i, kredi/komisyon yan etkileri ve PostgreSQL yazımı ayrı adımlarda gerçekleşiyor; PostgreSQL hatası oluştuğunda bellek değişikliklerinin tamamı için açık rollback görünmüyor (`server.ts:7781-7817,7820-7894`).
- Kayıt isteği `request_id` taşıyabiliyor; kayıt transaction’ı içinde `MEMBER_REGISTRATION` idempotency satırı yazılıyor ve aynı `request_id` için önceden kayıt varsa `409 REQUEST_ALREADY_RECORDED` dönülüyor. Ön kontrol ile INSERT arasındaki yarışta PRIMARY KEY çakışması transaction’ı düşürür; bu durumda replay yanıtı üretilmez ve bu yol test edilmedi (`server.ts` kayıt handler’ı, `src/utils/authManager.ts`).
- Başka bir bayi onay akışı, başvuruyu `approved` yapıp reseller profili açabiliyor; bu yolun POS ödeme kanıtıyla aynı şey olmadığı unutulmamalıdır (`src/utils/authManager.ts:1311-1408`).

### 2.2 Ödeme doğrulaması ve paket siparişi

- Kart ödeme bileşenleri sunucudan hedef ülkeye göre fiyat alır; ilk bayi kaydında tek paket/tek adet kısıtı uygulanır. Diğer sepetlerde her kalem ve miktar sunucu toplamıyla doğrulanır (`src/components/PaymentModal.tsx`, `server.ts` POS başlatma ve settlement uçları).
- Settlement sipariş kimliği, 3D Secure ödeme kanıtı, sözleşme onayları, `merchant_oid`, işlem ID’si, kullanıcı ve tutar eşleşmesini doğrular. Sepet kalemlerini tekrar fiyatlandırır; komisyonu toplam tahsilat üzerinden bir kez, krediyi katalogdaki sabit kredi adetlerinin toplamından hesaplar (`server.ts` `/api/v1/integrations/order-commission`, `processOrderCommission`).
- POS arayüzünde test kartları ve sandbox akışı vardır. Test kartları gerçek tahsilat kanıtı değildir (`src/components/PaymentModal.tsx`; `server/paymentProviders.ts`). Gerçek banka sağlayıcısının ayrıca bağlandığı bu incelemede doğrulanmadı.
- Eski bayi havale siparişi yönetim ekranı kaldırılmıştır. `GET /api/v1/admin/dealer-package-orders` ve `POST /api/v1/admin/dealer-package-orders/:orderId/reject` uçları ile listeleme/red istemcisi yoktur. Kartla veya sponsor cüzdanıyla sonuçlanmış bayi sipariş geçmişi yerel kayıtta tutulur; bekleyen/eski banka transferi kayıtları bu görünümden filtrelenir (`src/utils/dealerOrderManager.ts`). Kazanılmış komisyonların bayiye banka yoluyla ödenmesi ayrı bir çekim/payout sürecidir ve bu temizlik kapsamında kaldırılmamıştır.
- Üye sipariş senkronizasyonu `paymentStatus === 'PAID'` kayıtlarını, bayi paket geçmişi ise yalnızca onaylanmış kart/cüzdan işlemlerini yerel kayıttan alır; bekleyen/eski banka transferi kayıtları dışarıda kalır (`src/utils/monolineSyncBridge.ts`, `src/utils/dealerOrderManager.ts`). Kullanıcı profilinden sentetik kayıt üretme yolunda da `paymentStatus === 'PAID'` şartı vardır.
- Tam Frekans senkronizasyon endpoint’i admin JWT gerektirir. Köprü admin token olmadan da isteği gönderebilir, fakat normal kullanıcı bağlamında bu senkronizasyonun yetkisiz kalması olasıdır. Ödeme webhook’unun doğrudan sunucuya yazdığı sipariş ile Frekans’a geri yansıtma adımı ayrı değerlendirilmelidir.

### 2.3 Paket kredisi ve yönetici bonusu

14 resmi pakette kredi miktarı paket USD fiyatına 1:1 eşittir; paket alımına +32 veya başka sabit kredi bonusu eklenmez (`src/types/monoline.ts`, `src/config/dealerPackages.ts`, `src/utils/authManager.ts`, `server.ts`). Yönetici tarafından verilen manuel/başarı bonusu ayrı bir kredi düzeltmesidir; PostgreSQL kullanıcı kilidi, `reseller_credits`, `credit_ledger` ve idempotency kaydı üzerinden işlenmelidir (`server/db.ts:376-469`, `server.ts` yönetici bonus uç noktası). Bu yönetici bonusu paket satın alımına bağlı değildir.

## 3. Kariyer sistemi

### 3.1 Kariyer şartları

Aşağıdaki sayılar kaynak koddaki varsayılan kariyer tanımlarıdır; sözleşmesel veya mevzuatsal onay anlamına gelmez (`src/types/monoline.ts:426-635`). Her seviye için üyenin aktif olması ve aktivite süresinin geçmemiş olması gerekir; seviye 2 ve üzerinde aktif direkt referans ile grup hacmi şartı eklenir (`src/types/monoline.ts:913-986`).

| Seviye | Kod unvanı | Aktif direkt referans | Asgari grup hacmi (PGV) | Ek ekip şartı | Derinlik | Havuz oranı |
|---|---|---:|---:|---|---:|---:|
| 1 | Emmâre | 0 | $0 | Yok | 1 | %2 |
| 2 | Levvâme | 10 | $2.000 | Yok | 2 | %3 |
| 3 | Mülhime | 20 | $5.000 | Yok | 3 | %4 |
| 4 | Mutmainne | 50 | $10.000 | En az 1 ayrı kolda seviye 2 | 4 | %5 |
| 5 | Râziye | 100 | $50.000 | 2 ayrı kolda seviye 3 | 5 | %6 |
| 6 | Marziyye | 500 | $350.000 | 2 ayrı kolda seviye 4 + 1 ayrı kolda seviye 3 | 6 | %8 |
| 7 | Kâmile | 1.000 | $1.000.000 | 2 ayrı kolda seviye 5 + 2 ayrı kolda seviye 4 | 7 | %10 |

- Seviye 4 ve üzerindeki kariyerler için kodda tek kol katkısının en fazla %50 sayılması şartı vardır (`src/types/monoline.ts:521-635,926-945`).
- Hacim hesabı rolling 30 gün siparişlerinden yapılır; iade edilmiş siparişler bu hesaba dahil edilmemelidir (`server.ts:1022-1076`). Kariyer hesaplaması 7 geçişli olarak alt üyeden üst sponsor zincirine doğru yeniden çalışır (`server.ts:1147-1180`).
- Terfi kontrolünde aktiflik, direkt referans, PGV, kol dengesi ve alt kariyer koşulları aranır (`src/types/monoline.ts:913-989`). `minPackageRank` alanı tanımlı olmakla birlikte, kontrol akışında paket rütbesi yerine aktiflik kullanılıyor (`src/types/monoline.ts:971-980`).
- Kodda `max_career_level` geriye düşürülmez; `newMaxLevel = Math.max(prevMaxLevel, evalResult.level)` şeklindedir. `periodicActiveLevel` ise üye aktifken `newMaxLevel`, pasifken 1 olur (`server.ts:1185-1208`). Yorumlarda dönemsel 30 günlük performans anlatılsa da, üyelik aktif kaldığı sürece ulaşılan en yüksek seviye korunabilir.
- Liderlik havuz puanı aktif/kilitsiz üyeye `seviye² × 10 + floor(PGV/5000) + aktif direkt × 5` olarak hesaplanır; minimum puan 10’dur (`server.ts:1211-1219`).
- Kodda günlük çekim limiti seviyeye göre $5.000’den $100.000’e kadar tanımlıdır (`src/types/monoline.ts:1181-1190`). Bu limitin hangi para biriminde ve iş süreçlerinde geçerli olduğuna dair ayrıca iş/muhasebe onayı gerekir.

### 3.2 İsim ve ödül tutarlılığı

Kariyer tablosunda 6. seviye “Marziyye”, 7. seviye “Kâmile” iken bir defalık ödül açıklamalarında 6. seviye “Mardiyye”, 7. seviye “Sâfiye” olarak geçiyor (`src/types/monoline.ts:573-635,1192-1221`). Bu ad farkı raporlar, kullanıcı ekranları ve ödül metinlerinde tutarsızlık doğurabilir.

`RANK_UP_REWARDS_BY_CAREER` seviye 2-7 için 1.500 / 4.000 / 10.000 / 25.000 / 50.000 / 125.000 tutarlı ödül açıklamaları içerir (`src/types/monoline.ts:1192-1221`). Sunucu bu ödülleri `userRewardsLog` kaydı olarak ekler ve `is_delivered: false` işaretler; bu fonksiyon doğrudan cüzdana nakit aktarımı yapmaz (`server.ts:833-865`). Kariyer tanımındaki `fixedCareerBonusAmount` da ayrı bir admin ayarı/dağıtım alanıdır; bunu ödül loguyla aynı ödeme gibi değerlendirmeyin (`src/types/monoline.ts:450,478,506,537,568,600,632`; `server.ts:8494-8598`).

## 4. Komisyon ve kazanç hesaplaması

### 4.1 Sipariş bazlı temel motor

`processOrderCommission` yinelenen sipariş kimliğini engeller, pozitif tutarı doğrular ve eksik Monoline üyesini otomatik oluşturabilir. Çoklu sepetlerde en yüksek paket seviyesi korunurken kredi miktarı tüm kalemlerin katalog kredileriyle toplanır; komisyon yüzdeleri bir kez toplam, bölgesel sipariş tutarına uygulanır (`server.ts`, POS settlement ve `processOrderCommission`). Sipariş ID’si idempotency kontrolünde kullanılır.

### 4.2 Kodda görülen nominal oranlar

| Kazanç türü | Kod oranı / hesaplama | Temel ve şart |
|---|---|---|
| Sistem fonu | Sipariş tutarının %5’i | Sipariş tutarı üzerinden; ayrı sistem havuzuna yazılır (`src/config/businessRules.ts:26-33`, `server.ts:1980-1996`). |
| Direkt sponsor | Sipariş tutarının %20’si | Sponsor aktif ve kilitsizse bekleyen cüzdana yazılır; uygun değilse havuza yönlenebilir (`server.ts:2000-2055`). |
| Unilevel | 7 derinlikte %7, %5, %4, %3, %2, %2, %2 (toplam nominal %25) | Sponsor ağacında yukarı yürür; üyenin aktifliği, kariyer derinliği ve kilit şartlarına bağlıdır (`src/config/businessRules.ts:19-22`; `server.ts:2097-2280`). |
| Global Monoline | %1,50, %1,00, %0,80, %0,60, %0,50, %0,30, %0,30 (toplam nominal %5) | Global sıra üzerinden önceki üyeler; varsayılan ayarda pasif üyeleri atlama kapalıdır, uygun olmayan pay havuza devredilebilir (`src/config/businessRules.ts:23-32`; `server.ts:2331-2459`). |
| Infinity | **Devre dışı** | Yeni Infinity tahakkuku üretilmez; kariyer oranları %0’dır ve sunucu şalteri kapalıdır. Önceden oluşmuş komisyon kayıtları ve bakiyeler korunur (`src/types/monoline.ts:1054-1062`; `server.ts:234-248,739-745,9391-9480,11503-11508`). |
| Matching | %10, %15, %20, %25 (kariyere göre) | Sipariş üzerinde doğrudan sponsor olunan kişinin komisyon kazanç tabanına göre; satış tutarının doğrudan aynı yüzdesi değildir (`server.ts:2510-2568`). |
| Fast-ROI | %15 | İlk 30 gün içinde $5.000 kişisel hacim ve 3 aktif direkt referans koşulu; ayrıca bekleyen komisyon statüsü uygulanır (`server.ts:867-905`). |

Oranları basitçe toplayıp “bir siparişten her zaman şu kadar net komisyon çıkar” sonucu üretmek doğru değildir. Komisyonlar farklı tabanlara uygulanır; bir kısmı sponsor/ekip kariyerine, aktiflik ve fraud durumuna, havuz devrine ve aynı siparişteki diğer kazançlara bağlıdır. `SYSTEM_FUND`, komisyon ödemeleri ve takip eden bonuslar ayrı hesap hareketleridir.

Infinity modülü ticari planda yer almadığından yeni siparişlerde hesaplanması kaldırılmış, kariyer oranları sıfırlanmış ve modül açma anahtarı kapatılmıştır. Önceden oluşmuş Infinity cüzdan tutarları, komisyon logları ve sipariş işlem geçmişi silinmez veya terslenmez; bunlar geçmiş finans kaydıdır. Bayi görünümünde Infinity satırı gösterilmez, dolayısıyla geçmiş Infinity bakiyeleri genel cüzdan/toplam kazanç tutarlarında korunmaya devam eder.

### 4.3 14 günlük bekleme, serbest bırakma ve iade

- Komisyon işleyicisi `useClawbackPending = true` kullanır; varsayılan süre 14 gündür (`server.ts:1962-1967`; `src/config/businessRules.ts:29`).
- Uygun komisyonlar `PENDING_14D` olarak bekleyen bölgesel bakiyeye aktarılır (`server.ts:2012-2029`; diğer derinlikler de aynı korumalı yapıyı izler).
- Cron/mutabakat akışı vadesi gelen kaydı bekleyen bakiyeden çekilebilir bakiyeye geçirir; durum `RELEASED`/`RELEASED_TO_BALANCE` olur (`server.ts:9138-9175`).
- Sipariş iadesi bekleyen komisyonu iptal edebilir; önceden serbest bırakılmış bakiye için geri alma uygulanabilir (`server.ts:9316-9369`).
- Muhasebe olayında komisyon beklemede olarak işaretlenir ve release sonrasında olay statüsü güncellenir (`server.ts:2736-2771,9177-9180`).

## 5. Çekim, stopaj ve muhasebe bağlantısı

### 5.1 Çekim koşulları

Çekim talebi; aktif/kilitsiz üye, yeterli çekilebilir bölgesel bakiye, minimum talep tutarı, kariyere göre günlük limit ve ödeme bilgisi kontrollerine tabi tutulur (`server.ts:6189-6274`). Kodda minimum çekim $50; günlük üst sınır seviye 1’de $5.000’den seviye 7’de $100.000’e kadar tanımlıdır (`server.ts:6201-6223`; `src/types/monoline.ts:1181-1190`).

Kod, firma profili için %0 ve bireysel için %20 stopaj varsayar; hesaplanan kesinti sistem fonuna, net tutar ise ödeme talebine yansır (`server.ts:6276-6289,6344-6385`). Uygulama bu oranların vergi mevzuatına uygunluğunu bağımsız olarak kanıtlamaz. Ayrıca firma bayrağının request body’den kullanımı ile kayda yazılan üye profil alanı farklılaşabilir (`server.ts:6279-6284,6344-6358`).

Yönetici onayı çekim kaydını `APPROVED` yapabilir; bu tek başına bankadan ödeme yapıldığını doğrulamaz (`server.ts:6497-6507`). Settlement API’sinde ayrıca auth ve banka dekontu doğrulaması bulunup bulunmadığı canlı finans işlemi öncesi denetlenmelidir (`server.ts:11877-11898`).

### 5.2 Akıllı Muhasebe olay kuyruğu

- Ödenmiş/onaylanmış işlem, `accounting_events` tablosunda olay kimliğiyle saklanır; olay türü, tutar, para birimi, ödeme yöntemi, komisyon özeti ve kayıt zamanı taşınır (`monoline_schema.sql:292-304`; `server/db.ts:82-95`; `server.ts:2736-2771`).
- Sipariş olayı vergi/stopaj için `NEEDS_REVIEW`, fatura için `DRAFT_REQUIRED` olarak açılır; bu bir resmi fatura ya da dengeli yevmiye değildir.
- Harici `sync-event` API’si muhasebe/yönetici yetkisi, ödeme durumu ve pozitif tutar kontrolü uygular (`server.ts:11783-11838`).
- Akıllı Muhasebe paneli olayları 15 saniyede bir yeniler; olayları gelir/yevmiye toplamına dahil etmeden inceleme kuyruğunda gösterir (`src/SmartAccountingApp.tsx:253-338,715-795`).
- Gider pusulası fonksiyonu şu an `generatedCount: 0` ve `totalNetGenerated: 0` döndürür; vergi kuralları mali müşavir onayını beklediğinden resmi belge oluşturmadığını söyler (`server.ts:12033-12046,12095-12105`). Bu nedenle “14 gün doldu” ifadesi “resmi belge kesildi/ödeme yapıldı” anlamına gelmez.
- Muhasebe panelindeki demo/test silme akışı yalnızca açıkça işaretlenmiş/ID önekiyle test olduğu tanınan inceleme olaylarını hedefler; gerçek veya kaynağı belirsiz olayları silmemesi gerekir (`server.ts` içindeki `/api/v1/accounting/events` DELETE handler’ı; `src/SmartAccountingApp.tsx` inceleme kuyruğu kontrolleri). Bu işlem tüm PostgreSQL geçmişini sıfırlayan genel bir veritabanı temizliği değildir.

## 6. Kalıcılık ve entegrasyon mimarisi

- PostgreSQL havuzu `pg.Pool` ile kurulur; `DATABASE_URL`, SSL, `PGPOOL_MAX` (varsayılan 10), 30 saniyelik idle timeout ve 10 saniyelik connection timeout kullanılır (`server/db.ts:18-34`). Render tanımında PostgreSQL URL’i ve `PGPOOL_MAX=10` beklenir (`render.yaml:15-20`); kodda PgBouncer portu veya pooler modu sabitlenmemiştir, canlı `DATABASE_URL` üzerinden doğrulanmalıdır. Vercel’e özel middleware session-level `pg_advisory_lock` kullanır; bu yol transaction pooling ile uyumlu değildir ve Render’da etkin değildir (`server.ts:5324-5373`).
- Uygulama mutasyonlarının genel response middleware’i tam uygulama snapshot’ını PostgreSQL’e yazar. Bu yazma başarısız olursa süreç mutasyonları `DATABASE_PERSISTENCE_FAILED` ile bloke eder; durum `/api/health` yanıtında degraded olarak görünür (`server.ts:5375-5413,5740-5747`). Latch, yalnızca tam snapshot yazımı başarıyla tamamlanınca temizlenir; hata varken sunucu dakikada en fazla bir kurtarma yazımı dener.
- Bazı uç noktalar kendi PostgreSQL transaction’ını ve ledger/idempotency kayıtlarını genel snapshot yazımından önce commit eder. Sonraki snapshot hatası 503 döndürebilir; bu durumda işlemin yapılmadığı varsayılmamalı, sipariş/ledger/idempotency kaydı kontrol edilmeli ve aynı işlem kimliği kullanılmalıdır. İstemci tarafında `src/utils/persistenceVerification.ts` belirsiz 503 yanıtında `request_id` ile status endpoint’ini sorgular; `RECORDED` sonucunda tekrar gönderim yapılmaz. Bu yardımcı şu an kredi komutu (`resellerManager.ts` içindeki `postCreditCommand`), sponsor cüzdan ödemesi (`PaymentModal.tsx`) ve bayi cüzdan satın alımı (`DealerBackOfficeView.tsx`) çağrılarında kullanılıyor; diğer sipariş çağrıları henüz bağlı değil. Status endpoint’i yönetici JWT’si ve bayi JWT’si kabul eder; bayi yalnızca kendi `user_id` kaydını görür.
- DB hata logları hata kodu/mesajı ve pool total/idle/waiting sayaçlarını içerir; aynı bağlam ve hata kodu için dakikada en fazla bir özet yazılır. Render loglarının tek başına 1.2M girdiye neden olduğu kod incelemesinden kanıtlanamaz; ilk DB hatası ve tekrarlanan inbound istekler canlı loglardan doğrulanmalıdır.
- Render bakım zamanlayıcısı 30 saniyede bir çalışır; durum değişmediyse genel snapshot yazmaz ve aynı bakım işi üst üste çalıştırılmaz (`server.ts:13069-13094`). Kodda 503 için genel bir istemci mutation retry döngüsü tespit edilmemiştir; portal state GET poll’u hata halinde 3 saniyeden başlayıp en fazla 60 saniyeye kadar geri çekilir ve her isteğin tamamlanmasını bekler (`src/components/MonolineMlmPortalModal.tsx:242-263`). Harici istemcilerin tekrar deneme davranışı bu kaynak koddan doğrulanamaz.
- Kullanıcı/reseller/Frekans verilerinin bir bölümü LocalStorage ve Firestore’da, Monoline muhasebe ve komisyon durumu PostgreSQL’de tutulur. Bir işleme birden çok veri deposu katıldığında bunlar tek ACID transaction değildir; kısmi senkronizasyon riski vardır (`src/utils/authManager.ts:622-630,1823-1865`; `src/utils/monolineSyncBridge.ts:548-580`).
- `orders_log`, `commission_logs`, `journal_entries`, `expense_vouchers`, `accounting_events`, payout batch’leri ve withdrawal kayıtları ayrı tablolarda taşınır (`server.ts:576-630`; `monoline_schema.sql:272-315`).
- Sipariş olayı ile komisyon olayı aynı `source_event_id`/idempotency anahtarını paylaşıyorsa bir olay duplicate sayılabilir; gerçek event producer’ların tür bazında farklı ID kullandığı ayrıca doğrulanmalıdır (`src/utils/accountingSyncBridge.ts:64-73`; `server.ts:11794-11828`).

## 7. Öncelikli riskler ve önerilen işler

| Öncelik | Bulgular | Etki / öneri |
|---|---|---|
| Yüksek | Kamuya açık kayıt uçlarında `skip_initial_order` ve `pending_payment` varsayılanlarının ödeme/rol doğrulamasıyla güvenceye alınması gerekiyor (`server.ts:7668-7817`). | Ödemesiz kredi, aktiflik, hacim ve komisyon oluşmasını önlemek için bu alanları rol bazlı sunucu politikasıyla sınırlandırın. |
| Yüksek | Üretim POS sağlayıcısı bağlı değil; sandbox akışı gerçek tahsilat sayılmamalı (`server/paymentProviders.ts:78-105,176-183`; `server.ts:11190-11195`). | Canlıya çıkmadan önce sağlayıcı callback imzasını, tutar/sipariş doğrulamasını ve settlement kaydını uçtan uca doğrulayın. |
| Yüksek | `processOrderCommission` yan etkileri ile DB kayıtları arasında hata halinde tam geri alma belirsiz (`server.ts:7781-7894`). | Üye, sipariş, kredi, cüzdan ve muhasebe olayını aynı transaction/idempotency sınırına alın. |
| Yüksek | Bazı kredi/sipariş uç noktalarında route transaction’ı tamamlandıktan sonra genel snapshot middleware’i ayrıca yazma yapar; ikinci yazma hata verirse istemciye 503 dönse de ilk işlem commit edilmiş olabilir (`server.ts:5375-5413,7612-7698`). | 503 sonrası kör tekrar yapmayın; ledger, sipariş ve aynı idempotency key’i kontrol edin. Genel snapshot yazımının route transaction’ıyla kapsamı ayrıca sadeleştirilmelidir. Durum: kredi komutu, cüzdan ödemeleri ve bayi cüzdan satın alımı için istemci doğrulaması eklendi; sunucu tarafında genel snapshot kapsamı hâlâ açık. |
| Yüksek | Settlement uç noktası doğrulama yapmadan `SETTLED` yanıtı veriyor gibi görünüyor (`server.ts:11877-11898`). | Auth, gerçek banka settlement kanıtı ve audit trail eklenmeden ödeme gerçekleşti mesajı vermeyin. |
| Yüksek | Gider pusulası üretimi no-op (`server.ts:12033-12046`). | Vergi onayından sonra gerçek, kalıcı ve idempotent belge üretim adımı ekleyin. |
| Orta | Kariyerin en yüksek seviye olarak kalması ile dönemsel hak ediş açıklaması ayrışıyor (`server.ts:1185-1208`). | “Unvan”, “aktif komisyon derinliği” ve “dönemsel hak ediş” alanlarını ayrılaştırın; düşüş/koruma kuralını iş sahibi onaylasın. |
| Orta | Kariyer isimleri `Marziyye/Mardiyye` ve `Kâmile/Sâfiye` olarak farklı dosyalarda farklı geçiyor (`src/types/monoline.ts:573-635,1192-1221`). | Tek kanonik kariyer kataloğu ve test ile eşleştirin. |
| Orta | Sözleşme onay kaydı kullanıcı/sipariş kimliğini request body’den alabiliyor (`server.ts:11402-11446`). | Onayları doğrulanmış kullanıcı oturumuna, sipariş tutarına ve sözleşme sürümüne bağlayın. |
| Orta | Varsayılan/eksik parola yerine `123456` kullanılması riski (`server.ts:7820-7822`). | Eksik veya zayıf parolayı reddedin; ön tanımlı parola kullanmayın. |
| Orta | `accountingSyncBridge` sipariş ve komisyon olaylarında aynı ID anahtarını kullanabiliyor (`src/utils/accountingSyncBridge.ts:64-73`). | Olay türü/evresi event ID ve idempotency anahtarına dahil edilmeli. |

## 8. Mevcut test kapsamı ve doğrulama sınırı

`package.json:6-13` script’leri:

- `npm test`: `node --import tsx --test server/*.test.ts src/utils/*.test.ts`
- `npm run lint`: `tsc --noEmit`
- `npm run build`: `vite build`

Kaynakta görülen test dosyaları toplam 26 test içeriyor (kaynak sayımı; bu güncellemeden sonra çalıştırılmadı):

| Dosya | Kapsam |
|---|---|
| `server/paymentProviders.test.ts` | 3DS sandbox, kart reddi ve sağlayıcı testleri (5) |
| `src/utils/dualEngineCommission.test.ts` | Komisyon oranı, derinlik, pasif/kilitli üye yardımcıları (6) |
| `src/utils/expenseVoucherEngine.test.ts` | Stopaj yardımcıları, XML ve banka dosyası biçimi (4) |
| `src/utils/financialModel.test.ts` | Paket, bölge fiyatı, sabit kredi ve finansal model yardımcıları (8) |
| `src/utils/withdrawalPayout.test.ts` | IBAN doğrulaması (3) |

Bulunan testlerde bayi kaydının ödeme öncesi/sonrası, `skip_initial_order` yetkisi, PostgreSQL rollback, 14 günlük cron, muhasebe olaylarının uçtan uca akışı veya gerçek POS settlement senaryosu görünmüyor. Önceki doğrulama raporunda TypeScript, test ve build başarılı olarak bildirilmişti; bu rapor güncellemesindeki son değişiklikler için `npx tsc --noEmit`, `npm test` ve `npm run build` yeniden çalıştırılmadı. Mevcut testler ödeme, kayıt idempotency veya belirsiz 503 senaryolarını tam uçtan uca kapsamaz.

## 9. Önerilen doğrulama senaryoları

1. Bekleyen bayi başvurusu: hesap pasif, kredi sıfır; ödeme kanıtı olmadan sipariş/komisyon/hacim oluşmamalı.
2. Ödeme reddi, callback imza hatası, tutar uyuşmazlığı ve replay: hiçbir kredi veya komisyon eklenmemeli.
3. Başarılı tek ödeme ve aynı callback’in tekrar gönderilmesi: bir sipariş, bir kredi tahsisi, bir muhasebe olayı oluşmalı.
4. Aynı doğrulanmış kart ödemesiyle settlement isteği yinelendiğinde sipariş/komisyon/kredi ikinci kez işlenmemeli; farklı ülke ve çoklu sepet tutarları sunucu fiyatlarıyla eşleşmeli.
5. Her kariyer eşiğinin bir altı, tam eşiği ve tek-kol sınırına yakın dağılımı ayrı test edilmeli; farklı kol kariyer gereksinimleri doğrulanmalı.
6. 14 günlük vade öncesi/sonrası ve iade akışı: bekleyen/çekilebilir bakiye, clawback ve muhasebe olay durumu mutabık kalmalı.
7. Firma ve bireysel alıcı için stopaj oranları, müşavir onaylı konfigürasyon üzerinden sınanmalı; yasal oranlar uygulama varsayımıyla karıştırılmamalı.
8. Gider pusulası oluşturma, banka settlement ve yevmiye kaydı yalnızca doğrulanmış kanıt ve idempotency ile tamamlanmalı.
9. Accounting review event duplicate, currency, auth, test-data delete ve persistence senaryoları PostgreSQL entegrasyon testleriyle çalıştırılmalı.
10. PostgreSQL bağlantı kesintisi, havuz doluluğu, transaction rollback, `DATABASE_PERSISTENCE_FAILED` kurtarma ve PgBouncer session/transaction pooling modları ayrı ayrı test edilmeli; 503 alan finansal isteğin idempotency/ledger sonucu mutabık kalmalı.

## 10. Sonuç

Akışta siparişin kariyer/komisyon motoruna giden yolları ve temel nominal oranlar tanımlıdır; fakat ödeme sağlayıcısının sandbox/üretim ayrımı, kamuya açık kayıt parametreleri, atomiklik, manuel onayların ödeme kanıtı yerine kullanılabilmesi ve muhasebe belgesinin gerçek üretim durumu canlı finans operasyonundan önce kapatılması gereken boşluklardır. Kariyer seviyeleri ile komisyon tahakkukunu, ödeme kanıtı ve muhasebe belgesini birbirinden ayrı durumlar olarak ele almak; her aşamayı sunucu tarafında doğrulanabilir, denetlenebilir ve idempotent kılmak önerilir.

## 11. Son değişiklikler ve güncel entegrasyon durumu

- Bayi cüzdanında kümülatif toplam kazanç paneli bulunur. Ana toplam `total_earnings` sayacından alınır; bekleyen ve çekilebilir bakiyelerden ayrı gösterilir. Sponsor, Unilevel, Monoline teşvik, FAST-ROI, Infinity, eşleşme ve kariyer/havuz sayaçlarında iç içe toplamların mükerrer sayılmaması için alt sayaçlar ayrıştırılır (`src/components/DealerBackOfficeView.tsx`).
- Finans yönetim ekranı sipariş hacmi, bayi kümülatif kazanımları, 14 günlük bekleyen komisyon, bölgesel çekilebilir cüzdanlar, çekim talepleri, fon/devir havuzları, kesintiler, çalışma anındaki komisyon oranları ve bayi bazlı kırılımları gösterir (`src/components/AdminConsoleView.tsx`). “Ciro − bayi toplam kazanımı” gider ve vergi öncesi göstergedir; şirketin doğrulanmış net kârı değildir. `company_net_profit_amount` sunucu metriği de sipariş hacminden kümülatif bayi kazanımını çıkarır; gerçek gider, vergi ve banka hareketleriyle mutabakatlı net kâr olarak kullanılmamalıdır (`server.ts:4193-4202`).
- Harici banka API’si bağlı değildir. Önceden `CONNECTED` gösterilen örnek şirket hesapları ve gerçek API olmadan başarı bildiren sahte eşitleme kaldırılmıştır. Kullanıcının seçtiği CSV ekstresi akışında banka adı, hesap etiketi, döviz, kapanış bakiyesi, sütun eşleme ve önizleme alınır; 10 MB/5000 satır sınırı uygulanır. Doğrulanan hareketler muhasebe/yönetici yetkisiyle PostgreSQL’e yazılır, tekrar yüklemede içerik özeti üzerinden yinelenen kayıtlar atlanır. Banka hesapları ve hareketleri ayrı tablolarda tutulur; IBAN yerine sadece son dört hane saklanır (`server/db.ts`, `server.ts:11756-11878`, `src/components/views/OpenBankingView.tsx`, `src/SmartAccountingApp.tsx`). Yönetici finans ekranı ekstre kaynaklı para birimi bazında kümülatif giriş, çıkış, net nakit akışı ve aktarılan kapanış bakiyesini gösterir. Bu nakit akışı şirket muhasebe net kârı değildir; gider/vergi sınıflandırması ve yevmiye mutabakatı ayrıca gerekir (`src/components/AdminConsoleView.tsx`).
- 14 günlük bekleyen komisyonlar vade kontrolünde `PENDING_14D` durumundan serbest bırakılır; bekleyen bölgesel tutar azaltılıp çekilebilir bölgesel bakiye artırılır (`server.ts:9735-9816`). PostgreSQL yüklü Render sunucusunda bakım kontrolü 30 saniyede bir çalışır; yalnızca veri değişince snapshot yazılır. Kalıcılık hatasında en fazla dakikada bir DB kurtarma yazımı dener; `vercel.json` zamanlaması Render’ı tetiklemez.
- `DATABASE_PERSISTENCE_FAILED` sonrası yeni mutasyonlar geçici olarak reddedilir, `/api/health` `degraded` döndürür ve `Retry-After: 60` başlığı verilir. Tam snapshot yazımı dakikada bir başarılı olursa mutasyonlar yeniden açılır. 503 işlem sonucunun belirsiz olabileceği durumlarda aynı idempotency key/ledger kaydı kontrol edilmelidir. DB hata loglarında PostgreSQL kodu/mesajı ve havuz sayaçları bulunur; aynı hata imzası 60 saniyede birden sık yazılmaz.
- `release-pending` POST isteği yönetici veya yalnızca kendi üyesi için doğrulanmış token ister (`server.ts:4705-4731,8117-8137`). İstemci isteğinde Authorization başlığı gönderilmediğinden 401 oluşabiliyordu; istek artık oturum token’ını Bearer olarak gönderir (`src/components/MonolineMlmPortalModal.tsx`).
- Unilevel/Monoline havuza devredilen komisyon kayıtları motor türünü ayrı korur (`src/services/commissionService.ts`); admin ekranındaki Monoline etiketi “Monoline teşvik” olarak netleştirilmiştir. Frekans ve tam ekran panellerde mobil viewport/safe-area iyileştirmeleri de uygulanmıştır.
- Render deploy hatası: `bonusWallets` modülü bulunamadı (`ERR_MODULE_NOT_FOUND`). Yerel depoda import yok; `package.json` başlatma script’i `tsx server.ts`, logdaki komut ise `node server.ts` gösteriyor. Render Root Directory ve Start Command ayarları kontrol edilmeli.
- Eski manuel havale bayi paket yönetimi kaldırıldı: AdminPanel ve bayi ayrıntı penceresindeki bekleyen sipariş tabloları/ret işlemi, `/api/v1/admin/dealer-package-orders` GET ve `/api/v1/admin/dealer-package-orders/:orderId/reject` POST uçları, server state alanı ve senkronizasyon köprüsündeki havale sipariş replay yolu kaldırıldı. Kart/cüzdan settlement ve onaylı sipariş geçmişi korunur; eski pending/banka transferi local kayıtları gösterilmez.
- Commit ve push henüz yapılmadı; yerel değişiklik listesi `git status` ile yeniden kontrol edilmeli.
- Doğrulama sınırı: bu rapor kaynak kod incelemesine dayanır. Canlı Render logları, `DATABASE_URL` hedefi ve PgBouncer modu bu çalışma alanından doğrulanmamıştır; 1.2M+ log girdisinin kesin tetikleyicisi için ilk DB hatası ile inbound istek hacmi incelenmelidir. Banka sağlayıcı kimlik bilgileri/hesap ekstresi mevcut değildir; gerçek şirket net geliri henüz hesaplanamaz. Son UI/API/rapor değişiklikleri için build, lint ve test kullanıcı ortamında yeniden çalıştırılmalıdır; canlı tarayıcı doğrulaması yapılmadı.
