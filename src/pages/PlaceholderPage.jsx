import React from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { Sparkles } from 'lucide-react'

export default function PlaceholderPage({ title, stage }) {
  return (
    <PageLayout>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12">
        <div className="p-4 bg-violet-50 text-violet-500 rounded-2xl mb-6">
          <Sparkles size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 mt-2 max-w-sm">
          Este módulo está planeado para la **{stage}**. Actualmente estamos recopilando información y diseñando las interfaces correspondientes.
        </p>
        <div className="mt-8 px-4 py-2 bg-slate-50 text-slate-400 text-xs font-semibold rounded-xl uppercase tracking-wider">
          Próximamente disponible
        </div>
      </div>
    </PageLayout>
  )
}
