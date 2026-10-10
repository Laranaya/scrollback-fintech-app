import { Link } from 'react-router-dom'
import { ArrowRight, Hourglass, Landmark, LifeBuoy, PiggyBank, ShieldCheck, Sprout, Target, Timer } from 'lucide-react'
import Starfield from '../components/Starfield.jsx'
import { Logo } from '../components/Brand.jsx'
import { useApp } from '../state/AppContext.jsx'
import { AFFORDABILITY_CAP, MODES } from '../lib/constants.js'

const STEPS = [
  {
    icon: Timer,
    title: 'Set a daily limit',
    text: 'Choose how long you want to scroll each day and which apps count.',
  },
  {
    icon: Landmark,
    title: 'Go over, and money moves',
    text: 'A little of your own balance slides into your Vault. It is locked, never spent.',
  },
  {
    icon: Target,
    title: 'Learn to earn it back',
    text: 'One lesson, module or pull request a day releases a slice of your Vault.',
  },
  {
    icon: PiggyBank,
    title: 'Unearned slices become savings',
    text: 'Whatever is left when the lock ends moves to your Future Me balance. Still yours.',
  },
]

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Your money, always',
    text: 'No fees, no charity donations, no one else gets a penny. Locked money is held for you.',
  },
  {
    icon: Hourglass,
    title: `Capped at ${AFFORDABILITY_CAP * 100}% of your balance`,
    text: 'A single lock can never take more than a quarter of what you have.',
  },
  {
    icon: Sprout,
    title: 'A grace pass to start',
    text: `Light Focus gives you ${MODES.lightFocus.gracePasses} free warning before anything is locked.`,
  },
  {
    icon: LifeBuoy,
    title: 'Hardship exit, no questions',
    text: 'Life happens. Release your whole Vault in one tap, any time.',
  },
]

export default function Landing() {
  const { status } = useApp()
  const signedIn = status === 'ready'

  return (
    <div className="landing">
      <div className="landing__bg" aria-hidden="true">
        <Starfield />
      </div>
      <header className="landing__nav">
        <Logo />
        <nav className="landing__nav-links" aria-label="Account">
          {signedIn ? (
            <Link to="/app" className="btn btn--gold btn--sm">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost btn--sm">
                Log in
              </Link>
              <Link to="/signup" className="btn btn--gold btn--sm">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero__inner">
            <p className="eyebrow">A gentler way to build a learning habit</p>
            <h1 className="hero__title">Scroll less. Learn more. Earn it back.</h1>
            <p className="hero__lede">
              ScrollBack sets a daily scrolling limit. Go over it and a small slice of your own money is locked in a Vault.
              Finish a learning goal each day and it comes straight back.
            </p>
            <div className="hero__cta">
              <Link to={signedIn ? '/app' : '/signup'} className="btn btn--gold btn--lg">
                {signedIn ? 'Open dashboard' : 'Start your first week'}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href="#how" className="btn btn--outline btn--lg">
                How it works
              </a>
            </div>
          </div>
        </section>

        <section id="how" className="section">
          <div className="section__inner">
            <h2 className="section__title">How it works</h2>
            <ol className="steps">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="step">
                  <span className="step__num">{i + 1}</span>
                  <Icon className="step__icon" size={22} aria-hidden="true" />
                  <h3 className="step__title">{title}</h3>
                  <p className="step__text">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section section--alt">
          <div className="section__inner">
            <h2 className="section__title">Built to be kind</h2>
            <p className="section__lede">Commitment works best when it is fair. These guardrails are part of every account.</p>
            <ul className="principles">
              {PRINCIPLES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="principle">
                  <Icon size={22} aria-hidden="true" />
                  <div>
                    <h3 className="principle__title">{title}</h3>
                    <p className="principle__text">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section">
          <div className="section__inner section__inner--center">
            <h2 className="section__title">Ready to take your attention back?</h2>
            <Link to={signedIn ? '/app' : '/signup'} className="btn btn--gold btn--lg">
              {signedIn ? 'Open dashboard' : 'Create your account'}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <Logo size="sm" />
        <p>
          This is a demonstration. Balances are simulated and stored in your browser, and no real money moves.
        </p>
      </footer>
    </div>
  )
}
