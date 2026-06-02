import { useId, useMemo, useState, type FormEvent } from 'react'
import type { NewTaskInput } from '../Features/tasks/taskMutations'
import type { ManualPriority, RepeatRule } from '../Features/tasks/taskModel'

type Props = {
  onAddTask: (input: NewTaskInput) => void
  onCancel: () => void
}

export default function TaskForm({ onAddTask, onCancel }: Props) {
  const titleId = useId()
  const descId = useId()
  const dueId = useId()
  const repeatRuleId = useId()
  const repeatIntervalId = useId()
  const manualPriorityId = useId()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [repeatRule, setRepeatRule] = useState<RepeatRule>('none')
  const [repeatInterval, setRepeatInterval] = useState('1')
  const [manualPriority, setManualPriority] = useState<ManualPriority | ''>('')

  const parsedRepeatInterval = useMemo(() => {
    const n = Number(repeatInterval)
    if (!Number.isFinite(n)) return undefined
    const value = Math.max(1, Math.trunc(n))
    return value
  }, [repeatInterval])

  const canSubmit = title.trim().length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    onAddTask({
      title,
      description: description.trim() ? description : undefined,
      dueDate: dueDate || undefined,
      repeatRule,
      repeatInterval: repeatRule === 'none' ? undefined : parsedRepeatInterval,
      manualPriority: manualPriority || undefined,
    })

    setTitle('')
    setDescription('')
    setDueDate('')
    setRepeatRule('none')
    setRepeatInterval('1')
    setManualPriority('')
  }

  return (
    <form className="grid gap-2 text-xs" onSubmit={handleSubmit}>
      {/* Title - required field */}
      <div className="grid gap-1">
        <label className="opacity-70" htmlFor={titleId}>
          Title *
        </label>
        <input
          id={titleId}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task name…"
          autoComplete="off"
          className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm outline-none focus:border-white/30"
        />
      </div>

      {/* Due, Priority on one row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <label className="opacity-70" htmlFor={dueId}>
            Due
          </label>
          <input
            id={dueId}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm outline-none focus:border-white/30"
          />
        </div>

        <div className="grid gap-1">
          <label className="opacity-70" htmlFor={manualPriorityId}>
            Priority
          </label>
          <select
            id={manualPriorityId}
            value={manualPriority}
            onChange={(e) => setManualPriority(e.target.value as ManualPriority | '')}
            className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm outline-none focus:border-white/30"
          >
            <option value="">Auto</option>
            <option value="Low">Low</option>
            <option value="Medium">Med</option>
            <option value="High">High</option>
            <option value="Critical">Crit</option>
          </select>
        </div>
      </div>

      {/* Repeat on one row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <label className="opacity-70" htmlFor={repeatRuleId}>
            Repeat
          </label>
          <select
            id={repeatRuleId}
            value={repeatRule}
            onChange={(e) => setRepeatRule(e.target.value as RepeatRule)}
            className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm outline-none focus:border-white/30"
          >
            <option value="none">none</option>
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
            <option value="custom">custom</option>
          </select>
        </div>

        <div className="grid gap-1">
          <label className="opacity-70" htmlFor={repeatIntervalId}>
            Interval
          </label>
          <input
            id={repeatIntervalId}
            inputMode="numeric"
            value={repeatInterval}
            onChange={(e) => setRepeatInterval(e.target.value)}
            disabled={repeatRule === 'none'}
            className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm outline-none focus:border-white/30 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Description */}
      <div className="grid gap-1">
        <label className="opacity-70" htmlFor={descId}>
          Description
        </label>
        <textarea
          id={descId}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes…"
          rows={1}
          className="resize-y rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm outline-none focus:border-white/30"
        />
      </div>

      {/* Buttons */}
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-xs hover:bg-white/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </form>
  )
}
