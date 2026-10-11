import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState, type ButtonHTMLAttributes } from 'react'
import { allSubtasksCompleted } from '../domain/tasks.ts'
import type { Task } from '../domain/types.ts'
import { usePlan } from '../state/PlanContext.tsx'
import { AddTaskField } from './AddTaskField.tsx'
import { MoveTaskDialog } from './MoveTaskDialog.tsx'
import { TaskDetailsModal } from './TaskDetailsModal.tsx'

interface TaskListProps {
  date: string
  showMoveAction?: boolean
}

export function TaskList({ date, showMoveAction = true }: TaskListProps) {
  const { tasks, createRootTask, createSubtask, setTaskStatus, reorderRootTasks } = usePlan()
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [moveId, setMoveId] = useState<string | null>(null)
  const dayTasks = useMemo(() => tasks.filter((task) => task.date === date), [date, tasks])
  const roots = useMemo(() => {
    const open = dayTasks.filter((task) => task.parentTaskId === null && task.status === 'open')
    const completed = dayTasks.filter((task) => task.parentTaskId === null && task.status === 'completed')
    return {
      open: open.sort((a, b) => a.sortOrder - b.sortOrder),
      completed: completed.sort((a, b) => a.sortOrder - b.sortOrder),
    }
  }, [dayTasks])
  const detailsTask = dayTasks.find((task) => task.id === detailsId) ?? null
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = roots.open.map((task) => task.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    const next = [...ids]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    void reorderRootTasks(date, next)
  }

  return (
    <div className="task-list">
      <AddTaskField
        id={`add-task-${date}`}
        placeholder="Dodaj zadanie"
        onSubmit={(title) => createRootTask(date, title)}
      />
      {roots.open.length === 0 && roots.completed.length === 0 ? (
        <p className="empty">Brak zadań na ten dzień. Dodaj pierwsze, gdy będziesz gotowy.</p>
      ) : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={roots.open.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <ul>
            {roots.open.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                childrenTasks={dayTasks.filter((item) => item.parentTaskId === task.id)}
                allTasks={dayTasks}
                showMoveAction={showMoveAction}
                onOpen={() => setDetailsId(task.id)}
                onMove={() => setMoveId(task.id)}
                onToggle={() => void setTaskStatus(task.id, 'completed')}
                onAddSubtask={(title) => createSubtask(task.id, title)}
                onToggleChild={(child) =>
                  void setTaskStatus(child.id, child.status === 'completed' ? 'open' : 'completed')
                }
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {roots.completed.length > 0 ? (
        <ul className="completed-list">
          {roots.completed.map((task) => (
            <li key={task.id}>
              <TaskRow
                task={task}
                childrenTasks={dayTasks.filter((item) => item.parentTaskId === task.id)}
                allTasks={dayTasks}
                showMoveAction={showMoveAction}
                onOpen={() => setDetailsId(task.id)}
                onMove={() => setMoveId(task.id)}
                onToggle={() => void setTaskStatus(task.id, 'open')}
                onAddSubtask={(title) => createSubtask(task.id, title)}
                onToggleChild={(child) =>
                  void setTaskStatus(child.id, child.status === 'completed' ? 'open' : 'completed')
                }
              />
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        className="text-button add-more"
        onClick={() => document.getElementById(`add-task-${date}`)?.focus()}
      >
        + Dodaj zadanie
      </button>
      {detailsTask ? <TaskDetailsModal task={detailsTask} onClose={() => setDetailsId(null)} /> : null}
      {moveId ? (
        <MoveTaskHost taskId={moveId} currentDate={date} onClose={() => setMoveId(null)} />
      ) : null}
    </div>
  )
}

function MoveTaskHost({
  taskId,
  currentDate,
  onClose,
}: {
  taskId: string
  currentDate: string
  onClose: () => void
}) {
  const { moveRootTask } = usePlan()
  return (
    <MoveTaskDialog
      currentDate={currentDate}
      onCancel={onClose}
      onMove={(date) => {
        void moveRootTask(taskId, date).then(onClose)
      }}
    />
  )
}

interface TaskRowProps {
  task: Task
  childrenTasks: Task[]
  allTasks: Task[]
  showMoveAction: boolean
  onOpen: () => void
  onMove: () => void
  onToggle: () => void
  onAddSubtask: (title: string) => Promise<void>
  onToggleChild: (child: Task) => void
}

function SortableTask(props: TaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }
  return (
    <li ref={setNodeRef} style={style}>
      <TaskRow {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </li>
  )
}

function TaskRow({
  task,
  childrenTasks,
  allTasks,
  showMoveAction,
  onOpen,
  onMove,
  onToggle,
  onAddSubtask,
  onToggleChild,
  dragHandleProps,
}: TaskRowProps & { dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement> }) {
  const completed = task.status === 'completed'
  const suggest = allSubtasksCompleted(allTasks, task.id) && !completed
  const orderedChildren = [
    ...childrenTasks.filter((item) => item.status === 'open'),
    ...childrenTasks.filter((item) => item.status === 'completed'),
  ]

  return (
    <article className={`task-card ${completed ? 'is-completed' : ''}`}>
      <div className="task-main">
        {dragHandleProps ? (
          <button type="button" className="drag-handle" aria-label="Zmień kolejność" {...dragHandleProps}>
            ⋮⋮
          </button>
        ) : (
          <span className="drag-handle spacer" />
        )}
        <input
          type="checkbox"
          checked={completed}
          onChange={onToggle}
          aria-label={`Oznacz jako ${completed ? 'niewykonane' : 'wykonane'}: ${task.title}`}
        />
        <button type="button" className={`task-title ${completed ? 'completed' : ''}`} onClick={onOpen}>
          {task.title}
        </button>
        {showMoveAction ? (
          <button type="button" className="text-button" onClick={onMove}>
            Przenieś
          </button>
        ) : null}
      </div>
      {suggest ? <p className="hint compact">Wszystkie podzadania wykonane</p> : null}
      <ul className="subtask-list">
        {orderedChildren.map((child) => (
          <li key={child.id}>
            <label className={child.status === 'completed' ? 'completed' : undefined}>
              <input
                type="checkbox"
                checked={child.status === 'completed'}
                onChange={() => onToggleChild(child)}
              />
              <span>{child.title}</span>
            </label>
          </li>
        ))}
      </ul>
      <AddTaskField placeholder="+ Dodaj podzadanie" onSubmit={onAddSubtask} />
    </article>
  )
}
