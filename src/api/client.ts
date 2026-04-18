import axios from 'axios'
import type {
  Artwork, ArtworkListResponse, ArtworkMeta, ArtworkFilters,
  ArtworkFormData, Collection, CollectionFormData, CollectionListResponse,
  ContactMessage, ContactRecord, FusionMap, RequestListResponse,
  ArtistProfile, ProfileFormData,
} from '../types'

const api = axios.create({
  baseURL: import.meta.env.PROD ? 'https://artfolio-api-g8en.onrender.com' : '/api',
  timeout: 10000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('artfolio-token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

export const getCollections = (params: { search?: string, limit?: number, page?: number } = {}): Promise<CollectionListResponse> =>
  api.get('/collections', { params }).then(r => r.data)

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

export const deleteContact = (id: string, secret: string): Promise<void> =>
  api.delete(`/contact/${id}`, { headers: { 'x-admin-secret': secret } })

// ── Pokémon fusions ───────────────────────────────────────

export const getFusionMap = (): Promise<{ fusions: FusionMap }> =>
  api.get('/pokemon/fusions').then(r => r.data)

// ── Profile ───────────────────────────────────────────────

export const getProfile = (): Promise<ArtistProfile> =>
  api.get('/profile').then(r => r.data)

export const updateProfile = (data: Partial<ProfileFormData>, secret: string): Promise<{ ok: boolean }> =>
  api.put('/profile', data, { headers: { 'x-admin-secret': secret } }).then(r => r.data)

// ── Fusion Requests ───────────────────────────────────────

import type { FusionRequest } from '../types'

export const requestFusion = (poke1: string, poke2: string): Promise<{ id: string; votes: number }> =>
  api.post('/fusion-requests', { poke1, poke2 }).then(r => r.data)

export const getFusionRequests = (secret: string, params: { page?: number, limit?: number } = {}): Promise<RequestListResponse> =>
  api.get('/fusion-requests', { params, headers: { 'x-admin-secret': secret } }).then(r => r.data)

export const deleteFusionRequest = (id: string, secret: string): Promise<void> =>
  api.delete(`/fusion-requests/${id}`, { headers: { 'x-admin-secret': secret }, }).then(() => { });

export const completeFusionRequest = (id: string, secret: string): Promise<void> =>
  api.patch(`/fusion-requests/${id}/complete`, {}, { headers: { 'x-admin-secret': secret } }).then(() => { });

export const getFusionRequestStatus = (poke1: string, poke2: string): Promise<boolean> =>
  api.get(`/fusion-requests/check/${poke1}/${poke2}`).then(r => r.data.exists)

export async function toggleLike(artworkId: string): Promise<{ liked: boolean; like_count: number }> {
  const res = await api.post(`/artworks/${artworkId}/like`, {})
  return res.data
}