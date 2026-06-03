import { RefreshCw } from 'lucide-react'

import type { LogEntry } from '../api'
import { formatTimestamp, LEVEL_STYLES } from '../lib/logs'

type LogListProps = {
  logs: LogEntry[]
  loading: boolean
  resultCountLabel: string
  onRefresh: () => void
}

export function LogList({
  logs,
  loading,
  resultCountLabel,
  onRefresh,
}: LogListProps) {
  return (
    <section className="min-h-[560px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <div className="text-sm text-zinc-600">
          <span>{resultCountLabel}</span>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onRefresh}
          disabled={loading}
          title="Rafraichir"
        >
          <RefreshCw
            className={`size-4 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Rafraichir
        </button>
      </div>

      {logs.length === 0 && !loading ? (
        <div className="flex h-72 items-center justify-center px-4 text-sm text-zinc-500">
          Aucun log trouve
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="w-2" aria-label="Level"></th>
                <th className="w-48 px-4 py-3">Timestamp</th>
                <th className="w-48 px-4 py-3">Service</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="group align-top transition hover:bg-zinc-50"
                >
                  <td className="w-2 p-0">
                    <span
                      className={`block h-full min-h-12 w-1.5 ${LEVEL_STYLES[log.level]}`}
                      aria-label={log.level}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-500">
                    <time dateTime={log.timestamp}>
                      {formatTimestamp(log.timestamp)}
                    </time>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-zinc-700">
                    {log.service}
                  </td>
                  <td className="px-4 py-3 text-sm leading-6 text-zinc-900">
                    <span className="break-words">{log.message}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
