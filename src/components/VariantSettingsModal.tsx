import { useState } from 'react'
import { MAX_DIFFICULTY_VARIANTS } from '../domain/types.ts'
import { canAddVariant } from '../domain/variants.ts'
import { usePlan } from '../state/PlanContext.tsx'
import { ConfirmDialog } from './ConfirmDialog.tsx'

interface VariantSettingsModalProps {
  onClose: () => void
}

export function VariantSettingsModal({ onClose }: VariantSettingsModalProps) {
  const { variants, createVariant, renameVariant, deleteVariant, variantUsage } = usePlan()
  const [newName, setNewName] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [usedCount, setUsedCount] = useState(0)
  const [replacementId, setReplacementId] = useState<string>('')

  async function requestDelete(id: string) {
    const count = await variantUsage(id)
    setUsedCount(count)
    setPendingDeleteId(id)
    const other = variants.find((variant) => variant.id !== id)
    setReplacementId(other?.id ?? '')
  }

  const pending = variants.find((variant) => variant.id === pendingDeleteId)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="variants-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="variants-title">Warianty dnia</h2>
        <p className="hint">Możesz mieć najwyżej {MAX_DIFFICULTY_VARIANTS} aktywnych wariantów.</p>
        <ul className="variant-editor">
          {variants.map((variant) => (
            <li key={variant.id}>
              <input
                defaultValue={variant.name}
                aria-label={`Nazwa wariantu ${variant.name}`}
                onBlur={(event) => {
                  const next = event.target.value.trim()
                  if (next && next !== variant.name) {
                    void renameVariant(variant.id, next)
                  } else {
                    event.target.value = variant.name
                  }
                }}
              />
              <button type="button" className="text-button danger-text" onClick={() => void requestDelete(variant.id)}>
                Usuń
              </button>
            </li>
          ))}
        </ul>
        {canAddVariant(variants) ? (
          <form
            className="add-task"
            onSubmit={(event) => {
              event.preventDefault()
              if (!newName.trim()) return
              void createVariant(newName).then(() => setNewName(''))
            }}
          >
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nowy wariant"
              aria-label="Nowy wariant"
            />
            <button type="submit" className="primary" disabled={!newName.trim()}>
              Dodaj
            </button>
          </form>
        ) : (
          <p className="hint">Osiągnięto limit {MAX_DIFFICULTY_VARIANTS} wariantów.</p>
        )}
        <div className="modal-actions">
          <button type="button" className="primary" onClick={onClose}>
            Gotowe
          </button>
        </div>
      </div>
      {pending ? (
        <ConfirmDialog
          title="Usunąć wariant?"
          confirmLabel="Usuń"
          danger
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={() => {
            void deleteVariant(pending.id, usedCount > 0 ? replacementId || null : null).then(() =>
              setPendingDeleteId(null),
            )
          }}
        >
          {usedCount > 0 ? (
            <>
              <p>
                Wariant „{pending.name}” jest przypisany do {usedCount}{' '}
                {usedCount === 1 ? 'dnia' : 'dni'}. Wybierz wariant zastępczy albo zostaw puste, aby
                wyczyścić przypisania.
              </p>
              <label className="field">
                <span>Wariant zastępczy</span>
                <select value={replacementId} onChange={(event) => setReplacementId(event.target.value)}>
                  <option value="">Wyczyść przypisania</option>
                  {variants
                    .filter((variant) => variant.id !== pending.id)
                    .map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name}
                      </option>
                    ))}
                </select>
              </label>
            </>
          ) : (
            <p>Usunięcie dotyczy tylko listy aktywnych wariantów.</p>
          )}
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
