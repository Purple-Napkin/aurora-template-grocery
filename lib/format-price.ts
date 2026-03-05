/**
 * Format price for display. Aurora stores prices as decimal major units (e.g. 2.00 = £2).
 * This helper expects cents (integer) and formats for display.
 */
export function formatPrice(cents: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Convert Aurora DB price (decimal major units, e.g. 2.00) to cents for display/cart.
 */
export function toCents(rawPrice: number | null | undefined): number | undefined {
  if (rawPrice == null || !Number.isFinite(rawPrice)) return undefined;
  return Math.round(Number(rawPrice) * 100);
}
