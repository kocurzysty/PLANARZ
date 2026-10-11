export type TaskStatus = 'open' | 'completed'

export interface Task {
  id: string
  title: string
  description: string
  date: string
  status: TaskStatus
  sortOrder: number
  parentTaskId: string | null
  createdAt: string
  updatedAt: string
}

export interface DayPlan {
  date: string
  difficultyVariantId: string | null
  difficultyVariantNameSnapshot: string | null
  updatedAt: string
}

export interface DifficultyVariant {
  id: string
  name: string
  sortOrder: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export const MAX_DIFFICULTY_VARIANTS = 9

export const DEFAULT_VARIANT_NAMES = ['Łatwy', 'Średni', 'Trudny'] as const
