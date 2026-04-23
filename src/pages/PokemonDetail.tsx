import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFusionMap } from '../api/client'
import type { FusionMap } from '../types'
import { usePokemonList } from '../hooks/usePokemonList'
import styles from './styles/PokemonDetail.module.css'

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function FilterSelector({
  value,
  onChange
}: {
  value: 'all' | 'available',
  onChange: (val: 'all' | 'available') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const options: { label: string; value: 'all' | 'available' }[] = [
    { label: 'All Pokémon', value: 'all' },
    { label: 'Available Fusions', value: 'available' }
  ]

  return (
    <div className={styles.filterSelector} ref={ref}>
      <button onClick={() => setOpen(!open)} className={styles.filterSelectorBtn}>
        <span>{options.find(o => o.value === value)?.label}</span>
        <span className={styles.filterSelectorArrow}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></span>
      </button>

      {open && (
        <div className={styles.filterSelectorPopup}>
          {options.map(opt => (
            <button
              key={opt.value}
              className={`${styles.filterSelectorOption} ${value === opt.value ? styles.filterSelectorOptionActive : ''}`}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <span className={styles.filterCheck}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PokemonDetail() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()

  const { pokemon: allPokemon, loading: pokeLoading } = usePokemonList()
  const [fusionMap, setFusionMap] = useState<FusionMap>({})
  const [fusionLoading, setFusionLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'available'>('all')

  useEffect(() => {
    getFusionMap()
      .then(data => setFusionMap(data.fusions ?? {}))
      .catch(() => { })
      .finally(() => setFusionLoading(false))
  }, [])

  const loading = pokeLoading || fusionLoading

  const poke = allPokemon.find(p => p.name === name)
  const artworks = fusionMap[name ?? ''] ?? []
  const hasFusions = artworks.length > 0
  const partnerNames = new Set<string>()
  artworks.forEach(a => {
    const isSelfFusion = a.fusions.every(f => f === name)
    if (isSelfFusion) {
      partnerNames.add(name ?? '')
    } else {
      a.fusions.forEach(f => { if (f !== name) partnerNames.add(f) })
    }
  })

  const filtered = allPokemon
    .filter(p => filterMode === 'available' ? partnerNames.has(p.name) : true)
    .filter(p => search ? p.name.includes(search.toLowerCase()) : true)

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.loadingWrap}>
        <img src="https://m.archives.bulbagarden.net/media/upload/a/a2/Spr_2c_025.png" alt="Loading…" className={styles.spinner} />
        <p className={styles.loadingText}>Loading Pokédex…</p>
      </div>
    </div>
  )

  // If poke not found at all (bad URL)
  if (!poke) return (
    <div className={styles.page}>
      <div className={styles.notFound}>
        <button onClick={() => navigate('/')} className={styles.backBtn}>← Back to Dex</button>
        <p className={styles.notFoundText}>Pokémon not found</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <button onClick={() => navigate('/')} className={styles.backBtn}>← Back to Dex</button>

        <div className={`${styles.heroCard} ${!hasFusions ? styles['heroCard--inactive'] : ''}`}>
          <span className={styles.heroId}>#{String(poke.id).padStart(3, '0')}</span>
          {hasFusions && <div className={styles.heroDot} />}
          <img
            src={poke.sprite}
            alt={poke.name}
            className={`${styles.heroSprite} ${!hasFusions ? styles['heroSprite--inactive'] : ''}`}
            onError={e => {
              const img = e.target as HTMLImageElement
              if (poke.fallback && img.src !== poke.fallback) img.src = poke.fallback
            }}
          />
          <div className={styles.heroDivider} />
          <p className={styles.heroName}>{capitalize(poke.name)}</p>
          <p className={styles.heroSub}>
            {hasFusions ? `${partnerNames.size} fusion${partnerNames.size !== 1 ? 's' : ''}` : 'No fusions yet'}
          </p>
        </div>

        <p className={styles.prompt}>
          {hasFusions
            ? 'Select a Pokémon to see the fusion artwork'
            : 'Select any Pokémon to request a fusion'}
        </p>
      </div>

      {/* ── Search ── */}
      <div className={styles.searchWrap}>
        <div className={styles.searchBar}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--ink-400)', flexShrink: 0 }}>
            <circle cx="5.5" cy="5.5" r="4" /><path d="M9 9l3 3" />
          </svg>
          <input
            type="text" placeholder="Search Pokémon…" value={search}
            onChange={e => setSearch(e.target.value)} className={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} className={styles.searchClear}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l8 8M9 1L1 9" />
              </svg>
            </button>
          )}
        </div>
        <div className={styles.filterWrapper}>
          <FilterSelector
            value={filterMode}
            onChange={(val) => setFilterMode(val)}
          />
        </div>
      </div>

      {/* ── Grid ── */}
      <div className={styles.gridWrap}>
        <div className={styles.grid}>
          {filtered.map(p => {
            const isPartner = partnerNames.has(p.name)
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/fusion/${name}/${p.name}`)}
                className={[
                  styles.tile,
                  isPartner ? styles['tile--active'] : styles['tile--inactive'],
                ].join(' ')}
                title={capitalize(p.name)}
              >
                <img
                  src={p.sprite}
                  alt={p.name}
                  className={styles.tileImg}
                  loading="lazy"
                  onError={e => {
                    const img = e.target as HTMLImageElement
                    if (p.fallback && img.src !== p.fallback) img.src = p.fallback
                    else img.style.display = 'none'
                  }}
                />
                {isPartner && <div className={styles.tileGlow} />}
                <span className={styles.tileNum}>#{String(p.id).padStart(3, '0')}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
