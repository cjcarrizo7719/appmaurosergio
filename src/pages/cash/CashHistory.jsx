import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import { AlertCircle, Calendar, User, Wallet, ChevronDown, ChevronUp } from 'lucide-react'

export const CashHistory = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cajas')
        .select(`
          *,
          creador:usuario_apertura_id(nombre, apellido),
          cerrador:usuario_cierre_id(nombre, apellido)
        `)
        .eq('estado', 'cerrada')
        .order('fecha_cierre', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (err) {
      console.error('Error al obtener el historial de cajas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-semibold">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent mx-auto mb-3"></div>
        Cargando historial de arqueos...
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center text-slate-400 font-medium">
        No hay registros de arqueos de caja cerrados.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm">Historial de Arqueos de Caja</h3>
        <p className="text-xs text-slate-400 mt-1">
          Auditoría de turnos cerrados, conciliaciones físicas y diferencias de caja.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/30 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Apertura / Cierre</th>
              <th className="px-6 py-4">Fondo Inicial</th>
              <th className="px-6 py-4 text-right">Efectivo Esperado</th>
              <th className="px-6 py-4 text-right">Declarado Real</th>
              <th className="px-6 py-4 text-right">Diferencia</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
            {history.map((caja) => {
              const hasDiff = caja.diferencia !== 0
              const isExpanded = expandedId === caja.id
              const openedBy = caja.creador ? `${caja.creador.nombre} ${caja.creador.apellido || ''}`.trim() : 'Sistema'
              const closedBy = caja.cerrador ? `${caja.cerrador.nombre} ${caja.cerrador.apellido || ''}`.trim() : 'Sistema'

              return (
                <React.Fragment key={caja.id}>
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="px-6 py-4 flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-800">
                        Fin: {formatDate(caja.fecha_cierre)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Inicio: {formatDate(caja.fecha_apertura)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500">
                      {formatMoney(caja.monto_apertura)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-655">
                      {formatMoney(caja.saldo_esperado)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      {formatMoney(caja.saldo_real)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={caja.diferencia === 0 ? 'success' : caja.diferencia < 0 ? 'danger' : 'amber'}>
                        {caja.diferencia === 0 ? 'Cuadrado' : formatMoney(caja.diferencia)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleExpand(caja.id)}
                        className="p-1 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
                        title={isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Accordion Details */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan="6" className="px-8 py-5 border-t border-slate-100/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-600">
                          {/* Left Column: Operator details */}
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operadores</span>
                            <div className="flex items-center gap-2 text-xs">
                              <User size={13} className="text-slate-400" />
                              <span>Apertura por: <strong className="uppercase text-[10px] text-slate-700 font-bold">{openedBy}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <User size={13} className="text-slate-400" />
                              <span>Cierre por: <strong className="uppercase text-[10px] text-slate-700 font-bold">{closedBy}</strong></span>
                            </div>
                          </div>

                          {/* Middle Column: Shift Breakdown */}
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalle de Ventas del Turno</span>
                            <div className="flex flex-col text-[11px] gap-1">
                              <div className="flex justify-between max-w-xs">
                                <span>Ventas Tarjeta:</span>
                                <span className="font-semibold text-slate-800">{formatMoney(caja.monto_cierre_tarjeta)}</span>
                              </div>
                              <div className="flex justify-between max-w-xs">
                                <span>Ventas Transferencia:</span>
                                <span className="font-semibold text-slate-800">{formatMoney(caja.monto_cierre_transferencia)}</span>
                              </div>
                              <div className="flex justify-between max-w-xs border-t border-slate-200/50 pt-1">
                                <span>Ajustes manuales In/Out:</span>
                                <span className="font-semibold text-slate-800">
                                  {formatMoney(caja.total_ingresos - caja.total_egresos)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Observations */}
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observaciones</span>
                            {caja.observaciones ? (
                              <p className="text-xs text-slate-700 bg-white p-3 rounded-2xl border border-slate-100 leading-relaxed max-w-sm italic">
                                "{caja.observaciones}"
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 italic">Sin observaciones registradas.</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
