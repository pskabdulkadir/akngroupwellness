import React, { useMemo, useState } from 'react';
import { CommissionLogRecord, MemberRegion, MonolineMember, WithdrawalChannel } from '../types/monoline';
import { formatUsd } from '../utils/currency';
import {
  getPayoutChannelForRegion,
  normalizeIban,
  validateWithdrawalPayout,
} from '../utils/withdrawalPayout';
import {
  getCountryFlag,
  getRegionPendingKey,
  getRegionTierLabel,
  getRegionWalletKey,
  resolveMemberRegion,
} from '../utils/walletRegion';

export interface RegionalWithdrawalPayload {
  user_id: string;
  amount: number;
  method: 'IBAN';
  holder_name: string;
  bank_name?: string;
  iban: string;
  region: MemberRegion;
  channel: WithdrawalChannel;
  swift_code?: string;
}

interface DealerRegionalUsdPanelProps {
  dealer: MonolineMember;
  members: MonolineMember[];
  commissionLogs: CommissionLogRecord[];
  region: MemberRegion;
  onCreateWithdrawal: (data: RegionalWithdrawalPayload) => Promise<void>;
}

const MIN_REGIONAL_WITHDRAWAL_USD = 50;

const collectDownline = (dealerUserId: string, members: MonolineMember[]): MonolineMember[] => {
  const childrenBySponsor = new Map<string, MonolineMember[]>();
  for (const m of members) {
    if (!m.sponsor_id) continue;
    const list = childrenBySponsor.get(m.sponsor_id) ?? [];
    list.push(m);
    childrenBySponsor.set(m.sponsor_id, list);
  }

  const result: MonolineMember[] = [];
  const visited = new Set<string>([dealerUserId]);
  const queue = [dealerUserId];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const child of childrenBySponsor.get(current) ?? []) {
      if (visited.has(child.user_id)) continue;
      visited.add(child.user_id);
      result.push(child);
      queue.push(child.user_id);
    }
  }
  return result;
};

