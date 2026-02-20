import React from 'react'

export default function AsyncButton({
  isLoading = false,
  disabled = false,
  loadingText = 'Saving...',
  children,
  className,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={className}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  )
}
