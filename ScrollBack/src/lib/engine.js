// ScrollBack business logic. Pure JS with no browser or React dependencies, so the same rules
// can be ported to a real backend. Every public function takes the current account, clones it,
// applies the change and returns { state, effects }. Effects are UI hints (toasts, coin flights,
// confetti) and are never persisted.

import { AFFORDABILITY_CAP, GOALS, MAX_SESSION_MINUTES, MODES, STARTING_BALANCES } from './constants.js'
import { addDays, formatShortDate, nowTime, toISODate } from './dates.js'
import { ApiError } from './api/errors.js'
import { ceil2, clamp, formatGBP, pluralise, round05, round2 } from './format.js'

let counter = 0
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function run(state, fn) {
  const draft = structuredClone(state)
  const effects = []
  fn(draft, effects)
  return { state: draft, effects }
}

function effect(type, tone, title, message, extra = {}) {
  return { type, tone, title, message, ...extra }
}

function log(d, { type, title, detail = '', amount = null, tone = 'info', date, time }) {
  d.activity.unshift({
    id: uid('act'),
    type,
    title,
    detail,
    amount,
    tone,
    date: date ?? d.today.date,
    time: time ?? nowTime(),
  })
  if (d.activity.length > 200) d.activity.length = 200
}

function newDay(date) {
  return {
    date,
    sessions: [],
    totalMinutes: 0,
    penalisedOverage: 0,
    graceDay: false,
    goalDone: false,
    sliceReleased: false,
    lockedToday: 0,
    releasedToday: 0,
  }
}

export function vaultEndDate(account) {
  return account.vault ? addDays(account.today.date, account.vault.remainingDays) : null
}

export function gracePassesLeft(account) {
  const rules = MODES[account.contract?.mode]
  if (!rules) return 0
  return Math.max(0, rules.gracePasses - (account.gracePassUsed ? 1 : 0))
}

/* ------------------------------------------------------------------ */
/* Account creation                                                    */
/* ------------------------------------------------------------------ */

export function createInitialAccount(username) {
  return {
    version: 1,
    user: { username },
    onboardingComplete: false,
    contract: null,
    balances: { ...STARTING_BALANCES },
    vault: null,
    vaultHistory: [],
    gracePassUsed: false,
    today: newDay(toISODate(new Date())),
    streak: 0,
    bestStreak: 0,
    history: [],
    activity: [],
  }
}

/* ------------------------------------------------------------------ */
/* Penalty calculation                                                 */
/* ------------------------------------------------------------------ */

function rawPenalty(rules, overage) {
  if (overage <= 0) return { severity: 0, amount: 0, lockDays: 0 }
  const severity = Math.min(1, overage / rules.maxOverage)
  const amount = clamp(round05(rules.minAmount + severity * (rules.maxAmount - rules.minAmount)), rules.minAmount, rules.maxAmount)
  const lockDays = Math.floor(rules.minDays + severity * (rules.maxDays - rules.minDays))
  return { severity, amount, lockDays }
}

/**
 * Works out what to lock for today's scrolling.
 * Only the DIFFERENCE between today's total penalty and what was already penalised is returned,
 * so several sessions in a day are never double-charged. The charge is capped at 25% of the
 * main balance. Returns null when there is nothing new to charge.
 */
export function calculatePenalty(mode, dailyLimit, totalMinutesToday, alreadyPenalisedOverage = 0, mainBalance = Infinity) {
  const rules = MODES[mode]
  if (!rules) throw new ApiError(`Unknown mode: ${mode}`)
  const overage = Math.max(0, totalMinutesToday - dailyLimit)
  if (overage === 0) return null

  const total = rawPenalty(rules, overage)
  const before = rawPenalty(rules, alreadyPenalisedOverage)
  let amount = Math.max(0, round2(total.amount - before.amount))
  const lockDays = Math.max(0, total.lockDays - before.lockDays)
  if (amount === 0 && lockDays === 0) return null

  const cap = Math.floor(mainBalance * AFFORDABILITY_CAP * 100) / 100
  const capped = amount > cap
  if (capped) amount = Math.max(0, cap)

  return {
    mode,
    overage,
    severity: total.severity,
    amount,
    lockDays,
    totalAmount: total.amount,
    totalLockDays: total.lockDays,
    capped,
  }
}

