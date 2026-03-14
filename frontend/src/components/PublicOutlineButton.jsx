import clsx from 'clsx'

export default function PublicOutlineButton({
  as: Component = 'button',
  type = 'button',
  className,
  contentClassName,
  sweepClassName,
  children,
  ...props
}) {
  const componentProps = {
    ...props,
    className: clsx(
      'group relative overflow-hidden border-2 border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--bg-card)_85%,transparent)] text-[var(--text-primary)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--accent-primary)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_5%,transparent)]',
      className,
    ),
  }

  if (Component === 'button' && !('type' in props)) {
    componentProps.type = type
  }

  return (
    <Component {...componentProps}>
      <span className={clsx('relative z-10 inline-flex items-center justify-center gap-2', contentClassName)}>{children}</span>
      <span
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute inset-0 -translate-x-[120%] opacity-0 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent-primary)_20%,transparent),transparent)] dark:bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent-secondary)_20%,transparent),transparent)] transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[120%] group-hover:opacity-100',
          sweepClassName,
        )}
      />
    </Component>
  )
}
