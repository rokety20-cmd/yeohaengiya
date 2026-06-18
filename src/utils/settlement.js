/**
 * 정산 계산 순수 함수 모음
 *
 * 모든 금액은 원 단위 정수. 부동소수점 연산 없음.
 *
 * Expense 구조:
 *   { id, totalAmount, payerId, shares: { [memberId]: amount }, isDeleted? }
 *
 * shares의 합계는 totalAmount와 반드시 일치해야 한다.
 */

/**
 * 지출 목록에서 각 멤버의 순 잔액 계산
 * 양수 = 받을 돈, 음수 = 낼 돈
 *
 * @param {Array} expenses
 * @param {string[]} memberIds
 * @returns {Record<string, number>}
 */
export function calcBalances(expenses, memberIds) {
  const balance = Object.fromEntries(memberIds.map((id) => [id, 0]))

  for (const exp of expenses) {
    if (exp.isDeleted) continue

    // 결제자 → 총액 받음
    if (balance[exp.payerId] !== undefined) {
      balance[exp.payerId] += exp.totalAmount
    }

    // 각 참여자 → 부담액 차감
    for (const [memberId, amount] of Object.entries(exp.shares ?? {})) {
      if (balance[memberId] !== undefined) {
        balance[memberId] -= amount
      }
    }
  }

  return balance
}

/**
 * 균등 분담 계산 (나머지 원은 첫 번째 멤버에게 부과)
 * 합계가 totalAmount와 반드시 일치하도록 보장
 *
 * @param {number} totalAmount
 * @param {string[]} participantIds
 * @returns {Record<string, number>}
 */
export function splitEvenly(totalAmount, participantIds) {
  if (participantIds.length === 0) return {}
  const base = Math.floor(totalAmount / participantIds.length)
  const remainder = totalAmount - base * participantIds.length
  return Object.fromEntries(
    participantIds.map((id, i) => [id, i === 0 ? base + remainder : base])
  )
}

/**
 * 잔액 맵에서 최소 송금 횟수 계산
 * 그리디 알고리즘: 가장 많이 받을 사람 ↔ 가장 많이 낼 사람 순으로 매칭
 *
 * @param {Record<string, number>} balances
 * @returns {Array<{ from: string, to: string, amount: number }>}
 */
export function minimizeTransfers(balances) {
  const eps = 0 // 정수라 부동소수점 오차 없음

  const creditors = [] // 받을 사람 (balance > 0)
  const debtors = []   // 낼 사람 (balance < 0)

  for (const [id, bal] of Object.entries(balances)) {
    if (bal > eps) creditors.push({ id, amount: bal })
    else if (bal < -eps) debtors.push({ id, amount: -bal })
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transfers = []
  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci]
    const d = debtors[di]
    const amount = Math.min(c.amount, d.amount)

    if (amount > 0) {
      transfers.push({ from: d.id, to: c.id, amount })
    }

    c.amount -= amount
    d.amount -= amount

    if (c.amount === 0) ci++
    if (d.amount === 0) di++
  }

  return transfers
}

/**
 * 지출 목록 전체에서 최종 송금 목록 계산
 *
 * @param {Array} expenses
 * @param {string[]} memberIds
 * @returns {Array<{ from: string, to: string, amount: number }>}
 */
export function calculateSettlement(expenses, memberIds) {
  const balances = calcBalances(expenses, memberIds)
  return minimizeTransfers(balances)
}
