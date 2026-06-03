import axios from 'axios'

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG'

export type LogEntry = {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  service: string
}

export type SearchFilters = {
  q: string
  levels: LogLevel[]
  service: string
}

export type NewLogPayload = {
  timestamp: string
  level: LogLevel
  message: string
  service: string
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:8420'

const client = axios.create({
  baseURL: API_BASE_URL,
})

export async function searchLogs(
  filters: SearchFilters,
  signal?: AbortSignal,
): Promise<LogEntry[]> {
  if (filters.levels.length === 0) {
    return []
  }

  const params = new URLSearchParams()

  if (filters.q.trim()) {
    params.set('q', filters.q.trim())
  }

  filters.levels.forEach((level) => {
    params.append('level', level)
  })

  if (filters.service.trim()) {
    params.set('service', filters.service.trim())
  }

  const response = await client.get<LogEntry[]>('/logs/search', {
    params,
    signal,
  })

  return response.data
}

export async function createLog(payload: NewLogPayload): Promise<LogEntry> {
  const response = await client.post<LogEntry>('/logs', payload)

  return response.data
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item?.msg)
        .filter((message): message is string => typeof message === 'string')
        .join(', ')
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}
