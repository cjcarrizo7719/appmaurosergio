import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useCaja } from '../../context/CajaContext'
import { useAuth } from '../../context/AuthContext'
import { Plus, Minus, Power, Loader2, ArrowUpRight, ArrowDownRight, Wallet, ShoppingCart, RefreshCw, AlertTriangle } from 'lucide-react'
import { CashForm } from './CashForm'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'

export const CashActive = () => {
  const { cajaActiva, cerrarCaja } = useCaja()
  const { profile } = useAuth()
  
  const [resumen, setResumen] = useState(null)
  const [loadingResumen, setLoadingResumen] = useState(true)
  const [movimientos, setMovimientos] = useState([])
  const [loadingMovs, setLoadingMovs] = useState(true)
  
  // Modal states
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  
  // Close Shift Form States
  const [saldoReal, setSaldoReal] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [loadingClose, setLoadingClose] = useState(false)
  const [closeError, setCloseError] = useState(null)

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0)
  }

  const loadData = async () => {
    if (!cajaActiva) return
    try {
      setLoadingResumen(true)
      setLoadingMovs(true)
      
      // 1. Fetch resumen from RPC
      const { data: resData, error: resErr } = await supabase
        .rpc('obtener_resumen_caja', { p_caja_id: cajaActiva.id })
      
      if (resErr) throw resErr
      setResumen(resData)

      // 2. Fetch manual movements
      const { data: manualMovs, error: movsErr } = await supabase
        .from('caja_movimientos')
        .select('id, tipo, monto, descripcion, created_at, profiles(nombre, apellido)')
        .eq('caja_id', cajaActiva.id)

      if (movsErr) throw movsErr

      // 3. Fetch sales in shift
      const { data: sales, error: salesErr } = await supabase
        .from('ventas')
        .select('id, total, metodo_pago, created_at, clientes(nombre, apellido)')
        .eq('caja_id', cajaActiva.id)

      if (salesErr) throw salesErr

      // 4. Merge and sort timelines
      const combined = [
        ...(manualMovs || []).map(m => ({
          id: m.id,
          tipo: m.tipo === 'ingreso' ? 'Ingreso Manual' : 'Egreso Manual',
          monto: m.monto,
          descripcion: m.descripcion,
          fecha: m.created_at,
          operador: m.profiles ? `${m.profiles.nombre} ${m.profiles.apellido}` : 'Sistema',
          badgeColor: m.tipo === 'ingreso' ? 'success' : 'danger',
          isSale: false
        })),
        ...(sales || []).map(s => ({
          id: s.id,
          tipo: 'Venta POS',
          monto: s.total,
          descripcion: `Venta Factura #${s.id.substring(0, 8).toUpperCase()} (${s.metodo_pago}) - Cliente: ${s.clientes ? `${s.clientes.nombre} ${s.clientes.apellido}` : 'Consumidor Final'}`,
          fecha: s.created_at,
          operador: 'Vendedor',
          badgeColor: 'violet',
          isSale: true,
          metodo_pago: s.metodo_pago
        }))
      ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

      setMovimientos(combined)
    } catch (err) {
      console.error('Error al cargar datos de caja activa:', err)
    } finally {
      setLoadingResumen(false)
      setLoadingMovs(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [cajaActiva])

  const handleCloseShift = async (e) => {
    e.preventDefault()
    setCloseError(null)

    const realVal = Number(saldoReal)
    if (isNaN(realVal) || realVal < 0 || saldoReal === '') {
      setCloseError('Por favor declare el saldo real con un número válido.')
      return
    }

    const expectedCash = resumen ? resumen.saldo_esperado : 0
    const diff = realVal - expectedCash

    if (diff !== 0 && !observaciones.trim()) {
      setCloseError('Se detectó una diferencia de caja. Es obligatorio registrar observaciones.')
      return
    }

    try {
      setLoadingClose(true)
      await cerrarCaja(cajaActiva.id, {
        monto_cierre_efectivo: realVal, // Declared physical cash
        monto_cierre_tarjeta: resumen.ventas_tarjeta,
        monto_cierre_transferencia: resumen.ventas_transferencia,
        saldo_esperado: expectedCash,
        saldo_real: realVal,
        diferencia: diff,
        observaciones: observaciones
      })
      setShowCloseModal(false)
    } catch (err) {
      console.error(err)
      setCloseError(err.message || 'Error al cerrar el turno de caja.')
    } finally {
      setLoadingClose(false)
    }
  }

  const expectedCash = resumen ? resumen.saldo_esperado : 0
  const realValNumeric = Number(saldoReal) || 0
  const closeDifference = realValNumeric - expectedCash

  return (
    <div className="flex flex-col gap-6">
      {/* Active Shift Header Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>
            <h2 className="font-bold text-slate-800 text-lg">Caja Abierta y Activa</h2>
            <Badge variant="success" className="text-[10px] py-0.5">Operando</Badge>
          </div>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">
            Abierta el {new Date(cajaActiva.fecha_apertura).toLocaleString('es-AR')} por <span className="font-bold text-slate-500 uppercase">{profile?.nombre} {profile?.apellido}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-3 rounded-2xl border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
            title="Refrescar saldos"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowMoveModal(true)}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus size={14} />
            Movimiento Manual
          </button>
          <button
            onClick={() => {
              setSaldoReal('')
              setObservaciones('')
              setCloseError(null)
              setShowCloseModal(true)}
            }
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <Power size={14} />
            Cerrar Turno de Caja
          </button>
        </div>
      </div>

      {/* Cash Register Metrics Grid */}
      {loadingResumen ? (
        <div className="h-32 flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"></div>
          <span className="text-slate-400 text-xs font-semibold">Consolidando libro de caja...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Expected Cash */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 flex flex-col justify-between min-h-[120px] shadow-sm relative overflow-hidden">
            <div className="absolute -right-3 -bottom-3 text-white/5 pointer-events-none">
              <Wallet size={80} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efectivo Esperado</span>
            <span className="text-2xl font-black mt-2">{formatMoney(resumen?.saldo_esperado)}</span>
            <span className="text-[9px] text-slate-400 mt-2 font-medium">Apertura + Ingresos - Egresos</span>
          </div>

          {/* Cash Sales */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col justify-between min-h-[120px] shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ventas en Efectivo</span>
            <span className="text-xl font-bold text-slate-800 mt-2">{formatMoney(resumen?.ventas_efectivo)}</span>
            <span className="text-[9px] text-slate-400 mt-2 font-medium">Facturaciones cobradas en metálico</span>
          </div>

          {/* Card / Transfer sales */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col justify-between min-h-[120px] shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ventas Tarjeta / Transf</span>
            <div className="flex flex-col mt-2">
              <span className="text-sm font-bold text-slate-700">Tarjeta: {formatMoney(resumen?.ventas_tarjeta)}</span>
              <span className="text-sm font-bold text-slate-700">Transf: {formatMoney(resumen?.ventas_transferencia)}</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-2 font-medium">Dinero directo a cuenta bancaria</span>
          </div>

          {/* Inflow / Outflow Manuals */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col justify-between min-h-[120px] shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajustes Manuales</span>
            <div className="flex flex-col mt-2 gap-0.5">
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <ArrowUpRight size={12} />
                Ingresos: {formatMoney(resumen?.ingresos_manuales)}
              </span>
              <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                <ArrowDownRight size={12} />
                Egresos: {formatMoney(resumen?.egresos_manuales)}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 mt-1 font-medium">Fondo fijo inicial: {formatMoney(resumen?.monto_apertura)}</span>
          </div>
        </div>
      )}

      {/* Cash Ledger / Movements list */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Libro Diario de Caja (Turno Activo)</h3>
          <p className="text-xs text-slate-400 mt-1">Detalle ordenado cronológicamente de todas las facturaciones e ingresos/egresos manuales.</p>
        </div>

        {loadingMovs ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Cargando historial de movimientos...
          </div>
        ) : movimientos.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            No se han registrado movimientos de caja en este turno.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Hora</th>
                  <th className="px-6 py-4">Operación</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                {movimientos.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 text-slate-400 font-medium">
                      {new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={m.badgeColor}>{m.tipo}</Badge>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-655 truncate max-w-[320px]" title={m.descripcion}>
                      {m.descripcion}
                    </td>
                    <td className={`px-6 py-3.5 text-right font-bold ${
                      m.tipo === 'Egreso Manual' ? 'text-rose-500' : 'text-slate-800'
                    }`}>
                      {m.tipo === 'Egreso Manual' ? '-' : ''}{formatMoney(m.monto)}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 uppercase font-semibold text-[10px]">
                      {m.operador}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Movement Drawer / Modal */}
      {showMoveModal && (
        <CashForm
          isOpen={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          activeCajaId={cajaActiva.id}
          onSuccess={loadData}
        />
      )}

      {/* Close Cash Shift Modal */}
      {showCloseModal && (
        <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Cierre y Arqueo de Caja">
          <form onSubmit={handleCloseShift} className="flex flex-col gap-5">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Métricas de Cierre</span>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Efectivo en Caja Esperado:</span>
                <span className="font-bold text-slate-800">{formatMoney(expectedCash)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Ventas Tarjeta Consolidadas:</span>
                <span className="font-bold text-slate-800">{formatMoney(resumen?.ventas_tarjeta)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Ventas Transferencia Consolidadas:</span>
                <span className="font-bold text-slate-800">{formatMoney(resumen?.ventas_transferencia)}</span>
              </div>
            </div>

            {/* Declared physical cash balance */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Efectivo Físico Declarado en Caja
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
                  value={saldoReal}
                  onChange={(e) => setSaldoReal(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-400 font-bold text-slate-700 text-sm"
                  placeholder="0.00"
                  disabled={loadingClose}
                />
              </div>
            </div>

            {/* Interactive calculations of differences */}
            {saldoReal !== '' && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
                closeDifference === 0
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  : closeDifference < 0
                  ? 'bg-rose-50 border-rose-100 text-rose-700'
                  : 'bg-amber-50 border-amber-100 text-amber-700'
              }`}>
                {closeDifference !== 0 ? (
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                ) : (
                  <ArrowUpRight size={18} className="shrink-0 mt-0.5" />
                )}
                <div className="flex flex-col gap-0.5 text-xs font-semibold">
                  <span>
                    Diferencia de Caja: {formatMoney(closeDifference)}
                  </span>
                  <span className="text-[10px] font-medium opacity-80">
                    {closeDifference === 0 
                      ? 'La caja cierra cuadrada a la perfección.' 
                      : closeDifference < 0 
                      ? 'Falta dinero en caja física comparado con lo registrado.' 
                      : 'Sobra dinero en caja física comparado con lo registrado.'}
                  </span>
                </div>
              </div>
            )}

            {/* Observations field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Observaciones del Arqueo {closeDifference !== 0 && <span className="text-rose-500 font-bold">* (Obligatorio)</span>}
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Indique los motivos de cualquier descuadre, egreso o aclaraciones sobre el arqueo de caja..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500/20 outline-none transition-all text-xs text-slate-700"
                disabled={loadingClose}
                required={closeDifference !== 0}
              />
            </div>

            {closeError && (
              <div className="p-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[11px] font-semibold">
                {closeError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                disabled={loadingClose}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-750 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-600/10 hover:shadow-rose-600/25 active:scale-[0.98]"
              >
                {loadingClose ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Cerrando Caja...
                  </>
                ) : (
                  'Confirmar y Cerrar Caja'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 text-xs flex items-center justify-center transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
