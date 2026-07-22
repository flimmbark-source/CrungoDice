import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, RoundedBox, Text } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { Euler, Quaternion, Vector3 } from 'three'

type WordEntry = {
  id: string
  spelling: string
  pointed: string
  meaning: string
  image: string
  transliteration: string
  packId: string
}

type WordPack = {
  id: string
  name: string
  description: string
  entries: WordEntry[]
  diceFaces: [string, string, string, string, string, string][]
}

const ACTIVE_PACK: WordPack = {
  id: 'around-the-house',
  name: 'Around the House',
  description: 'A hidden collection of things and places found around a home.',
  entries: [
    { id: 'house', spelling: 'בית', pointed: 'בַּיִת', meaning: 'House', image: '🏠', transliteration: 'bayit', packId: 'around-the-house' },
    { id: 'book', spelling: 'ספר', pointed: 'סֵפֶר', meaning: 'Book', image: '📕', transliteration: 'sefer', packId: 'around-the-house' },
    { id: 'table', spelling: 'שולחן', pointed: 'שֻׁלְחָן', meaning: 'Table', image: '🪵', transliteration: 'shulchan', packId: 'around-the-house' },
    { id: 'chair', spelling: 'כיסא', pointed: 'כִּסֵּא', meaning: 'Chair', image: '🪑', transliteration: 'kise', packId: 'around-the-house' },
    { id: 'door', spelling: 'דלת', pointed: 'דֶּלֶת', meaning: 'Door', image: '🚪', transliteration: 'delet', packId: 'around-the-house' },
    { id: 'window', spelling: 'חלון', pointed: 'חַלּוֹן', meaning: 'Window', image: '🪟', transliteration: 'chalon', packId: 'around-the-house' },
    { id: 'light', spelling: 'אור', pointed: 'אוֹר', meaning: 'Light', image: '💡', transliteration: 'or', packId: 'around-the-house' },
    { id: 'water', spelling: 'מים', pointed: 'מַיִם', meaning: 'Water', image: '💧', transliteration: 'mayim', packId: 'around-the-house' },
    { id: 'bed', spelling: 'מיטה', pointed: 'מִטָּה', meaning: 'Bed', image: '🛏️', transliteration: 'mita', packId: 'around-the-house' },
    { id: 'cup', spelling: 'כוס', pointed: 'כּוֹס', meaning: 'Cup', image: '🥛', transliteration: 'kos', packId: 'around-the-house' },
  ],
  diceFaces: [
    ['ב', 'ס', 'ש', 'כ', 'ד', 'ח'],
    ['י', 'פ', 'ו', 'ל', 'ל', 'ו'],
    ['ת', 'ר', 'ל', 'ס', 'ת', 'ר'],
    ['א', 'ח', 'ו', 'י', 'מ', 'כ'],
    ['מ', 'ן', 'א', 'ט', 'ו', 'ד'],
    ['י', 'ו', 'ה', 'ן', 'ס', 'ל'],
    ['ם', 'ת', 'ר', 'א', 'ח', 'פ'],
    ['ה', 'ן', 'ס', 'ב', 'מ', 'י'],
  ],
}

const BONUS_WORDS: WordEntry[] = [
  { id: 'bonus-heart', spelling: 'לב', pointed: 'לֵב', meaning: 'Heart', image: '❤️', transliteration: 'lev', packId: 'bonus' },
  { id: 'bonus-hand', spelling: 'יד', pointed: 'יָד', meaning: 'Hand', image: '✋', transliteration: 'yad', packId: 'bonus' },
  { id: 'bonus-sea', spelling: 'ים', pointed: 'יָם', meaning: 'Sea', image: '🌊', transliteration: 'yam', packId: 'bonus' },
]

const ALL_WORDS = [...ACTIVE_PACK.entries, ...BONUS_WORDS].reduce<Record<string, WordEntry>>((map, entry) => {
  map[entry.spelling] = entry
  return map
}, {})

type DieState = {
  id: number
  faces: [string, string, string, string, string, string]
  letter: string
  consumed: boolean
  rollKey: number
}

type CardState = WordEntry & { cardId: number }
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
type DragState = { id: number; pointerId: number; startX: number; startY: number; moved: boolean } | null

const DIE_SIZE = 0.48
const HALF = DIE_SIZE / 2
const FLOOR_Y = -0.58
const LEFT = -3.02
const RIGHT = 3.02
const BACK = -1.83
const FRONT = 1.83
const DRAG_THRESHOLD = 24
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

