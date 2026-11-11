export const ETHICS_GUIDELINES_COPYRIGHT = 'Tüm hakları AKN Global Group Ltd. şirketine saklıdır.';

export const DEFAULT_ETHICS_GUIDELINES_CONTENT = `AKN GLOBAL GROUP LTD. - BAYİ ETİK KURALLARI VE TİCARİ DAVRANIŞ İLKELERİ

AKN Global Group Ltd. olarak, tüm iş ortaklarımızın (bayilerimizin) dürüstlük, şeffaflık, karşılıklı güven ve adalet ilkeleri çerçevesinde faaliyet göstermesini ilke ediniyoruz. V2.2 finansal modelimizin sağlığı ve ekosistemimizin güvenliği için aşağıdaki kurallara kesin bir şekilde uyulması zorunludur:

1. Dürüstlük ve Şeffaflık
Bayilerimiz, potansiyel müşterilere ve alt üyelere şirket ürünleri, kazanç modelleri (V2.2 net %5 sistem havuzu, sponsor ve derinlik oranları) hakkında yanıltıcı, abartılı veya gerçeğe aykırı vaatlerde bulunamaz.
Yanıltıcı gelir tabloları sunmak, garantili kazanç iddialarında bulunmak veya sistemi haksız menfaat temin edecek şekilde lanse etmek kesinlikle yasaktır.

2. Çapraz Rekabet ve Etik Dışı Yönlendirme (Cross-recruiting)
Bir başka bayinin ekibindeki üyeleri etik dışı yöntemlerle kendi kademesine çekmeye çalışmak, manipüle etmek veya mevcut hat yapısını bozacak faaliyetlerde bulunmak yasaktır.

3. Marka ve İtibarın Korunması
AKN Global Group Ltd. marka adı, logosu ve tescilli materyalleri yalnızca resmi kılavuzlara uygun olarak kullanılabilir. Şirket itibarını zedeleyecek, sosyal medyada veya dijital mecralarda kurumun adını karalayacak eylemlerde bulunulamaz.

4. Finansal ve Mevzuata Uygunluk
Ödeme sistemleri, komisyon dağıtımları ve çekim talepleri (vergi/stopaj kesintileri dahil) tamamen sistemin otomatize edilmiş kurallarına tabidir. Sistem dışı yollarla haksız kazanç sağlamaya çalışmak, güvenlik açığı aramak veya manipülasyon yapmak yasaktır.

YASAL UYARI VE LİSANS İPTAL YETKİSİ
Yukarıda belirtilen etik kurallara, ticari davranış ilkelerine veya şirket politikalarına aykırı hareket ettiği tespit edilen bayilerin;
• Yönetici tarafından önceden haber verilmeksizin resmi olarak bayi lisansı iptal edilebilir,
• Bayilik ilişkisine son verilebilir,
• Tespit edilen ihlaller neticesinde varsa biriken haksız kazançlar dondurulabilir veya silinebilir.

${ETHICS_GUIDELINES_COPYRIGHT}`;

export function normalizeEthicsGuidelinesContent(content: string): string {
  const body = content.split(ETHICS_GUIDELINES_COPYRIGHT).join('').trim();
  return `${body}\n\n${ETHICS_GUIDELINES_COPYRIGHT}`;
}
