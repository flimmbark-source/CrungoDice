import { Canvas, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Environment, RoundedBox, Text } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { Euler, Quaternion, Vector3 } from 'three'

type Language = 'en' | 'he'
type LocalizedText = Record<Language, string>
type WordForm = { spelling: string; display: string; pronunciation: string }
type PackEntry = { id: string; image: string; forms: Record<Language, WordForm>; meanings: LocalizedText }
type DieFaces = [string, string, string, string, string, string]
type WordPack = {
  id: string
  title: LocalizedText
  description: LocalizedText
  entries: PackEntry[]
  diceFaces: Record<Language, DieFaces[]>
}

const PACK: WordPack = {
  id: 'around-the-house',
  title: { en: 'Around the House', he: 'מסביב לבית' },
  description: {
    en: 'A hidden collection of things and places found around a home.',
    he: 'אוסף נסתר של דברים ומקומות שנמצאים בבית.',
  },
  entries: [
    { id: 'house', image: '🏠', meanings: { en: 'House', he: 'בית' }, forms: { he: { spelling: 'בית', display: 'בַּיִת', pronunciation: 'bayit' }, en: { spelling: 'HOUSE', display: 'house', pronunciation: 'house' } } },
    { id: 'book', image: '📕', meanings: { en: 'Book', he: 'ספר' }, forms: { he: { spelling: 'ספר', display: 'סֵפֶר', pronunciation: 'sefer' }, en: { spelling: 'BOOK', display: 'book', pronunciation: 'book' } } },
    { id: 'table', image: '🪵', meanings: { en: 'Table', he: 'שולחן' }, forms: { he: { spelling: 'שולחן', display: 'שֻׁלְחָן', pronunciation: 'shulchan' }, en: { spelling: 'TABLE', display: 'table', pronunciation: 'table' } } },
    { id: 'chair', image: '🪑', meanings: { en: 'Chair', he: 'כיסא' }, forms: { he: { spelling: 'כיסא', display: 'כִּסֵּא', pronunciation: 'kise' }, en: { spelling: 'CHAIR', display: 'chair', pronunciation: 'chair' } } },
    { id: 'door', image: '🚪', meanings: { en: 'Door', he: 'דלת' }, forms: { he: { spelling: 'דלת', display: 'דֶּלֶת', pronunciation: 'delet' }, en: { spelling: 'DOOR', display: 'door', pronunciation: 'door' } } },
    { id: 'window', image: '🪟', meanings: { en: 'Window', he: 'חלון' }, forms: { he: { spelling: 'חלון', display: 'חַלּוֹן', pronunciation: 'chalon' }, en: { spelling: 'WINDOW', display: 'window', pronunciation: 'window' } } },
    { id: 'light', image: '💡', meanings: { en: 'Light', he: 'אור' }, forms: { he: { spelling: 'אור', display: 'אוֹר', pronunciation: 'or' }, en: { spelling: 'LIGHT', display: 'light', pronunciation: 'light' } } },
    { id: 'water', image: '💧', meanings: { en: 'Water', he: 'מים' }, forms: { he: { spelling: 'מים', display: 'מַיִם', pronunciation: 'mayim' }, en: { spelling: 'WATER', display: 'water', pronunciation: 'water' } } },
    { id: 'bed', image: '🛏️', meanings: { en: 'Bed', he: 'מיטה' }, forms: { he: { spelling: 'מיטה', display: 'מִטָּה', pronunciation: 'mita' }, en: { spelling: 'BED', display: 'bed', pronunciation: 'bed' } } },
    { id: 'cup', image: '🥛', meanings: { en: 'Cup', he: 'כוס' }, forms: { he: { spelling: 'כוס', display: 'כּוֹס', pronunciation: 'kos' }, en: { spelling: 'CUP', display: 'cup', pronunciation: 'cup' } } },
  ],
  diceFaces: {
    he: [
      ['ב', 'ס', 'ש', 'כ', 'ד', 'ח'], ['י', 'פ', 'ו', 'ל', 'ל', 'ו'], ['ת', 'ר', 'ל', 'ס', 'ת', 'ר'], ['א', 'ח', 'ו', 'י', 'מ', 'כ'],
      ['מ', 'ן', 'א', 'ט', 'ו', 'ד'], ['י', 'ו', 'ה', 'ן', 'ס', 'ל'], ['ם', 'ת', 'ר', 'א', 'ח', 'פ'], ['ה', 'ן', 'ס', 'ב', 'מ', 'י'],
    ],
    en: [
      ['H', 'B', 'T', 'C', 'D', 'W'], ['O', 'O', 'A', 'H', 'I', 'U'], ['U', 'O', 'B', 'A', 'N', 'P'], ['S', 'K', 'L', 'I', 'D', 'R'],
      ['E', 'T', 'E', 'R', 'O', 'G'], ['W', 'A', 'C', 'L', 'B', 'T'], ['I', 'R', 'H', 'D', 'E', 'O'], ['N', 'E', 'P', 'T', 'F', 'K'],
    ],
  },
}

