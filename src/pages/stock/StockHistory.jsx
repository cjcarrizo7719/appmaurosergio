import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import { History, Calendar, User, FileText, AlertCircle } from 'lucide-react'

export const StockHistory = ({ productId }) => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchHistory = async () => {
    if (!productId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('stock_movimientos')
        .select(`
          id,
          tipo,
          cantidad,
          motivo,
          created_at,
          profiles (
            nombre,
            apellido
          )
        `)
        .eq('producto_id', productId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setHistory(data || [])
    } catch (err) {
      console.error('Error al obtener historial de stock:', err.message)
      setError('No se pudo cargar el historial de movimientos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [productId])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!productId) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 text-center text-slate-400 font-medium">
        <History size={32} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm">Seleccione una prenda del listado para auditar su historial de movimientos.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"></div>
        <p className="text-slate-400 text-xs font-medium animate-pulse">Obteniendo historial...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-medium">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-400 font-medium shadow-xs">
        <p className="text-sm">No existen movimientos registrados para este producto todavía.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <History size={16} className="text-slate-400" />
        <span>Historial de Movimientos</span>
      </h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {history.map((mov, movIdx) => {
            const isLast = movIdx === history.length - 1
            const isPositive = mov.tipo === 'entrada' || (mov.tipo === 'ajuste' && mov.cantidad > 0)
            const isNegative = mov.tipo === 'salida' || (mov.tipo === 'ajuste' && mov.cantidad < 0)
            
            let badgeVariant = 'warning' // ajuste default
            if (mov.tipo === 'entrada') badgeVariant = 'success'
            if (mov.tipo === 'salida') badgeVariant = 'danger'

            return (
              <li key={mov.id}>
                <div className="relative pb-8">
                  {/* Línea conectora */}
                  {!isLast && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3 items-start">
                    {/* Icono de tipo */}
                    <div>
                      <span className={`h-8.5 w-8.5 rounded-full flex items-center justify-center ring-8 ring-white text-xs font-bold ${
                        isPositive ? 'bg-emerald-50 text-emerald-600' : isNegative ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {isPositive ? `+${mov.cantidad}` : `${mov.cantidad}`}
                      </span>
                    </div>
                    {/* Detalle */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="text-xs text-slate-655 flex flex-wrap items-center justify-between gap-1.5">
                        <span className="font-semibold text-slate-800">
                          {mov.tipo.toUpperCase()}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(mov.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                        <FileText size={11} className="shrink-0 text-slate-350 mt-0.5" />
                        <span>{mov.motivo}</span>
                      </p>
                      {mov.profiles && (
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <User size={10} className="text-slate-300" />
                          <span>Por: {mov.profiles.nombre} {mov.profiles.apellido}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
