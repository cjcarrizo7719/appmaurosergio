import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Modal } from '../../components/ui/Modal'
import { ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'

export const CashForm = ({ isOpen, onClose, activeCajaId, onSuccess }) => {
  const { user } = useAuth()
  
  const [tipo, setTipo] = useState('ingreso') // 'ingreso' or 'egreso'
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const parsedMonto = Number(monto)
    if (isNaN(parsedMonto) || parsedMonto <= 0 || monto === '') {
      setError('El monto del movimiento debe ser un número mayor a 0.')
      return
    }

    if (!descripcion.trim() || descripcion.length < 4) {
      setError('Por favor detalle un motivo descriptivo de al menos 4 caracteres.')
      return
    }

    try {
      setLoading(true)
      
      const { error: insertErr } = await supabase
        .from('caja_movimientos')
        .insert([
          {
            caja_id: activeCajaId,
            tipo: tipo,
            monto: parsedMonto,
            descripcion: descripcion.trim(),
            creado_por: user.id
          }
        ])

      if (insertErr) throw insertErr

      onSuccess()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al guardar el movimiento de caja.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Movimiento Manual de Caja">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Toggle type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Tipo de Movimiento
          </label>
          <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => setTipo('ingreso')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipo === 'ingreso'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <ArrowUpRight size={15} />
              Ingreso (Entrada)
            </button>
            <button
              type="button"
              onClick={() => setTipo('egreso')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipo === 'egreso'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <ArrowDownRight size={15} />
              Egreso (Salida / Pago)
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Monto ($)
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
              className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-400 font-bold text-slate-700 text-sm"
              placeholder="0.00"
              disabled={loading}
            />
          </div>
        </div>

        {/* Motivo / Descripcion */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Descripción / Justificación
          </label>
          <input
            type="text"
            required
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-400 text-xs text-slate-700"
            placeholder="Ej: Retiro para flete / reposición cambio chico"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[11px] font-semibold">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-750 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-600/10 hover:shadow-violet-600/25 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Movimiento'
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 text-xs flex items-center justify-center transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}
