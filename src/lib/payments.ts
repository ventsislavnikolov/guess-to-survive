export interface CheckoutBreakdown {
  entryFee: number;
  processingFee: number;
  total: number;
}

export function calculateCheckoutBreakdown(
  entryFee: number
): CheckoutBreakdown {
  const normalizedEntryFee = Number.isFinite(entryFee) ? entryFee : 0;
  const processingFee = Number((normalizedEntryFee * 0.029 + 0.25).toFixed(2));
  const total = Number((normalizedEntryFee + processingFee).toFixed(2));

  return {
    entryFee: normalizedEntryFee,
    processingFee,
    total,
  };
}

export function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      style: "currency",
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
