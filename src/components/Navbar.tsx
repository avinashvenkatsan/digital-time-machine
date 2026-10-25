import { Heart, History, Info, Layers3, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'

interface Props { page: string; onNavigate: (page: string) => void }

export default function Navbar({ page, onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const links = [
    { id: 'home', label: 'Home', icon: null },
    { id: 'explore', label: 'Explore History', icon: History },
    { id: 'compare', label: 'Compare', icon: Layers3 },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'about', label: 'About', icon: Info },
  ]
  const go = (id: string) => { onNavigate(id); setOpen(false) }
  return (
    <header className="topbar">
      <div className="nav-inner">
        <Logo />
        <nav className={open ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
          {links.map(({ id, label }) => (
            <button key={id} className={`nav-link ${page === id ? 'active' : ''}`} onClick={() => go(id)}>{label}</button>
          ))}
        </nav>
        <button className="mobile-menu icon-button" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <button className="nav-cta" onClick={() => go('explore')}>Start exploring <span>↗</span></button>
      </div>
    </header>
  )
}