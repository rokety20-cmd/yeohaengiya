import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, set, push, remove } from 'firebase/database'
import { db, TRIP_ID } from '../firebase'

const base = (path) => ref(db, `trips/${TRIP_ID}/${path}`)

// 단일 경로 실시간 구독
export function useFirebaseValue(path) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const r = base(path)
    const unsub = onValue(r, (snap) => {
      setData(snap.val())
      setLoading(false)
    })
    return () => unsub()
  }, [path])

  return { data, loading }
}

// 투표
export function useVotes() {
  const { data: votes, loading } = useFirebaseValue('votes')

  const castVote = useCallback((memberId, dateId) => {
    set(base(`votes/${memberId}`), dateId)
  }, [])

  return { votes: votes || {}, loading, castVote }
}

// 확정 날짜
export function useConfirmedDate() {
  const { data } = useFirebaseValue('meta/confirmedDate')

  const confirm = useCallback((dateId) => {
    set(base('meta/confirmedDate'), dateId)
  }, [])

  return { confirmedDate: data, confirm }
}

// 펜션 공유
export function usePensions() {
  const { data, loading } = useFirebaseValue('pensions')

  const addPension = useCallback((pension) => {
    push(base('pensions'), { ...pension, createdAt: Date.now() })
  }, [])

  const removePension = useCallback((key) => {
    remove(base(`pensions/${key}`))
  }, [])

  const list = data
    ? Object.entries(data).map(([key, val]) => ({ key, ...val }))
    : []

  return { pensions: list, loading, addPension, removePension }
}

// 공동 체크리스트
export function useSharedChecks() {
  const { data } = useFirebaseValue('checks/shared')

  const toggle = useCallback((itemId, current) => {
    set(base(`checks/shared/${itemId}`), !current)
  }, [])

  return { sharedDone: data || {}, toggleShared: toggle }
}

// 개인 체크리스트
export function usePersonalChecks(memberId) {
  const { data } = useFirebaseValue(`checks/personal/${memberId}`)

  const toggle = useCallback((itemId, current) => {
    if (!memberId) return
    set(base(`checks/personal/${memberId}/${itemId}`), !current)
  }, [memberId])

  return { personalDone: data || {}, togglePersonal: toggle }
}
