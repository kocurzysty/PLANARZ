import { createId } from '../domain/ids.ts'
import { canHaveSubtasks, displayOrder, nextSortOrder, rootTasksOnDate } from '../domain/tasks.ts'
import type { DayPlan, DifficultyVariant, Task, TaskStatus } from '../domain/types.ts'
import { addVariant, createDefaultVariants, removeVariant, renameVariant } from '../domain/variants.ts'
import type { PlanarzDB } from './database.ts'

export class PlanRepository {
  constructor(private readonly db: PlanarzDB) {}

  async ensureSeeded(): Promise<DifficultyVariant[]> {
    const existing = await this.listVariants()
    if (existing.length > 0) return existing
    const seeded = createDefaultVariants()
    await this.db.variants.bulkAdd(seeded)
    return seeded
  }

  async listVariants(): Promise<DifficultyVariant[]> {
    return this.db.variants.orderBy('sortOrder').toArray()
  }

  async listTasksInRange(startDate: string, endDate: string): Promise<Task[]> {
    return this.db.tasks.where('date').between(startDate, endDate, true, true).toArray()
  }

  async listDayPlansInRange(startDate: string, endDate: string): Promise<DayPlan[]> {
    return this.db.dayPlans.where('date').between(startDate, endDate, true, true).toArray()
  }

  async createRootTask(date: string, title: string): Promise<Task> {
    const trimmed = title.trim()
    if (!trimmed) {
      throw new Error('Tytuł zadania nie może być pusty.')
    }
    const now = new Date().toISOString()
    const siblings = (await this.db.tasks.where('date').equals(date).toArray()).filter(
      (task) => task.parentTaskId === null,
    )
    const task: Task = {
      id: createId(),
      title: trimmed,
      description: '',
      date,
      status: 'open',
      sortOrder: nextSortOrder(siblings),
      parentTaskId: null,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.tasks.add(task)
    return task
  }

  async createSubtask(parentId: string, title: string): Promise<Task> {
    const parent = await this.db.tasks.get(parentId)
    if (!parent) {
      throw new Error('Nie znaleziono zadania nadrzędnego.')
    }
    if (!canHaveSubtasks(parent)) {
      throw new Error('Podzadania mogą mieć tylko jeden poziom.')
    }
    const trimmed = title.trim()
    if (!trimmed) {
      throw new Error('Tytuł podzadania nie może być pusty.')
    }
    const now = new Date().toISOString()
    const siblings = await this.db.tasks.where('parentTaskId').equals(parentId).toArray()
    const task: Task = {
      id: createId(),
      title: trimmed,
      description: '',
      date: parent.date,
      status: 'open',
      sortOrder: nextSortOrder(siblings),
      parentTaskId: parentId,
      createdAt: now,
      updatedAt: now,
    }
    await this.db.tasks.add(task)
    return task
  }

  async updateTask(
    id: string,
    changes: Partial<Pick<Task, 'title' | 'description'>>,
  ): Promise<Task> {
    const task = await this.requireTask(id)
    const now = new Date().toISOString()
    const title = changes.title !== undefined ? changes.title.trim() : task.title
    if (!title) {
      throw new Error('Tytuł zadania nie może być pusty.')
    }
    const updated: Task = {
      ...task,
      title,
      description: changes.description !== undefined ? changes.description : task.description,
      updatedAt: now,
    }
    await this.db.tasks.put(updated)
    return updated
  }

  async setTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const task = await this.requireTask(id)
    const updated: Task = { ...task, status, updatedAt: new Date().toISOString() }
    await this.db.tasks.put(updated)
    return updated
  }

  async deleteTask(id: string): Promise<void> {
    const task = await this.requireTask(id)
    const children = await this.db.tasks.where('parentTaskId').equals(task.id).toArray()
    await this.db.transaction('rw', this.db.tasks, async () => {
      await this.db.tasks.bulkDelete([task.id, ...children.map((child) => child.id)])
    })
  }