const UI: Record<Language, Record<string, string>> = {
  en: {
    diceLanguage: 'Dice Language', gameLanguage: 'Game Language', round: 'ROUND', score: 'SCORE', rerolls: 'REROLLS',
    discoverable: 'DISCOVERABLE WORD', discoveredWords: 'DISCOVERED WORDS', hiddenWords: 'hidden words discovered',
    emptyRepo: 'The pack contains hidden household words. Follow a glowing path to discover the first one.',
    shake: 'SHAKE', rerollSelected: 'REROLL SELECTED', nextRound: 'NEXT ROUND', discover: 'DISCOVER', decipher: 'DECIPHER',
    emptyDeck: 'Discovered words create recall cards here.', match: 'Match to its spelling', continue: 'CONTINUE',
    packFound: 'PACK WORD DISCOVERED', clickExplore: 'click to explore', holdMove: 'hold and move to place', flickReroll: 'flick to reroll',
    possible: 'possible continuation', complete: 'A word is complete. Discover it or continue freely.',
    deadEnd: 'This path does not reach an available hidden pack word.', noRerolls: 'No rerolls remain this round.',
    selectFirst: 'Select one or more dice first.', thrown: 'Die thrown again.', moved: 'Die moved without changing its face.',
    fresh: 'A fresh curated roll from the hidden pack.',
  },
  he: {
    diceLanguage: 'שפת הקוביות', gameLanguage: 'שפת המשחק', round: 'סיבוב', score: 'ניקוד', rerolls: 'הטלות חוזרות',
    discoverable: 'מילה ניתנת לגילוי', discoveredWords: 'מילים שהתגלו', hiddenWords: 'מילים נסתרות התגלו',
    emptyRepo: 'החבילה מכילה מילים נסתרות מהבית. עקבו אחרי מסלול זוהר כדי לגלות את הראשונה.',
    shake: 'נער', rerollSelected: 'הטל נבחרות', nextRound: 'סיבוב הבא', discover: 'גלה', decipher: 'פענוח',
    emptyDeck: 'מילים שהתגלו יוצרות כאן קלפי זיכרון.', match: 'התאם לאיות שלה', continue: 'המשך',
    packFound: 'מילה מהחבילה התגלתה', clickExplore: 'לחצו כדי לחקור', holdMove: 'החזיקו והזיזו כדי למקם',
    flickReroll: 'העיפו כדי להטיל שוב', possible: 'המשך אפשרי',
    complete: 'המילה הושלמה. אפשר לגלות אותה או להמשיך לחקור.', deadEnd: 'המסלול הזה לא מוביל למילה נסתרת זמינה.',
    noRerolls: 'לא נשארו הטלות חוזרות בסיבוב הזה.', selectFirst: 'בחרו קובייה אחת או יותר.',
    thrown: 'הקובייה הוטלה שוב.', moved: 'הקובייה הוזזה בלי לשנות את הפאה.', fresh: 'הטלה מתוכננת חדשה מהחבילה הנסתרת.',
  },
}

