import React, { useState, useEffect } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { useAuth } from '../../context/AuthContext'
import { useCaja } from '../../context/CajaContext'
import { supabase } from '../../lib/supabase'
import { TrendingUp, Users, ShoppingBag, Banknote, ShoppingCart, Loader2, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { profile } = useAuth()
  const { cajaActiva } = useCaja()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSalesCount: 0,
    totalRevenue: 0,
    ticketAverage: 0,
    activeClientsCount: 0,
    criticalStockCount: 0,
    paymentMethods: { efectivo: 0, tarjeta: 0, transferencia: 0 },
    topProducts: []
  })

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const loadAdminStats = async () => {
    try {
      setLoading(true)

      // 1. Fetch sales
      const { data: sales, error: salesErr } = await supabase
        .from('ventas')
        .select('total, metodo_pago')

      if (salesErr) throw salesErr

      // Calculate sales metrics
      const totalSalesCount = sales?.length || 0
      const totalRevenue = (sales || []).reduce((sum, s) => sum + Number(s.total), 0)
      const ticketAverage = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0

      const paymentMethods = { efectivo: 0, tarjeta: 0, transferencia: 0 }
      (sales || []).forEach(s => {
        const method = s.metodo_pago ? s.metodo_pago.toLowerCase() : ''
        if (method in paymentMethods) {
          paymentMethods[method] += Number(s.total)
        }
      })

      // 2. Fetch active clients count
      const { count: activeClientsCount, error: clientsErr } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true)

      if (clientsErr) throw clientsErr

      // 3. Fetch products stock for critical count
      const { data: products, error: prodErr } = await supabase
        .from('productos')
        .select('stock_actual, stock_minimo')
        .eq('activo', true)

      if (prodErr) throw prodErr
      const criticalStockCount = (products || []).filter(
        p => p.stock_actual <= p.stock_minimo
      ).length

      // 4. Fetch details for top products ranking
      const { data: details, error: detErr } = await supabase
        .from('venta_detalles')
        .select('cantidad, producto:producto_id(sku, nombre, precio_unitario, imagen_url)')

      if (detErr) throw detErr

      // Aggregate top products
      const productMap = {}
      (details || []).forEach(d => {
        const prod = d.producto
        if (!prod) return
        const sku = prod.sku
        if (!productMap[sku]) {
          productMap[sku] = {
            sku: prod.sku,
            nombre: prod.nombre,
            precio: prod.precio_unitario,
            imagen_url: prod.imagen_url,
            cantVendida: 0
          }
        }
        productMap[sku].cantVendida += d.cantidad
      })

      const topProducts = Object.values(productMap)
        .sort((a, b) => b.cantVendida - a.cantVendida)
        .slice(0, 5)

      setStats({
        totalSalesCount,
        totalRevenue,
        ticketAverage,
        activeClientsCount: activeClientsCount || 0,
        criticalStockCount,
        paymentMethods,
        topProducts
      })

    } catch (err) {
      console.error('Error al cargar estadísticas de administrador:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.role === 'administrador') {
      loadAdminStats()
    } else {
      setLoading(false) // Vendedores don't load stats
    }
  }, [profile])

  const isAdmin = profile?.role === 'administrador'

  return (
    <PageLayout>
      <div className="flex flex-col gap-6">
        {/* Welcome Banner Card */}
        <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-lg border border-slate-800">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -translate-x-12 translate-y-12 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                Mauro Sergio Manager
              </span>
              <h2 className="text-2xl md:text-3xl font-black mt-1.5 tracking-tight leading-tight">
                ¡Hola, {profile?.nombre} {profile?.apellido}!
              </h2>
              <p className="text-slate-400 text-xs font-medium mt-1">
                {isAdmin
                  ? 'Aquí tienes el resumen comercial y financiero de la tienda.'
                  : 'Bienvenido al panel del local. Selecciona una acción para comenzar tu jornada de ventas.'}
              </p>
            </div>
            <div>
              <Badge variant="violet" className="text-xs px-3 py-1 font-bold shadow-md bg-violet-600 border-none text-white">
                {isAdmin ? 'Panel de Administración' : 'Acceso Vendedor POS'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Conditional Dashboard Display */}
        {loading ? (
          <div className="h-64 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2">
            <Loader2 size={32} className="animate-spin text-violet-500" />
            <span className="text-slate-400 text-xs font-semibold animate-pulse">Cargando métricas de negocio...</span>
          </div>
        ) : isAdmin ? (
          /* ========================================================================= */
          /* ADMINISTRATOR DASHBOARD VIEW                                             */
          /* ========================================================================= */
          <div className="flex flex-col gap-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Facturacion Total */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facturación Total</span>
                  <span className="text-2xl font-black text-slate-800 mt-2 block">{formatMoney(stats.totalRevenue)}</span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">Acumulado total de ventas</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                  <TrendingUp size={22} />
                </div>
              </div>

              {/* Ventas Registradas */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ventas Realizadas</span>
                  <span className="text-2xl font-black text-slate-800 mt-2 block">{stats.totalSalesCount} operaciones</span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">Transacciones cobradas en POS</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-violet-50 text-violet-500 border border-violet-100">
                  <ShoppingCart size={22} />
                </div>
              </div>

              {/* Ticket Promedio */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ticket Promedio</span>
                  <span className="text-2xl font-black text-slate-800 mt-2 block">{formatMoney(stats.ticketAverage)}</span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">Monto medio por operación</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100">
                  <Banknote size={22} />
                </div>
              </div>

              {/* Stock Critico */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prendas Bajo Mínimo</span>
                  <span className="text-2xl font-black mt-2 block text-slate-800">
                    {stats.criticalStockCount === 0 ? (
                      <span className="text-emerald-600 font-bold text-lg flex items-center gap-1">
                        <ShieldCheck size={18} /> Sin alertas
                      </span>
                    ) : (
                      <span className="text-rose-500 font-black">{stats.criticalStockCount} alertas</span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">Prendas que requieren reposición</span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${
                  stats.criticalStockCount === 0 
                    ? 'bg-emerald-50 text-emerald-500 border-emerald-100' 
                    : 'bg-rose-50 text-rose-500 border-rose-100'
                }`}>
                  <ShoppingBag size={22} />
                </div>
              </div>
            </div>

            {/* Split charts area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment Methods Progress Bars */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-5 lg:col-span-1">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Ventas por Medio de Pago</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Distribución monetaria cobrada por canal.</p>
                </div>

                <div className="flex flex-col gap-4.5 mt-2">
                  {/* Cash */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Efectivo</span>
                      <span className="text-slate-800 font-bold">{formatMoney(stats.paymentMethods.efectivo)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${stats.totalRevenue > 0 ? (stats.paymentMethods.efectivo / stats.totalRevenue) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Tarjeta (Débito/Crédito)</span>
                      <span className="text-slate-800 font-bold">{formatMoney(stats.paymentMethods.tarjeta)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-violet-600 transition-all duration-500"
                        style={{ width: `${stats.totalRevenue > 0 ? (stats.paymentMethods.tarjeta / stats.totalRevenue) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Transfer */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Transferencia Bancaria</span>
                      <span className="text-slate-800 font-bold">{formatMoney(stats.paymentMethods.transferencia)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${stats.totalRevenue > 0 ? (stats.paymentMethods.transferencia / stats.totalRevenue) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5 mt-2 text-[11px] text-slate-500 font-medium">
                  <Users size={14} className="text-violet-500 shrink-0 mt-0.5" />
                  <span>
                    El total de clientes registrados y activos listos para asociar a facturación asciende a <strong>{stats.activeClientsCount} clientes</strong>.
                  </span>
                </div>
              </div>

              {/* Ranking of Top 5 Selling items */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4 lg:col-span-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm font-sans">Prendas Más Vendidas</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Top 5 de indumentaria con mayor rotación en el local.</p>
                </div>

                {stats.topProducts.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center p-8 text-slate-400 text-xs font-medium">
                    No hay registros de prendas vendidas aún. Las ventas se reflejarán aquí al instante.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5 mt-2">
                    {stats.topProducts.map((p, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between gap-4 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 rounded-2xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank badge */}
                          <span className="h-6 w-6 rounded-full bg-violet-100 text-violet-700 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          
                          {/* Thumbnail */}
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 flex items-center justify-center shrink-0">
                            {p.imagen_url ? (
                              <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag size={14} className="text-slate-350" />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-slate-800 truncate">{p.nombre}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">SKU: {p.sku} | Unitario: {formatMoney(p.precio)}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="bg-violet-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {p.cantVendida} unidades
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VENDEDOR DASHBOARD VIEW                                                  */
          /* ========================================================================= */
          <div className="flex flex-col gap-6">
            {/* Cash register shift status notification */}
            <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
              cajaActiva
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              <div className="flex items-start gap-3">
                {cajaActiva ? (
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                ) : (
                  <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    Caja Diaria: {cajaActiva ? 'Abierta y Activa' : 'Cerrada'}
                  </h4>
                  <p className={`text-xs mt-0.5 font-medium ${cajaActiva ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {cajaActiva
                      ? `Puedes facturar en el POS. Turno iniciado a las ${new Date(cajaActiva.fecha_apertura).toLocaleTimeString('es-AR')}.`
                      : 'Debe iniciar la apertura de caja diaria antes de poder registrar transacciones.'}
                  </p>
                </div>
              </div>
              <Link
                to="/caja"
                className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                  cajaActiva
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                }`}
              >
                {cajaActiva ? 'Verificar Caja' : 'Abrir Caja Ahora'}
              </Link>
            </div>

            {/* Quick Actions Grid for sellers */}
            <div>
              <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-3.5">Panel de Operaciones</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. POS */}
                <Link
                  to="/ventas"
                  className="bg-white hover:border-violet-300 border border-slate-100 shadow-xs hover:shadow-md rounded-3xl p-6 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shrink-0">
                      <ShoppingCart size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">Punto de Venta (POS)</span>
                      <span className="text-xs text-slate-450 mt-0.5">Cobrar prendas y aplicar descuentos</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* 2. Caja */}
                <Link
                  to="/caja"
                  className="bg-white hover:border-violet-300 border border-slate-100 shadow-xs hover:shadow-md rounded-3xl p-6 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shrink-0">
                      <Banknote size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">Control de Caja</span>
                      <span className="text-xs text-slate-450 mt-0.5">Aperturas, egresos manuales y arqueos</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* 3. Stock */}
                <Link
                  to="/stock"
                  className="bg-white hover:border-violet-300 border border-slate-100 shadow-xs hover:shadow-md rounded-3xl p-6 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shrink-0">
                      <ShoppingBag size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">Control de Stock</span>
                      <span className="text-xs text-slate-450 mt-0.5">Consultar prendas disponibles y mínimo</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* 4. Clientes */}
                <Link
                  to="/clientes"
                  className="bg-white hover:border-violet-300 border border-slate-100 shadow-xs hover:shadow-md rounded-3xl p-6 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shrink-0">
                      <Users size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">Clientes</span>
                      <span className="text-xs text-slate-450 mt-0.5">Registrar clientes y talles habituales</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
