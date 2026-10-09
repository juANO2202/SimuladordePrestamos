const LOCALE = 'es-EC';

export const formatMoney = (value) =>
  `$${Number(value ?? 0).toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatNumber = (value) => Number(value ?? 0).toLocaleString(LOCALE);
