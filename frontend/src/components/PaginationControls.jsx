import clsx from 'clsx'

export default function PaginationControls({
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  className,
}) {
  const normalizedPageSize = Number(pageSize) > 0 ? Number(pageSize) : 10
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize))
  const safePage = Math.min(Math.max(1, Number(currentPage) || 1), totalPages)

  if (totalItems <= 0) return null

  const startIndex = (safePage - 1) * normalizedPageSize + 1
  const endIndex = Math.min(safePage * normalizedPageSize, totalItems)
  const canChangePageSize = typeof onPageSizeChange === 'function' && Array.isArray(pageSizeOptions) && pageSizeOptions.length > 0

  return (
    <div
      className={clsx(
        'mt-4 flex flex-col gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-sm text-[var(--text-secondary)]">
        Showing <span className="font-semibold text-[var(--text-primary)]">{startIndex}-{endIndex}</span> of{' '}
        <span className="font-semibold text-[var(--text-primary)]">{totalItems}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {canChangePageSize && (
          <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            Per page
            <select
              value={normalizedPageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-2 py-1 text-sm text-[var(--text-primary)] outline-none"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          onClick={() => onPageChange?.(safePage - 1)}
          disabled={safePage <= 1}
          className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>

        <span className="text-sm text-[var(--text-secondary)]">
          Page <span className="font-semibold text-[var(--text-primary)]">{safePage}</span> / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange?.(safePage + 1)}
          disabled={safePage >= totalPages}
          className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
