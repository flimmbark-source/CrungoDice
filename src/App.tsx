import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, RoundedBox, Text } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { Euler, Quaternion, Vector3 } from 'three'

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

type DieState = {
  id: number
  faces: [string, string, string, string, string, string]
  letter: string
  consumed: boolean
  rollKey: number
}

type CardState = {
  id: number
  spelling: string
  meaning: string
  image: string
  pointed: string
}

type Motion = {
  position: Vector3
  velocity: Vector3
  quaternion: Quaternion
  angularVelocity: Vector3
  targetQuaternion: Quaternion
  targetFace: number
  lastRollKey: number
  groundedTime: number
  settling: boolean
  landedReported: boolean
}

const DIE_SIZE = 0.48
const HALF = DIE_SIZE / 2
const FLOOR_Y = -0.58
const LEFT = -3.02
const RIGHT = 3.02
const BACK = -1.83
const FRONT = 1.83

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

function buildFaces(primary: string, dieIndex: number): DieState['faces'] {
  const faces = [primary]
  let cursor = (dieIndex * 5 + 3) % LETTERS.length
  while (faces.length < 6) {
    const candidate = LETTERS[cursor % LETTERS.length]
    if (!faces.includes(candidate)) faces.push(candidate)
    cursor += 3
  }
  return faces as DieState['faces']
}

function landingQuaternion(face: number): Quaternion {
  const yaw = Math.floor(Math.random() * 4) * Math.PI / 2
  const faceRotation = [
    new Euler(0, 0, 0),
    new Euler(Math.PI, 0, 0),
    new Euler(-Math.PI / 2, 0, 0),
    new Euler(Math.PI / 2, 0, 0),
    new Euler(0, 0, Math.PI / 2),
    new Euler(0, 0, -Math.PI / 2),
  ][face]
  const result = new Quaternion().setFromEuler(faceRotation)
  return new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw).multiply(result)
}

function freshMotion(rollKey: number): Motion {
  const targetFace = Math.floor(Math.random() * 6)
  return {
    position: new Vector3(randomBetween(-2.25, 2.25), randomBetween(1.8, 3.8), randomBetween(-1.2, 1.2)),
    velocity: new Vector3(randomBetween(-2.4, 2.4), randomBetween(0.2, 2.6), randomBetween(-2.2, 2.2)),
    quaternion: new Quaternion().setFromEuler(new Euler(
      randomBetween(0, Math.PI * 2),
      randomBetween(0, Math.PI * 2),
      randomBetween(0, Math.PI * 2),
    )),
    angularVelocity: new Vector3(randomBetween(-11, 11), randomBetween(-11, 11), randomBetween(-11, 11)),
    targetQuaternion: landingQuaternion(targetFace),
    targetFace,
    lastRollKey: rollKey,
    groundedTime: 0,
    settling: false,
    landedReported: false,
  }
}

