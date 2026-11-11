import React, { useState } from 'react';
import { Distributor, Invoice, CommissionPayout, Currency, InventoryProduct, StockMovement, OssDeclarationRecord, LiveExchangeRates } from '../../types/accounting';
import { TCMB_RATES, createInvoiceFromOrder, OrderInput, EU_OSS_COUNTRIES } from '../../services/taxEngine';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Globe,
  Building,
  User,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Package,
} from 'lucide-react';

interface SalesSimulatorViewProps {
  distributors: Distributor[];
  inventoryProducts: InventoryProduct[];
  onOrderProcessed: (
    invoice: Invoice,
    commission?: CommissionPayout,
    stockMovement?: StockMovement,
    ossRecord?: OssDeclarationRecord
  ) => void;
  onViewInvoice: (invoice: Invoice) => void;
  rates?: LiveExchangeRates;
}

export const SalesSimulatorView: React.FC<SalesSimulatorViewProps> = ({
  distributors,
  inventoryProducts,
  onOrderProcessed,
  onViewInvoice,
  rates,
}) => {
  const [productType, setProductType] = useState<'DIGITAL' | 'PHYSICAL'>('DIGITAL');
  const [selectedProductId, setSelectedProductId] = useState<string>(inventoryProducts[0]?.id || '');
  const [packageName, setPackageName] = useState('Global 3x Pro Cloud Suite ($199 USD)');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [price, setPrice] = useState<number>(199);
  const [country, setCountry] = useState('US');
  const [isCorporate, setIsCorporate] = useState(false);
  const [isGibRegistered, setIsGibRegistered] = useState(false);
  const [euVatNumber, setEuVatNumber] = useState('');
  const [customerName, setCustomerName] = useState('David Miller (Global Enterprise)');
  const [taxNumber, setTaxNumber] = useState('US-TAX-849201');
  const [email, setEmail] = useState('david.miller@apexcloud.io');
  const [address, setAddress] = useState('100 Montgomery St, Suite 500');
  const [city, setCity] = useState('San Francisco, CA');
  const [taxOffice, setTaxOffice] = useState('');
  const [selectedDistributorId, setSelectedDistributorId] = useState(distributors[0]?.id || '');
  const [integrator, setIntegrator] = useState<'Logo' | 'Uyumsoft' | 'Parasut' | 'NetGSM'>('Uyumsoft');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<Invoice | null>(null);

  // Preset Hazır Şablonlar
  const handleApplyPreset = (
    type:
      | 'DOMESTIC_INDIVIDUAL'
      | 'DOMESTIC_CORPORATE'
      | 'GLOBAL_USD_199'
      | 'EU_OSS_GERMANY'
      | 'PHYSICAL_DEVICE'
  ) => {
    if (type === 'DOMESTIC_INDIVIDUAL') {
      setProductType('DIGITAL');
      setPackageName('Akıllı Muhasebe Bireysel Lisans (Yıllık)');
      setCurrency('TRY');
      setPrice(3600);
      setCountry('TR');
      setIsCorporate(false);
      setIsGibRegistered(false);
      setCustomerName('Murat Çelik');
      setTaxNumber('39482019482');
      setEmail('murat.celik@gmail.com');
      setAddress('Bağdat Cad. No: 154 Kadıköy');
      setCity('İstanbul');
      setTaxOffice('');
      setSelectedDistributorId(distributors[0]?.id || '');
    } else if (type === 'DOMESTIC_CORPORATE') {
      setProductType('DIGITAL');
      setPackageName('Kurumsal Akıllı Muhasebe & ERP Entegrasyon Paketi');
      setCurrency('TRY');
      setPrice(18000);
      setCountry('TR');
      setIsCorporate(true);
      setIsGibRegistered(true);
      setCustomerName('Anadolu Bilişim ve Teknoloji A.Ş.');
      setTaxNumber('1048201948');
      setEmail('fatura@anadolubilisim.com.tr');
      setAddress('Maslak Mahallesi Büyükdere Cad. No: 243 Sarıyer');
      setCity('İstanbul');
      setTaxOffice('Maslak V.D.');
      setSelectedDistributorId(distributors[2]?.id || '');
    } else if (type === 'GLOBAL_USD_199') {
      setProductType('DIGITAL');
      setPackageName('Global 3x Pro Cloud Suite ($199 USD)');
      setCurrency('USD');
      setPrice(199);
      setCountry('US');
      setIsCorporate(false);
      setIsGibRegistered(false);
      setCustomerName('David Miller (Global Enterprise)');
      setTaxNumber('US-TAX-849201');
      setEmail('david.miller@apexcloud.io');
      setAddress('100 Montgomery St, Suite 500');
      setCity('San Francisco, CA');
      setTaxOffice('');
      setSelectedDistributorId(distributors[0]?.id || '');
    } else if (type === 'EU_OSS_GERMANY') {
      setProductType('DIGITAL');
      setPackageName('Europe Pro Cloud License (€149 EUR)');
      setCurrency('EUR');
      setPrice(149);
      setCountry('DE');
      setIsCorporate(false);
      setIsGibRegistered(false);
      setCustomerName('Stefan Weber (Almanya B2C Müşteri)');
      setTaxNumber('DE-CONSUMER-948');
      setEmail('stefan.weber@web.de');
      setAddress('Leipziger Str. 12');
      setCity('Berlin');
      setSelectedDistributorId(distributors[3]?.id || distributors[0]?.id || '');
    } else if (type === 'PHYSICAL_DEVICE') {
      setProductType('PHYSICAL');
      const dev = inventoryProducts[0];
      setSelectedProductId(dev.id);
      setPackageName(dev.name);
      setCurrency('TRY');
      setPrice(dev.sellingPriceTRY);
      setCountry('TR');
      setIsCorporate(true);
      setIsGibRegistered(true);
      setCustomerName('Sağlık ve Klinik Biyomedikal Hizmetleri Ltd. Şti.');
      setTaxNumber('7481920491');
      setEmail('siparis@klinikbiyo.com.tr');
      setAddress('İkitelli OSB Triko Center No: 84 Başakşehir');
      setCity('İstanbul');
      setTaxOffice('İkitelli V.D.');
      setSelectedDistributorId(distributors[0]?.id || '');
    }
  };

  const handleSelectPhysicalProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = inventoryProducts.find((p) => p.id === prodId);
    if (prod) {
      setPackageName(prod.name);
      setPrice(prod.sellingPriceTRY);
      setCurrency('TRY');
    }
  };

  const handleRunSimulation = () => {
    setIsProcessing(true);
    setLastCreatedInvoice(null);
    setProgressStep('1/4: 3D Secure Kredi Kartı Ödemesi Doğrulanıyor...');

    const chosenProduct = productType === 'PHYSICAL' ? inventoryProducts.find((p) => p.id === selectedProductId) : undefined;

    const rateUSD = rates?.USD || TCMB_RATES.USD;
    const rateEUR = rates?.EUR || TCMB_RATES.EUR;

    setTimeout(() => {
      setProgressStep(
        currency === 'USD'
          ? `2/4: Canlı TCMB Döviz Alış Kuru (1 USD = ${rateUSD.toFixed(4)} ₺) Çekildi & Kod 301 İstisnası Uygulandı...`
          : country === 'DE' && currency === 'EUR'
          ? `2/4: AB One Stop Shop (OSS) %19 Alman KDV'si Tespit Edildi (Canlı EUR: ${rateEUR.toFixed(4)} ₺)...`
          : '2/4: Yurt İçi %20 KDV Ayrıştırması & Maliyet Hesaplaması Yapılıyor...'
      );

      setTimeout(() => {
        setProgressStep(
          productType === 'PHYSICAL'
            ? `3/4: ${integrator} ile GİB e-Fatura & e-İrsaliye (IRS2026...) Tanzim Edildi & 621 SMM Hesabına İşlendi...`
            : `3/4: ${integrator} API ile GİB e-Fatura / e-Arşiv UBL-TR İmzalandı...`
        );

        setTimeout(() => {
          const selectedDistributor = distributors.find((d) => d.id === selectedDistributorId);
          setProgressStep(
            selectedDistributor?.isCompany
              ? '4/4: Şirket Bayi Komisyon Carisi Oluşturuldu & Yevmiye Defterine Kaydedildi.'
              : '4/4: Bireysel Bayi İçin %20 Stopaj Kesildi, Gider Pusulası Tanzim Edildi & Deftere İşlendi.'
          );

          const orderInput: OrderInput = {
            customerName,
            taxNumber,
            isCorporate,
            isGibRegistered,
            taxOffice,
            address,
            city,
            country,
            email,
            packageName,
            currency,
            price,
            distributorId: selectedDistributorId,
            integrator,
            isPhysicalGood: productType === 'PHYSICAL',
            inventoryProductId: chosenProduct?.id,
            euVatNumber,
          };

          const { invoice, commission, stockMovement, ossRecord } = createInvoiceFromOrder(
            orderInput,
            selectedDistributor,
            chosenProduct,
            rates
          );

          setTimeout(() => {
            setIsProcessing(false);
            setProgressStep(null);
            setLastCreatedInvoice(invoice);
            onOrderProcessed(invoice, commission, stockMovement, ossRecord);
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  const isGlobal = country !== 'TR' || currency === 'USD' || currency === 'EUR';
  const isEU = EU_OSS_COUNTRIES.some((c) => c.countryCode === country);
  const activeRateUSD = rates?.USD || TCMB_RATES.USD;
  const activeRateEUR = rates?.EUR || TCMB_RATES.EUR;
  const effectiveRate = currency === 'USD' ? activeRateUSD : currency === 'EUR' ? activeRateEUR : 1.0;
  const calculatedTRYEquivalent = price * effectiveRate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Canlı Satış &amp; 3DS Ödeme - Otomatik Fatura ve e-İrsaliye Motoru
        </h2>
        <p className="text-xs text-slate-500">
          Kredi kartı 3DS onayı anında GİB e-Fatura/e-Arşiv kesme, e-İrsaliye düzenleme, AB OSS tespiti ve Monoline bayi stopaj/gider pusulası akışı
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Hızlı Simülasyon Şablonları:</span>
        <button
          onClick={() => handleApplyPreset('GLOBAL_USD_199')}
          className="px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
        >
          🇺🇸 Global 3x Paket ($199 USD - Kod 301 %0 KDV + Bireysel Stopaj)
        </button>
        <button
          onClick={() => handleApplyPreset('EU_OSS_GERMANY')}
          className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          🇪🇺 AB One Stop Shop (Almanya €149 EUR - %19 OSS Yerel KDV)
        </button>
        <button
          onClick={() => handleApplyPreset('PHYSICAL_DEVICE')}
          className="px-3 py-1 text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
        >
          📦 Fiziksel Ürün (8.500 ₺ Cihaz + 153/621 SMM + GİB e-İrsaliye)
        </button>
        <button
          onClick={() => handleApplyPreset('DOMESTIC_INDIVIDUAL')}
          className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 rounded-md hover:bg-slate-200 transition-colors"
        >
          🇹🇷 Yurt İçi Bireysel (3.600 ₺ - %20 KDV + e-Arşiv + Gider Pusulası)
        </button>
      </div>

      {/* Sipariş & Ödeme Formu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol 2 Kolon */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          {/* Ürün Tipi Seçimi */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-700">Ürün / Teslimat Tipi:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setProductType('DIGITAL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  productType === 'DIGITAL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Dijital Yazılım / Paket
              </button>
              <button
                type="button"
                onClick={() => {
                  setProductType('PHYSICAL');
                  handleSelectPhysicalProduct(inventoryProducts[0]?.id || '');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  productType === 'PHYSICAL'
                    ? 'bg-purple-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Fiziksel Ürün (Stok &amp; e-İrsaliye)
              </button>
            </div>
          </div>

          {/* Fiziksel Ürün Seçimi Varsa */}
          {productType === 'PHYSICAL' && (
            <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-lg text-xs space-y-2">
              <label className="block text-purple-900 font-bold">Depodaki Fiziksel Ticari Malı Seçin:</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleSelectPhysicalProduct(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg bg-white text-slate-900 font-medium"
              >
                {inventoryProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok: {p.currentStock} {p.unit} · Maliyet: {p.unitCostTRY} ₺ · Fiyat: {p.sellingPriceTRY} ₺)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-purple-800">
                Satış anında <strong>153 Ticari Mallar</strong> stoğu düşecek, <strong>621 SMM</strong> kaydı yapılacak ve resmi <strong>GİB e-İrsaliye</strong> düzenlenecektir.
              </p>
            </div>
          )}

          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            1. Müşteri &amp; Sipariş Parametreleri
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Müşteri / Kurum Adı</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                {isCorporate ? 'Vergi Kimlik No (VKN - 10 Hane)' : 'T.C. Kimlik No (TCKN - 11 Hane)'}
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Ülke &amp; Bölge</label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  if (e.target.value === 'DE' || e.target.value === 'FR' || e.target.value === 'IT') {
                    setCurrency('EUR');
                  } else if (e.target.value === 'US') {
                    setCurrency('USD');
                  } else {
                    setCurrency('TRY');
                  }
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white"
              >
                <option value="TR">Türkiye (TR) - Yurtiçi KDV %20</option>
                <option value="DE">Almanya (DE) - AB One Stop Shop (OSS) %19 KDV</option>
                <option value="FR">Fransa (FR) - AB One Stop Shop (OSS) %20 KDV</option>
                <option value="IT">İtalya (IT) - AB One Stop Shop (OSS) %22 KDV</option>
                <option value="US">Amerika Birleşik Devletleri (US) - Hizmet İhracı KDV %0</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">E-Posta Adresi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Adres Bilgisi</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Şehir / Eyalet</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCorporate}
                onChange={(e) => setIsCorporate(e.target.checked)}
                className="rounded text-slate-900"
              />
              <span>Kurumsal Müşteri (Şirket)</span>
            </label>

            {isCorporate && country === 'TR' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGibRegistered}
                  onChange={(e) => setIsGibRegistered(e.target.checked)}
                  className="rounded text-slate-900"
                />
                <span>GİB e-Fatura Mükellefi (TICARIFATURA)</span>
              </label>
            )}

            {isCorporate && isEU && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-900">AB VIES KDV No:</span>
                <input
                  type="text"
                  value={euVatNumber}
                  onChange={(e) => setEuVatNumber(e.target.value)}
                  placeholder="Örn: DE284920194"
                  className="px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                />
              </div>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 pt-3">
            2. Paket &amp; MLM Bayi Referansı
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Ürün / Paket Adı</label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Para Birimi</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white"
                >
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Tutar</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Referans MLM Bayisi (Monoline Komisyon)
              </label>
              <select
                value={selectedDistributorId}
                onChange={(e) => setSelectedDistributorId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white"
              >
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · Tier {d.level} ({d.isCompany ? 'Şirket' : 'Bireysel / Stopajlı'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">GİB Özel Entegratör API</label>
              <select
                value={integrator}
                onChange={(e) => setIntegrator(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white"
              >
                <option value="Uyumsoft">Uyumsoft e-Fatura API</option>
                <option value="Logo">Logo Yazılım e-Logo</option>
                <option value="Parasut">Paraşüt REST API</option>
                <option value="NetGSM">Trendyol / NetGSM Portal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Anlık Vergi & 3DS Onay */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Vergi &amp; Komisyon Önizleme
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Fatura Senaryosu:</span>
                <span className="font-mono font-bold text-slate-900">
                  {isEU && isCorporate && euVatNumber
                    ? 'IHRACAT (Reverse Charge)'
                    : isEU
                    ? 'EARSIVBELGE (AB OSS)'
                    : isGlobal
                    ? 'IHRACAT (Hizmet İhracı)'
                    : isCorporate && isGibRegistered
                    ? 'TICARIFATURA'
                    : 'EARSIVBELGE'}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>KDV Uygulaması:</span>
                <span className="font-mono font-semibold">
                  {isEU && isCorporate && euVatNumber ? (
                    <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      Reverse Charge %0
                    </span>
                  ) : isEU ? (
                    <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      AB OSS {country} ({country === 'DE' ? '%19' : '%20'})
                    </span>
                  ) : isGlobal ? (
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      %0 İstisna (Kod 301)
                    </span>
                  ) : (
                    <span>%20 Dahil</span>
                  )}
                </span>
              </div>

              {isGlobal && (
                <div className="flex justify-between text-slate-600">
                  <span>TCMB Gösterge Kuru:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {effectiveRate.toFixed(4)} TRY
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Resmi Yevmiye TRY Tutarı:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {calculatedTRYEquivalent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>

              {productType === 'PHYSICAL' && (
                <div className="p-2.5 bg-purple-50 rounded border border-purple-200 text-[11px] text-purple-900 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    e-İrsaliye ve Stok Çıkışı:
                  </span>
                  <p>Maliyet: 621.01 SMM borç, 153.01 Ticari Mallar alacak kaydedilecek.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {isProcessing ? (
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>İşlem Yürütülüyor...</span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono">{progressStep}</p>
              </div>
            ) : (
              <button
                onClick={handleRunSimulation}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <CreditCard className="w-4 h-4" />
                <span>3D Secure Onayla &amp; Faturayı Kes</span>
              </button>
            )}

            <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>GİB Test Entegratör Sandbox Ortamı ile Bağlıdır</span>
            </p>
          </div>
        </div>
      </div>

      {/* Başarı Bildirimi */}
      {lastCreatedInvoice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900 font-mono">
                {lastCreatedInvoice.invoiceNumber} Numaralı Fatura Başarıyla Kesildi!
              </h4>
              <p className="text-xs text-emerald-800">
                GİB UBL-TR XML üretildi, yevmiye kaydı yapıldı ve bayiye komisyon yansıtıldı.
              </p>
            </div>
          </div>

          <button
            onClick={() => onViewInvoice(lastCreatedInvoice)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <span>Resmi Faturayı Görüntüle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
