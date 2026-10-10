import { simulatedProvider } from './simulated.js'

export const github = simulatedProvider({
  id: 'github_pr',
  connectDelay: 1000,
  verifyDelay: 900,
  evidence: 'Merged pull request #482 in your repository',
})