type DieState = {
  id: number
  faces: DieFaces
  letter: string
  consumed: boolean
  rollKey: number
  targetFace: number
}

type CardState = { cardId: number; conceptId: string; diceLanguage: Language }

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
  held: boolean
}

type DragState = {
  id: number
  pointerId: number
  startX: number
  startY: number
  lastX: number
  lastY: number
  lastTime: number
  velocityX: number
  velocityY: number
  totalDistance: number
  startedAt: number
} | null

const DIE_SIZE = 0.48
const HALF = DIE_SIZE / 2
const FLOOR_Y = -0.58
const LEFT = -3.02
const RIGHT = 3.02
const BACK = -1.83
const FRONT = 1.83
const PICKUP_DELAY = 120
const CLICK_DISTANCE = 7
const THROW_SPEED = 0.7
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function landingQuaternion(face: number): Quaternion {
  const rotations = [
    new Euler(0, 0, 0), new Euler(Math.PI, 0, 0), new Euler(-Math.PI / 2, 0, 0),
    new Euler(Math.PI / 2, 0, 0), new Euler(0, 0, Math.PI / 2), new Euler(0, 0, -Math.PI / 2),
  ]
  const uprightYaw = [0, 0, 0, Math.PI, -Math.PI / 2, Math.PI / 2][face]
  return new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), uprightYaw).multiply(new Quaternion().setFromEuler(rotations[face]))
}

function freshMotion(die: DieState): Motion {
  return {
    position: new Vector3(randomBetween(-2.25, 2.25), randomBetween(1.8, 3.8), randomBetween(-1.2, 1.2)),
    velocity: new Vector3(randomBetween(-2.4, 2.4), randomBetween(0.2, 2.6), randomBetween(-2.2, 2.2)),
    quaternion: new Quaternion().setFromEuler(new Euler(randomBetween(0, Math.PI * 2), randomBetween(0, Math.PI * 2), randomBetween(0, Math.PI * 2))),
    angularVelocity: new Vector3(randomBetween(-11, 11), randomBetween(-11, 11), randomBetween(-11, 11)),
    targetQuaternion: landingQuaternion(die.targetFace),
    targetFace: die.targetFace,
    lastRollKey: die.rollKey,
    groundedTime: 0,
    settling: false,
    landedReported: false,
    held: false,
  }
}

function canBuildWord(word: string, letters: string[]): boolean {
  const available = [...letters]
  for (const letter of [...word]) {
    const index = available.indexOf(letter)
    if (index < 0) return false
    available.splice(index, 1)
  }
  return true
}

function canFinishWord(word: string, prefix: string, letters: string[]): boolean {
  if (!word.startsWith(prefix)) return false
  return canBuildWord(word.slice(prefix.length), letters)
}

function evaluateVisibleLetters(language: Language, letters: string[]): number {
  const spellings = PACK.entries.map(entry => entry.forms[language].spelling)
  const starters = new Set(spellings.map(word => [...word][0]))
  const starterDice = letters.filter(letter => starters.has(letter)).length
  const distinctStarters = new Set(letters.filter(letter => starters.has(letter))).size
  const completable = spellings.filter(word => canBuildWord(word, letters)).length

  const branches = [...starters].reduce((count, first) => {
    const nextLetters = new Set(spellings.filter(word => word.startsWith(first)).map(word => [...word][1]).filter(Boolean))
    return count + Math.max(0, nextLetters.size - 1)
  }, 0)

  const deadDice = letters.length - starterDice
  const minimumStarterPenalty = starterDice < Math.ceil(letters.length * 2 / 3) ? 40 : 0
  const noWordPenalty = completable < 2 ? 50 : 0

  return starterDice * 8 + distinctStarters * 7 + completable * 14 + branches * 2 - deadDice * 4 - minimumStarterPenalty - noWordPenalty
}

