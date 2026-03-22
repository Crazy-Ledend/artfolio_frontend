import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import styles from './Navbar.module.css'

interface NavbarProps {
  onContactOpen: () => void
}

export default function Navbar({ onContactOpen }: NavbarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <header className={styles.navbar}>
      <div className={styles.navbar__inner}>
        {/* Brand */}
        <Link to="/profile" className={styles.navbar__brand}>Artfolio</Link>

        {/* Desktop nav */}
        <nav className={styles.navbar__nav}>
          <Link to="/" className={`${styles.navbar__link} ${pathname === '/' ? styles['navbar__link--active'] : ''}`}>Gallery</Link>
          <Link to="/collections" className={`${styles.navbar__link} ${pathname.startsWith('/collections') ? styles['navbar__link--active'] : ''}`}>Collections</Link>
          <button onClick={onContactOpen} className={styles.navbar__btn}>Contact</button>
          <Link to="/admin" className={styles.navbar__admin}>Admin</Link>
          <button onClick={toggle} className={styles.themeToggle} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile right side */}
        <div className={styles.mobileRight}>
          {/* Theme toggle always visible */}
          <button onClick={toggle} className={styles.themeToggle}>
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>

          {/* Hamburger */}
          <div ref={menuRef} className={styles.menuWrap}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className={`${styles.hamburger} ${menuOpen ? styles['hamburger--open'] : ''}`}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>

            {menuOpen && (
              <div className={styles.dropdown}>
                <Link to="/" className={`${styles.dropItem} ${pathname === '/' ? styles['dropItem--active'] : ''}`}>
                  Gallery
                </Link>
                <Link to="/collections" className={`${styles.dropItem} ${pathname.startsWith('/collections') ? styles['dropItem--active'] : ''}`}>
                  Collections
                </Link>
                <button onClick={() => { onContactOpen(); setMenuOpen(false) }} className={styles.dropItem}>
                  Contact
                </button>
                <div className={styles.dropDivider} />
                <Link to="/admin" className={styles.dropItem}>
                  Admin
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}