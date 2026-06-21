// 펜션 링크 OG 태그 추출 — 야놀자, 여기어때, 네이버 등
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  const url = event.queryStringParameters?.url
  if (!url) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'url 파라미터가 필요합니다' }) }
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    })

    const html = await res.text()

    // OG 태그 추출
    function getMeta(property) {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
        new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
      ]
      for (const p of patterns) {
        const m = html.match(p)
        if (m) return m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim()
      }
      return null
    }

    const title = getMeta('og:title') || getMeta('twitter:title')
      || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''

    const description = getMeta('og:description') || getMeta('description') || ''

    // 이미지: OG 우선, 없으면 첫 번째 큰 이미지
    let image = getMeta('og:image') || getMeta('twitter:image') || ''
    // 상대경로 처리
    if (image && image.startsWith('/')) {
      const base = new URL(url)
      image = `${base.protocol}//${base.host}${image}`
    }

    // 가격 힌트 추출 (숫자+원/만원 패턴)
    const priceMatch = html.match(/([0-9,]+)\s*원\s*[\/\n\s]*(박|1박|night)/i)
      || html.match(/1박\s*([0-9,]+)\s*원/i)
    const price = priceMatch ? priceMatch[0].replace(/\s+/g, ' ').trim() : null

    // 주소/위치 힌트
    const addrMatch = html.match(/(?:주소|위치|location)[^>]*>([^<]{5,80})/i)
    const address = addrMatch ? addrMatch[1].trim() : null

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ title, description, image, price, address, url }),
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message }),
    }
  }
}
