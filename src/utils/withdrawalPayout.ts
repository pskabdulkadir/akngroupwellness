import type { MemberRegion, WithdrawalChannel } from '../types/monoline';

export const normalizeIban = (value: string): string => value.replace(/\s+/g, '').toUpperCase();

export const normalizeBic = (value: string): string => value.replace(/\s+/g, '').toUpperCase();

const isValidIbanChecksum = (iban: string): boolean => {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = Array.from(rearranged, (ch) => (/[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch)).join('');
  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
};

export const isValidTrIban = (iban: string): boolean => {
  const normalized = normalizeIban(iban);
  return /^TR\d{24}$/.test(normalized) && isValidIbanChecksum(normalized);
};

export const isValidInternationalIban = (iban: string): boolean => {
  const normalized = normalizeIban(iban);
  return /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(normalized) && isValidIbanChecksum(normalized);
};

export const isValidBic = (bic: string): boolean =>
  /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(normalizeBic(bic));

export const getPayoutChannelForRegion = (
  region: MemberRegion,
  requested?: string | null
): WithdrawalChannel => {
  if (region === 'DOMESTIC') return 'TR_IBAN';
  return requested === 'SEPA' ? 'SEPA' : 'SWIFT';
};

export const validateWithdrawalPayout = ({
  region,
  channel,
  iban,
  swiftCode,
}: {
  region: MemberRegion;
  channel: WithdrawalChannel;
  iban: string;
  swiftCode?: string | null;
}): string | null => {
  if (region === 'DOMESTIC') {
    return isValidTrIban(iban)
      ? null
      : 'Yurt içi komisyon çekimleri yalnızca geçerli bir TR IBAN hesabına yapılabilir (TR + 24 hane).';
  }

  if (!isValidInternationalIban(iban)) {
    return 'Yurt dışı çekim için geçerli bir uluslararası IBAN giriniz (ülke kodu, kontrol hanesi ve hesap numarası).';
  }

  if (channel === 'SWIFT' && !isValidBic(swiftCode ?? '')) {
    return 'SWIFT çekimi için geçerli bir SWIFT/BIC kodu giriniz (8 veya 11 karakter).';
  }

  return null;
};
