import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, RoundedBox, Text } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { Vector3 } from 'three'

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
type Motion = {
  position: Vector3
  velocity: Vector3
  rotation: Vector3
  angularVelocity: Vector3
  lastRollKey: number
}

const DIE_SIZE = 0.48
const HALF = DIE_SIZE / 2
const FLOOR_Y = -0.58
const LEFT = -3.02
const RIGHT = 3.02
const BACK = -1.83
const FRONT = 1.83

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

function freshMotion(rollKey: number): Motion {
  return {
    position: new Vector3(
      randomBetween(-2.25, 2.25),
      randomBetween(1.6, 3.8),
      randomBetween(-1.2, 1.2),
    ),
    velocity: new Vector3(
      randomBetween(-2.8, 2.8),
      randomBetween(-0.6, 2.8),
      randomBetween(-2.5, 2.5),
    ),
    rotation: new Vector3(
      randomBetween(0, Math.PI * 2),
      randomBetween(0, Math.PI * 2),
      randomBetween(0, Math.PI * 2),
    ),
    angularVelocity: new Vector3(
      randomBetween(-10, 10),
      randomBetween(-10, 10),
      randomBetween(-10, 10),
    ),
    lastRollKey: rollKey,
  }
}

function LooseDice({ dice, selectedIds, onSelect }: {
  dice: DieState[]
  selectedIds: number[]
  onSelect: (id: number) => void
}) {
  const refs = useRef<Record<number, Group | null>>({})
  const motions = useRef<Record<number, Motion>>({})

  useMemo(() => {
    for (const die of dice) {
      motions.current[die.id] ??= freshMotion(die.rollKey)
    }
  }, [dice])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30)
    const active = dice.filter(die => !die.consumed)

    for (const die of active) {
      const motion = motions.current[die.id] ?? freshMotion(die.rollKey)
      motions.current[die.id] = motion

      if (motion.lastRollKey !== die.rollKey) {
        const reset = freshMotion(die.rollKey)
        motions.current[die.id] = reset
        continue
      }

      motion.velocity.y -= 14.5 * delta
      motion.position.addScaledVector(motion.velocity, delta)
      motion.rotation.addScaledVector(motion.angularVelocity, delta)

      const floor = FLOOR_Y + HALF
      if (motion.position.y < floor) {
        motion.position.y = floor
        if (motion.velocity.y < 0) motion.velocity.y *= -0.34
        motion.velocity.x *= 0.965
        motion.velocity.z *= 0.965
        motion.angularVelocity.multiplyScalar(0.972)
        if (Math.abs(motion.velocity.y) < 0.08) motion.velocity.y = 0
      }

      if (motion.position.x < LEFT + HALF) {
        motion.position.x = LEFT + HALF
        motion.velocity.x = Math.abs(motion.velocity.x) * 0.58
        motion.angularVelocity.z += randomBetween(-1.2, 1.2)
      }
      if (motion.position.x > RIGHT - HALF) {
        motion.position.x = RIGHT - HALF
        motion.velocity.x = -Math.abs(motion.velocity.x) * 0.58
        motion.angularVelocity.z += randomBetween(-1.2, 1.2)
      }
      if (motion.position.z < BACK + HALF) {
        motion.position.z = BACK + HALF
        motion.velocity.z = Math.abs(motion.velocity.z) * 0.58
        motion.angularVelocity.x += randomBetween(-1.2, 1.2)
      }
      if (motion.position.z > FRONT - HALF) {
        motion.position.z = FRONT - HALF
        motion.velocity.z = -Math.abs(motion.velocity.z) * 0.58
        motion.angularVelocity.x += randomBetween(-1.2, 1.2)
      }
    }

    const minimumDistance = DIE_SIZE * 0.92
    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const a = motions.current[active[i].id]
        const b = motions.current[active[j].id]
        if (!a || !b) continue

        const separation = b.position.clone().sub(a.position)
        const distance = separation.length()
        if (distance <= 0 || distance >= minimumDistance) continue

        const normal = separation.multiplyScalar(1 / distance)
        const overlap = minimumDistance - distance
        a.position.addScaledVector(normal, -overlap * 0.5)
        b.position.addScaledVector(normal, overlap * 0.5)

        const relativeSpeed = b.velocity.clone().sub(a.velocity).dot(normal)
        if (relativeSpeed < 0) {
          const impulse = -(1.05 * relativeSpeed) * 0.5
          a.velocity.addScaledVector(normal, -impulse)
          b.velocity.addScaledVector(normal, impulse)
          a.angularVelocity.add(new Vector3(normal.z, 0, -normal.x).multiplyScalar(randomBetween(-1.8, 1.8)))
          b.angularVelocity.add(new Vector3(-normal.z, 0, normal.x).multiplyScalar(randomBetween(-1.8, 1.8)))
        }
      }
    }

    for (const die of active) {
      const group = refs.current[die.id]
      const motion = motions.current[die.id]
      if (!group || !motion) continue
      group.position.copy(motion.position)
      group.rotation.set(motion.rotation.x, motion.rotation.y, motion.rotation.z)
    }
  })

  return (
    <>
      {dice.map(die => {
        if (die.consumed) return null
        const selected = selectedIds.includes(die.id)
        return (
          <group
            key={die.id}
            ref={node => { refs.current[die.id] = node }}
            onPointerDown={event => {
              event.stopPropagation()
              onSelect(die.id)
            }}
          >
            <RoundedBox args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} radius={0.055} smoothness={3} castShadow receiveShadow>
              <meshStandardMaterial
                color={selected ? '#f0c879' : '#d9d0c2'}
                emissive={selected ? '#8b6225' : '#000000'}
                emissiveIntensity={selected ? 0.18 : 0}
                roughness={0.83}
                metalness={0}
              />
            </RoundedBox>
            <Text position={[0, HALF + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.205} color="#191817" anchorX="center" anchorY="middle">{die.letter}</Text>
            <Text position={[0, 0, HALF + 0.008]} fontSize={0.205} color="#191817" anchorX="center" anchorY="middle">{die.letter}</Text>
            <Text position={[HALF + 0.008, 0, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.205} color="#191817" anchorX="center" anchorY="middle">{die.letter}</Text>
            <Text position={[-HALF - 0.008, 0, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.205} color="#191817" anchorX="center" anchorY="middle">{die.letter}</Text>
          </group>
        )
      })}
    </>
  )
}

function TrayGeometry() {
  return (
    <group>
      <RoundedBox args={[6.65, 0.38, 4.25]} radius={0.26} smoothness={4} position={[0, FLOOR_Y - 0.18, 0]} receiveShadow>
        <meshStandardMaterial color="#121820" roughness={0.94} metalness={0.03} />
      </RoundedBox>
      <mesh position={[0, -0.17, BACK - 0.13]} castShadow receiveShadow>
        <boxGeometry args={[6.55, 0.86, 0.28]} />
        <meshStandardMaterial color="#222933" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.17, FRONT + 0.13]} castShadow receiveShadow>
        <boxGeometry args={[6.55, 0.86, 0.28]} />
        <meshStandardMaterial color="#222933" roughness={0.9} />
      </mesh>
      <mesh position={[LEFT - 0.13, -0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.86, 3.95]} />
        <meshStandardMaterial color="#222933" roughness={0.9} />
      </mesh>
      <mesh position={[RIGHT + 0.13, -0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.86, 3.95]} />
        <meshStandardMaterial color="#222933" roughness={0.9} />
      </mesh>
    </group>
  )
}

