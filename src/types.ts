export interface Artwork {
  id: string
  title: string
  description?: string
  medium?: string
  dimensions?: string
  year?: number | string
  tags: string[]
  collection_id?: string
  gdrive_file_id: string
  is_available: boolean
  sort_order: number
  image_url: string
  full_url: string
  created_at: string
  updated_at: string
  fusions: string[]   // lowercase pokemon names
  like_count: number
  liked_by_me: boolean
}

export interface Collection {
  id: string
  name: string
  slug: string
  description?: string
  cover_gdrive_file_id?: string
  sort_order: number
  cover_url?: string
  artwork_count: number
  created_at: string
}

export interface ArtworkMeta {
  mediums: string[]
  tags: string[]
  years: number[]
}

export interface ArtworkListResponse {
  items: Artwork[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface CollectionListResponse {
  items: Collection[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface RequestListResponse {
  items: FusionRequest[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface ContactMessage {
  name: string
  email: string
  subject?: string
  message: string
  artwork_id?: string
}

export interface ContactRecord extends ContactMessage {
  id: string
  read: boolean
  created_at: string
}

export interface ArtworkFilters {
  collection_id?: string
  medium?: string
  tag?: string
  year?: number | string
  search?: string
  page?: number
  limit?: number
}

export interface ArtworkFormData {
  title: string
  description: string
  medium: string
  dimensions: string
  year: string
  tags: string
  collection_id: string
  gdrive_url: string
  gdrive_file_id: string
  is_available: boolean
  sort_order: number
  fusions: string[]   // array of pokemon names
}

export interface CollectionFormData {
  name: string
  slug: string
  description: string
  cover_gdrive_file_id: string
  sort_order: number
}

// Pokémon from PokéAPI
export interface Pokemon {
  id: number
  name: string
  sprite: string        // home sprite URL (or official artwork for regional forms)
  spriteHome?: string   // same as sprite
  fallback?: string     // pixel sprite fallback
}

// Fusion map from our backend
export interface FusionArtwork {
  id: string
  title: string
  fusions: string[]
  image_url: string
  full_url: string
  description?: string
  medium?: string
  year?: number
  tags: string[]
}

export interface FusionMap {
  [pokemonName: string]: FusionArtwork[]
}

// ── Profile ───────────────────────────────────────────────

export interface SocialLink {
  platform: string  // instagram | twitter | artstation | deviantart | youtube | website | tiktok | bluesky
  url: string
}

export interface ArtistProfile {
  name: string
  bio: string
  photo_url?: string
  location?: string
  socials: SocialLink[]
  stats: {
    artworks: number
    fusions: number
  }
}

export interface ProfileFormData {
  name: string
  bio: string
  photo_gdrive_url: string
  location: string
  socials: SocialLink[]
}

// ── Fusion Requests ───────────────────────────────────────

export interface FusionRequest {
  id: string
  poke1: string
  poke2: string
  votes: number
  created_at: string
  completed?: boolean
}

// Spirals
export type SpiralProps = {
  size?: number;
  thickness?: number;
  color?: string;
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
};

// Corner Images
export type DecorImageProps = {
  src: string;
  size?: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
};

export interface DiscordUser {
  id: string
  username: string
  avatar?: string
  discriminator: string
}

export interface FusionArtwork {
  id: string
  title: string
  description?: string
  medium?: string
  year?: number
  tags: string[]
  fusions: string[]
  image_url: string
  full_url: string
  // ↓ new
  like_count: number
  liked_by_me: boolean
}