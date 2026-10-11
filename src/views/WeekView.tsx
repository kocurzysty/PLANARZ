import {
  DndContext,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MoveTaskDialog } from '../components/MoveTaskDialog.tsx'
import { TaskDetailsModal } from '../components/TaskDetailsModal.tsx'
import {
  addDays,
  formatDayHeading,
  formatWeekdayShort,
  isDateString,
  startOfWeek,
  todayString,
  weekDates,
} from '../domain/dates.ts'
import type { Task } from '../domain/types.ts'
import { defaultVariant } from '../domain/variants.ts'
import { usePlan } from '../state/PlanContext.tsx'

export function WeekView() {
  const { date: dateParam } = useParams()
  const navigate = useNavigate()
  const { loadRange, ready, tasks, dayPlans, variants, setTaskStatus, moveRootTask } = usePlan()
  const today = todayString()
  const anchor = dateParam && isDateString(dateParam) ? dateParam : today
  const weekStart = startOfWeek(anchor)
  const days = weekDates(anchor)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [today]: true })
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [moveId, setMoveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    void loadRange(weekStart, addDays(weekStart, 6))
  }, [loadRange, weekStart])

  const detailsTask = tasks.find((task) => task.id === detailsId) ?? null
  const moveTask = tasks.find((task) => task.id === moveId)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const targetDate = String(over.id).replace('day-', '')
    const taskId = String(active.id).replace('task-', '')
    if (!isDateString(targetDate)) return
    void moveRootTask(taskId, targetDate).then(() => {
      setExpanded((current) => ({ ...current, [targetDate]: true }))
    })
  }

  return (
    <section className="view">
      <header className="view-header">
        <div className="date-nav">
          <button
            type="button"
            onClick={() => navigate(`/tydzien/${addDays(days[0], -7)}`)}
            aria-label="Poprzedni tydzień"
          >
            ←
          </button>
          <h1>
            Tydzień {formatDayHeading(days[0]).replace(/^[^,]+, /, '')} – {formatDayHeading(days[6]).replace(/^[^,]+, /, '')}
          </h1>
          <button
            type="button"
            onClick={() => navigate(`/tydzien/${addDays(days[0], 7)}`)}
            aria-label="Następny tydzień"
          >
            →
          </button>
        </div>
      </header>
      {ready ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="week-list">
            {days.map((date) => (
              <WeekDaySection
                key={date}
                date={date}
                expanded={Boolean(expanded[date])}
                onToggle={() =>
                  setExpanded((current) => ({ ...current, [date]: !current[date] }))
                }
                tasks={tasks.filter((task) => task.date === date && task.parentTaskId === null)}
                variantName={
                  variants.find(
                    (variant) =>
                      variant.id === dayPlans.find((plan) => plan.date === date)?.difficultyVariantId,
                  )?.name ??
                  defaultVariant(variants)?.name ??
                  ''
                }
                onOpenTask={setDetailsId}
                onMoveTask={setMoveId}
                onToggleTask={(task) =>
                  void setTaskStatus(task.id, task.status === 'completed' ? 'open' : 'completed')
                }
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <p className="hint">Wczytywanie…</p>
      )}
      {detailsTask ? <TaskDetailsModal task={detailsTask} onClose={() => setDetailsId(null)} /> : null}
      {moveTask ? (
        <MoveTaskDialog
          currentDate={moveTask.date}
          onCancel={() => setMoveId(null)}
          onMove={(nextDate) => {
            void moveRootTask(moveTask.id, nextDate).then(() => setMoveId(null))
          }}
        />
      ) : null}
    </section>
  )
}

function WeekDaySection({
  date,
  expanded,
  onToggle,
  tasks,
  variantName,
  onOpenTask,
  onMoveTask,
  onToggleTask,
}: {
  date: string
  expanded: boolean
  onToggle: () => void
  tasks: Task[]
  variantName: string
  onOpenTask: (id: string) => void
  onMoveTask: (id: string) => void
  onToggleTask: (task: Task) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `day-${date}` })
  const ordered = useMemo(() => {
    const open = tasks.filter((task) => task.status === 'open').sort((a, b) => a.sortOrder - b.sortOrder)
    const completed = tasks
      .filter((task) => task.status === 'completed')
      .sort((a, b) => a.sortOrder - b.sortOrder)
    return [...open, ...completed]
  }, [tasks])

  return (
    <section ref={setNodeRef} className={`week-day ${isOver ? 'drop-target' : ''}`}>
      <button type="button" className="week-day-header" onClick={onToggle} aria-expanded={expanded}>
        <span>
          {formatWeekdayShort(date)} {date.slice(8)} · {variantName}
        </span>
        <span className="hint">{ordered.length}</span>
      </button>
      {expanded ? (
        <div className="week-day-body">
          {ordered.length === 0 ? <p className="empty">Brak zadań</p> : null}
          <ul>
            {ordered.map((task) => (
              <WeekTaskRow
                key={task.id}
                task={task}
                onOpen={() => onOpenTask(task.id)}
                onMove={() => onMoveTask(task.id)}
                onToggle={() => onToggleTask(task)}
              />
            ))}
          </ul>
          <Link className="text-button" to={`/dzien/${date}`}>
            Otwórz dzień
          </Link>
        </div>
      ) : null}
    </section>
  )
}

function WeekTaskRow({
  task,
  onOpen,
  onMove,
  onToggle,
}: {
  task: Task
  onOpen: () => void
  onMove: () => void
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  }
  return (
    <li ref={setNodeRef} style={style} className="week-task">
      <button type="button" className="drag-handle" aria-label="Przeciągnij do innego dnia" {...listeners} {...attributes}>
        ⋮⋮
      </button>
      <input type="checkbox" checked={task.status === 'completed'} onChange={onToggle} />
      <button type="button" className={`task-title ${task.status === 'completed' ? 'completed' : ''}`} onClick={onOpen}>
        {task.title}
      </button>
      <button type="button" className="text-button" onClick={onMove}>
        Przenieś
      </button>
    </li>
  )
}
