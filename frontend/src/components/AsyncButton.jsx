import React from 'react'
import clsx from 'clsx'

const baseClasses =
  'inline-flex items-center justify-center gap-1.5 border-none cursor-pointer transition-all duration-fast whitespace-nowrap select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]'

const sizeClasses = {
  sm: 'px-2.5 py-1 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-xl',
  xl: 'px-8 py-3 text-lg rounded-xl',
}

const variantClasses = {
  primary:
    'bg-[var(--color-primary-600)] text-white shadow-sm hover:bg-[var(--color-primary-700)] active:bg-[var(--color-primary-800)] disabled:hover:bg-[var(--color-primary-600)]',
  secondary:
    'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-secondary)] hover:border-[var(--border-strong)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
  outline:
    'bg-transparent border border-[var(--color-primary-500)] text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[rgba(59,130,246,0.1)]',
  danger:
    'bg-[var(--color-error)] text-white shadow-sm hover:bg-red-600 active:bg-red-800 disabled:hover:bg-[var(--color-error)]',
  success:
    'bg-[var(--color-success)] text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-800 disabled:hover:bg-[var(--color-success)]',
}

export default function AsyncButton({
  isLoading = false,
  loading = false,
  disabled = false,
  loadingText = 'Saving...',
  children,
  className,
  type = 'button',
  variant,
  size = 'md',
  ...props
}) {
  const busy = isLoading || loading
  const variantCls = variant ? variantClasses[variant] || '' : ''
  const sizeCls = sizeClasses[size] || sizeClasses.md

  return (
    <button
      type={type}
      className={clsx(
        baseClasses,
        variant && variantCls,
        variant && sizeCls,
        !variant && className,
        variant && className,
        busy && 'relative text-transparent pointer-events-none',
      )}
      disabled={busy || disabled}
      {...props}
    >
      {busy ? (
        <>
          <span className="invisible">{children}</span>
          <span
            className={clsx(
              'absolute inset-0 flex items-center justify-center',
              ['primary', 'danger', 'success'].includes(variant) ? 'text-white' : 'text-[var(--text-primary)]',
            )}
            aria-hidden
          >
            <span className="loader-6 loader-6--btn" />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
