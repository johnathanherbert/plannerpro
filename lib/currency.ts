// Currency formatting utilities for Brazilian Real (BRL)

/**
 * Formats a number as BRL currency with proper thousand/decimal separators
 * @param amount - The amount to format
 * @returns Formatted string like "R$ 1.234,56"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

/**
 * Formats a number as compact BRL (e.g., "R$ 1,2 mil")
 * @param amount - The amount to format
 * @returns Compact formatted string
 */
export function formatCurrencyCompact(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

/**
 * Parses a BRL currency string to number
 * @param value - String like "R$ 1.234,56" or "1.234,56"
 * @returns Numeric value
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}
