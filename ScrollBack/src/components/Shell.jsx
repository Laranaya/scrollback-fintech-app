import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Activity, BarChart3, Eye, FlaskConical, Landmark, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { Logo, ModeBadge } from './Brand.jsx'
import AccessibilityDrawer from './AccessibilityDrawer.jsx'
import DemoControls from './DemoControls.jsx'
import { useApp } from '../state/AppContext.jsx'

const NAV = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/vault', label: 'Vault', icon: Landmark },
  { to: '/app/insights', label: 'Insights', icon: BarChart3 },
  { to: '/app/activity', label: 'Activity', icon: Activity },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export default function Shell() {
  const { account, accessibility, logout, setAccessibility } = useApp()
  const [demoOpen, setDemoOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <aside className="sidebar">
        <Logo />
        <nav className="sidebar__nav" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-link">
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__foot">
          <div className="sidebar__user">
            <span className="avatar" aria-hidden="true">
              {account.user.username.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="sidebar__name">{account.user.username}</p>
              <ModeBadge mode={account.contract.mode} />
            </div>
          </div>
          <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={() => setAccessOpen(true)}>
            <Eye size={16} aria-hidden="true" /> Accessibility
          </button>
          <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={() => setDemoOpen(true)}>
            <FlaskConical size={16} aria-hidden="true" /> Demo controls
          </button>
          <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={logout}>
            <LogOut size={16} aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>

      <header className="topbar">
        <Logo size="sm" />
        <div className="topbar__actions">
          <button type="button" className="icon-btn" onClick={() => setAccessOpen(true)} aria-label="Open accessibility settings">
            <Eye size={20} aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn" onClick={() => setDemoOpen(true)} aria-label="Open demo controls">
            <FlaskConical size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main id="main" className="shell__main" tabIndex={-1}>
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tab">
            <Icon size={22} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <AccessibilityDrawer
        open={accessOpen}
        onClose={() => setAccessOpen(false)}
        account={account}
        reducedMotion={accessibility.reducedMotion}
        highLegibility={accessibility.highLegibility}
        onToggleReducedMotion={() => setAccessibility({ reducedMotion: !accessibility.reducedMotion })}
        onToggleHighLegibility={() => setAccessibility({ highLegibility: !accessibility.highLegibility })}
      />
      <DemoControls open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  )
}
