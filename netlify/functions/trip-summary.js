const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' }
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API 키 미설정' }) }
  }

  let d
  try { d = JSON.parse(event.body) }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const prompt = `당신은 친구들의 여행 이야기꾼입니다. 아래 데이터를 바탕으로, 나중에 읽어도 미소 짓게 되는 따뜻하고 유쾌한 여행 후기를 한국어로 써주세요.
이모지를 곁들이고, 마치 같이 다녀온 친한 친구가 쓴 것처럼 3~4 단락으로 작성해주세요.

[여행]
이름: ${d.title}
날짜: ${d.date}
멤버: ${d.members}

[경비]
총 경비: ${Number(d.totalSpent || 0).toLocaleString()}원
${d.topPayerName ? `가장 많이 낸 사람: ${d.topPayerName}` : ''}
주요 지출: ${d.expenses || '없음'}

[이동]
${d.routes ? `경로: ${d.routes}` : '경로 미입력'}
${d.totalKm > 0 ? `총 거리: ${d.totalKm}km` : ''}

[게시판]
글 ${d.postCount || 0}개, 좋아요 ${d.totalLikes || 0}개
${d.topPostContent ? `인기글: "${d.topPostContent}"` : ''}

[준비물 완료율]
${d.todoRate || 0}%

위 내용을 재미있게 풀어주세요!`

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text
    if (!text) throw new Error(data.error?.message || '응답 없음')
    return { statusCode: 200, headers, body: JSON.stringify({ summary: text }) }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }
  }
}
