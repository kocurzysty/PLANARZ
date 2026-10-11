import Dexie, { type Table } from 'dexie'
import type { DayPlan, DifficultyVariant, Task } from '../domain/types.ts'

export class PlanarzDB extends Dexie {
  tasks!: Table<Task, string>
  dayPlans!: Table<DayPlan, string>
  variants!: Table<DifficultyVariant, string>

  constructor(name = 'planarz') {
    super(name)
    this.version(1).stores({
      tasks: 'id, date, parentTaskId, status, sortOrder',
      dayPlans: 'date, difficultyVariantId',
      variants: 'id, sortOrder',
    })
  }
}
