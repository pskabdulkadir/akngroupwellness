import React, { useState } from 'react';
import { CommissionTransaction, MonolineMember } from '../types/monoline';

interface LedgerTransactionsViewProps {
  transactions: CommissionTransaction[];
  members: MonolineMember[];
  onSelectMemberInTimeline: (userId: string) => void;
}

export const LedgerTransactionsView: React.FC<LedgerTransactionsViewProps> = ({
  transactions,
  members,
  onSelectMemberInTimeline,
}) => {
  const [selectedTxId, setSelectedTxId] = useState<string>(
    transactions[0]?.transaction_id || ''
  );

  const activeTx =
    transactions.find((t) => t.transaction_id === selectedTxId) || transactions[0] || null;

  const sortedMembers = [...members].sort((a, b) => a.global_line_id - b.global_line_id);

  return (
    <div className="space-y-8">
      {/* Split View: Order Commission Transactions List & Detailed 7-Depth Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-200 pb-4">
            <div className="text-xs font-mono text-slate-500">
              FİNANSAL İŞLEM GÜNLÜĞÜ (WEBHOOK KAYITLARI)
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Sipariş & Komisyon Dağıtım Hareketleri ({transactions.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Detaylı 7 derinlik (%7-%5-%4-%3-%2-%2-%2), direkt sponsor (%20) ve fon (%50)
              dağılımını incelemek için bir siparişe tıklayın.
            </p>
          </div>

          <div className="divide-y divide-slate-200 max-h-[540px] overflow-y-auto pr-1">
            {transactions.map((tx) => {
              const isSelected = activeTx?.transaction_id === tx.transaction_id;
              return (
                <div
                  key={tx.transaction_id}
                  onClick={() => setSelectedTxId(tx.transaction_id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedTxId(tx.transaction_id);
                  }}
                  className={`p-3.5 transition-colors cursor-pointer rounded-lg flex items-center justify-between gap-4 ${
                    isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-900'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                      <span className="font-bold">{tx.order_id}</span>
                      <span aria-hidden="true">·</span>
                      <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                        {tx.package_id}
                      </span>
                    </div>
                    <div className="text-sm font-semibold">
                      #{tx.buyer_global_line_id} {tx.buyer_name}
                    </div>
                    <div
                      className={`text-xs font-mono tabular-nums ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      Fon: {tx.system_fund_total_added.toLocaleString('tr-TR')} $ · Sponsor:{' '}
                      {tx.direct_sponsor.amount_paid.toLocaleString('tr-TR')} $ · Üst Sıra:{' '}
                      {tx.total_distributed_to_upline.toLocaleString('tr-TR')} $
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-base font-bold">
                      {tx.order_amount.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      $
                    </div>
                    <div
                      className={`text-[11px] ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {new Date(tx.timestamp).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right 6 cols: Selected Transaction 7-Depth Audit */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          {activeTx ? (
            <>
              <div className="border-b border-slate-200 pb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    İŞLEM DENETİM RAPORU · {activeTx.transaction_id}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {activeTx.order_id} — {activeTx.order_amount.toLocaleString('tr-TR')} $ Dağılım
                    Detayı
                  </h3>
                  <div className="text-xs text-slate-600 mt-1">
                    Sipariş Veren: <strong>#{activeTx.buyer_global_line_id} {activeTx.buyer_name}</strong> ({activeTx.buyer_user_id})
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-500">Toplam Tutar</div>
                  <div className="text-xl font-bold text-slate-900">
                    {activeTx.order_amount.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    $
                  </div>
                </div>
              </div>

              {/* 3 Main Buckets Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500">Sistem / Kariyer Fonu (%50)</div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {activeTx.system_fund_base_amount.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    $
                  </div>
                  {activeTx.system_fund_unclaimed_overflow > 0 && (
                    <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-0.5">
                      +{activeTx.system_fund_unclaimed_overflow.toLocaleString('tr-TR')} $ Devir
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500">Direkt Sponsor (%20)</div>
                  <div className="text-base font-bold font-mono tabular-nums text-emerald-700 mt-1">
                    {activeTx.direct_sponsor.amount_paid.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    $
                  </div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5">
                    {activeTx.direct_sponsor.sponsor_name
                      ? `#${activeTx.direct_sponsor.sponsor_global_line_id} ${activeTx.direct_sponsor.sponsor_name}`
                      : 'Sponsor Yok → Fon'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500">7 Derinlik Üst Sıra (%25)</div>
                  <div className="text-base font-bold font-mono tabular-nums text-amber-700 mt-1">
                    {activeTx.total_distributed_to_upline.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    $
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Monoline Üst 7 Kişi
                  </div>
                </div>
              </div>

              {/* 7 Depth Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-2">Derinlik</th>
                      <th className="py-2 px-2">Oran</th>
                      <th className="py-2 px-2">Tutar</th>
                      <th className="py-2 px-2">Üst Sıra Alıcısı</th>
                      <th className="py-2 pl-2 text-right">Sonuç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeTx.monoline_upline_payouts.map((p) => (
                      <tr key={p.depth}>
                        <td className="py-2.5 pr-2 font-semibold text-slate-900">
                          {p.depth}. Üst Sıra
                        </td>
                        <td className="py-2.5 px-2 font-mono tabular-nums text-slate-700">
                          %{p.rate_percent}
                        </td>
                        <td className="py-2.5 px-2 font-mono tabular-nums font-semibold text-slate-900">
                          {p.calculated_amount.toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                          })}{' '}
                          $
                        </td>
                        <td className="py-2.5 px-2 text-slate-800">
                          {p.recipient_name ? (
                            <span>
                              #{p.recipient_global_line_id} {p.recipient_name}{' '}
                              <span className="text-slate-500">(Kariyer Seviyesi {p.recipient_career_level})</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Üst üye yok</span>
                          )}
                        </td>
                        <td className="py-2.5 pl-2 text-right">
                          {p.status === 'PAID_TO_MEMBER' ? (
                            <span className="text-emerald-700 font-semibold">
                              ✓ Cüzdana Ödendi
                            </span>
                          ) : (
                            <span className="text-amber-700">
                              Fona Aktarıldı ({p.recipient_unlocked_depth}/{p.depth} Yetki)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </section>
      </div>

      {/* All Members Financial Wallets Table */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Tüm Monoline Üyeleri Cüzdan & Hacim Bilançosu
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Her üyenin Direkt Sponsor Cüzdanı (%20), Monoline 7 Derinlik Cüzdanı (%25) ve Kariyer
            Havuz Cüzdanı bakiyeleri.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 pr-3">Sıra</th>
                <th className="py-3 px-3">Üye Adı & ID</th>
                <th className="py-3 px-3">Kariyer Seviyesi</th>
                <th className="py-3 px-3 text-right">Kişisel Hacim</th>
                <th className="py-3 px-3 text-right">Monoline Grup Hacmi</th>
                <th className="py-3 px-3 text-right">Sponsor Cüzdanı (%20)</th>
                <th className="py-3 px-3 text-right">Monoline Cüzdanı (%25)</th>
                <th className="py-3 px-3 text-right">Kariyer Havuz Bonusu</th>
                <th className="py-3 pl-3 text-right">Toplam Kazanç</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
              {sortedMembers.map((m) => (
                <tr key={m.user_id} className="hover:bg-slate-50/80">
                  <td className="py-3 pr-3 font-bold text-slate-900">#{m.global_line_id}</td>
                  <td className="py-3 px-3 font-sans">
                    <button
                      type="button"
                      onClick={() => onSelectMemberInTimeline(m.user_id)}
                      className="font-semibold text-slate-900 hover:underline cursor-pointer text-left"
                    >
                      {m.full_name}
                    </button>
                    <div className="text-[11px] text-slate-500 font-mono">{m.user_id}</div>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-800">
                    {m.career_level > 0
                      ? `Kariyer Seviyesi ${m.career_level} (${m.unlocked_depth}/7)`
                      : 'Aday (0/7)'}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">
                    {m.personal_volume.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">
                    {m.group_volume.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} $
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-medium">
                    {m.wallets.sponsor_wallet.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    $
                  </td>
                  <td className="py-3 px-3 text-right text-amber-700 font-medium">
                    {m.wallets.monoline_wallet.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    $
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">
                    {m.wallets.career_pool_wallet.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    $
                  </td>
                  <td className="py-3 pl-3 text-right font-bold text-slate-900">
                    {m.wallets.total_earnings.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    $
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
