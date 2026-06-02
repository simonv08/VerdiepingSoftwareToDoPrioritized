import type { Task } from '../Features/tasks/taskModel'
import { getTaskView } from '../Features/tasks/taskView'

type Props = {
  tasks: Task[]
  onToggleCompleted: (taskId: string) => void
  onDelete: (taskId: string) => void
}

type TaskListItemProps = {
  task: Task
  onToggleCompleted: (taskId: string) => void
  onDelete: (taskId: string) => void
}

function TaskListItem({ task, onToggleCompleted, onDelete }: TaskListItemProps) {
  const { status, dueInDays, priorityLevel } = getTaskView(task)

  const statusClassName =
    status === 'Completed'
      ? 'rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-xs'
      : status === 'Overdue'
        ? 'rounded-full border border-white/30 bg-white/15 px-1.5 py-0.5 text-xs'
        : status === 'Due soon'
          ? 'rounded-full border border-amber-400/30 bg-amber-500/15 px-1.5 py-0.5 text-xs'
          : 'rounded-full border border-indigo-400/30 bg-indigo-500/15 px-1.5 py-0.5 text-xs'

  const priorityClassName =
    priorityLevel === 'Critical'
      ? 'border-red-500/30 bg-red-500/10'
      : priorityLevel === 'High'
        ? 'border-orange-500/30 bg-orange-500/10'
        : priorityLevel === 'Medium'
          ? 'border-yellow-500/30 bg-yellow-500/10'
          : 'border-white/10'

  const dueInText =
    dueInDays === null
      ? '—'
      : dueInDays === 0
        ? 'today'
        : `${dueInDays}d`

  return (
    <li
      key={task.id}
      className={`rounded-lg border p-2.5 text-sm ${priorityClassName}`}
    >
      <div className="space-y-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-sm">{task.title}</span>
            <span className={statusClassName}>{status}</span>
          </div>

          {task.description ? (
            <p className="mt-0.5 text-xs opacity-75 line-clamp-1">{task.description}</p>
          ) : null}
        </div>

        {/* Compact metadata */}
        <div className="text-xs opacity-60 space-y-0.5">
          {task.dueDate && (
            <div>
              <span className="opacity-70">Due:</span> {task.dueDate} ({dueInText})
            </div>
          )}
          {task.repeatRule !== 'none' && (
            <div>
              <span className="opacity-70">Repeat:</span> {task.repeatRule}
              {task.repeatInterval ? ` (${task.repeatInterval})` : ''}
            </div>
          )}
        </div>

        {/* Compact buttons */}
        <div className="flex gap-1 pt-1">
          <button
            type="button"
            onClick={() => onToggleCompleted(task.id)}
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 text-xs hover:bg-white/10 transition-colors"
          >
            {task.completedAt ? '↶ Reopen' : '✓ Done'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 text-xs hover:bg-white/10 transition-colors"
          >
            ✕ Delete
          </button>
        </div>
      </div>
    </li>
  )
}

export default function TaskList({ tasks, onToggleCompleted, onDelete }: Props) {
  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold">Tasks</h2>

      <ul className="m-0 grid list-none gap-2 p-0">
        {tasks.length === 0 ? (
          <li className="text-xs opacity-60 py-4 text-center">No tasks yet</li>
        ) : (
          tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onToggleCompleted={onToggleCompleted}
              onDelete={onDelete}
            />
          ))
        )}
      </ul>
    </section>
  )
}
