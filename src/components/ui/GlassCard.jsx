import * as React from 'react'
import { cn } from '@/lib/utils'

export default function GlassCard({
  children,
  className = '',
  dark = false,
  glow = false,
  ...props
}) {
  const baseClasses = dark
    ? 'bg-black/20 backdrop-blur-md border border-white/10 shadow-lg rounded-2xl text-white'
    : 'bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl'

  return (
    <div className="relative">
      {glow && (
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 blur-xl opacity-75 pointer-events-none" />
      )}
      <div className={cn('relative', baseClasses, className)} {...props}>
        {children}
      </div>
    </div>
  )
}

export { GlassCard }
export * from './glass-card'