function LooseDice({ dice, selectedIds, onSelect, onLanded }: {
  dice: DieState[]
  selectedIds: number[]
  onSelect: (id: number) => void
  onLanded: (id: number, letter: string) => void
}) {
  const refs = useRef<Record<number, Group | null>>({})
  const motions = useRef<Record<number, Motion>>({})

  useEffect(() => {
    for (const die of dice) motions.current[die.id] ??= freshMotion(die.rollKey)
  }, [dice])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30)
    const active = dice.filter(die => !die.consumed)

    for (const die of active) {
      let motion = motions.current[die.id] ?? freshMotion(die.rollKey)
      motions.current[die.id] = motion

      if (motion.lastRollKey !== die.rollKey) {
        motion = freshMotion(die.rollKey)
        motions.current[die.id] = motion
      }

      if (!motion.settling) {
        motion.velocity.y -= 15.5 * delta
        motion.position.addScaledVector(motion.velocity, delta)

        const angularSpeed = motion.angularVelocity.length()
        if (angularSpeed > 0.001) {
          const axis = motion.angularVelocity.clone().normalize()
          motion.quaternion.premultiply(new Quaternion().setFromAxisAngle(axis, angularSpeed * delta)).normalize()
        }

        const floor = FLOOR_Y + HALF
        if (motion.position.y < floor) {
          motion.position.y = floor
          if (motion.velocity.y < 0) motion.velocity.y *= -0.27
          motion.velocity.x *= 0.91
          motion.velocity.z *= 0.91
          motion.angularVelocity.multiplyScalar(0.86)
          motion.groundedTime += delta

          const horizontalSpeed = Math.hypot(motion.velocity.x, motion.velocity.z)
          if (motion.groundedTime > 0.22 && Math.abs(motion.velocity.y) < 0.22 && horizontalSpeed < 0.42) {
            motion.settling = true
            motion.velocity.set(0, 0, 0)
            motion.angularVelocity.set(0, 0, 0)
          }
        } else {
          motion.groundedTime = 0
        }

        if (motion.position.x < LEFT + HALF) {
          motion.position.x = LEFT + HALF
          motion.velocity.x = Math.abs(motion.velocity.x) * 0.45
          motion.angularVelocity.z += randomBetween(-2, 2)
        }
        if (motion.position.x > RIGHT - HALF) {
          motion.position.x = RIGHT - HALF
          motion.velocity.x = -Math.abs(motion.velocity.x) * 0.45
          motion.angularVelocity.z += randomBetween(-2, 2)
        }
        if (motion.position.z < BACK + HALF) {
          motion.position.z = BACK + HALF
          motion.velocity.z = Math.abs(motion.velocity.z) * 0.45
          motion.angularVelocity.x += randomBetween(-2, 2)
        }
        if (motion.position.z > FRONT - HALF) {
          motion.position.z = FRONT - HALF
          motion.velocity.z = -Math.abs(motion.velocity.z) * 0.45
          motion.angularVelocity.x += randomBetween(-2, 2)
        }
      } else {
        motion.position.y = FLOOR_Y + HALF
        motion.quaternion.slerp(motion.targetQuaternion, Math.min(1, delta * 9))
        if (!motion.landedReported && motion.quaternion.angleTo(motion.targetQuaternion) < 0.025) {
          motion.quaternion.copy(motion.targetQuaternion)
          motion.landedReported = true
          onLanded(die.id, die.faces[motion.targetFace])
        }
      }
    }

    const minimumDistance = DIE_SIZE * 0.96
    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const a = motions.current[active[i].id]
        const b = motions.current[active[j].id]
        if (!a || !b || a.settling || b.settling) continue

        const separation = b.position.clone().sub(a.position)
        const distance = separation.length()
        if (distance <= 0 || distance >= minimumDistance) continue

        const normal = separation.multiplyScalar(1 / distance)
        const overlap = minimumDistance - distance
        a.position.addScaledVector(normal, -overlap * 0.5)
        b.position.addScaledVector(normal, overlap * 0.5)

        const closingSpeed = b.velocity.clone().sub(a.velocity).dot(normal)
        if (closingSpeed < 0) {
          const impulse = -closingSpeed * 0.55
          a.velocity.addScaledVector(normal, -impulse)
          b.velocity.addScaledVector(normal, impulse)
          a.angularVelocity.add(new Vector3(normal.z, 0, -normal.x).multiplyScalar(randomBetween(-2.4, 2.4)))
          b.angularVelocity.add(new Vector3(-normal.z, 0, normal.x).multiplyScalar(randomBetween(-2.4, 2.4)))
        }
      }
    }

    for (const die of active) {
      const group = refs.current[die.id]
      const motion = motions.current[die.id]
      if (!group || !motion) continue
      group.position.copy(motion.position)
      group.quaternion.copy(motion.quaternion)
    }
  })

  const faceTransforms: Array<{ position: [number, number, number]; rotation: [number, number, number] }> = [
    { position: [0, HALF + 0.008, 0], rotation: [-Math.PI / 2, 0, 0] },
    { position: [0, -HALF - 0.008, 0], rotation: [Math.PI / 2, 0, Math.PI] },
    { position: [0, 0, HALF + 0.008], rotation: [0, 0, 0] },
    { position: [0, 0, -HALF - 0.008], rotation: [0, Math.PI, 0] },
    { position: [HALF + 0.008, 0, 0], rotation: [0, Math.PI / 2, 0] },
    { position: [-HALF - 0.008, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  ]

  return <>{dice.map(die => {
    if (die.consumed) return null
    const selected = selectedIds.includes(die.id)
    return (
      <group key={die.id} ref={node => { refs.current[die.id] = node }} onPointerDown={event => { event.stopPropagation(); onSelect(die.id) }}>
        <RoundedBox args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} radius={0.035} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color={selected ? '#f0c879' : '#d8cfc0'} emissive={selected ? '#79521e' : '#000000'} emissiveIntensity={selected ? 0.16 : 0} roughness={0.88} metalness={0} />
        </RoundedBox>
        {faceTransforms.map((transform, face) => (
          <Text key={face} position={transform.position} rotation={transform.rotation} fontSize={0.19} color="#171615" anchorX="center" anchorY="middle">
            {die.faces[face]}
          </Text>
        ))}
      </group>
    )
  })}</>
}

