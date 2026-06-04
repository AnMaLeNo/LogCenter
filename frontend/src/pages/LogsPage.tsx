import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  createLog,
  getApiErrorMessage,
  searchLogs,
  type LogEntry,
  type LogLevel,
  type NewLogPayload,
  type SearchFilters,
} from '../api'
import { AlertMessage } from '../components/AlertMessage'
import { LogFilters } from '../components/LogFilters'
import { LogList } from '../components/LogList'
import { NewLogForm } from '../components/NewLogForm'
import { useLogStream } from '../hooks/useLogStream'
import { INITIAL_FILTERS, LEVELS } from '../lib/logs'

const MAX_LOGS = 100

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const fetchLogs = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)

      try {
        setLogs(await searchLogs(filters, signal))
      } catch (searchError) {
        if (signal?.aborted) {
          return
        }

        setError(getApiErrorMessage(searchError))
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [filters],
  )

  useEffect(() => {
    const controller = new AbortController()
    void fetchLogs(controller.signal)

    return () => {
      controller.abort()
    }
  }, [fetchLogs])

  const handleLiveLog = useCallback((log: LogEntry) => {
    setLogs((current) => {
      if (current.some((item) => item.id === log.id)) {
        return current
      }
      return [log, ...current].slice(0, MAX_LOGS)
    })
  }, [])

  // On reconnection, logs may have been missed while offline: resync from REST.
  const handleReconnect = useCallback(() => {
    void fetchLogs()
  }, [fetchLogs])

  useLogStream({ filters, onLog: handleLiveLog, onReconnect: handleReconnect })

  const resultCountLabel = useMemo(() => {
    if (loading) {
      return 'Chargement'
    }

    return `${logs.length} log${logs.length > 1 ? 's' : ''}`
  }, [loading, logs.length])

  function updateTextFilter(name: 'q' | 'service', value: string) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function toggleLevel(level: LogLevel, checked: boolean) {
    setFilters((current) => ({
      ...current,
      levels: checked
        ? LEVELS.filter((item) => item === level || current.levels.includes(item))
        : current.levels.filter((item) => item !== level),
    }))
  }

  async function submitLog(payload: NewLogPayload) {
    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      await createLog(payload)
      setSubmitSuccess('Log ajoute')
    } catch (submitError) {
      setSubmitError(getApiErrorMessage(submitError))
      throw submitError
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-3 sm:px-5 lg:px-6">
        <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-2">
            <LogFilters
              filters={filters}
              onTextChange={updateTextFilter}
              onLevelToggle={toggleLevel}
            />
            <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 px-3 py-1.5">
                <h2 className="text-xs font-semibold uppercase text-zinc-500">
                  Nouveau log
                </h2>
              </div>
              <div className="p-3">
                <NewLogForm
                  error={submitError}
                  success={submitSuccess}
                  submitting={submitting}
                  onSubmit={submitLog}
                />
              </div>
            </section>
          </aside>
          <div className="flex min-w-0 flex-col gap-4">
            {error && <AlertMessage>{error}</AlertMessage>}
            <LogList
              logs={logs}
              loading={loading}
              resultCountLabel={resultCountLabel}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
