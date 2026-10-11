import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Sparkles, PiggyBank, Wallet, TrendingDown, ShieldAlert, BarChart3 } from 'lucide-react'
import LiveBackground from './LiveBackground.jsx'
import { DonutChart, TrendChart, RiskMeter } from './Charts.jsx'
import { RISK, projectSpend, riskLevel, riskMessage, dailySeries, stats } from './analytics.js'

const CATEGORIES = [
  { name: 'Food', color: '#f4b860' },
  { name: 'Transport', color: '#7cc4fa' },
  { name: 'Rent & bills', color: '#b6a4f5' },
  { name: 'Shopping', color: '#f08fb0' },
  { name: 'Entertainment', color: '#6fdcb0' },
  { name: 'Health', color: '#f2e07a' },
  { name: 'Other', color: '#b8bcc4' },
]

const catColor = (name) => CATEGORIES.find((c) => c.name === name)?.color ?? '#b8bcc4'

const inr = (n) =>
  '₹' + Math.round(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

const STORAGE_KEY = 'MoneyMitra.v1'

const isoDay = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function sampleData() {
  const today = new Date()
  const mk = (daysAgo, category, note, amount, id) => {
    const d = new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - daysAgo))
    return { id, date: isoDay(d), category, note, amount }
  }
  return {
    income: 40000,
    goal: 8000,
    isSample: true,
    expenses: [
      mk(0, 'Food', 'Lunch with friends', 420, 's1'),
      mk(1, 'Transport', 'Train pass top-up', 600, 's2'),
      mk(2, 'Food', 'Cafe', 180, 's3'),
      mk(3, 'Shopping', 'Headphones', 2499, 's4'),
      mk(4, 'Food', 'Groceries', 1350, 's5'),
      mk(5, 'Entertainment', 'Movie night', 520, 's6'),
      mk(6, 'Food', 'Cafe', 160, 's7'),
      mk(7, 'Rent & bills', 'Mobile + internet', 1199, 's8'),
      mk(8, 'Food', 'Street food', 140, 's9'),
      mk(9, 'Rent & bills', 'Room rent share', 9000, 's10'),
      mk(10, 'Health', 'Pharmacy', 350, 's11'),
      mk(11, 'Food', 'Cafe', 190, 's12'),
    ],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    /* storage unavailable */
  }
  return sampleData()
}

function buildInsights({ spent, projected, income, goal, byCat, daysElapsed, daysInMonth, expenses }) {
  const out = []
  const spendable = income - goal
  const daysLeft = Math.max(daysInMonth - daysElapsed, 0)

  if (income > 0 && spent > 0) {
    if (projected > spendable) {
      const room = spendable - spent
      out.push({
        tone: 'warn',
        title: `You're on pace to spend ${inr(projected)} this month`,
        body:
          room > 0 && daysLeft > 0
            ? `That is ${inr(projected - spendable)} above your plan. Keep the next ${daysLeft} days under ${inr(room / daysLeft)} a day to stay on target.`
            : `That is ${inr(projected - spendable)} above your plan, so this month's savings goal of ${inr(goal)} is at risk.`,
      })
    } else {
      out.push({
        tone: 'good',
        title: 'You are on track to hit your savings goal',
        body: `At today's pace you will spend about ${inr(projected)} and keep roughly ${inr(income - projected)}, against a goal of ${inr(goal)}.`,
      })
    }
  }

  const flexible = byCat.filter((c) => c.name !== 'Rent & bills')
  const flexTotal = flexible.reduce((s, c) => s + c.total, 0)
  if (flexible.length && flexTotal > 0) {
    const top = flexible[0]
    const share = top.total / flexTotal
    if (share >= 0.3) {
      out.push({
        tone: 'tip',
        title: `${top.name} is ${Math.round(share * 100)}% of your flexible spending`,
        body: `Trimming it by 15% would free up ${inr(top.total * 0.15)} this month.`,
      })
    }
  }

  const smallFood = expenses.filter((e) => e.category === 'Food' && e.amount <= 300)
  if (smallFood.length >= 5) {
    const t = smallFood.reduce((s, e) => s + e.amount, 0)
    out.push({
      tone: 'tip',
      title: `${smallFood.length} small food purchases added up to ${inr(t)}`,
      body: `Small buys are easy to miss. Setting a weekly cap for them is a quick way to save.`,
    })
  }

  const big = [...expenses].filter((e) => e.category !== 'Rent & bills').sort((a, b) => b.amount - a.amount)[0]
  if (big && income > 0 && big.amount >= income * 0.05) {
    out.push({
      tone: 'tip',
      title: `Your biggest one-off was ${inr(big.amount)} on ${big.note || big.category}`,
      body: `Waiting 48 hours before purchases of this size helps you decide if you still want them.`,
    })
  }

  if (!out.length) {
    out.push({
      tone: 'tip',
      title: 'Add a few expenses to see insights',
      body: 'Set your income and savings goal, then log spending as it happens.',
    })
  }
  return out.slice(0, 4)
}

