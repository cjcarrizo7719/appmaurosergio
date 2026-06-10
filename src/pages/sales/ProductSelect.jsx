import React, { useState } from 'react'
import { Search, Image as ImageIcon, SlidersHorizontal, EyeOff } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'

export const ProductSelect = ({
  products,
  loading,
  cart,
  onSelectProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  // Categories list extractor
  const categories = Array.from(new Set(products.map(p => p.categoria))).filter(Boolean)

  // Get quantity of a product currently in the cart
  const getCartQty = (productId) => {
    const cartItem = cart.find(item => item.producto.id === productId)
    return cartItem ? cartItem.cantidad : 0
  }

  // Filter products based on search term and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory ? p.categoria === selectedCategory : true

    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm shrink-0">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Buscar por SKU o nombre de prenda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Category Dropdown */}
        <div className="relative w-full sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <SlidersHorizontal size={14} />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500/20 outline-none transition-all text-slate-655 appearance-none cursor-pointer"
          >
            <option value="">Todas las Categorías</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
          {/* Custom chevron indicator */}
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-[10px]">
            ▼
          </div>
        </div>
      </div>

      {/* Grid of Product Cards */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
            <p className="text-slate-400 text-xs font-semibold animate-pulse">Cargando catálogo para facturación...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <p className="text-slate-400 font-medium">No se encontraron prendas con stock disponible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              const cartQty = getCartQty(p.id)
              const remainingStock = p.stock_actual - cartQty
              const isOutOfStock = remainingStock <= 0

              return (
                <button
                  key={p.id}
                  disabled={isOutOfStock}
                  onClick={() => onSelectProduct(p)}
                  className={`bg-white text-left rounded-2xl border border-slate-100 p-3 shadow-xs hover:shadow-md hover:border-violet-200 transition-all flex gap-3 relative group ${
                    isOutOfStock 
                      ? 'opacity-55 cursor-not-allowed bg-slate-50 border-slate-100' 
                      : 'cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  {/* Photo Container */}
                  <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100/50 overflow-hidden flex items-center justify-center shrink-0 relative">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <ImageIcon size={18} className="text-slate-300" />
                    )}

                    {/* Cart badge over the image */}
                    {cartQty > 0 && (
                      <div className="absolute -top-1 -right-1 bg-violet-600 border-2 border-white text-white text-[9px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                        {cartQty}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="truncate">{p.categoria}</span>
                        <span className="bg-slate-50 border border-slate-100 px-1 rounded-sm text-slate-500 font-semibold">{p.sku}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs mt-1 truncate group-hover:text-violet-600 transition-colors" title={p.nombre}>
                        {p.nombre}
                      </h4>
                      <div className="flex gap-1 mt-1 text-[9px] font-medium text-slate-400">
                        {p.talle && <span>Talle: {p.talle}</span>}
                        {p.color && <span>| Color: {p.color}</span>}
                      </div>
                    </div>

                    {/* Stock status and Price */}
                    <div className="flex items-end justify-between mt-2 border-t border-slate-50 pt-1.5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-800 leading-none">
                          {formatMoney(p.precio_venta)}
                        </span>
                      </div>

                      {/* Stock badge */}
                      {isOutOfStock ? (
                        <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md">
                          Agotado
                        </span>
                      ) : remainingStock <= p.stock_minimo ? (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
                          Últimos {remainingStock}
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                          Stock: {remainingStock}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
