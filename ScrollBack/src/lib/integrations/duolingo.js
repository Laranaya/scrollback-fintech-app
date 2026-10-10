import { simulatedProvider } from './simulated.js'

export const duolingo = simulatedProvider({
  id: 'duolingo_lesson',
  connectDelay: 1000,
  verifyDelay: 900,
  evidence: 'Completed a lesson in your active course',
})
