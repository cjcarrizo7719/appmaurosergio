import React, { useState } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { useCaja } from '../../context/CajaContext'
import { CashOpen } from './CashOpen'
import { CashActive } from './CashActive'
import { CashHistory } from './CashHistory'
import { Wallet, History, Loader2 } from 'lucide-react'

export default function CashAdmin() {
  const { cajaActiva, loading } = useCaja()
  const [activeTab, setActiveTab] = useState('session') // 'session' or 'history'

  return (
    <PageLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Wallet className="text-violet-600" size={26} />
              Control de Caja
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Gestione las aperturas, cierres de turnos, arqueos físicos y movimientos manuales.
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0 border border-slate-200/50">
            <button
              onClick={() => setActiveTab('session')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'session'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Wallet size={14} />
              Turno Activo
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <History size={14} />
              Historial de Arqueos
            </button>
          </div>
        </div>

        {/* Content Box */}
        {loading ? (
          <div className="h-64 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2">
            <Loader2 size={32} className="animate-spin text-violet-500" />
            <span className="text-slate-400 text-xs font-semibold animate-pulse">Comprobando estado de caja...</span>
          </div>
        ) : activeTab === 'session' ? (
          cajaActiva ? (
            <CashActive />
          ) : (
            <CashOpen />
          )
        ) : (
          <CashHistory />
        )}
      </div>
    </PageLayout>
  )
}
