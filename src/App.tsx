import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell.tsx'
import { PlanProvider } from './state/PlanContext.tsx'
import { DayView } from './views/DayView.tsx'
import { MonthView } from './views/MonthView.tsx'
import { WeekView } from './views/WeekView.tsx'

export default function App() {
  return (
    <PlanProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dzisiaj" replace />} />
          <Route path="/dzisiaj" element={<DayView lockedToToday />} />
          <Route path="/dzien" element={<DayView />} />
          <Route path="/dzien/:date" element={<DayView />} />
          <Route path="/tydzien" element={<WeekView />} />
          <Route path="/tydzien/:date" element={<WeekView />} />
          <Route path="/miesiac" element={<MonthView />} />
          <Route path="/miesiac/:yearMonth" element={<MonthView />} />
          <Route path="*" element={<Navigate to="/dzisiaj" replace />} />
        </Route>
      </Routes>
    </PlanProvider>
  )
}
