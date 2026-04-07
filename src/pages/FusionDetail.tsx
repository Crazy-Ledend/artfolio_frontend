import { useEffect, useState, useRef, useCallback } from 'react'
import type React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFusionMap, requestFusion, toggleLike } from '../api/client'
import type { Pokemon, FusionArtwork, FusionMap } from '../types'
import { useAuth } from '../context/AuthContext'

import { FormattedText } from '../utils/formatText'
import { usePokemonList } from '../hooks/usePokemonList'
import styles from './styles/FusionDetail.module.css'

// ── Evo-line hook ─────────────────────────────────────────────────────────────
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
          const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
          if (!pokeRes.ok) return
          const pokeData = await pokeRes.json()

          const speciesRes = await fetch(pokeData.species.url)
          if (!speciesRes.ok) return
          const species = await speciesRes.json()
          const chainRes = await fetch(species.evolution_chain.url)
          if (!chainRes.ok) return
          const chainData = await chainRes.json()

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
        } catch { }
      })()
    return () => { cancelled = true }
  }, [name])

  return evoLine
}

function useForms(name: string | undefined) {
  const [data, setData] = useState<{ baseName: string, forms: string[] }>({ baseName: '', forms: [] })

  useEffect(() => {
    if (!name) {
      setData({ baseName: '', forms: [] })
      return
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
        if (!res.ok) return
        const pData = await res.json()

        const speciesUrl = pData.species.url
        const baseName = pData.species.name

        const sRes = await fetch(speciesUrl)
        if (!sRes.ok) return
        const sData = await sRes.json()

        const formNames = sData.varieties
          .map((v: any) => v.pokemon.name)
          .filter((n: string) => n !== name)

        if (!cancelled) {
          setData({ baseName, forms: formNames })
        }
      } catch { }
    })()

    return () => { cancelled = true }
  }, [name])

  return data
}

function getFormLabel(formName: string, baseName: string) {
  if (formName === baseName) return "Base Form"
  if (formName.includes("-mega-x")) return "Mega X"
  if (formName.includes("-mega-y")) return "Mega Y"
  if (formName.includes("-mega-z")) return "Mega Z"
  if (formName.includes("-mega")) return "Mega"

  if (formName.startsWith(baseName + '-')) {
    return formName.slice(baseName.length + 1).split('-').map(capitalize).join(' ')
  }
  return capitalize(formName)
}

