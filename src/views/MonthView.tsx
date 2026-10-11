import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  addMonths,
  formatDayNumber,
  formatMonthHeading,
  isDateString,
  monthGrid,
  todayString,
  yearMonthOf,
} from '../domain/dates.ts'
import { usePlan } from '../state/PlanContext.tsx'

export function MonthView() {
  const { yearMonth: yearMonthParam } = useParams()
  const navigate = useNavigate()
  const { loadRange, ready, tasks } = usePlan()
  const today = todayString()
  const yearMonth =
    yearMonthParam && /^\d{4}-\d{2}$/.test(yearMonthParam) ? yearMonthParam : yearMonthOf(today)
  const days = useMemo(() => monthGrid(yearMonth), [yearMonth])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    void loadRange(days[0], days[days.length - 1])
  }, [days, loadRange])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const task of tasks) {
      if (task.parentTaskId !== null) continue
      map.set(task.date, (map.get(task.date) ?? 0) + 1)
    }
    return map
  }, [tasks])

  const selectedTasks = selectedDate
    ? tasks.filter((task) => task.date === selectedDate && task.parentTaskId === null)
    : []

  return (
    <section className="view">
      <header className="view-header">
        <div className="date-nav">
          <button
            type="button"
            onClick={() => navigate(`/miesiac/${addMonths(yearMonth, -1)}`)}
            aria-label="Poprzedni miesiąc"
          >
            ←
          </button>
          <h1>{formatMonthHeading(yearMonth)}</h1>
          <button
            type="button"
            onClick={() => navigate(`/miesiac/${addMonths(yearMonth, 1)}`)}
            aria-label="Następny miesiąc"
          >
            →
          </button>
        </div>
      </header>
      {ready ? (
        <>
          <div className="month-grid" role="grid" aria-label="Kalendarz miesiąca">
            {['pn', 'wt', 'śr', 'cz', 'pt', 'sb', 'nd'].map((label) => (
              <div key={label} className="month-weekday">
                {label}
              </div>
            ))}
            {days.map((date) => {
              const inMonth = yearMonthOf(date) === yearMonth
              return (
                <button
                  key={date}
                  type="button"
                  className={`month-day ${inMonth ? '' : 'outside'} ${date === today ? 'today' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span>{formatDayNumber(date)}</span>
                  {counts.get(date) ? <span className="dot" aria-label="Są zadania" /> : null}
                </button>
              )
            })}
          </div>
          {selectedDate && isDateString(selectedDate) ? (
            <div className="modal-backdrop" role="presentation" onClick={() => setSelectedDate(null)}>
              <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="month-day-title"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="month-day-title">{selectedDate}</h2>
                {selectedTasks.length === 0 ? (
                  <p className="empty">Brak zadań</p>
                ) : (
                  <ul className="month-task-preview">
                    {selectedTasks.map((task) => (
                      <li key={task.id} className={task.status === 'completed' ? 'completed' : undefined}>
                        {task.title}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="modal-actions">
                  <button type="button" onClick={() => setSelectedDate(null)}>
                    Zamknij
                  </button>
                  <Link className="button primary" to={`/dzien/${selectedDate}`}>
                    Otwórz dzień
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="hint">Wczytywanie…</p>
      )}
    </section>
  )
}
