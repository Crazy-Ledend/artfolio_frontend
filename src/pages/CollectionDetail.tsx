import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCollection, getArtworks } from '../api/client'
import type { Artwork, Collection } from '../types'
import styles from './CollectionDetail.module.css'

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(false)
    Promise.all([
      getCollection(id),
      getArtworks({ collection_id: id, limit: 100 }),
    ])
      .then(([col, arts]) => {
        setCollection(col)
        setArtworks(Array.isArray(arts?.items) ? arts.items : [])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading…</p>
      </div>
    </div>
  )

  if (error || !collection) return (
    <div className={styles.page}>
      <div className={styles.notFound}>
        <button onClick={() => navigate('/collections')} className={styles.backBtn}>← Back</button>
        <p className={styles.emptyText}>Collection not found</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button onClick={() => navigate('/collections')} className={styles.backBtn}>
          ← Back to Collections
        </button>

        {/* Header */}
        <div className={styles.header}>
          {collection.cover_url && (
            <img
              src={collection.cover_url}
              alt={collection.name}
              className={styles.headerCover}
              referrerPolicy="no-referrer"
            />
          )}
          <div className={styles.headerInfo}>
            <h1 className={styles.headerName}>{collection.name}</h1>
            {collection.description && (
              <p className={styles.headerDesc}>{collection.description}</p>
            )}
            <span className={styles.headerCount}>{artworks.length} works</span>
          </div>
        </div>

        {/* Grid */}
        {artworks.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No artworks in this collection yet</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {artworks.map(art => (
              <ArtworkCard key={art.id} art={art} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ArtworkCard({ art, navigate }: { art: Artwork; navigate: (p: string) => void }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const hasFusions = Array.isArray(art.fusions) && art.fusions.length >= 2

  return (
    <div
      className={`${styles.card} ${hasFusions ? styles['card--clickable'] : ''}`}
      onClick={() => hasFusions && navigate(`/fusion/${art.fusions[0]}/${art.fusions[1]}`)}
    >
      <div className={styles.cardImg}>
        {!imgLoaded && <div className={styles.skeleton} />}
        <img
          src={art.image_url}
          alt={art.title}
          className={`${styles.img} ${imgLoaded ? styles['img--loaded'] : ''}`}
          onLoad={() => setImgLoaded(true)}
          onError={e => { const img = e.target as HTMLImageElement; if (img.src !== art.full_url) img.src = art.full_url }}
          referrerPolicy="no-referrer"
        />
        {hasFusions && (
          <div className={styles.fusionBadge}>
            {art.fusions.map(capitalize).join(' + ')}
          </div>
        )}
      </div>
      <div className={styles.cardBody}>
        <h2 className={styles.cardTitle}>{art.title}</h2>
        {(art.medium || art.year) && (
          <p className={styles.cardMeta}>{[art.medium, art.year].filter(Boolean).join(' · ')}</p>
        )}
        {art.tags?.length > 0 && (
          <div className={styles.cardTags}>
            {art.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}