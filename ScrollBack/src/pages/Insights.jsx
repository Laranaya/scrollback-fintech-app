import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Flame, PiggyBank, Timer, Trophy } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { getInsights } from '../lib/selectors.js'
import { formatGBP, formatMinutes } from '../lib/format.js'
import { formatShortDate, formatWeekday } from '../lib/dates.js'

const COLORS = { safe: '#6FAE8B', over: '#D9826B', idle: '#3A4A6B', limit: '#E2BE6A', text: '#A9B4CC' }

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="chart-tip">
      <p className="chart-tip__title">{formatShortDate(d.date)}</p>
      <p>
        {d.minutes} of {d.limit} min
      </p>
      <p>{d.goalDone ? 'Goal done' : 'Goal not done'}</p>
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-card__icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__label">{label}</p>
    </div>
  )
}

export default function Insights() {
  const { account } = useApp()
  const insights = getInsights(account)
  const limit = account.contract.dailyLimit
  const data = insights.days.map((d) => ({ ...d, label: d.isToday ? 'Today' : formatWeekday(d.date) }))

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Last 14 days</p>
          <h1 className="page__title">Insights</h1>
        </div>
      </header>

      <p className="lede-card">{insights.summary}</p>

      <div className="stat-grid">
        <Stat icon={Timer} label="Time reclaimed" value={formatMinutes(insights.reclaimed)} />
        <Stat icon={Trophy} label="Earned back" value={formatGBP(insights.earnedBack)} />
        <Stat icon={PiggyBank} label="Sent to Future Me" value={formatGBP(insights.sentToFuture)} />
        <Stat icon={Flame} label={`Streak (best ${insights.bestStreak})`} value={`${insights.streak} ${insights.streak === 1 ? 'day' : 'days'}`} />
      </div>

      <section className="card" aria-labelledby="chart-title">
        <div className="card__head">
          <h2 id="chart-title" className="card__title">
            Daily scrolling vs your {limit} min limit
          </h2>
        </div>
        <div className="chart" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="rgba(244,239,228,0.08)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} interval={0} />
              <YAxis tick={{ fill: COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
              <Tooltip cursor={{ fill: 'rgba(244,239,228,0.05)' }} content={<ChartTooltip />} />
              <ReferenceLine y={limit} stroke={COLORS.limit} strokeDasharray="5 4" />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.date} fill={!d.tracked ? COLORS.idle : d.minutes > d.limit ? COLORS.over : COLORS.safe} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="legend" aria-hidden="true">
          <li>
            <span className="legend__swatch" style={{ background: COLORS.safe }} /> Within limit
          </li>
          <li>
            <span className="legend__swatch" style={{ background: COLORS.over }} /> Over limit
          </li>
          <li>
            <span className="legend__swatch legend__swatch--line" /> Your limit
          </li>
        </ul>
        <table className="sr-only">
          <caption>Minutes scrolled per day against a limit of {limit} minutes</caption>
          <thead>
            <tr>
              <th>Day</th>
              <th>Minutes</th>
              <th>Goal done</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <td>{formatShortDate(d.date)}</td>
                <td>{d.minutes}</td>
                <td>{d.goalDone ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" aria-labelledby="goal-days-title">
        <div className="card__head">
          <h2 id="goal-days-title" className="card__title">
            Goal days
          </h2>
        </div>
        <ul className="goal-days">
          {data.map((d) => (
            <li key={d.date} className={`goal-days__day${d.goalDone ? ' is-done' : ''}`}>
              <span className="goal-days__dot" aria-hidden="true" />
              <span className="goal-days__label">{d.isToday ? 'Today' : formatWeekday(d.date)}</span>
              <span className="sr-only">{d.goalDone ? 'goal done' : 'goal not done'} on {formatShortDate(d.date)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
