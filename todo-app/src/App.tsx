import './App.css'
import { useMemo, useState } from 'react'
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

function App() {
  const { tasks, loading, syncing, error, retry, actions } = useTasks()
  const groceries = useGroceries()
  const auth = useAuth()
  const [addOpen, setAddOpen] = useState(false)

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
