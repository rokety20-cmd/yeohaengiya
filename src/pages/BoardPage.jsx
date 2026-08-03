import { useState, useRef, useEffect } from 'react'
import { useBoard } from '../hooks/useBoard'
import { useFriends } from '../hooks/useFriends'

function timeAgo(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return '방금'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
  return `${Math.floor(diff / 86400000)}일 전`
}

// ─── 게시물 카드 ──────────────────────────────────────────────────────────────
function PostCard({ post, me, memberMap, onPin, onLike, onDelete }) {
  const author = memberMap[post.memberId]
  const likeCount = Object.keys(post.likes || {}).length
  const iLiked = !!(post.likes || {})[me?.id]
  const isMe = post.memberId === me?.id

  return (
    <div style={{
      background: post.pinned ? '#FFFBE6' : '#fff',
      border: `0.5px solid ${post.pinned ? '#E0C97A' : '#eee'}`,
      borderRadius: 12, padding: '11px 13px', marginBottom: 8,
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
        {author && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: author.bg || '#eee', color: author.tc || '#333', fontWeight: 500 }}>
            {author.name}
          </span>
        )}
        {post.pinned && <span style={{ fontSize: 11, color: '#856404' }}>📌 고정</span>}
        <span style={{ fontSize: 11, color: '#ccc', marginLeft: 'auto' }}>{timeAgo(post.createdAt)}</span>
      </div>

      {/* 내용 */}
      <div style={{ fontSize: 14, color: '#333', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {post.content}
      </div>

      {/* 액션 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button onClick={() => onLike(post.id, iLiked)} style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
          border: `0.5px solid ${iLiked ? '#f09595' : '#e0e0e0'}`,
          background: iLiked ? '#FCEBEB' : '#f9f9f9',
          color: iLiked ? '#A32D2D' : '#888',
        }}>
          ❤️ {likeCount > 0 ? likeCount : ''}
        </button>
        {me?.role === '총무' && (
          <button onClick={() => onPin(post.id, post.pinned)} style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: '0.5px solid #e0e0e0', background: '#f9f9f9', color: '#888',
          }}>
            {post.pinned ? '📌 고정 해제' : '📌 고정'}
          </button>
        )}
        {isMe && (
          <button onClick={() => onDelete(post.id)} style={{
            marginLeft: 'auto', padding: '3px 8px', borderRadius: 20, fontSize: 11,
            border: '0.5px solid #f09595', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer',
          }}>✕</button>
        )}
      </div>
    </div>
  )
}

// ─── 공유 체크리스트 ──────────────────────────────────────────────────────────
function TodoSection({ todos, me, memberMap, onAdd, onToggle, onDelete }) {
  const [text, setText] = useState('')

  function handleAdd() {
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }

  return (
    <div style={{ background: '#f9f9f9', borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ fontSize: 12, color: '#555', fontWeight: 500, marginBottom: 10 }}>🗒️ 공유 체크리스트</div>

      {todos.map(todo => {
        const doneBy = todo.doneBy ? memberMap[todo.doneBy] : null
        return (
          <div key={todo.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '7px 0', borderBottom: '0.5px solid #eee',
          }}>
            <button onClick={() => onToggle(todo.id, todo.done, me?.id)} style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
              border: `1.5px solid ${todo.done ? '#1D9E75' : '#ccc'}`,
              background: todo.done ? '#1D9E75' : '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 700,
            }}>{todo.done ? '✓' : ''}</button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                fontSize: 13, color: todo.done ? '#aaa' : '#333',
                textDecoration: todo.done ? 'line-through' : 'none',
              }}>{todo.text}</span>
              {doneBy && (
                <span style={{ fontSize: 10, marginLeft: 6, color: '#aaa' }}>({doneBy.name})</span>
              )}
            </div>

            <button onClick={() => onDelete(todo.id)} style={{
              fontSize: 11, padding: '2px 6px', borderRadius: 6, border: 'none',
              background: 'transparent', color: '#ccc', cursor: 'pointer', flexShrink: 0,
            }}>✕</button>
          </div>
        )
      })}

      {todos.length === 0 && (
        <div style={{ fontSize: 12, color: '#ccc', textAlign: 'center', padding: '10px 0' }}>
          체크할 항목이 없어요
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="항목 추가 (Enter)"
          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box' }}
        />
        <button onClick={handleAdd} style={{
          padding: '8px 14px', borderRadius: 8, border: 'none',
          background: '#185FA5', color: '#fff', fontSize: 13, cursor: 'pointer',
        }}>추가</button>
      </div>
    </div>
  )
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────
export default function BoardPage({ me, tripId, tripMembers }) {
  const { posts, todos, loading, addPost, togglePin, toggleLike, deletePost, addTodo, toggleTodo, deleteTodo } = useBoard(tripId)
  const { friends } = useFriends()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)
  const memberIds = tripMembers || []

  const memberMap = Object.fromEntries(friends.map(f => [f.id, f]))

  // 새 글 도착 시 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [posts.length])

  function handlePost() {
    if (!draft.trim() || !me) return
    addPost(me.id, draft)
    setDraft('')
  }

  // 고정글 → 상단, 나머지 → 시간순
  const pinned = posts.filter(p => p.pinned)
  const normal = posts.filter(p => !p.pinned)
  const sorted = [...pinned, ...normal]

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>불러오는 중...</div>

  return (
    <div style={{ padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 게시판 */}
      <div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
          💬 실시간 공유 게시판 — 누구나 의견을 남겨보세요
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 2 }}>
          {sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#ccc', fontSize: 13 }}>
              아직 글이 없어요. 첫 의견을 남겨보세요!
            </div>
          )}
          {sorted.map(post => (
            <PostCard
              key={post.id}
              post={post}
              me={me}
              memberMap={memberMap}
              onPin={togglePin}
              onLike={(id, iLiked) => toggleLike(id, me?.id, iLiked)}
              onDelete={deletePost}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* 글쓰기 */}
        <div style={{ marginTop: 8 }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handlePost() }}
            placeholder={me ? `${me.name}(으)로 의견 남기기...` : '먼저 본인을 선택해주세요'}
            disabled={!me}
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '0.5px solid #e0e0e0', fontSize: 13, resize: 'none',
              boxSizing: 'border-box', lineHeight: 1.5,
              background: me ? '#fff' : '#f9f9f9', color: me ? '#333' : '#aaa',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#ccc' }}>Cmd+Enter 또는 아래 버튼으로 전송</span>
            <button onClick={handlePost} disabled={!draft.trim() || !me} style={{
              padding: '8px 20px', borderRadius: 10, border: 'none',
              background: draft.trim() && me ? '#185FA5' : '#e0e0e0',
              color: draft.trim() && me ? '#fff' : '#aaa',
              fontSize: 13, fontWeight: 500, cursor: draft.trim() && me ? 'pointer' : 'default',
            }}>게시</button>
          </div>
        </div>
      </div>

      {/* 체크리스트 */}
      <TodoSection
        todos={todos}
        me={me}
        memberMap={memberMap}
        onAdd={addTodo}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
      />
    </div>
  )
}
