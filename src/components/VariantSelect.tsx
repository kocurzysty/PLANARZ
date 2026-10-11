import { useMemo, useState } from 'react'
import { defaultVariant } from '../domain/variants.ts'
import { usePlan } from '../state/PlanContext.tsx'
import { VariantSettingsModal } from './VariantSettingsModal.tsx'

interface VariantSelectProps {
  date: string
}

export function VariantSelect({ date }: VariantSelectProps) {
  const { variants, dayPlans, setDayVariant } = usePlan()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const selected = useMemo(() => {
    const plan = dayPlans.find((item) => item.date === date)
    return (
      variants.find((variant) => variant.id === plan?.difficultyVariantId) ??
      defaultVariant(variants)
    )
  }, [date, dayPlans, variants])

  if (!selected) return null

  return (
    <div className="variant-row">
      <label className="field compact">
        <span>Wariant dnia</span>
        <select
          value={selected.id}
          onChange={(event) => {
            void setDayVariant(date, event.target.value)
          }}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="text-button" onClick={() => setSettingsOpen(true)}>
        Ustawienia
      </button>
      {settingsOpen ? <VariantSettingsModal onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  )
}
