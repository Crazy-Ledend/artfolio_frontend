import { useEffect, useState } from 'react'
import type { Artwork } from '../types'

interface ArtworkModalProps {
  artwork: Artwork
  onClose: () => void
  onContact: (artwork: Artwork) => void
}

export default function ArtworkModal({ artwork, onClose, onContact }: ArtworkModalProps) {
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm animate-fade-in" />

      <div className="relative z-10 bg-canvas rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col sm:flex-row animate-scale-in">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-ink-100 hover:bg-ink-200 transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13"/>
          </svg>
        </button>

        {/* Image */}
        <div className="sm:w-1/2 bg-ink-100 flex items-center justify-center min-h-[260px] sm:min-h-0">
          {!imgLoaded && (
            <div className="w-8 h-8 border-2 border-ink-300 border-t-ink-600 rounded-full animate-spin" />
          )}
          <img
            src={artwork.full_url}
            alt={artwork.title}
            className={`w-full h-full object-contain max-h-[50vh] sm:max-h-[85vh] transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
            onLoad={() => setImgLoaded(true)}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Info */}
        <div className="sm:w-1/2 flex flex-col overflow-y-auto p-6 sm:p-8">
          <div className="mb-4">
            <h2 className="font-display text-3xl text-ink-900 leading-tight">{artwork.title}</h2>
            {artwork.year && (
              <p className="font-body text-sm text-ink-400 mt-1">{artwork.year}</p>
            )}
          </div>

          <div className="space-y-2 mb-5">
            {artwork.medium && <MetaRow label="Medium" value={artwork.medium} />}
            {artwork.dimensions && <MetaRow label="Dimensions" value={artwork.dimensions} />}
            {/* {artwork.is_available && artwork.price && (
              <MetaRow label="Price" value={artwork.price} highlight />
            )} */}
            {!artwork.is_available && (
              <MetaRow label="Availability" value="Not available" />
            )}
          </div>

          {artwork.description && (
            <p className="font-body text-sm text-ink-600 leading-relaxed mb-5 border-t border-ink-100 pt-4">
              {artwork.description}
            </p>
          )}

          {artwork.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {artwork.tags.map(tag => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full border border-ink-200 text-xs font-body text-ink-500">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-ink-100 flex flex-col gap-2">
            {artwork.is_available && (
              <button
                onClick={() => onContact(artwork)}
                className="w-full py-2.5 bg-ink-900 text-canvas font-body text-sm rounded hover:bg-ink-700 transition-colors"
              >
                Enquire about this piece
              </button>
            )}
            <a
              href={artwork.full_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 border border-ink-200 text-ink-600 font-body text-sm rounded hover:bg-ink-50 transition-colors text-center"
            >
              View full resolution ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MetaRowProps {
  label: string
  value: string
  highlight?: boolean
}

function MetaRow({ label, value, highlight = false }: MetaRowProps) {
  return (
    <div className="flex gap-3 items-baseline">
      <span className="font-body text-xs text-ink-400 w-24 shrink-0">{label}</span>
      <span className={`font-body text-sm ${highlight ? 'text-ink-900 font-medium' : 'text-ink-700'}`}>{value}</span>
    </div>
  )
}