import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GroceryItem } from '../Features/groceries/groceryModel'
import type { NewGroceryItemInput } from '../Features/groceries/groceryMutations'
import { addGroceryItem, deleteGroceryItem, toggleGroceryBought } from '../Features/groceries/groceryMutations'
import { diffGroceries } from '../Features/groceries/groceryDiff'
import { createGroceriesServiceForUser } from '../service/groceriesService'
import { createGroceryHistoryService } from '../service/groceriesHistoryFirebaseService'
import { getFirebase } from '../service/firebase'
import { useAuth } from './useAuth'

type State = {
  items: GroceryItem[]
  historyNames: string[]
  loading: boolean
  syncing: boolean
  error: string | null
}

export function useGroceries() {
  const auth = useAuth()
  const service = useMemo(() => {
    if (!auth.user || auth.error) return null
    return createGroceriesServiceForUser(auth.user)
  }, [auth.user, auth.error])

  const historyService = useMemo(() => {
    if (!auth.user || auth.error) return null
    const { db } = getFirebase()
    return createGroceryHistoryService(db, auth.user.uid)
  }, [auth.user, auth.error])

  const [state, setState] = useState<State>({ items: [], historyNames: [], loading: true, syncing: false, error: null })

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
        setState((s) => ({ ...s, syncing: pendingWritesRef.current > 0 }))
      }
    })

    // Keep the queue alive even if this job fails.
    writeQueueRef.current = job.catch(() => undefined)
    return job
  }, [])

  const persistNext = useCallback(
    async (prevItems: GroceryItem[], nextItems: GroceryItem[]) => {
      if (!service) {
        throw new Error('Sign in to sync groceries.')
      }

      const { added, updated, removedIds } = diffGroceries(prevItems, nextItems)

      await Promise.all([
        ...added.map((i) => service.saveItem(i)),
        ...updated.map((i) => service.updateItem(i)),
        ...removedIds.map((id) => service.deleteItem(id)),
      ])
    },
    [service],
  )

  const load = useCallback(async () => {
    if (!service) {
      setState((s) => ({ ...s, items: [], historyNames: [], loading: false, syncing: false, error: null }))
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const items = await service.fetchItems()
      setState((s) => ({ ...s, items, loading: false, error: null }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState((s) => ({ ...s, loading: false, error: msg }))
    }
  }, [service])

  useEffect(() => {
    // Avoid duplicate reads: if we have a realtime subscription, let it provide the initial snapshot.
    if (!service?.subscribeItems) {
      void load()
    }
  }, [load])

  useEffect(() => {
    if (!service?.subscribeItems) return
    if (auth.loading || auth.error) return

    const unsub = service.subscribeItems(
      (items) => setState((s) => ({ ...s, items, loading: false, error: null })),
      (err) => setState((s) => ({ ...s, error: err.message })),
    )
    return () => unsub()
  }, [auth.error, auth.loading, service])

  useEffect(() => {
    if (!historyService) return
    if (auth.loading || auth.error) return

    const unsub = historyService.subscribeNames(
      (names) => setState((s) => ({ ...s, historyNames: names })),
      (err) => setState((s) => ({ ...s, error: err.message })),
    )
    return () => unsub()
  }, [auth.error, auth.loading, historyService])

  const addAction = useCallback(async (input: NewGroceryItemInput) => {
    if (!service) {
      setState((s) => ({ ...s, error: 'Sign in to add groceries.' }))
      return
    }

    let prevSnapshot: GroceryItem[] = []
    let nextSnapshot: GroceryItem[] = []
    setState((s) => {
      prevSnapshot = s.items
      nextSnapshot = addGroceryItem(s.items, input)
      return { ...s, items: nextSnapshot }
    })

    try {
      await enqueueWrite(async () => {
        await persistNext(prevSnapshot, nextSnapshot)
        await historyService?.recordName(input.name)
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState((s) => ({ ...s, items: prevSnapshot, error: msg }))
    }
  }, [enqueueWrite, historyService, persistNext, service])

  const toggleBoughtAction = useCallback(async (itemId: string) => {
    if (!service) {
      setState((s) => ({ ...s, error: 'Sign in to update groceries.' }))
      return
    }

    let prevSnapshot: GroceryItem[] = []
    let nextSnapshot: GroceryItem[] = []
    setState((s) => {
      prevSnapshot = s.items
      nextSnapshot = toggleGroceryBought(s.items, itemId)
      return { ...s, items: nextSnapshot }
    })

    try {
      await enqueueWrite(() => persistNext(prevSnapshot, nextSnapshot))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState((s) => ({ ...s, items: prevSnapshot, error: msg }))
    }
  }, [enqueueWrite, persistNext, service])

  const removeAction = useCallback(async (itemId: string) => {
    if (!service) {
      setState((s) => ({ ...s, error: 'Sign in to delete groceries.' }))
      return
    }

    let prevSnapshot: GroceryItem[] = []
    let nextSnapshot: GroceryItem[] = []
    setState((s) => {
      prevSnapshot = s.items
      nextSnapshot = deleteGroceryItem(s.items, itemId)
      return { ...s, items: nextSnapshot }
    })

    try {
      await enqueueWrite(() => persistNext(prevSnapshot, nextSnapshot))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState((s) => ({ ...s, items: prevSnapshot, error: msg }))
    }
  }, [enqueueWrite, persistNext, service])

  return {
    items: state.items,
    historyNames: state.historyNames,
    loading: auth.loading ? true : auth.user ? state.loading : false,
    syncing: auth.user ? state.syncing : false,
    error: state.error,
    retry: load,
    actions: {
      add: addAction,
      toggleBought: toggleBoughtAction,
      remove: removeAction,
    },
  }
}
