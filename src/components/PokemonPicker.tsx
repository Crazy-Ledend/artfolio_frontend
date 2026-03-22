import { useState, useEffect, useRef } from 'react'
import styles from './PokemonPicker.module.css'

interface PokemonPickerProps {
  value: string[]
  onChange: (names: string[]) => void
}

interface PokeOption { name: string; id: number }

export default function PokemonPicker({ value, onChange }: PokemonPickerProps) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<PokeOption[]>([])
  const [allPokemon, setAllPokemon] = useState<PokeOption[]>([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load all pokemon names once
  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=1025')
      .then(r => r.json())
      .then(d => {
        const list: PokeOption[] = d.results.map((p: { name: string }, i: number) => ({
          name: p.name,
          id: i + 1,
        }))
        setAllPokemon(list)
      })
      .catch(() => {})
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
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${allPokemon.find(p => p.name === name)?.id ?? 0}.png`}
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
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${opt.id}.png`}
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