function TrayGeometry() {
  return (
    <group>
      <RoundedBox args={[6.65, 0.38, 4.25]} radius={0.26} smoothness={4} position={[0, FLOOR_Y - 0.18, 0]} receiveShadow>
        <meshStandardMaterial color="#121820" roughness={0.94} metalness={0.03} />
      </RoundedBox>
      <mesh position={[0, -0.17, BACK - 0.13]} castShadow receiveShadow><boxGeometry args={[6.55, 0.86, 0.28]} /><meshStandardMaterial color="#222933" roughness={0.9} /></mesh>
      <mesh position={[0, -0.17, FRONT + 0.13]} castShadow receiveShadow><boxGeometry args={[6.55, 0.86, 0.28]} /><meshStandardMaterial color="#222933" roughness={0.9} /></mesh>
      <mesh position={[LEFT - 0.13, -0.17, 0]} castShadow receiveShadow><boxGeometry args={[0.28, 0.86, 3.95]} /><meshStandardMaterial color="#222933" roughness={0.9} /></mesh>
      <mesh position={[RIGHT + 0.13, -0.17, 0]} castShadow receiveShadow><boxGeometry args={[0.28, 0.86, 3.95]} /><meshStandardMaterial color="#222933" roughness={0.9} /></mesh>
    </group>
  )
}

function DiceTray({ dice, selectedIds, onSelect, onLanded }: {
  dice: DieState[]
  selectedIds: number[]
  onSelect: (id: number) => void
  onLanded: (id: number, letter: string) => void
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 9.4, 1.15], fov: 34, near: 0.1, far: 100 }}
      onCreated={({ camera }) => camera.lookAt(0, -0.35, 0)}
    >
      <color attach="background" args={['#11161d']} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 8, 4]} intensity={3.1} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3.5, 1.6, -1.5]} color="#846ff0" intensity={6.5} distance={8} />
      <TrayGeometry />
      <LooseDice dice={dice} selectedIds={selectedIds} onSelect={onSelect} onLanded={onLanded} />
      <Environment preset="warehouse" />
    </Canvas>
  )
}

function createDice(rollSeed: number): DieState[] {
  return START.map((primary, id) => ({ id, faces: buildFaces(primary, id), letter: primary, consumed: false, rollKey: rollSeed + id }))
}

