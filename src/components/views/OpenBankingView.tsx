import React, { useState } from 'react';
import type { BankAccount, BankTransaction, Currency } from '../../types/accounting';

interface OpenBankingViewProps {
  bankAccounts: BankAccount[];
  transactions: BankTransaction[];
  cashFlowTotals: Array<{ currency: string; incoming: number; outgoing: number }>;
  onImportCompleted: () => Promise<void>;
}

type CsvColumns = { date: number | ''; description: number | ''; amount: number | ''; direction: number | ''; counterparty: number | '' };
type ImportedRow = Omit<BankTransaction, 'id' | 'bankAccountId' | 'bankName' | 'matchStatus'>;

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  values.push(value.trim());
  return values;
}

function parseStatementDate(value: string): string | null {
  const text = value.trim();
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  const local = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  const parts = iso ? [iso[1], iso[2], iso[3]] : local ? [local[3], local[2], local[1]] : null;
  if (!parts) return null;
  const date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  return date.getUTCFullYear() === Number(parts[0]) && date.getUTCMonth() + 1 === Number(parts[1]) && date.getUTCDate() === Number(parts[2])
    ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    : null;
}

function parseStatementAmount(value: string): number | null {
  let text = value.replace(/[^0-9,.-]/g, '');
  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    text = comma > dot ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
  } else if (comma >= 0) {
    text = text.replace(',', '.');
  }
  const amount = Number(text);
  return Number.isFinite(amount) && amount !== 0 ? amount : null;
}

function detectColumn(headers: string[], patterns: RegExp): number | '' {
  const index = headers.findIndex((header) => patterns.test(header.toLocaleLowerCase('tr-TR')));
  return index < 0 ? '' : index;
}

