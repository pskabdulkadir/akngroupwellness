import type { MemberRegion } from '../types/monoline';

export const DOMESTIC_COUNTRY_CODE = 'TR';

export const INTERNATIONAL_PACKAGE_MULTIPLIER = 3;

export const resolveMemberRegion = (countryCode: string | null | undefined): MemberRegion => {
  const normalized = (countryCode ?? '').trim().toUpperCase();
  if (!normalized || normalized === DOMESTIC_COUNTRY_CODE) return 'DOMESTIC';
  return 'INTERNATIONAL';
};

export const getRegionPendingKey = (
  region: MemberRegion
): 'pending_domestic_usd' | 'pending_international_usd' =>
  region === 'DOMESTIC' ? 'pending_domestic_usd' : 'pending_international_usd';

export const getRegionWalletKey = (region: MemberRegion): 'wallet_domestic_usd' | 'wallet_international_usd' =>
  region === 'DOMESTIC' ? 'wallet_domestic_usd' : 'wallet_international_usd';

export const convertTryToUsd = (amountTry: number, tryPerUsd: number): number => {
  if (!Number.isFinite(amountTry) || !Number.isFinite(tryPerUsd) || tryPerUsd <= 0) return 0;
  return Math.round((amountTry / tryPerUsd) * 100) / 100;
};

export const getPackagePriceForRegion = (domesticPriceUsd: number, region: MemberRegion): number =>
  region === 'INTERNATIONAL' ? domesticPriceUsd * INTERNATIONAL_PACKAGE_MULTIPLIER : domesticPriceUsd;

export const ACTIVATION_DOMESTIC_PRICE_USD = 100;

export const getActivationPriceForRegion = (region: MemberRegion): number =>
  getPackagePriceForRegion(ACTIVATION_DOMESTIC_PRICE_USD, region);

type RegionalWalletSource = {
  country_code?: string | null;
  wallets: {
    wallet_domestic_usd?: number;
    wallet_international_usd?: number;
    pending_domestic_usd?: number;
    pending_international_usd?: number;
  };
};

export const getMemberRegionalUsdBalance = (member?: RegionalWalletSource | null): number =>
  member?.wallets?.[getRegionWalletKey(resolveMemberRegion(member?.country_code))] ?? 0;

export const getMemberRegionalPendingUsd = (member?: RegionalWalletSource | null): number =>
  ((member?.wallets?.pending_domestic_usd ?? 0) + (member?.wallets?.pending_international_usd ?? 0));

export const MEMBER_COUNTRY_OPTIONS: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'TR', label: 'Türkiye' },
  { code: 'DE', label: 'Almanya' },
  { code: 'AT', label: 'Avusturya' },
  { code: 'CH', label: 'İsviçre' },
  { code: 'NL', label: 'Hollanda' },
  { code: 'BE', label: 'Belçika' },
  { code: 'FR', label: 'Fransa' },
  { code: 'IT', label: 'İtalya' },
  { code: 'ES', label: 'İspanya' },
  { code: 'PT', label: 'Portekiz' },
  { code: 'GB', label: 'Birleşik Krallık' },
  { code: 'IE', label: 'İrlanda' },
  { code: 'SE', label: 'İsveç' },
  { code: 'NO', label: 'Norveç' },
  { code: 'DK', label: 'Danimarka' },
  { code: 'FI', label: 'Finlandiya' },
  { code: 'PL', label: 'Polonya' },
  { code: 'GR', label: 'Yunanistan' },
  { code: 'US', label: 'ABD' },
  { code: 'CA', label: 'Kanada' },
  { code: 'AE', label: 'Birleşik Arap Emirlikleri' },
  { code: 'SA', label: 'Suudi Arabistan' },
  { code: 'AZ', label: 'Azerbaycan' },
];

export const getCountryFlag = (countryCode: string | null | undefined): string => {
  const normalized = (countryCode ?? '').trim().toUpperCase() || DOMESTIC_COUNTRY_CODE;
  if (!/^[A-Z]{2}$/.test(normalized)) return '🌐';
  return String.fromCodePoint(
    ...Array.from(normalized, (char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  );
};

export const getRegionTierLabel = (region: MemberRegion): string =>
  region === 'INTERNATIONAL' ? '3x Yurt Dışı' : '1x Yurt İçi';
