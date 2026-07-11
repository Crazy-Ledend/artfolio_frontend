import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from '../styles/Gallery.module.css'
import type { Pokemon, FusionMap, FusionArtwork } from '../../types'

interface StatsViewProps {
  pokemon: Pokemon[]
  fusionMap: FusionMap
  loading: boolean
}

export default function StatsView({ pokemon, fusionMap, loading }: StatsViewProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className={styles.statsContainer}>
        <div className={styles.statsSection}>
          <div className={styles.skeletonText} style={{ width: '40%' }}></div>
          <div className={styles.statRow}>
            <div className={styles.statLabelRow}>
              <div className={styles.skeletonText} style={{ width: '30%', marginBottom: 0 }}></div>
              <div className={styles.skeletonText} style={{ width: '15%', marginBottom: 0 }}></div>
            </div>
            <div className={styles.skeletonBar}></div>
          </div>
          <div className={styles.statRow}>
            <div className={styles.statLabelRow}>
              <div className={styles.skeletonText} style={{ width: '30%', marginBottom: 0 }}></div>
              <div className={styles.skeletonText} style={{ width: '15%', marginBottom: 0 }}></div>
            </div>
            <div className={styles.skeletonBar}></div>
          </div>
        </div>

        <div className={styles.statsSection}>
          <div className={styles.skeletonText} style={{ width: '50%' }}></div>
          <div className={styles.top10Grid}>
            {[...Array(10)].map((_, i) => (
              <div key={i} className={styles.skeletonCard}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Deduplicate artworks by ID
  const uniqueArtworksMap = new Map<string, FusionArtwork>()
  Object.values(fusionMap).forEach(artworks => {
    artworks.forEach(art => uniqueArtworksMap.set(art.id, art))
  })
  const uniqueArtworks = Array.from(uniqueArtworksMap.values())

  const totalFusionsMade = uniqueArtworks.length
  const n = pokemon.length
  const totalPossible = n * n

  const fusedPokemonCount = pokemon.filter(p => fusionMap[p.name] && fusionMap[p.name].length > 0).length
  const totalPokemonCount = n

  const fusionsMadePercent = totalPossible > 0 ? (totalFusionsMade / totalPossible) * 100 : 0
  const fusedPokemonPercent = totalPokemonCount > 0 ? (fusedPokemonCount / totalPokemonCount) * 100 : 0

  const totalLikes = uniqueArtworks.reduce((sum, art) => sum + (art.like_count || 0), 0)

  const top10Liked = [...uniqueArtworks]
    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
    .slice(0, 10)

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statsSection}>
        <h2 className={styles.statsTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          Overall Progress
        </h2>

        <div className={styles.statRow}>
          <div className={styles.statLabelRow}>
            <span>Fusions Completed</span>
            <span className={styles.statValue}>{totalFusionsMade} / {totalPossible}</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill} style={{ width: `${Math.min(100, fusionsMadePercent)}%` }}></div>
          </div>
        </div>

        <div className={styles.statRow}>
          <div className={styles.statLabelRow}>
            <span>Pokémon Fused (Unique)</span>
            <span className={styles.statValue}>{fusedPokemonCount} / {totalPokemonCount}</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill} style={{ width: `${Math.min(100, fusedPokemonPercent)}%` }}></div>
          </div>
        </div>

        <div className={styles.statRow} style={{ marginTop: 24 }}>
          <div className={styles.statLabelRow}>
            <span>Total Likes (All Fusions)</span>
            <span className={styles.statValue} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
               <svg viewBox="0 0 24 24" width="12" height="12" fill="#e0443e">
                 <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
               </svg>
               {totalLikes}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.statsSection}>
        <h2 className={styles.statsTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffbd2e' }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          Top 10 Most Liked Fusions
        </h2>

        <div className={styles.top10Grid}>
          {top10Liked.map((art, idx) => {
            const dest = `/fusion/${art.fusions[0]}/${art.fusions[1] ?? ''}`
            return (
              <div key={art.id} className={styles.top10Card} onClick={() => navigate(dest)}>
                <div className={styles.top10Rank}>#{idx + 1}</div>
                <img src={art.image_url} alt={art.title} className={styles.top10Img} referrerPolicy="no-referrer" />
                <div className={styles.top10Info}>
                  <span className={styles.top10Names} title={art.fusions.map(capitalize).join(' + ')}>
                    {art.fusions.map(capitalize).join(' + ')}
                  </span>
                  <span className={styles.top10Likes}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {art.like_count}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
