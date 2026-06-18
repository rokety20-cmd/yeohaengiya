import { test, expect, describe } from 'vitest'
import { calcBalances, splitEvenly, minimizeTransfers, calculateSettlement } from './settlement.js'

describe('splitEvenly', () => {
  test('3명 균등: 나머지 없음', () => {
    const shares = splitEvenly(30000, ['a', 'b', 'c'])
    expect(shares).toEqual({ a: 10000, b: 10000, c: 10000 })
    expect(Object.values(shares).reduce((s, v) => s + v, 0)).toBe(30000)
  })

  test('3명 균등: 나머지 1원은 첫 번째 멤버에게', () => {
    const shares = splitEvenly(10001, ['a', 'b', 'c'])
    expect(Object.values(shares).reduce((s, v) => s + v, 0)).toBe(10001)
    expect(shares.a).toBe(3335)
    expect(shares.b).toBe(3333)
    expect(shares.c).toBe(3333)
  })

  test('1명', () => {
    const shares = splitEvenly(50000, ['solo'])
    expect(shares).toEqual({ solo: 50000 })
  })

  test('0명 → 빈 객체', () => {
    expect(splitEvenly(10000, [])).toEqual({})
  })
})

describe('calcBalances', () => {
  test('전원 균등분담: 결제자는 나머지 5명분을 받는다', () => {
    // 병수가 60000원 결제, 6명 균등 → 병수는 50000 받을 것
    const expenses = [{
      id: 'e1',
      totalAmount: 60000,
      payerId: 'byeongsu',
      shares: { seongwoon: 10000, byeongsu: 10000, taeheon: 10000, yonghun: 10000, hyeok: 10000, daekeun: 10000 },
    }]
    const members = ['seongwoon', 'byeongsu', 'taeheon', 'yonghun', 'hyeok', 'daekeun']
    const bal = calcBalances(expenses, members)
    expect(bal.byeongsu).toBe(50000)   // 60000 받음 - 10000 부담
    expect(bal.seongwoon).toBe(-10000) // 10000 부담
    expect(bal.taeheon).toBe(-10000)
  })

  test('삭제된 지출은 합계에서 제외', () => {
    const expenses = [
      { id: 'e1', totalAmount: 30000, payerId: 'a', shares: { a: 15000, b: 15000 }, isDeleted: true },
      { id: 'e2', totalAmount: 20000, payerId: 'a', shares: { a: 10000, b: 10000 } },
    ]
    const bal = calcBalances(expenses, ['a', 'b'])
    expect(bal.a).toBe(10000)  // e2만: 20000 - 10000
    expect(bal.b).toBe(-10000) // e2만: 0 - 10000
  })

  test('여러 명이 각각 선결제한 경우', () => {
    const expenses = [
      { id: 'e1', totalAmount: 30000, payerId: 'a', shares: { a: 10000, b: 10000, c: 10000 } },
      { id: 'e2', totalAmount: 30000, payerId: 'b', shares: { a: 10000, b: 10000, c: 10000 } },
    ]
    const bal = calcBalances(expenses, ['a', 'b', 'c'])
    // a: 30000 - 10000 - 10000 = 10000
    // b: 30000 - 10000 - 10000 = 10000
    // c: 0 - 10000 - 10000 = -20000
    expect(bal.a).toBe(10000)
    expect(bal.b).toBe(10000)
    expect(bal.c).toBe(-20000)
  })

  test('일부 참가자만 부담하는 경우', () => {
    const expenses = [{
      id: 'e1',
      totalAmount: 40000,
      payerId: 'a',
      shares: { b: 20000, c: 20000 }, // a는 비용 부담 없음
    }]
    const bal = calcBalances(expenses, ['a', 'b', 'c'])
    expect(bal.a).toBe(40000)  // 전액 결제, 부담 없음
    expect(bal.b).toBe(-20000)
    expect(bal.c).toBe(-20000)
  })
})

describe('minimizeTransfers', () => {
  test('2명: 한 명이 내야 함', () => {
    const transfers = minimizeTransfers({ a: 10000, b: -10000 })
    expect(transfers).toHaveLength(1)
    expect(transfers[0]).toEqual({ from: 'b', to: 'a', amount: 10000 })
  })

  test('3명 불균등: 최소 2번 송금', () => {
    const transfers = minimizeTransfers({ a: 20000, b: -20000, c: 0 })
    expect(transfers).toHaveLength(1)
    expect(transfers[0]).toEqual({ from: 'b', to: 'a', amount: 20000 })
  })

  test('모두 0: 송금 없음', () => {
    const transfers = minimizeTransfers({ a: 0, b: 0, c: 0 })
    expect(transfers).toHaveLength(0)
  })

  test('부분 송금 이후 잔액 계산', () => {
    // a: +20000, b: -5000, c: -15000 → b→a 5000, c→a 15000
    const transfers = minimizeTransfers({ a: 20000, b: -5000, c: -15000 })
    const total = transfers.reduce((s, t) => s + t.amount, 0)
    expect(total).toBe(20000)
  })
})

describe('calculateSettlement — 통합', () => {
  test('전원 균등: 최소 송금 경로 계산', () => {
    const members = ['a', 'b', 'c']
    const expenses = [{
      id: 'e1',
      totalAmount: 30000,
      payerId: 'a',
      shares: splitEvenly(30000, members),
    }]
    const transfers = calculateSettlement(expenses, members)
    // b → a 10000, c → a 10000
    expect(transfers).toHaveLength(2)
    const total = transfers.reduce((s, t) => s + t.amount, 0)
    expect(total).toBe(20000) // a 결제분에서 자신 몫 10000 제외
  })

  test('모든 정산 완료 후 잔액 0', () => {
    const members = ['seongwoon', 'byeongsu', 'taeheon']
    const expenses = [
      { id: 'e1', totalAmount: 60000, payerId: 'seongwoon', shares: splitEvenly(60000, members) },
      { id: 'e2', totalAmount: 30000, payerId: 'byeongsu',  shares: splitEvenly(30000, members) },
    ]
    const balances = calcBalances(expenses, members)
    const transfers = minimizeTransfers(balances)
    // 모든 송금 반영 후 잔액 0 검증
    const final = { ...balances }
    for (const t of transfers) {
      final[t.from] += t.amount
      final[t.to]   -= t.amount
    }
    for (const v of Object.values(final)) {
      expect(v).toBe(0)
    }
  })

  test('1원 나머지 처리: 합계 불일치 없음', () => {
    const members = ['a', 'b', 'c']
    const shares = splitEvenly(10001, members)
    const sum = Object.values(shares).reduce((s, v) => s + v, 0)
    expect(sum).toBe(10001)
  })
})