function landingQuaternion(face: number): Quaternion {
  const faceRotation = [
    new Euler(0, 0, 0),
    new Euler(Math.PI, 0, 0),
    new Euler(-Math.PI / 2, 0, 0),
    new Euler(Math.PI / 2, 0, 0),
    new Euler(0, 0, Math.PI / 2),
    new Euler(0, 0, -Math.PI / 2),
  ][face]
  const uprightYaw = [0, 0, 0, Math.PI, -Math.PI / 2, Math.PI / 2][face]
  return new Quaternion()
    .setFromAxisAngle(new Vector3(0, 1, 0), uprightYaw)
    .multiply(new Quaternion().setFromEuler(faceRotation))
}

function freshMotion(rollKey: number): Motion {
  const targetFace = Math.floor(Math.random() * 6)
  return {
    position: new Vector3(randomBetween(-2.25, 2.25), randomBetween(1.8, 3.8), randomBetween(-1.2, 1.2)),
    velocity: new Vector3(randomBetween(-2.4, 2.4), randomBetween(0.2, 2.6), randomBetween(-2.2, 2.2)),
    quaternion: new Quaternion().setFromEuler(new Euler(randomBetween(0, Math.PI * 2), randomBetween(0, Math.PI * 2), randomBetween(0, Math.PI * 2))),
    angularVelocity: new Vector3(randomBetween(-11, 11), randomBetween(-11, 11), randomBetween(-11, 11)),
    targetQuaternion: landingQuaternion(targetFace),
    targetFace,
    lastRollKey: rollKey,
    groundedTime: 0,
    settling: false,
    landedReported: false,
  }
}

function LooseDice({ dice, selectedIds, viableIds, onSelect, onLanded, onDragReroll }: {
  dice: DieState[]
  selectedIds: number[]
  viableIds: number[]
  onSelect: (id: number) => void
  onLanded: (id: number, letter: string) => void
  onDragReroll: (id: number) => void
}) {
  const refs = useRef<Record<number, Group | null>>({})
  const motions = useRef<Record<number, Motion>>({})
  const drag = useRef<DragState>(null)

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
          motion.quaternion.premultiply(new Quaternion().setFromAxisAngle(motion.angularVelocity.clone().normalize(), angularSpeed * delta)).normalize()
        }

        const floor = FLOOR_Y + HALF
        if (motion.position.y < floor) {
          motion.position.y = floor
          if (motion.velocity.y < 0) motion.velocity.y *= -0.27
          motion.velocity.x *= 0.91
          motion.velocity.z *= 0.91
          motion.angularVelocity.multiplyScalar(0.86)
          motion.groundedTime += delta
          if (motion.groundedTime > 0.22 && Math.abs(motion.velocity.y) < 0.22 && Math.hypot(motion.velocity.x, motion.velocity.z) < 0.42) {
            motion.settling = true
            motion.velocity.set(0, 0, 0)
            motion.angularVelocity.set(0, 0, 0)
          }
        } else motion.groundedTime = 0

        if (motion.position.x < LEFT + HALF) { motion.position.x = LEFT + HALF; motion.velocity.x = Math.abs(motion.velocity.x) * 0.45 }
        if (motion.position.x > RIGHT - HALF) { motion.position.x = RIGHT - HALF; motion.velocity.x = -Math.abs(motion.velocity.x) * 0.45 }
        if (motion.position.z < BACK + HALF) { motion.position.z = BACK + HALF; motion.velocity.z = Math.abs(motion.velocity.z) * 0.45 }
        if (motion.position.z > FRONT - HALF) { motion.position.z = FRONT - HALF; motion.velocity.z = -Math.abs(motion.velocity.z) * 0.45 }
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
    const viable = viableIds.includes(die.id)
    const dieColor = selected ? '#f0c879' : viable ? '#b9d9bd' : '#d8cfc0'
    const emissive = selected ? '#79521e' : viable ? '#315d3c' : '#000000'
    return (
      <group
        key={die.id}
        ref={node => { refs.current[die.id] = node }}
        onPointerDown={event => {
          event.stopPropagation()
          drag.current = { id: die.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false }
          ;(event.target as unknown as { setPointerCapture?: (pointerId: number) => void }).setPointerCapture?.(event.pointerId)
        }}
        onPointerMove={event => {
          const current = drag.current
          if (!current || current.id !== die.id || current.pointerId !== event.pointerId) return
          if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) >= DRAG_THRESHOLD) current.moved = true
        }}
        onPointerUp={event => {
          event.stopPropagation()
          const current = drag.current
          if (!current || current.id !== die.id || current.pointerId !== event.pointerId) return
          ;(event.target as unknown as { releasePointerCapture?: (pointerId: number) => void }).releasePointerCapture?.(event.pointerId)
          drag.current = null
          if (current.moved) onDragReroll(die.id)
          else onSelect(die.id)
        }}
        onPointerCancel={() => { drag.current = null }}
      >
        <RoundedBox args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} radius={0.035} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color={dieColor} emissive={emissive} emissiveIntensity={selected ? 0.16 : viable ? 0.28 : 0} roughness={0.88} metalness={0} />
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
  return <group>
    <RoundedBox args={[6.65, 0.38, 4.25]} radius={0.26} smoothness={4} position={[0, FLOOR_Y - 0.18, 0]} receiveShadow><meshStandardMaterial color="#121820" roughness={0.94} metalness={0.03} /></RoundedBox>
    <mesh position={[0, -0.17, BACK - 0.13]} castShadow receiveShadow><boxGeometry args={[6.55, 0.86, 0.28]} /><meshStandardMaterial color="#222933" roughness={0.9} /></mesh>
    <mesh position={[0, -0.17, FRONT + 0.13]} castShadow receiveShadow><boxGeometry args={[6.55, 0.86, 0.28]} /><meshStandardMaterial color="#222933" roughness={0.9} /></mesh>
    <mesh position={[LEFT - 0.13, -0.17, 0]} castShadow receiveShadow><boxGeometry args={[0.28, 0.86, 3.95]} /><meshStandardMaterial color="#222933" roughness={0.9} /></mesh>
    <mesh position={[RIGHT + 0.13, -0.17, 0]} castShadow receiveShadow><boxGeometry args={[0.28, 0.86, 3.95]} /><meshStandardMaterial color="#222933" roughness={0.9} /></mesh>
  </group>
}

