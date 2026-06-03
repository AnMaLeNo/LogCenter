import type { LogLevel, SearchFilters } from '../api'

export const LEVELS: LogLevel[] = ['INFO', 'WARNING', 'ERROR', 'DEBUG']

export const LEVEL_STYLES: Record<LogLevel, string> = {
  INFO: 'bg-blue-500',
  WARNING: 'bg-orange-400',
  ERROR: 'bg-red-500',
  DEBUG: 'bg-zinc-400',
}

export const INITIAL_FILTERS: SearchFilters = {
  q: '',
  levels: LEVELS,
  service: '',
}

export function toDateTimeLocalValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)

  return localDate.toISOString().slice(0, 16)
}

export function toIsoWithLocalOffset(value: string) {
  const date = new Date(value)
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const absoluteOffset = Math.abs(offset)
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0')
  const minutes = String(absoluteOffset % 60).padStart(2, '0')

  return `${value}:00${sign}${hours}:${minutes}`
}

export function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(timestamp))
}
