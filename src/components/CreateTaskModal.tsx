import { useState, type FormEvent } from 'react'
import { todayString } from '../domain/dates.ts'
import { usePlan } from '../state/PlanContext.tsx'

interface CreateTaskModalProps {
  defaultDate: string
  onClose: () => void
}

export function CreateTaskModal({ defaultDate, onClose }: CreateTaskModalProps) {
  const { createRootTask } = usePlan()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate || todayString())

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    await createRootTask(date, title)
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <h2 id="create-task-title">Nowe zadanie</h2>
        <label className="field">
          <span>Tytuł</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        </label>
        <label className="field">
          <span>Data</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Anuluj
          </button>
          <button type="submit" className="primary" disabled={!title.trim()}>
            Dodaj
          </button>
        </div>
      </form>
    </div>
  )
}