function chooseCuratedFaces(language: Language): number[] {
  const faces = PACK.diceFaces[language]
  const candidates = Array.from({ length: 500 }, () => {
    const indices = faces.map(() => Math.floor(Math.random() * 6))
    const letters = indices.map((face, die) => faces[die][face])
    return { indices, score: evaluateVisibleLetters(language, letters) }
  }).sort((a, b) => b.score - a.score)

  const pool = candidates.slice(0, Math.max(8, Math.floor(candidates.length * 0.04)))
  return pool[Math.floor(Math.random() * pool.length)].indices
}

function chooseCuratedRerollFace(language: Language, dice: DieState[], dieId: number): number {
  const die = dice.find(item => item.id === dieId)
  if (!die) return 0

  const candidates = die.faces.map((letter, face) => {
    const letters = dice.filter(item => !item.consumed).map(item => item.id === dieId ? letter : item.letter)
    const novelty = letter === die.letter ? -8 : 0
    return { face, score: evaluateVisibleLetters(language, letters) + novelty + Math.random() * 4 }
  }).sort((a, b) => b.score - a.score)

  return candidates[Math.floor(Math.random() * Math.min(3, candidates.length))].face
}

function createDice(language: Language, seed: number): DieState[] {
  const targetFaces = chooseCuratedFaces(language)
  return PACK.diceFaces[language].map((faces, id) => ({
    id,
    faces,
    letter: faces[targetFaces[id]],
    consumed: false,
    rollKey: seed + id,
    targetFace: targetFaces[id],
  }))
}

