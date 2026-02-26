export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'

export type ManualPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type Task = {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  repeatRule: RepeatRule
  repeatInterval: number | null
  manualPriority: ManualPriority | null
  completedAt: string | null
  archivedAt: string | null
  overdueCount: number
}

export function createTask(input: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    id: input.id,
    title: input.title,
    description: input.description ?? null,
    dueDate: input.dueDate ?? null,
    repeatRule: input.repeatRule ?? 'none',
    repeatInterval: input.repeatInterval ?? null,
    manualPriority: input.manualPriority ?? null,
    completedAt: input.completedAt ?? null,
    archivedAt: input.archivedAt ?? null,
    overdueCount: input.overdueCount ?? 0,
  }
}
