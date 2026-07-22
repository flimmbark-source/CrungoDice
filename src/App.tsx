import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Html, RoundedBox } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import type { Group } from 'three'

const LETTERS = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת']
const START = ['ס','פ','ר','ב','י','ת','כ','ל']

const WORDS: Record<string, { meaning: string; image: string; pointed: string }> = {
  'ספר': { meaning: 'Book', image: '📕', pointed: 'סֵפֶר' },
  'בית': { meaning: 'House', image: '🏠', pointed: 'בַּיִת' },
  'כלב': { meaning: 'Dog', image: '🐕', pointed: 'כֶּלֶב' },
  'ים': { meaning: 'Sea', image: '🌊', pointed: 'יָם' },
  'לב': { meaning: 'Heart', image: '❤️', pointed: 'לֵב' },
  'בר': { meaning: 'Grain', image: '🌾', pointed: 'בָּר' },
  'רב': { meaning: 'Many', image: '✦', pointed: 'רַב' },
}

type DieState = { id: number; letter: string; consumed: boolean; rollKey: number }
type CardState = { id: number; spelling: string; meaning: string; image: string; pointed: string }

function Die({ die, index, selected, onSelect, onReroll }: {
  die: DieState
  index: number
  selected: boolean
  onSelect: () => void
  onReroll: () => void
}) {
  const ref = useRef<Group>(null)
  const targetY = selected ? 0.72 : 0
  const x = (index % 4 - 1.5) * 1.35
  const z = (Math.floor(index / 4) - 0.5) * 1.55

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.position.y += (targetY - ref.current.position.y) * Math.min(1, delta * 10)
    if (die.rollKey) {
      ref.current.rotation.x += delta * 2.5
      ref.current.rotation.z += delta * 1.8
    }
  })

  if (die.consumed) return null

  return (
    <group ref={ref} position={[x, 0, z]}>
      <Float speed={selected ? 3 : 1.1} rotationIntensity={selected ? 0.16 : 0.03} floatIntensity={selected ? 0.18 : 0.04}>
        <RoundedBox
          args={[1, 1, 1]}
          radius={0.15}
          smoothness={5}
          castShadow
          receiveShadow
          onClick={(e) => { e.stopPropagation(); onSelect() }}
          onDoubleClick={(e) => { e.stopPropagation(); onReroll() }}
        >
          <meshStandardMaterial color={selected ? '#f6e3bc' : '#e9dfcf'} roughness={0.55} metalness={0.03} />
          <Html center transform distanceFactor={7.5} position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <div className="die-letter">{die.letter}</div>
          </Html>
        </RoundedBox>
      </Float>
    </group>
  )
}

function DiceTray({ dice, selectedIds, onSelect, onReroll }: {
  dice: DieState[]
  selectedIds: number[]
  onSelect: (id: number) => void
  onReroll: (id: number) => void
}) {
  return (
    <Canvas shadows camera={{ position: [0, 6.7, 6.5], fov: 42 }}>
      <color attach="background" args={['#11161d']} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[4, 7, 4]} intensity={3.2} castShadow />
      <pointLight position={[-4, 2, -2]} color="#8e78ff" intensity={14} distance={8} />
      <group rotation={[-0.05, 0, 0]}>
        <RoundedBox args={[6.9, 0.45, 4.6]} radius={0.3} smoothness={5} position={[0, -0.6, 0]} receiveShadow>
          <meshStandardMaterial color="#171d26" roughness={0.72} metalness={0.18} />
        </RoundedBox>
        {dice.map((die, index) => (
          <Die key={die.id} die={die} index={index} selected={selectedIds.includes(die.id)} onSelect={() => onSelect(die.id)} onReroll={() => onReroll(die.id)} />
        ))}
      </group>
      <Environment preset="warehouse" />
    </Canvas>
  )
}

