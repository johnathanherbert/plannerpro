// Date formatting utilities for pt-BR locale
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Formats a date for pt-BR locale
 * @param date - Date object or ISO string
 * @param formatString - date-fns format string (default: 'dd/MM/yyyy')
 */
export function formatDate(date: Date | string, formatString: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString, { locale: ptBR })
}

/**
 * Formats date with time
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

/**
 * Formats date in relative format (e.g., "hoje", "ontem")
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (formatDate(dateObj) === formatDate(today)) return 'Hoje'
  if (formatDate(dateObj) === formatDate(yesterday)) return 'Ontem'
  
  return formatDate(dateObj)
}
