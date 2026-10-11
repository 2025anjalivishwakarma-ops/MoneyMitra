export const RISK = {
    green: '#34d399',
    yellow: '#fbbf24',
    red: '#f87171',
}

export const inr = (n) =>
    '₹' + Math.round(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

// Rent & bills are paid once a month, so they are counted as they happen.
// Everything else is projected from the daily average so far.
export function projectSpend(expenses, daysElapsed, daysInMonth) {
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const fixed = expenses
        .filter((e) => e.category === 'Rent & bills')
        .reduce((s, e) => s + e.amount, 0)
    const variable = total - fixed
    const perDay = daysElapsed > 0 ? variable / daysElapsed : 0
    return { fixed, variable, perDay, projected: fixed + perDay * daysInMonth }
}

export function riskLevel({ spent, projected, spendable, daysElapsed }) {
    const ratio = spendable > 0 ? projected / spendable : spent > 0 ? 2 : 0
    let level = 'green'
    let label = 'Low risk'
    if (spent > spendable && spent > 0) {
        level = 'red'
        label = 'Overspent'
    } else if (ratio >= 1) {
        level = 'red'
        label = 'High risk'
    } else if (ratio >= 0.85) {
        level = 'yellow'
        label = 'Moderate risk'
    }
    return { level, label, ratio, early: daysElapsed < 5 }
}

export function riskMessage({ level, spent, projected, spendable, daysElapsed, daysInMonth }) {
    const daysLeft = Math.max(daysInMonth - daysElapsed, 0)
    const room = spendable - spent
    const cap = daysLeft > 0 && room > 0 ? room / daysLeft : 0

    if (spent === 0) return 'Add your first expenses and MoneyMitra will estimate how the month is likely to end.'

    if (level === 'green') {
        return `At this pace you will spend about ${inr(projected)}, which is ${inr(spendable - projected)} under your limit. Your savings goal is safe.`
    }
    if (level === 'yellow') {
        return `You are close to your limit. You are heading for about ${inr(projected)} against ${inr(spendable)}.${
      cap > 0 ? ` Keep daily spending under ${inr(cap)} to stay safe.` : ''
    }`
  }
  if (spent > spendable) {
    return `You have already spent ${inr(spent - spendable)} more than your limit, so this month's savings goal is not reachable.`
  }
  return `You are heading for about ${inr(projected)}, which is ${inr(projected - spendable)} over your limit.${
    cap > 0 ? ` Cutting daily spending to ${inr(cap)} or less would bring you back on track.` : ''
  }`
}

export function dailySeries(expenses, daysElapsed) {
  const per = Array(daysElapsed + 1).fill(0)
  expenses.forEach((e) => {
    const d = parseInt(e.date.slice(8, 10), 10)
    if (d >= 1 && d <= daysElapsed) per[d] += e.amount
  })
  let run = 0
  return Array.from({ length: daysElapsed }, (_, i) => {
    run += per[i + 1]
    return { day: i + 1, total: run }
  })
}

export function stats(expenses, daysElapsed) {
  const n = expenses.length
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const byDay = {}
  expenses.forEach((e) => {
    byDay[e.date] = (byDay[e.date] || 0) + e.amount
  })
  const busiest = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
  const sorted = expenses.map((e) => e.amount).sort((a, b) => a - b)
  const median = n === 0 ? 0 : n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  return {
    n,
    avgDay: daysElapsed ? total / daysElapsed : 0,
    median,
    largest: n ? sorted[n - 1] : 0,
    busiest: busiest ? { date: busiest[0], total: busiest[1] } : null,
  }
}