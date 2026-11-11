export const CURRENCY_CODE = 'USD';

export const formatUsd = (amount: number | null | undefined, fractionDigits = 0): string => {
  const value = Number.isFinite(amount) ? (amount as number) : 0;
  const formatted = Math.abs(value).toLocaleString('tr-TR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${value < 0 ? '-' : ''}$${formatted}`;
};