export const DealerRegionalUsdPanel: React.FC<DealerRegionalUsdPanelProps> = ({
  dealer,
  members,
  commissionLogs,
  region,
  onCreateWithdrawal,
}) => {
  const isInternational = region === 'INTERNATIONAL';
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [payoutIban, setPayoutIban] = useState<string>(isInternational ? '' : dealer.bank_details?.iban ?? '');
  const [bankName, setBankName] = useState<string>(isInternational ? '' : dealer.bank_details?.bank_name ?? '');
  const [swiftChannel, setSwiftChannel] = useState<'SWIFT' | 'SEPA'>('SWIFT');
  const [swiftCode, setSwiftCode] = useState<string>('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  const regionMembers = useMemo(() => {
    const downline = collectDownline(dealer.user_id, members);
    return downline.filter((m) => resolveMemberRegion(m?.country_code) === region);
  }, [dealer.user_id, members, region]);

  const directRegionCount = useMemo(
    () => regionMembers.filter((m) => m.sponsor_id === dealer.user_id).length,
    [regionMembers, dealer.user_id]
  );

  const regionVolume = useMemo(
    () => regionMembers.reduce((sum, m) => sum + (m.personal_volume || 0), 0),
    [regionMembers]
  );

  const regionCommissions = useMemo(
    () =>
      commissionLogs
        .filter(
          (log) =>
            String(log.target_external_id) === dealer.user_id &&
            (log.region ?? 'DOMESTIC') === region &&
            typeof log.amount_usd === 'number'
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [commissionLogs, dealer.user_id, region]
  );

  const totalCommissionUsd = regionCommissions.reduce((sum, log) => sum + (log.amount_usd || 0), 0);
  const availableUsd = dealer.wallets[getRegionWalletKey(region)] ?? 0;
  const pendingUsd = dealer.wallets[getRegionPendingKey(region)] ?? 0;

  const payoutChannel = getPayoutChannelForRegion(region, swiftChannel);
  const normalizedIban = normalizeIban(payoutIban);
  const amountError =
    withdrawAmount < MIN_REGIONAL_WITHDRAWAL_USD
      ? `Minimum çekim tutarı $${MIN_REGIONAL_WITHDRAWAL_USD}.`
      : withdrawAmount > availableUsd
        ? `Bu bölgede çekilebilir bakiye $${availableUsd.toFixed(2)}.`
        : null;
  const payoutError = normalizedIban
    ? validateWithdrawalPayout({
        region,
        channel: payoutChannel,
        iban: normalizedIban,
        swiftCode: payoutChannel === 'SWIFT' ? swiftCode : undefined,
      })
    : 'IBAN giriniz.';
  const canSubmitWithdrawal = !amountError && !payoutError && !isSubmittingWithdrawal;

  const handleRegionalWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitWithdrawal) return;
    setIsSubmittingWithdrawal(true);
    try {
      await onCreateWithdrawal({
        user_id: dealer.user_id,
        amount: withdrawAmount,
        method: 'IBAN',
        holder_name: dealer.full_name,
        bank_name: bankName.trim() || undefined,
        iban: normalizedIban,
        region,
        channel: payoutChannel,
        swift_code: payoutChannel === 'SWIFT' ? swiftCode.trim() : undefined,
      });
      setWithdrawAmount(0);
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const title = isInternational ? '🌍 Yurt Dışı & Avrupa Bayi Paneli ($ USD)' : '🇹🇷 Yurt İçi Bayi Paneli ($ USD)';
  const description = isInternational
    ? 'Yalnızca yurt dışı kayıtlı üyelerden doğan USD komisyonları ve metrikleri. Paket fiyatları 3x uygulanır.'
    : 'Yalnızca Türkiye kayıtlı üyelerden doğan USD komisyonları ve metrikleri. Paket fiyatları 1x uygulanır.';

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600">{description}</p>
        <p className="text-[11px] text-slate-500 font-mono">{getRegionTierLabel(region)} · Cüzdan: {getRegionWalletKey(region)}</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
          <div className="text-[10px] font-bold uppercase text-emerald-800">Kullanılabilir USD</div>
          <div className="text-2xl font-bold font-mono text-slate-900">{formatUsd(availableUsd, 2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
          <div className="text-[10px] font-bold uppercase text-amber-800">14 Gün Bekleyen USD</div>
          <div className="text-2xl font-bold font-mono text-slate-900">{formatUsd(pendingUsd, 2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="text-[10px] font-bold uppercase text-slate-600">Bölge Üyeleri (Direkt / Toplam)</div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {directRegionCount} / {regionMembers.length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="text-[10px] font-bold uppercase text-slate-600">Bölge Ciro (Kişisel)</div>
          <div className="text-2xl font-bold font-mono text-slate-900">{formatUsd(regionVolume, 2)}</div>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Bölge Üyeleri</h4>
          <span className="text-xs text-slate-500 font-mono">Toplam komisyon: {formatUsd(totalCommissionUsd, 2)}</span>
        </div>
        {regionMembers.length === 0 ? (
          <p className="text-xs text-slate-500">Bu bölgeden kayıtlı alt üye bulunmuyor.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {regionMembers.map((m) => (
              <li key={m.user_id} className="py-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">
                  {getCountryFlag(m.country_code)} {m.full_name}
                </span>
                <span className="font-mono text-slate-600">
                  {(m.country_code || 'TR').toUpperCase()} · {formatUsd(m.personal_volume || 0, 2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-900">Bölge Komisyon Kayıtları (USD)</h4>
        {regionCommissions.length === 0 ? (
          <p className="text-xs text-slate-500">Bu bölgeye ait USD komisyon kaydı yok.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {regionCommissions.slice(0, 20).map((log) => (
              <li key={log.id} className="py-2 flex items-center justify-between text-xs">
                <span className="text-slate-700">
                  {log.commission_type} · {log.source_user_name}
                </span>
                <span className="font-mono font-semibold text-slate-900">{formatUsd(log.amount_usd || 0, 2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Komisyon Çekim Talebi</h4>
          <span className="text-[11px] font-mono text-slate-500">
            {isInternational ? 'SWIFT / SEPA IBAN' : 'TR IBAN (Havale / EFT)'}
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Talep yönetici paneline düşer. Yönetici onayladığında ödeme, yönetici tarafından bu IBAN hesabına manuel banka transferiyle yapılır ve talep onaylanır. Reddedilen tutar bu bölgenin cüzdanına iade edilir.
        </p>

        <form onSubmit={handleRegionalWithdrawal} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Brüt Çekim Tutarı (USD)</label>
              <input
                type="number"
                min={MIN_REGIONAL_WITHDRAWAL_USD}
                step="0.01"
                value={withdrawAmount || ''}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setWithdrawAmount(availableUsd)}
                className="mt-1 text-[11px] font-mono text-slate-600 underline"
              >
                Tümünü seç ({formatUsd(availableUsd, 2)})
              </button>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Hesap Sahibi (Kayıtlı Ad Soyad)</label>
              <input
                type="text"
                readOnly
                value={dealer.full_name}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700"
              />
            </div>
          </div>

          {isInternational && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Transfer Yöntemi</label>
                <select
                  value={swiftChannel}
                  onChange={(e) => setSwiftChannel(e.target.value as 'SWIFT' | 'SEPA')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="SWIFT">SWIFT (uluslararası)</option>
                  <option value="SEPA">SEPA (Avrupa)</option>
                </select>
              </div>
              {payoutChannel === 'SWIFT' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">SWIFT / BIC Kodu</label>
                  <input
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                    placeholder="Örn: DEUTDEFF"
                    className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                {isInternational ? 'Uluslararası IBAN' : 'TR IBAN'}
              </label>
              <input
                type="text"
                value={payoutIban}
                onChange={(e) => setPayoutIban(e.target.value)}
                placeholder={isInternational ? 'DE89 3704 0044 0532 0130 00' : 'TR00 0000 0000 0000 0000 0000 00'}
                className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Banka Adı (opsiyonel)</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 text-white font-mono space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>%20 Vergi Kesintisi</span>
              <span>-{formatUsd(withdrawAmount * 0.2, 2)}</span>
            </div>
            <div className="flex justify-between text-emerald-300 font-bold">
              <span>Net Ödenecek</span>
              <span>{formatUsd(withdrawAmount * 0.8, 2)}</span>
            </div>
          </div>

          {(amountError || (normalizedIban && payoutError)) && (
            <p className="text-[11px] text-rose-700">{amountError || payoutError}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmitWithdrawal}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold disabled:opacity-40"
          >
            {isSubmittingWithdrawal ? 'Talep gönderiliyor...' : 'Çekim Talebi Oluştur'}
          </button>
        </form>
      </section>
    </div>
  );
};
