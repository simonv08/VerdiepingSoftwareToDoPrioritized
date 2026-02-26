import { useId, useMemo, useState, type FormEvent } from 'react'
import type { RepeatRule } from '../Features/tasks/taskModel'
import type { GroceryItem } from '../Features/groceries/groceryModel'
import type { NewGroceryItemInput } from '../Features/groceries/groceryMutations'
import { parseIsoDate } from '../Features/tasks/deadline'

type Props = {
  items: GroceryItem[]
  historyNames?: string[]
  syncing: boolean
  onAdd: (input: NewGroceryItemInput) => void
  onToggleBought: (id: string) => void
  onDelete: (id: string) => void
}

export default function GroceryList({ items, historyNames, syncing, onAdd, onToggleBought, onDelete }: Props) {
  const DRAFT_KEY = 'todo.groceries.draft.v1'
  const nameId = useId()
  const repeatId = useId()
  const intervalId = useId()

  const [text, setText] = useState(() => {
    try {
      return sessionStorage.getItem(DRAFT_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [addOpen, setAddOpen] = useState(false)
  const [repeatEnabled, setRepeatEnabled] = useState(false)
  const [repeatRule, setRepeatRule] = useState<RepeatRule>('weekly')
  const [repeatInterval, setRepeatInterval] = useState('1')

  const canSubmit = text.trim().length > 0

  const toBuy = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return items.filter(i => {
      if (i.boughtAt) return false
      if (!i.dueDate) return true
      return parseIsoDate(i.dueDate).getTime() <= today.getTime()
    })
  }, [items])
  const boughtItems = items.filter((i) => i.boughtAt)

  const nameHistory = useMemo(() => {
    const source = historyNames && historyNames.length > 0 ? historyNames : items.map((i) => i.name)
    const seen = new Set<string>()
    const out: string[] = []
    for (const raw of source) {
      const n = String(raw).trim()
      const key = n.toLowerCase()
      if (!n) continue
      if (seen.has(key)) continue
      seen.add(key)
      out.push(n)
    }
    return out
  }, [historyNames, items])

  const suggestions = useMemo(() => {
    const q = text.trim().toLowerCase()
    if (!q) return []
    return nameHistory
      .filter((n) => {
        const lower = n.toLowerCase()
        return lower !== q && lower.startsWith(q)
      })
      .slice(0, 4)
  }, [nameHistory, text])

  function updateText(next: string) {
    setText(next)
    try {
      sessionStorage.setItem(DRAFT_KEY, next)
    } catch {
      // ignore
    }
  }

  const parsedRepeatInterval = useMemo(() => {
    const n = Number(repeatInterval)
    if (!Number.isFinite(n)) return undefined
    return Math.max(1, Math.trunc(n))
  }, [repeatInterval])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return

    onAdd({
      name: text,
      repeatRule: repeatEnabled ? repeatRule : 'none',
      repeatInterval: repeatRule === 'none' ? undefined : parsedRepeatInterval,
    })

    // Clear immediately for the next add.
    updateText('')
    setRepeatEnabled(false)
    setRepeatRule('weekly')
    setRepeatInterval('1')
    setAddOpen(false)
  }

  function handleCancel() {
    // Keep draft text so reopening the form keeps your last input.
    setRepeatEnabled(false)
    setRepeatRule('weekly')
    setRepeatInterval('1')
    setAddOpen(false)
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-semibold">Groceries</h2>
          <p className="mt-1 text-xs opacity-70">Separate list (no priority)</p>
        </div>
        <div className="flex items-center gap-2">
          {syncing ? <span className="text-xs opacity-70">Syncing…</span> : null}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm"
          >
            Add grocery
          </button>
        </div>
      </div>

      {addOpen ? (
        <form onSubmit={handleSubmit} className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="grid gap-2">
            <label className="text-sm opacity-80" htmlFor={nameId}>
              Grocery
            </label>
            <input
              id={nameId}
              value={text}
              onChange={(ev) => updateText(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key !== 'Tab') return
                if (ev.shiftKey) return
                if (suggestions.length !== 1) return
                ev.preventDefault()
                updateText(suggestions[0]!)
              }}
              placeholder="e.g. Milk 1L"
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 outline-none focus:border-white/30"
            />

            {suggestions.length > 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-2 text-xs opacity-80">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1"
                      onMouseDown={(e) => {
                        // Prevent input blur before click.
                        e.preventDefault()
                        updateText(s)
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {suggestions.length === 1 ? <div className="mt-2 opacity-70">Tab to autocomplete</div> : null}
              </div>
            ) : null}
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <label className="flex items-center gap-2 text-sm opacity-80">
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(e) => setRepeatEnabled(e.target.checked)}
              />
              Repeat
            </label>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm opacity-80" htmlFor={repeatId}>
                  Every
                </label>
                <select
                  id={repeatId}
                  value={repeatRule}
                  onChange={(ev) => setRepeatRule(ev.target.value as RepeatRule)}
                  disabled={!repeatEnabled}
                  className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 outline-none focus:border-white/30 disabled:opacity-50"
                >
                  <option value="daily">daily</option>
                  <option value="weekly">weekly</option>
                  <option value="monthly">monthly</option>
                  <option value="custom">custom</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm opacity-80" htmlFor={intervalId}>
                  Interval
                </label>
                <input
                  id={intervalId}
                  inputMode="numeric"
                  value={repeatInterval}
                  onChange={(ev) => setRepeatInterval(ev.target.value)}
                  disabled={!repeatEnabled}
                  className="w-28 rounded-xl border border-white/15 bg-black/30 px-3 py-2 outline-none focus:border-white/30 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <p className="mb-2 text-xs font-semibold opacity-75">To buy</p>
        <table className="w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left opacity-70">
              <th className="px-2">Item</th>
              <th className="px-2">Repeat</th>
              <th className="px-2"></th>
            </tr>
          </thead>
          <tbody>
            {toBuy.map((i) => (
              <tr key={i.id} className="rounded-xl border border-white/10 bg-black/30">
                <td className="px-2 py-2">
                  <span>{i.name}</span>
                </td>
                <td className="px-2 py-2 opacity-80">
                  {i.repeatRule === 'none' ? '—' : `${i.repeatRule}${i.repeatInterval ? ` (${i.repeatInterval})` : ''}`}
                </td>
                <td className="px-2 py-2">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleBought(i.id)}
                      className="rounded-lg border border-white/15 bg-white/10 px-2 py-1"
                    >
                      Bought
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(i.id)}
                      className="rounded-lg border border-red-500/35 bg-red-500/10 px-2 py-1"
                    >
                      Del
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {boughtItems.length > 0 ? (
          <>
            <p className="mb-2 mt-4 text-xs font-semibold opacity-75">Bought</p>
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left opacity-70">
                  <th className="px-2">Item</th>
                  <th className="px-2">Repeat</th>
                  <th className="px-2"></th>
                </tr>
              </thead>
              <tbody>
                {boughtItems.map((i) => (
                  <tr key={i.id} className="rounded-xl border border-white/10 bg-black/20">
                    <td className="px-2 py-2">
                      <span className="line-through opacity-60">{i.name}</span>
                    </td>
                    <td className="px-2 py-2 opacity-70">
                      {i.repeatRule === 'none'
                        ? '—'
                        : `${i.repeatRule}${i.repeatInterval ? ` (${i.repeatInterval})` : ''}`}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleBought(i.id)}
                          className="rounded-lg border border-white/15 bg-white/5 px-2 py-1"
                        >
                          Undo
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(i.id)}
                          className="rounded-lg border border-red-500/35 bg-red-500/10 px-2 py-1"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
      </div>
    </section>
  )
}
