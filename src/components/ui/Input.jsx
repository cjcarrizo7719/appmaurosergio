import React, { forwardRef } from 'react'

export const Input = forwardRef(({
  label,
  type = 'text',
  error,
  placeholder,
  className = '',
  required = false,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-0.5">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder-slate-400 text-slate-800 ${
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200'
        }`}
        {...props}
      />
      {error && (
        <p className="text-xs text-rose-500 mt-0.5 font-medium">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
