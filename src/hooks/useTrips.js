import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, set, push, update, get } from 'firebase/database'
import { db } from '../firebase'

const tripsRef = () => ref(db, 'trips')
const tripRef = (id) => ref(db, `trips/${id}`)
const tripPath = (id, path) => ref(db, `trips/${id}/${path}`)

export function useTrips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onValue(tripsRef(), (snap) => {
      const val = snap.val()
      const list = val
        ? Object.entries(val)
            .map(([id, data]) => ({ id, ...data }))
            .filter((t) => t.isDeleted !== true)
            .sort((a, b) => (b.meta?.createdAt ?? 0) - (a.meta?.createdAt ?? 0))
        : []
      setTrips(list)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const createTrip = useCallback(async (title, destination = '') => {
    const newRef = push(tripsRef())
    await set(newRef, {
      meta: {
        title,
        destination,
        status: 'planning',
        confirmedDate: null,
        createdAt: Date.now(),
      },
    })
    return newRef.key
  }, [])

  return { trips, loading, createTrip }
}

// 단일 여행 메타
export function useTripMeta(tripId) {
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) { setLoading(false); return }
    const unsub = onValue(tripPath(tripId, 'meta'), (snap) => {
      setMeta(snap.val())
      setLoading(false)
    })
    return () => unsub()
  }, [tripId])

  const updateMeta = useCallback((data) => {
    return update(tripPath(tripId, 'meta'), data)
  }, [tripId])

  return { meta, loading, updateMeta }
}

// 여행 참가자
export function useTripMembers(tripId) {
  const [memberIds, setMemberIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) { setLoading(false); return }
    const unsub = onValue(tripPath(tripId, 'members'), (snap) => {
      const val = snap.val()
      setMemberIds(val ? Object.keys(val).filter((k) => val[k] === true) : [])
      setLoading(false)
    })
    return () => unsub()
  }, [tripId])

  const addMember = useCallback((friendId) => {
    return set(tripPath(tripId, `members/${friendId}`), true)
  }, [tripId])

  const removeMember = useCallback((friendId) => {
    return set(tripPath(tripId, `members/${friendId}`), null)
  }, [tripId])

  return { memberIds, loading, addMember, removeMember }
}

// 여행 날짜 후보
export function useTripDateOptions(tripId) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) { setLoading(false); return }
    const unsub = onValue(tripPath(tripId, 'dateOptions'), (snap) => {
      const val = snap.val()
      const list = val
        ? Object.entries(val)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : []
      setOptions(list)
      setLoading(false)
    })
    return () => unsub()
  }, [tripId])

  const addOption = useCallback((data) => {
    return push(tripPath(tripId, 'dateOptions'), { ...data, order: Date.now() })
  }, [tripId])

  const removeOption = useCallback((optionId) => {
    return set(tripPath(tripId, `dateOptions/${optionId}`), null)
  }, [tripId])

  return { options, loading, addOption, removeOption }
}
