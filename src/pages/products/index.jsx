import React, { useState, useEffect } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { ProductList } from './ProductList'
import { ProductForm } from './ProductForm'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Plus, Search, RefreshCw, AlertCircle, LayoutGrid, Table as TableIcon } from 'lucide-react'

export default function ProductsAdmin() {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [seasonFilter, setSeasonFilter] = useState('todas')
  const [statusFilter, setStatusFilter] = useState('activos') // activos, inactivos, todos

  // Configuración de vista
  const [viewMode, setViewMode] = useState('grid') // grid, table

  // Modal
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setProducts(data || [])
    } catch (err) {
      console.error('Error al cargar productos:', err.message)
      setError('No se pudieron obtener los productos de la base de datos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleToggleActive = async (product) => {
    setError(null)
    const nuevoEstado = !product.activo
    try {
      const { error: updateError } = await supabase
        .from('productos')
        .update({ activo: nuevoEstado })
        .eq('id', product.id)

      if (updateError) throw updateError

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, activo: nuevoEstado } : p))
      )
    } catch (err) {
      console.error('Error al actualizar estado del producto:', err.message)
      setError(`No se pudo ${nuevoEstado ? 'activar' : 'desactivar'} el producto.`)
    }
  }

  const handleOpenCreate = () => {
    setSelectedProduct(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (product) => {
    setSelectedProduct(product)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    fetchProducts()
  }

  // Obtener categorías y temporadas dinámicas de los productos cargados
  const categorias = ['todas', ...new Set(products.map((p) => p.categoria).filter(Boolean))]
  const temporadas = ['todas', ...new Set(products.map((p) => p.temporada).filter(Boolean))]

  // Filtrado dinámico en frontend
  const filteredProducts = products.filter((p) => {
    const searchString = `${p.nombre} ${p.sku} ${p.color || ''} ${p.talle || ''}`.toLowerCase()
    const matchesSearch = searchString.includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'todas' || p.categoria === categoryFilter
    const matchesSeason = seasonFilter === 'todas' || p.temporada === seasonFilter
    
    let matchesStatus = true
    if (statusFilter === 'activos') {
      matchesStatus = p.activo
    } else if (statusFilter === 'inactivos') {
      matchesStatus = !p.activo
    }

    return matchesSearch && matchesCategory && matchesSeason && matchesStatus
  })

  return (
    PageLayout && (
      <PageLayout>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Catálogo de Prendas</h2>
              <p className="text-slate-400 text-sm mt-0.5">Administre y consulte la lista de indumentaria y precios</p>
            </div>
            {isAdmin && (
              <Button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-5 py-2.5"
              >
                <Plus size={18} />
                <span>Nueva Prenda</span>
              </Button>
            )}
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
            {/* Fila 1: Buscador y Modo de Vista */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Buscador */}
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, SKU, color o talle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-700 placeholder-slate-400 transition-all text-sm h-[46px]"
                />
              </div>

              {/* Botón de alternancia de vista */}
              <div className="flex bg-slate-50 p-1 border border-slate-100 rounded-xl shrink-0 w-full md:w-auto justify-center">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                    viewMode === 'grid' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-655'
                  }`}
                >
                  <LayoutGrid size={16} />
                  <span className="hidden sm:inline">Catálogo</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                    viewMode === 'table' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-655'
                  }`}
                >
                  <TableIcon size={16} />
                  <span className="hidden sm:inline">Tabla</span>
                </button>
              </div>
            </div>

            {/* Fila 2: Categoría, Temporada, Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Categorías */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Categoría</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 focus:outline-none text-xs font-medium h-[40px] capitalize"
                >
                  {categorias.map((c) => (
                    <option key={c} value={c}>{c === 'todas' ? 'Todas las Categorías' : c}</option>
                  ))}
                </select>
              </div>

              {/* Temporadas */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Temporada</span>
                <select
                  value={seasonFilter}
                  onChange={(e) => setSeasonFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 focus:outline-none text-xs font-medium h-[40px]"
                >
                  {temporadas.map((t) => (
                    <option key={t} value={t}>{t === 'todas' ? 'Todas las Temporadas' : t}</option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div className="flex flex-col gap-1 relative">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Estado comercial</span>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 focus:outline-none text-xs font-medium h-[40px]"
                  >
                    <option value="activos">Mostrar Activos</option>
                    <option value="inactivos">Mostrar Inactivos</option>
                    <option value="todos">Mostrar Todos</option>
                  </select>
                  <button
                    onClick={fetchProducts}
                    className="p-2.5 rounded-xl border border-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                    title="Actualizar catálogo"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium">
              <AlertCircle className="shrink-0 text-rose-500" size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Catalog / Grid List */}
          <ProductList
            products={filteredProducts}
            loading={loading}
            viewMode={viewMode}
            onToggleActive={handleToggleActive}
            onEdit={handleOpenEdit}
          />

          {/* Modal Form */}
          <Modal
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            title={selectedProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
            size="lg"
          >
            <ProductForm
              product={selectedProduct}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </Modal>
        </div>
      </PageLayout>
    )
  )
}
