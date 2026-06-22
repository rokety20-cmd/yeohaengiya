import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, set } from 'firebase/database'
import { db } from '../firebase'

const prefRef = (tripId, dateOptionId, memberId) =>
  ref(db, `trips/${tripId}/preferences/${dateOptionId}/${memberId}`)
const allPrefsRef = (tripId) => ref(db, `trips/${tripId}/preferences`)

export function usePreferences(tripId) {
  const [preferences, setPreferences] = useState({})

  useEffect(() => {
    if (!tripId) return
    const unsub = onValue(allPrefsRef(tripId), (snap) => {
      setPreferences(snap.val() || {})
    })
    return () => unsub()
  }, [tripId])

  // choice: 'prefer' | 'ok' | 'no'
  const castPreference = useCallback((memberId, dateId, choice) => {
    if (!tripId || !memberId || !dateId) return
    set(prefRef(tripId, dateId, memberId), choice)
  }, [tripId])

  return { preferences, castPreference }
}
