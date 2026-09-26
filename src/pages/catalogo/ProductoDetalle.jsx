import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, MessageCircle, ShoppingBag, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Ruler, Thermometer, Palette, Tag
} from 'lucide-react'

const WHATSAPP_NUMBER = '5493564650736'

const formatMoney = (amount) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)

const SEASON_COLORS = {
  Invierno: 'bg-blue-100 text-blue-700',
  Verano: 'bg-amber-100 text-amber-700',
  Otoño: 'bg-orange-100 text-orange-700',
  Primavera: 'bg-emerald-100 text-emerald-700',
  Permanente: 'bg-slate-100 text-slate-600',
}

function SimilarCard({ product }) {
  const seasonColor = SEASON_COLORS[product.temporada] || 'bg-slate-100 text-slate-600'
  return (
    <Link
      to={`/catalogo/${product.id}`}
      className="flex-shrink-0 w-44 sm:w-52 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="aspect-square bg-slate-50 overflow-hidden relative">
        {product.imagen_url ? (
          <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ShoppingBag size={28} strokeWidth={1.5} />
          </div>
        )}
        {product.temporada && (
          <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${seasonColor}`}>
            {product.temporada}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.categoria}</p>
        <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2">{product.nombre}</h4>
        {product.talle && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 w-fit">
            Talle {product.talle}
          </span>
        )}
        <p className="text-sm font-black text-slate-900 mt-auto pt-1">{formatMoney(product.precio_venta)}</p>
      </div>
    </Link>
  )
}

export default function ProductoDetalle() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const carouselRef = useRef(null)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await supabase
          .from('productos')
          .select('id, sku, nombre, categoria, descripcion, talle, color, temporada, precio_venta, imagen_url')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError
        setProduct(data)

        // Fetch similar products by talle OR temporada
        const conditions = []
        if (data.talle) conditions.push(`talle.eq.${data.talle}`)
        if (data.temporada) conditions.push(`temporada.eq.${data.temporada}`)

        let similarQuery = supabase
          .from('productos')
          .select('id, sku, nombre, categoria, talle, color, temporada, precio_venta, imagen_url')
          .eq('activo', true)
          .neq('id', id)
          .limit(12)

        if (conditions.length > 0) {
          similarQuery = similarQuery.or(conditions.join(','))
        } else {
          similarQuery = similarQuery.eq('categoria', data.categoria)
        }

        const { data: similarData } = await similarQuery
        setSimilar(similarData || [])
      } catch (err) {
        setError('No se pudo cargar el producto. Verificá el enlace o intentá nuevamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  useEffect(() => {
    if (product) {
      document.title = `${product.nombre} | Mauro Sergio`
      return () => { document.title = 'Mauro Sergio Catalogo' }
    }
  }, [product])

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' })
    }
  }

  const seasonColor = product ? (SEASON_COLORS[product.temporada] || 'bg-slate-100 text-slate-600') : ''

  const whatsappUrl = (() => {
    if (!product) return '#'
    const parts = [`Me interesa ${product.nombre}`]
    if (product.talle) parts.push(`Talle ${product.talle}`)
    if (product.color) parts.push(product.color)
    parts.push(`https://maurosergiosf.vercel.app/catalogo/${product.id}`)
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(parts.join(' / '))}`
  })()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ===== HEADER ===== */}
      <header className="bg-[#E01602] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/catalogo" className="flex flex-col leading-tight group">
            <span className="text-[9px] font-bold text-[#FAC400] uppercase tracking-[0.25em]">Catálogo Oficial</span>
            <span className="text-xl font-black tracking-tight group-hover:text-[#FAC400] transition-colors">MAURO SERGIO</span>
          </Link>
          <Link
            to="/catalogo"
            className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Volver al catálogo
          </Link>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <Loader2 size={36} className="animate-spin text-violet-500" />
            <p className="text-slate-400 text-sm font-semibold animate-pulse">Cargando prenda...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
            <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertCircle size={28} className="text-rose-400" />
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm">{error}</p>
              <Link to="/catalogo" className="mt-3 inline-block text-xs text-violet-600 font-bold hover:underline">
                Volver al catálogo
              </Link>
            </div>
          </div>
        ) : product && (
          <>
            {/* ── PRODUCT DETAIL ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-10">
              <div className="grid grid-cols-1 lg:grid-cols-2">

                {/* Left: Full image */}
                <div className="bg-slate-50 aspect-square lg:aspect-auto lg:min-h-[500px] relative overflow-hidden">
                  {product.imagen_url ? (
                    <img
                      src={product.imagen_url}
                      alt={product.nombre}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-300 min-h-[320px]">
                      <ShoppingBag size={56} strokeWidth={1} />
                      <span className="text-sm font-semibold">Sin fotografía disponible</span>
                    </div>
                  )}
                  {/* Season badge over image */}
                  {product.temporada && (
                    <span className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full shadow-sm ${seasonColor}`}>
                      {product.temporada}
                    </span>
                  )}
                </div>

                {/* Right: Details */}
                <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-5">
                  {/* Category + SKU */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Tag size={10} />
                      {product.categoria}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300">SKU: {product.sku}</span>
                  </div>

                  {/* Name */}
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {product.nombre}
                  </h1>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{formatMoney(product.precio_venta)}</span>
                    <span className="text-xs font-semibold text-slate-400">IVA incluido</span>
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* Attributes grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {product.talle && (
                      <div className="flex flex-col items-center gap-1.5 p-3 bg-violet-50 rounded-2xl border border-violet-100">
                        <Ruler size={16} className="text-violet-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Talle</span>
                        <span className="text-sm font-black text-slate-800">{product.talle}</span>
                      </div>
                    )}
                    {product.color && (
                      <div className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <Palette size={16} className="text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Color</span>
                        <span className="text-sm font-black text-slate-800">{product.color}</span>
                      </div>
                    )}
                    {product.temporada && (
                      <div className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <Thermometer size={16} className="text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temporada</span>
                        <span className="text-sm font-black text-slate-800">{product.temporada}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {product.descripcion && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{product.descripcion}</p>
                    </div>
                  )}

                  {/* WhatsApp CTA */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-[#25D366] hover:bg-[#1ebe5a] active:scale-[0.98] text-white rounded-2xl font-black text-base shadow-lg shadow-[#25D366]/25 transition-all duration-200"
                  >
                    <MessageCircle size={22} />
                    Consultar por WhatsApp
                  </a>
                  <p className="text-center text-[10px] text-slate-400 font-medium -mt-3">
                    Te vamos a responder a la brevedad
                  </p>
                </div>
              </div>
            </div>

            {/* ── SIMILAR PRODUCTS CAROUSEL ── */}
            {similar.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Prendas similares</h2>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Mismo talle o temporada que te pueden interesar
                    </p>
                  </div>
                  {/* Carousel controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => scrollCarousel(-1)}
                      className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-sm transition-all"
                      aria-label="Anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => scrollCarousel(1)}
                      className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-sm transition-all"
                      aria-label="Siguiente"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Scrollable carousel */}
                <div
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto pb-3 scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {similar.map((p) => (
                    <SimilarCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}

            {/* ── BACK TO CATALOG ── */}
            <div className="flex justify-center pb-4">
              <Link
                to="/catalogo"
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
              >
                <ArrowLeft size={16} />
                Volver al catálogo completo
              </Link>
            </div>
          </>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#E01602] text-white/70 text-center py-6 mt-auto">
        <p className="text-xs font-semibold">
          © {new Date().getFullYear()} <span className="text-white font-bold">MAURO SERGIO</span> — Pueyredón 942 San Francisco - Córdoba - Todos los derechos reservados.
        </p>
        <p className="text-[10px] mt-1">Los precios pueden variar sin previo aviso. Stock sujeto a disponibilidad.</p>
      </footer>
    </div>
  )
}
