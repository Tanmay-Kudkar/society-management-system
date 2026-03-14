import clsx from 'clsx'

export default function PublicSweepButton({
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
    className: clsx('group relative overflow-hidden', className),
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
          'pointer-events-none absolute inset-0 -translate-x-[120%] opacity-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(191,219,254,0.28),transparent)] transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[120%] group-hover:opacity-100',
          sweepClassName,
        )}
      />
    </Component>
  )
}