  async reorderRootTasks(date: string, orderedOpenIds: string[]): Promise<void> {
    const all = await this.db.tasks.where('date').equals(date).toArray()
    const roots = displayOrder(rootTasksOnDate(all, date))
    const open = roots.filter((task) => task.status === 'open')
    const completed = roots.filter((task) => task.status === 'completed')
    const openById = new Map(open.map((task) => [task.id, task]))
    const reorderedOpen = orderedOpenIds.flatMap((id) => {
      const task = openById.get(id)
      return task ? [task] : []
    })
    const now = new Date().toISOString()
    const updates = [...reorderedOpen, ...completed].map((task, index) => ({
      ...task,
      sortOrder: index,
      updatedAt: now,
    }))
    await this.db.tasks.bulkPut(updates)
  }

  async moveRootTask(id: string, targetDate: string): Promise<void> {
    const task = await this.requireTask(id)
    if (task.parentTaskId) {
      throw new Error('Podzadań nie przenosi się osobno.')
    }
    if (task.date === targetDate) return
    const now = new Date().toISOString()
    const targetRoots = (await this.db.tasks.where('date').equals(targetDate).toArray()).filter(
      (item) => item.parentTaskId === null,
    )
    const children = await this.db.tasks.where('parentTaskId').equals(task.id).toArray()
    const updatedParent: Task = {
      ...task,
      date: targetDate,
      sortOrder: nextSortOrder(targetRoots),
      updatedAt: now,
    }
    const updatedChildren = children.map((child) => ({
      ...child,
      date: targetDate,
      updatedAt: now,
    }))
    await this.db.transaction('rw', this.db.tasks, async () => {
      await this.db.tasks.put(updatedParent)
      if (updatedChildren.length > 0) {
        await this.db.tasks.bulkPut(updatedChildren)
      }
    })
  }

  async setDayVariant(date: string, variant: DifficultyVariant | null): Promise<DayPlan> {
    const plan: DayPlan = {
      date,
      difficultyVariantId: variant?.id ?? null,
      difficultyVariantNameSnapshot: variant?.name ?? null,
      updatedAt: new Date().toISOString(),
    }
    await this.db.dayPlans.put(plan)
    return plan
  }

  async createVariant(name: string): Promise<DifficultyVariant[]> {
    const next = addVariant(await this.listVariants(), name)
    await this.db.variants.bulkPut(next)
    return next
  }

  async renameDayVariant(id: string, name: string): Promise<DifficultyVariant[]> {
    const next = renameVariant(await this.listVariants(), id, name)
    await this.db.variants.bulkPut(next)
    return next
  }

  async deleteVariant(
    id: string,
    replacementId: string | null,
  ): Promise<{ variants: DifficultyVariant[]; usedCount: number }> {
    const usedCount = await this.db.dayPlans.where('difficultyVariantId').equals(id).count()
    const variants = await this.listVariants()
    const next = removeVariant(variants, id)
    const replacement = replacementId
      ? next.find((variant) => variant.id === replacementId)
      : null
    await this.db.transaction('rw', this.db.variants, this.db.dayPlans, async () => {
      await this.db.variants.clear()
      await this.db.variants.bulkAdd(next)
      const plans = await this.db.dayPlans.where('difficultyVariantId').equals(id).toArray()
      if (plans.length === 0) return
      const updated = plans.map((plan) => ({
        ...plan,
        difficultyVariantId: replacement?.id ?? null,
        difficultyVariantNameSnapshot: replacement?.name ?? plan.difficultyVariantNameSnapshot,
        updatedAt: new Date().toISOString(),
      }))
      await this.db.dayPlans.bulkPut(updated)
    })
    return { variants: next, usedCount }
  }

  async countVariantUsage(id: string): Promise<number> {
    return this.db.dayPlans.where('difficultyVariantId').equals(id).count()
  }

  private async requireTask(id: string): Promise<Task> {
    const task = await this.db.tasks.get(id)
    if (!task) {
      throw new Error('Nie znaleziono zadania.')
    }
    return task
  }
}
