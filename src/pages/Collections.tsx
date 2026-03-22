import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCollections } from '../api/client'
import type { Collection } from '../types'
import styles from './Collections.module.css'

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCollections()
      .then(c => setCollections(Array.isArray(c) ? c : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.heading}>Collections</h1>
        <p className={styles.subheading}>Works organised by series and theme</p>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No collections yet</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {collections.map(col => <CollectionCard key={col.id} collection={col} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link to={`/collections/${collection.id}`} className={styles.card}>
      <div className={styles.cardCover}>
        {collection.cover_url ? (
          <img src={collection.cover_url} alt={collection.name} referrerPolicy="no-referrer" loading="lazy" />
        ) : (
          <div className={styles.cardCoverEmpty}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="0.8">
              <rect x="4" y="4" width="32" height="32" rx="4"/>
              <circle cx="14" cy="14" r="4"/>
              <path d="M36 28L24 16 14 26 8 20"/>
            </svg>
          </div>
        )}
        <span className={styles.cardBadge}>{collection.artwork_count} works</span>
      </div>
      <div className={styles.cardBody}>
        <h2 className={styles.cardName}>{collection.name}</h2>
        {collection.description && <p className={styles.cardDesc}>{collection.description}</p>}
      </div>
    </Link>
  )
}