import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '../components/StateViews.jsx'
import { Logo } from '../components/Brand.jsx'

export default function NotFound() {
  return (
    <main className="center-page">
      <Logo />
      <EmptyState
        icon={Compass}
        title="We couldn’t find that page"
        message="The link may be out of date. Head back and carry on."
        action={
          <Link to="/" className="btn btn--gold">
            Back to ScrollBack
          </Link>
        }
      />
    </main>
  )
}