function capitalize(s: string) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function FormSelector({
  currentName,
  baseName,
  forms,
  otherPoke,
  isFirst,
  navigate
}: {
  currentName: string,
  baseName: string,
  forms: string[],
  otherPoke: string,
  isFirst: boolean,
  navigate: ReturnType<typeof useNavigate>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (forms.length === 0) return null

  return (
    <div className={styles.formSelector} ref={ref}>
      <button onClick={() => setOpen(!open)} className={styles.formSelectorBtn}>
        {capitalize(currentName)} Forms <span className={styles.formSelectorArrow}>▼</span>
      </button>
      {open && (
        <div className={styles.formSelectorPopup}>
          {forms.map(formName => (
            <button
              key={formName}
              className={styles.formSelectorOption}
              onClick={() => {
                setOpen(false)
                const p1 = isFirst ? formName : otherPoke
                const p2 = isFirst ? otherPoke : formName
                navigate(`/fusion/${p1}/${p2}`)
              }}
            >
              {getFormLabel(formName, baseName)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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

// ── Like button component ─────────────────────────────────────────────────────
function LikeButton({
  artworkId,
  initialCount,
  initialLiked,
}: {
  artworkId: string
  initialCount: number
  initialLiked: boolean
}) {
  const { user, login } = useAuth()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [animating, setAnimating] = useState(false)
  const [pending, setPending] = useState(false)

  // Sync if parent re-renders with new artwork
  useEffect(() => {
    setLiked(initialLiked)
    setCount(initialCount)
  }, [artworkId, initialLiked, initialCount])

  const handleLike = useCallback(async () => {
    if (pending) return
    if (!user) { login(); return }

    // Optimistic update
    const wasLiked = liked
    setLiked(!wasLiked)
    setCount(c => wasLiked ? c - 1 : c + 1)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 600)

    setPending(true)
    try {
      const res = await toggleLike(artworkId)
      setLiked(res.liked)
      setCount(res.like_count)
    } catch {
      // Roll back on error
      setLiked(wasLiked)
      setCount(c => wasLiked ? c + 1 : c - 1)
    } finally {
      setPending(false)
    }
  }, [artworkId, liked, pending, user, login])

  return (
    <button
      className={`${styles.likeBtn} ${liked ? styles['likeBtn--liked'] : ''} ${animating ? styles['likeBtn--pop'] : ''}`}
      onClick={handleLike}
      aria-label={liked ? 'Unlike' : 'Like'}
      title={user ? (liked ? 'Unlike' : 'Like') : 'Log in to like'}
    >
      <svg
        className={styles.likeHeart}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      <span className={styles.likeCount}>{count > 0 ? count : ''}</span>
    </button>
  )
}

// ── Type colours ──────────────────────────────────────────────────────────────
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

// ── Double-tap heart burst ────────────────────────────────────────────────────

function useDoubleTap(onDoubleTap: () => void, delay = 300) {
  const lastTap = useRef<number>(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now()
    if (now - lastTap.current < delay) {
      if (timer.current) clearTimeout(timer.current)
      onDoubleTap()
      lastTap.current = 0
    } else {
      lastTap.current = now
      timer.current = setTimeout(() => { lastTap.current = 0 }, delay)
    }
  }, [onDoubleTap, delay])
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FusionDetail() {
  const { poke1, poke2 } = useParams<{ poke1: string; poke2: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { pokemon: allPokemon, loading: pokeLoading } = usePokemonList()
  const [fusionMap, setFusionMap] = useState<FusionMap>({})
  const poke1EvoLine = useEvoLine(poke1)
  const { baseName: poke1Base, forms: poke1Forms } = useForms(poke1)
  const { baseName: poke2Base, forms: poke2Forms } = useForms(poke2)
  const [fusionLoading, setFusionLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const slideKey = useRef(0)
  const [requested, setRequested] = useState(false)
  const [requesting, setRequesting] = useState(false)

  // Double-tap heart burst state
  const [heartBurst, setHeartBurst] = useState(false)
  const heartBurstTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Per-artwork like state (optimistic, keyed by artwork id)
  const [likeState, setLikeState] = useState<Record<string, { liked: boolean; count: number }>>({})

  const dedup = useCallback((list: FusionArtwork[]) => {
    const ids = new Set<string>()
    return list.filter(a => ids.has(a.id) ? false : (ids.add(a.id), true))
  }, [])

  const allBoth = dedup(
    poke1 === poke2
      ? (fusionMap[poke1 ?? ''] ?? []).filter(a => a.fusions.every(f => f === poke1))
      : [
        ...(fusionMap[poke1 ?? ''] ?? []).filter(a => a.fusions.includes(poke2 ?? '')),
        ...(fusionMap[poke2 ?? ''] ?? []).filter(a => a.fusions.includes(poke1 ?? '')),
      ]
  )

  const artworks = allBoth.filter(a => a.fusions[0] === poke1)
  const active = artworks.length > 0 ? (artworks[activeIdx] ?? artworks[0]) : null

  // Fetch full artwork info containing accurate `liked_by_me` state when active slide changes
  useEffect(() => {
    if (!active) return
    let cancelled = false
    import('../api/client').then(({ getArtwork }) => {
      getArtwork(active.id).then(art => {
        if (cancelled) return
        setLikeState(s => {
          const current = s[active.id]
          if (current?.liked === art.liked_by_me && current?.count === art.like_count) return s
          return { ...s, [active.id]: { liked: art.liked_by_me, count: art.like_count } }
        })
      }).catch(() => { })
    })
    return () => { cancelled = true }
  }, [active?.id, user])

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

  useEffect(() => {
    if (!poke1 || !poke2) return
    const key = `fusion_req_${poke1}+${poke2}`
    if (localStorage.getItem(key)) {
      setRequested(true)
      // verify it's still alive in the db
      import('../api/client').then(({ getFusionRequestStatus }) => {
        getFusionRequestStatus(poke1, poke2).then(exists => {
          if (!exists) {
            localStorage.removeItem(key)
            setRequested(false)
          }
        }).catch(() => {})
      })
    } else {
      setRequested(false)
    }
  }, [poke1, poke2])

  const handleDoubleTap = useDoubleTap(() => {
    if (!active || !user) return

    // trigger heart animation
    setHeartBurst(true)
    if (heartBurstTimer.current) clearTimeout(heartBurstTimer.current)
    heartBurstTimer.current = setTimeout(() => setHeartBurst(false), 600)

    // actually toggle like
    handleToggleLike(active)
  })

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.loadingWrap}>
        <img src="https://m.archives.bulbagarden.net/media/upload/a/a2/Spr_2c_025.png" alt="Loading…" className={styles.spinner} />
        <p className={styles.loadingText}>Loading…</p>
      </div>
    </div>
  )

  const primaryIds = new Set(artworks.map(a => a.id))

  const scoredCandidates = dedup([
    ...(fusionMap[poke1 ?? ''] ?? []),
    ...(fusionMap[poke2 ?? ''] ?? []),
    ...[...poke1EvoLine].flatMap(evo => fusionMap[evo] ?? []),
  ])
    .filter(a => !primaryIds.has(a.id))
    .map(a => {
      const fusionPokes = a.fusions
      const involvesEvo = fusionPokes.some(f => poke1EvoLine.has(f))
      const involvesPoke2 = fusionPokes.includes(poke2 ?? '')
      let score = 0
      if (involvesEvo && involvesPoke2) score = 4
      else if (involvesEvo) score = 2
      else score = 1
      return { art: a, score }
    })
    .sort((a, b) => b.score - a.score)

  const related = scoredCandidates.map(s => s.art).slice(0, 6)

  const goTo = (newIdx: number, dir: 'left' | 'right') => {
    if (newIdx === activeIdx) return
    setSlideDir(dir)
    slideKey.current += 1
    setActiveIdx(newIdx)
  }
  const goPrev = () => goTo((activeIdx - 1 + artworks.length) % artworks.length, 'right')
  const goNext = () => goTo((activeIdx + 1) % artworks.length, 'left')

  // Like helpers
  const getLikeState = (art: FusionArtwork) => {
    const override = likeState[art.id]
    return {
      liked: override?.liked ?? art.liked_by_me ?? false,
      count: override?.count ?? art.like_count ?? 0,
    }
  }

  const handleToggleLike = async (art: FusionArtwork) => {
    if (!user) { return }
    const current = getLikeState(art)
    const optimistic = { liked: !current.liked, count: current.liked ? current.count - 1 : current.count + 1 }
    setLikeState(s => ({ ...s, [art.id]: optimistic }))
    try {
      const res = await toggleLike(art.id)
      setLikeState(s => ({ ...s, [art.id]: { liked: res.liked, count: res.like_count } }))
    } catch {
      setLikeState(s => ({ ...s, [art.id]: current }))
    }
  }

  const handleRequest = async () => {
    if (requested || requesting || !poke1 || !poke2) return
    setRequesting(true)
    try {
      await requestFusion(poke1, poke2)
      setRequested(true)
      localStorage.setItem(`fusion_req_${poke1}+${poke2}`, '1')
    } catch { }
    finally { setRequesting(false) }
  }

  if (!artworks.length || !poke1Data || !poke2Data) {
    const alreadyRequested = requested
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

          {poke1Data && poke2Data && (
            <div className={styles.fusionFormula}>
              <PokeChip poke={poke1Data} />
              <span className={styles.fusionX}>×</span>
              <PokeChip poke={poke2Data} />
            </div>
          )}

          {(poke1Forms.length > 0 || poke2Forms.length > 0) && (
            <div className={styles.formsRow}>
              {poke1Forms.length > 0 && (
                <FormSelector currentName={poke1!} baseName={poke1Base} forms={poke1Forms} otherPoke={poke2!} isFirst={true} navigate={navigate} />
              )}
              {poke2Forms.length > 0 && (
                <FormSelector currentName={poke2!} baseName={poke2Base} forms={poke2Forms} otherPoke={poke1!} isFirst={false} navigate={navigate} />
              )}
            </div>
          )}

          <div className={styles.noFusionImgWrap}>
            <img src="/assets/fusion_missing_placeholder.png" alt="No fusion yet" className={styles.noFusionImg} />
          </div>

          <p className={styles.noFusionText}>
            No fusion artwork yet for {capitalize(poke1 ?? '')} × {capitalize(poke2 ?? '')}
          </p>
          {poke1 && poke2 && (
            <p className={styles.defaultFusionName}>
              Default name: {capitalize(defaultFusionName(poke1, poke2))}
            </p>
          )}

          <button
            onClick={handleRequest}
            disabled={alreadyRequested || requesting}
            className={`${styles.requestBtn} ${alreadyRequested ? styles['requestBtn--filled'] : ''}`}
          >
            {alreadyRequested ? (
              <><img src="/assets/Pocket_Request_Selected.png" alt="" className={styles.requestBtnIcon} />Fusion Requested!</>
            ) : (
              <><img src="/assets/Pocket_Request_Unselected.png" alt="" className={styles.requestBtnIcon} />{requesting ? "Requesting…" : "Request this Fusion"}</>
            )}
          </button>
        </div>
      </div>
    )
  }

  const activeLike = getLikeState(active)

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16, width: '100%', paddingLeft: 14 }}>
          <button onClick={() => navigate(`/pokemon/${poke1}`)} className={styles.backBtn}>
            ← Back to {capitalize(poke1 ?? '')}
          </button>
          <button onClick={() => navigate(`/fusion/${poke2}/${poke1}`)} className={styles.backBtn} title="View reversed fusion">
            Reverse ⇆
          </button>
        </div>

        <div className={styles.fusionFormula}>
          <PokeChip poke={poke1Data} />
          <span className={styles.fusionX}>×</span>
          <PokeChip poke={poke2Data} />
        </div>

        {(poke1Forms.length > 0 || poke2Forms.length > 0) && (
          <div className={styles.formsRow}>
            {poke1Forms.length > 0 && (
              <FormSelector currentName={poke1!} baseName={poke1Base} forms={poke1Forms} otherPoke={poke2!} isFirst={true} navigate={navigate} />
            )}
            {poke2Forms.length > 0 && (
              <FormSelector currentName={poke2!} baseName={poke2Base} forms={poke2Forms} otherPoke={poke1!} isFirst={false} navigate={navigate} />
            )}
          </div>
        )}

        {/* Hero image — double-tap to like */}
        <div
          className={styles.heroImageWrap}
          onClick={handleDoubleTap}
          onTouchEnd={handleDoubleTap}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
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

          {/* Double-tap heart burst */}
          {heartBurst && (
            <div className={styles.heartBurst} aria-hidden>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          )}

          {artworks.length > 1 && (
            <>
              <button className={`${styles.slideBtn} ${styles['slideBtn--prev']}`} onClick={e => { e.stopPropagation(); goPrev() }} aria-label="Previous artwork">‹</button>
              <button className={`${styles.slideBtn} ${styles['slideBtn--next']}`} onClick={e => { e.stopPropagation(); goNext() }} aria-label="Next artwork">›</button>
              <div className={styles.slideDots}>
                {artworks.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.slideDot} ${i === activeIdx ? styles['slideDot--active'] : ''}`}
                    onClick={e => { e.stopPropagation(); goTo(i, i > activeIdx ? 'left' : 'right') }}
                    aria-label={`Artwork ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info — like button lives here */}
        {active && (
          <div className={styles.heroInfo}>
            <div className={styles.heroInfoTop}>
              <h1 className={styles.heroTitle}>{active.title}</h1>
              {/* ── Like button ── */}
              <LikeButton
                artworkId={active.id}
                initialCount={activeLike.count}
                initialLiked={activeLike.liked}
              />
            </div>
            {(active.medium || active.year) && (
              <p className={styles.heroMeta}>{[active.medium, active.year].filter(Boolean).join(' · ')}</p>
            )}
            {active.tags.length > 0 && (
              <div className={styles.heroTags}>
                {active.tags.map(t => <span key={t} className={styles.tag} style={getTypeTagStyle(t)}>{t}</span>)}
              </div>
            )}
            {active.description && (
              <FormattedText text={active.description} className={styles.heroDesc} />
            )}
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className={styles.strip}>
          <div className={styles.stripInner}>
            <p className={styles.stripLabel}>RELATED FUSIONS</p>
            <div className={styles.stripGrid}>
              {related.map(art => {
                const dest = `/fusion/${art.fusions[0]}/${art.fusions[1] ?? ''}`
                return (
                  <button key={art.id} onClick={() => navigate(dest)} className={styles.thumb} title={art.title}>
                    <img src={art.image_url} alt={art.title} referrerPolicy="no-referrer" />
                    <span className={styles.thumbLabel}>{art.fusions.map(capitalize).join('+')}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

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