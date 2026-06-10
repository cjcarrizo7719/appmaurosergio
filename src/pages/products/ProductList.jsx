import React from 'react'
import { Badge } from '../../components/ui/Badge'
import { Edit2, PowerOff, Power, LayoutGrid, Table as TableIcon, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const ProductList = ({
  products,
  loading,
  viewMode = 'grid',
  onToggleActive,
  onEdit
}) => {
  const { isAdmin } = useAuth()

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">Obteniendo catálogo de prendas...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
        <p className="text-slate-400 font-medium">No se encontraron productos en el catálogo con los filtros aplicados.</p>
      </div>
    )
  }

  return (
    <>
      {/* Vista de Cuadrícula (Catálogo / Tarjetas) */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-md ${
                !p.activo ? 'opacity-70' : ''
              }`}
            >
              {/* Product Image */}
              <div className="h-48 bg-slate-50 border-b border-slate-100/50 flex items-center justify-center relative overflow-hidden shrink-0">
                {p.imagen_url ? (
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-350">
                    <ImageIcon size={32} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Sin foto</span>
                  </div>
                )}
                {/* Season Badge */}
                {p.temporada && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="violet" className="text-[10px] px-2 py-0.5 shadow-sm bg-white/90 backdrop-blur-xs">
                      {p.temporada}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.categoria}</span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{p.sku}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 mt-2 line-clamp-2 leading-snug group-hover:text-violet-600 transition-colors" title={p.nombre}>
                    {p.nombre}
                  </h3>
                  {p.descripcion && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.descripcion}</p>
                  )}
                  {/* Size and Color badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.talle && <Badge variant="neutral" className="text-[10px] lowercase first-letter:uppercase">Talle {p.talle}</Badge>}
                    {p.color && <Badge variant="info" className="text-[10px]">{p.color}</Badge>}
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="border-t border-slate-50/60 pt-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Precio Venta</span>
                    <span className="text-lg font-bold text-slate-800 leading-none mt-0.5">{formatMoney(p.precio_venta)}</span>
                    {isAdmin && (
                      <span className="text-[10px] text-slate-400 font-medium mt-1">Costo: {formatMoney(p.precio_costo)}</span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => onEdit(p)}
                        className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Editar producto"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onToggleActive(p)}
                        className={`p-2 rounded-xl border transition-colors ${
                          p.activo
                            ? 'border-rose-100 bg-rose-50/50 text-rose-500 hover:bg-rose-50'
                            : 'border-emerald-100 bg-emerald-50/50 text-emerald-500 hover:bg-emerald-50'
                        }`}
                        title={p.activo ? 'Desactivar producto' : 'Activar producto'}
                      >
                        {p.activo ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista de Tabla (Escritorio / Compacto) */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4.5">Prenda</th>
                <th className="px-6 py-4.5">SKU</th>
                <th className="px-6 py-4.5">Talle / Color</th>
                <th className="px-6 py-4.5 text-right">Precio Venta</th>
                {isAdmin && <th className="px-6 py-4.5 text-right">Precio Costo</th>}
                <th className="px-6 py-4.5">Estado</th>
                {isAdmin && <th className="px-6 py-4.5 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        {p.imagen_url ? (
                          <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={16} className="text-slate-350" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{p.nombre}</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">{p.categoria} {p.temporada && `| ${p.temporada}`}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-500">{p.sku}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {p.talle ? <Badge variant="neutral">{p.talle}</Badge> : '-'}
                      {p.color ? <Badge variant="info">{p.color}</Badge> : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">{formatMoney(p.precio_venta)}</td>
                  {isAdmin && <td className="px-6 py-4 text-right text-slate-500">{formatMoney(p.precio_costo)}</td>}
                  <td className="px-6 py-4">
                    <Badge variant={p.activo ? 'success' : 'danger'}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => onEdit(p)}
                        className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all inline-flex"
                        title="Editar prenda"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => onToggleActive(p)}
                        className={`p-1.5 rounded-lg border transition-all inline-flex ${
                          p.activo
                            ? 'border-rose-100 bg-rose-50/50 text-rose-500 hover:bg-rose-50'
                            : 'border-emerald-100 bg-emerald-50/50 text-emerald-500 hover:bg-emerald-50'
                        }`}
                        title={p.activo ? 'Desactivar prenda' : 'Activar prenda'}
                      >
                        {p.activo ? <PowerOff size={15} /> : <Power size={15} />}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