/* ------------------------------------------------------------------ */
/* Locking and releasing                                               */
/* ------------------------------------------------------------------ */

function lockInto(d, penalty, fx) {
  const rules = MODES[penalty.mode]
  const amount = round2(penalty.amount)

  if (amount <= 0 && !d.vault) {
    fx.push(
      effect(
        'capped',
        'info',
        'Affordability cap reached',
        'A lock can never exceed 25% of your main balance, so nothing was locked this time.',
      ),
    )
    return false
  }

  d.balances.main = round2(d.balances.main - amount)
  const extended = Boolean(d.vault)

  if (d.vault) {
    const v = d.vault
    v.lockedAmount = round2(v.lockedAmount + amount)
    v.originalAmount = round2(v.originalAmount + amount)
    v.remainingDays = Math.max(v.remainingDays, Math.min(rules.maxDays, v.remainingDays + penalty.lockDays))
    v.totalDays = v.elapsed.length + v.remainingDays
  } else {
    d.vault = {
      id: uid('vault'),
      lockedAmount: amount,
      originalAmount: amount,
      releasedAmount: 0,
      mode: penalty.mode,
      startDate: d.today.date,
      totalDays: penalty.lockDays,
      remainingDays: penalty.lockDays,
      dailySlice: 0,
      elapsed: [],
    }
  }

  const v = d.vault
  v.dailySlice = ceil2(v.lockedAmount / v.remainingDays)
  d.balances.vault = v.lockedAmount
  d.today.lockedToday = round2(d.today.lockedToday + amount)

  const endLabel = formatShortDate(addDays(d.today.date, v.remainingDays))
  const capNote = penalty.capped ? ' This was reduced to stay within the 25% affordability cap.' : ''
  log(d, {
    type: 'lock',
    title: extended ? `Added ${formatGBP(amount)} to your Vault` : `${formatGBP(amount)} locked in your Vault`,
    detail: `${pluralise(v.remainingDays, 'day')} remaining, unlocks ${endLabel}`,
    amount: -amount,
    tone: 'warning',
  })
  fx.push(
    effect(
      'lock',
      'warning',
      `${formatGBP(amount)} moved to your Vault`,
      `${extended ? 'Your lock now runs' : 'Locked'} for ${pluralise(v.remainingDays, 'day')}. It\u2019s still your money, so learn something to earn it back.${capNote}`,
      { amount, flow: { from: 'main', to: 'vault' } },
    ),
  )
  return true
}

/** Public wrapper: transfers penalty.amount from Main to Vault, creating or extending the Vault. */
export function applyLock(state, penalty) {
  return run(state, (d, fx) => {
    if (!penalty) return
    lockInto(d, penalty, fx)
  })
}

function archiveVault(d, status, { endDate, movedToFuture = 0, returnedEarly = 0 }) {
  const v = d.vault
  d.vaultHistory.unshift({
    id: v.id,
    amount: v.originalAmount,
    mode: v.mode,
    startDate: v.startDate,
    endDate,
    totalDays: v.totalDays,
    daysServed: v.elapsed.length,
    earnedBack: round2(v.releasedAmount),
    movedToFuture: round2(movedToFuture),
    returnedEarly: round2(returnedEarly),
    status,
    timeline: [...v.elapsed],
  })
  d.vault = null
  d.balances.vault = 0
}

