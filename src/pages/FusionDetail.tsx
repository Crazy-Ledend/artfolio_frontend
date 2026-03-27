import { useEffect, useState, useRef } from 'react'
import type React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFusionMap, requestFusion } from '../api/client'
import type { Pokemon, FusionArtwork, FusionMap } from '../types'
import { usePokemonList } from '../hooks/usePokemonList'
import styles from './styles/FusionDetail.module.css'

// ── Evo-line hook ─────────────────────────────────────────────────────────────
// Returns a Set of lowercase pokémon names in the same evolution chain as `name`.
// Results are cached in sessionStorage to avoid repeated network calls.
function useEvoLine(name: string | undefined): Set<string> {
  const [evoLine, setEvoLine] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!name) return
    const cacheKey = `evo_line_${name}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      setEvoLine(new Set(JSON.parse(cached)))
      return
    }

    let cancelled = false
      ; (async () => {
        try {
          const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`)
          if (!speciesRes.ok) return
          const species = await speciesRes.json()
          const chainRes = await fetch(species.evolution_chain.url)
          if (!chainRes.ok) return
          const chainData = await chainRes.json()

          // Flatten the chain tree into a list of names
          const names: string[] = []
          const walk = (node: { species: { name: string }; evolves_to: typeof node[] }) => {
            names.push(node.species.name)
            node.evolves_to.forEach(walk)
          }
          walk(chainData.chain)

          if (!cancelled) {
            sessionStorage.setItem(cacheKey, JSON.stringify(names))
            setEvoLine(new Set(names))
          }
        } catch { /* silently ignore */ }
      })()
    return () => { cancelled = true }
  }, [name])

  return evoLine
}

