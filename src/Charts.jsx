import { RISK, inr } from './analytics.js'

const short = (v) => (v >= 1000 ? `₹${+(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `₹${Math.round(v)}`)

export function DonutChart({ data, total }) {
  const R = 62
  const C = 2 * Math.PI * R
  const gap = data.length > 1 ? 3 : 0
  let offset = 0
  return (
    <div className="mb-6 flex justify-center">
      <svg viewBox="0 0 180 180" className="h-48 w-48" role="img" aria-label="Spending by category">
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="22" />
        {data.map((d) => {
          const len = (d.total / total) * C
          const seg = Math.max(len - gap, 0.5)
          const el = (
            <circle
              key={d.name}
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke={d.color}
              strokeWidth="22"
              strokeDasharray={`${seg} ${C - seg}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 90 90)"
            >
              <title>{`${d.name}: ${inr(d.total)} (${Math.round((d.total / total) * 100)}%)`}</title>
            </circle>
          )
          offset += len
          return el
        })}
        <text x="90" y="84" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10">
          Total
        </text>
        <text x="90" y="104" textAnchor="middle" fill="#ffffff" fontSize="17" fontWeight="500">
          {inr(total)}
        </text>
      </svg>
    </div>
  )
}

export function TrendChart({ actual, daysInMonth, budget, projected, level }) {
  const W = 640
  const H = 260
  const L = 54
  const R = 16
  const T = 14
  const B = 30
  const color = RISK[level]
  const last = actual.length ? actual[actual.length - 1] : { day: 1, total: 0 }
  const maxY = Math.max(budget, projected, last.total, 1) * 1.12
  const x = (d) => L + ((d - 1) / Math.max(daysInMonth - 1, 1)) * (W - L - R)
  const y = (v) => T + (1 - v / maxY) * (H - T - B)

  const rough = maxY / 4
  const mag = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough)
  const ticks = []
  for (let v = 0; v <= maxY; v += step) ticks.push(v)

  const line = actual.map((p, i) => `${i ? 'L' : 'M'}${x(p.day)} ${y(p.total)}`).join(' ')
  const area = actual.length
    ? `${line} L${x(last.day)} ${y(0)} L${x(actual[0].day)} ${y(0)} Z`
    : ''
  const xDays = [...new Set([1, 8, 15, 22, daysInMonth])].filter((d) => d <= daysInMonth)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Cumulative spending this month">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.08)" />
          <text x={L - 8} y={y(v) + 3.5} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="10">
            {short(v)}
          </text>
        </g>
      ))}
      {xDays.map((d) => (
        <text key={d} x={x(d)} y={H - 10} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">
          {d}
        </text>
      ))}

      {/* spending limit */}
      <line x1={L} x2={W - R} y1={y(budget)} y2={y(budget)} stroke="rgba(255,255,255,0.45)" strokeDasharray="2 4" />
      <text x={L + 6} y={y(budget) - 6} fill="rgba(255,255,255,0.65)" fontSize="10">
        Limit {short(budget)}
      </text>

      {/* even pace toward the limit */}
      <line x1={x(1)} y1={y(0)} x2={x(daysInMonth)} y2={y(budget)} stroke="rgba(255,255,255,0.28)" strokeDasharray="6 5" />

      {/* actual */}
      {area && <path d={area} fill="url(#trendFill)" />}
      {line && <path d={line} fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />}

      {/* projection */}
      <path
        d={`M${x(last.day)} ${y(last.total)} L${x(daysInMonth)} ${y(projected)}`}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeDasharray="7 5"
        strokeLinecap="round"
      />
      <circle cx={x(daysInMonth)} cy={y(projected)} r="4" fill={color} />
      <text x={x(daysInMonth) - 8} y={y(projected) - 9} textAnchor="end" fill={color} fontSize="11" fontWeight="500">
        {short(projected)}
      </text>

      {/* today */}
      <circle cx={x(last.day)} cy={y(last.total)} r="4.5" fill="#ffffff" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
    </svg>
  )
}

export function RiskMeter({ level, ratio }) {
  const MAX = 1.3
  const pos = Math.min(Math.max(ratio, 0), MAX) / MAX
  return (
    <div>
      <div className="relative">
        <div className="flex h-3 overflow-hidden rounded-full">
          <div style={{ width: `${(0.85 / MAX) * 100}%`, background: RISK.green, opacity: 0.85 }} />
          <div style={{ width: `${(0.15 / MAX) * 100}%`, background: RISK.yellow, opacity: 0.9 }} />
          <div style={{ width: `${(0.3 / MAX) * 100}%`, background: RISK.red, opacity: 0.85 }} />
        </div>
        <div
          className="absolute top-1/2 h-6 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_2px_rgba(0,0,0,0.6)]"
          style={{ left: `${pos * 100}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-3 flex justify-between text-xs text-white/50">
        <span>Safe</span>
        <span>Projected at {Math.round(ratio * 100)}% of your limit</span>
        <span>Over</span>
      </div>
      <span className="sr-only">Risk level: {level}</span>
    </div>
  )
}
