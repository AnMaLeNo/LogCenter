import { useEffect, useRef } from 'react'

import { logStreamUrl, type LogEntry, type SearchFilters } from '../api'

type UseLogStreamOptions = {
  filters: SearchFilters
  onLog: (log: LogEntry) => void
  onReconnect?: () => void
}

function toSubscription(filters: SearchFilters) {
  return {
    q: filters.q.trim() || null,
    level: filters.levels,
    service: filters.service.trim() || null,
  }
}

export function useLogStream({ filters, onLog, onReconnect }: UseLogStreamOptions) {
  const onLogRef = useRef(onLog)
  onLogRef.current = onLog

  const onReconnectRef = useRef(onReconnect)
  onReconnectRef.current = onReconnect

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
    let hasConnected = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined

    function connect() {
      const socket = new WebSocket(logStreamUrl())
      socketRef.current = socket

      socket.onopen = () => {
        socket.send(JSON.stringify(toSubscription(filtersRef.current)))
        // A successful reopen means the stream dropped: logs may have been
        // missed while offline, so resync the list from the REST endpoint.
        if (hasConnected) {
          onReconnectRef.current?.()
        }
        hasConnected = true
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