function releaseSlice(d, fx, { catchUp = false } = {}) {
  const v = d.vault
  if (!v || d.today.sliceReleased) return 0
  const amount = round2(Math.min(v.dailySlice, v.lockedAmount))
  v.lockedAmount = round2(v.lockedAmount - amount)
  v.releasedAmount = round2(v.releasedAmount + amount)
  d.balances.main = round2(d.balances.main + amount)
  d.balances.vault = v.lockedAmount
  d.today.sliceReleased = true
  d.today.releasedToday = round2(d.today.releasedToday + amount)

  log(d, {
    type: 'release',
    title: `${formatGBP(amount)} released to your main balance`,
    detail: catchUp ? 'You had already learned today, so this slice came straight back' : `${formatGBP(v.lockedAmount)} still locked`,
    amount,
    tone: 'success',
  })
  fx.push(
    effect('release', 'success', `${formatGBP(amount)} released`, catchUp
      ? 'You had already learned today, so today\u2019s slice came straight back to you.'
      : `Back in your main balance. ${formatGBP(v.lockedAmount)} still in the Vault.`, {
      amount,
      flow: { from: 'vault', to: 'main' },
    }),
  )

  if (v.lockedAmount <= 0) {
    v.elapsed.push({ date: d.today.date, status: 'released' })
    archiveVault(d, 'completed', { endDate: d.today.date })
    log(d, { type: 'vault_complete', title: 'Vault fully earned back', detail: 'Every slice returned to you', tone: 'success' })
    fx.push(effect('vault_complete', 'success', 'Vault fully earned back', 'Every last penny is back in your main balance. Brilliant.', { confetti: true }))
  }
  return amount
}

/* ------------------------------------------------------------------ */
/* Screen time                                                         */
/* ------------------------------------------------------------------ */

export function ingestScreenTime(state, { app, minutes }) {
  return run(state, (d, fx) => {
    const mins = Math.round(Number(minutes))
    if (!app) throw new ApiError('Choose an app first.')
    if (!Number.isFinite(mins) || mins < 1) throw new ApiError('Add at least 1 minute.')
    if (mins > MAX_SESSION_MINUTES) throw new ApiError(`A single session can be at most ${MAX_SESSION_MINUTES} minutes.`)

    const t = d.today
    const { mode, dailyLimit } = d.contract
    t.sessions.push({ id: uid('ses'), app, minutes: mins, time: nowTime() })
    t.totalMinutes += mins
    const overage = Math.max(0, t.totalMinutes - dailyLimit)

    log(d, {
      type: 'scroll',
      title: `${mins} min on ${app}`,
      detail: `${t.totalMinutes} of ${dailyLimit} min used today`,
      tone: overage > 0 ? 'warning' : 'info',
    })

    if (overage === 0) {
      const left = dailyLimit - t.totalMinutes
      const nearing = t.totalMinutes / dailyLimit >= 0.7
      fx.push(
        effect(
          'scroll',
          nearing ? 'warning' : 'info',
          `${mins} min added`,
          nearing
            ? `${left} min left before your limit. Maybe time for a lesson?`
            : `${t.totalMinutes} of ${dailyLimit} min used. You\u2019re doing well.`,
        ),
      )
      return
    }

    if (t.graceDay) {
      t.penalisedOverage = overage
      fx.push(effect('scroll', 'info', 'Grace pass still covers today', 'Nothing was locked. Tomorrow is a fresh start.'))
      return
    }

    const firstOverage = t.penalisedOverage === 0
    if (firstOverage && gracePassesLeft(d) > 0) {
      d.gracePassUsed = true
      t.graceDay = true
      t.penalisedOverage = overage
      log(d, {
        type: 'warning',
        title: 'Grace pass used',
        detail: 'You went over your limit, so we sent a warning instead of locking money',
        tone: 'warning',
      })
      fx.push(
        effect(
          'warning',
          'warning',
          'Heads up: you\u2019re over your limit',
          'Your free grace pass covered today, so nothing was locked. You have no more grace passes.',
        ),
      )
      return
    }

    const penalty = calculatePenalty(mode, dailyLimit, t.totalMinutes, t.penalisedOverage, d.balances.main)
    t.penalisedOverage = overage
    if (!penalty) return
    const locked = lockInto(d, penalty, fx)

    // Learned earlier today but the Vault only exists now: release today's slice straight away.
    if (locked && t.goalDone && !t.sliceReleased && d.vault) releaseSlice(d, fx, { catchUp: true })
  })
}

/* ------------------------------------------------------------------ */
/* Goals                                                               */
/* ------------------------------------------------------------------ */

