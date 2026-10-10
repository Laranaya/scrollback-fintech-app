import { useState } from 'react'
import { Check, Clock, History, LifeBuoy, Loader2, Minus, PiggyBank, Shield } from 'lucide-react'
import Modal from '../components/Modal.jsx'
import { ModeBadge } from '../components/Brand.jsx'
import { EmptyState } from '../components/StateViews.jsx'
import { useApp } from '../state/AppContext.jsx'
import { vaultEndDate } from '../lib/engine.js'
import { formatGBP, pluralise } from '../lib/format.js'
import { addDays, formatShortDate, formatWeekday } from '../lib/dates.js'

const HISTORY_LABELS = {
  completed: 'Completed',
  hardship: 'Hardship exit',
}

function DayStrip({ vault, today }) {
  const days = vault.elapsed.map((e) => ({ date: e.date, state: e.status }))
  const todayDone = days.some((d) => d.date === today)
  for (let i = 0; i < vault.remainingDays; i++) {
    const offset = todayDone ? i + 1 : i
    days.push({ date: addDays(today, offset), state: offset === 0 ? 'today' : 'upcoming' })
  }
  const labels = { released: 'goal done, slice released', missed: 'goal missed, slice not released', today: 'today', upcoming: 'still to come' }
  return (
    <ol className="daystrip" aria-label="Lock timeline">
      {days.map((d, i) => (
        <li key={`${d.date}-${i}`} className={`daystrip__day daystrip__day--${d.state}`}>
          <span className="daystrip__wd">{formatWeekday(d.date)}</span>
          <span className="daystrip__dot" aria-hidden="true">
            {d.state === 'released' ? <Check size={14} /> : d.state === 'missed' ? <Minus size={14} /> : null}
          </span>
          <span className="daystrip__date">{formatShortDate(d.date)}</span>
          <span className="sr-only">{labels[d.state]}</span>
        </li>
      ))}
    </ol>
  )
}

function ActiveVault({ account }) {
  const { vault, today } = account
  const earned = vault.originalAmount > 0 ? Math.min(100, (vault.releasedAmount / vault.originalAmount) * 100) : 0
  return (
    <section className="card card--lg" aria-labelledby="active-vault">
      <div className="card__head">
        <h2 id="active-vault" className="card__title">
          Active lock
        </h2>
        <ModeBadge mode={vault.mode} />
      </div>
      <p className="vault-amount vault-amount--lg">{formatGBP(vault.lockedAmount)}</p>
      <p className="vault-sub">still locked of {formatGBP(vault.originalAmount)}</p>
      <div className="meter" role="progressbar" aria-label="Earned back" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(earned)}>
        <span className="meter__fill" style={{ width: `${earned}%` }} />
      </div>
      <dl className="stats">
        <div>
          <dt>Earned back</dt>
          <dd>{formatGBP(vault.releasedAmount)}</dd>
        </div>
        <div>
          <dt>Daily slice</dt>
          <dd>{formatGBP(Math.min(vault.dailySlice, vault.lockedAmount))}</dd>
        </div>
        <div>
          <dt>Days left</dt>
          <dd>{vault.remainingDays}</dd>
        </div>
        <div>
          <dt>Unlocks</dt>
          <dd>{formatShortDate(vaultEndDate(account))}</dd>
        </div>
      </dl>
      <h3 className="subhead">Day by day</h3>
      <DayStrip vault={vault} today={today.date} />
      <p className="hint hint--left">
        Complete your goal each day to release one slice. Anything not earned by the end moves to Future Me, so nothing is lost.
      </p>
    </section>
  )
}

function HistoryList({ items }) {
  if (items.length === 0) {
    return <EmptyState icon={History} title="No past locks yet" message="Finished and released Vaults will be listed here." />
  }
  return (
    <ul className="rows">
      {items.map((v) => (
        <li key={v.id} className="row">
          <div className="row__main">
            <p className="row__title">
              {formatGBP(v.amount)} · {pluralise(v.totalDays, 'day')}
            </p>
            <p className="row__detail">
              {formatShortDate(v.startDate)} to {formatShortDate(v.endDate)} · {HISTORY_LABELS[v.status] ?? v.status}
            </p>
          </div>
          <dl className="row__figures">
            <div>
              <dt>Earned back</dt>
              <dd>{formatGBP(v.earnedBack)}</dd>
            </div>
            {v.movedToFuture > 0 ? (
              <div>
                <dt>To Future Me</dt>
                <dd>{formatGBP(v.movedToFuture)}</dd>
              </div>
            ) : null}
            {v.returnedEarly > 0 ? (
              <div>
                <dt>Returned</dt>
                <dd>{formatGBP(v.returnedEarly)}</dd>
              </div>
            ) : null}
          </dl>
        </li>
      ))}
    </ul>
  )
}

export default function Vault() {
  const { account, hardshipExit } = useApp()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const { vault, balances, vaultHistory } = account

  async function release() {
    setBusy(true)
    const result = await hardshipExit()
    setBusy(false)
    if (result) setConfirming(false)
  }

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Locked, never lost</p>
          <h1 className="page__title">Vault</h1>
        </div>
      </header>

      {vault ? (
        <ActiveVault account={account} />
      ) : (
        <section className="card card--lg">
          <EmptyState
            icon={Shield}
            title="Your Vault is empty"
            message="If you go over your daily limit, a small slice of your own money will be locked here. For now everything is in your main balance."
          />
        </section>
      )}

      <div className="grid-2">
        <section className="card" aria-labelledby="future-title">
          <div className="card__head">
            <h2 id="future-title" className="card__title">
              Future Me
            </h2>
            <PiggyBank size={20} aria-hidden="true" className="card__icon" />
          </div>
          <p className="vault-amount">{formatGBP(balances.futureMe)}</p>
          <p className="vault-sub">
            Slices you didn&apos;t earn back by the end of a lock land here. It&apos;s still your money, just set aside for later.
          </p>
        </section>

        <section className="card" aria-labelledby="hardship-title">
          <div className="card__head">
            <h2 id="hardship-title" className="card__title">
              Hardship exit
            </h2>
            <LifeBuoy size={20} aria-hidden="true" className="card__icon" />
          </div>
          <p className="vault-sub">
            Need your money now? Release the whole Vault back to your main balance. No questions, no penalty.
          </p>
          <button type="button" className="btn btn--outline" onClick={() => setConfirming(true)} disabled={!vault}>
            <Clock size={18} aria-hidden="true" /> Release my Vault
          </button>
          {!vault ? <p className="hint hint--left">Available when something is locked.</p> : null}
        </section>
      </div>

      <section aria-labelledby="past-title" className="stack">
        <h2 id="past-title" className="section-title">
          Past locks
        </h2>
        <HistoryList items={vaultHistory} />
      </section>

      <Modal
        open={confirming}
        title="Release your whole Vault?"
        onClose={() => !busy && setConfirming(false)}
        footer={
          <>
            <button type="button" className="btn btn--outline" onClick={() => setConfirming(false)} disabled={busy}>
              Keep it locked
            </button>
            <button type="button" className="btn btn--gold" data-autofocus onClick={release} disabled={busy}>
              {busy ? <Loader2 className="spin" size={18} aria-hidden="true" /> : null}
              Release {vault ? formatGBP(vault.lockedAmount) : ''}
            </button>
          </>
        }
      >
        <p>
          {vault ? formatGBP(vault.lockedAmount) : 'Your Vault'} will return to your main balance straight away and this lock will end. You can always start
          again later.
        </p>
      </Modal>
    </div>
  )
}
