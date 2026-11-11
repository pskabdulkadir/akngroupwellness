import React, { useState } from 'react';
import { BankAccount, BankTransaction } from '../../types/accounting';
import {
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface OpenBankingViewProps {
  bankAccounts: BankAccount[];
  transactions: BankTransaction[];
  onReconcileTransaction: (txId: string) => void;
}

export const OpenBankingView: React.FC<OpenBankingViewProps> = ({
  bankAccounts,
  transactions,
  onReconcileTransaction,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const filteredTransactions = transactions.filter((t) =>
    selectedAccountId === 'ALL' ? true : t.bankAccountId === selectedAccountId
  );

  const handleSyncBankFeeds = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncMessage('Açık Bankacılık (Open Banking) API üzerinden Akbank, Garanti ve İş Bankası anlık ekstreleri başarıyla çekildi ve 102 hesaplarına mutabakat sağlandı.');
      setTimeout(() => setSyncMessage(null), 5000);
    }, 800);
  };

  const totalTryBalance = bankAccounts
    .filter((b) => b.currency === 'TRY')
    .reduce((sum, b) => sum + b.balance, 0);

  const totalUsdBalance = bankAccounts
    .filter((b) => b.currency === 'USD')
    .reduce((sum, b) => sum + b.balance, 0);

  const totalEurBalance = bankAccounts
    .filter((b) => b.currency === 'EUR')
    .reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Açık Bankacılık (Open Banking) &amp; Otomatik Hesap Mutabakatı</span>
          </h2>
          <p className="text-xs text-slate-500">
            TCMB Açık Bankacılık GEÇİT protokolü ile banka hesap hareketlerinin otomatik çekilmesi, 102 defter eşleştirmesi ve SWIFT kur farkı yönetimi
          </p>
        </div>

        <button
          onClick={handleSyncBankFeeds}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Bankalar Taranıyor...' : 'Tüm Bankaları Eşitle (Sync)'}</span>
        </button>
      </div>

      {syncMessage && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Bağlı Banka Hesap Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                ● Çevrimiçi
              </span>
            </div>

            <div className="text-xl font-bold font-mono tracking-tight my-1">
              {acc.currency === 'TRY' ? '₺' : acc.currency === 'USD' ? '$' : '€'}
              {acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {acc.currency}
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
              Canlı Banka Ekstresi &amp; 102 Hesap Eşleşmeleri
            </h3>
            <p className="text-xs text-slate-500">
              Sanal POS tahsilatları, SWIFT döviz transferleri ve bayi EFT hakedişlerinin mutabakatı
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
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
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
                        {tx.category}
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
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Eşleşti (Onay Bekliyor)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => onReconcileTransaction(tx.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        Fişe Git
                      </button>
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
