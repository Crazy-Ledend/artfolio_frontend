import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import styles from './styles/Navbar.module.css'

interface NavbarProps {
  onContactOpen: () => void
}

export default function Navbar({ onContactOpen }: NavbarProps) {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()
  const { user, login, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        menuOpen &&
        menuRef.current && !menuRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setMenuOpen(false)
      }
      if (profileOpen && !target.closest(`.${styles.profileWrapper}`)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen, profileOpen])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setProfileOpen(false)
  }, [pathname])

  const renderProfile = () => {
    if (!user) return null

    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`

    return (
      <div className={styles.profileWrapper}>
        <div className={styles.userProfile} onClick={() => setProfileOpen(!profileOpen)} title="Account">
          <img src={avatarUrl} alt={user.username} className={styles.avatar} />
          <span className={styles.username}>{user.username}</span>
        </div>
        {profileOpen && (
          <div className={styles.profileDropdown}>
            <button onClick={() => { logout(); setProfileOpen(false); }} className={styles.dropItem_signout}>
              Sign out
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navbar__inner}>
          {/* Brand */}
          <Link to="/profile" className={styles.navbar__brand}>pockét fusions</Link>

          {/* Desktop nav */}
          <nav className={styles.navbar__nav}>
            <Link to="/" className={`${styles.navbar__link} ${pathname === '/' ? styles['navbar__link--active'] : ''}`}>Gallery</Link>
            <Link to="/collections" className={`${styles.navbar__link} ${pathname.startsWith('/collections') ? styles['navbar__link--active'] : ''}`}>Collections</Link>
            <button onClick={onContactOpen} className={styles.navbar__btn}>Contact</button>

            <button onClick={toggle} className={styles.themeToggle} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>

            {!user ? (
              <button onClick={login} className={styles.loginBtn}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.27 4.51c-1.3-.6-2.7-.93-4.13-1.02-.17.3-.36.63-.5.97-1.54-.23-3.08-.23-4.57 0-.14-.34-.34-.67-.5-.97-1.4.08-2.8.42-4.13 1.02-2.73 4.09-3.48 8.08-3.11 11.99 1.8 1.33 3.53 2.14 5.2 2.65.42-.58.79-1.2 1.1-1.85-.62-.23-1.21-.52-1.78-.87.15-.11.3-.22.44-.34 3.33 1.54 6.94 1.54 10.23 0 .15.12.3.23.44.34-.57.34-1.16.63-1.78.87.31.65.68 1.27 1.1 1.85 1.67-.52 3.41-1.32 5.2-2.65.45-4.58-.75-8.52-3.12-11.99zM8.38 14.18c-1.01 0-1.84-.93-1.84-2.07 0-1.13.81-2.07 1.84-2.07 1.03 0 1.86.94 1.84 2.07 0 1.14-.81 2.07-1.84 2.07zm7.26 0c-1.01 0-1.84-.94-1.84-2.07 0-1.14.81-2.07 1.84-2.07 1.03 0 1.86.94 1.84 2.07 0 1.14-.81 2.07-1.84 2.07z" />
                </svg>
                <span>Login</span>
              </button>
            ) : renderProfile()}
          </nav>

          {/* Mobile right side */}
          <div className={styles.mobileRight}>
            {user && renderProfile()}

            <button onClick={toggle} className={styles.themeToggle}>
              {theme === 'light' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>

            {/* Hamburger */}
            <div ref={menuRef} className={styles.menuWrap}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className={`${styles.hamburger} ${menuOpen ? styles['hamburger--open'] : ''}`}
                aria-label="Menu"
                aria-expanded={menuOpen}
              >
                <span /><span /><span />
              </button>
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)} />
          <div ref={dropdownRef} className={styles.dropdown}>
            <Link to="/" onClick={() => setMenuOpen(false)} className={`${styles.dropItem} ${pathname === '/' ? styles['dropItem--active'] : ''}`}>
              Gallery
            </Link>
            <Link to="/collections" onClick={() => setMenuOpen(false)} className={`${styles.dropItem} ${pathname.startsWith('/collections') ? styles['dropItem--active'] : ''}`}>
              Collections
            </Link>
            <button onClick={() => { onContactOpen(); setMenuOpen(false) }} className={styles.dropItem}>
              Contact
            </button>
            <div className={styles.dropDivider} />
            {!user && (
              <button onClick={() => { login(); setMenuOpen(false) }} className={styles.dropItem} style={{ color: 'var(--accent)' }}>
                Login
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}