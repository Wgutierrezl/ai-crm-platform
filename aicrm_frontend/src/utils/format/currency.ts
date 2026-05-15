export function formatCurrency(
  value: number,
  currency = "COP",
  locale = "es-CO",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
