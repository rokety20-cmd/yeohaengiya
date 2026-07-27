// 오피넷 전국 평균 유가 조회
// 공공 API: https://www.opinet.co.kr/api/avgAllPrice.do
const OPINET_KEY = 'F186170711'

exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  try {
    const url = `https://www.opinet.co.kr/api/avgAllPrice.do?code=${OPINET_KEY}&out=json`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000),
    })
    const text = await res.text()
    const json = JSON.parse(text)
    const oils = json?.RESULT?.OIL ?? []

    const find = (code) => {
      const o = oils.find(i => i.PRODCD === code)
      return o ? { price: Math.round(Number(o.PRICE)), date: o.DATE } : null
    }

    const gasoline = find('B027') // 휘발유
    const diesel   = find('D047') // 경유

    if (!gasoline) throw new Error('유가 데이터 없음')

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ gasoline, diesel }),
    }
  } catch (e) {
    // 오피넷 실패 시 최근 평균값으로 폴백
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        gasoline: { price: 1650, date: null },
        diesel:   { price: 1480, date: null },
        fallback: true,
        error: e.message,
      }),
    }
  }
}
