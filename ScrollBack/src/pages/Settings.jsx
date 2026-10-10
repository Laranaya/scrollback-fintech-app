import { useState } from 'react'
import { CheckCircle2, Loader2, LogOut, Trash2 } from 'lucide-react'
import Modal from '../components/Modal.jsx'
import { useApp } from '../state/AppContext.jsx'
import { AppPicker, GoalPicker, LimitSlider } from './Onboarding.jsx'
import { GOALS, MODES } from '../lib/constants.js'
import { formatGBP } from '../lib/format.js'
import { getIntegration } from '../lib/integrations/index.js'

function ModePicker({ mode, onChange }) {
  return (
    <fieldset className="choice-group">
      <legend className="field-legend">Mode</legend>
      <div className="mode-grid">
        {Object.values(MODES).map((m) => (
          <label key={m.id} className={`mode-card${mode === m.id ? ' is-selected' : ''}`}>
            <input type="radio" name="settings-mode" value={m.id} checked={mode === m.id} onChange={() => onChange(m.id)} />
            <span className="mode-card__head">
              <span className="mode-card__name">{m.label}</span>
              {mode === m.id ? <CheckCircle2 size={20} aria-hidden="true" /> : null}
            </span>
            <span className="mode-card__tag">{m.tagline}</span>
            <span className="mode-card__small">
              {formatGBP(m.minAmount)} to {formatGBP(m.maxAmount)} locked for {m.minDays} to {m.maxDays} days
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function Settings() {
  const { account, updateSettings, logout, deleteData, notify } = useApp()
  const saved = account.contract
  const [draft, setDraft] = useState({ mode: saved.mode, apps: saved.apps, dailyLimit: saved.dailyLimit, goalSource: saved.goalSource })
  const [goalConnected, setGoalConnected] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const goalChanged = draft.goalSource !== saved.goalSource
  const dirty =
    draft.mode !== saved.mode ||
    draft.dailyLimit !== saved.dailyLimit ||
    goalChanged ||
    draft.apps.length !== saved.apps.length ||
    draft.apps.some((a) => !saved.apps.includes(a))
  const canSave = dirty && draft.apps.length > 0 && (!goalChanged || goalConnected) && !saving

  const chooseMode = (mode) => setDraft((d) => ({ ...d, mode, dailyLimit: MODES[mode].defaultLimit }))
  const toggleApp = (app) =>
    setDraft((d) => ({ ...d, apps: d.apps.includes(app) ? d.apps.filter((a) => a !== app) : [...d.apps, app] }))

  function chooseGoal(goalSource) {
    setDraft((d) => ({ ...d, goalSource }))
    setGoalConnected(goalSource === saved.goalSource)
  }

  async function connect() {
    setConnecting(true)
    try {
      await getIntegration(draft.goalSource).connect()
      setGoalConnected(true)
    } catch {
      notify({ tone: 'error', title: 'Couldn\u2019t connect', message: 'Please try again in a moment.' })
    } finally {
      setConnecting(false)
    }
  }

  async function save() {
    setSaving(true)
    await updateSettings(draft)
    setSaving(false)
  }

  async function removeData() {
    setDeleting(true)
    try {
      await deleteData()
    } catch (err) {
      setDeleting(false)
      setConfirmDelete(false)
      notify({ tone: 'error', title: 'Couldn\u2019t delete your data', message: err.message })
    }
  }

  const goal = GOALS[draft.goalSource]

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Your commitment</p>
          <h1 className="page__title">Settings</h1>
        </div>
      </header>

      <section className="card card--lg stack" aria-labelledby="contract-title">
        <h2 id="contract-title" className="card__title">
          Contract
        </h2>
        <p className="vault-sub">Changes only apply to future scrolling and future locks. Your current Vault stays exactly as it is.</p>

        <ModePicker mode={draft.mode} onChange={chooseMode} />
        <LimitSlider mode={draft.mode} value={draft.dailyLimit} onChange={(dailyLimit) => setDraft((d) => ({ ...d, dailyLimit }))} />
        <AppPicker apps={draft.apps} onToggle={toggleApp} />
        {draft.apps.length === 0 ? <p className="form__error">Pick at least one app.</p> : null}

        <GoalPicker source={draft.goalSource} onSelect={chooseGoal}>
          {goalChanged ? (
            <div className="connect-box">
              <p>{goal.description}</p>
              {goalConnected ? (
                <p className="connect-box__ok" role="status">
                  <CheckCircle2 size={18} aria-hidden="true" /> {goal.name} is connected
                </p>
              ) : (
                <button type="button" className="btn btn--gold" onClick={connect} disabled={connecting}>
                  {connecting ? <Loader2 className="spin" size={18} aria-hidden="true" /> : null}
                  {connecting ? `Connecting to ${goal.name}\u2026` : `Connect ${goal.name}`}
                </button>
              )}
            </div>
          ) : null}
        </GoalPicker>

        <div className="actions-row">
          <button type="button" className="btn btn--gold" onClick={save} disabled={!canSave}>
            {saving ? <Loader2 className="spin" size={18} aria-hidden="true" /> : null}
            {saving ? 'Saving\u2026' : 'Save changes'}
          </button>
          {dirty ? (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setDraft({ mode: saved.mode, apps: saved.apps, dailyLimit: saved.dailyLimit, goalSource: saved.goalSource })
                setGoalConnected(true)
              }}
            >
              Discard
            </button>
          ) : null}
        </div>
      </section>

      <section className="card stack" aria-labelledby="account-title">
        <h2 id="account-title" className="card__title">
          Account
        </h2>
        <p className="vault-sub">
          Signed in as <strong>{account.user.username}</strong>.
        </p>
        <div className="actions-row">
          <button type="button" className="btn btn--outline" onClick={logout}>
            <LogOut size={18} aria-hidden="true" /> Log out
          </button>
          <button type="button" className="btn btn--danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={18} aria-hidden="true" /> Delete my data
          </button>
        </div>
      </section>

      <Modal
        open={confirmDelete}
        title="Delete all your data?"
        onClose={() => !deleting && setConfirmDelete(false)}
        footer={
          <>
            <button type="button" className="btn btn--outline" data-autofocus onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </button>
            <button type="button" className="btn btn--danger" onClick={removeData} disabled={deleting}>
              {deleting ? <Loader2 className="spin" size={18} aria-hidden="true" /> : null}
              Delete everything
            </button>
          </>
        }
      >
        <p>
          This removes your account, contract, balances and activity from this demo and signs you out. It can&apos;t be undone.
        </p>
      </Modal>
    </div>
  )
}
