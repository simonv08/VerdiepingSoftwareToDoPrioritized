import type { Task } from '../Features/tasks/taskModel'
import type { User } from 'firebase/auth'
import { getFirebase } from './firebase'
import { createFirebaseTasksService } from './tasksFirebaseService'

export type TasksService = {
  fetchTasks: () => Promise<Task[]>
  subscribeTasks?: (onTasks: (tasks: Task[]) => void, onError: (error: Error) => void) => () => void
  replaceAllTasks: (tasks: Task[]) => Promise<Task[]>
  saveTask: (task: Task) => Promise<Task>
  updateTask: (task: Task) => Promise<Task>
  deleteTask: (taskId: string) => Promise<void>
}

export function createTasksServiceForUser(user: User): TasksService {
  const { db } = getFirebase()
  return createFirebaseTasksService(db, user.uid)
}
