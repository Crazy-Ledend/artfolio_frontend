import { useState } from 'react'
import type { ArtworkMeta, ArtworkFilters } from '../types'

interface FilterBarProps {
  meta: ArtworkMeta | null
  filters: ArtworkFilters
  onChange: (filters: ArtworkFilters) => void
}

export default function FilterBar({ meta, filters, onChange }: FilterBarProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search ?? '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onChange({ ...filters, search: searchDraft || undefined, page: 1 })
  }

  const toggle = (key: keyof ArtworkFilters, value: string | number) => {
    onChange({
      ...filters,
      [key]: filters[key] === value ? undefined : value,
      page: 1,
    })
  }

  const clearAll = () => {
    setSearchDraft('')
    onChange({ page: 1 })
  }

  const hasFilters = filters.medium || filters.tag || filters.year || filters.search

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search artworks…"
          value={searchDraft}
          onChange={e => setSearchDraft(e.target.value)}
          className="flex-1 px-3 py-2 text-sm font-body bg-white border border-ink-200 rounded focus:outline-none focus:border-ink-500 placeholder:text-ink-300"
        />
        <button type="submit" className="px-4 py-2 bg-ink-900 text-canvas text-sm font-body rounded hover:bg-ink-700 transition-colors">
          Search
        </button>
      </form>

      {(meta?.mediums?.length ?? 0) > 0 && (
        <div>
          <p className="font-body text-xs text-ink-400 mb-2 uppercase tracking-widest">Medium</p>
          <div className="flex flex-wrap gap-1.5">
            {meta!.mediums.map(m => (
              <Pill key={m} label={m} active={filters.medium === m} onClick={() => toggle('medium', m)} />
            ))}
          </div>
        </div>
      )}

      {(meta?.tags?.length ?? 0) > 0 && (
        <div>
          <p className="font-body text-xs text-ink-400 mb-2 uppercase tracking-widest">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {meta!.tags.map(t => (
              <Pill key={t} label={t} active={filters.tag === t} onClick={() => toggle('tag', t)} />
            ))}
          </div>
        </div>
      )}

      {(meta?.years?.length ?? 0) > 0 && (
        <div>
          <p className="font-body text-xs text-ink-400 mb-2 uppercase tracking-widest">Year</p>
          <div className="flex flex-wrap gap-1.5">
            {meta!.years.map(y => (
              <Pill key={y} label={String(y)} active={filters.year === y} onClick={() => toggle('year', y)} />
            ))}
          </div>
        </div>
      )}

      {hasFilters && (
        <button onClick={clearAll} className="text-xs font-body text-ink-400 hover:text-ink-700 underline transition-colors">
          Clear all filters
        </button>
      )}
    </div>
  )
}

interface PillProps {
  label: string
  active: boolean
  onClick: () => void
}

function Pill({ label, active, onClick }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-body border transition-colors duration-150 ${
        active
          ? 'bg-ink-900 text-canvas border-ink-900'
          : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400 hover:text-ink-800'
      }`}
    >
      {label}
    </button>
  )
}