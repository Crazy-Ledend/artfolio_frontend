import { useState } from 'react'
import type { Artwork } from '../types'

interface ArtCardProps {
  artwork: Artwork
  onClick: (artwork: Artwork) => void
}

export default function ArtCard({ artwork, onClick }: ArtCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="art-card group cursor-pointer animate-fade-in"
      onClick={() => onClick(artwork)}
    >
      <div className="relative overflow-hidden rounded bg-ink-100 aspect-square">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-ink-300 border-t-ink-600 rounded-full animate-spin" />
          </div>
        )}

        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-400 gap-1">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            <span className="text-xs font-body">Image unavailable</span>
          </div>
        ) : (
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className={`art-card-img w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true) }}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}

        <div className="absolute inset-0 bg-ink-950/0 group-hover:bg-ink-950/30 transition-colors duration-300 flex items-end">
          <div className="w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-canvas font-display text-lg leading-tight">{artwork.title}</p>
            {artwork.year && (
              <p className="text-ink-200 font-body text-xs mt-0.5">{artwork.year}</p>
            )}
          </div>
        </div>

        {/* {artwork.is_available && artwork.price && (
          <div className="absolute top-2 right-2 bg-canvas/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-body text-ink-700">
            {artwork.price}
          </div>
        )} */}
      </div>

      <div className="mt-2.5 px-0.5">
        <h3 className="font-display text-base text-ink-900 leading-snug">{artwork.title}</h3>
        {artwork.medium && (
          <p className="font-body text-xs text-ink-400 mt-0.5">
            {artwork.medium}{artwork.year ? `, ${artwork.year}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}