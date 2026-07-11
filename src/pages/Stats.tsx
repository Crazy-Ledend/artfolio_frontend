import { useState, useEffect } from 'react'
import { usePokemonList } from '../hooks/usePokemonList'
import { getFusionMap } from '../api/client'
import type { FusionMap } from '../types'
import StatsView from './components/StatsView'
import styles from './styles/Gallery.module.css'

export default function Stats() {
  const { pokemon, loading: pokeLoading } = usePokemonList()
  const [fusionMap, setFusionMap] = useState<FusionMap>({})
  const [fusionLoading, setFusionLoading] = useState(true)
  const loading = pokeLoading || fusionLoading

  useEffect(() => {
    getFusionMap()
      .then(data => setFusionMap(data.fusions ?? {}))
      .catch(() => setFusionMap({}))
      .finally(() => setFusionLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.dex}>
        <div className={styles.dexTop}>
          <div className={styles.dexDots}>
            <div className={`${styles.dot} ${styles['dot--red']}`} />
            <div className={`${styles.dot} ${styles['dot--yellow']}`} />
            <div className={`${styles.dot} ${styles['dot--green']}`} />
            <span className={styles.dexTitle}>ArtFusion Stats</span>
          </div>
        </div>

        <div className={styles.dexBody}>
          <div className={styles.gridScreen}>
            <StatsView pokemon={pokemon} fusionMap={fusionMap} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  )
}
