import clsx from 'clsx'
import { Inbox } from 'lucide-react'
import NeonSweepButton from './NeonSweepButton'

export default function EmptyStateSection({
  title = 'No data to display',
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={clsx('rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-10 text-center', className)}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
        <Icon size={24} />
      </div>
      <h3 className="mb-1 text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      {description ? (
        <p className="text-sm text-[var(--text-tertiary)]">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <NeonSweepButton tone="slate" size="md" className="mt-4" onClick={onAction}>
          {actionLabel}
        </NeonSweepButton>
      ) : null}
    </div>
  )
}
