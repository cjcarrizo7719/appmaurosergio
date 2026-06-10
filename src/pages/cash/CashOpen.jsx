import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useCaja } from '../../context/CajaContext'
import { Wallet, Loader2, Info } from 'lucide-react'

export const CashOpen = () => {
  const { profile } = useAuth()
  const { abrirCaja } = useCaja()
  const [monto, setMonto] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleOpen = async (e) => {
    e.preventDefault()
    setError(null)

    const parsedMonto = Number(monto)
    if (isNaN(parsedMonto) || parsedMonto < 0 || monto === '') {
      setError('El saldo inicial de apertura debe ser un número mayor o igual a 0.')
      return
    }

    try {
      setLoading(true)
      await abrirCaja(parsedMonto)
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo abrir la caja. Por favor intente de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col p-8 gap-6 relative">
      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 to-indigo-500"></div>

      {/* Header Info */}
      <div className="text-center flex flex-col items-center gap-3">
        <div className="h-14 w-14 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center border border-violet-100 shadow-sm">
          <Wallet size={26} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Apertura de Caja Diaria</h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Hola, {profile ? `${profile.nombre} ${profile.apellido}` : 'Vendedor'}
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
        <Info size={18} className="text-violet-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-550 leading-relaxed font-medium">
          Antes de comenzar a facturar y cobrar prendas en el Punto de Venta (POS), debe declarar el monto en efectivo físico disponible en el cajón para el cambio.
        </p>
      </div>

      {/* Opening Form */}
      <form onSubmit={handleOpen} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Monto Inicial en Efectivo
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-sm">
              $
            </span>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-400 font-bold text-slate-700 text-sm"
              placeholder="0.00"
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[11px] font-semibold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-600/10 hover:shadow-violet-600/25 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Iniciando Caja...
            </>
          ) : (
            'Abrir Caja Diaria'
          )}
        </button>
      </form>
    </div>
  )
}
