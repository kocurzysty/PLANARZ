import { afterEach, describe, expect, it } from 'vitest'
import { PlanarzDB } from './database.ts'
import { PlanRepository } from './repository.ts'

const databases: PlanarzDB[] = []

function repo() {
  const db = new PlanarzDB(`planarz-test-${crypto.randomUUID()}`)
  databases.push(db)
  return new PlanRepository(db)
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()))
})

describe('PlanRepository', () => {
  it('creates, edits, completes and restores a task', async () => {
    const repository = repo()
    const created = await repository.createRootTask('2026-10-11', '  Kup chleb ')
    expect(created.title).toBe('Kup chleb')
    const updated = await repository.updateTask(created.id, { title: 'Kup bułki', description: 'żytnie' })
    expect(updated.title).toBe('Kup bułki')
    expect(updated.description).toBe('żytnie')
    await repository.setTaskStatus(created.id, 'completed')
    const completed = await repository.listTasksInRange('2026-10-11', '2026-10-11')
    expect(completed[0].status).toBe('completed')
    await repository.setTaskStatus(created.id, 'open')
    const restored = await repository.listTasksInRange('2026-10-11', '2026-10-11')
    expect(restored[0].status).toBe('open')
  })

  it('creates one-level subtasks and deletes them with the parent', async () => {
    const repository = repo()
    const parent = await repository.createRootTask('2026-10-11', 'Porządki')
    const child = await repository.createSubtask(parent.id, 'Odkurzyć')
    await expect(repository.createSubtask(child.id, 'Nie wolno')).rejects.toThrow(/jeden poziom/)
    await repository.deleteTask(parent.id)
    const remaining = await repository.listTasksInRange('2026-10-11', '2026-10-11')
    expect(remaining).toHaveLength(0)
  })

  it('moves a task with subtasks to another day without duplicating', async () => {
    const repository = repo()
    const parent = await repository.createRootTask('2026-10-11', 'Wizyta')
    await repository.createSubtask(parent.id, 'Zabrać dokumenty')
    await repository.moveRootTask(parent.id, '2026-10-12')
    const monday = await repository.listTasksInRange('2026-10-11', '2026-10-11')
    const tuesday = await repository.listTasksInRange('2026-10-12', '2026-10-12')
    expect(monday).toHaveLength(0)
    expect(tuesday).toHaveLength(2)
    expect(tuesday.every((task) => task.date === '2026-10-12')).toBe(true)
  })

  it('keeps tasks when the day variant changes', async () => {
    const repository = repo()
    const variants = await repository.ensureSeeded()
    const task = await repository.createRootTask('2026-10-11', 'Spacerek')
    await repository.setDayVariant('2026-10-11', variants[0])
    await repository.setDayVariant('2026-10-11', variants[2])
    const tasks = await repository.listTasksInRange('2026-10-11', '2026-10-11')
    expect(tasks[0].id).toBe(task.id)
    expect(tasks[0].status).toBe('open')
  })
})