export const OpenBankingView: React.FC<OpenBankingViewProps> = ({
  bankAccounts,
  transactions,
  cashFlowTotals,
  onImportCompleted,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [fileRows, setFileRows] = useState<string[][]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [columns, setColumns] = useState<CsvColumns>({ date: '', description: '', amount: '', direction: '', counterparty: '' });
  const [bankName, setBankName] = useState('');
  const [accountReference, setAccountReference] = useState('');
  const [accountLastFour, setAccountLastFour] = useState('');
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [category, setCategory] = useState<BankTransaction['category']>('UNCATEGORIZED');
  const [closingBalance, setClosingBalance] = useState('');
  const [positiveAmountFlow, setPositiveAmountFlow] = useState<'' | 'GIRIS_INFLOW' | 'CIKIS_OUTFLOW'>('');
  const [previewRows, setPreviewRows] = useState<ImportedRow[]>([]);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const filteredTransactions = transactions.filter((t) =>
    selectedAccountId === 'ALL' ? true : t.bankAccountId === selectedAccountId
  );

  const handleFileSelected = async (file?: File) => {
    setImportMessage(null);
    setPreviewRows([]);
    setFileRows([]);
    setFileHeaders([]);
    setPositiveAmountFlow('');
    setClosingBalance('');
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setImportMessage({ type: 'error', text: 'CSV dosyası 10 MB sınırını aşamaz.' });
      return;
    }
    const text = (await file.text()).replace(/^\uFEFF/, '');
    const firstLine = text.split(/\r?\n/, 1)[0] || '';
    const delimiters = [',', ';', '\t'];
    const delimiter = delimiters.sort((a, b) => parseCsvLine(firstLine, b).length - parseCsvLine(firstLine, a).length)[0];
    const parsedRows = text.split(/\r?\n/).filter((line) => line.trim()).map((line) => parseCsvLine(line, delimiter));
    if (parsedRows.length < 2 || parsedRows.length > 5001) {
      setImportMessage({ type: 'error', text: 'CSV en az bir başlık ve bir hareket, en fazla 5000 hareket içermelidir.' });
      return;
    }
    const headers = parsedRows[0].map((value, index) => value || `Sütun ${index + 1}`);
    setFileHeaders(headers);
    setFileRows(parsedRows.slice(1));
    setColumns({
      date: detectColumn(headers, /tarih|date|işlem günü/),
      description: detectColumn(headers, /açıklama|description|detay/),
      amount: detectColumn(headers, /tutar|amount|işlem miktarı/),
      direction: detectColumn(headers, /yön|direction|işlem türü|debit.?credit/),
      counterparty: detectColumn(headers, /karşı taraf|counterparty|alıcı|gönderen/),
    });
  };

  const createPreview = () => {
    setImportMessage(null);
    if (columns.date === '' || columns.description === '' || columns.amount === '' || !bankName.trim() || !accountReference.trim()) {
      setImportMessage({ type: 'error', text: 'Banka, hesap etiketi, tarih, açıklama ve tutar sütunlarını seçin.' });
      return;
    }
    const rows: ImportedRow[] = [];
    for (const [index, values] of fileRows.entries()) {
      const amount = parseStatementAmount(values[columns.amount] || '');
      const date = parseStatementDate(values[columns.date] || '');
      const description = (values[columns.description] || '').trim();
      const directionText = columns.direction === '' ? '' : (values[columns.direction] || '').toLocaleLowerCase('tr-TR');
      const parsedFlow = /giriş|gelir|alacak|credit|inflow|\+/.test(directionText)
        ? 'GIRIS_INFLOW'
        : /çıkış|gider|borç|debit|outflow|-/.test(directionText)
          ? 'CIKIS_OUTFLOW'
          : null;
      if (!amount || !date || !description) {
        setImportMessage({ type: 'error', text: `${index + 2}. satırda geçerli tarih, açıklama veya tutar yok.` });
        return;
      }
      const flow = parsedFlow || (amount < 0 ? 'CIKIS_OUTFLOW' : positiveAmountFlow);
      if (!flow) {
        setImportMessage({ type: 'error', text: 'Yön sütununu seçin veya pozitif tutarların giriş/çıkış olduğunu belirtin.' });
        return;
      }
      rows.push({
        date,
        description,
        counterparty: columns.counterparty === '' ? '' : (values[columns.counterparty] || '').trim(),
        amount: Math.abs(amount),
        currency,
        flow,
        category,
      });
    }
    setPreviewRows(rows);
  };

  const importStatement = async () => {
    if (closingBalance.trim() && parseStatementAmount(closingBalance) === null) {
      setImportMessage({ type: 'error', text: 'Ekstre kapanış bakiyesi sayı biçiminde olmalıdır.' });
      return;
    }
    setIsImporting(true);
    setImportMessage(null);
    try {
      const response = await fetch('/api/v1/accounting/bank-statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: {
            bankName: bankName.trim(),
            accountReference: accountReference.trim(),
            ibanLast4: accountLastFour.trim(),
            currency,
            balance: closingBalance.trim() ? parseStatementAmount(closingBalance) : null,
          },
          transactions: previewRows,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Ekstre içe aktarılamadı.');
      await onImportCompleted();
      setImportMessage({ type: 'success', text: `${result.inserted_count} hareket kaydedildi; ${result.duplicate_count} yinelenen satır atlandı.` });
      setPreviewRows([]);
      setFileRows([]);
      setFileHeaders([]);
    } catch (error: any) {
      setImportMessage({ type: 'error', text: error?.message || 'Ekstre içe aktarılamadı.' });
    } finally {
      setIsImporting(false);
    }
  };

  const previewTotals = previewRows.reduce((totals, row) => {
    if (row.flow === 'GIRIS_INFLOW') totals.income += row.amount;
    else totals.expense += row.amount;
    return totals;
  }, { income: 0, expense: 0 });

  const columnSelect = (label: string, key: keyof CsvColumns, required = false) => (
    <label className="space-y-1 text-xs text-slate-600">
      <span>{label}{required ? ' *' : ''}</span>
      <select value={columns[key]} onChange={(event) => setColumns((current) => ({ ...current, [key]: event.target.value === '' ? '' : Number(event.target.value) }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900">
        {!required && <option value="">Seçilmedi</option>}
        {fileHeaders.map((header, index) => <option key={`${header}-${index}`} value={index}>{header}</option>)}
      </select>
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Banka Ekstreleri &amp; Yevmiye Mutabakatı</span>
          </h2>
          <p className="text-xs text-slate-500">
            Gerçek banka bağlantısı yok; CSV ile içe aktarılan kayıtlar kullanıcı tarafından sağlanır ve banka tarafından doğrulanmış sayılmaz.
          </p>
        </div>

        <span className="self-start rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 sm:self-auto">
          {bankAccounts.length > 0 ? 'CSV ekstre verisi' : 'Banka sağlayıcısı bağlı değil'}
        </span>
      </div>

      {bankAccounts.length === 0 && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          Henüz banka sağlayıcısından doğrulanmış ekstre yok. CSV içe aktarımları kullanıcı tarafından sağlanan kayıtlardır; net nakit akışı yalnızca ön göstergedir ve muhasebe kârı değildir.
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" aria-label="Banka ekstresi CSV içe aktarma">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Banka ekstresi içe aktar</h3>
          <p className="mt-1 text-xs text-slate-500">CSV dosyasını seçin, sütunları eşleyin ve doğrulamadan sonra PostgreSQL’e kaydedin. Excel dosyasını bankanızdan CSV olarak dışa aktarın.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs text-slate-600"><span>Banka adı</span><input value={bankName} onChange={(event) => setBankName(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="Banka adı" /></label>
          <label className="space-y-1 text-xs text-slate-600"><span>Hesap etiketi</span><input value={accountReference} onChange={(event) => setAccountReference(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="Örn. Şirket USD hesabı" /></label>
          <label className="space-y-1 text-xs text-slate-600"><span>IBAN son 4 hane (isteğe bağlı)</span><input value={accountLastFour} onChange={(event) => setAccountLastFour(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" maxLength={4} className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="1234" /></label>
          <label className="space-y-1 text-xs text-slate-600"><span>Döviz</span><select value={currency} onChange={(event) => setCurrency(event.target.value as Currency)} className="w-full rounded-lg border border-slate-200 px-3 py-2"><option value="TRY">TRY</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label>
          <label className="space-y-1 text-xs text-slate-600"><span>Ekstre kapanış bakiyesi (isteğe bağlı)</span><input value={closingBalance} onChange={(event) => setClosingBalance(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="CSV sayı biçimi" /></label>
        </div>
        <label className="block space-y-1 text-xs text-slate-600"><span>CSV dosyası (en fazla 10 MB / 5000 satır)</span><input type="file" accept=".csv,text/csv" onChange={(event) => void handleFileSelected(event.target.files?.[0])} className="block w-full rounded-lg border border-slate-200 p-2" /></label>
        <label className="block max-w-md space-y-1 text-xs text-slate-600"><span>Bu dosyadaki hareketlerin kategorisi</span><select value={category} onChange={(event) => setCategory(event.target.value as BankTransaction['category'])} className="w-full rounded-lg border border-slate-200 px-3 py-2"><option value="UNCATEGORIZED">Sınıflandırılmadı</option><option value="SANAL_POS_TAHSILAT">Sanal POS tahsilatı</option><option value="BAYI_KOMISYON_EFT">Bayi komisyonu / EFT</option><option value="SWIFT_DOVIZ">SWIFT / döviz</option><option value="VERGI_ODEME">Vergi ödemesi</option><option value="GENEL_GIDER">Genel gider</option></select></label>
        {fileHeaders.length > 0 && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">{columnSelect('Tarih sütunu', 'date', true)}{columnSelect('Açıklama sütunu', 'description', true)}{columnSelect('Tutar sütunu', 'amount', true)}{columnSelect('Yön sütunu', 'direction')}{columnSelect('Karşı taraf sütunu', 'counterparty')}</div>}
        {fileHeaders.length > 0 && <label className="block max-w-md space-y-1 text-xs text-slate-600"><span>Yön sütunu tanınmazsa pozitif tutarların yönü</span><select value={positiveAmountFlow} onChange={(event) => setPositiveAmountFlow(event.target.value as typeof positiveAmountFlow)} className="w-full rounded-lg border border-slate-200 px-3 py-2"><option value="">Seçin</option><option value="GIRIS_INFLOW">Giriş / tahsilat</option><option value="CIKIS_OUTFLOW">Çıkış / ödeme</option></select></label>}
        {fileHeaders.length > 0 && <button type="button" onClick={createPreview} className="min-h-11 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white">Önizleme oluştur</button>}
        {previewRows.length > 0 && <>
          <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2">Tarih</th><th className="px-3 py-2">Açıklama</th><th className="px-3 py-2">Yön</th><th className="px-3 py-2 text-right">Tutar</th></tr></thead><tbody className="divide-y divide-slate-100">{previewRows.slice(0, 5).map((row, index) => <tr key={`${row.date}-${index}`}><td className="px-3 py-2">{row.date}</td><td className="max-w-[260px] truncate px-3 py-2">{row.description}</td><td className="px-3 py-2">{row.flow === 'GIRIS_INFLOW' ? 'Giriş' : 'Çıkış'}</td><td className="px-3 py-2 text-right">{row.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {row.currency}</td></tr>)}</tbody></table></div>
          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span>{previewRows.length} hareket · Giriş {previewTotals.income.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency} · Çıkış {previewTotals.expense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency} · Net nakit akışı {(previewTotals.income - previewTotals.expense).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span><button type="button" onClick={() => void importStatement()} disabled={isImporting} className="min-h-11 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{isImporting ? 'Kaydediliyor…' : 'İçe aktarılan CSV’yi kaydet'}</button></div>
        </>}
        {importMessage && <p role="status" className={`rounded-lg px-3 py-2 text-xs ${importMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{importMessage.text}</p>}
      </section>

      {cashFlowTotals.length > 0 && <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Banka ekstresi nakit akışı">{cashFlowTotals.map(({ currency: unit, incoming, outgoing }) => <div key={unit} className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">İçe aktarılan ekstre net akışı · {unit}</div><div className="mt-1 text-lg font-bold text-slate-900">{(incoming - outgoing).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {unit}</div><div className="mt-1 text-[11px] text-slate-500">Giriş {incoming.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} · Çıkış {outgoing.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div></div>)}</section>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {bankAccounts.map((acc) => (
          <div
            key={acc.id}
            onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? 'ALL' : acc.id)}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              selectedAccountId === acc.id
                ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold ${selectedAccountId === acc.id ? 'text-white' : 'text-slate-900'}`}>
                {acc.bankName}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  selectedAccountId === acc.id
                    ? 'bg-white/20 text-white'
                    : acc.openBankingStatus === 'CONNECTED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {acc.openBankingStatus === 'CONNECTED' ? 'Bağlı' : acc.openBankingStatus === 'SYNCING' ? 'Eşitleniyor' : acc.openBankingStatus === 'IMPORTED' ? 'Ekstre içe aktarıldı' : 'Bağlantı hatası'}
              </span>
            </div>

            <div className="text-xl font-bold font-mono tracking-tight my-1">
              {acc.balance === null ? 'Bakiye girilmedi' : `${acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${acc.currency}`}
            </div>

            <p className={`text-[10px] font-mono truncate mt-2 ${selectedAccountId === acc.id ? 'text-slate-300' : 'text-slate-400'}`}>
              {acc.iban}
            </p>
          </div>
        ))}
      </div>

      {/* Banka Hesap Hareketleri ve Otomatik Yevmiye Eşleştirmesi */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Banka Ekstresi &amp; 102 Hesap Eşleşmeleri
            </h3>
            <p className="text-xs text-slate-500">
              İçe aktarılan hareketleri yevmiye kayıtlarıyla karşılaştırın; otomatik eşleştirme henüz etkin değil.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedAccountId('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedAccountId === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tüm Hareketler
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Banka</th>
                <th className="py-3 px-4">Açıklama / Karşı Taraf</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Tutar</th>
                <th className="py-3 px-4">SWIFT Masraf / Kur Farkı</th>
                <th className="py-3 px-4 text-center">Mutabakat Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center font-sans text-slate-500">
                    Doğrulanmış banka hareketi bulunmuyor.
                  </td>
                </tr>
              )}
              {filteredTransactions.map((tx) => {
                const isInflow = tx.flow === 'GIRIS_INFLOW';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{tx.date}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      {tx.bankName}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <p className="font-medium text-slate-900">{tx.description}</p>
                      <span className="text-[10px] text-slate-400">{tx.counterparty}</span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {tx.category === 'UNCATEGORIZED' ? 'Sınıflandırılmadı' : tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      <span className={isInflow ? 'text-emerald-700' : 'text-slate-900'}>
                        {isInflow ? '+' : '-'}
                        {tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {tx.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-[11px]">
                      {tx.category === 'SWIFT_DOVIZ' ? (
                        <div className="space-y-0.5">
                          <span className="text-slate-600 block">
                            Masraf: <strong className="font-mono">{tx.swiftFeeTRY} ₺</strong> (770 Gider)
                          </span>
                          <span className="text-emerald-700 block">
                            Kur Farkı: <strong className="font-mono">+{tx.fxDifferenceTRY} ₺</strong> (646 Kâr)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      {tx.matchStatus === 'MUTABIK' ? (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          102 Defterle Mutabık
                        </span>
                      ) : tx.matchStatus === 'ESLESMEDI' ? (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Yevmiye eşleşmedi
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          Eşleştirme onayı bekliyor
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
