import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Starfield from '../components/Starfield.jsx'
import { Logo } from '../components/Brand.jsx'
import { useApp } from '../state/AppContext.jsx'
import { DEMO_PASSWORD, DEMO_USERNAME } from '../lib/constants.js'

export default function AuthPage({ mode }) {
  const { login, signup } = useApp()
  const isLogin = mode === 'login'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const userId = useId()
  const passId = useId()
  const errorId = useId()

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await (isLogin ? login : signup)(username.trim(), password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  function fillDemo() {
    setUsername(DEMO_USERNAME)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  return (
    <main className="auth">
      <Starfield />
      <div className="auth__card">
        <Logo size="lg" />
        <h1 className="auth__title">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth__lede">
          {isLogin ? 'Pick up where you left off.' : 'You start with £250.00 of demo money. It is only ever moved, never lost.'}
        </p>

        <form onSubmit={submit} className="form" noValidate>
          <div className="field">
            <label htmlFor={userId}>Username</label>
            <input
              id={userId}
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
          </div>
          <div className="field">
            <label htmlFor={passId}>Password</label>
            <input
              id={passId}
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
          </div>

          {error ? (
            <p id={errorId} className="form__error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn--gold btn--block" disabled={busy}>
            {busy ? <Loader2 className="spin" size={18} aria-hidden="true" /> : null}
            {busy ? 'One moment…' : isLogin ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <div className="auth__demo">
          <p>
            Trying the demo? Use <strong>{DEMO_USERNAME}</strong> and <strong>{DEMO_PASSWORD}</strong>.
          </p>
          <button type="button" className="btn btn--outline btn--sm" onClick={fillDemo}>
            Fill in demo details
          </button>
        </div>

        <p className="auth__switch">
          {isLogin ? (
            <>
              New here? <Link to="/signup">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login">Log in</Link>
            </>
          )}
        </p>
      </div>
    </main>
  )
}
