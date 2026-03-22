import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFusionMap } from '../api/client'
import type { FusionArtwork, FusionMap, Pokemon } from '../types'
import { usePokemonList } from '../hooks/usePokemonList'
import styles from './FusionDetail.module.css'

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

export default function FusionDetail() {
  const { poke1, poke2 } = useParams<{ poke1: string; poke2: string }>()
  const navigate = useNavigate()

  const { pokemon: allPokemon, loading: pokeLoading } = usePokemonList()
  const [fusionMap, setFusionMap] = useState<FusionMap>({})
  const [fusionLoading, setFusionLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    getFusionMap()
      .then(data => setFusionMap(data.fusions ?? {}))
      .catch(() => {})
      .finally(() => setFusionLoading(false))
  }, [])

  useEffect(() => {
    setLoading(pokeLoading || fusionLoading)
  }, [pokeLoading, fusionLoading])

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading…</p>
      </div>
    </div>
  )

  const getPoke = (name: string) => allPokemon.find(p => p.name === name)
  const poke1Data = getPoke(poke1 ?? '')
  const poke2Data = getPoke(poke2 ?? '')

  // Find ALL artworks containing BOTH pokemon — regardless of fusion order
  const fusionSeen = new Set<string>()
  const artworks: FusionArtwork[] = [
    ...(fusionMap[poke1 ?? ''] ?? []).filter(a => a.fusions.includes(poke2 ?? '')),
    ...(fusionMap[poke2 ?? ''] ?? []).filter(a => a.fusions.includes(poke1 ?? '')),
  ].filter(a => {
    if (fusionSeen.has(a.id)) return false
    fusionSeen.add(a.id)
    return true
  })

  // Related — artworks featuring either pokemon but NOT already shown above
  const relatedSeen = new Set<string>(fusionSeen)
  const related: FusionArtwork[] = [
    ...(fusionMap[poke1 ?? ''] ?? []),
    ...(fusionMap[poke2 ?? ''] ?? []),
  ].filter(a => {
    if (relatedSeen.has(a.id)) return false
    relatedSeen.add(a.id)
    return true
  }).slice(0, 8)

  const active = artworks[activeIdx] ?? artworks[0]

  if (!artworks.length || !poke1Data || !poke2Data) return (
    <div className={styles.page}>
      <div className={styles.notFound}>
        <button onClick={() => navigate(`/pokemon/${poke1}`)} className={styles.backBtn}>← Back</button>
        <p className={styles.notFoundText}>No fusion found</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* ── Hero: fusion artwork ── */}
      <div className={styles.hero}>
        <button onClick={() => navigate(`/pokemon/${poke1}`)} className={styles.backBtn}>
          ← Back to {capitalize(poke1 ?? '')}
        </button>

        {/* Fusion formula */}
        <div className={styles.fusionFormula}>
          <PokeChip poke={poke1Data} />
          <span className={styles.fusionX}>×</span>
          <PokeChip poke={poke2Data} />
        </div>

        {/* Hero image */}
        <div className={styles.heroImageWrap}>
          {active && (
            <img
              key={active.id}
              src={active.image_url}
              alt={active.title}
              className={styles.heroImage}
              referrerPolicy="no-referrer"
              onError={e => {
                const img = e.target as HTMLImageElement
                if (img.src !== active.full_url) img.src = active.full_url
              }}
            />
          )}
        </div>

        {/* Info below hero */}
        {active && (
          <div className={styles.heroInfo}>
            <h1 className={styles.heroTitle}>{active.title}</h1>
            {(active.medium || active.year) && (
              <p className={styles.heroMeta}>{[active.medium, active.year].filter(Boolean).join(' · ')}</p>
            )}
            {active.description && <p className={styles.heroDesc}>{active.description}</p>}
            {active.tags.length > 0 && (
              <div className={styles.heroTags}>
                {active.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
              </div>
            )}
            <a href={active.full_url} target="_blank" rel="noopener noreferrer" className={styles.btnView}>
              View full resolution ↗
            </a>
          </div>
        )}
      </div>

      {/* ── Multiple artworks — thumbnail strip ── */}
      {artworks.length > 1 && (
        <div className={styles.strip}>
          <div className={styles.stripInner}>
            <p className={styles.stripLabel}>RELATED FUSIONS</p>
            <div className={styles.stripGrid}>
                {artworks.map((art, i) => (
                <button
                    key={art.id}
                    onClick={() => setActiveIdx(i)}
                    className={`${styles.thumb} ${i === activeIdx ? styles['thumb--active'] : ''}`}
                >
                    <img src={art.image_url} alt={art.title} referrerPolicy="no-referrer" />
                </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PokeChip({ poke }: { poke: Pokemon }) {
  return (
    <div className={styles.pokeChip}>
      <img
        src={poke.sprite}
        alt={poke.name}
        className={styles.chipSprite}
        onError={e => {
          const img = e.target as HTMLImageElement
          if (poke.fallback && img.src !== poke.fallback) img.src = poke.fallback
        }}
      />
      <p className={styles.chipName}>{capitalize(poke.name)}</p>
    </div>
  )
}