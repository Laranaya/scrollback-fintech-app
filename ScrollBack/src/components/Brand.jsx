import { Link } from 'react-router-dom'
import { BookOpen, Ghost, Github, Instagram, Languages, Linkedin, Lock, MessageCircle, Music2, Shield, Sparkles, Twitter, Youtube } from 'lucide-react'
import { MODES } from '../lib/constants.js'

function TurtleVaultIcon({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="20 10 80 90" width="100%" height="100%" style={{ display: 'block' }} aria-hidden="true" role="img">
      <defs>
        <linearGradient id="pipShellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A86FF" />
          <stop offset="100%" stopColor="#225AC2" />
        </linearGradient>

        <linearGradient id="pipTurtleSkin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6AE2AA" />
          <stop offset="100%" stopColor="#52B788" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="62" r="32" fill="#3A86FF" opacity="0.25" filter="blur(8px)" />

      <ellipse cx="38" cy="80" rx="9" ry="6" fill="url(#pipTurtleSkin)" transform="rotate(-25 38 80)" />
      <ellipse cx="82" cy="80" rx="9" ry="6" fill="url(#pipTurtleSkin)" transform="rotate(25 82 80)" />

      <ellipse cx="32" cy="54" rx="11" ry="7" fill="url(#pipTurtleSkin)" transform="rotate(35 32 54)" />
      <ellipse cx="88" cy="54" rx="11" ry="7" fill="url(#pipTurtleSkin)" transform="rotate(-35 88 54)" />

      <path d="M 57 88 Q 60 96 63 88 Z" fill="url(#pipTurtleSkin)" />

      <ellipse cx="60" cy="38" rx="14" ry="13" fill="url(#pipTurtleSkin)" />

      <ellipse cx="54" cy="36" rx="2.5" ry="3.5" fill="#07121C" />
      <circle cx="53" cy="35" r="1.2" fill="#FFFFFF" />

      <ellipse cx="66" cy="36" rx="2.5" ry="3.5" fill="#07121C" />
      <circle cx="65" cy="35" r="1.2" fill="#FFFFFF" />

      <ellipse cx="51" cy="41" rx="2.2" ry="1.4" fill="#FF8A8A" opacity="0.75" />
      <ellipse cx="69" cy="41" rx="2.2" ry="1.4" fill="#FF8A8A" opacity="0.75" />

      <path d="M 58 42 Q 60 44 62 42" stroke="#07121C" strokeWidth="1.3" strokeLinecap="round" fill="none" />

      <ellipse cx="60" cy="64" rx="24" ry="22" fill="url(#pipShellGrad)" stroke="#6EA5FF" strokeWidth="2" />

      <circle cx="60" cy="64" r="9" fill="#0E1E2E" stroke="#52B788" strokeWidth="2" />
      <circle cx="60" cy="62" r="2.5" fill="#52B788" />
      <polygon points="58.5,63 61.5,63 62,68 58,68" fill="#52B788" />

      <path d="M 86 28 Q 86 32 90 32 Q 86 32 86 36 Q 86 32 82 32 Q 86 32 86 28 Z" fill="#6AE2AA" />
      <circle cx="34" cy="32" r="1.8" fill="#6EA5FF" />
    </svg>
  )
}

export function Logo({ to = '/', size = 'md' }) {
  return (
    <Link to={to} className={`logo logo--${size}`} aria-label="ScrollBack home">
      <span className="logo__mark" aria-hidden="true">
        <TurtleVaultIcon size={size === 'lg' ? 26 : 20} />
      </span>
      <span className="logo__word">ScrollBack</span>
    </Link>
  )
}

export function ModeBadge({ mode }) {
  const rules = MODES[mode]
  if (!rules) return null
  const Icon = mode === 'lightFocus' ? Sparkles : Shield
  return (
    <span className={`badge badge--${mode}`}>
      <Icon size={14} aria-hidden="true" />
      <span>{rules.label}</span>
    </span>
  )
}

const APP_ICONS = {
  TikTok: Music2,
  Instagram,
  'YouTube Shorts': Youtube,
  'X/Twitter': Twitter,
  Reddit: MessageCircle,
  Snapchat: Ghost,
}

export function AppIcon({ app, size = 16 }) {
  const Icon = APP_ICONS[app] ?? Lock
  return <Icon size={size} aria-hidden="true" />
}

const GOAL_ICONS = {
  duolingo_lesson: Languages,
  linkedin_module: Linkedin,
  github_pr: Github,
}

export function GoalIcon({ source, size = 20 }) {
  const Icon = GOAL_ICONS[source] ?? BookOpen
  return <Icon size={size} aria-hidden="true" />
}
