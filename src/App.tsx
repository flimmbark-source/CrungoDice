import { Canvas } from '@react-three/fiber'
import { Environment, RoundedBox, Text } from '@react-three/drei'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'

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

type Face = {
  position: [number, number, number]
  rotation: [number, number, number]
}

const DIE_SIZE = 0.58
const HALF_DIE = DIE_SIZE / 2 + 0.006
const FACES: Face[] = [
  { position: [0, HALF_DIE, 0], rotation: [-Math.PI / 2, 0, 0] },
  { position: [0, -HALF_DIE, 0], rotation: [Math.PI / 2, 0, Math.PI] },
  { position: [0, 0, HALF_DIE], rotation: [0, 0, 0] },
  { position: [0, 0, -HALF_DIE], rotation: [0, Math.PI, 0] },
  { position: [HALF_DIE, 0, 0], rotation: [0, Math.PI / 2, 0] },
  { position: [-HALF_DIE, 0, 0], rotation: [0, -Math.PI / 2, 0] },
]

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function Die({ die, selected, onSelect }: {
  die: DieState
  selected: boolean
  onSelect: () => void
}) {
  const body = useRef<RapierRigidBody>(null)
  const spawn = useMemo<[number, number, number]>(() => [
    randomBetween(-2.2, 2.2),
    randomBetween(1.5, 3.2),
    randomBetween(-1.25, 1.25),
  ], [])

  useEffect(() => {
    const rigidBody = body.current
    if (!rigidBody || die.consumed) return

    rigidBody.wakeUp()
    rigidBody.setTranslation({
      x: randomBetween(-2.2, 2.2),
      y: randomBetween(1.8, 3.3),
      z: randomBetween(-1.2, 1.2),
    }, true)
    rigidBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
    rigidBody.setLinvel({
      x: randomBetween(-2.4, 2.4),
      y: randomBetween(1.2, 3.3),
      z: randomBetween(-2.2, 2.2),
    }, true)
    rigidBody.setAngvel({
      x: randomBetween(-12, 12),
      y: randomBetween(-12, 12),
      z: randomBetween(-12, 12),
    }, true)
  }, [die.rollKey, die.consumed])

  if (die.consumed) return null

  return (
    <RigidBody
      ref={body}
      colliders="cuboid"
      position={spawn}
      restitution={0.28}
      friction={0.9}
      linearDamping={0.12}
      angularDamping={0.18}
      canSleep
    >
      <RoundedBox
        args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]}
        radius={0.085}
        smoothness={4}
        castShadow
        receiveShadow
        onPointerDown={(event) => {
          event.stopPropagation()
          onSelect()
        }}
      >
        <meshStandardMaterial
          color={selected ? '#f4d79b' : '#e9dfcf'}
          emissive={selected ? '#7a5a22' : '#000000'}
          emissiveIntensity={selected ? 0.22 : 0}
          roughness={0.62}
          metalness={0.02}
        />
      </RoundedBox>
      {FACES.map((face, index) => (
        <Text
          key={index}
          position={face.position}
          rotation={face.rotation}
          fontSize={0.24}
          color="#17191c"
          anchorX="center"
          anchorY="middle"
          depthOffset={-1}
        >
          {die.letter}
        </Text>
      ))}
    </RigidBody>
  )
}

function TrayGeometry() {
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[3.3, 0.18, 2.15]} position={[0, -0.72, 0]} friction={1} restitution={0.1} />
        <CuboidCollider args={[0.18, 0.7, 2.15]} position={[-3.3, -0.05, 0]} />
        <CuboidCollider args={[0.18, 0.7, 2.15]} position={[3.3, -0.05, 0]} />
        <CuboidCollider args={[3.3, 0.7, 0.18]} position={[0, -0.05, -2.15]} />
        <CuboidCollider args={[3.3, 0.7, 0.18]} position={[0, -0.05, 2.15]} />
      </RigidBody>

      <RoundedBox args={[6.9, 0.42, 4.6]} radius={0.3} smoothness={5} position={[0, -0.72, 0]} receiveShadow>
        <meshStandardMaterial color="#151b23" roughness={0.84} metalness={0.12} />
      </RoundedBox>
      <mesh position={[0, -0.18, -2.24]} castShadow receiveShadow>
        <boxGeometry args={[7, 1.05, 0.25]} />
        <meshStandardMaterial color="#202833" roughness={0.72} metalness={0.14} />
      </mesh>
      <mesh position={[0, -0.18, 2.24]} castShadow receiveShadow>
        <boxGeometry args={[7, 1.05, 0.25]} />
        <meshStandardMaterial color="#202833" roughness={0.72} metalness={0.14} />
      </mesh>
      <mesh position={[-3.42, -0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 1.05, 4.7]} />
        <meshStandardMaterial color="#202833" roughness={0.72} metalness={0.14} />
      </mesh>
      <mesh position={[3.42, -0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 1.05, 4.7]} />
        <meshStandardMaterial color="#202833" roughness={0.72} metalness={0.14} />
      </mesh>
    </>
  )
}

