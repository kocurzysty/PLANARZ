import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TaskList } from '../components/TaskList.tsx'
import { VariantSelect } from '../components/VariantSelect.tsx'
import { addDays, formatDayHeading, isDateString, todayString } from '../domain/dates.ts'
import { usePlan } from '../state/PlanContext.tsx'

interface DayViewProps {
  lockedToToday?: boolean
}

export function DayView({ lockedToToday = false }: DayViewProps) {
  const { date: dateParam } = useParams()
  const navigate = useNavigate()
  const { loadRange, ready } = usePlan()
  const today = todayString()
  const date = lockedToToday ? today : dateParam && isDateString(dateParam) ? dateParam : today

  useEffect(() => {
    if (!lockedToToday && dateParam && !isDateString(dateParam)) {
      navigate(`/dzien/${today}`, { replace: true })
    }
  }, [dateParam, lockedToToday, navigate, today])

  useEffect(() => {
    void loadRange(date, date)
  }, [date, loadRange])

  return (
    <section className="view">
      <header className="view-header">
        <div className="date-nav">
          <button type="button" onClick={() => go(addDays(date, -1))} aria-label="Poprzedni dzień">
            ←
          </button>
          <h1>{lockedToToday ? `Dzisiaj · ${formatDayHeading(date)}` : formatDayHeading(date)}</h1>
          <button type="button" onClick={() => go(addDays(date, 1))} aria-label="Następny dzień">
            →
          </button>
        </div>
        {!lockedToToday ? (
          <label className="field compact">
            <span>Wybierz datę</span>
            <input
              type="date"
              value={date}
              onChange={(event) => navigate(`/dzien/${event.target.value}`)}
            />
          </label>
        ) : null}
        <VariantSelect date={date} />
      </header>
      {ready ? <TaskList date={date} /> : <p className="hint">Wczytywanie…</p>}
    </section>
  )

  function go(nextDate: string) {
    if (lockedToToday) {
      navigate(`/dzien/${nextDate}`)
      return
    }
    navigate(`/dzien/${nextDate}`)
  }
}
