// A localStorage-backed stand-in for the real backend. It exposes the same functions and
// return shapes as the HTTP branch of client.js, so swapping it out never touches the UI.

import { DEMO_PASSWORD, DEMO_USERNAME } from '../constants.js'
import * as engine from '../engine.js'
import { ApiError } from './errors.js'

const ACCOUNT_KEY = 'scrollback.account.v1'
const SESSION_KEY = 'scrollback.session.v1'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value))

function requireSession() {
  const session = readJSON(SESSION_KEY)
  if (!session) throw new ApiError('Please log in to continue.', 401)
  return session
}

function loadAccount() {
  const session = requireSession()
  let account = readJSON(ACCOUNT_KEY)
  if (!account) {
    account = engine.createInitialAccount(session.username)
    writeJSON(ACCOUNT_KEY, account)
  }
  return account
}

async function mutate(fn) {
  await wait(160)
  const account = loadAccount()
  const { state, effects } = fn(account)
  writeJSON(ACCOUNT_KEY, state)
  return { account: state, effects }
}

function checkCredentials(username, password) {
  if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
    throw new ApiError('Those details don\u2019t match. For this demo, use testUser and 1234.', 401)
  }
}

export async function login(username, password) {
  await wait(200)
  checkCredentials(username, password)
  writeJSON(SESSION_KEY, { username })
  let account = readJSON(ACCOUNT_KEY)
  if (!account) {
    account = engine.createInitialAccount(username)
    writeJSON(ACCOUNT_KEY, account)
  }
  return { account }
}

export async function signup(username, password) {
  await wait(200)
  checkCredentials(username, password)
  writeJSON(SESSION_KEY, { username })
  const account = engine.createInitialAccount(username)
  writeJSON(ACCOUNT_KEY, account)
  return { account }
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export async function deleteData() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(ACCOUNT_KEY)
}

export async function getAccount() {
  await wait(250)
  return loadAccount()
}

export async function getActivity() {
  await wait(120)
  return loadAccount().activity
}

export const saveOnboarding = (contract) => mutate((account) => engine.saveOnboarding(account, contract))

export const updateSettings = (partial) => mutate((account) => engine.updateSettings(account, partial))

export const ingestScreenTime = ({ app, minutes }) =>
  mutate((account) => engine.ingestScreenTime(account, { app, minutes }))

export const ingestGoalComplete = ({ source }) => mutate((account) => engine.completeGoal(account, { source }))

export const hardshipExit = () => mutate((account) => engine.hardshipExit(account))

export const resetDemo = () => mutate((account) => engine.resetAccount(account))

export const advanceDay = (days = 1) =>
  mutate((account) => {
    const count = Math.round(Number(days))
    if (!Number.isFinite(count) || count < 1 || count > 30) throw new ApiError('Fast-forward between 1 and 30 days.')
    let state = account
    const effects = []
    for (let i = 0; i < count; i++) {
      const result = engine.advanceDay(state)
      state = result.state
      effects.push(...result.effects)
    }
    if (count > 1) {
      effects.unshift({
        type: 'time',
        tone: 'info',
        title: `Fast-forwarded ${count} days`,
        message: 'Each day was closed out, including any slices you didn\u2019t earn.',
      })
    }
    return { state, effects }
  })
