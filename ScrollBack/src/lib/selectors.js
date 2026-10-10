// Read-only derived data for the UI.

import { formatGBP, formatMinutes, round2 } from './format.js'

export function ringTone(total, limit) {
  const pct = total / limit
  if (pct > 1) return 'over'
  if (pct >= 0.7) return 'near'
  return 'safe'
}

/** Last 14 days: up to 13 closed days plus a live entry for today. */
export function recentDays(account) {
  const t = account.today
  const live = {
    date: t.date,
    minutes: t.totalMinutes,
    limit: account.contract.dailyLimit,
    goalDone: t.goalDone,
    tracked: t.sessions.length > 0,
    locked: t.lockedToday,
    released: t.releasedToday,
    isToday: true,
  }
  return [...account.history.slice(-13), live]
}

export function getInsights(account) {
  const days = recentDays(account)
  const closed = account.history

  const earnedBack = round2(
    account.vaultHistory.reduce((sum, v) => sum + v.earnedBack, 0) + (account.vault?.releasedAmount ?? 0),
  )
  const sentToFuture = round2(account.vaultHistory.reduce((sum, v) => sum + v.movedToFuture, 0))
  const tracked = closed.filter((h) => h.tracked)
  const reclaimed = tracked.reduce((sum, h) => sum + Math.max(0, h.limit - h.minutes), 0)
  const daysUnder = tracked.filter((h) => h.minutes <= h.limit).length

  const summary = tracked.length
    ? `You stayed within your limit on ${daysUnder} of ${tracked.length} tracked days, reclaimed ${formatMinutes(reclaimed)}, earned back ${formatGBP(earnedBack)}` +
      (sentToFuture > 0 ? ` and built ${formatGBP(sentToFuture)} for Future Me.` : '. Nothing is lost along the way.')
    : 'Add some activity and your progress will appear here.'

  return {
    earnedBack,
    sentToFuture,
    reclaimed,
    streak: account.streak,
    bestStreak: account.bestStreak,
    summary,
    days,
  }
}
