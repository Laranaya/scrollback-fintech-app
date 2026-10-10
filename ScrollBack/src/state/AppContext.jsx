import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import confetti from 'canvas-confetti'
import * as api from '../lib/api/client.js'

const ACCESSIBILITY_KEY = 'scrollback.accessibility.v1'

function readAccessibilityPrefs() {
  try {
    const raw = localStorage.getItem(ACCESSIBILITY_KEY)
    if (!raw) return { reducedMotion: false, highLegibility: false }
    const parsed = JSON.parse(raw)
    return {
      reducedMotion: Boolean(parsed?.reducedMotion),
      highLegibility: Boolean(parsed?.highLegibility),
    }
  } catch {
    return { reducedMotion: false, highLegibility: false }
  }
}

// status: loading -> ready (signed in) | anon (signed out) | error (could not load)
const initialState = {
  status: 'loading',
  account: null,
  error: null,
  toasts: [],
  coinFx: null,
  accessibility: readAccessibilityPrefs(),
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, status: 'loading', error: null }
    case 'LOADED':
      return { ...state, status: 'ready', account: action.account, error: null }
    case 'ACCOUNT':
      return { ...state, account: action.account }
    case 'SIGNED_OUT':
      return { ...state, status: 'anon', account: null, error: null }
    case 'ERROR':
      return { ...state, status: 'error', error: action.message }
    case 'TOAST_ADD':
      return { ...state, toasts: [...state.toasts.slice(-3), action.toast] }
    case 'TOAST_REMOVE':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    case 'COIN':
      return { ...state, coinFx: action.coinFx }
    case 'COIN_CLEAR':
      return state.coinFx?.id === action.id ? { ...state, coinFx: null } : state
    case 'ACCESSIBILITY_SET':
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          ...action.partial,
        },
      }
    default:
      return state
  }
}

const AppContext = createContext(null)
let toastId = 0
let coinId = 0

function fireConfetti() {
  if (typeof document !== 'undefined' && document.body.classList.contains('reduce-motion')) return
  const colors = ['#52B788', '#6AE2AA', '#F4EFE4', '#6FAE8B']
  const base = { colors, disableForReducedMotion: true, zIndex: 100, ticks: 220 }
  confetti({ ...base, particleCount: 70, spread: 70, origin: { y: 0.65 } })
  setTimeout(() => confetti({ ...base, particleCount: 40, spread: 100, origin: { x: 0.15, y: 0.7 }, angle: 60 }), 180)
  setTimeout(() => confetti({ ...base, particleCount: 40, spread: 100, origin: { x: 0.85, y: 0.7 }, angle: 120 }), 180)
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  const notify = useCallback((toast) => {
    dispatch({ type: 'TOAST_ADD', toast: { id: ++toastId, tone: 'info', ...toast } })
  }, [])

  const dismissToast = useCallback((id) => dispatch({ type: 'TOAST_REMOVE', id }), [])
  const clearCoinFx = useCallback((id) => dispatch({ type: 'COIN_CLEAR', id }), [])

  const playEffects = useCallback(
    (effects = []) => {
      let coinPlayed = false
      let confettiPlayed = false
      effects.forEach((fx) => {
        if (fx.title || fx.message) notify({ tone: fx.tone, title: fx.title, message: fx.message })
        if (fx.flow && !coinPlayed) {
          coinPlayed = true
          dispatch({ type: 'COIN', coinFx: { id: ++coinId, ...fx.flow, amount: fx.amount } })
        }
        if (fx.confetti && !confettiPlayed) {
          confettiPlayed = true
          fireConfetti()
        }
      })
    },
    [notify],
  )

  const load = useCallback(async () => {
    dispatch({ type: 'LOADING' })
    try {
      const account = await api.getAccount()
      dispatch({ type: 'LOADED', account })
    } catch (err) {
      if (err.status === 401) dispatch({ type: 'SIGNED_OUT' })
      else dispatch({ type: 'ERROR', message: err.message })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const { reducedMotion, highLegibility } = state.accessibility
    document.body.classList.toggle('reduce-motion', reducedMotion)
    document.body.classList.toggle('accessible-text', highLegibility)
    try {
      localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(state.accessibility))
    } catch {
      // Ignore storage failures; the UI state still works for this session.
    }
    return undefined
  }, [state.accessibility])

  // Runs a mutation, stores the returned account and plays its effects. Errors become toasts
  // and resolve to null so callers can simply check the result.
  const mutate = useCallback(
    async (call) => {
      try {
        const result = await call()
        dispatch({ type: 'ACCOUNT', account: result.account })
        playEffects(result.effects)
        return result
      } catch (err) {
        if (err.status === 401) {
          dispatch({ type: 'SIGNED_OUT' })
        } else {
          notify({ tone: 'error', title: 'That didn\u2019t work', message: err.message })
        }
        return null
      }
    },
    [notify, playEffects],
  )

  const actions = useMemo(
    () => ({
      reload: load,
      setAccessibility: (partial) => dispatch({ type: 'ACCESSIBILITY_SET', partial }),
      // Auth errors are returned to the form instead of shown as toasts.
      async login(username, password) {
        const { account } = await api.login(username, password)
        dispatch({ type: 'LOADED', account })
      },
      async signup(username, password) {
        const { account } = await api.signup(username, password)
        dispatch({ type: 'LOADED', account })
      },
      async logout() {
        await api.logout()
        dispatch({ type: 'SIGNED_OUT' })
      },
      async deleteData() {
        await api.deleteData()
        dispatch({ type: 'SIGNED_OUT' })
      },
      saveOnboarding: (contract) => mutate(() => api.saveOnboarding(contract)),
      updateSettings: (partial) => mutate(() => api.updateSettings(partial)),
      addScreenTime: (payload) => mutate(() => api.ingestScreenTime(payload)),
      completeGoal: (source) => mutate(() => api.ingestGoalComplete({ source })),
      advanceDay: (days) => mutate(() => api.advanceDay(days)),
      hardshipExit: () => mutate(() => api.hardshipExit()),
      resetDemo: () => mutate(() => api.resetDemo()),
      notify,
    }),
    [load, mutate, notify],
  )

  const value = useMemo(
    () => ({ ...state, ...actions, dismissToast, clearCoinFx }),
    [state, actions, dismissToast, clearCoinFx],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
