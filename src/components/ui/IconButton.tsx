import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import styles from './IconButton.module.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  size?: 'sm' | 'md'
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({ label, active, size = 'md', children, className = '', ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        data-active={active ? 'true' : undefined}
        data-size={size}
        className={`${styles.btn} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
IconButton.displayName = 'IconButton'