function DiceTray(props: {
  dice: DieState[]
  selectedIds: number[]
  viableIds: number[]
  onSelect: (id: number) => void
  onLanded: (id: number, letter: string) => void
  onDragReroll: (id: number) => void
}) {
  return <Canvas shadows camera={{ position: [0, 9.4, 1.15], fov: 34, near: 0.1, far: 100 }} onCreated={({ camera }) => camera.lookAt(0, -0.35, 0)}>
    <color attach="background" args={['#11161d']} />
    <ambientLight intensity={1.15} />
    <directionalLight position={[4, 8, 4]} intensity={3.1} castShadow shadow-mapSize={[1024, 1024]} />
    <pointLight position={[-3.5, 1.6, -1.5]} color="#846ff0" intensity={6.5} distance={8} />
    <TrayGeometry />
    <LooseDice {...props} />
    <Environment preset="warehouse" />
  </Canvas>
}

function createDice(rollSeed: number): DieState[] {
  return ACTIVE_PACK.diceFaces.map((faces, id) => ({ id, faces, letter: faces[0], consumed: false, rollKey: rollSeed + id }))
}

function canFinishWord(word: string, prefix: string, availableLetters: string[]): boolean {
  if (!word.startsWith(prefix)) return false
  const needed = [...word.slice(prefix.length)]
  const available = [...availableLetters]
  for (const letter of needed) {
    const index = available.indexOf(letter)
    if (index === -1) return false
    available.splice(index, 1)
  }
  return true
}

