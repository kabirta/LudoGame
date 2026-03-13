export const normalizeCurrencyAmount = value => {
  const numericValue = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(Math.round(numericValue * 100) / 100, 0);
};

export const formatCurrencyAmount = value => {
  const normalizedAmount = normalizeCurrencyAmount(value);
  const hasDecimals = Math.abs(normalizedAmount % 1) > 0.001;

  return normalizedAmount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: hasDecimals ? 2 : 0,
  });
};