const toneStyle = {
  good: 'bg-emerald-400/10 text-emerald-300',
  warn: 'bg-amber-400/10 text-amber-300',
  tip: 'bg-sky-400/10 text-sky-300',
}
const toneLabel = { good: 'On track', warn: 'Watch out', tip: 'Idea' }

const riskUi = {
  green: { ring: 'border-emerald-400/30', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  yellow: { ring: 'border-amber-400/30', text: 'text-amber-300', dot: 'bg-amber-400' },
  red: { ring: 'border-red-400/30', text: 'text-red-300', dot: 'bg-red-400' },
}

const field =
  'w-full rounded-lg border border-white/10 bg-black/40 backdrop-blur-md px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/40 [&>option]:bg-neutral-900'

export default function Tracker() {
  const [state, setState] = useState(load)
  const [form, setForm] = useState({
    amount: '',
    category: 'Food',
    note: '',
    date: isoDay(new Date()),
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      /* ignore */
    }
  }, [state])

  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysElapsed = now.getDate()

  const monthExpenses = useMemo(
    () =>
      state.expenses
        .filter((e) => e.date.startsWith(monthKey))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [state.expenses, monthKey]
  )

  const spent = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const spendable = Math.max(state.income - state.goal, 0)
  const left = spendable - spent
  const usedPct = spendable > 0 ? Math.min((spent / spendable) * 100, 100) : 0
  const { projected, perDay } = projectSpend(monthExpenses, daysElapsed, daysInMonth)
  const projectedSaved = state.income - projected

  const byCat = useMemo(() => {
    const map = {}
    monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount
    })
    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
  }, [monthExpenses])

  const insights = buildInsights({
    spent,
    projected,
    income: state.income,
    goal: state.goal,
    byCat,
    daysElapsed,
    daysInMonth,
    expenses: monthExpenses,
  })

  const risk = riskLevel({ spent, projected, spendable, daysElapsed })
  const series = useMemo(() => dailySeries(monthExpenses, daysElapsed), [monthExpenses, daysElapsed])
  const st = stats(monthExpenses, daysElapsed)
  const donutData = byCat.map((c) => ({ ...c, color: catColor(c.name) }))

  const addExpense = (e) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return
    setState((s) => ({
      ...s,
      isSample: false,
      expenses: [
        { id: String(Date.now()), date: form.date, category: form.category, note: form.note.trim(), amount },
        ...(s.isSample ? [] : s.expenses),
      ],
    }))
    setForm((f) => ({ ...f, amount: '', note: '' }))
  }

  const removeExpense = (id) =>
    setState((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id) }))

  const clearAll = () => setState((s) => ({ ...s, isSample: false, expenses: [] }))

  const setNum = (key) => (e) =>
    setState((s) => ({ ...s, [key]: Math.max(parseFloat(e.target.value) || 0, 0) }))

  return (
    <main className="relative bg-black font-geist text-white">
      {/* Live photo background for the whole page below the hero */}
      <div className="absolute inset-0 z-0">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <LiveBackground />
        </div>
      </div>

      <section id="tracker" className="relative z-10 px-6 py-20 md:px-12 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-xs text-white/60 sm:text-sm">
            {now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })} · day {daysElapsed} of {daysInMonth}
          </p>
          <h2 className="mb-10 max-w-2xl text-3xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
            Your month, at a glance.
          </h2>

          {state.isSample && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md px-4 py-3 text-sm text-white/70">
              <span>You are looking at example data. Add your first expense to replace it.</span>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
              >
                Clear examples
              </button>
            </div>
          )}

          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5">
              <div className="mb-3 flex items-center gap-2 text-sm text-white/60">
                <Wallet size={16} /> Spent this month
              </div>
              <div className="text-3xl font-medium tracking-tight tabular-nums">{inr(spent)}</div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${left < 0 ? 'bg-amber-400' : 'bg-white'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-white/50">of {inr(spendable)} you can spend</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5">
              <div className="mb-3 flex items-center gap-2 text-sm text-white/60">
                <TrendingDown size={16} /> {left >= 0 ? 'Left to spend' : 'Over budget by'}
              </div>
              <div
                className={`text-3xl font-medium tracking-tight tabular-nums ${left < 0 ? 'text-amber-300' : ''}`}
              >
                {inr(Math.abs(left))}
              </div>
              <div className="mt-4 text-xs text-white/50">
                {daysElapsed < daysInMonth && left > 0
                  ? `About ${inr(left / (daysInMonth - daysElapsed))} a day for the remaining ${daysInMonth - daysElapsed} days`
                  : left > 0
                  ? 'Month complete'
                  : 'Savings goal is at risk'}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5">
              <div className="mb-3 flex items-center gap-2 text-sm text-white/60">
                <PiggyBank size={16} /> Projected savings
              </div>
              <div className="text-3xl font-medium tracking-tight tabular-nums">
                {inr(Math.max(projectedSaved, 0))}
              </div>
              <div className="mt-4 text-xs text-white/50">
                Goal {inr(state.goal)} ·{' '}
                {projectedSaved >= state.goal ? 'on track' : `short by ${inr(state.goal - Math.max(projectedSaved, 0))}`}
              </div>
            </div>
          </div>

          {/* Risk + statistics */}
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div
              className={`min-w-0 rounded-2xl border bg-black/40 p-5 backdrop-blur-md lg:col-span-3 ${riskUi[risk.level].ring}`}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <ShieldAlert size={16} /> Overspending risk
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm font-medium ${riskUi[risk.level].text}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${riskUi[risk.level].dot}`} />
                  {risk.label}
                </span>
              </div>
              <p className="mb-6 text-base leading-relaxed text-white/80 sm:text-lg">
                {riskMessage({
                  level: risk.level,
                  spent,
                  projected,
                  spendable,
                  daysElapsed,
                  daysInMonth,
                })}
              </p>
              <RiskMeter level={risk.level} ratio={risk.ratio} />
              {risk.early && (
                <p className="mt-4 text-xs text-white/40">
                  Early estimate: only {daysElapsed} {daysElapsed === 1 ? 'day' : 'days'} of data this month.
                </p>
              )}
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md lg:col-span-2">
              <div className="mb-4 flex items-center gap-2 text-sm text-white/60">
                <BarChart3 size={16} /> Spending statistics
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                <div>
                  <dt className="text-xs text-white/50">Average per day</dt>
                  <dd className="mt-1 text-xl font-medium tabular-nums">{inr(st.avgDay)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-white/50">Everyday spend per day</dt>
                  <dd className="mt-1 text-xl font-medium tabular-nums">{inr(perDay)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-white/50">Typical expense</dt>
                  <dd className="mt-1 text-xl font-medium tabular-nums">{inr(st.median)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-white/50">Largest expense</dt>
                  <dd className="mt-1 text-xl font-medium tabular-nums">{inr(st.largest)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-white/50">Busiest day</dt>
                  <dd className="mt-1 text-xl font-medium tabular-nums">
                    {st.busiest
                      ? new Date(st.busiest.date + 'T00:00:00').toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '–'}
                  </dd>
                  {st.busiest && <div className="text-xs text-white/40">{inr(st.busiest.total)}</div>}
                </div>
                <div>
                  <dt className="text-xs text-white/50">Transactions</dt>
                  <dd className="mt-1 text-xl font-medium tabular-nums">{st.n}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Trend graph */}
          <div className="mt-6 min-w-0 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-medium tracking-tight">Spending trend</h3>
              <span className="text-xs text-white/50">Cumulative spend, day by day</span>
            </div>
            <TrendChart
              actual={series}
              daysInMonth={daysInMonth}
              budget={spendable}
              projected={projected}
              level={risk.level}
            />
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/60">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 bg-white" /> Spent so far
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5" style={{ background: RISK[risk.level] }} /> Projected month end
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 border-t border-dashed border-white/50" /> Even pace to your limit
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            {/* Left: add + settings */}
            <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
              <form onSubmit={addExpense} className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5">
                <h3 className="mb-4 text-lg font-medium tracking-tight">Add an expense</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-1">
                    <label htmlFor="amount" className="mb-1.5 block text-xs text-white/60">
                      Amount (₹)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      placeholder="250"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className={field}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="date" className="mb-1.5 block text-xs text-white/60">
                      Date
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className={field}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="category" className="mb-1.5 block text-xs text-white/60">
                      Category
                    </label>
                    <select
                      id="category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className={field}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="note" className="mb-1.5 block text-xs text-white/60">
                      Note (optional)
                    </label>
                    <input
                      id="note"
                      type="text"
                      placeholder="Lunch, auto fare, recharge"
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className={field}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105"
                >
                  <Plus size={16} /> Add expense
                </button>
              </form>

              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5">
                <h3 className="mb-4 text-lg font-medium tracking-tight">Your monthly plan</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="income" className="mb-1.5 block text-xs text-white/60">
                      Income (₹)
                    </label>
                    <input
                      id="income"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={state.income}
                      onChange={setNum('income')}
                      className={field}
                    />
                  </div>
                  <div>
                    <label htmlFor="goal" className="mb-1.5 block text-xs text-white/60">
                      Save each month (₹)
                    </label>
                    <input
                      id="goal"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={state.goal}
                      onChange={setNum('goal')}
                      className={field}
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/50">
                  Spending budget is income minus your savings goal: {inr(spendable)}.
                </p>
              </div>
            </div>

            {/* Right: breakdown + list */}
            <div className="flex min-w-0 flex-col gap-6 lg:col-span-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5">
                <h3 className="mb-4 text-lg font-medium tracking-tight">Where it went</h3>
                {byCat.length > 0 && spent > 0 && <DonutChart data={donutData} total={spent} />}
                {byCat.length === 0 ? (
                  <p className="text-sm text-white/50">No expenses yet this month.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {byCat.map((c) => (
                      <li key={c.name}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                          <span className="flex items-center gap-2 text-white/80">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: catColor(c.name) }}
                            />
                            {c.name}
                          </span>
                          <span className="tabular-nums text-white/60">
                            {inr(c.total)} · {Math.round((c.total / spent) * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(c.total / spent) * 100}%`, background: catColor(c.name) }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-5">
                <h3 className="mb-4 text-lg font-medium tracking-tight">Recent expenses</h3>
                {monthExpenses.length === 0 ? (
                  <p className="text-sm text-white/50">
                    Nothing logged yet. Add your first expense using the form.
                  </p>
                ) : (
                  <ul className="max-h-80 divide-y divide-white/10 overflow-y-auto pr-1">
                    {monthExpenses.map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: catColor(e.category) }}
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm text-white/90">{e.note || e.category}</div>
                            <div className="text-xs text-white/40">
                              {e.category} ·{' '}
                              {new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-sm tabular-nums">{inr(e.amount)}</span>
                          <button
                            type="button"
                            aria-label={`Delete ${e.note || e.category}`}
                            onClick={() => removeExpense(e.id)}
                            className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="insights" className="relative z-10 border-t border-white/10 px-6 py-20 md:px-12 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 flex items-center gap-2 text-xs text-white/60 sm:text-sm">
            <Sparkles size={14} /> AI savings insights
          </p>
          <h2 className="mb-10 max-w-2xl text-3xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
            Where you can save more.
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((i, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6">
                <span
                  className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium ${toneStyle[i.tone]}`}
                >
                  {toneLabel[i.tone]}
                </span>
                <h3 className="mb-2 text-lg font-medium leading-snug tracking-tight">{i.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{i.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="reach" className="relative z-10 border-t border-white/10 px-6 py-12 md:px-12 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-white/50">
          <span className="text-lg font-semibold tracking-tight text-white">MoneyMitra</span>
          <span>Your data stays in this browser. Nothing is sent to a server.</span>
        </div>
      </footer>
    </main>
  )
}
