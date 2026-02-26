import type { Task } from '../Features/tasks/taskModel'
import type { TasksService } from './tasksService'
import {
  addDoc,
  onSnapshot,
  writeBatch,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore'

type StoredTask = Task & {
  createdAt?: unknown
  updatedAt?: unknown
}

function stripServerFields(task: Task): Task {
  const { createdAt, updatedAt, ...rest } = task as Task & Record<string, unknown>
  void createdAt
  void updatedAt
  return rest as Task
}

function tasksCollection(db: Firestore, uid: string) {
  return collection(db, 'users', uid, 'tasks')
}

export function createFirebaseTasksService(db: Firestore, uid: string): TasksService {
  return {
    async fetchTasks() {
      const q = query(tasksCollection(db, uid), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data() as Task)
    },

    subscribeTasks(onTasks, onError) {
      const q = query(tasksCollection(db, uid), orderBy('createdAt', 'desc'))
      return onSnapshot(
        q,
        (snap) => {
          onTasks(snap.docs.map((d) => d.data() as Task))
        },
        (err) => {
          onError(err)
        },
      )
    },

    async replaceAllTasks(tasks) {
      const col = tasksCollection(db, uid)
      const existingSnap = await getDocs(col)
      const existingIds = new Set(existingSnap.docs.map((d) => d.id))
      const nextIds = new Set(tasks.map((t) => t.id))

      const batch = writeBatch(db)

      // Upsert all next tasks
      for (const task of tasks) {
        const clean = stripServerFields(task)
        const payload: StoredTask = {
          ...clean,
          updatedAt: serverTimestamp(),
          ...(existingIds.has(task.id) ? {} : { createdAt: serverTimestamp() }),
        }
        batch.set(doc(col, task.id), payload, { merge: true })
      }

      // Delete missing
      for (const d of existingSnap.docs) {
        if (!nextIds.has(d.id)) {
          batch.delete(d.ref)
        }
      }

      await batch.commit()
      return tasks
    },

    async saveTask(task) {
      const clean = stripServerFields(task)
      // If id is client-generated, store with that id; otherwise create doc id.
      if (clean.id) {
        const payload: StoredTask = { ...clean, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
        await setDoc(doc(tasksCollection(db, uid), task.id), payload)
        return task
      }

      const payload: StoredTask = { ...clean, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      const ref = await addDoc(tasksCollection(db, uid), payload)
      return { ...task, id: ref.id }
    },

    async updateTask(task) {
      const clean = stripServerFields(task)
      const payload: StoredTask = { ...clean, updatedAt: serverTimestamp() }
      await setDoc(doc(tasksCollection(db, uid), task.id), payload, { merge: true })
      return task
    },

    async deleteTask(taskId) {
      await deleteDoc(doc(tasksCollection(db, uid), taskId))
    },
  }
}
