import { describe, expect, it } from 'vitest'
import { allSubtasksCompleted, canHaveSubtasks, displayOrder, nextSortOrder } from './tasks.ts'
import type { Task } from './types.ts'

function task(partial: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    description: '',
    date: '2026-10-11',
    status: 'open',
    sortOrder: 0,
    parentTaskId: null,
    createdAt: '2026-10-11T10:00:00.000Z',
    updatedAt: '2026-10-11T10:00:00.000Z',
    ...partial,
  }
}

describe('tasks', () => {
  it('keeps completed tasks at the bottom while preserving relative order', () => {
    const tasks = [
      task({ id: 'a', title: 'A', sortOrder: 2, status: 'completed' }),
      task({ id: 'b', title: 'B', sortOrder: 0, status: 'open' }),
      task({ id: 'c', title: 'C', sortOrder: 1, status: 'completed' }),
      task({ id: 'd', title: 'D', sortOrder: 3, status: 'open' }),
    ]
    expect(displayOrder(tasks).map((item) => item.id)).toEqual(['b', 'd', 'c', 'a'])
  })

  it('does not allow nested subtasks', () => {
    const child = task({ id: 'child', title: 'Child', parentTaskId: 'parent' })
    expect(canHaveSubtasks(child)).toBe(false)
  })

  it('does not auto-complete a parent when children are done', () => {
    const tasks = [
      task({ id: 'parent', title: 'Parent' }),
      task({ id: 'c1', title: 'C1', parentTaskId: 'parent', status: 'completed' }),
      task({ id: 'c2', title: 'C2', parentTaskId: 'parent', status: 'completed' }),
    ]
    expect(allSubtasksCompleted(tasks, 'parent')).toBe(true)
    expect(tasks.find((item) => item.id === 'parent')?.status).toBe('open')
  })

  it('assigns the next sort order', () => {
    expect(nextSortOrder([task({ id: 'a', title: 'A', sortOrder: 4 })])).toBe(5)
  })
})