export default function App() {
  const [dice, setDice] = useState<DieState[]>(() => createDice(1))
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [rerolls, setRerolls] = useState(3)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [repository, setRepository] = useState<Record<string, number>>({})
  const [discoveries, setDiscoveries] = useState<Record<string, WordEntry>>({})
  const [cards, setCards] = useState<CardState[]>([])
  const [repoOpen, setRepoOpen] = useState(true)
  const [deckOpen, setDeckOpen] = useState(true)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [reveal, setReveal] = useState<WordEntry | null>(null)
  const [message, setMessage] = useState(`Explore the hidden ${ACTIVE_PACK.name} pack. Click a die to begin a path.`)

  const currentWord = useMemo(() => selectedIds.map(id => dice.find(die => die.id === id)?.letter ?? '').join(''), [selectedIds, dice])
  const entry = ALL_WORDS[currentWord]
  const valid = Boolean(entry)
  const activeDice = dice.filter(die => !die.consumed)

  const availablePackEntries = useMemo(() => {
    const undiscovered = ACTIVE_PACK.entries.filter(word => !discoveries[word.spelling])
    return undiscovered.length > 0 ? undiscovered : ACTIVE_PACK.entries
  }, [discoveries])

  const viableIds = useMemo(() => {
    if (selectedIds.length === 0) return []
    const selected = new Set(selectedIds)
    return dice
      .filter(die => !die.consumed && !selected.has(die.id))
      .filter(candidate => {
        const nextPrefix = currentWord + candidate.letter
        const remainingLetters = dice
          .filter(die => !die.consumed && !selected.has(die.id) && die.id !== candidate.id)
          .map(die => die.letter)
        return availablePackEntries.some(word => canFinishWord(word.spelling, nextPrefix, remainingLetters))
      })
      .map(die => die.id)
  }, [availablePackEntries, currentWord, dice, selectedIds])

  const pathMessage = selectedIds.length === 0
    ? `${Object.keys(discoveries).length}/${ACTIVE_PACK.entries.length} pack words discovered · click to explore · drag to reroll`
    : viableIds.length > 0
      ? `${viableIds.length} possible continuation${viableIds.length === 1 ? '' : 's'}`
      : valid
        ? 'A word is complete. Discover it or continue freely.'
        : 'This path does not reach an available hidden pack word.'

  const selectDie = (id: number) => setSelectedIds(ids => ids.includes(id) ? ids.filter(existing => existing !== id) : [...ids, id])
  const landed = (id: number, letter: string) => setDice(items => items.map(die => die.id === id && die.letter !== letter ? { ...die, letter } : die))

  const rerollDie = (id: number) => {
    if (rerolls <= 0) { setMessage('No rerolls remain this round.'); return }
    setDice(items => items.map(die => die.id === id ? { ...die, rollKey: die.rollKey + 1000 + Date.now() } : die))
    setSelectedIds(ids => ids.filter(selectedId => selectedId !== id))
    setRerolls(value => value - 1)
    setMessage('Die thrown again. Its upward face will determine the new letter.')
  }

  const rerollSelected = () => {
    if (rerolls <= 0) { setMessage('No rerolls remain this round.'); return }
    if (selectedIds.length === 0) { setMessage('Select one or more dice first.'); return }
    const ids = new Set(selectedIds)
    setDice(items => items.map(die => ids.has(die.id) ? { ...die, rollKey: die.rollKey + 1000 + Date.now() } : die))
    setRerolls(value => value - 1)
    setSelectedIds([])
    setMessage(`${ids.size} ${ids.size === 1 ? 'die was' : 'dice were'} thrown again.`)
  }

  const shakeRemaining = () => {
    if (activeDice.length === 0) return
    setDice(items => items.map(die => die.consumed ? die : { ...die, rollKey: die.rollKey + 1000 + Date.now() }))
    setSelectedIds([])
    setMessage('All remaining dice were thrown again.')
  }

  const submit = () => {
    if (!entry) { setMessage(currentWord ? 'That spelling is not in this prototype dictionary.' : 'Select dice first.'); return }
    setDice(items => items.map(die => selectedIds.includes(die.id) ? { ...die, consumed: true } : die))
    setRepository(repo => ({ ...repo, [currentWord]: (repo[currentWord] ?? 0) + 1 }))
    setDiscoveries(found => ({ ...found, [currentWord]: entry }))
    setCards(deck => [...deck, { ...entry, cardId: Date.now() }])
    setScore(value => value + currentWord.length * 10)
    setReveal(entry)
    setMessage(entry.packId === ACTIVE_PACK.id ? `${currentWord} discovered in ${ACTIVE_PACK.name}.` : `${currentWord} found beyond the pack.`)
    setSelectedIds([])
  }

  const matchStack = (spelling: string) => {
    const card = cards.find(item => item.cardId === selectedCard)
    if (!card) { setMessage('Select a meaning card first.'); return }
    if (card.spelling !== spelling) { setMessage('Incorrect match.'); return }
    setCards(deck => deck.filter(item => item.cardId !== card.cardId))
    setRepository(repo => { const next = { ...repo, [spelling]: repo[spelling] - 1 }; if (next[spelling] <= 0) delete next[spelling]; return next })
    setScore(value => value + 50)
    setSelectedCard(null)
    setMessage(`${card.pointed} — ${card.meaning}. +50`)
  }

  const nextRound = () => {
    setRound(value => value + 1)
    setRerolls(3)
    setSelectedIds([])
    setDice(createDice(Date.now()))
    setMessage(`A fresh roll from the hidden ${ACTIVE_PACK.name} pack.`)
  }

  return <main className="game-shell">
    <header className="topbar">
      <div className="stat"><span>ROUND</span><strong>{round}</strong></div>
      <div className="stat"><span>SCORE</span><strong>{score.toLocaleString()}</strong></div>
      <div className="word-display"><span>{ACTIVE_PACK.name.toUpperCase()}</span><strong dir="rtl">{currentWord || '—'}</strong><small>{valid ? 'DISCOVERABLE WORD' : pathMessage.toUpperCase()}</small></div>
      <div className="stat reroll-stat"><span>REROLLS</span><strong>{rerolls}</strong></div>
    </header>

    <section className={`repository panel ${repoOpen ? 'open' : 'closed'}`}>
      <button className="panel-tab" onClick={() => setRepoOpen(open => !open)} aria-label="Toggle discovered words">{repoOpen ? '‹' : '›'}</button>
      <div className="panel-content"><h2>AROUND THE HOUSE</h2><p>{Object.keys(discoveries).length} of {ACTIVE_PACK.entries.length} hidden words discovered</p><div className="stack-list">
        {Object.entries(repository).length === 0 && <div className="empty">The pack contains hidden household words. Follow a glowing path to discover the first one.</div>}
        {Object.entries(repository).map(([word, count]) => { const discovery = discoveries[word]; return <details key={word} className="word-discovery"><summary><b dir="rtl">{word}</b><span>×{count}</span></summary>{discovery && <button className="discovery-detail" onClick={() => matchStack(word)}><span className="discovery-icon">{discovery.image}</span><span><strong dir="rtl">{discovery.pointed}</strong><small>{discovery.meaning} · {discovery.transliteration}</small></span></button>}</details> })}
      </div></div>
    </section>

    <section className="tray-wrap">
      <div className="path-guide" aria-live="polite">{pathMessage}</div>
      <DiceTray dice={dice} selectedIds={selectedIds} viableIds={viableIds} onSelect={selectDie} onLanded={landed} onDragReroll={rerollDie} />
      <div className="tray-actions"><button className="secondary" onClick={shakeRemaining}>SHAKE</button><button className="secondary" onClick={rerollSelected}>REROLL SELECTED</button><button className="secondary" onClick={nextRound}>NEXT ROUND</button><button className="primary" disabled={!valid} onClick={submit}>DISCOVER</button></div>
    </section>

    <section className={`deck-drawer ${deckOpen ? 'open' : 'closed'}`}>
      <button className="drawer-tab" onClick={() => setDeckOpen(open => !open)} aria-expanded={deckOpen} aria-label={deckOpen ? 'Collapse decipher deck' : 'Open decipher deck'}>{deckOpen ? '›' : '‹'} DECIPHER · {cards.length}</button>
      <div className="cards-row" aria-hidden={!deckOpen}>{cards.length === 0 && <div className="empty deck-empty">Discovered words create recall cards here.</div>}{cards.map(card => <button key={card.cardId} className={`meaning-card ${selectedCard === card.cardId ? 'selected' : ''}`} onClick={() => setSelectedCard(card.cardId)}><span className="card-image">{card.image}</span><b>{card.meaning}</b><small>Match to its Hebrew spelling</small></button>)}</div>
    </section>

    {reveal && <div className="discovery-overlay" role="dialog" aria-modal="true" aria-labelledby="discovery-title"><div className="discovery-card"><span className="reveal-kicker">{reveal.packId === ACTIVE_PACK.id ? 'PACK WORD DISCOVERED' : 'BONUS DISCOVERY'}</span><span className="reveal-image" aria-hidden="true">{reveal.image}</span><h1 id="discovery-title" dir="rtl">{reveal.pointed}</h1><strong>{reveal.meaning}</strong><small>{reveal.transliteration}</small><p>{reveal.packId === ACTIVE_PACK.id ? `${Object.keys(discoveries).length} of ${ACTIVE_PACK.entries.length} words found in ${ACTIVE_PACK.name}.` : 'Found beyond the themed pack.'}</p><button onClick={() => setReveal(null)}>CONTINUE</button></div></div>}

    <footer className="status-line">{message}</footer>
  </main>
}
