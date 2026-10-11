import type { Task } from './types.ts'

export function isRootTask(task: Task): boolean {
  return task.parentTaskId === null
}

export function canHaveSubtasks(task: Task): boolean {
  return isRootTask(task)
}

export function subtasksOf(tasks: Task[], parentId: string): Task[] {
  return tasks
    .filter((task) => task.parentTaskId === parentId)
    .sort(compareBySortOrder)
}

export function rootTasksOnDate(tasks: Task[], date: string): Task[] {
  return tasks.filter((task) => task.date === date && isRootTask(task)).sort(compareBySortOrder)
}

export function compareBySortOrder(a: Task, b: Task): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  return a.createdAt.localeCompare(b.createdAt)
}

export function displayOrder(tasks: Task[]): Task[] {
  const open = tasks.filter((task) => task.status === 'open').sort(compareBySortOrder)
  const completed = tasks.filter((task) => task.status === 'completed').sort(compareBySortOrder)
  return [...open, ...completed]
}

export function nextSortOrder(tasks: Task[]): number {
  if (tasks.length === 0) return 0
  return Math.max(...tasks.map((task) => task.sortOrder)) + 1
}

export function allSubtasksCompleted(tasks: Task[], parentId: string): boolean {
  const children = subtasksOf(tasks, parentId)
  return children.length > 0 && children.every((task) => task.status === 'completed')
}

export function applyReorder(orderedIds: string[], tasks: Task[]): Task[] {
  const byId = new Map(tasks.map((task) => [task.id, task]))
  return orderedIds.flatMap((id, index) => {
    const task = byId.get(id)
    if (!task) return []
    return [{ ...task, sortOrder: index }]
  })
}

export function tasksByDate(tasks: Task[]): Map<string, Task[]> {
  const grouped = new Map<string, Task[]>()
  for (const task of tasks) {
    const list = grouped.get(task.date) ?? []
    list.push(task)
    grouped.set(task.date, list)
  }
  return grouped
}