export function completeGoal(state, { source }) {
  return run(state, (d, fx) => {
    const selected = d.contract.goalSource
    if (source !== selected) {
      throw new ApiError(`That event came from ${GOALS[source]?.name ?? source}, but your goal is ${GOALS[selected].name}.`)
    }
    if (d.today.goalDone) throw new ApiError('You\u2019ve already completed today\u2019s goal. See you tomorrow!', 409)

    d.today.goalDone = true
    d.streak += 1
    d.bestStreak = Math.max(d.bestStreak, d.streak)

    log(d, {
      type: 'goal',
      title: `${GOALS[selected].requirement} \u2013 done`,
      detail: `${pluralise(d.streak, 'day')} streak`,
      tone: 'success',
    })

    if (d.vault) {
      releaseSlice(d, fx)
      fx.push(effect('goal', 'success', 'Goal complete!', `${pluralise(d.streak, 'day')} streak. Lovely work.`, { confetti: true }))
    } else {
      fx.push(
        effect('goal', 'success', 'Goal complete!', `${pluralise(d.streak, 'day')} streak. Nothing is locked right now, so you\u2019re just building momentum.`, {
          confetti: true,
        }),
      )
    }
  })
}

/* ------------------------------------------------------------------ */
/* Day rollover                                                        */
/* ------------------------------------------------------------------ */

/** Closes out the current day and starts the next one. */
export function advanceDay(state) {
  return run(state, (d, fx) => {
    const closed = d.today
    d.history.push({
      date: closed.date,
      minutes: closed.totalMinutes,
      limit: d.contract.dailyLimit,
      goalDone: closed.goalDone,
      tracked: closed.sessions.length > 0,
      graceDay: closed.graceDay,
      locked: closed.lockedToday,
      released: closed.releasedToday,
      toFuture: 0,
    })
    if (d.history.length > 120) d.history.shift()

    d.today = newDay(addDays(closed.date, 1))

    if (!closed.goalDone && d.streak > 0) {
      log(d, { type: 'day', title: 'Streak reset', detail: 'Every day is a fresh start', tone: 'info' })
      fx.push(effect('streak_lost', 'info', 'Streak reset', 'No worries. Complete today\u2019s goal and start a new one.'))
    }
    if (!closed.goalDone) d.streak = 0

    const v = d.vault
    if (!v) return

    v.elapsed.push({ date: closed.date, status: closed.sliceReleased ? 'released' : 'missed' })
    if (!closed.sliceReleased) {
      log(d, {
        type: 'day',
        title: 'A slice stayed locked',
        detail: `${formatGBP(v.lockedAmount)} still in the Vault`,
        tone: 'info',
      })
    }
    v.remainingDays -= 1

    if (v.remainingDays <= 0) {
      const leftover = round2(v.lockedAmount)
      d.balances.futureMe = round2(d.balances.futureMe + leftover)
      d.history[d.history.length - 1].toFuture = leftover
      archiveVault(d, 'completed', { endDate: d.today.date, movedToFuture: leftover })
      if (leftover > 0) {
        log(d, {
          type: 'expire',
          title: `${formatGBP(leftover)} moved to Future Me`,
          detail: 'Your lock ended. The unearned slices are now your savings',
          amount: leftover,
          tone: 'info',
        })
        fx.push(
          effect('expire', 'info', `${formatGBP(leftover)} moved to Future Me`, 'Your lock has ended. The slices you didn\u2019t earn back are now your savings. Still your money, always.', {
            amount: leftover,
            flow: { from: 'vault', to: 'future' },
          }),
        )
      } else {
        log(d, { type: 'vault_complete', title: 'Vault fully earned back', detail: 'Every slice returned to you', tone: 'success' })
        fx.push(effect('vault_complete', 'success', 'Vault fully earned back', 'Every slice made it home. Superb.', { confetti: true }))
      }
    } else {
      d.balances.vault = v.lockedAmount
    }
  })
}

/* ------------------------------------------------------------------ */
/* Hardship exit                                                       */
/* ------------------------------------------------------------------ */

export function hardshipExit(state) {
  return run(state, (d, fx) => {
    const v = d.vault
    if (!v) throw new ApiError('There\u2019s no active Vault to release.', 409)
    const amount = round2(v.lockedAmount)
    d.balances.main = round2(d.balances.main + amount)
    archiveVault(d, 'hardship', { endDate: d.today.date, returnedEarly: amount })
    log(d, {
      type: 'hardship',
      title: `Hardship exit: ${formatGBP(amount)} released`,
      detail: 'Your whole Vault returned to your main balance. No questions asked',
      amount,
      tone: 'success',
    })
    fx.push(
      effect('hardship', 'success', `${formatGBP(amount)} released`, 'Your Vault has been released in full. Look after yourself, and start again whenever you\u2019re ready.', {
        amount,
        flow: { from: 'vault', to: 'main' },
      }),
    )
  })
}

