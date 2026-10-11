import { usePlan } from '../state/PlanContext.tsx'

export function SaveErrorBanner() {
  const { saveError, clearSaveError } = usePlan()
  if (!saveError) return null
  return (
    <div className="banner banner-error" role="alert">
      <p>{saveError}</p>
      <button type="button" className="text-button" onClick={clearSaveError}>
        Zamknij
      </button>
    </div>
  )
}
