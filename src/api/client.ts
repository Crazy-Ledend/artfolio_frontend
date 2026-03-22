import axios from 'axios'
import type {
  Artwork, ArtworkListResponse, ArtworkMeta, ArtworkFilters,
  ArtworkFormData, Collection, CollectionFormData,
  ContactMessage, ContactRecord, FusionMap,
  ArtistProfile, ProfileFormData,
} from '../types'

const api = axios.create({ baseURL: '/api', timeout: 10000 })

// ── Artworks ──────────────────────────────────────────────

export const getArtworks = (params: ArtworkFilters = {}): Promise<ArtworkListResponse> =>
  api.get('/artworks', { params }).then(r => r.data)

export const getArtwork = (id: string): Promise<Artwork> =>
  api.get(`/artworks/${id}`).then(r => r.data)

export const getArtworkMeta = (): Promise<ArtworkMeta> =>
  api.get('/artworks/meta').then(r => r.data)

export const createArtwork = (data: Partial<ArtworkFormData>, secret: string): Promise<Artwork> =>
  api.post('/artworks', data, { headers: { 'x-admin-secret': secret } }).then(r => r.data)

export const updateArtwork = (id: string, data: Partial<ArtworkFormData>, secret: string): Promise<Artwork> =>
  api.patch(`/artworks/${id}`, data, { headers: { 'x-admin-secret': secret } }).then(r => r.data)

export const deleteArtwork = (id: string, secret: string): Promise<void> =>
  api.delete(`/artworks/${id}`, { headers: { 'x-admin-secret': secret } })

// ── Collections ───────────────────────────────────────────

export const getCollection = (id: string): Promise<Collection> =>
  api.get(`/collections/${id}`).then(r => r.data)

export const getCollections = (): Promise<Collection[]> =>
  api.get('/collections').then(r => r.data)

export const createCollection = (data: CollectionFormData, secret: string): Promise<Collection> =>
  api.post('/collections', data, { headers: { 'x-admin-secret': secret } }).then(r => r.data)

export const updateCollection = (id: string, data: Partial<CollectionFormData>, secret: string): Promise<Collection> =>
  api.patch(`/collections/${id}`, data, { headers: { 'x-admin-secret': secret } }).then(r => r.data)

export const deleteCollection = (id: string, secret: string): Promise<void> =>
  api.delete(`/collections/${id}`, { headers: { 'x-admin-secret': secret } })

// ── Contact ───────────────────────────────────────────────

export const submitContact = (data: ContactMessage): Promise<{ id: string; message: string }> =>
  api.post('/contact', data).then(r => r.data)

export const getContacts = (secret: string): Promise<ContactRecord[]> =>
  api.get('/contact', { headers: { 'x-admin-secret': secret } }).then(r => r.data)

// ── Pokémon fusions ───────────────────────────────────────

export const getFusionMap = (): Promise<{ fusions: FusionMap }> =>
  api.get('/pokemon/fusions').then(r => r.data)

// ── Profile ───────────────────────────────────────────────

export const getProfile = (): Promise<ArtistProfile> =>
  api.get('/profile').then(r => r.data)

export const updateProfile = (data: Partial<ProfileFormData>, secret: string): Promise<{ ok: boolean }> =>
  api.put('/profile', data, { headers: { 'x-admin-secret': secret } }).then(r => r.data)