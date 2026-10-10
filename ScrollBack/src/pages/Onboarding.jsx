import { useId, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2 } from 'lucide-react'
import Starfield from '../components/Starfield.jsx'
import { AppIcon, GoalIcon, Logo } from '../components/Brand.jsx'
import { useApp } from '../state/AppContext.jsx'
import { AFFORDABILITY_CAP, GOALS, MODES, SCROLL_APPS } from '../lib/constants.js'
import { formatGBP } from '../lib/format.js'
import { getIntegration } from '../lib/integrations/index.js'

const STEPS = ['Mode', 'Apps & limit', 'Learning goal', 'Review']

function ModeStep({ mode, onChange }) {
  return (
    <fieldset className="choice-group">
      <legend className="step-title">How firm should ScrollBack be?</legend>
      <p className="step-lede">You can switch modes later. A change only applies to future locks.</p>
      <div className="mode-grid">
        {Object.values(MODES).map((m) => (
          <label key={m.id} className={`mode-card${mode === m.id ? ' is-selected' : ''}`}>
            <input type="radio" name="mode" value={m.id} checked={mode === m.id} onChange={() => onChange(m.id)} />
            <span className="mode-card__head">
              <span className="mode-card__name">{m.label}</span>
              {mode === m.id ? <CheckCircle2 size={20} aria-hidden="true" /> : null}
            </span>
            <span className="mode-card__tag">{m.tagline}</span>
            <dl className="facts">
              <div>
                <dt>Amount locked</dt>
                <dd>
                  {formatGBP(m.minAmount)} to {formatGBP(m.maxAmount)}
                </dd>
              </div>
              <div>
                <dt>Lock length</dt>
                <dd>
                  {m.minDays} to {m.maxDays} days
                </dd>
              </div>
              <div>
                <dt>Daily limit</dt>
                <dd>
                  {m.minLimit} to {m.maxLimit} min
                </dd>
              </div>
              <div>
                <dt>Grace pass</dt>
                <dd>{m.gracePasses ? `${m.gracePasses} free warning` : 'None'}</dd>
              </div>
            </dl>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function LimitSlider({ mode, value, onChange }) {
  const rules = MODES[mode]
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>
        Daily limit: <strong>{value} minutes</strong>
      </label>
      <input
        id={id}
        type="range"
        min={rules.minLimit}
        max={rules.maxLimit}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value} minutes`}
      />
      <div className="range-scale" aria-hidden="true">
        <span>{rules.minLimit} min</span>
        <span>{rules.maxLimit} min</span>
      </div>
    </div>
  )
}

export function AppPicker({ apps, onToggle }) {
  return (
    <fieldset className="choice-group">
      <legend className="field-legend">Apps to monitor</legend>
      <div className="chip-grid">
        {SCROLL_APPS.map((app) => {
          const selected = apps.includes(app)
          return (
            <label key={app} className={`chip${selected ? ' is-selected' : ''}`}>
              <input type="checkbox" checked={selected} onChange={() => onToggle(app)} />
              <AppIcon app={app} />
              <span>{app}</span>
              {selected ? <Check size={14} aria-hidden="true" /> : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function AppsStep({ contract, setContract }) {
  const toggle = (app) =>
    setContract((c) => ({ ...c, apps: c.apps.includes(app) ? c.apps.filter((a) => a !== app) : [...c.apps, app] }))
  return (
    <div className="step-body">
      <h2 className="step-title">What are you trying to scroll less?</h2>
      <p className="step-lede">Pick the apps that count toward your daily limit.</p>
      <AppPicker apps={contract.apps} onToggle={toggle} />
      <LimitSlider mode={contract.mode} value={contract.dailyLimit} onChange={(dailyLimit) => setContract((c) => ({ ...c, dailyLimit }))} />
    </div>
  )
}

export function GoalPicker({ source, onSelect, children }) {
  return (
    <fieldset className="choice-group">
      <legend className="field-legend">Daily learning goal</legend>
      <div className="goal-grid">
        {Object.values(GOALS).map((g) => (
          <label key={g.id} className={`goal-card${source === g.id ? ' is-selected' : ''}`}>
            <input type="radio" name="goal" value={g.id} checked={source === g.id} onChange={() => onSelect(g.id)} />
            <span className="goal-card__icon">
              <GoalIcon source={g.id} />
            </span>
            <span className="goal-card__name">{g.name}</span>
            <span className="goal-card__req">{g.requirement}</span>
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  )
}

function GoalStep({ contract, setContract, connecting, onConnect }) {
  const goal = GOALS[contract.goalSource]
  return (
    <div className="step-body">
      <h2 className="step-title">What will you do instead?</h2>
      <p className="step-lede">Complete this once a day to release a slice of any locked money.</p>
      <GoalPicker
        source={contract.goalSource}
        onSelect={(goalSource) => setContract((c) => ({ ...c, goalSource, goalConnected: false }))}
      >
        {goal ? (
          <div className="connect-box">
            <p>{goal.description}</p>
            {contract.goalConnected ? (
              <p className="connect-box__ok" role="status">
                <CheckCircle2 size={18} aria-hidden="true" /> {goal.name} is connected
              </p>
            ) : (
              <button type="button" className="btn btn--gold" onClick={onConnect} disabled={connecting}>
                {connecting ? <Loader2 className="spin" size={18} aria-hidden="true" /> : null}
                {connecting ? `Connecting to ${goal.name}…` : `Connect ${goal.name}`}
              </button>
            )}
          </div>
        ) : null}
      </GoalPicker>
    </div>
  )
}

function ReviewStep({ contract, accepted, onAccept }) {
  const rules = MODES[contract.mode]
  const goal = GOALS[contract.goalSource]
  const termsId = useId()
  return (
    <div className="step-body">
      <h2 className="step-title">Your commitment</h2>
      <p className="step-lede">A quick look before you begin.</p>
      <dl className="summary">
        <div>
          <dt>Mode</dt>
          <dd>{rules.label}</dd>
        </div>
        <div>
          <dt>Daily limit</dt>
          <dd>{contract.dailyLimit} minutes</dd>
        </div>
        <div>
          <dt>Apps</dt>
          <dd>{contract.apps.join(', ')}</dd>
        </div>
        <div>
          <dt>Daily goal</dt>
          <dd>
            {goal.requirement} on {goal.name}
          </dd>
        </div>
        <div>
          <dt>If you go over</dt>
          <dd>
            {formatGBP(rules.minAmount)} to {formatGBP(rules.maxAmount)} is locked for {rules.minDays} to {rules.maxDays} days
          </dd>
        </div>
      </dl>
      <ul className="promises">
        <li>The money is yours. It moves to a Vault and either comes back or becomes your Future Me savings.</li>
        <li>No single lock takes more than {AFFORDABILITY_CAP * 100}% of your main balance.</li>
        <li>You can use a hardship exit at any time to release the whole Vault.</li>
      </ul>
      <label className="check" htmlFor={termsId}>
        <input id={termsId} type="checkbox" checked={accepted} onChange={(e) => onAccept(e.target.checked)} />
        <span>I understand how ScrollBack works and I&apos;d like to start.</span>
      </label>
    </div>
  )
}

export default function Onboarding() {
  const { saveOnboarding, logout, notify } = useApp()
  const [step, setStep] = useState(0)
  const [contract, setContract] = useState({
    mode: 'lightFocus',
    apps: ['TikTok', 'Instagram', 'YouTube Shorts'],
    dailyLimit: MODES.lightFocus.defaultLimit,
    goalSource: 'duolingo_lesson',
    goalConnected: false,
  })
  const [accepted, setAccepted] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const headingRef = useRef(null)

  const chooseMode = (mode) => setContract((c) => ({ ...c, mode, dailyLimit: MODES[mode].defaultLimit }))

  async function connect() {
    setConnecting(true)
    try {
      await getIntegration(contract.goalSource).connect()
      setContract((c) => ({ ...c, goalConnected: true }))
    } catch {
      notify({ tone: 'error', title: 'Couldn’t connect', message: 'Please try again in a moment.' })
    } finally {
      setConnecting(false)
    }
  }

  const canContinue =
    (step === 0 && Boolean(contract.mode)) ||
    (step === 1 && contract.apps.length > 0) ||
    (step === 2 && contract.goalConnected) ||
    (step === 3 && accepted)

  function move(delta) {
    setStep((s) => s + delta)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  async function finish() {
    setSaving(true)
    await saveOnboarding({ ...contract, acceptedTermsAt: new Date().toISOString() })
    setSaving(false)
  }

  return (
    <div className="onboarding">
      <Starfield />
      <header className="onboarding__top">
        <Logo />
        <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
          Log out
        </button>
      </header>

      <main className="onboarding__card">
        <div ref={headingRef} tabIndex={-1} className="onboarding__focus">
          <ol className="stepper" aria-label="Setup progress">
            {STEPS.map((label, i) => (
              <li key={label} className={`stepper__item${i === step ? ' is-current' : ''}${i < step ? ' is-done' : ''}`} aria-current={i === step ? 'step' : undefined}>
                <span className="stepper__dot">{i < step ? <Check size={14} aria-hidden="true" /> : i + 1}</span>
                <span className="stepper__label">{label}</span>
              </li>
            ))}
          </ol>
        </div>

        {step === 0 && <ModeStep mode={contract.mode} onChange={chooseMode} />}
        {step === 1 && <AppsStep contract={contract} setContract={setContract} />}
        {step === 2 && <GoalStep contract={contract} setContract={setContract} connecting={connecting} onConnect={connect} />}
        {step === 3 && <ReviewStep contract={contract} accepted={accepted} onAccept={setAccepted} />}

        <div className="onboarding__actions">
          {step > 0 ? (
            <button type="button" className="btn btn--outline" onClick={() => move(-1)} disabled={saving}>
              <ArrowLeft size={18} aria-hidden="true" /> Back
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn--gold" onClick={() => move(1)} disabled={!canContinue}>
              Continue <ArrowRight size={18} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="btn btn--gold" onClick={finish} disabled={!canContinue || saving}>
              {saving ? <Loader2 className="spin" size={18} aria-hidden="true" /> : null}
              {saving ? 'Setting up…' : 'Start ScrollBack'}
            </button>
          )}
        </div>
        {step === 2 && !contract.goalConnected ? <p className="hint">Connect your goal to continue.</p> : null}
        {step === 1 && contract.apps.length === 0 ? <p className="hint">Pick at least one app to continue.</p> : null}
      </main>
    </div>
  )
}
