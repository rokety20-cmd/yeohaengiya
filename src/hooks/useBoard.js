import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, push, update, remove } from 'firebase/database'
import { db } from '../firebase'

const boardRef  = (tripId) => ref(db, `trips/${tripId}/board`)
const postRef   = (tripId, id) => ref(db, `trips/${tripId}/board/${id}`)
const todoRef   = (tripId) => ref(db, `trips/${tripId}/boardTodos`)
const todoItem  = (tripId, id) => ref(db, `trips/${tripId}/boardTodos/${id}`)

export function useBoard(tripId) {
  const [posts, setPosts] = useState([])
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) { setLoading(false); return }
    let p1done = false, p2done = false
    const check = () => { if (p1done && p2done) setLoading(false) }

    const u1 = onValue(boardRef(tripId), (snap) => {
      const val = snap.val()
      const list = val
        ? Object.entries(val)
            .map(([id, d]) => ({ id, ...d }))
            .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
        : []
      setPosts(list)
      p1done = true; check()
    })

    const u2 = onValue(todoRef(tripId), (snap) => {
      const val = snap.val()
      const list = val
        ? Object.entries(val)
            .map(([id, d]) => ({ id, ...d }))
            .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
        : []
      setTodos(list)
      p2done = true; check()
    })

    return () => { u1(); u2() }
  }, [tripId])

  const addPost = useCallback((memberId, content) => {
    if (!tripId || !content.trim()) return
    push(boardRef(tripId), { memberId, content: content.trim(), createdAt: Date.now(), pinned: false, likes: {} })
  }, [tripId])

  const togglePin = useCallback((id, current) => {
    update(postRef(tripId, id), { pinned: !current })
  }, [tripId])

  const toggleLike = useCallback((id, memberId, hasLiked) => {
    update(postRef(tripId, id), { [`likes/${memberId}`]: hasLiked ? null : true })
  }, [tripId])

  const deletePost = useCallback((id) => {
    remove(postRef(tripId, id))
  }, [tripId])

  const addReply = useCallback((postId, memberId, content) => {
    if (!tripId || !content.trim()) return
    const replyRef = ref(db, `trips/${tripId}/board/${postId}/replies`)
    push(replyRef, { memberId, content: content.trim(), createdAt: Date.now() })
  }, [tripId])

  const addTodo = useCallback((text) => {
    if (!tripId || !text.trim()) return
    push(todoRef(tripId), { text: text.trim(), done: false, doneBy: null, createdAt: Date.now() })
  }, [tripId])

  const toggleTodo = useCallback((id, done, memberId) => {
    update(todoItem(tripId, id), { done: !done, doneBy: done ? null : memberId })
  }, [tripId])

  const deleteTodo = useCallback((id) => {
    remove(todoItem(tripId, id))
  }, [tripId])

  return { posts, todos, loading, addPost, togglePin, toggleLike, deletePost, addReply, addTodo, toggleTodo, deleteTodo }
}
