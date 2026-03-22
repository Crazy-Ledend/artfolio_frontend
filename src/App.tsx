import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Gallery from './pages/Gallery'
import Collections from './pages/Collections'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import PokemonDetail from './pages/PokemonDetail'
import FusionDetail from './pages/FusionDetail'
import CollectionDetail from './pages/CollectionDetail'
import ContactModal from './components/ContactModal'

export default function App() {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar onContactOpen={() => setContactOpen(true)} />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pokemon/:name" element={<PokemonDetail />} />
          <Route path="/fusion/:poke1/:poke2" element={<FusionDetail />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
        </Routes>
      </div>
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </BrowserRouter>
  )
}