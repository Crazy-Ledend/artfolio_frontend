import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import styles from './Navbar.module.css'

interface NavbarProps {
  onContactOpen: () => void
}

export default function Navbar({ onContactOpen }: NavbarProps) {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()

  return (
    <header className={styles.navbar}>
      <div className={styles.navbar__inner}>
        {/* Brand — links to profile */}
        <Link to="/profile" className={styles.navbar__brand}>
          Artfolio
        </Link>

        <nav className={styles.navbar__nav}>
          <Link to="/" className={`${styles.navbar__link} ${pathname === '/' ? styles['navbar__link--active'] : ''}`}>
            Gallery
          </Link>
          <Link to="/collections" className={`${styles.navbar__link} ${pathname.startsWith('/collections') ? styles['navbar__link--active'] : ''}`}>
            Collections
          </Link>
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
      </div>
    </header>
  )
}