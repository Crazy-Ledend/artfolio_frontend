import { useState, useEffect, useCallback } from 'react'
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
import ContactModal from './components/ContactModal'
import { AuthProvider, useAuth } from './context/AuthContext'

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

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    if (token) {
      setToken(token)
    }
    navigate('/', { replace: true })
  }, [location, navigate, setToken])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg font-medium">Logging you in...</div>
    </div>
  )
}

function AppContent() {
  const [contactOpen, setContactOpen] = useState(false)

  const handleOpenContact = useCallback(() => setContactOpen(true), [])
  const handleCloseContact = useCallback(() => setContactOpen(false), [])

  // Wake up Render backend immediately on app load
  useEffect(() => {
    fetch('/api/ping').catch(() => { })
  }, [])

  return (
    <>
      <Navbar onContactOpen={handleOpenContact} />
      <div className="pt-0">
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pokemon/:name" element={<PokemonDetail />} />
          <Route path="/fusion/:poke1/:poke2" element={<FusionDetail />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
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