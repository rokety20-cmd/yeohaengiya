import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, set } from 'firebase/database'
import { db } from '../firebase'

const confirmedRef = (tripId) => ref(db, `trips/${tripId}/meta/confirmedPension`)

export function useConfirmedPension(tripId) {
  const [confirmedPension, setConfirmedPension] = useState(null)

  useEffect(() => {
    if (!tripId) return
    const unsub = onValue(confirmedRef(tripId), (snap) => {
      setConfirmedPension(snap.val())
    })
    return () => unsub()
  }, [tripId])

  const confirmPension = useCallback((id) => {
    if (!tripId) return
    set(confirmedRef(tripId), id)
  }, [tripId])

  const unconfirmPension = useCallback(() => {
    if (!tripId) return
    set(confirmedRef(tripId), null)
  }, [tripId])

  return { confirmedPension, confirmPension, unconfirmPension }
}
