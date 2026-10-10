import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Flame, Landmark, Loader2, PiggyBank, Shield, Wallet } from 'lucide-react'
import AnimatedNumber from '../components/AnimatedNumber.jsx'
import ProgressRing from '../components/ProgressRing.jsx'
import { AppIcon, GoalIcon, ModeBadge } from '../components/Brand.jsx'
import { EmptyState } from '../components/StateViews.jsx'
import { useApp } from '../state/AppContext.jsx'
import { GOALS, MODES } from '../lib/constants.js'
import { gracePassesLeft, vaultEndDate } from '../lib/engine.js'
import { formatGBP, formatMinutes, pluralise } from '../lib/format.js'
import { formatLongDate, formatShortDate } from '../lib/dates.js'

function BalanceCard({ id, label, icon: Icon, value, note, tone }) {
  return (
    <section className={`balance balance--${tone}`} data-balance={id} aria-label={label}>
      <div className="balance__head">
        <span className="balance__icon">
          <Icon size={18} aria-hidden="true" />
        </span>
        <h2 className="balance__label">{label}</h2>
      </div>
      <p className="balance__amount">
        <AnimatedNumber value={value} />
      </p>
      <p className="balance__note">{note}</p>
    </section>
  )
}

function TodayCard({ account }) {
  const { today, contract } = account
  const left = contract.dailyLimit - today.totalMinutes
  const headline =
    today.totalMinutes === 0
      ? 'A clean slate'
      : left >= 0
        ? `${formatMinutes(left)} left today`
        : `${formatMinutes(-left)} over today`

  let sub = 'Nothing logged yet. Every minute you don\u2019t scroll is a minute kept.'
  if (today.sessions.length) {
    sub = today.graceDay
      ? 'Your grace pass covered today, so nothing was locked.'
      : left >= 0
        ? left <= contract.dailyLimit * 0.3
          ? 'Getting close. A quick lesson is a good swap.'
          : 'You\u2019re comfortably within your limit.'
        : 'Over your limit. Finishing your goal still releases today\u2019s slice.'
  }

  return (
    <section className="card today" aria-labelledby="today-title">
      <div className="card__head">
        <h2 id="today-title" className="card__title">
          Today&apos;s scrolling
        </h2>
        <span className="card__meta">{contract.apps.length} apps tracked</span>
      </div>
      <div className="today__body">
        <ProgressRing minutes={today.totalMinutes} limit={contract.dailyLimit} />
        <div className="today__text">
          <p className="today__headline">{headline}</p>
          <p className="today__sub">{sub}</p>
          {today.sessions.length ? (
            <ul className="sessions" aria-label="Sessions today">
              {[...today.sessions].reverse().slice(0, 4).map((s) => (
                <li key={s.id}>
                  <AppIcon app={s.app} />
                  <span className="sessions__app">{s.app}</span>
                  <span className="sessions__min">{s.minutes} min</span>
                  <span className="sessions__time">{s.time}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function GoalCard({ account }) {
  const { completeGoal } = useApp()
  const [busy, setBusy] = useState(false)
  const { contract, today, vault } = account
  const goal = GOALS[contract.goalSource]

  async function markDone() {
    setBusy(true)
    await completeGoal(contract.goalSource)
    setBusy(false)
  }

  return (
    <section className={`card goal${today.goalDone ? ' is-done' : ''}`} aria-labelledby="goal-title">
      <div className="card__head">
        <h2 id="goal-title" className="card__title">
          Today&apos;s learning goal
        </h2>
      </div>
      <div className="goal__row">
        <span className="goal__icon">
          <GoalIcon source={goal.id} size={24} />
        </span>
        <div>
          <p className="goal__name">{goal.requirement}</p>
          <p className="goal__source">on {goal.name}</p>
        </div>
      </div>
      {today.goalDone ? (
        <p className="goal__status goal__status--done" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          Done for today.
          {today.releasedToday > 0 ? ` ${formatGBP(today.releasedToday)} released.` : ''}
        </p>
      ) : (
        <>
          <p className="goal__status">
            {vault
              ? `Finish this to release ${formatGBP(Math.min(vault.dailySlice, vault.lockedAmount))} from your Vault.`
              : 'Nothing is locked, so this just keeps your streak going.'}
          </p>
          <button type="button" className="btn btn--gold btn--block" onClick={markDone} disabled={busy}>
            {busy ? <Loader2 className="spin" size={18} aria-hidden="true" /> : null}
            {busy ? 'Checking\u2026' : `I finished my ${contract.goalSource === 'github_pr' ? 'pull request' : contract.goalSource === 'linkedin_module' ? 'module' : 'lesson'}`}
          </button>
          <p className="hint hint--left">In a live setup {goal.name} tells ScrollBack for you. This button stands in for that.</p>
        </>
      )}
    </section>
  )
}

function VaultCard({ account }) {
  const { vault } = account
  if (!vault) {
    return (
      <section className="card" aria-labelledby="vault-title">
        <div className="card__head">
          <h2 id="vault-title" className="card__title">
            Vault
          </h2>
        </div>
        <EmptyState
          icon={Shield}
          title="Nothing is locked"
          message="Stay within your daily limit and your money stays right where it is."
        />
      </section>
    )
  }
  const earned = vault.originalAmount > 0 ? Math.min(100, (vault.releasedAmount / vault.originalAmount) * 100) : 0
  return (
    <section className="card" aria-labelledby="vault-title">
      <div className="card__head">
        <h2 id="vault-title" className="card__title">
          Vault
        </h2>
        <ModeBadge mode={vault.mode} />
      </div>
      <p className="vault-amount">{formatGBP(vault.lockedAmount)} locked</p>
      <div
        className="meter"
        role="progressbar"
        aria-label="Earned back"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(earned)}
      >
        <span className="meter__fill" style={{ width: `${earned}%` }} />
      </div>
      <p className="vault-foot">
        {formatGBP(vault.releasedAmount)} earned back · {pluralise(vault.remainingDays, 'day')} to go · unlocks{' '}
        {formatShortDate(vaultEndDate(account))}
      </p>
      <Link to="/app/vault" className="link-arrow">
        See Vault details <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  )
}

export default function Dashboard() {
  const { account } = useApp()
  const { balances, vault, contract, streak } = account
  const graceLeft = gracePassesLeft(account)

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{formatLongDate(account.today.date)}</p>
          <h1 className="page__title">Hello, {account.user.username}</h1>
        </div>
        <div className="page__chips">
          <ModeBadge mode={contract.mode} />
          <span className="pill" title="Consecutive days with your goal completed">
            <Flame size={16} aria-hidden="true" /> {pluralise(streak, 'day')} streak
          </span>
        </div>
      </header>

      <div className="balances">
        <BalanceCard id="main" label="Main balance" icon={Wallet} value={balances.main} tone="main" note="Free to use. Always yours." />
        <BalanceCard
          id="vault"
          label="Vault"
          icon={Landmark}
          value={balances.vault}
          tone="vault"
          note={vault ? `Locked until ${formatShortDate(vaultEndDate(account))}` : 'Nothing locked right now'}
        />
        <BalanceCard id="future" label="Future Me" icon={PiggyBank} value={balances.futureMe} tone="future" note="Savings from unearned slices" />
      </div>

      {contract.mode === 'friendly' && graceLeft > 0 ? (
        <p className="notice notice--info" role="note">
          <Shield size={18} aria-hidden="true" />
          You have {graceLeft} free grace pass. The first time you go over, you&apos;ll get a warning instead of a lock.
        </p>
      ) : null}

      <div className="grid-2">
        <TodayCard account={account} />
        <GoalCard account={account} />
      </div>
      <VaultCard account={account} />
      <p className="hint hint--left">
        {MODES[contract.mode].label} mode · limit {contract.dailyLimit} min a day. Change this any time in{' '}
        <Link to="/app/settings">Settings</Link>.
      </p>
    </div>
  )
}
