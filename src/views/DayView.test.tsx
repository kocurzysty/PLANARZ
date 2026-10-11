import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { PlanProvider } from '../state/PlanContext.tsx'
import { DayView } from './DayView.tsx'

const dbNames: string[] = []

function renderDay() {
  const dbName = `planarz-ui-${crypto.randomUUID()}`
  dbNames.push(dbName)
  return render(
    <PlanProvider dbName={dbName}>
      <MemoryRouter initialEntries={['/dzien/2026-10-11']}>
        <Routes>
          <Route path="/dzien/:date" element={<DayView />} />
        </Routes>
      </MemoryRouter>
    </PlanProvider>,
  )
}

afterEach(async () => {
  await Promise.all(dbNames.splice(0).map((name) => indexedDB.deleteDatabase(name)))
})

describe('DayView', () => {
  it('adds, completes and restores a task', async () => {
    const user = userEvent.setup()
    renderDay()
    const input = await screen.findByLabelText('Dodaj zadanie')
    await user.type(input, 'Napić się wody')
    await user.click(screen.getByRole('button', { name: 'Dodaj' }))
    expect(await screen.findByRole('button', { name: 'Napić się wody' })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Oznacz jako wykonane: Napić się wody/ }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Napić się wody' })).toHaveClass('completed')
    })
    await user.click(screen.getByRole('checkbox', { name: /Oznacz jako niewykonane: Napić się wody/ }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Napić się wody' })).not.toHaveClass('completed')
    })
  })
})
