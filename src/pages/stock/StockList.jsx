import React from 'react'
import { Badge } from '../../components/ui/Badge'
import { AlertTriangle, CheckCircle, Package } from 'lucide-react'

export const StockList = ({
  products,
  loading,
  selectedProductId,
  onSelectProduct
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">Obteniendo inventario de stock...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
        <p className="text-slate-400 font-medium">No se encontraron prendas con los filtros de stock seleccionados.</p>
      </div>
    )
  }

  return (
    <>
      {/* Vista de Tabla (Escritorio) */}
      <div className="hidden lg:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4.5">Prenda</th>
              <th className="px-6 py-4.5">SKU</th>
              <th className="px-6 py-4.5">Talle/Color</th>
              <th className="px-6 py-4.5 text-center">Mínimo</th>
              <th className="px-6 py-4.5 text-center">Disponible</th>
              <th className="px-6 py-4.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm text-slate-705">
            {products.map((p) => {
              const isSelected = p.id === selectedProductId
              const isCritical = p.stock_actual <= p.stock_minimo
              
              return (
                <tr
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-violet-50/40 hover:bg-violet-50/60' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {/* Name */}
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {p.nombre}
                  </td>

                  {/* SKU */}
                  <td className="px-6 py-4 text-slate-500">{p.sku}</td>

                  {/* Talle/Color */}
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">
                    <span className="bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-100/50 mr-1.5">{p.talle}</span>
                    <span className="bg-sky-55/10 text-sky-700 px-2 py-0.5 rounded-lg border border-sky-100">{p.color}</span>
                  </td>

                  {/* Stock Minimo */}
                  <td className="px-6 py-4 text-center text-slate-500">{p.stock_minimo}</td>

                  {/* Stock Actual */}
                  <td className="px-6 py-4 text-center font-bold text-slate-800">
                    <span className={isCritical ? 'text-rose-600' : 'text-slate-800'}>
                      {p.stock_actual}
                    </span>
                  </td>

                  {/* Estado Badge */}
                  <td className="px-6 py-4">
                    {isCritical ? (
                      <Badge variant="danger" className="flex items-center gap-1 w-fit">
                        <AlertTriangle size={11} />
                        <span>Crítico</span>
                      </Badge>
                    ) : (
                      <Badge variant="success" className="flex items-center gap-1 w-fit">
                        <CheckCircle size={11} />
                        <span>Suficiente</span>
                      </Badge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Vista de Tarjetas (Móvil) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {products.map((p) => {
          const isSelected = p.id === selectedProductId
          const isCritical = p.stock_actual <= p.stock_minimo

          return (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className={`p-5 rounded-2xl border transition-all shadow-sm flex flex-col gap-3 relative cursor-pointer ${
                isSelected
                  ? 'border-violet-300 bg-violet-50/15 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">{p.nombre}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">SKU: {p.sku}</p>
                </div>
                {isCritical ? (
                  <Badge variant="danger" className="flex items-center gap-1">
                    <AlertTriangle size={10} />
                    <span>Crítico</span>
                  </Badge>
                ) : (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle size={10} />
                    <span>Suficiente</span>
                  </Badge>
                )}
              </div>

              {/* Talle/Color */}
              <div className="flex gap-2 text-xs">
                <span className="text-slate-400 font-medium">Especificación:</span>
                <span className="font-semibold text-slate-655">{p.talle} / {p.color}</span>
              </div>

              {/* Conteo de stock */}
              <div className="flex justify-between items-center border-t border-slate-50 pt-3 mt-1">
                <div className="text-xs text-slate-400 font-medium">
                  Mínimo requerido: <span className="font-bold text-slate-600">{p.stock_minimo}</span>
                </div>
                <div className="text-sm font-bold flex items-center gap-1">
                  <Package size={14} className="text-slate-400" />
                  <span className={isCritical ? 'text-rose-600' : 'text-slate-800'}>
                    {p.stock_actual} disp.
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
