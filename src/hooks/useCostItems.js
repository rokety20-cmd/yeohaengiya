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

  const addExpense = useCallback((label, totalAmount, payerId, participantIds, category = 'other', linkedPackingItemId = null) => {
    if (!tripId || !label.trim()) return
    push(costRef(tripId), {
      label: label.trim(),
      totalAmount: Math.round(Number(totalAmount) || 0),
      payerId,
      participantIds: participantIds ?? [],
      category,
      linkedPackingItemId,
      isDeleted: false,
      createdAt: Date.now(),
    })
  }, [tripId])

  const updateAmount = useCallback((itemId, totalAmount) => {
    if (!tripId) return
    update(itemRef(tripId, itemId), { totalAmount: Math.round(Number(totalAmount) || 0) })
  }, [tripId])

  const updateExpense = useCallback((itemId, fields) => {
    if (!tripId) return
    const patch = { ...fields }
    if (patch.totalAmount !== undefined) patch.totalAmount = Math.round(Number(patch.totalAmount) || 0)
    update(itemRef(tripId, itemId), patch)
  }, [tripId])

  const deleteItem = useCallback((itemId) => {
    if (!tripId) return
    remove(itemRef(tripId, itemId))
  }, [tripId])

  // 기본 항목 시드 (headCount 기준으로 총 금액 계산)
  const seedExpenses = useCallback((headCount = 6, memberIds = []) => {
    if (!tripId) return
    DEFAULT_COST_ITEMS.filter((i) => !i.perNight).forEach((i) => {
      push(costRef(tripId), {
        label: i.label,
        totalAmount: i.amount * headCount,
        payerId: memberIds[0] ?? null,
        participantIds: memberIds,
        category: 'other',
        linkedPackingItemId: null,
        isDeleted: false,
        createdAt: Date.now(),
      })
    })
  }, [tripId])

  return { items, loading, addExpense, updateAmount, updateExpense, deleteItem, seedExpenses }
}

// alias
export const useExpenses = useCostItems
