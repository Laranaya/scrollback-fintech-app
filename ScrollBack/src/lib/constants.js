// Static rules and catalogue data shared by the engine, mock store and UI.

export const DEMO_USERNAME = 'testUser'
export const DEMO_PASSWORD = '1234'

export const STARTING_BALANCES = { main: 250, vault: 0, futureMe: 0 }

// A single penalty can never take more than this share of the current main balance.
export const AFFORDABILITY_CAP = 0.25

export const MODES = {
  lightFocus: {
    id: 'lightFocus',
    label: 'Light Focus',
    tagline: 'A gentle nudge.',
    minAmount: 1,
    maxAmount: 5,
    minDays: 3,
    maxDays: 10,
    defaultLimit: 90,
    minLimit: 60,
    maxLimit: 120,
    maxOverage: 90,
    gracePasses: 1,
  },
  deepFocus: {
    id: 'deepFocus',
    label: 'Deep Focus',
    tagline: 'Serious commitment.',
    minAmount: 5,
    maxAmount: 20,
    minDays: 11,
    maxDays: 30,
    defaultLimit: 45,
    minLimit: 30,
    maxLimit: 60,
    maxOverage: 240,
    gracePasses: 0,
  },
}

export const SCROLL_APPS = ['TikTok', 'Instagram', 'YouTube Shorts', 'X/Twitter', 'Reddit', 'Snapchat']

// Goal source ids match the `source` field of the goal_complete webhook payload.
export const GOALS = {
  duolingo_lesson: {
    id: 'duolingo_lesson',
    name: 'Duolingo',
    requirement: 'Complete 1 lesson',
    description: 'Finish one lesson in any course to release today\u2019s slice.',
    verb: 'lesson completed',
  },
  linkedin_module: {
    id: 'linkedin_module',
    name: 'LinkedIn Learning',
    requirement: 'Complete 1 module',
    description: 'Finish one course module to release today\u2019s slice.',
    verb: 'module completed',
  },
  github_pr: {
    id: 'github_pr',
    name: 'GitHub',
    requirement: 'Merge 1 pull request',
    description: 'Merge one pull request to release today\u2019s slice.',
    verb: 'pull request merged',
  },
}

export const MAX_SESSION_MINUTES = 300
