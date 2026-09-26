import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, SlidersHorizontal, X, ShoppingBag, Loader2, AlertCircle, Tag, Thermometer, Ruler } from 'lucide-react'

const formatMoney = (amount) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)

const SEASON_COLORS = {
  Invierno: 'bg-blue-100 text-blue-700',
  Verano: 'bg-amber-100 text-amber-700',
  Otoño: 'bg-orange-100 text-orange-700',
  Primavera: 'bg-emerald-100 text-emerald-700',
  Permanente: 'bg-slate-100 text-slate-600',
}

function ProductCard({ product }) {
  const seasonColor = SEASON_COLORS[product.temporada] || 'bg-slate-100 text-slate-600'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="aspect-square bg-slate-50 overflow-hidden relative">
        {product.imagen_url ? (
          <img
            src={product.imagen_url}
            alt={product.nombre}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
            <ShoppingBag size={40} strokeWidth={1.5} />
            <span className="text-xs font-medium">Sin foto</span>
          </div>
        )}
        {/* Season badge overlay */}
        {product.temporada && (
          <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${seasonColor}`}>
            {product.temporada}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.categoria}</p>
          <h3 className="font-bold text-slate-800 text-sm leading-snug mt-0.5 line-clamp-2">{product.nombre}</h3>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5">
          {product.talle && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
              Talle {product.talle}
            </span>
          )}
          {product.color && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100">
              {product.color}
            </span>
          )}
        </div>

        {product.descripcion && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{product.descripcion}</p>
        )}

        {/* Footer: SKU + Price */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
          <span className="text-[10px] font-mono text-slate-400">{product.sku}</span>
          <span className="text-base font-black text-slate-900">{formatMoney(product.precio_venta)}</span>
        </div>
      </div>
    </div>
  )
}

function FilterSelect({ label, icon: Icon, value, onChange, options, allLabel }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <Icon size={10} />
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 h-9 cursor-pointer"
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

export default function CatalogoPublico() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterTemporada, setFilterTemporada] = useState('')
  const [filterTalle, setFilterTalle] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await supabase
          .from('productos')
          .select('id, sku, nombre, categoria, descripcion, talle, color, temporada, precio_venta, imagen_url')
          .eq('activo', true)
          .order('nombre', { ascending: true })

        if (fetchError) throw fetchError
        setProducts(data || [])
      } catch (err) {
        setError('No se pudo cargar el catálogo. Intentá nuevamente.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Opciones de filtros generadas dinámicamente
  const categorias = useMemo(() => [...new Set(products.map((p) => p.categoria).filter(Boolean))].sort(), [products])
  const temporadas = useMemo(() => [...new Set(products.map((p) => p.temporada).filter(Boolean))].sort(), [products])
  const talles = useMemo(() => [...new Set(products.map((p) => p.talle).filter(Boolean))].sort(), [products])

  const activeFiltersCount = [filterCategoria, filterTemporada, filterTalle].filter(Boolean).length

  const clearFilters = () => {
    setFilterCategoria('')
    setFilterTemporada('')
    setFilterTalle('')
    setSearch('')
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const searchStr = `${p.nombre} ${p.sku} ${p.color || ''} ${p.descripcion || ''}`.toLowerCase()
      if (search && !searchStr.includes(search.toLowerCase())) return false
      if (filterCategoria && p.categoria !== filterCategoria) return false
      if (filterTemporada && p.temporada !== filterTemporada) return false
      if (filterTalle && p.talle !== filterTalle) return false
      return true
    })
  }, [products, search, filterCategoria, filterTemporada, filterTalle])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] font-bold text-violet-400 uppercase tracking-[0.25em]">Catálogo Oficial</span>
            <span className="text-xl font-black tracking-tight">MAURO SERGIO</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <ShoppingBag size={14} className="text-violet-400" />
            <span>{loading ? '...' : `${products.length} prendas disponibles`}</span>
          </div>
        </div>

        {/* Search bar in header */}
        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre, código o color..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-violet-700 rounded-full w-4 h-4 text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
                <FilterSelect
                  label="Categoría"
                  icon={Tag}
                  value={filterCategoria}
                  onChange={setFilterCategoria}
                  options={categorias}
                  allLabel="Todas las categorías"
                />
                <FilterSelect
                  label="Temporada"
                  icon={Thermometer}
                  value={filterTemporada}
                  onChange={setFilterTemporada}
                  options={temporadas}
                  allLabel="Todas las temporadas"
                />
                <FilterSelect
                  label="Talle"
                  icon={Ruler}
                  value={filterTalle}
                  onChange={setFilterTalle}
                  options={talles}
                  allLabel="Todos los talles"
                />
                {(activeFiltersCount > 0 || search) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors"
                  >
                    <X size={12} />
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <Loader2 size={36} className="animate-spin text-violet-500" />
            <p className="text-slate-400 text-sm font-semibold animate-pulse">Cargando colección...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertCircle size={28} className="text-rose-400" />
            </div>
            <div className="text-center">
              <p className="text-slate-700 font-bold text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs text-violet-600 font-bold hover:underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Results summary */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  {filterCategoria || filterTemporada || filterTalle || search
                    ? 'Resultados de búsqueda'
                    : 'Colección completa'}
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  {filtered.length === 0
                    ? 'Ninguna prenda coincide con los filtros aplicados.'
                    : `${filtered.length} ${filtered.length === 1 ? 'prenda encontrada' : 'prendas encontradas'}`}
                </p>
              </div>

              {/* Active filter chips */}
              {(filterCategoria || filterTemporada || filterTalle) && (
                <div className="hidden sm:flex flex-wrap gap-2">
                  {filterCategoria && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                      {filterCategoria}
                      <button onClick={() => setFilterCategoria('')}><X size={10} /></button>
                    </span>
                  )}
                  {filterTemporada && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                      {filterTemporada}
                      <button onClick={() => setFilterTemporada('')}><X size={10} /></button>
                    </span>
                  )}
                  {filterTalle && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                      Talle {filterTalle}
                      <button onClick={() => setFilterTalle('')}><X size={10} /></button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Product grid */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center">
                  <ShoppingBag size={32} className="text-slate-300" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-bold text-slate-600 text-sm">Sin resultados</p>
                  <p className="text-xs text-slate-400 mt-1">Probá cambiando los filtros o la búsqueda.</p>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs text-violet-600 font-bold hover:underline"
                >
                  Ver todas las prendas
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-900 text-slate-500 text-center py-6 mt-auto">
        <p className="text-xs font-semibold">
          © {new Date().getFullYear()} <span className="text-white font-bold">MAURO SERGIO</span> — Todos los derechos reservados.
        </p>
        <p className="text-[10px] mt-1">Los precios pueden variar sin previo aviso. Stock sujeto a disponibilidad.</p>
      </footer>
    </div>
  )
}