function LooseDice({
  dice,
  selectedIds,
  viableIds,
  onSelect,
  onLanded,
  onThrow,
  onPlaced,
}: {
  dice: DieState[]
  selectedIds: number[]
  viableIds: number[]
  onSelect: (id: number) => void
  onLanded: (id: number, letter: string) => void
  onThrow: (id: number) => boolean
  onPlaced: () => void
}) {
  const refs = useRef<Record<number, Group | null>>({})
  const motions = useRef<Record<number, Motion>>({})
  const drag = useRef<DragState>(null)

  useEffect(() => {
    for (const die of dice) motions.current[die.id] ??= freshMotion(die)
  }, [dice])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30)
    const active = dice.filter(die => !die.consumed)

    for (const die of active) {
      let motion = motions.current[die.id] ?? freshMotion(die)
      motions.current[die.id] = motion

      if (motion.lastRollKey !== die.rollKey) {
        motion = freshMotion(die)
        motions.current[die.id] = motion
      }

      if (motion.held) {
        motion.position.y = FLOOR_Y + HALF + 0.32
      } else if (!motion.settling) {
        motion.velocity.y -= 15.5 * delta
        motion.position.addScaledVector(motion.velocity, delta)
        const speed = motion.angularVelocity.length()
        if (speed > 0.001) {
          motion.quaternion.premultiply(new Quaternion().setFromAxisAngle(motion.angularVelocity.clone().normalize(), speed * delta)).normalize()
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
        } else {
          motion.groundedTime = 0
        }

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
        if (!a || !b || a.held || b.held || a.settling || b.settling) continue
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
      if (group && motion) {
        group.position.copy(motion.position)
        group.quaternion.copy(motion.quaternion)
      }
    }
  })

  const transforms: Array<{ position: [number, number, number]; rotation: [number, number, number] }> = [
    { position: [0, HALF + 0.008, 0], rotation: [-Math.PI / 2, 0, 0] },
    { position: [0, -HALF - 0.008, 0], rotation: [Math.PI / 2, 0, Math.PI] },
    { position: [0, 0, HALF + 0.008], rotation: [0, 0, 0] },
    { position: [0, 0, -HALF - 0.008], rotation: [0, Math.PI, 0] },
    { position: [HALF + 0.008, 0, 0], rotation: [0, Math.PI / 2, 0] },
    { position: [-HALF - 0.008, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  ]

  const beginDrag = (event: ThreeEvent<PointerEvent>, die: DieState) => {
    event.stopPropagation()
    const now = performance.now()
    drag.current = {
      id: die.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: now,
      velocityX: 0,
      velocityY: 0,
      totalDistance: 0,
      startedAt: now,
    }
    const motion = motions.current[die.id]
    if (motion) {
      motion.held = true
      motion.settling = true
      motion.velocity.set(0, 0, 0)
      motion.angularVelocity.set(0, 0, 0)
    }
    ;(event.target as unknown as { setPointerCapture?: (pointerId: number) => void }).setPointerCapture?.(event.pointerId)
  }

  const moveDrag = (event: ThreeEvent<PointerEvent>, die: DieState) => {
    const current = drag.current
    if (!current || current.id !== die.id || current.pointerId !== event.pointerId) return
    event.stopPropagation()

    const now = performance.now()
    const dt = Math.max(1, now - current.lastTime)
    const dx = event.clientX - current.lastX
    const dy = event.clientY - current.lastY
    current.velocityX = dx / dt
    current.velocityY = dy / dt
    current.totalDistance += Math.hypot(dx, dy)
    current.lastX = event.clientX
    current.lastY = event.clientY
    current.lastTime = now

    const motion = motions.current[die.id]
    if (!motion) return
    const canvas = event.nativeEvent.target instanceof Element ? event.nativeEvent.target.closest('canvas') : null
    const width = canvas?.clientWidth ?? 800
    const height = canvas?.clientHeight ?? 500
    motion.position.x = clamp(motion.position.x + dx / width * (RIGHT - LEFT) * 1.15, LEFT + HALF, RIGHT - HALF)
    motion.position.z = clamp(motion.position.z + dy / height * (FRONT - BACK) * 1.15, BACK + HALF, FRONT - HALF)
  }

  const endDrag = (event: ThreeEvent<PointerEvent>, die: DieState) => {
    event.stopPropagation()
    const current = drag.current
    if (!current || current.id !== die.id || current.pointerId !== event.pointerId) return

    ;(event.target as unknown as { releasePointerCapture?: (pointerId: number) => void }).releasePointerCapture?.(event.pointerId)
    drag.current = null

    const motion = motions.current[die.id]
    const heldFor = performance.now() - current.startedAt
    const releaseSpeed = Math.hypot(current.velocityX, current.velocityY)
    const isClick = current.totalDistance < CLICK_DISTANCE && heldFor < PICKUP_DELAY
    const isThrow = releaseSpeed >= THROW_SPEED && current.totalDistance >= CLICK_DISTANCE

    if (isClick) {
      if (motion) {
        motion.held = false
        motion.position.y = FLOOR_Y + HALF
      }
      onSelect(die.id)
      return
    }

    if (isThrow && onThrow(die.id)) return

    if (motion) {
      motion.held = false
      motion.position.y = FLOOR_Y + HALF
      motion.settling = true
      motion.velocity.set(0, 0, 0)
      motion.angularVelocity.set(0, 0, 0)
    }
    onPlaced()
  }

  return <>{dice.map(die => {
    if (die.consumed) return null
    const selected = selectedIds.includes(die.id)
    const viable = viableIds.includes(die.id)

    return (
      <group
        key={die.id}
        ref={node => { refs.current[die.id] = node }}
        onPointerDown={event => beginDrag(event, die)}
        onPointerMove={event => moveDrag(event, die)}
        onPointerUp={event => endDrag(event, die)}
        onPointerCancel={() => {
          const motion = motions.current[die.id]
          if (motion) {
            motion.held = false
            motion.position.y = FLOOR_Y + HALF
          }
          drag.current = null
        }}
      >
        <RoundedBox args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} radius={0.035} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial
            color={selected ? '#f0c879' : viable ? '#b9d9bd' : '#d8cfc0'}
            emissive={selected ? '#79521e' : viable ? '#315d3c' : '#000000'}
            emissiveIntensity={selected ? 0.16 : viable ? 0.28 : 0}
            roughness={0.88}
            metalness={0}
          />
        </RoundedBox>
        {transforms.map((transform, face) => (
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
        <meshStandardMaterial color="#121820" roughness={0.94} />
      </RoundedBox>
      <mesh position={[0, -0.17, BACK - 0.13]}><boxGeometry args={[6.55, 0.86, 0.28]} /><meshStandardMaterial color="#222933" /></mesh>
      <mesh position={[0, -0.17, FRONT + 0.13]}><boxGeometry args={[6.55, 0.86, 0.28]} /><meshStandardMaterial color="#222933" /></mesh>
      <mesh position={[LEFT - 0.13, -0.17, 0]}><boxGeometry args={[0.28, 0.86, 3.95]} /><meshStandardMaterial color="#222933" /></mesh>
      <mesh position={[RIGHT + 0.13, -0.17, 0]}><boxGeometry args={[0.28, 0.86, 3.95]} /><meshStandardMaterial color="#222933" /></mesh>
    </group>
  )
}

function DiceTray(props: Parameters<typeof LooseDice>[0]) {
  return (
    <Canvas shadows camera={{ position: [0, 9.4, 1.15], fov: 34 }} onCreated={({ camera }) => camera.lookAt(0, -0.35, 0)}>
      <color attach="background" args={['#11161d']} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 8, 4]} intensity={3.1} castShadow />
      <pointLight position={[-3.5, 1.6, -1.5]} color="#846ff0" intensity={6.5} distance={8} />
      <TrayGeometry />
      <LooseDice {...props} />
      <Environment preset="warehouse" />
    </Canvas>
  )
}

export default function App() {
  const [diceLanguage, setDiceLanguage] = useState<Language>('he')
  const [gameLanguage, setGameLanguage] = useState<Language>('en')
  const [dice, setDice] = useState<DieState[]>(() => createDice('he', 1))
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [rerolls, setRerolls] = useState(3)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [discoveries, setDiscoveries] = useState<Record<Language, Record<string, number>>>({ en: {}, he: {} })
  const [cards, setCards] = useState<CardState[]>([])
  const [repoOpen, setRepoOpen] = useState(true)
  const [deckOpen, setDeckOpen] = useState(true)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [revealId, setRevealId] = useState<string | null>(null)
  const [message, setMessage] = useState('Explore the hidden pack. Click a die to begin a path.')

  const t = UI[gameLanguage]
  const direction = diceLanguage === 'he' ? 'rtl' : 'ltr'
  const currentDiscoveries = discoveries[diceLanguage]
  const activeForms = useMemo(() => PACK.entries.map(entry => ({ entry, form: entry.forms[diceLanguage] })), [diceLanguage])
  const lookup = useMemo(() => Object.fromEntries(activeForms.map(item => [item.form.spelling, item.entry])), [activeForms])
  const currentWord = useMemo(() => selectedIds.map(id => dice.find(die => die.id === id)?.letter ?? '').join(''), [selectedIds, dice])
  const entry = lookup[currentWord]
  const valid = Boolean(entry)
  const availableEntries = useMemo(() => {
    const hidden = activeForms.filter(({ entry: word }) => !currentDiscoveries[word.id])
    return hidden.length ? hidden : activeForms
  }, [activeForms, currentDiscoveries])

  const viableIds = useMemo(() => {
    if (!selectedIds.length) return []
    const selected = new Set(selectedIds)
    return dice
      .filter(die => !die.consumed && !selected.has(die.id))
      .filter(candidate => {
        const prefix = currentWord + candidate.letter
        const remaining = dice
          .filter(die => !die.consumed && !selected.has(die.id) && die.id !== candidate.id)
          .map(die => die.letter)
        return availableEntries.some(({ form }) => canFinishWord(form.spelling, prefix, remaining))
      })
      .map(die => die.id)
  }, [availableEntries, currentWord, dice, selectedIds])

  const pathMessage = !selectedIds.length
    ? `${Object.keys(currentDiscoveries).length}/${PACK.entries.length} ${t.hiddenWords} · ${t.clickExplore} · ${t.holdMove} · ${t.flickReroll}`
    : viableIds.length
      ? `${viableIds.length} ${t.possible}${viableIds.length === 1 ? '' : 's'}`
      : valid
        ? t.complete
        : t.deadEnd

  const switchDiceLanguage = (language: Language) => {
    if (language === diceLanguage) return
    setDiceLanguage(language)
    setDice(createDice(language, Date.now()))
    setSelectedIds([])
    setRerolls(3)
    setRound(value => value + 1)
    setSelectedCard(null)
    setMessage(UI[gameLanguage].fresh)
  }

  const selectDie = (id: number) => setSelectedIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id])
  const landed = (id: number, letter: string) => setDice(items => items.map(die => die.id === id ? { ...die, letter } : die))

  const throwDie = (id: number): boolean => {
    if (!rerolls) {
      setMessage(t.noRerolls)
      return false
    }

    const targetFace = chooseCuratedRerollFace(diceLanguage, dice, id)
    setDice(items => items.map(die => die.id === id
      ? { ...die, targetFace, letter: die.faces[targetFace], rollKey: die.rollKey + Date.now() }
      : die
    ))
    setSelectedIds(ids => ids.filter(item => item !== id))
    setRerolls(value => value - 1)
    setMessage(t.thrown)
    return true
  }

  const rerollSelected = () => {
    if (!rerolls) { setMessage(t.noRerolls); return }
    if (!selectedIds.length) { setMessage(t.selectFirst); return }
    const ids = new Set(selectedIds)
    setDice(items => items.map(die => {
      if (!ids.has(die.id)) return die
      const targetFace = chooseCuratedRerollFace(diceLanguage, items, die.id)
      return { ...die, targetFace, letter: die.faces[targetFace], rollKey: die.rollKey + Date.now() }
    }))
    setSelectedIds([])
    setRerolls(value => value - 1)
  }

  const shakeRemaining = () => {
    const fresh = createDice(diceLanguage, Date.now())
    setDice(items => items.map(die => die.consumed ? die : fresh[die.id]))
    setSelectedIds([])
  }

  const nextRound = () => {
    setRound(value => value + 1)
    setRerolls(3)
    setSelectedIds([])
    setDice(createDice(diceLanguage, Date.now()))
    setMessage(t.fresh)
  }

  const submit = () => {
    if (!entry) return
    setDice(items => items.map(die => selectedIds.includes(die.id) ? { ...die, consumed: true } : die))
    setDiscoveries(all => ({
      ...all,
      [diceLanguage]: {
        ...all[diceLanguage],
        [entry.id]: (all[diceLanguage][entry.id] ?? 0) + 1,
      },
    }))
    setCards(deck => [...deck, { cardId: Date.now(), conceptId: entry.id, diceLanguage }])
    setScore(value => value + currentWord.length * 10)
    setRevealId(entry.id)
    setSelectedIds([])
  }

  const matchConcept = (conceptId: string) => {
    const card = cards.find(item => item.cardId === selectedCard)
    if (!card || card.conceptId !== conceptId || card.diceLanguage !== diceLanguage) return
    setCards(deck => deck.filter(item => item.cardId !== card.cardId))
    setSelectedCard(null)
    setScore(value => value + 50)
  }

  const reveal = PACK.entries.find(item => item.id === revealId)

  return (
    <main className="game-shell" dir={gameLanguage === 'he' ? 'rtl' : 'ltr'}>
      <div className="language-controls" aria-label="Language settings">
        <label>
          <span>🎲 {t.diceLanguage}</span>
          <select value={diceLanguage} onChange={event => switchDiceLanguage(event.target.value as Language)}>
            <option value="he">א עברית</option>
            <option value="en">A English</option>
          </select>
        </label>
        <label>
          <span>🌐 {t.gameLanguage}</span>
          <select value={gameLanguage} onChange={event => setGameLanguage(event.target.value as Language)}>
            <option value="en">EN English</option>
            <option value="he">עב עברית</option>
          </select>
        </label>
      </div>

      <header className="topbar">
        <div className="stat"><span>{t.round}</span><strong>{round}</strong></div>
        <div className="stat"><span>{t.score}</span><strong>{score.toLocaleString()}</strong></div>
        <div className="word-display">
          <span>{PACK.title[gameLanguage].toUpperCase()}</span>
          <strong dir={direction}>{currentWord || '—'}</strong>
          <small>{valid ? t.discoverable : pathMessage.toUpperCase()}</small>
        </div>
        <div className="stat"><span>{t.rerolls}</span><strong>{rerolls}</strong></div>
      </header>

      <section className={`repository panel ${repoOpen ? 'open' : 'closed'}`}>
        <button className="panel-tab" onClick={() => setRepoOpen(open => !open)} aria-label="Toggle discovered words">{repoOpen ? '‹' : '›'}</button>
        <div className="panel-content">
          <h2>{t.discoveredWords}</h2>
          <p>{Object.keys(currentDiscoveries).length} / {PACK.entries.length} · {PACK.description[gameLanguage]}</p>
          <div className="stack-list">
            {!Object.keys(currentDiscoveries).length && <div className="empty">{t.emptyRepo}</div>}
            {PACK.entries.filter(item => currentDiscoveries[item.id]).map(item => {
              const form = item.forms[diceLanguage]
              return (
                <details key={item.id} className="word-discovery">
                  <summary><b dir={direction}>{form.spelling}</b><span>×{currentDiscoveries[item.id]}</span></summary>
                  <button className="discovery-detail" onClick={() => matchConcept(item.id)}>
                    <span className="discovery-icon">{item.image}</span>
                    <span>
                      <strong dir={direction}>{form.display}</strong>
                      <small>{item.meanings[gameLanguage]} · {form.pronunciation}</small>
                    </span>
                  </button>
                </details>
              )
            })}
          </div>
        </div>
      </section>

      <section className="tray-wrap">
        <div className="path-guide" aria-live="polite">{pathMessage}</div>
        <DiceTray
          dice={dice}
          selectedIds={selectedIds}
          viableIds={viableIds}
          onSelect={selectDie}
          onLanded={landed}
          onThrow={throwDie}
          onPlaced={() => setMessage(t.moved)}
        />
        <div className="tray-actions">
          <button className="secondary" onClick={shakeRemaining}>{t.shake}</button>
          <button className="secondary" onClick={rerollSelected}>{t.rerollSelected}</button>
          <button className="secondary" onClick={nextRound}>{t.nextRound}</button>
          <button className="primary" disabled={!valid} onClick={submit}>{t.discover}</button>
        </div>
      </section>

      <section className={`deck-drawer ${deckOpen ? 'open' : 'closed'}`}>
        <button className="drawer-tab" onClick={() => setDeckOpen(open => !open)} aria-expanded={deckOpen}>
          {deckOpen ? '›' : '‹'} {t.decipher} · {cards.length}
        </button>
        <div className="cards-row" aria-hidden={!deckOpen}>
          {!cards.length && <div className="empty deck-empty">{t.emptyDeck}</div>}
          {cards.map(card => {
            const concept = PACK.entries.find(item => item.id === card.conceptId)
            if (!concept) return null
            return (
              <button key={card.cardId} className={`meaning-card ${selectedCard === card.cardId ? 'selected' : ''}`} onClick={() => setSelectedCard(card.cardId)}>
                <span className="card-image">{concept.image}</span>
                <b>{concept.meanings[gameLanguage]}</b>
                <small>{t.match}</small>
              </button>
            )
          })}
        </div>
      </section>

      {reveal && (
        <div className="discovery-overlay" role="dialog" aria-modal="true">
          <div className="discovery-card">
            <span className="reveal-kicker">{t.packFound}</span>
            <span className="reveal-image">{reveal.image}</span>
            <h1 dir={direction}>{reveal.forms[diceLanguage].display}</h1>
            <strong>{reveal.meanings[gameLanguage]}</strong>
            <small>{reveal.forms[diceLanguage].pronunciation}</small>
            <p>{Object.keys(currentDiscoveries).length} / {PACK.entries.length} · {PACK.title[gameLanguage]}</p>
            <button onClick={() => setRevealId(null)}>{t.continue}</button>
          </div>
        </div>
      )}

      <footer className="status-line">{message}</footer>
    </main>
  )
}
