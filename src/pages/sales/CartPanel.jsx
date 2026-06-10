import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Minus, Trash2, User, Percent, DollarSign, Wallet, Loader2 } from 'lucide-react'

export const CartPanel = ({
  cart,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
  loadingCheckout
}) => {
  const [clients, setClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [discountType, setDiscountType] = useState('percent') // 'percent' or 'fixed'
  const [discountValue, setDiscountValue] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('efectivo') // 'efectivo', 'tarjeta', 'transferencia'
  const [error, setError] = useState(null)

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('id, nombre, apellido, talle_habitual')
          .eq('activo', true)
          .order('apellido', { ascending: true })

        if (error) throw error
        setClients(data || [])
      } catch (err) {
        console.error('Error al cargar clientes:', err)
      }
    }
    fetchClients()
  }, [])

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  // Filter clients by search term
  const filteredClients = clients.filter(c =>
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Math calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.producto.precio_venta * item.cantidad), 0)

  // Calculate discount amount
  let discountAmount = 0
  if (discountType === 'percent') {
    discountAmount = (subtotal * (Number(discountValue) || 0)) / 100
  } else {
    discountAmount = Number(discountValue) || 0
  }

  // Cap discount amount to subtotal
  if (discountAmount > subtotal) {
    discountAmount = subtotal
  }

  const total = subtotal - discountAmount

  const handleCheckoutSubmit = () => {
    if (cart.length === 0) {
      setError('El carrito está vacío.')
      return
    }
    setError(null)
    onCheckout({
      cliente_id: selectedClient ? selectedClient.id : null,
      cliente: selectedClient,
      total: Number(total.toFixed(2)),
      descuento: Number(discountAmount.toFixed(2)),
      metodo_pago: paymentMethod,
      items: cart.map(item => ({
        producto_id: item.producto.id,
        producto: item.producto,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio_venta
      }))
    })
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <span>Resumen de Cobro</span>
          <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full font-bold">
            {cart.reduce((sum, item) => sum + item.cantidad, 0)} prendas
          </span>
        </h3>
        {cart.length > 0 && (
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Punto de Venta</span>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 gap-3">
            <div className="h-12 w-12 bg-slate-50 text-slate-350 rounded-full flex items-center justify-center border border-slate-100">
              <Trash2 size={20} />
            </div>
            <p className="text-slate-400 text-sm font-medium">El carrito de compras está vacío.</p>
            <p className="text-[11px] text-slate-400">Haz clic en las prendas del catálogo para agregarlas.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.producto.id}
              className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors bg-white shadow-xs"
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold text-slate-800 text-xs truncate" title={item.producto.nombre}>
                  {item.producto.nombre}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  SKU: {item.producto.sku} | Talle: {item.producto.talle || '-'}
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1">
                  {formatMoney(item.producto.precio_venta)} c/u
                </span>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => onUpdateQty(item.producto.id, item.cantidad - 1)}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-700">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.producto.id, item.cantidad + 1)}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(item.producto.id)}
                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-50/50 transition-colors"
                  title="Quitar del carrito"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout Controls */}
      <div className="border-t border-slate-100 p-6 bg-slate-50/70 flex flex-col gap-4 shrink-0">
        {/* Client Selection */}
        <div className="relative">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
            Cliente
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={15} />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowDropdown(true)
                  if (!e.target.value) setSelectedClient(null)
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-400"
              />
              {selectedClient && (
                <button
                  onClick={() => {
                    setSelectedClient(null)
                    setSearchTerm('')
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-500 hover:underline"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchTerm && (
            <div className="absolute bottom-full mb-1 left-0 right-0 max-h-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-y-auto divide-y divide-slate-50">
              {filteredClients.length === 0 ? (
                <div className="p-3.5 text-center text-slate-400 text-xs">
                  No se encontraron clientes activos
                </div>
              ) : (
                filteredClients.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedClient(c)
                      setSearchTerm(`${c.nombre} ${c.apellido}`)
                      setShowDropdown(false)
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex flex-col gap-0.5"
                  >
                    <span className="text-xs font-bold text-slate-700">{c.nombre} {c.apellido}</span>
                    {c.talle_habitual && (
                      <span className="text-[10px] text-slate-400">Talle habitual: {c.talle_habitual}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Discount Section */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Tipo Descuento
            </label>
            <div className="flex bg-white border border-slate-200 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  setDiscountType('percent')
                  setDiscountValue(0)
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  discountType === 'percent'
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-slate-500 hover:text-slate-750'
                }`}
              >
                <Percent size={12} />
                Porcentaje
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountType('fixed')
                  setDiscountValue(0)
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  discountType === 'fixed'
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-slate-500 hover:text-slate-750'
                }`}
              >
                <DollarSign size={12} />
                Fijo ($)
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Valor Descuento
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                {discountType === 'percent' ? <Percent size={12} /> : <DollarSign size={12} />}
              </div>
              <input
                type="number"
                min="0"
                max={discountType === 'percent' ? '100' : subtotal.toString()}
                value={discountValue || ''}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value))
                  setDiscountValue(val)
                }}
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
            Medio de Pago
          </label>
          <div className="grid grid-cols-3 gap-2 bg-white border border-slate-200 rounded-xl p-1">
            {['efectivo', 'tarjeta', 'transferencia'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === method
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-750 hover:bg-slate-50'
                }`}
              >
                <Wallet size={12} />
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Calculation Table */}
        <div className="border-t border-slate-200/60 pt-3 flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatMoney(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-rose-500 font-medium">
              <span>Descuento:</span>
              <span>-{formatMoney(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-2 text-sm">
            <span>TOTAL:</span>
            <span className="text-slate-900 text-lg leading-none">{formatMoney(total)}</span>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[11px] font-medium">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleCheckoutSubmit}
          disabled={cart.length === 0 || loadingCheckout}
          className="w-full py-3.5 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-600/10 hover:shadow-violet-600/25 active:scale-[0.98]"
        >
          {loadingCheckout ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Procesando venta...
            </>
          ) : (
            <>
              Confirmar y Cobrar ({formatMoney(total)})
            </>
          )}
        </button>
      </div>
    </div>
  )
}
