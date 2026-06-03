import { Search } from 'lucide-react'

import type { LogLevel, SearchFilters } from '../api'
import { LEVELS, LEVEL_STYLES } from '../lib/logs'

type LogFiltersProps = {
  filters: SearchFilters
  onTextChange: (name: 'q' | 'service', value: string) => void
  onLevelToggle: (level: LogLevel, checked: boolean) => void
}

export function LogFilters({
  filters,
  onTextChange,
  onLevelToggle,
}: LogFiltersProps) {
  return (
    <aside className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-3 py-1.5">
        <h2 className="text-xs font-semibold uppercase text-zinc-500">
          Filtres
        </h2>
      </div>

      <div className="flex flex-col gap-4 p-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Message
          <span className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              className="h-9 w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              value={filters.q}
              onChange={(event) => onTextChange('q', event.target.value)}
              placeholder="Rechercher"
            />
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Service
          <input
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            value={filters.service}
            onChange={(event) => onTextChange('service', event.target.value)}
            placeholder="api-gateway"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-zinc-700">Level</legend>
          <div className="flex flex-col gap-1">
            {LEVELS.map((level) => (
              <label
                key={level}
                className="flex h-8 cursor-pointer items-center gap-3 rounded-md px-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
              >
                <input
                  className="size-4 rounded border-zinc-300 text-cyan-700 focus:ring-cyan-600"
                  type="checkbox"
                  checked={filters.levels.includes(level)}
                  onChange={(event) =>
                    onLevelToggle(level, event.target.checked)
                  }
                />
                <span
                  className={`size-2.5 rounded-full ${LEVEL_STYLES[level]}`}
                  aria-hidden="true"
                />
                <span className="font-mono text-xs font-semibold">
                  {level}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </aside>
  )
}