function useMegaForms(name: string | undefined) {
  const [megas, setMegas] = useState<string[]>([])

  useEffect(() => {
    if (!name) return

    let cancelled = false;

    (async () => {
      try {
        const baseName = name.replace(/-mega(-[xy])?/, '')
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${baseName}`)
        if (!res.ok) return
        const data = await res.json()

        const varieties = data.varieties || []

        const megaForms = varieties
          .map((v: any) => v.pokemon.name)
          .filter((n: string) => n.includes("mega"))

        if (!cancelled) setMegas(megaForms)
      } catch { }
    })()

    return () => { cancelled = true }
  }, [name])

  return megas
}

function getMegaLabel(name: string) {
  if (name.includes("-mega-x")) return "Mega X"
  if (name.includes("-mega-y")) return "Mega Y"
  if (name.includes("-mega-z")) return "Mega Z"
  return "Mega"
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function defaultFusionName(poke1: string, poke2: string) {
  const first = poke1.slice(0, Math.floor(poke1.length / 2))
  const second = poke2.slice(Math.floor(poke2.length / 2))
  return `${first}${second}`
}

function useExtraPokemon(name: string | undefined, existing: Pokemon | undefined) {
  const [extra, setExtra] = useState<Pokemon | undefined>()

  useEffect(() => {
    if (!name || existing) {
      setExtra(undefined)
      return
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          const id = data.id
          setExtra({
            id,
            name: data.name,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
            spriteHome: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
            fallback: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
          })
        }
      } catch { }
    })()
    return () => { cancelled = true }
  }, [name, existing])

  return extra
}

// ── Pokémon type tag colours ───────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  normal: { bg: 'rgba(168,168,120,0.22)', border: 'rgba(168,168,120,0.5)', color: '#6d6d4e' },
  fire: { bg: 'rgba(240,128,48,0.2)', border: 'rgba(240,128,48,0.5)', color: '#c0531a' },
  water: { bg: 'rgba(40,120,200,0.18)', border: 'rgba(40,120,200,0.45)', color: '#2060a0' },
  electric: { bg: 'rgba(248,208,48,0.22)', border: 'rgba(248,208,48,0.55)', color: '#9a7a00' },
  grass: { bg: 'rgba(80,192,80,0.2)', border: 'rgba(80,192,80,0.48)', color: '#2d7a2d' },
  ice: { bg: 'rgba(80,200,200,0.2)', border: 'rgba(80,200,200,0.5)', color: '#1a7878' },
  fighting: { bg: 'rgba(192,48,40,0.18)', border: 'rgba(192,48,40,0.45)', color: '#7a1a18' },
  poison: { bg: 'rgba(160,64,160,0.2)', border: 'rgba(160,64,160,0.48)', color: '#7a1a7a' },
  ground: { bg: 'rgba(224,192,104,0.22)', border: 'rgba(224,192,104,0.5)', color: '#7a5a00' },
  flying: { bg: 'rgba(104,144,240,0.2)', border: 'rgba(104,144,240,0.5)', color: '#2a40a0' },
  psychic: { bg: 'rgba(248,88,136,0.18)', border: 'rgba(248,88,136,0.45)', color: '#b02060' },
  bug: { bg: 'rgba(168,184,32,0.2)', border: 'rgba(168,184,32,0.48)', color: '#4a5a00' },
  rock: { bg: 'rgba(184,160,56,0.2)', border: 'rgba(184,160,56,0.48)', color: '#6a5a00' },
  ghost: { bg: 'rgba(112,88,152,0.2)', border: 'rgba(112,88,152,0.48)', color: '#4a2a6a' },
  dragon: { bg: 'rgba(112,56,248,0.18)', border: 'rgba(112,56,248,0.45)', color: '#4a00b0' },
  dark: { bg: 'rgba(112,88,72,0.2)', border: 'rgba(112,88,72,0.48)', color: '#3a2a20' },
  steel: { bg: 'rgba(184,184,208,0.2)', border: 'rgba(184,184,208,0.5)', color: '#4a4a70' },
  fairy: { bg: 'rgba(240,182,188,0.22)', border: 'rgba(240,182,188,0.55)', color: '#a0306a' },
}

function getTypeTagStyle(tag: string): React.CSSProperties {
  const c = TYPE_COLORS[tag.toLowerCase()]
  if (!c) return {}
  return { background: c.bg, borderColor: c.border, color: c.color, fontWeight: 800 }
}

export default function FusionDetail() {
  const { poke1, poke2 } = useParams<{ poke1: string; poke2: string }>()
  const navigate = useNavigate()

  const { pokemon: allPokemon, loading: pokeLoading } = usePokemonList()
  const [fusionMap, setFusionMap] = useState<FusionMap>({})
  const poke1EvoLine = useEvoLine(poke1)
  const poke1Megas = useMegaForms(poke1)
  const poke2Megas = useMegaForms(poke2)
  const [fusionLoading, setFusionLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const slideKey = useRef(0)
  const [requested, setRequested] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    getFusionMap()
      .then(data => setFusionMap(data.fusions ?? {}))
      .catch(() => { })
      .finally(() => setFusionLoading(false))
  }, [])

  const getPoke = (name: string) => allPokemon.find(p => p.name === name)
  const basePoke1 = getPoke(poke1 ?? '')
  const basePoke2 = getPoke(poke2 ?? '')

  const extraPoke1 = useExtraPokemon(poke1, basePoke1)
  const extraPoke2 = useExtraPokemon(poke2, basePoke2)

  const poke1Data = basePoke1 ?? extraPoke1
  const poke2Data = basePoke2 ?? extraPoke2

  const loading = pokeLoading || fusionLoading

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.loadingWrap}>
        <img src="https://m.archives.bulbagarden.net/media/upload/a/a2/Spr_2c_025.png" alt="Loading…" className={styles.spinner} />
        <p className={styles.loadingText}>Loading…</p>
      </div>
    </div>
  )



  // Dedupe helper
  const dedup = (list: FusionArtwork[]) => {
    const ids = new Set<string>()
    return list.filter(a => ids.has(a.id) ? false : (ids.add(a.id), true))
  }

  // All artworks containing BOTH pokemon (deduped)
  const allBoth = dedup(
    poke1 === poke2
      ? // Self-fusion: all fusions must be the same pokemon
      (fusionMap[poke1 ?? ''] ?? []).filter(a => a.fusions.every(f => f === poke1))
      : // Regular fusion: must contain both pokemon
      [
        ...(fusionMap[poke1 ?? ''] ?? []).filter(a => a.fusions.includes(poke2 ?? '')),
        ...(fusionMap[poke2 ?? ''] ?? []).filter(a => a.fusions.includes(poke1 ?? '')),
      ]
  )

  // Primary: artworks where poke1 is listed first
  const artworks = allBoth.filter(a => a.fusions[0] === poke1)

  // Related fusions — priority scored, max 6
  // Tier 1 (+4): poke1 evo-line × poke2  (different stage of same base, same partner)
  // Tier 2 (+2): poke1 evo-line × any    (evo-line fusions with other partners)
  // Tier 3 (+1): poke1 or poke2 × other  (anything else)
  const primaryIds = new Set(artworks.map(a => a.id))

  const scoredCandidates = dedup([
    ...(fusionMap[poke1 ?? ''] ?? []),
    ...(fusionMap[poke2 ?? ''] ?? []),
    // also include fusions of any evo-line member
    ...[...poke1EvoLine].flatMap(evo => fusionMap[evo] ?? []),
  ])
    .filter(a => !primaryIds.has(a.id))
    .map(a => {
      const fusionPokes = a.fusions
      const involvesEvo = fusionPokes.some(f => poke1EvoLine.has(f))
      const involvesPoke2 = fusionPokes.includes(poke2 ?? '')
      let score = 0
      if (involvesEvo && involvesPoke2) score = 4   // Tier 1
      else if (involvesEvo) score = 2   // Tier 2
      else score = 1   // Tier 3
      return { art: a, score }
    })
    .sort((a, b) => b.score - a.score)

  const related = scoredCandidates.map(s => s.art).slice(0, 6)

  const active = artworks[activeIdx] ?? artworks[0]

  const goTo = (newIdx: number, dir: 'left' | 'right') => {
    if (newIdx === activeIdx) return
    setSlideDir(dir)
    slideKey.current += 1
    setActiveIdx(newIdx)
  }
  const goPrev = () => goTo((activeIdx - 1 + artworks.length) % artworks.length, 'right')
  const goNext = () => goTo((activeIdx + 1) % artworks.length, 'left')

  const handleRequest = async () => {
    if (requested || requesting || !poke1 || !poke2) return
    setRequesting(true)
    try {
      await requestFusion(poke1, poke2)
      setRequested(true)
      localStorage.setItem(`fusion_req_${[poke1, poke2].sort().join('+')}`, '1')
    } catch { }
    finally { setRequesting(false) }
  }

  if (!artworks.length || !poke1Data || !poke2Data) {
    const alreadyRequested = requested ||
      !!localStorage.getItem(`fusion_req_${[poke1, poke2].sort().join('+')}`)
    return (
      <div className={styles.page}>
        <div className={styles.noFusionWrap}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16, width: '100%', paddingLeft: 14 }}>
            <button onClick={() => navigate(`/pokemon/${poke1}`)} className={styles.backBtn}>
              ← Back to {capitalize(poke1 ?? '')}
            </button>
            <button
              onClick={() => navigate(`/fusion/${poke2}/${poke1}`)}
              className={styles.backBtn}
              title="View reversed fusion"
            >
              Reverse ⇆
            </button>
          </div>

          {/* Poke chips */}
          {poke1Data && poke2Data && (
            <div className={styles.fusionFormula}>
              <PokeChip poke={poke1Data} />
              <span className={styles.fusionX}>×</span>
              <PokeChip poke={poke2Data} />
            </div>
          )}

          {(poke1Megas.length > 0 || poke2Megas.length > 0) && (
            <div className={styles.megaButtons}>
              {[...poke1Megas, ...poke2Megas]
                .filter(megaName => megaName !== poke1 && megaName !== poke2)
                .map((megaName) => {
                const label = getMegaLabel(megaName)

                return (
                  <button
                    key={megaName}
                    className={`${styles.megaBtn}`}
                    data-mega-type={label}
                    onClick={() => {
                      // Replace the correct side with mega form
                      const isPoke1Mega = megaName.startsWith(poke1 ?? "")
                      const newPoke1 = isPoke1Mega ? megaName : poke1
                      const newPoke2 = !isPoke1Mega ? megaName : poke2

                      navigate(`/fusion/${newPoke1}/${newPoke2}`)
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Placeholder image — replace src with your GDrive link */}
          <div className={styles.noFusionImgWrap}>
            <img
              src="/assets/fusion_missing_placeholder.png"
              alt="No fusion yet"
              className={styles.noFusionImg}
            />
          </div>

          <p className={styles.noFusionText}>
            No fusion artwork yet for {capitalize(poke1 ?? '')} × {capitalize(poke2 ?? '')}
          </p>
          {poke1 && poke2 && (
            <p className={styles.defaultFusionName}>
              Default name: {capitalize(defaultFusionName(poke1, poke2))}
            </p>
          )}

          {/* Request button */}
          <button
            onClick={handleRequest}
            disabled={alreadyRequested || requesting}
            className={`${styles.requestBtn} ${alreadyRequested ? styles['requestBtn--filled'] : ''}`}
          >
            {alreadyRequested ? (
              <>
                <img
                  src="/assets/Pocket_Request_Selected.png"
                  alt=""
                  className={styles.requestBtnIcon}
                />
                Fusion Requested!
              </>
            ) : (
              <>
                <img
                  src="/assets/Pocket_Request_Unselected.png"
                  alt=""
                  className={styles.requestBtnIcon}
                />
                {requesting ? "Requesting…" : "Request this Fusion"}
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16, width: '100%', paddingLeft: 14 }}>
          <button onClick={() => navigate(`/pokemon/${poke1}`)} className={styles.backBtn}>
            ← Back to {capitalize(poke1 ?? '')}
          </button>
          <button
            onClick={() => navigate(`/fusion/${poke2}/${poke1}`)}
            className={styles.backBtn}
            title="View reversed fusion"
          >
            Reverse ⇆
          </button>
        </div>

        {/* Fusion formula */}
        <div className={styles.fusionFormula}>
          <PokeChip poke={poke1Data} />
          <span className={styles.fusionX}>×</span>
          <PokeChip poke={poke2Data} />
        </div>

        {(poke1Megas.length > 0 || poke2Megas.length > 0) && (
          <div className={styles.megaButtons}>
            {[...poke1Megas, ...poke2Megas]
              .filter(megaName => megaName !== poke1 && megaName !== poke2)
              .map((megaName) => {
              const label = getMegaLabel(megaName)

              return (
                <button
                  key={megaName}
                  className={`${styles.megaBtn}`}
                  data-mega-type={label}
                  onClick={() => {
                    // Replace the correct side with mega form
                    const isPoke1Mega = megaName.startsWith(poke1 ?? "")
                    const newPoke1 = isPoke1Mega ? megaName : poke1
                    const newPoke2 = !isPoke1Mega ? megaName : poke2

                    navigate(`/fusion/${newPoke1}/${newPoke2}`)
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}

        {/* Hero image — with multi-artwork slider when there's more than one */}
        <div className={styles.heroImageWrap}>
          {active && (
            <img
              key={`${active.id}-${slideKey.current}`}
              src={active.image_url}
              alt={active.title}
              className={`${styles.heroImage} ${slideDir === 'left' ? styles['heroImage--slideLeft'] : slideDir === 'right' ? styles['heroImage--slideRight'] : ''}`}
              referrerPolicy="no-referrer"
              onError={e => {
                const img = e.target as HTMLImageElement
                if (img.src !== active.full_url) img.src = active.full_url
              }}
            />
          )}
          {artworks.length > 1 && (
            <>
              <button
                className={`${styles.slideBtn} ${styles['slideBtn--prev']}`}
                onClick={goPrev}
                aria-label="Previous artwork"
              >‹</button>
              <button
                className={`${styles.slideBtn} ${styles['slideBtn--next']}`}
                onClick={goNext}
                aria-label="Next artwork"
              >›</button>
              <div className={styles.slideDots}>
                {artworks.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.slideDot} ${i === activeIdx ? styles['slideDot--active'] : ''}`}
                    onClick={() => goTo(i, i > activeIdx ? 'left' : 'right')}
                    aria-label={`Artwork ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info */}
        {active && (
          <div className={styles.heroInfo}>
            <h1 className={styles.heroTitle}>{active.title}</h1>
            {(active.medium || active.year) && (
              <p className={styles.heroMeta}>{[active.medium, active.year].filter(Boolean).join(' · ')}</p>
            )}
            {active.description && <p className={styles.heroDesc}>{active.description}</p>}
            {active.tags.length > 0 && (
              <div className={styles.heroTags}>
                {active.tags.map(t => (
                  <span key={t} className={styles.tag} style={getTypeTagStyle(t)}>{t}</span>
                ))}
              </div>
            )}
            <a href={active.full_url} target="_blank" rel="noopener noreferrer" className={styles.btnView}>
              View full resolution ↗
            </a>
          </div>
        )}
      </div>

      {/* ── Related fusions strip — always shown if related exist ── */}
      {related.length > 0 && (
        <div className={styles.strip}>
          <div className={styles.stripInner}>
            <p className={styles.stripLabel}>RELATED FUSIONS</p>
            <div className={styles.stripGrid}>
              {/* Related artworks — same-pair artworks now navigated via hero slider, not shown here */}
              {related.map(art => {
                const dest = `/fusion/${art.fusions[0]}/${art.fusions[1] ?? ''}`
                return (
                  <button
                    key={art.id}
                    onClick={() => navigate(dest)}
                    className={styles.thumb}
                    title={art.title}
                  >
                    <img src={art.image_url} alt={art.title} referrerPolicy="no-referrer" />
                    <span className={styles.thumbLabel}>{art.fusions.map(capitalize).join('+')}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── More with section ── */}
      {related.length > 0 && (
        <div className={styles.related}>
          <div className={styles.relatedHeader}>
            <span className={styles.relatedLabel}>MORE WITH</span>
            <div className={styles.relatedPokes}>
              {[poke1Data, poke2Data].map(p => (
                <button
                  key={p.name}
                  onClick={() => navigate(`/pokemon/${p.name}`)}
                  className={styles.relatedPokeBtn}
                  title={`See all fusions with ${capitalize(p.name)}`}
                >
                  <img src={p.sprite} alt={p.name} className={styles.relatedPokeSprite}
                    onError={e => { const img = e.target as HTMLImageElement; if (p.fallback && img.src !== p.fallback) img.src = p.fallback }} />
                  <span>{capitalize(p.name)}</span>
                </button>
              ))}
            </div>
          </div>
          {/* <div className={styles.relatedGrid}>
            {related.map(art => (
              <button
                key={art.id}
                onClick={() => navigate(`/fusion/${art.fusions[0]}/${art.fusions[1] ?? ''}`)}
                className={styles.relatedCard}
              >
                <div className={styles.relatedImgWrap}>
                  <img src={art.image_url} alt={art.title} referrerPolicy="no-referrer" className={styles.relatedImg} />
                </div>
                <div className={styles.relatedInfo}>
                  <p className={styles.relatedTitle}>{art.title}</p>
                  <p className={styles.relatedFusions}>{art.fusions.map(capitalize).join(' + ')}</p>
                </div>
              </button>
            ))}
          </div> */}
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