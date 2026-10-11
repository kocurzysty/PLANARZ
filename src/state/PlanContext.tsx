import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { PlanarzDB } from '../db/database.ts'
import { PlanRepository } from '../db/repository.ts'
import { todayString } from '../domain/dates.ts'
import type { DayPlan, DifficultyVariant, Task } from '../domain/types.ts'

interface PlanContextValue {
  ready: boolean
  saveError: string | null
  clearSaveError: () => void
  variants: DifficultyVariant[]
  tasks: Task[]
  dayPlans: DayPlan[]
  loadRange: (startDate: string, endDate: string) => Promise<void>
  createRootTask: (date: string, title: string) => Promise<void>
  createSubtask: (parentId: string, title: string) => Promise<void>
  updateTask: (id: string, changes: Partial<Pick<Task, 'title' | 'description'>>) => Promise<void>
  setTaskStatus: (id: string, status: Task['status']) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  reorderRootTasks: (date: string, orderedOpenIds: string[]) => Promise<void>
  moveRootTask: (id: string, targetDate: string) => Promise<void>
  setDayVariant: (date: string, variantId: string) => Promise<void>
  createVariant: (name: string) => Promise<void>
  renameVariant: (id: string, name: string) => Promise<void>
  deleteVariant: (id: string, replacementId: string | null) => Promise<void>
  variantUsage: (id: string) => Promise<number>
}

const PlanContext = createContext<PlanContextValue | null>(null)

interface PlanProviderProps {
  children: ReactNode
  dbName?: string
}

export function PlanProvider({ children, dbName = 'planarz' }: PlanProviderProps) {
  const repository = useMemo(() => new PlanRepository(new PlanarzDB(dbName)), [dbName])
  const [ready, setReady] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [variants, setVariants] = useState<DifficultyVariant[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([])
  const [range, setRange] = useState(() => {
    const today = todayString()
    return { start: today, end: today }
  })

  const refresh = useCallback(async () => {
    const [nextVariants, nextTasks, nextPlans] = await Promise.all([
      repository.ensureSeeded(),
      repository.listTasksInRange(range.start, range.end),
      repository.listDayPlansInRange(range.start, range.end),
    ])
    setVariants(nextVariants)
    setTasks(nextTasks)
    setDayPlans(nextPlans)
  }, [range.end, range.start, repository])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await refresh()
        if (!cancelled) setReady(true)
      } catch (error) {
        if (!cancelled) {
          setSaveError(error instanceof Error ? error.message : 'Nie udało się wczytać danych.')
          setReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const runWrite = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action()
        await refresh()
        setSaveError(null)
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : 'Nie udało się zapisać zmian. Spróbuj ponownie.',
        )
        throw error
      }
    },
    [refresh],
  )

  const loadRange = useCallback(async (startDate: string, endDate: string) => {
    setRange({ start: startDate, end: endDate })
  }, [])

  const value = useMemo<PlanContextValue>(
    () => ({
      ready,
      saveError,
      clearSaveError: () => setSaveError(null),
      variants,
      tasks,
      dayPlans,
      loadRange,
      createRootTask: (date, title) => runWrite(async () => {
        await repository.createRootTask(date, title)
      }),
      createSubtask: (parentId, title) => runWrite(async () => {
        await repository.createSubtask(parentId, title)
      }),
      updateTask: (id, changes) => runWrite(async () => {
        await repository.updateTask(id, changes)
      }),
      setTaskStatus: (id, status) => runWrite(async () => {
        await repository.setTaskStatus(id, status)
      }),
      deleteTask: (id) => runWrite(async () => {
        await repository.deleteTask(id)
      }),
      reorderRootTasks: (date, orderedOpenIds) => runWrite(async () => {
        await repository.reorderRootTasks(date, orderedOpenIds)
      }),
      moveRootTask: (id, targetDate) => runWrite(async () => {
        await repository.moveRootTask(id, targetDate)
      }),
      setDayVariant: (date, variantId) =>
        runWrite(async () => {
          const variant = variants.find((item) => item.id === variantId)
          if (!variant) throw new Error('Nie znaleziono wariantu dnia.')
          await repository.setDayVariant(date, variant)
        }),
      createVariant: (name) => runWrite(async () => {
        await repository.createVariant(name)
      }),
      renameVariant: (id, name) => runWrite(async () => {
        await repository.renameDayVariant(id, name)
      }),
      deleteVariant: (id, replacementId) => runWrite(async () => {
        await repository.deleteVariant(id, replacementId)
      }),
      variantUsage: (id) => repository.countVariantUsage(id),
    }),
    [dayPlans, loadRange, ready, repository, runWrite, saveError, tasks, variants],
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan(): PlanContextValue {
  const value = useContext(PlanContext)
  if (!value) {
    throw new Error('usePlan wymaga PlanProvider.')
  }
  return value
}

