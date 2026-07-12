import { useState, useEffect, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Gallery from './pages/Gallery'
import Collections from './pages/Collections'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import PokemonDetail from './pages/PokemonDetail'
import FusionDetail from './pages/FusionDetail'
import CollectionDetail from './pages/CollectionDetail'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Stats from './pages/Stats'
import ContactModal from './components/ContactModal'
import { AuthProvider, useAuth } from './context/AuthContext'
import { trackVisit } from './api/client'

function DevBadge() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/profile') || pathname.startsWith('/admin')) return null

  return (
    <div className="mobile-badge-bg">
      <a href="https://hazeltech-dev.vercel.app/" target="_blank" rel="noopener noreferrer" className="dev-badge">
        <div className="dev-badge-dot"></div>
        <span className="dev-badge-text">&lt;/crazypokeking&gt; — dev</span>
        <span className="dev-badge-text-hover">hazeltech 🦕</span>
      </a>
    </div>
  )
}

function AuthCallback() {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return // guard against double-fire (StrictMode + Safari popstate)
    processed.current = true

    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    if (token) {
      setToken(token)
    }

    // Defer navigation to let Safari's internal state settle
    // Prevents re-triggering popstate during auth state flush
    const timer = setTimeout(() => {
      navigate('/', { replace: true })
    }, 0)

    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg font-medium">Logging you in...</div>
    </div>
  )
}

function PageTransitions({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('in')

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('out')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.pathname, displayLocation.pathname])

  return (
    <div
      className={`page-transition ${transitionStage}`}
      onAnimationEnd={() => {
        if (transitionStage === 'out') {
          setDisplayLocation(location)
          setTransitionStage('in')
        }
      }}
    >
      <Routes location={displayLocation}>
        {children}
      </Routes>
    </div>
  )
}

function AppContent() {
  const [contactOpen, setContactOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastVisit = localStorage.getItem('artfolio_last_visit')

    if (lastVisit !== today) {
      trackVisit()
        .then(() => localStorage.setItem('artfolio_last_visit', today))
        .catch(() => { })
    }
  }, [location.pathname])

  const handleOpenContact = useCallback(() => setContactOpen(true), [])
  const handleCloseContact = useCallback(() => setContactOpen(false), [])

  // Wake up Render backend immediately on app load
  useEffect(() => {
    const pingUrl = import.meta.env.PROD
      ? 'https://artfolio-api-g8en.onrender.com/ping'
      : '/api/ping'
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5s max
    fetch(pingUrl, { signal: controller.signal }).catch(() => { })
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  return (
    <>
      <Navbar onContactOpen={handleOpenContact} />
      <div className="pt-0">
        <PageTransitions>
          <Route path="/" element={<Gallery />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pokemon/:name" element={<PokemonDetail />} />
          <Route path="/fusion/:poke1/:poke2" element={<FusionDetail />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </PageTransitions>
      </div>
      <DevBadge />
      <footer style={{
        textAlign: 'center',
        padding: '24px 0',
        fontFamily: "'Nunito', sans-serif",
        fontSize: 12,
        color: 'var(--ink-400)'
      }}>
        <a href="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</a>
      </footer>
      {contactOpen && <ContactModal onClose={handleCloseContact} />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}