/* ------------------------------------------------------------------ */
/* Settings and onboarding                                             */
/* ------------------------------------------------------------------ */

function validateContract(c) {
  if (!MODES[c.mode]) throw new ApiError('Choose Friendly or Strict mode.')
  if (!Array.isArray(c.apps) || c.apps.length === 0) throw new ApiError('Pick at least one app to monitor.')
  if (!GOALS[c.goalSource]) throw new ApiError('Choose a learning goal.')
  const rules = MODES[c.mode]
  if (c.dailyLimit < rules.minLimit || c.dailyLimit > rules.maxLimit) {
    throw new ApiError(`${rules.label} limits run from ${rules.minLimit} to ${rules.maxLimit} minutes.`)
  }
}

const SEED_FACTORS = [0, 0.88, 0.92, 0.8, 0.85, 0.7, 0.78, 0.9, 0.66, 0.74, 0.82, 0.6, 0.68, 0.62]
const SEED_SESSION_TIMES = ['21:40', '22:05', '20:15', '19:50', '18:30', '22:20', '21:10']

/** Fills in 14 days of believable history plus one fully earned-back lock. */
function seedHistory(d) {
  const { mode, dailyLimit, goalSource } = d.contract
  const today = d.today.date
  const startDate = addDays(today, -14)
  const overage = mode === 'strict' ? 10 : 14
  const penalty = calculatePenalty(mode, dailyLimit, dailyLimit + overage, 0)
  const lockDays = penalty.lockDays
  const slice = ceil2(penalty.amount / lockDays)

  let remaining = penalty.amount
  const timeline = []
  const history = []
  for (let i = 0; i < 14; i++) {
    const date = addDays(startDate, i)
    const withinLock = i < lockDays
    const goalDone = withinLock || i >= 11 || (i - lockDays) % 4 !== 2
    const minutes = i === 0 ? dailyLimit + overage : Math.round(dailyLimit * SEED_FACTORS[i])
    let released = 0
    if (withinLock) {
      released = round2(Math.min(slice, remaining))
      remaining = round2(remaining - released)
      timeline.push({ date, status: 'released' })
    }
    history.push({
      date,
      minutes,
      limit: dailyLimit,
      goalDone,
      tracked: true,
      graceDay: false,
      locked: i === 0 ? penalty.amount : 0,
      released,
      toFuture: 0,
    })
  }

  let streak = 0
  for (let i = history.length - 1; i >= 0 && history[i].goalDone; i--) streak++
  let best = 0
  let currentRun = 0
  for (const h of history) {
    currentRun = h.goalDone ? currentRun + 1 : 0
    best = Math.max(best, currentRun)
  }

  d.history = history
  d.streak = streak
  d.bestStreak = best
  d.vaultHistory = [
    {
      id: 'vault_seed',
      amount: penalty.amount,
      mode,
      startDate,
      endDate: addDays(startDate, lockDays),
      totalDays: lockDays,
      daysServed: lockDays,
      earnedBack: round2(penalty.amount),
      movedToFuture: 0,
      returnedEarly: 0,
      status: 'completed',
      timeline,
    },
  ]

  const goalName = GOALS[goalSource].requirement
  const entries = []
  history.forEach((h, i) => {
    if (i === 0) {
      entries.push({
        type: 'lock',
        title: `${formatGBP(penalty.amount)} locked in your Vault`,
        detail: `${pluralise(lockDays, 'day')} lock after ${h.minutes} min of scrolling`,
        amount: -penalty.amount,
        tone: 'warning',
        date: h.date,
        time: SEED_SESSION_TIMES[0],
      })
    }
    if (h.goalDone) {
      entries.push({
        type: 'goal',
        title: `${goalName} \u2013 done`,
        detail: h.released > 0 ? 'Daily slice earned' : 'Streak kept going',
        amount: null,
        tone: 'success',
        date: h.date,
        time: SEED_SESSION_TIMES[(i + 1) % SEED_SESSION_TIMES.length],
      })
    }
    if (h.released > 0) {
      entries.push({
        type: 'release',
        title: `${formatGBP(h.released)} released to your main balance`,
        detail: 'Earned back',
        amount: h.released,
        tone: 'success',
        date: h.date,
        time: SEED_SESSION_TIMES[(i + 2) % SEED_SESSION_TIMES.length],
      })
    }
  })
  d.activity = entries
    .reverse()
    .slice(0, 14)
    .map((e) => ({ id: uid('act'), ...e }))
}

