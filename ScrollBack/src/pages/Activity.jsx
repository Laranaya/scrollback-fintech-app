import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  CircleDot,
  Hand,
  Landmark,
  LifeBuoy,
  ListChecks,
  PartyPopper,
  PiggyBank,
  Settings2,
  Smartphone,
  Unlock,
} from 'lucide-react'
import { EmptyState } from '../components/StateViews.jsx'
import { useApp } from '../state/AppContext.jsx'
import { formatGBP } from '../lib/format.js'
import { formatLongDate } from '../lib/dates.js'

const TYPE_ICONS = {
  lock: Landmark,
  release: Unlock,
  vault_complete: PartyPopper,
  scroll: Smartphone,
  warning: AlertTriangle,
  goal: BookOpenCheck,
  day: CalendarDays,
  expire: PiggyBank,
  hardship: LifeBuoy,
  settings: Settings2,
  welcome: Hand,
}

const FILTERS = [
  { id: 'all', label: 'All', types: null },
  { id: 'money', label: 'Money', types: ['lock', 'release', 'vault_complete', 'expire', 'hardship'] },
  { id: 'learning', label: 'Learning', types: ['goal'] },
  { id: 'scrolling', label: 'Scrolling', types: ['scroll', 'warning'] },
]

export default function Activity() {
  const { account } = useApp()
  const [filter, setFilter] = useState('all')

  const groups = useMemo(() => {
    const allowed = FILTERS.find((f) => f.id === filter).types
    const items = account.activity.filter((a) => !allowed || allowed.includes(a.type))
    const map = new Map()
    items.forEach((a) => {
      if (!map.has(a.date)) map.set(a.date, [])
      map.get(a.date).push(a)
    })
    return [...map.entries()]
  }, [account.activity, filter])

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Everything that happened</p>
          <h1 className="page__title">Activity</h1>
        </div>
      </header>

      <div className="filters" role="group" aria-label="Filter activity">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`filter${filter === f.id ? ' is-active' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <section className="card">
          <EmptyState icon={ListChecks} title="Nothing here yet" message="Log some scrolling or finish your goal and it will show up in this feed." />
        </section>
      ) : (
        groups.map(([date, items]) => (
          <section key={date} className="stack" aria-label={formatLongDate(date)}>
            <h2 className="day-heading">{formatLongDate(date)}</h2>
            <ul className="feed">
              {items.map((a) => {
                const Icon = TYPE_ICONS[a.type] ?? CircleDot
                return (
                  <li key={a.id} className={`feed__item feed__item--${a.tone ?? 'info'}`}>
                    <span className="feed__icon">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div className="feed__body">
                      <p className="feed__title">{a.title}</p>
                      {a.detail ? <p className="feed__detail">{a.detail}</p> : null}
                    </div>
                    <div className="feed__side">
                      {a.amount ? (
                        <span className={`feed__amount ${a.amount > 0 ? 'is-plus' : 'is-minus'}`}>
                          {a.amount > 0 ? '+' : '\u2212'}
                          {formatGBP(Math.abs(a.amount))}
                        </span>
                      ) : null}
                      <span className="feed__time">{a.time}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
