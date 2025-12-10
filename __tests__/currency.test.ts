// Example unit test for currency formatting utility
import { formatCurrency, formatCurrencyCompact, parseCurrency } from '@/lib/currency'

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
      expect(formatCurrency(100)).toBe('R$ 100,00')
      expect(formatCurrency(0.99)).toBe('R$ 0,99')
    })

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-R$ 1.234,56')
    })

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('R$ 0,00')
    })
  })

  describe('formatCurrencyCompact', () => {
    it('should format large numbers compactly', () => {
      expect(formatCurrencyCompact(1234567)).toContain('mi')
      expect(formatCurrencyCompact(1000)).toContain('mil')
    })
  })

  describe('parseCurrency', () => {
    it('should parse formatted currency strings', () => {
      expect(parseCurrency('R$ 1.234,56')).toBe(1234.56)
      expect(parseCurrency('1.234,56')).toBe(1234.56)
      expect(parseCurrency('100,00')).toBe(100)
    })

    it('should return 0 for invalid strings', () => {
      expect(parseCurrency('invalid')).toBe(0)
      expect(parseCurrency('')).toBe(0)
    })
  })
})
