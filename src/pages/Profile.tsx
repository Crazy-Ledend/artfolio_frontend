import { useState, useEffect } from 'react'
import { getProfile } from '../api/client'
import type { ArtistProfile, SocialLink, SpiralProps, DecorImageProps } from '../types'
import styles from './styles/Profile.module.css'

export function DecorImage({ src, size = 44, top, bottom, left, right }: DecorImageProps) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      style={{
        position: 'absolute',
        top,
        bottom,
        left,
        right,
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        pointerEvents: 'none',
        zIndex: 10
      } as React.CSSProperties}
    />
  );
}

export function Spiral({
  size = 45,
  thickness = 4,
  color = "#f05f4c",
  left,
  right,
  top,
  bottom
}: SpiralProps) {
  return (
    <div className="spiral" style={{ left, right, top, bottom, "--s": `${size}px`, "--b": `${thickness}px`, "--c": color } as React.CSSProperties} />
  );
}

export default function Profile() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.loadingWrap}>
        <img src="https://m.archives.bulbagarden.net/media/upload/a/a2/Spr_2c_025.png" alt="Loading…" className={styles.spinner} />
      </div>
    </div>
  )

  if (!profile) return null

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />

        <div className={styles.heroContent}>
          {/* Avatar */}
          <div className={styles.avatarWrap}>
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} className={styles.avatar} referrerPolicy="no-referrer" />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="24" cy="18" r="10" />
                  <path d="M6 42c0-9.941 8.059-18 18-18s18 8.059 18 18" />
                </svg>
              </div>
            )}
            <div className={styles.avatarRing} />
          </div>

          {/* Name + location */}
          <h1 className={styles.name}>{profile.name}</h1>
          {profile.location && (
            <p className={styles.location}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5c0 2.625 3.5 6.5 3.5 6.5s3.5-3.875 3.5-6.5C9.5 2.57 7.93 1 6 1z" />
                <circle cx="6" cy="4.5" r="1" />
              </svg>
              {profile.location}
            </p>
          )}

          {/* Social links */}
          {profile.socials?.length > 0 && (
            <div className={styles.socials}>
              {profile.socials?.map(s => (
                <SocialIcon key={s.platform} social={s} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <StatCard
            value={profile.stats?.artworks}
            label="Artworks"
            icon="🎨"
          // decorLeft="https://i.imgur.com/vI6ivr9.gif"
          // decorRight="https://media.tenor.com/gxvJFh-wA88AAAAj/cuphead.gif"
          />
          <StatCard
            value={profile.stats?.fusions}
            label="Pokémon fused"
            icon="⚡"
          // decorLeft=""
          // decorRight="https://64.media.tumblr.com/ac6298e7c104808c1de343970b13415f/tumblr_mg6ab0EPEN1r8r6mfo1_250.gif"
          />
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className={styles.bioCard}>
            <h2 className={styles.sectionTitle}>About</h2>
            <p className={styles.bio}>{profile.bio}</p>
          </div>
        )}

        {/* Social links list (detailed) */}
        {profile.socials?.length > 0 && (
          <div className={styles.socialsCard}>
            <h2 className={styles.sectionTitle}>Find me online</h2>
            <div className={styles.socialsList}>
              {profile.socials?.map(s => (
                <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" className={styles.socialRow}>
                  <SocialIcon social={s} size="md" asDiv />
                  <span className={styles.socialPlatform}>{platformLabel(s.platform)}</span>
                  <span className={styles.socialArrow}>↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.bottomDecorContainer}>
        <img src="/assets/pikachu_sleeping.png" alt="Footer Decor" className={styles.bottomDecorImage} />
      </div>

      <div className={styles.footerDecor}>
        {/* <div className={styles.bottomDecorContainer}>
          <img src="/assets/pikachu_sleeping.png" alt="Footer Decor" className={styles.bottomDecorImage} />
        </div> */}
        {/* <div className="spiral"></div> */}
        <Spiral size={40} color="var(--decor-spiral-1)" left="10%" bottom="120px"></Spiral>
        {/* <Spiral size={30} color="var(--decor-spiral-2)" right="10%" bottom="20px"></Spiral> */}
        <Spiral size={25} color="var(--decor-spiral-3)" right="25%" bottom="100px"></Spiral>
        <div className="wavy-line"></div>
      </div>
      <KofiBadge />
    </div>
  )
}

function KofiBadge() {
  return (
    <a href="https://ko-fi.com/shellyeah" target="_blank" rel="noopener noreferrer" className={styles.kofiBadge}>
      <img src="https://storage.ko-fi.com/cdn/cuplogo-sm.png" alt="Ko-fi logo" className={styles.kofiIcon} />
      <span>Support me on Ko-fi</span>
    </a>
  )
}

function StatCard({ value, label, icon, decorLeft, decorRight }: { value: number; label: string; icon: string; decorLeft?: string; decorRight?: string }) {
  return (
    <div className={styles.statCard}>
      {decorLeft && <DecorImage src={decorLeft} top="-18px" left="-18px" />}
      {decorRight && <DecorImage src={decorRight} top="-18px" right="-18px" />}
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function SocialIcon({ social, size = 'sm', asDiv = false }: { social: SocialLink; size?: 'sm' | 'md'; asDiv?: boolean }) {
  const icon = SOCIAL_ICONS[social.platform] ?? SOCIAL_ICONS.website
  const cls = size === 'md' ? styles.socialIconMd : styles.socialIconSm
  const Comp = asDiv ? 'div' : 'a'

  return (
    <Comp
      href={asDiv ? undefined : social.url}
      target={asDiv ? undefined : '_blank'}
      rel={asDiv ? undefined : 'noopener noreferrer'}
      className={`${styles.socialIconWrap} ${cls}`}
      title={platformLabel(social.platform)}
      style={{ background: icon.bg }}
    >
      <svg viewBox={icon.viewBox} fill={icon.fill} className={styles.socialSvg}>
        <path d={icon.path} />
      </svg>
    </Comp>
  )
}

function platformLabel(platform: string) {
  const labels: Record<string, string> = {
    instagram: 'Instagram', twitter: 'Twitter / X', bluesky: 'Bluesky',
    artstation: 'ArtStation', deviantart: 'DeviantArt',
    youtube: 'YouTube', tiktok: 'TikTok', website: 'Website',
  }
  return labels[platform] ?? platform
}

const SOCIAL_ICONS: Record<string, { bg: string; fill: string; viewBox: string; path: string }> = {
  instagram: {
    bg: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
    fill: '#fff', viewBox: '0 0 24 24',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z'
  },
  twitter: {
    bg: '#000', fill: '#fff', viewBox: '0 0 24 24',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.766l7.516-8.543L2.25 2.25h6.406l4.27 5.645 5.318-5.645zm-1.161 17.52h1.833L7.084 4.126H5.117z'
  },
  bluesky: {
    bg: '#0085ff', fill: '#fff', viewBox: '0 0 24 24',
    path: 'M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.144-.017.288-.034.43-.05-.28.046-.556.108-.827.214-3.278 1.233-5.152 4.568-2.837 8.651 1.315 2.398 5.139 3.23 7.057-.608.302-.622.572-1.277.817-1.951.246.674.515 1.329.817 1.951 1.918 3.838 5.742 3.006 7.057.608 2.315-4.083.441-7.418-2.837-8.651-.271-.106-.547-.168-.827-.214.142.016.286.033.43.05 2.67.296 5.568-.628 6.383-3.364.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z'
  },
  artstation: {
    bg: '#13aff0', fill: '#fff', viewBox: '0 0 24 24',
    path: 'M0 17.723l2.027 3.505h.001a2.424 2.424 0 002.164 1.333h13.457l-2.792-4.838H0zm24 .025c0-.484-.143-.935-.388-1.314L15.728 2.728a2.424 2.424 0 00-2.164-1.333H9.03l14.97 25.94.001.001A2.377 2.377 0 0024 25.38v-7.632zM22.567 0H9.03L9.029 0H6.859L.5 10.886l7.957 13.796 11.054-19.137L22.567 0z'
  },
  deviantart: {
    bg: '#05cc47', fill: '#fff', viewBox: '0 0 24 24',
    path: 'M19.207 4.794l.23-.43V0H15.07l-.436.44-2.058 3.925-.646.436H4.58v5.993h4.04l.36.436-4.175 7.98-.24.43V24H8.93l.436-.44 2.07-3.925.644-.436h7.35v-5.993h-4.05l-.36-.438 4.186-7.977z'
  },
  youtube: {
    bg: '#ff0000', fill: '#fff', viewBox: '0 0 24 24',
    path: 'M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z'
  },
  tiktok: {
    bg: '#010101', fill: '#fff', viewBox: '0 0 24 24',
    path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.93a8.16 8.16 0 004.77 1.52V7.01a4.85 4.85 0 01-1-.32z'
  },
  website: {
    bg: '#6366f1', fill: '#fff', viewBox: '0 0 24 24',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'
  },
}
