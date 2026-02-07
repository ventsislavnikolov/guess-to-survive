import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type LoadingSpinnerProps = {
  className?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASS: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function LoadingSpinner({ className, label = 'Loading', size = 'md' }: LoadingSpinnerProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-muted-foreground', className)}>
      <Loader2 className={cn('animate-spin', SIZE_CLASS[size])} />
      <span className="text-sm">{label}</span>
    </span>
  )
}
