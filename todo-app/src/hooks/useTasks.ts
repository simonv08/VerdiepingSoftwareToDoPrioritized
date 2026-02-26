import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Task } from '../Features/tasks/taskModel'
import type { NewTaskInput } from '../Features/tasks/taskMutations'
import { addTask, deleteTask, toggleTaskCompleted } from '../Features/tasks/taskMutations'
import { createTasksServiceForUser } from '../service/tasksService'
import { useAuth } from './useAuth'
import { diffTasks } from '../Features/tasks/taskDiff'

type State = {
  tasks: Task[]
  loading: boolean
  syncing: boolean
  error: string | null
}

export function useTasks() {
  const auth = useAuth()

  const [state, setState] = useState<State>({ tasks: [], loading: true, syncing: false, error: null })

  const service = useMemo(() => {
    if (!auth.user || auth.error) return null
    return createTasksServiceForUser(auth.user)
  }, [auth.user, auth.error])

  useEffect(() => {
    if (!service) return
    setState((s) => ({ ...s, loading: true, error: null }))
  }, [service])

  const writeQueueRef = useRef(Promise.resolve())
  const pendingWritesRef = useRef(0)

  const enqueueWrite = useCallback(async (work: () => Promise<void>) => {
    pendingWritesRef.current += 1
    setState((s) => ({ ...s, syncing: true }))

    const job = writeQueueRef.current.then(async () => {
      try {
        await work()
      } finally {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1)
        const stillSyncing = pendingWritesRef.current > 0
        setState((s) => ({ ...s, syncing: stillSyncing }))
      }
    })

    // Keep the queue alive even if this job fails.
    writeQueueRef.current = job.catch(() => undefined)
    return job
  }, [])

  const persistNext = useCallback(
    async (prevTasks: Task[], nextTasks: Task[]) => {
      if (!service) {
        throw new Error('Sign in to sync tasks.')
      }

      const { added, updated, removedIds } = diffTasks(prevTasks, nextTasks)

      await Promise.all([
        ...added.map((t) => service.saveTask(t)),
        ...updated.map((t) => service.updateTask(t)),
        ...removedIds.map((id) => service.deleteTask(id)),
      ])
    },
    [service],
  )

  const load = useCallback(async () => {
    if (!service) {
      setState((s) => ({ ...s, tasks: [], loading: false, syncing: false, error: null }))
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const tasks = await service.fetchTasks()
      setState((s) => ({ ...s, tasks, loading: false, error: null }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState((s) => ({ ...s, loading: false, error: msg }))
    }
  }, [service])

  useEffect(() => {
    // Avoid duplicate reads: if we have a realtime subscription, let it provide the initial snapshot.
    if (!service?.subscribeTasks) {
      void load()
    }
  }, [load])

  useEffect(() => {
    if (!service?.subscribeTasks) return
    if (auth.loading || auth.error) return

    const unsub = service.subscribeTasks(
      (tasks) => {
        setState((s) => ({ ...s, tasks, loading: false, error: null }))
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message }))
      },
    )
    return () => unsub()
  }, [auth.error, auth.loading, service])

  const addAction = useCallback(async (input: NewTaskInput) => {
    if (!service) {
      setState((s) => ({ ...s, error: 'Sign in to add tasks.' }))
      return
    }

    let nextSnapshot: Task[] = []
    let prevSnapshot: Task[] = []
    setState((s) => {
      prevSnapshot = s.tasks
      nextSnapshot = addTask(s.tasks, input)
      return { ...s, tasks: nextSnapshot }
    })
    try {
      await enqueueWrite(() => persistNext(prevSnapshot, nextSnapshot))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState((s) => ({ ...s, tasks: prevSnapshot, error: msg }))
    }
  }, [enqueueWrite, persistNext, service])

  const toggleCompleteAction = useCallback(async (taskId: string) => {
    if (!service) {
      setState((s) => ({ ...s, error: 'Sign in to update tasks.' }))
      return
    }

    let nextSnapshot: Task[] = []
    let prevSnapshot: Task[] = []
    setState((s) => {
      prevSnapshot = s.tasks
      nextSnapshot = toggleTaskCompleted(s.tasks, taskId)
      return { ...s, tasks: nextSnapshot }
    })
    try {
      await enqueueWrite(() => persistNext(prevSnapshot, nextSnapshot))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState((s) => ({ ...s, tasks: prevSnapshot, error: msg }))
    }
  }, [enqueueWrite, persistNext, service])

  const removeAction = useCallback(async (taskId: string) => {
    if (!service) {
      setState((s) => ({ ...s, error: 'Sign in to delete tasks.' }))
      return
    }

    let nextSnapshot: Task[] = []
    let prevSnapshot: Task[] = []
    setState((s) => {
      prevSnapshot = s.tasks
      nextSnapshot = deleteTask(s.tasks, taskId)
      return { ...s, tasks: nextSnapshot }
    })
    try {
      await enqueueWrite(() => persistNext(prevSnapshot, nextSnapshot))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState((s) => ({ ...s, tasks: prevSnapshot, error: msg }))
    }
  }, [enqueueWrite, persistNext, service])

  return {
    tasks: state.tasks,
    loading: auth.loading ? true : auth.user ? state.loading : false,
    syncing: auth.user ? state.syncing : false,
    error: state.error,
    retry: load,
    actions: {
      add: addAction,
      toggleComplete: toggleCompleteAction,
      remove: removeAction,
    },
  }
}
