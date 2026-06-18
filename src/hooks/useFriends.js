import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, set, push, update } from 'firebase/database'
import { db } from '../firebase'

const friendsRef = () => ref(db, 'friends')
const friendRef = (id) => ref(db, `friends/${id}`)

export function useFriends() {
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onValue(friendsRef(), (snap) => {
      const val = snap.val()
      const list = val
        ? Object.entries(val)
            .map(([id, data]) => ({ id, ...data }))
            .filter((f) => f.isActive !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : []
      setFriends(list)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const addFriend = useCallback((data) => {
    return push(friendsRef(), { ...data, isActive: true, createdAt: Date.now() })
  }, [])

  const updateFriend = useCallback((id, data) => {
    return update(friendRef(id), data)
  }, [])

  // 실제 삭제 대신 비활성화
  const deactivateFriend = useCallback((id) => {
    return update(friendRef(id), { isActive: false })
  }, [])

  return { friends, loading, addFriend, updateFriend, deactivateFriend }
}

// 비활성 포함 전체 목록 (관리 화면용)
export function useAllFriends() {
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onValue(friendsRef(), (snap) => {
      const val = snap.val()
      const list = val
        ? Object.entries(val)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : []
      setFriends(list)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return { friends, loading }
}
