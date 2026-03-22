import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFusionMap } from '../api/client'
import type { FusionMap } from '../types'
import { usePokemonList } from '../hooks/usePokemonList'
import styles from './PokemonDetail.module.css'

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const REGIONAL = ['-alola', '-galar', '-hisui', '-paldea']
const SKIP = ['-mega', '-gmax', '-totem', '-primal', '-origin', '-sky', '-land',
  '-incarnate', '-therian', '-black', '-white', '-resolute', '-ordinary', '-aria',
  '-pirouette', '-baile', '-pom-pom', '-pau', '-sensu', '-dusk', '-midnight',
  '-original', '-ash', '-battle-bond', '-power-construct', '-complete', '-school',
  '-disguised', '-busted', '-hangry', '-gorging', '-single-strike', '-rapid-strike',
  '-ice', '-shadow', '-crowned', '-eternamax', '-roaming', '-f', '-m',
  '-red-striped', '-blue-striped', '-white-striped', '-male', '-female',
  '-amped', '-low-key', '-curly', '-droopy', '-stretchy',
  '-full-belly', '-hero', '-teal', '-aqua', '-blaze', '-stellar']

function homeSprite(id: number) {
  return id <= 1025
    ? `${SPRITE_BASE}/other/home/${id}.png`
    : `${SPRITE_BASE}/other/official-artwork/${id}.png`
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

export default function PokemonDetail() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()

  const { pokemon: allPokemon, loading: pokeLoading } = usePokemonList()
  const [fusionMap, setFusionMap] = useState<FusionMap>({})
  const [fusionLoading, setFusionLoading] = useState(true)
  const [search, setSearch] = useState('')
  const loading = pokeLoading || fusionLoading

  useEffect(() => {
    getFusionMap()
      .then(data => setFusionMap(data.fusions ?? {}))
      .catch(() => {})
      .finally(() => setFusionLoading(false))
  }, [])

  const poke = allPokemon.find(p => p.name === name)
  const artworks = fusionMap[name ?? ''] ?? []
  const partnerNames = new Set<string>()
  artworks.forEach(a => a.fusions.forEach(f => { if (f !== name) partnerNames.add(f) }))

  const filtered = search
    ? allPokemon.filter(p => p.name.includes(search.toLowerCase()))
    : allPokemon

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading Pokédex…</p>
      </div>
    </div>
  )

  if (!poke || !artworks.length) return (
    <div className={styles.page}>
      <div className={styles.notFound}>
        <button onClick={() => navigate('/')} className={styles.backBtn}>← Back to Dex</button>
        <p className={styles.notFoundText}>No fusion art for {capitalize(name ?? '')}</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* ── Hero section ── */}
      <div className={styles.hero}>
        <button onClick={() => navigate('/')} className={styles.backBtn}>← Back to Dex</button>

        <div className={styles.heroCard}>
          <span className={styles.heroId}>#{String(poke.id).padStart(3, '0')}</span>
          <div className={styles.heroDot} />
          <img
            src={poke.sprite}
            alt={poke.name}
            className={styles.heroSprite}
            onError={e => {
              const img = e.target as HTMLImageElement
              if (poke.fallback && img.src !== poke.fallback) img.src = poke.fallback
            }}
          />
          <div className={styles.heroDivider} />
          <p className={styles.heroName}>{capitalize(poke.name)}</p>
          <p className={styles.heroSub}>{partnerNames.size} fusion{partnerNames.size !== 1 ? 's' : ''}</p>
        </div>

        <p className={styles.prompt}>Select a Pokémon below to see the fusion artwork</p>
      </div>

      {/* ── Search ── */}
      <div className={styles.searchWrap}>
        <div className={styles.searchBar}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--ink-400)', flexShrink: 0 }}>
            <circle cx="5.5" cy="5.5" r="4"/><path d="M9 9l3 3"/>
          </svg>
          <input
            type="text"
            placeholder="Search Pokémon…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} className={styles.searchClear}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l8 8M9 1L1 9"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Pokémon grid — same style as home ── */}
      <div className={styles.gridWrap}>
        <div className={styles.grid}>
          {filtered.map(p => {
            const isPartner = partnerNames.has(p.name)
            return (
              <button
                key={p.id}
                disabled={!isPartner}
                onClick={() => isPartner && navigate(`/fusion/${name}/${p.name}`)}
                className={[
                  styles.tile,
                  isPartner ? styles['tile--active'] : styles['tile--inactive'],
                ].join(' ')}
                title={isPartner ? `Fused with ${capitalize(p.name)}` : p.name}
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