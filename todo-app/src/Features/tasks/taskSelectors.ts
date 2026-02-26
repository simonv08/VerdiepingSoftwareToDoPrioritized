import type { Task } from './taskModel'

export function selectVisibleTasks(tasks: Task[]): Task[] {
  // Archived tasks are history; keep them out of the main list.
  return tasks.filter((t) => !t.archivedAt)
}
