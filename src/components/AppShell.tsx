import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { todayString } from '../domain/dates.ts'
import { CreateTaskModal } from './CreateTaskModal.tsx'
import { SaveErrorBanner } from './SaveErrorBanner.tsx'

export function AppShell() {
  const [createOpen, setCreateOpen] = useState(false)
  const location = useLocation()
  const dateMatch = location.pathname.match(/(\d{4}-\d{2}-\d{2})/)
  const defaultDate = dateMatch?.[1] ?? todayString()

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="brand">PLANARZ</p>
        <button type="button" className="primary compact-button" onClick={() => setCreateOpen(true)}>
          Nowe zadanie
        </button>
      </header>
      <SaveErrorBanner />
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="app-nav" aria-label="Główne widoki">
        <NavLink to="/dzisiaj">Dzisiaj</NavLink>
        <NavLink to="/dzien">Dzień</NavLink>
        <NavLink to="/tydzien">Tydzień</NavLink>
        <NavLink to="/miesiac">Miesiąc</NavLink>
      </nav>
      {createOpen ? (
        <CreateTaskModal defaultDate={defaultDate} onClose={() => setCreateOpen(false)} />
      ) : null}
    </div>
  )
}
