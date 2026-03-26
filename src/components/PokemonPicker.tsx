import { useState, useEffect, useRef } from 'react'
import styles from './styles/PokemonPicker.module.css'

interface PokemonPickerProps {
  value: string[]
  onChange: (names: string[]) => void
}

interface PokeOption { name: string; id: number }

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

function spriteForId(id: number) {
  return id <= 1025
    ? `${SPRITE_BASE}/other/home/${id}.png`
    : `${SPRITE_BASE}/other/official-artwork/${id}.png`
}

export default function PokemonPicker({ value, onChange }: PokemonPickerProps) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<PokeOption[]>([])
  const [allPokemon, setAllPokemon] = useState<PokeOption[]>([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load all pokemon names once
  useEffect(() => {
    const loadPokemon = async () => {
      try {
        const countData = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1').then(r => r.json())
        const count = countData.count ?? 1500
        const listData = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${count}&offset=0`).then(r => r.json())
        const list: PokeOption[] = listData.results.map((p: { name: string; url: string }) => ({
          name: p.name,
          id: parseInt(p.url.replace(/\/+$/, '').split('/').pop() ?? '0'),
        }))
        setAllPokemon(list)
      } catch {
        setAllPokemon([])
      }
    }

    loadPokemon()
  }, [])

  useEffect(() => {
    if (!query.trim()) { setOptions([]); return }
    const q = query.toLowerCase()
    setOptions(allPokemon.filter(p => p.name.includes(q)).slice(0, 8))
  }, [query, allPokemon])

  const add = (name: string) => {
    if (!value.includes(name)) onChange([...value, name])
    setQuery('')
    setOptions([])
    inputRef.current?.focus()
  }

  const remove = (name: string) => onChange(value.filter(n => n !== name))

  return (
    <div className={styles.wrap}>
      {/* Selected chips */}
      {value.length > 0 && (
        <div className={styles.chips}>
          {value.map(name => (
            <span key={name} className={styles.chip}>
              <img
                src={spriteForId(allPokemon.find(p => p.name === name)?.id ?? 0)}
                alt={name}
                className={styles.chipSprite}
              />
              {capitalize(name)}
              <button onClick={() => remove(name)} className={styles.chipRemove}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className={styles.inputWrap}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type Pokémon name…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={styles.input}
        />
        {open && options.length > 0 && (
          <div className={styles.dropdown}>
            {options.map(opt => (
              <button key={opt.name} onMouseDown={() => add(opt.name)} className={styles.option}>
                <img
                  src={spriteForId(opt.id)}
                  alt={opt.name}
                  className={styles.optionSprite}
                />
                <span>{capitalize(opt.name)}</span>
                <span className={styles.optionNum}>#{String(opt.id).padStart(3, '0')}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
