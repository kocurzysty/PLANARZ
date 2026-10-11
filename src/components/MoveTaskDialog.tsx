import { useState } from 'react'

interface MoveTaskDialogProps {
  currentDate: string
  onMove: (date: string) => void
  onCancel: () => void
}

export function MoveTaskDialog({ currentDate, onMove, onCancel }: MoveTaskDialogProps) {
  const [date, setDate] = useState(currentDate)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="move-title">Przenieś do dnia</h2>
        <label className="field">
          <span>Data</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Anuluj
          </button>
          <button type="button" className="primary" onClick={() => onMove(date)}>
            Przenieś
          </button>
        </div>
      </div>
    </div>
  )
}