export function saveOnboarding(state, contract) {
  return run(state, (d, fx) => {
    const next = {
      mode: contract.mode,
      apps: contract.apps,
      dailyLimit: Number(contract.dailyLimit),
      goalSource: contract.goalSource,
      goalConnected: Boolean(contract.goalConnected),
      acceptedTermsAt: contract.acceptedTermsAt ?? new Date().toISOString(),
    }
    validateContract(next)
    if (!next.goalConnected) throw new ApiError('Connect your learning goal first.')

    d.contract = next
    d.onboardingComplete = true
    d.gracePassUsed = false
    seedHistory(d)
    log(d, {
      type: 'welcome',
      title: 'ScrollBack is on',
      detail: `${MODES[next.mode].label} mode, ${next.dailyLimit} min daily limit`,
      tone: 'success',
    })
    fx.push(effect('welcome', 'success', 'Your dashboard is ready', 'Scroll less. Learn more. Earn it back.'))
  })
}

export function updateSettings(state, partial) {
  return run(state, (d, fx) => {
    const prev = d.contract
    const next = { ...prev, ...partial }

    if (partial.mode && partial.mode !== prev.mode && partial.dailyLimit === undefined) {
      next.dailyLimit = MODES[partial.mode].defaultLimit
    }
    if (partial.goalSource && partial.goalSource !== prev.goalSource) next.goalConnected = true
    if (partial.dailyLimit !== undefined) next.dailyLimit = Number(partial.dailyLimit)
    validateContract(next)

    d.contract = next
    // Changes only affect future scrolling: today's existing overage is not retroactively charged.
    const overage = Math.max(0, d.today.totalMinutes - next.dailyLimit)
    d.today.penalisedOverage = Math.max(d.today.penalisedOverage, overage)

    if (next.mode !== prev.mode) {
      log(d, {
        type: 'settings',
        title: `Switched to ${MODES[next.mode].label} mode`,
        detail: 'Applies to future locks only. Your current Vault is unchanged',
        tone: 'info',
      })
      fx.push(effect('settings', 'info', `${MODES[next.mode].label} mode on`, `Applies to future locks only. Your daily limit is now ${next.dailyLimit} min.`))
    } else if (next.goalSource !== prev.goalSource) {
      log(d, { type: 'settings', title: `Goal changed to ${GOALS[next.goalSource].name}`, detail: GOALS[next.goalSource].requirement, tone: 'info' })
      fx.push(effect('settings', 'success', 'Goal updated', `Your daily goal is now ${GOALS[next.goalSource].requirement.toLowerCase()} on ${GOALS[next.goalSource].name}.`))
    } else {
      log(d, { type: 'settings', title: 'Settings saved', detail: `${next.apps.length} apps, ${next.dailyLimit} min limit`, tone: 'info' })
      fx.push(effect('settings', 'success', 'Settings saved', `Monitoring ${pluralise(next.apps.length, 'app')} with a ${next.dailyLimit} min daily limit.`))
    }
  })
}

/** Rebuilds a fresh account for the same user, keeping their contract if they had one. */
export function resetAccount(state) {
  const fresh = createInitialAccount(state.user.username)
  if (!state.contract) return { state: fresh, effects: [effect('reset', 'info', 'Demo reset', 'Back to the starting account.')] }
  return run(fresh, (d, fx) => {
    d.contract = state.contract
    d.onboardingComplete = true
    seedHistory(d)
    log(d, { type: 'welcome', title: 'Demo reset', detail: 'Back to the starting account', tone: 'info' })
    fx.push(effect('reset', 'info', 'Demo reset', 'Your account is back to \u00a3250.00 with a fresh 14-day history.'))
  })
}
