import { useState, useEffect } from 'react'
import type { Pokemon } from '../types'

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const REGIONAL = ['-alola', '-galar', '-hisui', '-paldea']
const SKIP = ['-mega', '-gmax', '-totem', '-primal', '-origin', '-sky', '-land',
  '-incarnate', '-therian', '-black', '-white', '-resolute', '-ordinary', '-aria',
  '-pirouette', '-baile', '-pom-pom', '-pau', '-sensu', '-dusk', '-midnight',
  '-original', '-ash', '-battle-bond', '-power-construct', '-complete', '-school',
  '-disguised', '-busted', '-hangry', '-gorging', '-single-strike', '-rapid-strike',
  '-ice', '-shadow', '-crowned', '-eternamax', '-roaming', '-f', '-m',
  '-red-striped', '-blue-striped', '-white-striped', '-male', '-female',
  '-amped', '-low-key', '-curly', '-droopy', '-stretchy',
  '-full-belly', '-hero', '-teal', '-aqua', '-blaze', '-stellar']

const CACHE_KEY = 'artfolio_pokemon_list'
const CACHE_VERSION = 'v2'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

function homeSprite(id: number) {
  return id <= 1025
    ? `${SPRITE_BASE}/other/home/${id}.png`
    : `${SPRITE_BASE}/other/official-artwork/${id}.png`
}

export function usePokemonList() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      // Try cache first — instant load on repeat visits
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const { version, timestamp, data } = JSON.parse(cached)
          if (version === CACHE_VERSION && Date.now() - timestamp < CACHE_TTL) {
            setPokemon(data)
            setLoading(false)
            return
          }
        }
      } catch { /* ignore corrupt cache */ }

      // Fetch fresh from PokéAPI
      try {
        const countData = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1').then(r => r.json())
        const count = countData.count ?? 1500
        const listData = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${count}&offset=0`).then(r => r.json())

        const list: Pokemon[] = listData.results
          .map((p: { name: string; url: string }) => {
            const id = parseInt(p.url.replace(/\/+$/, '').split('/').pop() ?? '0')
            return {
              id, name: p.name,
              sprite: homeSprite(id),
              spriteHome: homeSprite(id),
              fallback: `${SPRITE_BASE}/${id}.png`,
            }
          })
          .filter((p: Pokemon) => {
            if (p.id <= 1025) return true
            if (REGIONAL.some(s => p.name.endsWith(s))) return true
            if (SKIP.some(s => p.name.includes(s))) return false
            return REGIONAL.some(s => p.name.includes(s))
          })

        localStorage.setItem(CACHE_KEY, JSON.stringify({
          version: CACHE_VERSION,
          timestamp: Date.now(),
          data: list,
        }))

        setPokemon(list)
      } catch {
        setPokemon([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { pokemon, loading }
}