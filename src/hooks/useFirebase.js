import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, set, push, remove } from 'firebase/database'
import { db } from '../firebase'

const base = (tripId, path) => ref(db, `trips/${tripId}/${path}`)

// 단일 경로 실시간 구독
export function useFirebaseValue(tripId, path) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) { setLoading(false); return }
    const r = base(tripId, path)
    const unsub = onValue(r, (snap) => {
      setData(snap.val())
      setLoading(false)
    })
    return () => unsub()
  }, [tripId, path])

  return { data, loading }
}

// 투표
export function useVotes(tripId) {
  const { data: votes, loading } = useFirebaseValue(tripId, 'votes')

  const castVote = useCallback((memberId, dateId) => {
    if (!tripId) return
    set(base(tripId, `votes/${memberId}`), dateId)
  }, [tripId])

  return { votes: votes || {}, loading, castVote }
}

// 확정 날짜
export function useConfirmedDate(tripId) {
  const { data } = useFirebaseValue(tripId, 'meta/confirmedDate')

  const confirm = useCallback((dateId) => {
    if (!tripId) return
    set(base(tripId, 'meta/confirmedDate'), dateId)
  }, [tripId])

  const unconfirm = useCallback(() => {
    if (!tripId) return
    set(base(tripId, 'meta/confirmedDate'), null)
  }, [tripId])

  return { confirmedDate: data, confirm, unconfirm }
}

// 펜션 공유
export function usePensions(tripId) {
  const { data, loading } = useFirebaseValue(tripId, 'pensions')

  const addPension = useCallback((pension) => {
    if (!tripId) return
    push(base(tripId, 'pensions'), { ...pension, createdAt: Date.now() })
  }, [tripId])

  const removePension = useCallback((key) => {
    if (!tripId) return
    remove(base(tripId, `pensions/${key}`))
  }, [tripId])

  const list = data
    ? Object.entries(data).map(([key, val]) => ({ key, ...val }))
    : []

  return { pensions: list, loading, addPension, removePension }
}

// 공동 체크리스트
export function useSharedChecks(tripId) {
  const { data } = useFirebaseValue(tripId, 'checks/shared')

  const toggle = useCallback((itemId, current) => {
    if (!tripId) return
    set(base(tripId, `checks/shared/${itemId}`), !current)
  }, [tripId])

  return { sharedDone: data || {}, toggleShared: toggle }
}

// 개인 체크리스트
export function usePersonalChecks(tripId, memberId) {
  const { data } = useFirebaseValue(tripId, memberId ? `checks/personal/${memberId}` : null)

  const toggle = useCallback((itemId, current) => {
    if (!tripId || !memberId) return
    set(base(tripId, `checks/personal/${memberId}/${itemId}`), !current)
  }, [tripId, memberId])

  return { personalDone: data || {}, togglePersonal: toggle }
}