export default function App() {
  const [dice, setDice] = useState<DieState[]>(() => START.map((letter, id) => ({ id, letter, consumed: false, rollKey: 0 })))
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [rerolls, setRerolls] = useState(3)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [repository, setRepository] = useState<Record<string, number>>({})
  const [cards, setCards] = useState<CardState[]>([])
  const [repoOpen, setRepoOpen] = useState(true)
  const [deckOpen, setDeckOpen] = useState(true)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [message, setMessage] = useState('Click dice to build. Double-click one to reroll it.')

  const currentWord = useMemo(() => selectedIds.map(id => dice.find(d => d.id === id)?.letter ?? '').join(''), [selectedIds, dice])
  const valid = Boolean(WORDS[currentWord])

  const selectDie = (id: number) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  const rerollDie = (id: number) => {
    if (rerolls <= 0 || selectedIds.includes(id)) return
    setRerolls(value => value - 1)
    setDice(items => items.map(d => d.id === id ? { ...d, letter: LETTERS[Math.floor(Math.random() * LETTERS.length)], rollKey: d.rollKey + 1 } : d))
    setMessage('Die rerolled.')
  }

  const submit = () => {
    const entry = WORDS[currentWord]
    if (!entry) {
      setMessage(currentWord ? 'That spelling is not in the prototype dictionary.' : 'Select dice first.')
      return
    }
    setDice(items => items.map(d => selectedIds.includes(d.id) ? { ...d, consumed: true } : d))
    setRepository(repo => ({ ...repo, [currentWord]: (repo[currentWord] ?? 0) + 1 }))
    setCards(deck => [...deck, { id: Date.now(), spelling: currentWord, ...entry }])
    setScore(value => value + currentWord.length * 10)
    setMessage(`${currentWord} cached. A meaning card entered the deck.`)
    setSelectedIds([])
  }

  const matchStack = (spelling: string) => {
    const card = cards.find(c => c.id === selectedCard)
    if (!card) { setMessage('Select a meaning card first.'); return }
    if (card.spelling !== spelling) { setMessage('Incorrect match. The card and stack remain.'); return }
    setCards(deck => deck.filter(c => c.id !== card.id))
    setRepository(repo => {
      const next = { ...repo, [spelling]: repo[spelling] - 1 }
      if (next[spelling] <= 0) delete next[spelling]
      return next
    })
    setScore(value => value + 50)
    setSelectedCard(null)
    setMessage(`${card.pointed} — ${card.meaning}. +50`)
  }

  const nextRound = () => {
    setRound(value => value + 1)
    setRerolls(3)
    setSelectedIds([])
    setDice(START.map((letter, id) => ({ id, letter: Math.random() > 0.35 ? letter : LETTERS[Math.floor(Math.random() * LETTERS.length)], consumed: false, rollKey: 0 })))
    setMessage('New round.')
  }

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="stat"><span>ROUND</span><strong>{round}</strong></div>
        <div className="stat"><span>SCORE</span><strong>{score.toLocaleString()}</strong></div>
        <div className="word-display"><span>CURRENT WORD</span><strong dir="rtl">{currentWord || '—'}</strong><small>{valid ? 'VALID SPELLING' : 'BUILD A WORD'}</small></div>
        <div className="stat reroll-stat"><span>REROLLS</span><strong>{rerolls}</strong></div>
      </header>

      <section className={`repository panel ${repoOpen ? 'open' : 'closed'}`}>
        <button className="panel-tab" onClick={() => setRepoOpen(v => !v)} aria-label="Toggle word repository">{repoOpen ? '‹' : '›'}</button>
        <div className="panel-content">
          <h2>WORD REPOSITORY</h2>
          <p>Cached spellings</p>
          <div className="stack-list">
            {Object.entries(repository).length === 0 && <div className="empty">No words cached</div>}
            {Object.entries(repository).map(([word, count]) => (
              <button key={word} className="word-stack" onClick={() => matchStack(word)}>
                <b dir="rtl">{word}</b><span>×{count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="tray-wrap">
        <DiceTray dice={dice} selectedIds={selectedIds} onSelect={selectDie} onReroll={rerollDie} />
        <div className="tray-actions">
          <button className="secondary" onClick={nextRound}>NEXT ROUND</button>
          <button className="primary" disabled={!valid} onClick={submit}>SUBMIT</button>
        </div>
      </section>

      <section className={`deck-drawer ${deckOpen ? 'open' : 'closed'}`}>
        <button className="drawer-tab" onClick={() => setDeckOpen(v => !v)}>{deckOpen ? '⌄' : '⌃'} DECIPHER DECK · {cards.length}</button>
        <div className="cards-row">
          {cards.length === 0 && <div className="empty deck-empty">Submitted words create meaning cards here.</div>}
          {cards.map(card => (
            <button key={card.id} className={`meaning-card ${selectedCard === card.id ? 'selected' : ''}`} onClick={() => setSelectedCard(card.id)}>
              <span className="card-image">{card.image}</span>
              <b>{card.meaning}</b>
              <small>Match to a spelling</small>
            </button>
          ))}
        </div>
      </section>

      <footer className="status-line">{message}</footer>
    </main>
  )
}
