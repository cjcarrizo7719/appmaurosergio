import React, { useRef } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Printer, CheckCircle2, ShoppingBag } from 'lucide-react'

export const ReceiptModal = ({ isOpen, onClose, venta }) => {
  const printAreaRef = useRef()

  if (!venta) return null

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  // Calculate subtotals and discounts
  const subtotalBeforeDiscount = (venta.items || []).reduce(
    (acc, item) => acc + (item.cantidad * item.precio_unitario),
    0
  )

  const cashierName = venta.creado_por_nombre
    ? `${venta.creado_por_nombre} ${venta.creado_por_apellido || ''}`.trim()
    : 'Vendedor Autenticado'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Venta Realizada con Éxito" size="md">
      <style>{`
        @media print {
          /* Hide everything except the ticket */
          body * {
            visibility: hidden;
            background: transparent !important;
          }
          #print-receipt-container, #print-receipt-container * {
            visibility: visible;
          }
          #print-receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 4mm 2mm;
            margin: 0;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Remove header/footer in print */
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>

      <div className="flex flex-col items-center gap-6 py-2">
        {/* Success Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100">
            <CheckCircle2 size={28} className="animate-bounce" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">¡Cobro Registrado!</h2>
          <p className="text-slate-500 text-xs">La venta ha sido guardada y el stock fue actualizado.</p>
        </div>

        {/* Thermal Ticket Representation */}
        <div 
          ref={printAreaRef}
          id="print-receipt-container"
          className="w-full max-w-[340px] bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 font-mono text-xs text-slate-700 shadow-inner flex flex-col gap-4 relative overflow-hidden"
        >
          {/* Top Decorative Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>

          {/* Franchise Header */}
          <div className="text-center flex flex-col items-center gap-1 border-b border-dashed border-slate-200 pb-3">
            <span className="font-bold text-sm tracking-wider text-slate-900">MAURO SERGIO</span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400">Franquicia Oficial</span>
            <span className="text-[9px] text-slate-400 mt-1">Ticket de Venta No Fiscal</span>
          </div>

          {/* Ticket Information */}
          <div className="flex flex-col gap-1 text-[10px] border-b border-dashed border-slate-200 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-400">NRO VENTA:</span>
              <span className="font-bold text-slate-800">#{venta.id ? venta.id.substring(0, 8).toUpperCase() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">FECHA:</span>
              <span className="font-bold text-slate-800">{formatDate(venta.created_at || new Date().toISOString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CAJERO:</span>
              <span className="font-bold text-slate-800 uppercase">{cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CLIENTE:</span>
              <span className="font-bold text-slate-800 uppercase">
                {venta.cliente 
                  ? `${venta.cliente.nombre} ${venta.cliente.apellido}`.trim() 
                  : 'Consumidor Final'}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex flex-col gap-2 border-b border-dashed border-slate-200 pb-3">
            <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 pb-1 text-[10px]">
              <span>DESCRIPCIÓN</span>
              <span className="text-right">SUBTOTAL</span>
            </div>
            {(venta.items || []).map((item, idx) => (
              <div key={idx} className="flex flex-col gap-0.5">
                <div className="flex justify-between text-slate-800">
                  <span className="truncate max-w-[190px]">{item.producto?.nombre || 'Producto'}</span>
                  <span>{formatMoney(item.cantidad * item.precio_unitario)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>
                    SKU: {item.producto?.sku} | Talle: {item.producto?.talle || '-'} | Color: {item.producto?.color || '-'}
                  </span>
                  <span>
                    {item.cantidad} x {formatMoney(item.precio_unitario)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary / Totals */}
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>{formatMoney(subtotalBeforeDiscount)}</span>
            </div>
            {venta.descuento > 0 && (
              <div className="flex justify-between text-rose-500 font-medium">
                <span>Descuento aplicado:</span>
                <span>-{formatMoney(venta.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-800 font-bold border-t border-dashed border-slate-200 pt-2 text-sm">
              <span>TOTAL NETO:</span>
              <span className="text-slate-900">{formatMoney(venta.total)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>MEDIO DE PAGO:</span>
              <span className="font-bold text-slate-700 uppercase">{venta.metodo_pago}</span>
            </div>
          </div>

          {/* Footer message */}
          <div className="text-center text-[9px] text-slate-400 border-t border-dashed border-slate-200 pt-3 flex flex-col gap-0.5">
            <span className="font-bold">¡GRACIAS POR SU COMPRA!</span>
            <span>No se aceptan devoluciones sin este ticket.</span>
            <span>Cambios dentro de los 30 días.</span>
          </div>
        </div>

        {/* Buttons Control */}
        <div className="flex w-full gap-3 mt-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Printer size={18} />
            Imprimir Ticket
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl border border-slate-200 flex items-center justify-center transition-all active:scale-[0.98]"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </Modal>
  )
}
