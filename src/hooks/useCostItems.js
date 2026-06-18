import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, push, update, remove } from 'firebase/database'
import { db } from '../firebase'
import { DEFAULT_COST_ITEMS } from '../constants'

const costRef = (tripId) => ref(db, `trips/${tripId}/costItems`)
const itemRef = (tripId, itemId) => ref(db, `trips/${tripId}/costItems/${itemId}`)

export function useCostItems(tripId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) { setLoading(false); return }
    const timeout = setTimeout(() => setLoading(false), 3000)
    const unsub = onValue(costRef(tripId), (snap) => {
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

  // totalAmount = 총 금액 (인원수로 나눠서 1인당 계산)
  const addItem = useCallback((label, totalAmount) => {
    if (!tripId || !label.trim()) return
    push(costRef(tripId), {
      label: label.trim(),
      totalAmount: Math.round(Number(totalAmount) || 0),
      createdAt: Date.now(),
    })
  }, [tripId])

  const updateAmount = useCallback((itemId, totalAmount) => {
    if (!tripId) return
    update(itemRef(tripId, itemId), { totalAmount: Math.round(Number(totalAmount) || 0) })
  }, [tripId])

  const deleteItem = useCallback((itemId) => {
    if (!tripId) return
    remove(itemRef(tripId, itemId))
  }, [tripId])

  // 기본 항목 시드 (headCount 기준으로 총 금액 계산)
  const seedDefaults = useCallback((headCount = 6) => {
    if (!tripId) return
    DEFAULT_COST_ITEMS.filter((i) => !i.perNight).forEach((i) => {
      push(costRef(tripId), {
        label: i.label,
        totalAmount: i.amount * headCount,
        createdAt: Date.now(),
      })
    })
  }, [tripId])

  return { items, loading, addItem, updateAmount, deleteItem, seedDefaults }
}
