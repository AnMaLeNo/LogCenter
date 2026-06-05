import { useEffect, useRef, useState } from 'react'

import { logStreamUrl, type LogEntry, type SearchFilters } from '../api'

type UseLogStreamOptions = {
  filters: SearchFilters
  onLog: (log: LogEntry) => void
  onConfig?: (limit: number) => void
  onReconnect?: () => void
}

function toSubscription(filters: SearchFilters) {
  return {
    q: filters.q.trim() || null,
    level: filters.levels,
    service: filters.service.trim() || null,
  }
}

export function useLogStream({ filters, onLog, onConfig, onReconnect }: UseLogStreamOptions) {
  const onLogRef = useRef(onLog)
  onLogRef.current = onLog

  const onConfigRef = useRef(onConfig)
  onConfigRef.current = onConfig

  const onReconnectRef = useRef(onReconnect)
  onReconnectRef.current = onReconnect

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const socketRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  // Only flag a real drop once we've connected at least once (not the initial boot).
  const [everConnected, setEverConnected] = useState(false)

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
        setConnected(true)
        setEverConnected(true)
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
          const data = JSON.parse(event.data)
          if (data?.type === 'config') {
            onConfigRef.current?.(data.limit)
            return
          }
          onLogRef.current(data as LogEntry)
        } catch {
          // Ignore malformed frames rather than crashing the stream.
        }
      }

      socket.onclose = () => {
        setConnected(false)
        if (closedByUser) {
          return
        }
        reconnectTimer = setTimeout(connect, 2000)
      }
    }

    connect()

    // The OS / browser network status is the most direct drop signal: it fires
    // for real network loss and for DevTools "Offline". On 'offline' we flag the
    // drop and close so reconnection kicks in; on 'online' we reconnect
    // immediately instead of waiting for the retry timer.
    const handleOffline = () => {
      setConnected(false)
      socketRef.current?.close()
    }
    const handleOnline = () => {
      if (socketRef.current?.readyState !== WebSocket.OPEN) {
        clearTimeout(reconnectTimer)
        connect()
      }
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      closedByUser = true
      clearTimeout(reconnectTimer)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [])

  return { connected, everConnected }
}
