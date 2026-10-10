import { Link } from 'react-router-dom'
import { BookOpen, Ghost, Github, GraduationCap, Instagram, Languages, Linkedin, Lock, MessageCircle, Music2, Twitter, Youtube } from 'lucide-react'
import { MODES } from '../lib/constants.js'

export function Logo({ to = '/', size = 'md' }) {
  return (
    <Link to={to} className={`logo logo--${size}`} aria-label="ScrollBack home">
      <span className="logo__mark" aria-hidden="true">
        <GraduationCap size={size === 'lg' ? 26 : 20} />
      </span>
      <span className="logo__word">ScrollBack</span>
    </Link>
  )
}

export function ModeBadge({ mode }) {
  const rules = MODES[mode]
  if (!rules) return null
  return <span className={`badge badge--${mode}`}>{rules.label}</span>
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