function DiceTray({ dice, selectedIds, onSelect }: {
  dice: DieState[]
  selectedIds: number[]
  onSelect: (id: number) => void
}) {
  return (
    <Canvas shadows camera={{ position: [0, 6.9, 6.3], fov: 40 }}>
      <color attach="background" args={['#11161d']} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 8, 4]} intensity={3.4} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-4, 2, -2]} color="#8e78ff" intensity={9} distance={8} />
      <Suspense fallback={null}>
        <Physics gravity={[0, -18, 0]} timeStep="vary">
          <TrayGeometry />
          {dice.map((die) => (
            <Die
              key={die.id}
              die={die}
              selected={selectedIds.includes(die.id)}
              onSelect={() => onSelect(die.id)}
            />
          ))}
        </Physics>
        <Environment preset="warehouse" />
      </Suspense>
    </Canvas>
  )
}

export default function App() {
  const [dice, setDice] = useState<DieState[]>(() => START.map((letter, id) => ({ id, letter, consumed: false, rollKey: 1 })))
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [rerolls, setRerolls] = useState(3)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [repository, setRepository] = useState<Record<string, number>>({})
  const [cards, setCards] = useState<CardState[]>([])
  const [repoOpen, setRepoOpen] = useState(true)
  const [deckOpen, setDeckOpen] = useState(true)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [message, setMessage] = useState('The dice are loose. Select dice to build a word, or select dice and reroll them.')

  const currentWord = useMemo(() => selectedIds.map(id => dice.find(d => d.id === id)?.letter ?? '').join(''), [selectedIds, dice])
  const valid = Boolean(WORDS[currentWord])
  const activeDice = dice.filter(die => !die.consumed)

  const selectDie = (id: number) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  const rerollSelected = () => {
    if (rerolls <= 0) {
      setMessage('No rerolls remain this round.')
      return
    }
    if (selectedIds.length === 0) {
      setMessage('Select one or more loose dice to reroll.')
      return
    }

    const ids = new Set(selectedIds)
    setDice(items => items.map(die => ids.has(die.id)
      ? {
          ...die,
          letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
          rollKey: die.rollKey + 1,
        }
      : die
    ))
    setRerolls(value => value - 1)
    setSelectedIds([])
    setMessage(`${ids.size} ${ids.size === 1 ? 'die' : 'dice'} tossed back into the tray.`)
  }

  const shakeRemaining = () => {
    if (activeDice.length === 0) return
    setDice(items => items.map(die => die.consumed ? die : { ...die, rollKey: die.rollKey + 1 }))
    setSelectedIds([])
    setMessage('The remaining dice were shaken without changing their letters.')
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
    setDice(START.map((letter, id) => ({
      id,
      letter: Math.random() > 0.35 ? letter : LETTERS[Math.floor(Math.random() * LETTERS.length)],
      consumed: false,
      rollKey: 1,
    })))
    setMessage('New round. The fresh dice tumble into the tray.')
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
        <DiceTray dice={dice} selectedIds={selectedIds} onSelect={selectDie} />
        <div className="tray-actions">
          <button className="secondary" onClick={shakeRemaining} disabled={activeDice.length === 0}>SHAKE</button>
          <button className="secondary" onClick={rerollSelected} disabled={rerolls <= 0 || selectedIds.length === 0}>REROLL SELECTED</button>
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