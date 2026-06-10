import React from 'react'
import { Sidebar } from './Sidebar'

export const PageLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Fijo / Lateral */}
      <Sidebar />

      {/* Área de Contenido Principal */}
      <main className="flex-1 lg:pl-64 min-h-screen flex flex-col transition-all duration-300">
        <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto mt-14 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
