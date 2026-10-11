import { useState } from 'react'
import { allSubtasksCompleted } from '../domain/tasks.ts'
import type { Task } from '../domain/types.ts'
import { usePlan } from '../state/PlanContext.tsx'
import { AddTaskField } from './AddTaskField.tsx'
import { ConfirmDialog } from './ConfirmDialog.tsx'

interface TaskDetailsModalProps {
  task: Task
  onClose: () => void
}

export function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
  const { tasks, updateTask, deleteTask, createSubtask, setTaskStatus } = usePlan()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const children = tasks.filter((item) => item.parentTaskId === task.id)
  const suggestComplete = allSubtasksCompleted(tasks, task.id) && task.status === 'open'

  async function save() {
    await updateTask(task.id, { title, description })
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="task-details-title">Szczegóły zadania</h2>
        <label className="field">
          <span>Tytuł</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>Opis</span>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        {task.parentTaskId === null ? (
          <section>
            <h3>Podzadania</h3>
            <ul className="subtask-list">
              {children.map((child) => (
                <li key={child.id}>
                  <label className={child.status === 'completed' ? 'completed' : undefined}>
                    <input
                      type="checkbox"
                      checked={child.status === 'completed'}
                      onChange={() =>
                        void setTaskStatus(child.id, child.status === 'completed' ? 'open' : 'completed')
                      }
                    />
                    <span>{child.title}</span>
                  </label>
                </li>
              ))}
            </ul>
            <AddTaskField
              placeholder="+ Dodaj podzadanie"
              onSubmit={(value) => createSubtask(task.id, value)}
            />
            {suggestComplete ? (
              <p className="hint">Wszystkie podzadania są wykonane. Zadanie nadrzędne pozostaje otwarte.</p>
            ) : null}
          </section>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="danger-text text-button" onClick={() => setConfirmDelete(true)}>
            Usuń
          </button>
          <button type="button" onClick={onClose}>
            Anuluj
          </button>
          <button type="button" className="primary" onClick={() => void save()} disabled={!title.trim()}>
            Zapisz
          </button>
        </div>
      </div>
      {confirmDelete ? (
        <ConfirmDialog
          title="Usunąć zadanie?"
          confirmLabel="Usuń"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            void deleteTask(task.id).then(onClose)
          }}
        >
          <p>
            Usunięcie jest nieodwracalne.
            {task.parentTaskId === null ? ' Podzadania zostaną usunięte razem z zadaniem.' : ''}
          </p>
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
