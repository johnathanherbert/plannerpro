// Formatting utilities for currency, dates, etc.

/**
 * Format amount in cents to currency string (R$)
 */
export function formatCurrency(amountInCents: number): string {
  const value = amountInCents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Parse currency string to cents
 */
export function parseCurrency(currencyString: string): number {
  const cleaned = currencyString.replace(/[^\d,-]/g, '').replace(',', '.')
  const value = parseFloat(cleaned)
  return Math.round(value * 100)
}
