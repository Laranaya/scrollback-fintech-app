import { useId, useState } from 'react'
import { CalendarPlus, CheckCheck, RotateCcw, Smartphone } from 'lucide-react'
import Modal from './Modal.jsx'
import { useApp } from '../state/AppContext.jsx'
import { GOALS, MAX_SESSION_MINUTES, SCROLL_APPS } from '../lib/constants.js'

export default function DemoControls({ open, onClose }) {
  const { account, addScreenTime, completeGoal, advanceDay, resetDemo } = useApp()
  const monitored = account.contract.apps
  const [appChoice, setApp] = useState(monitored[0] ?? SCROLL_APPS[0])
  const app = monitored.includes(appChoice) ? appChoice : monitored[0]
  const [minutes, setMinutes] = useState(20)
  const [busy, setBusy] = useState(false)
  const appId = useId()
  const minId = useId()
  const goal = GOALS[account.contract.goalSource]

  async function guard(fn) {
    setBusy(true)
    await fn()
    setBusy(false)
  }

  const payload = { type: 'screen_time', app, minutes: Number(minutes) || 0 }

  return (
    <Modal open={open} onClose={onClose} title="Demo controls" wide>
      <p className="muted">
        These buttons post the same events a phone companion app and your learning provider would send, so you can see ScrollBack react without waiting a real day.
      </p>

      <section className="demo-block">
        <h3 className="demo-block__title">
          <Smartphone size={18} aria-hidden="true" /> Simulate scrolling
        </h3>
        <div className="demo-row">
          <div className="field">
            <label htmlFor={appId}>App</label>
            <select id={appId} value={app} onChange={(e) => setApp(e.target.value)}>
              {monitored.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={minId}>Minutes</label>
            <input
              id={minId}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_SESSION_MINUTES}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn--gold" disabled={busy} onClick={() => guard(() => addScreenTime({ app, minutes: Number(minutes) }))}>
            Add session
          </button>
        </div>
        <div className="quick-row" role="group" aria-label="Quick amounts">
          {[10, 30, 60, 120].map((m) => (
            <button key={m} type="button" className="btn btn--outline btn--sm" disabled={busy} onClick={() => guard(() => addScreenTime({ app, minutes: m }))}>
              +{m} min
            </button>
          ))}
        </div>
        <pre className="payload" aria-label="Webhook payload preview">
          {`POST /webhooks/screen-time\n${JSON.stringify(payload)}`}
        </pre>
      </section>

      <section className="demo-block">
        <h3 className="demo-block__title">
          <CheckCheck size={18} aria-hidden="true" /> Complete today&apos;s goal
        </h3>
        <p className="muted">Sends a goal_complete event for {goal.name}: {goal.verb}.</p>
        <button
          type="button"
          className="btn btn--outline"
          disabled={busy || account.today.goalDone}
          onClick={() => guard(() => completeGoal(account.contract.goalSource))}
        >
          {account.today.goalDone ? 'Already done today' : `Mark ${goal.verb}`}
        </button>
      </section>

      <section className="demo-block">
        <h3 className="demo-block__title">
          <CalendarPlus size={18} aria-hidden="true" /> Fast-forward time
        </h3>
        <p className="muted">Closes out today. Any slice you did not earn stays locked.</p>
        <div className="quick-row">
          {[1, 3, 7].map((d) => (
            <button key={d} type="button" className="btn btn--outline btn--sm" disabled={busy} onClick={() => guard(() => advanceDay(d))}>
              +{d} {d === 1 ? 'day' : 'days'}
            </button>
          ))}
        </div>
      </section>

      <section className="demo-block">
        <h3 className="demo-block__title">
          <RotateCcw size={18} aria-hidden="true" /> Reset
        </h3>
        <p className="muted">Back to £250.00 with a fresh 14 day history. Your settings are kept.</p>
        <button type="button" className="btn btn--outline" disabled={busy} onClick={() => guard(resetDemo)}>
          Reset demo
        </button>
      </section>
    </Modal>
  )
}
