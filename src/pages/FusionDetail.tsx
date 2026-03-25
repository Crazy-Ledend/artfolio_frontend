import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFusionMap, requestFusion } from '../api/client'
import type { Pokemon, FusionArtwork, FusionMap } from '../types'
import { usePokemonList } from '../hooks/usePokemonList'
import styles from './FusionDetail.module.css'

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function defaultFusionName(poke1: string, poke2: string) {
  const first = poke1.slice(0, Math.floor(poke1.length / 2))
  const second = poke2.slice(Math.floor(poke2.length / 2))
  return `${first}${second}`
}

export default function FusionDetail() {
  const { poke1, poke2 } = useParams<{ poke1: string; poke2: string }>()
  const navigate = useNavigate()

  const { pokemon: allPokemon, loading: pokeLoading } = usePokemonList()
  const [fusionMap, setFusionMap] = useState<FusionMap>({})
  const [fusionLoading, setFusionLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [requested, setRequested] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    getFusionMap()
      .then(data => setFusionMap(data.fusions ?? {}))
      .catch(() => {})
      .finally(() => setFusionLoading(false))
  }, [])

  const loading = pokeLoading || fusionLoading

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

  // Related: everything else — reversed pair first, then singles
  const primaryIds = new Set(artworks.map(a => a.id))
  const related = dedup([
    ...allBoth.filter(a => !primaryIds.has(a.id)),         // reversed pairs
    ...(fusionMap[poke1 ?? ''] ?? []),                      // other poke1 fusions
    ...(fusionMap[poke2 ?? ''] ?? []),                      // other poke2 fusions
  ]).filter(a => !primaryIds.has(a.id)).slice(0, 12)

  const active = artworks[activeIdx] ?? artworks[0]

  const handleRequest = async () => {
    if (requested || requesting || !poke1 || !poke2) return
    setRequesting(true)
    try {
      await requestFusion(poke1, poke2)
      setRequested(true)
      localStorage.setItem(`fusion_req_${[poke1,poke2].sort().join('+')}`, '1')
    } catch { }
    finally { setRequesting(false) }
  }

  if (!artworks.length || !poke1Data || !poke2Data) {
    const alreadyRequested = requested ||
      !!localStorage.getItem(`fusion_req_${[poke1,poke2].sort().join('+')}`)
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
                {active.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
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
              {/* Other artworks in this same primary set (multiple bulbasaur+ivysaur) */}
              {artworks.length > 1 && artworks.map((art, i) => (
                <button
                  key={art.id}
                  onClick={() => setActiveIdx(i)}
                  className={`${styles.thumb} ${i === activeIdx ? styles['thumb--current'] : styles['thumb--active']}`}
                  title={art.title}
                >
                  <img src={art.image_url} alt={art.title} referrerPolicy="no-referrer" />
                  <span className={styles.thumbLabel}>{art.fusions.map(capitalize).join('+')}</span>
                </button>
              ))}
              {/* Related artworks */}
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