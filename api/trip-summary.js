export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method !== 'POST') return res.status(405).end()

  const key = process.env.OPENAI_API_KEY
  if (!key) return res.status(500).json({ error: 'API 키 미설정' })

  const d = req.body

  const prompt = `당신은 친구들의 여행 이야기꾼입니다. 아래 데이터를 바탕으로, 나중에 읽어도 미소 짓게 되는 따뜻하고 유쾌한 여행 후기를 한국어로 써주세요.
이모지를 곁들이고, 마치 같이 다녀온 친한 친구가 쓴 것처럼 3~4 단락으로 작성해주세요.

[여행] 이름: ${d.title} / 날짜: ${d.date} / 멤버: ${d.members}
[경비] 총 ${Number(d.totalSpent || 0).toLocaleString()}원${d.topPayerName ? ` / 지갑왕: ${d.topPayerName}` : ''}
[이동] ${d.routes || '미입력'}${d.totalKm > 0 ? ` / ${d.totalKm}km` : ''}
[게시판] 글 ${d.postCount || 0}개, 좋아요 ${d.totalLikes || 0}개${d.topPostContent ? ` / 인기글: "${d.topPostContent}"` : ''}
[준비물] ${d.todoRate || 0}% 완료

위 내용을 재미있게 풀어주세요!`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error(data.error?.message || '응답 없음')
    res.status(200).json({ summary: text })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
