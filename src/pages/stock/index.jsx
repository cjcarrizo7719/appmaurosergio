import React, { useState, useEffect } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { StockList } from './StockList'
import { StockForm } from './StockForm'
import { StockHistory } from './StockHistory'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { SlidersHorizontal, Search, RefreshCw, AlertCircle, History, PackageOpen, AlertTriangle } from 'lucide-react'

export default function StockAdmin() {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState('todos') // todos, critico, suficiente
  
  // Selección y modal
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('productos')
        .select('id, sku, nombre, talle, color, stock_actual, stock_minimo, activo')
        .eq('activo', true) // Solo prendas activas para stock
        .order('nombre', { ascending: true })

      if (fetchError) throw fetchError
      
      const prevList = data || []
      setProducts(prevList)

      // Re-seleccionar el producto editado para refrescar el panel lateral
      if (selectedProduct) {
        const updated = prevList.find(p => p.id === selectedProduct.id)
        if (updated) setSelectedProduct(updated)
      }
    } catch (err) {
      console.error('Error al cargar stock:', err.message)
      setError('No se pudo obtener el inventario de stock.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleOpenForm = () => {
    if (!selectedProduct) return
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    fetchProducts()
  }

  // Filtrado dinámico local
  const filteredProducts = products.filter((p) => {
    const searchString = `${p.nombre} ${p.sku}`.toLowerCase()
    const matchesSearch = searchString.includes(searchTerm.toLowerCase())
    
    const isCritical = p.stock_actual <= p.stock_minimo
    if (stockFilter === 'critico') {
      return matchesSearch && isCritical
    } else if (stockFilter === 'suficiente') {
      return matchesSearch && !isCritical
    }
    return matchesSearch
  })

  // Contadores rápidos para KPIs
  const criticalCount = products.filter(p => p.stock_actual <= p.stock_minimo).length

  return (
    <PageLayout>
      <div className="flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Control de Inventario (Stock)</h2>
            <p className="text-slate-400 text-sm mt-0.5">Gestione y audite el stock y las alertas de reposición</p>
          </div>
          {isAdmin && (
            <Button
              onClick={handleOpenForm}
              disabled={!selectedProduct}
              className="flex items-center gap-2 px-5 py-2.5"
              title={selectedProduct ? 'Registrar movimiento' : 'Seleccione un producto primero'}
            >
              <SlidersHorizontal size={18} />
              <span>Registrar Movimiento</span>
            </Button>
          )}
        </div>

        {/* KPIs Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Productos en Catálogo</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{products.length}</p>
            </div>
            <div className="p-3 bg-violet-50 text-violet-500 rounded-xl">
              <PackageOpen size={20} />
            </div>
          </div>
          
          <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-colors ${
            criticalCount > 0 ? 'bg-rose-50/20 border-rose-100' : 'bg-white border-slate-100'
          }`}>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Crítico (Bajo Mínimo)</p>
              <p className={`text-2xl font-bold mt-1 ${criticalCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {criticalCount}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${
              criticalCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'
            }`}>
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
          {/* Buscar */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar prenda por nombre o código SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-700 placeholder-slate-400 transition-all text-sm h-[44px]"
            />
          </div>

          {/* Filtro de stock */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full md:w-48 px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-655 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm h-[44px]"
            >
              <option value="todos">Todos los Productos</option>
              <option value="critico">⚠️ Stock Crítico (Bajo Mínimo)</option>
              <option value="suficiente">✅ Stock Suficiente</option>
            </select>

            <button
              onClick={fetchProducts}
              className="p-2.5 rounded-xl border border-slate-100 text-slate-500 hover:text-slate-750 hover:bg-slate-50 transition-colors"
              title="Refrescar inventario"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium">
            <AlertCircle className="shrink-0 text-rose-500" size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Main Split Layout: List and Audit History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left panel: List */}
          <div className="lg:col-span-2">
            <StockList
              products={filteredProducts}
              loading={loading}
              selectedProductId={selectedProduct?.id}
              onSelectProduct={setSelectedProduct}
            />
          </div>

          {/* Right panel: History Audit */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <StockHistory productId={selectedProduct?.id} />
          </div>
        </div>

        {/* Modal Form */}
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title="Registrar Movimiento de Stock"
          size="md"
        >
          <StockForm
            selectedProduct={selectedProduct}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </Modal>
      </div>
    </PageLayout>
  )
}
