// The only module the UI imports for data. When VITE_USE_MOCK is not "false" it talks to the
// localStorage mock; otherwise it calls the REST API described in BACKEND_GUIDE.md.

import { ApiError } from './errors.js'
import * as mock from './mockStore.js'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const TOKEN_KEY = 'scrollback.token'

async function http(method, path, body) {
  const token = localStorage.getItem(TOKEN_KEY)
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('We couldn\u2019t reach the server. Check your connection and try again.', 0)
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(data?.message || response.statusText || 'Something went wrong.', response.status)
  return data
}

const withEffects = (data) => ({ account: data.account, effects: data.effects ?? [] })

function rememberToken(data) {
  if (data?.token) localStorage.setItem(TOKEN_KEY, data.token)
  return { account: data.account }
}

export async function login(username, password) {
  if (USE_MOCK) return mock.login(username, password)
  return rememberToken(await http('POST', '/auth/login', { username, password }))
}

export async function signup(username, password) {
  if (USE_MOCK) return mock.signup(username, password)
  return rememberToken(await http('POST', '/auth/signup', { username, password }))
}

export async function logout() {
  if (USE_MOCK) return mock.logout()
  await http('POST', '/auth/logout').catch(() => null)
  localStorage.removeItem(TOKEN_KEY)
}

export async function deleteData() {
  if (USE_MOCK) return mock.deleteData()
  await http('DELETE', '/account')
  localStorage.removeItem(TOKEN_KEY)
}

export async function getAccount() {
  if (USE_MOCK) return mock.getAccount()
  return (await http('GET', '/account')).account
}

export async function getActivity() {
  if (USE_MOCK) return mock.getActivity()
  return (await http('GET', '/activity')).activity
}

export async function saveOnboarding(contract) {
  if (USE_MOCK) return mock.saveOnboarding(contract)
  return withEffects(await http('PUT', '/onboarding', contract))
}

export async function updateSettings(partial) {
  if (USE_MOCK) return mock.updateSettings(partial)
  return withEffects(await http('PATCH', '/settings', partial))
}

// Webhook-shaped events. Real companion apps and integrations post these same payloads.
export async function ingestScreenTime({ app, minutes }) {
  if (USE_MOCK) return mock.ingestScreenTime({ app, minutes })
  return withEffects(await http('POST', '/webhooks/screen-time', { type: 'screen_time', app, minutes }))
}

export async function ingestGoalComplete({ source }) {
  if (USE_MOCK) return mock.ingestGoalComplete({ source })
  return withEffects(await http('POST', '/webhooks/goal-complete', { type: 'goal_complete', source }))
}

export async function hardshipExit() {
  if (USE_MOCK) return mock.hardshipExit()
  return withEffects(await http('POST', '/vault/hardship-exit'))
}

// Demo-only endpoints.
export async function advanceDay(days = 1) {
  if (USE_MOCK) return mock.advanceDay(days)
  return withEffects(await http('POST', '/demo/advance', { days }))
}

export async function resetDemo() {
  if (USE_MOCK) return mock.resetDemo()
  return withEffects(await http('POST', '/demo/reset'))
}
