import { type FormEvent, useState } from 'react'
import { LoaderCircle, Send } from 'lucide-react'

import type { LogLevel, NewLogPayload } from '../api'
import { LEVELS, toDateTimeLocalValue, toIsoWithLocalOffset } from '../lib/logs'
import { AlertMessage } from './AlertMessage'

type NewLogFormProps = {
  error: string | null
  success: string | null
  submitting: boolean
  onSubmit: (payload: NewLogPayload) => Promise<void>
}

export function NewLogForm({
  error,
  success,
  submitting,
  onSubmit,
}: NewLogFormProps) {
  const [form, setForm] = useState({
    timestamp: toDateTimeLocalValue(),
    level: 'INFO' as LogLevel,
    service: '',
    message: '',
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    await onSubmit({
      timestamp: toIsoWithLocalOffset(form.timestamp),
      level: form.level,
      service: form.service.trim(),
      message: form.message.trim(),
    })

    setForm((current) => ({
      ...current,
      timestamp: toDateTimeLocalValue(),
      message: '',
    }))
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Horodatage
        <input
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          type="datetime-local"
          value={form.timestamp}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              timestamp: event.target.value,
            }))
          }
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Niveau
        <select
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          value={form.level}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              level: event.target.value as LogLevel,
            }))
          }
        >
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Service
        <input
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          value={form.service}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              service: event.target.value,
            }))
          }
          placeholder="user-service"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Message
        <textarea
          className="min-h-20 resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          value={form.message}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              message: event.target.value,
            }))
          }
          placeholder="Request completed"
          required
        />
      </label>

      {error && <AlertMessage>{error}</AlertMessage>}
      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          title="Envoyer le log"
        >
          {submitting ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          Envoyer
        </button>
      </div>
    </form>
  )
}
