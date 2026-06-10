import React from 'react'

export const Badge = ({
  children,
  variant = 'neutral',
  className = ''
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider'

  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    info: 'bg-sky-50 text-sky-700 border border-sky-200',
    violet: 'bg-violet-50 text-violet-700 border border-violet-200'
  }

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
