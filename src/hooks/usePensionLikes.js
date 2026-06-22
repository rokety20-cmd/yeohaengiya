import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, set, remove } from 'firebase/database'
import { db } from '../firebase'

const likesRef = (tripId) => ref(db, `trips/${tripId}/pensionLikes`)
const likeRef = (tripId, pensionId, memberId) =>
  ref(db, `trips/${tripId}/pensionLikes/${pensionId}/${memberId}`)

export function usePensionLikes(tripId) {
  const [pensionLikes, setPensionLikes] = useState({})

  useEffect(() => {
    if (!tripId) return
    const unsub = onValue(likesRef(tripId), (snap) => {
      setPensionLikes(snap.val() || {})
    })
    return () => unsub()
  }, [tripId])

  const toggleLike = useCallback((pensionId, memberId) => {
    if (!tripId || !pensionId || !memberId) return
    const r = likeRef(tripId, pensionId, memberId)
    const alreadyLiked = pensionLikes[pensionId]?.[memberId]
    if (alreadyLiked) remove(r)
    else set(r, true)
  }, [tripId, pensionLikes])

  return { pensionLikes, toggleLike }
}
