import { useState, useEffect, useCallback } from 'react'
import { usePokemonList } from '../hooks/usePokemonList'
import { useNavigate } from 'react-router-dom'
import { getFusionMap } from '../api/client'
import type { Pokemon, FusionMap } from '../types'
import styles from './styles/Gallery.module.css'

export default function Gallery() {
  const navigate = useNavigate()
  const { pokemon, loading: pokeLoading } = usePokemonList()
  const [fusionMap, setFusionMap] = useState<FusionMap>({})
  const [fusionLoading, setFusionLoading] = useState(true)
  const [search, setSearch] = useState('')
  const loading = pokeLoading || fusionLoading

  useEffect(() => {
    getFusionMap()
      .then(data => setFusionMap(data.fusions ?? {}))
      .catch(() => setFusionMap({}))
      .finally(() => setFusionLoading(false))
  }, [])



  const hasFusion = useCallback((name: string) =>
    name in fusionMap && fusionMap[name].length > 0
    , [fusionMap])

  const filtered = search
    ? pokemon.filter(p => p.name.includes(search.toLowerCase()))
    : pokemon

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
            <span className={styles.legendItem}><span className={styles.legendDotActive} /> Has fusion art</span>
            <span className={styles.legendItem}><span className={styles.legendDotInactive} /> No fusion yet</span>
            <span className={styles.legendCount}>{Object.keys(fusionMap).length} fused</span>
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

function PokeCard({ poke, active, onClick }: { poke: Pokemon; active: boolean; onClick: () => void }) {
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <button
      className={`${styles.tile} ${active ? styles['tile--active'] : styles['tile--inactive']}`}
      onClick={onClick}
      title={active ? `${poke.name} — click to see fusion art` : poke.name}
      style={{ cursor: active ? 'pointer' : 'default' }}
    >
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