import type { Task } from './taskModel'

export type TaskDiff = {
  added: Task[]
  updated: Task[]
  removedIds: string[]
}

function stableStringify(task: Task): string {
  // Enough for small local tasks; used only for diffing.
  return JSON.stringify(task)
}

export function diffTasks(prev: Task[], next: Task[]): TaskDiff {
  const prevById = new Map(prev.map((t) => [t.id, t]))
  const nextById = new Map(next.map((t) => [t.id, t]))

  const added: Task[] = []
  const updated: Task[] = []
  const removedIds: string[] = []

  for (const [id, nextTask] of nextById) {
    const prevTask = prevById.get(id)
    if (!prevTask) {
      added.push(nextTask)
    } else if (stableStringify(prevTask) !== stableStringify(nextTask)) {
      updated.push(nextTask)
    }
  }

  for (const [id] of prevById) {
    if (!nextById.has(id)) {
      removedIds.push(id)
    }
  }

  return { added, updated, removedIds }
}
