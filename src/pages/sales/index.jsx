import React, { useState, useEffect } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { ProductSelect } from './ProductSelect'
import { CartPanel } from './CartPanel'
import { ReceiptModal } from './ReceiptModal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCaja } from '../../context/CajaContext'
import { ShoppingBag, AlertCircle, Loader2 } from 'lucide-react'

export default function SalesAdmin() {
  const { user, profile } = useAuth()
  const { cajaActiva, loading: loadingCaja } = useCaja()
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [cart, setCart] = useState([])
  
  // Checkout & Receipt States
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)
  const [completedSale, setCompletedSale] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Fetch active products on mount
  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error al cargar productos para POS:', err)
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Cart operations
  const handleSelectProduct = (product) => {
    const existing = cart.find(item => item.producto.id === product.id)
    const currentQty = existing ? existing.cantidad : 0

    if (currentQty >= product.stock_actual) {
      alert(`No se puede agregar más. Stock máximo alcanzado (${product.stock_actual} unidades).`)
      return
    }

    if (existing) {
      setCart(
        cart.map(item =>
          item.producto.id === product.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      )
    } else {
      setCart([...cart, { producto: product, cantidad: 1 }])
    }
  }

  const handleUpdateQty = (productId, newQty) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    if (newQty <= 0) {
      handleRemoveItem(productId)
      return
    }

    if (newQty > product.stock_actual) {
      alert(`Stock insuficiente. El stock disponible es de ${product.stock_actual} unidades.`)
      return
    }

    setCart(
      cart.map(item =>
        item.producto.id === productId ? { ...item, cantidad: newQty } : item
      )
    )
  }

  const handleRemoveItem = (productId) => {
    setCart(cart.filter(item => item.producto.id !== productId))
  }

  const handleCheckout = async (checkoutData) => {
    try {
      setLoadingCheckout(true)
      setCheckoutError(null)

      // Invoke the RPC registrar_venta
      const { data: saleId, error } = await supabase.rpc('registrar_venta', {
        p_cliente_id: checkoutData.cliente_id,
        p_total: checkoutData.total,
        p_descuento: checkoutData.descuento,
        p_metodo_pago: checkoutData.metodo_pago,
        p_items: checkoutData.items.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario
        }))
      })

      if (error) throw error

      // Construct a detailed sale object for the print modal
      const saleReceipt = {
        id: saleId,
        created_at: new Date().toISOString(),
        cliente: checkoutData.cliente,
        total: checkoutData.total,
        descuento: checkoutData.descuento,
        metodo_pago: checkoutData.metodo_pago,
        creado_por_nombre: profile?.nombre || 'Vendedor',
        creado_por_apellido: profile?.apellido || '',
        items: checkoutData.items
      }

      setCompletedSale(saleReceipt)
      setShowReceiptModal(true)
      setCart([]) // Clear cart
      
      // Reload products to get updated stock counts
      await loadProducts()
    } catch (err) {
      console.error('Error al realizar el cobro:', err)
      setCheckoutError(err.message || 'Ocurrió un error inesperado al procesar la venta.')
    } finally {
      setLoadingCheckout(false)
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-col gap-6 h-[calc(100vh-120px)]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <ShoppingBag className="text-violet-600" size={26} />
              Punto de Venta (POS)
            </h1>
            <p className="text-slate-500 text-sm font-medium">Registrar ventas, cobros y actualizar inventario en tiempo real.</p>
          </div>
        </div>

        {/* Main Content Layout */}
        {loadingCaja ? (
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-violet-500" />
            <span className="text-slate-400 text-xs font-semibold animate-pulse">Comprobando estado de caja...</span>
          </div>
        ) : !cajaActiva ? (
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto my-12 shrink-0">
            <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center border border-rose-100 shadow-xs">
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Caja Cerrada</h3>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-semibold">
                No se pueden registrar ventas si no hay un turno de caja activo. Por favor, inicie la apertura de caja diaria antes de operar el Punto de Venta.
              </p>
            </div>
            <a
              href="/caja"
              className="mt-2 px-6 py-3.5 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl font-bold text-xs shadow-md shadow-violet-600/10 transition-all active:scale-[0.98]"
            >
              Ir a Control de Caja
            </a>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
            {/* Left Panel: Catalog Selector */}
            <div className="flex-1 min-w-0 h-full overflow-hidden">
              <ProductSelect
                products={products}
                loading={loadingProducts}
                cart={cart}
                onSelectProduct={handleSelectProduct}
              />
            </div>

            {/* Right Panel: Cart Summary & Checkout */}
            <div className="w-full lg:w-[380px] shrink-0 h-full overflow-hidden">
              <CartPanel
                cart={cart}
                onUpdateQty={handleUpdateQty}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
                loadingCheckout={loadingCheckout}
              />
            </div>
          </div>
        )}

        {/* Global checkout errors display */}
        {checkoutError && (
          <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl flex items-center gap-3 text-xs font-semibold shrink-0">
            <AlertCircle size={16} />
            <span>Error en el cobro: {checkoutError}</span>
          </div>
        )}

        {/* Receipt / Invoice Print Modal */}
        {completedSale && (
          <ReceiptModal
            isOpen={showReceiptModal}
            onClose={() => {
              setShowReceiptModal(false)
              setCompletedSale(null)
            }}
            venta={completedSale}
          />
        )}
      </div>
    </PageLayout>
  )
}
