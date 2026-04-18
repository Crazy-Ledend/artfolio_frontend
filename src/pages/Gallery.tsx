import { useState, useEffect, useCallback, useRef } from 'react'
import { usePokemonList } from '../hooks/usePokemonList'
import { useNavigate } from 'react-router-dom'
import { getFusionMap } from '../api/client'
import type { Pokemon, FusionMap } from '../types'
import styles from './styles/Gallery.module.css'

function FilterSelector({
  value,
  onChange
}: {
  value: 'all' | 'fused' | 'recent',
  onChange: (val: 'all' | 'fused' | 'recent') => void
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

  const options: { label: string; value: 'all' | 'fused' | 'recent' }[] = [
    { label: 'All Pokémon', value: 'all' },
    { label: 'Available Fusions', value: 'fused' }
  ]

  return (
    <div className={styles.filterSelector} ref={ref}>
      <button onClick={() => setOpen(!open)} className={styles.filterSelectorBtn}>
        <span>{options.find(o => o.value === value)?.label}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={styles.filterSelectorArrow}>
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
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
              {value === opt.value && <span className={styles.filterCheck}>●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SortSelector({
  value,
  onChange
}: {
  value: 'id-asc' | 'newest' | 'oldest',
  onChange: (val: 'id-asc' | 'newest' | 'oldest') => void
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

  const options: { label: string; value: 'id-asc' | 'newest' | 'oldest' }[] = [
    { label: 'Default', value: 'id-asc' },
    { label: 'Newest Added', value: 'newest' },
    { label: 'Oldest Added', value: 'oldest' },
  ]

  return (
    <div className={styles.filterSelector} ref={ref}>
      <button onClick={() => setOpen(!open)} className={styles.filterSelectorBtn}>
        <span>{options.find(o => o.value === value)?.label}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={styles.filterSelectorArrow}>
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
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
              {value === opt.value && <span className={styles.filterCheck}>●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Gallery() {
  const navigate = useNavigate()
  const { pokemon, loading: pokeLoading } = usePokemonList()
  const [fusionMap, setFusionMap] = useState<FusionMap>({})
  const [fusionLoading, setFusionLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'fused' | 'recent'>('all')
  const [sortMode, setSortMode] = useState<'id-asc' | 'newest' | 'oldest'>('id-asc')
  const loading = pokeLoading || fusionLoading

  useEffect(() => {
    getFusionMap()
      .then(data => setFusionMap(data.fusions ?? {}))
      .catch(() => setFusionMap({}))
      .finally(() => setFusionLoading(false))
  }, [])

  const latestFusionDate = useCallback((name: string) => {
    if (!fusionMap[name] || fusionMap[name].length === 0) return 0
    return Math.max(...fusionMap[name].map(f => new Date(f.created_at || 0).getTime()))
  }, [fusionMap])

  const hasFusion = useCallback((name: string) =>
    name in fusionMap && fusionMap[name].length > 0
    , [fusionMap])

  const isRecent = useCallback((name: string) => {
    const latest = latestFusionDate(name);
    if (!latest) return false;
    return (Date.now() - latest) <= 7 * 24 * 60 * 60 * 1000;
  }, [latestFusionDate])

  const filtered = pokemon.filter(p => {
    const matchesSearch = search ? p.name.includes(search.toLowerCase()) : true
    let matchesFilter = true;
    if (filterMode === 'fused') matchesFilter = hasFusion(p.name);
    else if (filterMode === 'recent') matchesFilter = isRecent(p.name);
    return matchesSearch && matchesFilter
  }).sort((a, b) => {
    if (sortMode === 'id-asc') return a.id - b.id;
    if (sortMode === 'newest') return latestFusionDate(b.name) - latestFusionDate(a.name);
    if (sortMode === 'oldest') {
      const aDate = latestFusionDate(a.name) || Infinity;
      const bDate = latestFusionDate(b.name) || Infinity;
      return aDate - bDate;
    }
    return 0;
  })

  return (
    <div className={styles.page}>
      <div className={styles.dex}>

        {/* Top panel */}
        <div className={styles.dexTop}>
          <div className={styles.dexDots}>
            <div className={`${styles.dot} ${styles['dot--red']}`} />
            <div className={`${styles.dot} ${styles['dot--yellow']}`} />
            <div className={`${styles.dot} ${styles['dot--green']}`} />
            <span className={styles.dexTitle}>ArtFusion Dex</span>
          </div>

          <div className={styles.searchBar}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--ink-400)', flexShrink: 0 }}>
              <circle cx="5.5" cy="5.5" r="4" /><path d="M9 9l3 3" />
            </svg>
            <input
              type="text" placeholder="Search Pokémon…"
              value={search} onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} className={styles.searchClear}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l8 8M9 1L1 9" />
                </svg>
              </button>
            )}
          </div>

          <div className={styles.legend}>
            <div className={styles.legendLeft}>
              <span className={styles.legendItem}><span className={styles.legendDotActive} /> Has fusion art</span>
              <span className={styles.legendItem}><span className={styles.legendDotInactive} /> No fusion yet</span>
            </div>
            {/* <span className={styles.legendCount}>{Object.keys(fusionMap).length} fused</span> */}
            <div className={styles.filterWrapper}>
              <FilterSelector value={filterMode} onChange={setFilterMode} />
              <SortSelector value={sortMode} onChange={setSortMode} />
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className={styles.dexBody}>
          <div className={styles.gridScreen}>
            {loading ? (
              <div className={styles.loadingWrap}>
                <img src="https://m.archives.bulbagarden.net/media/upload/a/a2/Spr_2c_025.png" alt="Loading…" className={styles.loadingSpinner} />
                <p className={styles.loadingText}>Loading Pokédex…</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {filtered.map(poke => (
                  <PokeCard
                    key={poke.id}
                    poke={poke}
                    active={hasFusion(poke.name)}
                    isRecent={isRecent(poke.name)}
                    onClick={() => navigate(`/pokemon/${poke.name}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom strip */}
        <div className={styles.dexBottom}>
          <span className={styles.dexCounter}>{loading ? 'LOADING...' : `${filtered.length} POKÉMON`}</span>
          {/* <div className={styles.dexNav}>
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`${styles.navDot} ${i === 2 ? styles['navDot--active'] : ''}`} />
            ))}
          </div> */}
          <span className={styles.dexCounter}>{Object.keys(fusionMap).length} FUSED</span>
        </div>
      </div>

    </div>
  )
}

// ── PokeCard ─────────────────────────────────────────────────────────────

function PokeCard({ poke, active, isRecent, onClick }: { poke: Pokemon; active: boolean; isRecent: boolean; onClick: () => void }) {
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <button
      className={`${styles.tile} ${active ? styles['tile--active'] : styles['tile--inactive']}`}
      onClick={onClick}
      title={active ? `${poke.name} — click to see fusion art` : poke.name}
      style={{ cursor: active ? 'pointer' : 'default' }}
    >
      {isRecent && <div className={styles.newDot} />}
      <img
        src={poke.sprite}
        alt={poke.name}
        className={`${styles.tileImg} ${imgLoaded ? styles['tileImg--loaded'] : ''}`}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
        onError={e => {
          const img = e.target as HTMLImageElement
          if (poke.fallback && img.src !== poke.fallback) {
            img.src = poke.fallback  // try pixel sprite fallback
          } else {
            img.style.display = 'none'
          }
        }}
      />
      {active && <div className={styles.tileGlow} />}
      <span className={styles.tileNum}>#{String(poke.id).padStart(3, '0')}</span>
    </button>
  )
}