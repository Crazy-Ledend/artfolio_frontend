import { useState, useEffect } from 'react'
import {
  getArtworks, createArtwork, updateArtwork, deleteArtwork,
  getCollections, createCollection, deleteCollection, getContacts,
} from '../api/client'
import type { Artwork, Collection, ContactRecord, ArtworkFormData, CollectionFormData } from '../types'
import PokemonPicker from '../components/PokemonPicker'
import { getProfile, updateProfile, getFusionRequests, deleteFusionRequest } from '../api/client'
import type { ArtistProfile, SocialLink, FusionRequest } from '../types'
import styles from './styles/Admin.module.css'

const SECRET_KEY = 'artfolio_admin_secret'
type Tab = 'artworks' | 'collections' | 'messages' | 'profile' | 'requests'

export default function Admin() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem(SECRET_KEY) ?? '')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<Tab>('artworks')

  // Validate stored secret on mount using a lightweight admin endpoint
  useEffect(() => {
    const stored = sessionStorage.getItem(SECRET_KEY)
    if (stored) {
      // Hit /artworks with admin header as a quick auth check
      fetch('/api/contact', { headers: { 'x-admin-secret': stored } })
        .then(r => {
          if (r.ok) { setSecret(stored); setAuthed(true) }
          else { sessionStorage.removeItem(SECRET_KEY); setSecret(''); setAuthed(false) }
        })
        .catch(() => { sessionStorage.removeItem(SECRET_KEY); setSecret(''); setAuthed(false) })
    }
  }, [])

  const login = async (s: string): Promise<boolean> => {
    try {
      // Validate by hitting a protected endpoint
      const r = await fetch('/api/contact', { headers: { 'x-admin-secret': s } })
      if (!r.ok) return false
      sessionStorage.setItem(SECRET_KEY, s)
      setSecret(s)
      setAuthed(true)
      return true
    } catch {
      return false
    }
  }

  if (!authed) return <LoginScreen onLogin={login} />

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <h1 className={styles.heading}>Admin</h1>
          <button onClick={() => { sessionStorage.removeItem(SECRET_KEY); setSecret(''); setAuthed(false) }} className={styles.signout}>
            Sign out
          </button>
        </div>

        <div className={styles.tabs}>
          {(['artworks', 'collections', 'messages', 'requests', 'profile'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`${styles.tab} ${tab === t ? styles['tab--active'] : ''}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'artworks' && <ArtworksTab secret={secret} />}
        {tab === 'collections' && <CollectionsTab secret={secret} />}
        {tab === 'messages' && <MessagesTab secret={secret} />}
        {tab === 'profile' && <ProfileTab secret={secret} />}
        {tab === 'requests' && <RequestsTab secret={secret} />}
      </div>
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin: (s: string) => Promise<boolean> }) {
  const [val, setVal] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!val) return
    setLoading(true)
    setError('')
    const ok = await onLogin(val)
    if (!ok) {
      setError('Incorrect password. Try again.')
      setVal('')
    }
    setLoading(false)
  }

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <h2 className={styles.loginTitle}>Admin access</h2>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input
            type={show ? 'text' : 'password'}
            placeholder="Enter admin secret"
            value={val}
            onChange={e => { setVal(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className={styles.input}
            style={{ paddingRight: 40 }}
          />
          <button
            onClick={() => setShow(s => !s)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-400)', display: 'flex', alignItems: 'center', padding: 0,
            }}
            tabIndex={-1}
            title={show ? 'Hide password' : 'Show password'}
          >
            {show ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {error && (
          <p style={{ fontFamily: 'Nunito,sans-serif', fontSize: 12, fontWeight: 700, color: '#e74c3c', marginBottom: 8 }}>
            {error}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading || !val}
          className={styles.btnPrimary}
          style={{ width: '100%', padding: '10px' }}
        >
          {loading ? 'Checking…' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

function emptyArtwork(): ArtworkFormData {
  return { title: '', description: '', medium: '', dimensions: '', year: '', tags: '', collection_id: '', gdrive_url: '', gdrive_file_id: '', is_available: true, sort_order: 0, fusions: [] }
}

function ArtworksTab({ secret }: { secret: string }) {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [form, setForm] = useState<ArtworkFormData>(emptyArtwork())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const load = () => {
    setLoading(true); setError(null)
    Promise.all([getArtworks({ limit: 100 }), getCollections()])
      .then(([art, col]) => {
        setArtworks(Array.isArray(art?.items) ? art.items : [])
        setCollections(Array.isArray(col) ? col : [])
      })
      .catch(() => setError('Could not load. Is the backend running?'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(emptyArtwork()); setEditTarget(null); setShowForm(true); setSaveError('') }
  const openEdit = (a: Artwork) => {
    setForm({
      title: a.title, description: a.description ?? '', medium: a.medium ?? '',
      dimensions: a.dimensions ?? '', year: a.year ? String(a.year) : '',
      tags: a.tags.join(', '), collection_id: a.collection_id ?? '',
      gdrive_url: '', gdrive_file_id: a.gdrive_file_id,
      is_available: a.is_available, sort_order: a.sort_order,
      fusions: Array.isArray(a.fusions) ? a.fusions : [],
    })
    setEditTarget(a.id); setShowForm(true); setSaveError('')
  }

  const setF = <K extends keyof ArtworkFormData>(key: K, val: ArtworkFormData[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        medium: form.medium || undefined,
        dimensions: form.dimensions || undefined,
        year: form.year ? String(form.year) : undefined,
        sort_order: Number(form.sort_order) || 0,
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        collection_id: form.collection_id || undefined,
        gdrive_url: form.gdrive_url || undefined,
        gdrive_file_id: form.gdrive_file_id,
        is_available: form.is_available,
        fusions: form.fusions,
      } as unknown as Partial<ArtworkFormData>
      if (editTarget) await updateArtwork(editTarget, payload, secret)
      else await createArtwork(payload, secret)
      setShowForm(false); load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setSaveError(msg ?? 'Error saving artwork')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this artwork?')) return
    await deleteArtwork(id, secret); load()
  }

  if (error) return <div className={styles.errorBanner}>{error}</div>

  return (
    <div>
      <div className={styles.countsRow}>
        <span className={styles.countLabel}>{artworks.length} artworks</span>
        <button onClick={openNew} className={styles.btnAdd}>+ Add artwork</button>
      </div>

      {showForm && (
        <div className={styles.card}>
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 20, color: 'var(--ink-800)', marginBottom: 16 }}>
            {editTarget ? 'Edit artwork' : 'New artwork'}
          </h3>
          <div className={styles.formGrid}>
            <div><label className={styles.fieldLabel}>Title *</label><input value={form.title} onChange={e => setF('title', e.target.value)} className={styles.input} /></div>
            <div><label className={styles.fieldLabel}>GDrive URL *</label><input value={form.gdrive_url || form.gdrive_file_id} onChange={e => setF('gdrive_url', e.target.value)} className={styles.input} placeholder="Paste Google Drive link" /></div>
            <div><label className={styles.fieldLabel}>Medium</label><input value={form.medium} onChange={e => setF('medium', e.target.value)} className={styles.input} placeholder="Digital, Watercolour…" /></div>
            <div><label className={styles.fieldLabel}>Dimensions</label><input value={form.dimensions} onChange={e => setF('dimensions', e.target.value)} className={styles.input} placeholder="60 × 80 cm" /></div>
            <div><label className={styles.fieldLabel}>Year</label><input type="number" value={form.year} onChange={e => setF('year', e.target.value)} className={styles.input} placeholder="2024" /></div>
            <div><label className={styles.fieldLabel}>Tags (comma-separated)</label><input value={form.tags} onChange={e => setF('tags', e.target.value)} className={styles.input} placeholder="cute, fire-type…" /></div>
            <div>
              <label className={styles.fieldLabel}>Collection</label>
              <select value={form.collection_id} onChange={e => setF('collection_id', e.target.value)} className={styles.select}>
                <option value="">None</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className={styles.fieldLabel}>Sort order</label><input type="number" value={form.sort_order} onChange={e => setF('sort_order', Number(e.target.value))} className={styles.input} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
              <input type="checkbox" checked={form.is_available} onChange={e => setF('is_available', e.target.checked)} />
              <span style={{ fontFamily: "'Nunito'", fontSize: 13, color: 'var(--ink-600)', fontWeight: 600 }}>Available for enquiry</span>
            </div>

            {/* Pokémon fusions — full width */}
            <div className={styles.colSpan2}>
              <label className={styles.fieldLabel}>
                Pokémon fusions
                <span style={{ fontFamily: "'Nunito'", fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: 'var(--ink-300)' }}>
                  (which Pokémon are fused in this artwork?)
                </span>
              </label>
              <PokemonPicker value={form.fusions} onChange={fusions => setF('fusions', fusions)} />
            </div>

            <div className={styles.colSpan2}>
              <label className={styles.fieldLabel}>Description</label>
              <textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={3} className={styles.textarea} />
            </div>
          </div>
          {saveError && <p className={styles.formError}>{saveError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={handleSave} disabled={saving} className={styles.btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setShowForm(false)} className={styles.btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {artworks.map(a => (
            <div key={a.id} className={styles.listRow}>
              <img src={a.image_url} alt={a.title} className={styles.listThumb} referrerPolicy="no-referrer" />
              <div className={styles.listInfo}>
                <p className={styles.listTitle}>{a.title}</p>
                <p className={styles.listMeta}>
                  {a.medium}{a.year ? `, ${a.year}` : ''}
                  {Array.isArray(a.fusions) && a.fusions.length > 0 && (
                    <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 700 }}>
                      ⚡ {a.fusions.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(' + ')}
                    </span>
                  )}
                </p>
              </div>
              <div className={styles.listActions}>
                <button onClick={() => openEdit(a)} className={styles.linkBtn}>Edit</button>
                <button onClick={() => handleDelete(a.id)} className={styles.linkBtnDanger}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CollectionsTab({ secret }: { secret: string }) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [form, setForm] = useState<CollectionFormData>({ name: '', slug: '', description: '', cover_gdrive_file_id: '', sort_order: 0 })
  const [saving, setSaving] = useState(false)

  const load = () => getCollections().then(c => setCollections(Array.isArray(c) ? c : [])).catch(() => { })
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setSaving(true)
    try { await createCollection(form, secret); setForm({ name: '', slug: '', description: '', cover_gdrive_file_id: '', sort_order: 0 }); load() }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete collection?')) return
    await deleteCollection(id, secret); load()
  }

  const autoSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const setF = <K extends keyof CollectionFormData>(key: K, val: CollectionFormData[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <div style={{ maxWidth: 560 }}>
      <div className={styles.card}>
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 20, color: 'var(--ink-800)', marginBottom: 16 }}>New collection</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><label className={styles.fieldLabel}>Name</label><input value={form.name} onChange={e => { setF('name', e.target.value); setF('slug', autoSlug(e.target.value)) }} className={styles.input} /></div>
          <div><label className={styles.fieldLabel}>Slug</label><input value={form.slug} onChange={e => setF('slug', e.target.value)} className={styles.input} /></div>
          <div><label className={styles.fieldLabel}>Description</label><textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={2} className={styles.textarea} /></div>
          <div>
            <label className={styles.fieldLabel}>Cover image (GDrive URL or file ID)</label>
            <input
              value={form.cover_gdrive_file_id}
              onChange={e => {
                const val = e.target.value
                // Extract file ID from GDrive URL if pasted
                const match = val.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{20,})/)
                setF('cover_gdrive_file_id', match ? match[1] : val)
              }}
              className={styles.input}
              placeholder="Paste Google Drive link or file ID"
            />
          </div>
          <button onClick={handleCreate} disabled={saving || !form.name || !form.slug} className={styles.btnPrimary} style={{ width: 'fit-content' }}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {collections.map(c => (
          <div key={c.id} className={styles.listRow}>
            <div className={styles.listInfo}>
              <p className={styles.listTitle}>{c.name}</p>
              <p className={styles.listMeta}>{c.artwork_count} works · /{c.slug}</p>
            </div>
            <button onClick={() => handleDelete(c.id)} className={styles.linkBtnDanger}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function MessagesTab({ secret }: { secret: string }) {
  const [contacts, setContacts] = useState<ContactRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getContacts(secret).then(c => setContacts(Array.isArray(c) ? c : [])).catch(() => { }).finally(() => setLoading(false))
  }, [secret])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} style={{ height: 64 }} />)}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}>
      {contacts.length === 0 ? (
        <p className={styles.messageEmpty}>No messages yet.</p>
      ) : contacts.map(c => (
        <div key={c.id} className={`${styles.messageCard} ${!c.read ? styles['messageCard--unread'] : ''}`}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <p className={styles.messageSender}>{c.name} <span className={styles.messageSenderMuted}>— {c.email}</span></p>
              {c.subject && <p className={styles.messageSubject}>{c.subject}</p>}
            </div>
            <p className={styles.messageDate}>{new Date(c.created_at).toLocaleDateString()}</p>
          </div>
          <p className={styles.messageText}>{c.message}</p>
        </div>
      ))}
    </div>
  )
}

// ── Profile Tab ───────────────────────────────────────────

const PLATFORMS = ['instagram', 'twitter', 'bluesky', 'artstation', 'deviantart', 'youtube', 'tiktok', 'website']

function ProfileTab({ secret }: { secret: string }) {
  const [profile, setProfile] = useState<ArtistProfile | null>(null)
  const [form, setForm] = useState({ name: '', bio: '', photo_gdrive_url: '', location: '' })
  const [socials, setSocials] = useState<SocialLink[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile()
      .then(p => {
        setProfile(p)
        setForm({ name: p.name ?? '', bio: p.bio ?? '', photo_gdrive_url: '', location: p.location ?? '' })
        setSocials(p.socials ?? [])
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true); setSaved(false)
    try {
      await updateProfile({ ...form, socials }, secret)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  const setSocial = (i: number, key: keyof SocialLink, val: string) => {
    setSocials(s => s.map((item, idx) => idx === i ? { ...item, [key]: val } : item))
  }
  const addSocial = () => setSocials(s => [...s, { platform: 'instagram', url: '' }])
  const removeSocial = (i: number) => setSocials(s => s.filter((_, idx) => idx !== i))

  if (loading) return <div style={{ padding: 24, color: 'var(--ink-400)', fontFamily: 'Nunito,sans-serif' }}>Loading…</div>

  return (
    <div style={{ maxWidth: 600 }}>
      <div className={styles.card}>
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 20, color: 'var(--ink-800)', marginBottom: 16 }}>
          Artist profile
        </h3>

        {/* Preview current photo */}
        {profile?.photo_url && (
          <div style={{ marginBottom: 14 }}>
            <img src={profile.photo_url} alt="Current" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)' }} referrerPolicy="no-referrer" />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label className={styles.fieldLabel}>Display name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={styles.input} placeholder="Your name" /></div>
          <div><label className={styles.fieldLabel}>Location</label><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={styles.input} placeholder="City, Country" /></div>
          <div><label className={styles.fieldLabel}>Profile photo (GDrive URL)</label><input value={form.photo_gdrive_url} onChange={e => setForm(f => ({ ...f, photo_gdrive_url: e.target.value }))} className={styles.input} placeholder="Paste Google Drive shareable link" /></div>
          <div>
            <label className={styles.fieldLabel}>Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={4} className={styles.textarea} placeholder="Tell visitors about yourself and your art…" />
          </div>

          {/* Social links */}
          <div>
            <label className={styles.fieldLabel} style={{ marginBottom: 8, display: 'block' }}>Social links</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {socials.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <select value={s.platform} onChange={e => setSocial(i, 'platform', e.target.value)} className={styles.select} style={{ width: 140, flexShrink: 0 }}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                  <input value={s.url} onChange={e => setSocial(i, 'url', e.target.value)} className={styles.input} placeholder="https://…" />
                  <button onClick={() => removeSocial(i)} className={styles.linkBtnDanger} style={{ flexShrink: 0, fontSize: 18, padding: '0 4px' }}>×</button>
                </div>
              ))}
              <button onClick={addSocial} className={styles.btnSecondary} style={{ width: 'fit-content' }}>
                + Add social link
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
            <button onClick={handleSave} disabled={saving} className={styles.btnPrimary}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
            {saved && <span style={{ fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 700, color: '#22c55e' }}>✓ Saved!</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Requests Tab ──────────────────────────────────────────

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const _reqPokeIds: Record<string, number> = {}

function RequestsTab({ secret }: { secret: string }) {
  const [requests, setRequests] = useState<FusionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [pokeIds, setPokeIds] = useState<Record<string, number>>({})

  useEffect(() => {
    // Load poke IDs for sprites
    fetch('https://pokeapi.co/api/v2/pokemon?limit=1300')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, number> = {}
        d.results.forEach((p: { name: string; url: string }, i: number) => {
          map[p.name] = parseInt(p.url.replace(/\/+$/, '').split('/').pop() ?? String(i + 1))
        })
        setPokeIds(map)
      })
      .catch(() => { })
  }, [])

  const load = () => {
    getFusionRequests(secret)
      .then(r => setRequests(Array.isArray(r) ? r : []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [secret])

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this request?')) return
    await deleteFusionRequest(id, secret)
    load()
  }

  const sprite = (name: string) => {
    const id = pokeIds[name]
    if (!id) return `${SPRITE_BASE}/${name}.png`
    return `${SPRITE_BASE}/other/home/${id}.png`
  }

  if (loading) return <div style={{ padding: 24, color: 'var(--ink-400)', fontFamily: 'Nunito' }}>Loading…</div>

  return (
    <div>
      <div className={styles.countsRow}>
        <span className={styles.countLabel}>{requests.length} fusion requests</span>
        <button onClick={load} className={styles.btnSecondary}>Refresh</button>
      </div>

      {requests.length === 0 ? (
        <p style={{ fontFamily: 'Nunito,sans-serif', fontSize: 14, color: 'var(--ink-400)', padding: '20px 0' }}>
          No fusion requests yet.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {requests.map(req => (
            <div key={req.id} className={styles.card} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px' }}>
              {/* Sprites */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={sprite(req.poke1)} alt={req.poke1} style={{ width: 56, height: 56, objectFit: 'contain' }} />
                <span style={{ fontFamily: 'Fredoka,sans-serif', fontSize: 20, color: 'var(--ink-400)' }}>+</span>
                <img src={sprite(req.poke2)} alt={req.poke2} style={{ width: 56, height: 56, objectFit: 'contain' }} />
              </div>
              {/* Names */}
              <p style={{ fontFamily: 'Fredoka,sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink-800)', textAlign: 'center', lineHeight: 1.2 }}>
                {req.poke1.charAt(0).toUpperCase() + req.poke1.slice(1)}<br />
                <span style={{ color: 'var(--ink-400)', fontSize: 13 }}>+</span><br />
                {req.poke2.charAt(0).toUpperCase() + req.poke2.slice(1)}
              </p>
              {/* Votes */}
              <span style={{ fontFamily: 'Silkscreen,monospace', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.08em' }}>
                {req.votes} {req.votes === 1 ? 'request' : 'requests'}
              </span>
              <button onClick={() => handleDelete(req.id)} className={styles.linkBtnDanger} style={{ fontSize: 12 }}>
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}