export default function App() {
  const [dice, setDice] = useState<DieState[]>(() => createDice(1))
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [rerolls, setRerolls] = useState(3)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [repository, setRepository] = useState<Record<string, number>>({})
  const [cards, setCards] = useState<CardState[]>([])
  const [repoOpen, setRepoOpen] = useState(true)
  const [deckOpen, setDeckOpen] = useState(true)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [message, setMessage] = useState('Each die has six letters. Wait for them to land, then click the upward faces in reading order.')

  const currentWord = useMemo(() => selectedIds.map(id => dice.find(die => die.id === id)?.letter ?? '').join(''), [selectedIds, dice])
  const valid = Boolean(WORDS[currentWord])
  const activeDice = dice.filter(die => !die.consumed)

  const selectDie = (id: number) => setSelectedIds(ids => ids.includes(id) ? ids.filter(existing => existing !== id) : [...ids, id])
  const landed = (id: number, letter: string) => setDice(items => items.map(die => die.id === id && die.letter !== letter ? { ...die, letter } : die))

  const rerollSelected = () => {
    if (rerolls <= 0) { setMessage('No rerolls remain this round.'); return }
    if (selectedIds.length === 0) { setMessage('Select one or more loose dice to throw again.'); return }
    const ids = new Set(selectedIds)
    setDice(items => items.map(die => ids.has(die.id) ? { ...die, rollKey: die.rollKey + 1000 + Date.now() } : die))
    setRerolls(value => value - 1)
    setSelectedIds([])
    setMessage(`${ids.size} ${ids.size === 1 ? 'die was' : 'dice were'} thrown again. The new letter is determined by the face that lands upward.`)
  }

  const shakeRemaining = () => {
    if (activeDice.length === 0) return
    setDice(items => items.map(die => die.consumed ? die : { ...die, rollKey: die.rollKey + 1000 + Date.now() }))
    setSelectedIds([])
    setMessage('All remaining dice were thrown again; every result comes from one of that die’s six faces.')
  }

  const submit = () => {
    const entry = WORDS[currentWord]
    if (!entry) { setMessage(currentWord ? 'That spelling is not in the prototype dictionary.' : 'Select dice first.'); return }
    setDice(items => items.map(die => selectedIds.includes(die.id) ? { ...die, consumed: true } : die))
    setRepository(repo => ({ ...repo, [currentWord]: (repo[currentWord] ?? 0) + 1 }))
    setCards(deck => [...deck, { id: Date.now(), spelling: currentWord, ...entry }])
    setScore(value => value + currentWord.length * 10)
    setMessage(`${currentWord} cached. A meaning card entered the deck.`)
    setSelectedIds([])
  }

  const matchStack = (spelling: string) => {
    const card = cards.find(item => item.id === selectedCard)
    if (!card) { setMessage('Select a meaning card first.'); return }
    if (card.spelling !== spelling) { setMessage('Incorrect match. The card and stack remain.'); return }
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
    setDice(createDice(Date.now()))
    setMessage('A fresh handful of six-sided letter dice was thrown into the bin.')
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
          <h2>WORD REPOSITORY</h2><p>Cached spellings</p>
          <div className="stack-list">
            {Object.entries(repository).length === 0 && <div className="empty">No words cached</div>}
            {Object.entries(repository).map(([word, count]) => <button key={word} className="word-stack" onClick={() => matchStack(word)}><b dir="rtl">{word}</b><span>×{count}</span></button>)}
          </div>
        </div>
      </section>

      <section className="tray-wrap">
        <DiceTray dice={dice} selectedIds={selectedIds} onSelect={selectDie} onLanded={landed} />
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
          {cards.map(card => <button key={card.id} className={`meaning-card ${selectedCard === card.id ? 'selected' : ''}`} onClick={() => setSelectedCard(card.id)}><span className="card-image">{card.image}</span><b>{card.meaning}</b><small>Match to a spelling</small></button>)}
        </div>
      </section>

      <footer className="status-line">{message}</footer>
    </main>
  )
}
