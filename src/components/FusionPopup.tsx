import { useEffect, useState } from 'react'
import type { Pokemon, FusionArtwork, FusionMap } from '../types'
import styles from './FusionPopup.module.css'

interface FusionPopupProps {
  poke: Pokemon
  artworks: FusionArtwork[]
  allFusions: FusionMap
  allPokemon: Pokemon[]
  onClose: () => void
  onContact: (artwork: FusionArtwork) => void
}

export default function FusionPopup({ poke, artworks, allFusions, allPokemon, onClose, onContact }: FusionPopupProps) {
  const [activeArtwork, setActiveArtwork] = useState<FusionArtwork | null>(null)
  const [activeParter, setActivePartner] = useState<Pokemon | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [onClose])

  if (!artworks?.length) return null

  // Find which pokemon are fusion partners of the selected poke
  // A partner is any pokemon that appears in the same artwork fusions list
  const partnerNames = new Set<string>()
  artworks.forEach(a => {
    a.fusions.forEach(name => {
      if (name !== poke.name) partnerNames.add(name)
    })
  })

  // Find artworks that include both poke and the clicked partner
  const getArtworksWithPartner = (partnerName: string) =>
    artworks.filter(a => a.fusions.includes(partnerName))

  const handlePartnerClick = (partner: Pokemon) => {
    const partnerArtworks = getArtworksWithPartner(partner.name)
    if (!partnerArtworks.length) return
    setActivePartner(partner)
    setActiveArtwork(partnerArtworks[0])
  }

  return (
    <div className={styles.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.popup}>
        <button onClick={onClose} className={styles.closeBtn}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l9 9M10 1L1 10"/>
          </svg>
        </button>

        {/* ── Left: selected Pokémon + mini dex grid ── */}
        <div className={styles.left}>
          {/* Selected poke card */}
          <div className={styles.pokeCard}>
            <span className={styles.pokeCardId}>#{String(poke.id).padStart(3, '0')}</span>
            <div className={styles.pokeCardDot} />
            <img src={poke.spriteHome ?? poke.sprite} alt={poke.name} className={styles.pokeHeroImg} />
            <div className={styles.pokeCardDivider} />
            <p className={styles.pokeName}>{capitalize(poke.name)}</p>
            <p className={styles.pokeNum}>#{String(poke.id).padStart(4, '0')}</p>
          </div>

          {/* Mini dex label */}
          <p className={styles.miniDexLabel}>FUSED WITH</p>

          {/* Mini Pokédex grid — all pokemon, only partners active */}
          <div className={styles.miniDex}>
            {allPokemon.map(p => {
              const isPartner = partnerNames.has(p.name)
              const isSelected = activeParter?.name === p.name
              return (
                <button
                  key={p.id}
                  className={[
                    styles.miniTile,
                    isPartner ? styles['miniTile--active'] : styles['miniTile--inactive'],
                    isSelected ? styles['miniTile--selected'] : '',
                  ].join(' ')}
                  onClick={() => isPartner && handlePartnerClick(p)}
                  disabled={!isPartner}
                  title={isPartner ? capitalize(p.name) : undefined}
                >
                  <img
                    src={p.sprite}
                    alt={p.name}
                    className={styles.miniSprite}
                    loading="lazy"
                    onError={e => {
                      const img = e.target as HTMLImageElement
                      if (p.fallback && img.src !== p.fallback) img.src = p.fallback
                      else img.style.display = 'none'
                    }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Right: artwork detail ── */}
        <div className={styles.right}>
          {activeArtwork && activeParter ? (
            <>
              <div className={styles.artFrame}>
                <img
                  src={activeArtwork.image_url}
                  alt={activeArtwork.title}
                  className={styles.artImg}
                  referrerPolicy="no-referrer"
                  onError={e => {
                    // fallback to full_url if thumbnail fails
                    const img = e.target as HTMLImageElement
                    if (img.src !== activeArtwork.full_url) img.src = activeArtwork.full_url
                  }}
                />
              </div>
              <div className={styles.artInfo}>
                <h2 className={styles.artTitle}>{activeArtwork.title}</h2>
                {(activeArtwork.medium || activeArtwork.year) && (
                  <p className={styles.artMeta}>
                    {[activeArtwork.medium, activeArtwork.year].filter(Boolean).join(' · ')}
                  </p>
                )}
                {/* Fusion formula */}
                <div className={styles.fusionFormula}>
                  {activeArtwork.fusions.map((name, i) => (
                    <span key={name} className={styles.fusionFormulaInner}>
                      {i > 0 && <span className={styles.fusionPlus}>+</span>}
                      <span className={`${styles.fusionChip} ${name === poke.name || name === activeParter.name ? styles['fusionChip--active'] : ''}`}>
                        <img src={getHomeSpriteByName(name)} alt={name} className={styles.fusionChipSprite}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <span>{capitalize(name)}</span>
                      </span>
                    </span>
                  ))}
                </div>
                {activeArtwork.tags.length > 0 && (
                  <div className={styles.artTags}>
                    {activeArtwork.tags.map(t => <span key={t} className={styles.artTag}>{t}</span>)}
                  </div>
                )}
                {activeArtwork.description && (
                  <p className={styles.artDesc}>{activeArtwork.description}</p>
                )}
                <div className={styles.artActions}>
                  <button onClick={() => onContact(activeArtwork)} className={styles.btnEnquire}>Enquire</button>
                  <a href={activeArtwork.full_url} target="_blank" rel="noopener noreferrer" className={styles.btnView}>Full res ↗</a>
                </div>
              </div>
            </>
          ) : (
            /* Empty state — prompt to click a partner */
            <div className={styles.emptyRight}>
              <p className={styles.emptyRightText}>
                Click a highlighted Pokémon<br/>to see the fusion artwork
              </p>
              <div className={styles.emptyArrow}>←</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

const _nameToId: Record<string, number> = {}
function getHomeSpriteByName(name: string): string {
  const id = _nameToId[name]
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
  if (id && id <= 1025) return `${base}/other/home/${id}.png`
  if (id) return `${base}/other/official-artwork/${id}.png`
  return `${base}/other/home/0.png`
}
export function registerPokemonIds(list: { name: string; id: number }[]) {
  list.forEach(p => { _nameToId[p.name] = p.id })
}