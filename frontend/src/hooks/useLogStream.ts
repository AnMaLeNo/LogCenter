import { useEffect, useRef } from 'react'

import { logStreamUrl, type LogEntry, type SearchFilters } from '../api'

type UseLogStreamOptions = {
  filters: SearchFilters
  onLog: (log: LogEntry) => void
}

function toSubscription(filters: SearchFilters) {
  return {
    q: filters.q.trim() || null,
    level: filters.levels,
    service: filters.service.trim() || null,
  }
}

export function useLogStream({ filters, onLog }: UseLogStreamOptions) {
  const onLogRef = useRef(onLog)
  onLogRef.current = onLog

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const socketRef = useRef<WebSocket | null>(null)

  // Push updated filters to the server whenever they change.
  useEffect(() => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(toSubscription(filters)))
    }
  }, [filters])

  useEffect(() => {
    let closedByUser = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined

    function connect() {
      const socket = new WebSocket(logStreamUrl())
      socketRef.current = socket

      socket.onopen = () => {
        socket.send(JSON.stringify(toSubscription(filtersRef.current)))
      }

      socket.onmessage = (event) => {
        try {
          onLogRef.current(JSON.parse(event.data) as LogEntry)
        } catch {
          // Ignore malformed frames rather than crashing the stream.
        }
      }

      socket.onclose = () => {
        if (closedByUser) {
          return
        }
        reconnectTimer = setTimeout(connect, 2000)
      }
    }

    connect()

    return () => {
      closedByUser = true
      clearTimeout(reconnectTimer)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [])
}
