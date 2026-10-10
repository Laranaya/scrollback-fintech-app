import { simulatedProvider } from './simulated.js'

export const linkedin = simulatedProvider({
  id: 'linkedin_module',
  connectDelay: 1000,
  verifyDelay: 900,
  evidence: 'Finished a module in your current course',
})
