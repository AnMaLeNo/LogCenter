import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

type AlertMessageProps = {
  children: ReactNode
}

export function AlertMessage({ children }: AlertMessageProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </div>
  )
}
