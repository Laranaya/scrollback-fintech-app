// Screen-time events arrive from a companion mobile app (Screen Time API on iOS, Digital
// Wellbeing / UsageStats on Android). In this demo the Demo Controls drawer sends the same
// payload by hand via client.ingestScreenTime.

export const SCREEN_TIME_EVENT = 'screen_time'

export function buildScreenTimeEvent({ app, minutes }) {
  return { type: SCREEN_TIME_EVENT, app, minutes: Math.round(minutes) }
}