function DiceTray({ dice, selectedIds, onSelect }: {
  dice: DieState[]
  selectedIds: number[]
  onSelect: (id: number) => void
}) {
  return (
    <Canvas shadows camera={{ position: [0, 6.45, 6.05], fov: 39 }}>
      <color attach="background" args={['#11161d']} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 8, 4]} intensity={3.1} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3.5, 1.6, -1.5]} color="#846ff0" intensity={6.5} distance={8} />
      <TrayGeometry />
      <LooseDice dice={dice} selectedIds={selectedIds} onSelect={onSelect} />
      <Environment preset="warehouse" />
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
  const [message, setMessage] = useState('The dice are loose in the tray. Click them in reading order to build a word.')

  const currentWord = useMemo(() => selectedIds.map(id => dice.find(die => die.id === id)?.letter ?? '').join(''), [selectedIds, dice])
  const valid = Boolean(WORDS[currentWord])
  const activeDice = dice.filter(die => !die.consumed)

  const selectDie = (id: number) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(existing => existing !== id) : [...ids, id])
  }

  const rerollSelected = () => {
    if (rerolls <= 0) {
      setMessage('No rerolls remain this round.')
      return
    }
    if (selectedIds.length === 0) {
      setMessage('Select one or more loose dice to throw again.')
      return
    }

    const ids = new Set(selectedIds)
    setDice(items => items.map(die => ids.has(die.id)
      ? { ...die, letter: LETTERS[Math.floor(Math.random() * LETTERS.length)], rollKey: die.rollKey + 1 }
      : die
    ))
    setRerolls(value => value - 1)
    setSelectedIds([])
    setMessage(`${ids.size} ${ids.size === 1 ? 'die was' : 'dice were'} thrown back into the bin.`)
  }

  const shakeRemaining = () => {
    if (activeDice.length === 0) return
    setDice(items => items.map(die => die.consumed ? die : { ...die, rollKey: die.rollKey + 1 }))
    setSelectedIds([])
    setMessage('The remaining dice were shaken. Their letters did not change.')
  }

  const submit = () => {
    const entry = WORDS[currentWord]
    if (!entry) {
      setMessage(currentWord ? 'That spelling is not in the prototype dictionary.' : 'Select dice first.')
      return
    }
    setDice(items => items.map(die => selectedIds.includes(die.id) ? { ...die, consumed: true } : die))
    setRepository(repo => ({ ...repo, [currentWord]: (repo[currentWord] ?? 0) + 1 }))
    setCards(deck => [...deck, { id: Date.now(), spelling: currentWord, ...entry }])
    setScore(value => value + currentWord.length * 10)
    setMessage(`${currentWord} cached. A meaning card entered the deck.`)
    setSelectedIds([])
  }

  const matchStack = (spelling: string) => {
    const card = cards.find(item => item.id === selectedCard)
    if (!card) {
      setMessage('Select a meaning card first.')
      return
    }
    if (card.spelling !== spelling) {
      setMessage('Incorrect match. The card and stack remain.')
      return
    }
    setCards(deck => deck.filter(item => item.id !== card.id))
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
      rollKey: Date.now() + id,
    })))
    setMessage('A fresh handful of dice was thrown into the bin.')
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
        <button className="panel-tab" onClick={() => setRepoOpen(open => !open)} aria-label="Toggle word repository">{repoOpen ? '‹' : '›'}</button>
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
          <button className="secondary" onClick={shakeRemaining}>SHAKE</button>
          <button className="secondary" onClick={rerollSelected}>REROLL SELECTED</button>
          <button className="secondary" onClick={nextRound}>NEXT ROUND</button>
          <button className="primary" disabled={!valid} onClick={submit}>SUBMIT</button>
        </div>
      </section>

      <section className={`deck-drawer ${deckOpen ? 'open' : 'closed'}`}>
        <button className="drawer-tab" onClick={() => setDeckOpen(open => !open)}>{deckOpen ? '⌄' : '⌃'} DECIPHER DECK · {cards.length}</button>
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
