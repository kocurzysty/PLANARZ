import { useState, type FormEvent } from 'react'

interface AddTaskFieldProps {
  placeholder: string
  onSubmit: (title: string) => Promise<void> | void
  id?: string
}

export function AddTaskField({ placeholder, onSubmit, id }: AddTaskFieldProps) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const title = value.trim()
    if (!title || busy) return
    setBusy(true)
    try {
      await onSubmit(title)
      setValue('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="add-task" onSubmit={handleSubmit}>
      <input
        id={id}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
      />
      <button type="submit" className="primary" disabled={busy || !value.trim()}>
        Dodaj
      </button>
    </form>
  )
}
