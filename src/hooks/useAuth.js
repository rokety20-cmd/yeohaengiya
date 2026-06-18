import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth'
import { ref, get, set } from 'firebase/database'
import { auth, db } from '../firebase'

const provider = new GoogleAuthProvider()

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = 로딩 중
  const [linkedFriendId, setLinkedFriendId] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null)
      if (u) {
        // /users/{uid}/friendId 조회
        const snap = await get(ref(db, `users/${u.uid}/friendId`))
        setLinkedFriendId(snap.val() ?? null)
      } else {
        setLinkedFriendId(null)
      }
    })
    return () => unsub()
  }, [])

  async function signInWithGoogle() {
    await signInWithPopup(auth, provider)
  }

  async function signOutUser() {
    await signOut(auth)
    setLinkedFriendId(null)
  }

  async function linkToFriend(friendId) {
    if (!auth.currentUser) return
    await set(ref(db, `users/${auth.currentUser.uid}`), {
      friendId,
      linkedAt: Date.now(),
      displayName: auth.currentUser.displayName ?? '',
      email: auth.currentUser.email ?? '',
    })
    setLinkedFriendId(friendId)
  }

  return {
    user,
    linkedFriendId,
    loading: user === undefined,
    signInWithGoogle,
    signOutUser,
    linkToFriend,
  }
}
