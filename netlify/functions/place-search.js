exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

  const key = process.env.KAKAO_REST_KEY
  const q = event.queryStringParameters?.q || ''

  if (!q) return { statusCode: 200, headers, body: JSON.stringify({ documents: [] }) }

  // 키 없으면 빈 배열 반환 → 프론트에서 Nominatim fallback
  if (!key) return { statusCode: 200, headers, body: JSON.stringify({ documents: [] }) }

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&size=8`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    )
    const data = await res.json()
    return { statusCode: 200, headers, body: JSON.stringify({ documents: data.documents || [] }) }
  } catch {
    return { statusCode: 200, headers, body: JSON.stringify({ documents: [] }) }
  }
}
