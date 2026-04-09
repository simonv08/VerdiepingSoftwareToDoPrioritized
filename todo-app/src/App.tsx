import './App.css'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import BackgroundLines from './Components/BackgroundLines'
import TaskForm from './Components/TaskForm'
import GroceryList from './Components/GroceryList'
import TaskList from './Components/TaskList'
import type { NewTaskInput } from './Features/tasks/taskMutations'
import { selectVisibleTasks } from './Features/tasks/taskSelectors'
import { sortTasksByPriority } from './Features/tasks/priority'
import { useTasks } from './hooks/useTasks'
import { useGroceries } from './hooks/useGroceries'
import { useAuth } from './hooks/useAuth'

interface WidgetPlugin {
  updateWidgetData(options: { tasks: string; groceries: string }): Promise<void>
  getWidgetData(): Promise<{ tasks: string; groceries: string }>
  addListener(eventName: 'widgetUpdate', listenerFunc: () => void): Promise<PluginListenerHandle>
}
const WidgetPlugin = registerPlugin<WidgetPlugin>('WidgetPlugin')

function App() {
  const { tasks, loading, syncing, error, retry, actions } = useTasks()
  const groceries = useGroceries()
  const auth = useAuth()
  const [addOpen, setAddOpen] = useState(false)
  const [lastWidgetActionTime, setLastWidgetActionTime] = useState(0)

  function handleAddTask(input: NewTaskInput) {
    void actions.add(input)
    setAddOpen(false)
  }

  function handleDeleteTask(taskId: string) {
    void actions.remove(taskId)
  }

  function handleToggleCompleted(taskId: string) {
    void actions.toggleComplete(taskId)
  }

  const visibleSortedTasks = useMemo(() => {
    const visible = selectVisibleTasks(tasks)
    return sortTasksByPriority(visible)
  }, [tasks])

  // Sync with native widget whenever data changes
  useEffect(() => {
    // SAFETY GUARD: Do not sync if we are still loading or if data is missing
    if (loading || groceries.syncing || auth.loading) return

    // Additional Safety: If lists are empty but we aren't signed in yet, don't wipe the widget
    if (!auth.user && tasks.length === 0 && groceries.items.length === 0) return

    // COOLDOWN: Don't push data TO the widget if we just received data FROM the widget
    if (Date.now() - lastWidgetActionTime < 3000) return

    if (Capacitor.isNativePlatform()) {
      const widgetData = {
        tasks: JSON.stringify(visibleSortedTasks),
        groceries: JSON.stringify(groceries.items)
      }
      console.log("Pushing data to widget:", visibleSortedTasks.length, "tasks");
      void WidgetPlugin.updateWidgetData(widgetData)
    }
  }, [visibleSortedTasks, groceries.items, loading, groceries.syncing, auth.loading, auth.user, lastWidgetActionTime, tasks.length])

  // Process changes made in the widget
  const syncWithWidgetData = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return
    try {
      setLastWidgetActionTime(Date.now()) // Start cooldown
      const data = await WidgetPlugin.getWidgetData()
      const widgetTasks = JSON.parse(data.tasks)
      const widgetGroceries = JSON.parse(data.groceries)

      // Check for completed tasks in widget
      let changed = false
      widgetTasks.forEach((wt: any) => {
        const appTask = tasks.find(t => t.id === wt.id)
        if (appTask && wt.completed && !appTask.completedAt) {
          void actions.toggleComplete(wt.id)
          changed = true
        }
        if (appTask && wt.deleted) {
          void actions.remove(wt.id)
          changed = true
        }
      })

      // Check for bought groceries in widget
      widgetGroceries.forEach((wg: any) => {
        const appGroc = groceries.items.find(g => g.id === wg.id)
        if (appGroc && wg.bought && !appGroc.boughtAt) {
          void groceries.actions.toggleBought(wg.id)
          changed = true
        }
        if (appGroc && wg.deleted) {
          void groceries.actions.remove(wg.id)
          changed = true
        }
      })

      // If we processed changes from the widget, tell the widget to "reset" its local changes
      // to avoid the flickering loop
      if (changed) {
        console.log("Widget changes processed, refreshing widget data...")
        const widgetData = {
          tasks: JSON.stringify(visibleSortedTasks),
          groceries: JSON.stringify(groceries.items)
        }
        void WidgetPlugin.updateWidgetData(widgetData)
      }
    } catch (e) {
      console.error("Failed to sync widget changes", e)
    }
  }, [tasks, groceries.items, actions, groceries.actions])

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const listener = WidgetPlugin.addListener('widgetUpdate', () => {
        console.log("Widget updated, syncing app...")
        void syncWithWidgetData()
      })
      return () => {
        void listener.then(l => l.remove())
      }
    }
  }, [syncWithWidgetData])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncWithWidgetData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    void syncWithWidgetData() // Run on mount
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [syncWithWidgetData])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <BackgroundLines />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <BackgroundLines />
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            {auth.user && !auth.user.isAnonymous ? (
              <>
                <span className="text-sm opacity-75">
                  Signed in{auth.user.email ? `: ${auth.user.email}` : auth.user.displayName ? `: ${auth.user.displayName}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => void auth.actions.signOut()}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void auth.actions.signInWithGoogle()}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2"
                disabled={auth.loading}
              >
                Continue with Google
              </button>
            )}
          </div>

          {auth.error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
              {auth.error}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2"
          disabled={!auth.user || auth.loading}
        >
          Add new
        </button>
      </div>

      {addOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-white/15 bg-black/80 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="m-0 text-xl font-semibold">New task</h2>
            <p className="mt-1 text-sm opacity-75">Set all fields, then add.</p>

            <div className="mt-4">
              <TaskForm onAddTask={handleAddTask} onCancel={() => setAddOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}

      <main>
        {loading ? <p className="mb-3 opacity-75">Loading…</p> : null}
        {syncing ? <p className="mb-3 text-sm opacity-75">Syncing…</p> : null}
        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="m-0">Error: {error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_360px]">
          <div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <TaskList
                tasks={visibleSortedTasks}
                onToggleCompleted={handleToggleCompleted}
                onDelete={handleDeleteTask}
              />
            </div>
          </div>
          <div>
            {groceries.error ? (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="m-0">Error: {groceries.error}</p>
                <button
                  type="button"
                  onClick={groceries.retry}
                  className="mt-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2"
                >
                  Retry
                </button>
              </div>
            ) : null}

            <GroceryList
              items={groceries.items}
              historyNames={groceries.historyNames}
              syncing={groceries.syncing}
              onAdd={(input) => void groceries.actions.add(input)}
              onToggleBought={(id) => void groceries.actions.toggleBought(id)}
              onDelete={(id) => void groceries.actions.remove(id)}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
