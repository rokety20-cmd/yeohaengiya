export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const key = process.env.KAKAO_REST_KEY
  const q = req.query.q || ''

  if (!q) return res.status(200).json({ documents: [] })
  if (!key) return res.status(200).json({ documents: [] })

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&size=8`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    )
    const data = await response.json()
    res.status(200).json({ documents: data.documents || [] })
  } catch {
    res.status(200).json({ documents: [] })
  }
}
