import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, push, update, remove } from 'firebase/database'
import { db } from '../firebase'
import { DEFAULT_SHARED_ITEMS, DEFAULT_PERSONAL_ITEMS } from '../constants'

const packingRef = (tripId) => ref(db, `trips/${tripId}/packingItems`)
const itemRef = (tripId, itemId) => ref(db, `trips/${tripId}/packingItems/${itemId}`)

export function usePackingItems(tripId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) { setLoading(false); return }
    const timeout = setTimeout(() => setLoading(false), 3000)

    const unsub = onValue(packingRef(tripId), (snap) => {
      clearTimeout(timeout)
      const val = snap.val()
      const list = val
        ? Object.entries(val)
            .map(([id, data]) => ({ id, ...data }))
            .filter((i) => !i.isDeleted)
            .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
        : []
      setItems(list)
      setLoading(false)
    })
    return () => { unsub(); clearTimeout(timeout) }
  }, [tripId])

  // 아이템 추가
  const addItem = useCallback((text, category, assignedTo = null) => {
    if (!tripId || !text.trim()) return
    push(packingRef(tripId), {
      text: text.trim(),
      category, // 'shared' | 'personal'
      assignedTo,
      done: false,
      createdAt: Date.now(),
    })
  }, [tripId])

  // 완료 토글
  const toggleDone = useCallback((itemId, current) => {
    if (!tripId) return
    update(itemRef(tripId, itemId), { done: !current })
  }, [tripId])

  // 담당자 변경
  const assignTo = useCallback((itemId, friendId) => {
    if (!tripId) return
    update(itemRef(tripId, itemId), { assignedTo: friendId || null })
  }, [tripId])

  // 삭제
  const deleteItem = useCallback((itemId) => {
    if (!tripId) return
    remove(itemRef(tripId, itemId))
  }, [tripId])

  // 기본 아이템 시드 (처음 한 번만)
  const seedDefaults = useCallback(() => {
    if (!tripId) return
    DEFAULT_SHARED_ITEMS.forEach((i) => {
      push(packingRef(tripId), { text: i.text, category: 'shared', assignedTo: null, done: false, createdAt: Date.now() })
    })
    DEFAULT_PERSONAL_ITEMS.forEach((i) => {
      push(packingRef(tripId), { text: i.text, category: 'personal', assignedTo: null, done: false, createdAt: Date.now() })
    })
  }, [tripId])

  const sharedItems = items.filter((i) => i.category === 'shared')
  const personalItems = items.filter((i) => i.category === 'personal')

  return { items, sharedItems, personalItems, loading, addItem, toggleDone, assignTo, deleteItem, seedDefaults }
}
