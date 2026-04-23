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
  const { status, dueInDays, priorityLevel, priorityScore } = getTaskView(task)

  const statusClassName =
    status === 'Completed'
      ? 'rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-xs'
      : status === 'Overdue'
        ? 'rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-xs'
        : status === 'Due soon'
          ? 'rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-xs'
          : 'rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 text-xs'

  const priorityClassName =
    priorityLevel === 'Critical'
      ? 'border-white/10 bg-white/5'
      : priorityLevel === 'High'
        ? 'border-white/10 bg-white/5'
        : priorityLevel === 'Medium'
          ? 'border-white/10 bg-white/5'
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
      className={`rounded-xl border p-4 ${priorityClassName}`}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_260px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{task.title}</span>
            <span className={statusClassName}>{status}</span>
          </div>

          {task.description ? (
            <p className="mt-1 opacity-80">{task.description}</p>
          ) : null}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onToggleCompleted(task.id)}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2"
            >
              {task.completedAt ? 'Reopen' : 'Complete'}
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2"
            >
              Delete
            </button>
          </div>
        </div>

        <dl className="m-0 grid gap-1 text-sm">
          <div className="grid grid-cols-[72px_1fr] gap-2">
            <dt className="opacity-70">Due</dt>
            <dd className="m-0">{task.dueDate ?? '—'}</dd>
          </div>
          <div className="grid grid-cols-[72px_1fr] gap-2">
            <dt className="opacity-70">In</dt>
            <dd className="m-0">{dueInText}</dd>
          </div>
          <div className="grid grid-cols-[72px_1fr] gap-2">
            <dt className="opacity-70">Repeat</dt>
            <dd className="m-0">
              {task.repeatRule}
              {task.repeatInterval ? ` (${task.repeatInterval})` : ''}
            </dd>
          </div>
          <div className="grid grid-cols-[72px_1fr] gap-2">
            <dt className="opacity-70">Prio</dt>
            <dd className="m-0">
              {task.manualPriority ? `Manual ${task.manualPriority} ` : ''}
              {/* {priorityLevel} ({priorityScore}) */}
            </dd>
          </div>
          <div className="grid grid-cols-[72px_1fr] gap-2">
            <dt className="opacity-70">Overdue</dt>
            <dd className="m-0">{task.overdueCount}</dd>
          </div>
        </dl>
      </div>
    </li>
  )
}

export default function TaskList({ tasks, onToggleCompleted, onDelete }: Props) {
  return (
    <section>
      <h2 className="mb-1 text-xl font-semibold">Tasks</h2>
      <p className="mb-3 text-xs opacity-70">Separate list (priority-based)</p>

      <ul className="m-0 grid list-none gap-3 p-0">
        {tasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            onToggleCompleted={onToggleCompleted}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </section>
  )
}
