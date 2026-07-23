import { Canvas, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { Euler, Quaternion, Vector3 } from 'three'
import { createVocabulary, getFreeWordInfo, loadFreeWords } from './data/freeVocabulary'

type Language = 'en' | 'he'
type GameMode = 'pack' | 'free'
type LocalizedText = Record<Language, string>
type WordForm = { spelling: string; display: string; pronunciation: string }
type PackEntry = { id: string; image: string; forms: Record<Language, WordForm>; meanings: LocalizedText }
type DieFaces = [string, string, string, string, string, string]
type WordPack = { id: string; title: LocalizedText; description: LocalizedText; entries: PackEntry[]; diceFaces: Record<Language, DieFaces[]> }
type DieState = { id: number; faces: DieFaces; letter: string; consumed: boolean; rollKey: number; targetFace: number }
type CardState = { cardId: number; conceptId: string; diceLanguage: Language }
type Reward = { mode: GameMode; word: string; entry?: PackEntry }
type Motion = { position: Vector3; velocity: Vector3; quaternion: Quaternion; angularVelocity: Vector3; targetQuaternion: Quaternion; targetFace: number; lastRollKey: number; groundedTime: number; settling: boolean; landedReported: boolean; held: boolean }
type DragState = { id: number; pointerId: number; lastX: number; lastY: number; lastTime: number; velocityX: number; velocityY: number; totalDistance: number; wasSelected: boolean; pickedUp: boolean; pickupTimer: ReturnType<typeof setTimeout> | null } | null

const PACK: WordPack = {
  id: 'around-the-house',
  title: { en: 'Around the House', he: 'מסביב לבית' },
  description: { en: 'A hidden collection of things and places found around a home.', he: 'אוסף נסתר של דברים ומקומות שנמצאים בבית.' },
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
    diceLanguage: 'Dice Language', gameLanguage: 'Game Language', pack: 'PACK', free: 'FREE', round: 'ROUND', score: 'SCORE', rerolls: 'REROLLS',
    discoverable: 'VALID WORD', discoveredWords: 'DISCOVERED WORDS', freeWords: 'FOUND WORDS', hiddenWords: 'hidden words discovered',
    emptyRepo: 'The pack contains hidden household words. Follow a glowing path to discover the first one.', emptyFree: 'Build any valid word from the free-play dictionary.',
    shake: 'SHAKE', rerollSelected: 'REROLL SELECTED', nextRound: 'NEXT ROUND', discover: 'DISCOVER', submit: 'PLAY WORD', decipher: 'DECIPHER',
    emptyDeck: 'Discovered pack words create recall cards here.', match: 'Match to its spelling', continue: 'CONTINUE', packFound: 'PACK WORD DISCOVERED', freeReward: 'FREE WORD DISCOVERED',
    clickExplore: 'click to select', holdMove: 'hold to pick up', flickReroll: 'flick to reroll', possible: 'possible continuation', complete: 'A valid word is complete.',
    deadEnd: 'No valid word continues from this path.', noRerolls: 'No rerolls remain this round.', selectFirst: 'Select one or more dice first.',
    thrown: 'Die thrown again.', moved: 'Die moved without changing its face.', fresh: 'A fresh curated roll.', freeFound: 'Word accepted in Free mode.',
    loadingFree: 'Loading Free dictionary…', freeLoadFailed: 'The Free dictionary could not be loaded. Try again.',
  },
  he: {
    diceLanguage: 'שפת הקוביות', gameLanguage: 'שפת המשחק', pack: 'חבילה', free: 'חופשי', round: 'סיבוב', score: 'ניקוד', rerolls: 'הטלות חוזרות',
    discoverable: 'מילה תקינה', discoveredWords: 'מילים שהתגלו', freeWords: 'מילים שנמצאו', hiddenWords: 'מילים נסתרות התגלו',
    emptyRepo: 'החבילה מכילה מילים נסתרות מהבית. עקבו אחרי מסלול זוהר כדי לגלות את הראשונה.', emptyFree: 'צרו כל מילה תקינה ממילון המשחק החופשי.',
    shake: 'נער', rerollSelected: 'הטל נבחרות', nextRound: 'סיבוב הבא', discover: 'גלה', submit: 'שחק מילה', decipher: 'פענוח',
    emptyDeck: 'מילים מהחבילה יוצרות כאן קלפי זיכרון.', match: 'התאם לאיות שלה', continue: 'המשך', packFound: 'מילה מהחבילה התגלתה', freeReward: 'מילה חופשית התגלתה',
    clickExplore: 'לחצו לבחירה', holdMove: 'החזיקו כדי להרים', flickReroll: 'העיפו כדי להטיל שוב', possible: 'המשך אפשרי', complete: 'מילה תקינה הושלמה.',
    deadEnd: 'אין מילה תקינה שממשיכה מהמסלול הזה.', noRerolls: 'לא נשארו הטלות חוזרות בסיבוב הזה.', selectFirst: 'בחרו קובייה אחת או יותר.',
    thrown: 'הקובייה הוטלה שוב.', moved: 'הקובייה הוזזה בלי לשנות את הפאה.', fresh: 'הטלה מתוכננת חדשה.', freeFound: 'המילה התקבלה במצב חופשי.',
    loadingFree: 'טוען מילון חופשי…', freeLoadFailed: 'לא ניתן היה לטעון את המילון החופשי. נסו שוב.',
  },
}

const DIE_SIZE = 0.48
const HALF = DIE_SIZE / 2
const FLOOR_Y = -0.58
const LEFT = -3.02
const RIGHT = 3.02
const BACK = -1.83
const FRONT = 1.83
const PICKUP_DELAY = 180
const CLICK_DISTANCE = 7
const THROW_SPEED = 0.7
const MIN_DIE_SPACING = DIE_SIZE * 1.34
const FLOOR_SEPARATION_HEIGHT = FLOOR_Y + HALF + 0.12
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const clampToTray = (position: Vector3) => {
  position.x = clamp(position.x, LEFT + HALF, RIGHT - HALF)
  position.z = clamp(position.z, BACK + HALF, FRONT - HALF)
}

function landingQuaternion(face: number): Quaternion {
  const rotations = [new Euler(0, 0, 0), new Euler(Math.PI, 0, 0), new Euler(-Math.PI / 2, 0, 0), new Euler(Math.PI / 2, 0, 0), new Euler(0, 0, Math.PI / 2), new Euler(0, 0, -Math.PI / 2)]
  const uprightYaw = [0, 0, 0, Math.PI, -Math.PI / 2, Math.PI / 2][face]
  return new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), uprightYaw).multiply(new Quaternion().setFromEuler(rotations[face]))
}

function freshMotion(die: DieState): Motion {
  return { position: new Vector3(randomBetween(-2.25, 2.25), randomBetween(1.8, 3.8), randomBetween(-1.2, 1.2)), velocity: new Vector3(randomBetween(-2.4, 2.4), randomBetween(0.2, 2.6), randomBetween(-2.2, 2.2)), quaternion: new Quaternion().setFromEuler(new Euler(randomBetween(0, Math.PI * 2), randomBetween(0, Math.PI * 2), randomBetween(0, Math.PI * 2))), angularVelocity: new Vector3(randomBetween(-11, 11), randomBetween(-11, 11), randomBetween(-11, 11)), targetQuaternion: landingQuaternion(die.targetFace), targetFace: die.targetFace, lastRollKey: die.rollKey, groundedTime: 0, settling: false, landedReported: false, held: false }
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

function canCompleteFromTray(word: string, prefix: string, remainingLetters: string[]): boolean {
  return word.startsWith(prefix) && canBuildWord(word.slice(prefix.length), remainingLetters)
}

function scoreRoll(words: string[], letters: string[]) {
  const completable = words.filter(word => word.length >= 2 && word.length <= letters.length && canBuildWord(word, letters))
  const starters = new Set(completable.map(word => [...word][0]))
  const starterDice = letters.filter(letter => starters.has(letter)).length
  const lengthBands = new Set(completable.map(word => Math.min(5, word.length))).size
  const participating = letters.filter((_, index) => {
    const reduced = letters.filter((__, other) => other !== index)
    return completable.some(word => word.includes(letters[index]) && !canBuildWord(word, reduced))
  }).length
  return { completable, starters, starterDice, lengthBands, participating, score: completable.length * 30 + starters.size * 18 + starterDice * 8 + lengthBands * 10 + participating * 5 }
}

function chooseCuratedFaces(language: Language, mode: GameMode, words: string[], activeIds: number[] = PACK.diceFaces[language].map((_, id) => id)): number[] {
  const faces = PACK.diceFaces[language]
  const usableWords = words.filter(word => word.length >= 2 && word.length <= activeIds.length)
  const sampleStep = mode === 'free' ? Math.max(1, Math.ceil(usableWords.length / 2400)) : 1
  const scoringWords = sampleStep === 1 ? usableWords : usableWords.filter((_, index) => index % sampleStep === 0).slice(0, 2400)
  const minimumWords = mode === 'free' ? Math.min(10, Math.max(4, Math.floor(scoringWords.length / 25))) : Math.min(3, scoringWords.length)
  const minimumStarters = mode === 'free' ? Math.min(3, activeIds.length) : Math.min(2, activeIds.length)
  let best: { indices: number[]; score: number } | null = null
  const accepted: Array<{ indices: number[]; score: number }> = []
  const attempts = mode === 'free' ? 240 : 3500
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const indices = faces.map(() => Math.floor(Math.random() * 6))
    const letters = activeIds.map(id => faces[id][indices[id]])
    const metrics = scoreRoll(scoringWords, letters)
    const candidate = { indices, score: metrics.score + Math.random() * 8 }
    if (!best || candidate.score > best.score) best = candidate
    if (metrics.completable.length >= minimumWords && metrics.starters.size >= minimumStarters && metrics.lengthBands >= Math.min(3, activeIds.length - 1)) accepted.push(candidate)
  }
  const pool = (accepted.length ? accepted : best ? [best] : []).sort((a, b) => b.score - a.score).slice(0, 12)
  return (pool[Math.floor(Math.random() * pool.length)] ?? { indices: faces.map(() => 0) }).indices
}

function createDice(language: Language, seed: number, mode: GameMode, words: string[]): DieState[] {
  const targetFaces = chooseCuratedFaces(language, mode, words)
  return PACK.diceFaces[language].map((faces, id) => ({ id, faces, letter: faces[targetFaces[id]], consumed: false, rollKey: seed + id, targetFace: targetFaces[id] }))
}

function curateRemainingDice(dice: DieState[], language: Language, mode: GameMode, words: string[], seed: number): DieState[] {
  const activeIds = dice.filter(die => !die.consumed).map(die => die.id)
  const targetFaces = chooseCuratedFaces(language, mode, words, activeIds)
  return dice.map(die => die.consumed ? die : { ...die, targetFace: targetFaces[die.id], letter: die.faces[targetFaces[die.id]], rollKey: seed + die.id })
}

function chooseCuratedRerollFace(language: Language, mode: GameMode, words: string[], dice: DieState[], dieId: number): number {
  const die = dice.find(item => item.id === dieId)
  if (!die) return 0
  const active = dice.filter(item => !item.consumed)
  const sampleStep = mode === 'free' ? Math.max(1, Math.ceil(words.length / 2400)) : 1
  const scoringWords = sampleStep === 1 ? words : words.filter((_, index) => index % sampleStep === 0).slice(0, 2400)
  const candidates = die.faces.map((letter, face) => {
    const letters = active.map(item => item.id === dieId ? letter : item.letter)
    const metrics = scoreRoll(scoringWords.filter(word => word.length <= letters.length), letters)
    return { face, score: metrics.score + (letter === die.letter ? -10 : 0) + Math.random() * 5 }
  }).sort((a, b) => b.score - a.score)
  return candidates[Math.floor(Math.random() * Math.min(2, candidates.length))].face
}

function LooseDice({ dice, selectedIds, viableIds, onSelectNow, onDeselectClick, onLanded, onThrow, onPlaced }: { dice: DieState[]; selectedIds: number[]; viableIds: number[]; onSelectNow: (id: number) => void; onDeselectClick: (id: number) => void; onLanded: (id: number, letter: string) => void; onThrow: (id: number) => boolean; onPlaced: () => void }) {
  const refs = useRef<Record<number, Group | null>>({})
  const motions = useRef<Record<number, Motion>>({})
  const drag = useRef<DragState>(null)
  useEffect(() => { for (const die of dice) motions.current[die.id] ??= freshMotion(die) }, [dice])
  useEffect(() => () => { if (drag.current?.pickupTimer) clearTimeout(drag.current.pickupTimer) }, [])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30)
    const activeDice = dice.filter(item => !item.consumed)

    for (const die of activeDice) {
      let motion = motions.current[die.id] ?? freshMotion(die)
      motions.current[die.id] = motion
      if (motion.lastRollKey !== die.rollKey) { motion = freshMotion(die); motions.current[die.id] = motion }
      if (motion.held) motion.position.y = FLOOR_Y + HALF + 0.32
      else if (!motion.settling) {
        motion.velocity.y -= 15.5 * delta
        motion.position.addScaledVector(motion.velocity, delta)
        const speed = motion.angularVelocity.length()
        if (speed > 0.001) motion.quaternion.premultiply(new Quaternion().setFromAxisAngle(motion.angularVelocity.clone().normalize(), speed * delta)).normalize()
        const floor = FLOOR_Y + HALF
        if (motion.position.y < floor) {
          motion.position.y = floor
          if (motion.velocity.y < 0) motion.velocity.y *= -0.27
          motion.velocity.x *= 0.91; motion.velocity.z *= 0.91; motion.angularVelocity.multiplyScalar(0.86); motion.groundedTime += delta
          if (motion.groundedTime > 0.22 && Math.abs(motion.velocity.y) < 0.22 && Math.hypot(motion.velocity.x, motion.velocity.z) < 0.42) { motion.settling = true; motion.velocity.set(0, 0, 0); motion.angularVelocity.set(0, 0, 0) }
        } else motion.groundedTime = 0
        clampToTray(motion.position)
      } else {
        motion.position.y = FLOOR_Y + HALF
        motion.quaternion.slerp(motion.targetQuaternion, Math.min(1, delta * 9))
        if (!motion.landedReported && motion.quaternion.angleTo(motion.targetQuaternion) < 0.025) { motion.quaternion.copy(motion.targetQuaternion); motion.landedReported = true; onLanded(die.id, die.faces[motion.targetFace]) }
      }
    }

    for (let pass = 0; pass < 2; pass += 1) {
      for (let first = 0; first < activeDice.length; first += 1) {
        const firstDie = activeDice[first]
        const firstMotion = motions.current[firstDie.id]
        if (!firstMotion || firstMotion.held || firstMotion.position.y > FLOOR_SEPARATION_HEIGHT) continue

        for (let second = first + 1; second < activeDice.length; second += 1) {
          const secondDie = activeDice[second]
          const secondMotion = motions.current[secondDie.id]
          if (!secondMotion || secondMotion.held || secondMotion.position.y > FLOOR_SEPARATION_HEIGHT) continue

          const dx = secondMotion.position.x - firstMotion.position.x
          const dz = secondMotion.position.z - firstMotion.position.z
          const distance = Math.hypot(dx, dz)
          if (distance >= MIN_DIE_SPACING) continue

          let nx: number
          let nz: number
          if (distance < 0.0001) {
            const angle = ((firstDie.id * 37 + secondDie.id * 61) % 360) * Math.PI / 180
            nx = Math.cos(angle)
            nz = Math.sin(angle)
          } else {
            nx = dx / distance
            nz = dz / distance
          }

          const push = (MIN_DIE_SPACING - distance) * 0.5
          firstMotion.position.x -= nx * push
          firstMotion.position.z -= nz * push
          secondMotion.position.x += nx * push
          secondMotion.position.z += nz * push
          clampToTray(firstMotion.position)
          clampToTray(secondMotion.position)
        }
      }
    }

    for (const die of activeDice) {
      const motion = motions.current[die.id]
      const group = refs.current[die.id]
      if (motion && group) { group.position.copy(motion.position); group.quaternion.copy(motion.quaternion) }
    }
  })

  const transforms: Array<{ position: [number, number, number]; rotation: [number, number, number] }> = [
    { position: [0, HALF + 0.008, 0], rotation: [-Math.PI / 2, 0, 0] }, { position: [0, -HALF - 0.008, 0], rotation: [Math.PI / 2, 0, Math.PI] },
    { position: [0, 0, HALF + 0.008], rotation: [0, 0, 0] }, { position: [0, 0, -HALF - 0.008], rotation: [0, Math.PI, 0] },
    { position: [HALF + 0.008, 0, 0], rotation: [0, Math.PI / 2, 0] }, { position: [-HALF - 0.008, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  ]

  const pickUp = (id: number) => { const current = drag.current; if (!current || current.id !== id) return; current.pickedUp = true; const motion = motions.current[id]; if (motion) { motion.held = true; motion.settling = true; motion.velocity.set(0, 0, 0); motion.angularVelocity.set(0, 0, 0) } }
  const beginDrag = (event: ThreeEvent<PointerEvent>, die: DieState, selected: boolean) => { event.stopPropagation(); onSelectNow(die.id); const now = performance.now(); drag.current = { id: die.id, pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY, lastTime: now, velocityX: 0, velocityY: 0, totalDistance: 0, wasSelected: selected, pickedUp: false, pickupTimer: null }; drag.current.pickupTimer = setTimeout(() => pickUp(die.id), PICKUP_DELAY); (event.target as unknown as { setPointerCapture?: (id: number) => void }).setPointerCapture?.(event.pointerId) }
  const moveDrag = (event: ThreeEvent<PointerEvent>, die: DieState) => { const current = drag.current; if (!current || current.id !== die.id || current.pointerId !== event.pointerId) return; event.stopPropagation(); const now = performance.now(); const dt = Math.max(1, now - current.lastTime); const dx = event.clientX - current.lastX; const dy = event.clientY - current.lastY; current.velocityX = dx / dt; current.velocityY = dy / dt; current.totalDistance += Math.hypot(dx, dy); current.lastX = event.clientX; current.lastY = event.clientY; current.lastTime = now; if (!current.pickedUp) return; const motion = motions.current[die.id]; if (!motion) return; const canvas = event.nativeEvent.target instanceof Element ? event.nativeEvent.target.closest('canvas') : null; motion.position.x = clamp(motion.position.x + dx / (canvas?.clientWidth ?? 800) * (RIGHT - LEFT) * 1.15, LEFT + HALF, RIGHT - HALF); motion.position.z = clamp(motion.position.z + dy / (canvas?.clientHeight ?? 500) * (FRONT - BACK) * 1.15, BACK + HALF, FRONT - HALF) }
  const endDrag = (event: ThreeEvent<PointerEvent>, die: DieState) => { event.stopPropagation(); const current = drag.current; if (!current || current.id !== die.id || current.pointerId !== event.pointerId) return; if (current.pickupTimer) clearTimeout(current.pickupTimer); (event.target as unknown as { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(event.pointerId); drag.current = null; const motion = motions.current[die.id]; const isClick = !current.pickedUp && current.totalDistance < CLICK_DISTANCE; const isThrow = current.pickedUp && Math.hypot(current.velocityX, current.velocityY) >= THROW_SPEED && current.totalDistance >= CLICK_DISTANCE; if (isClick) { if (current.wasSelected) onDeselectClick(die.id); return } if (isThrow && onThrow(die.id)) return; if (motion) { motion.held = false; motion.position.y = FLOOR_Y + HALF; motion.settling = true; motion.velocity.set(0, 0, 0); motion.angularVelocity.set(0, 0, 0) } onPlaced() }

  return <>{dice.map(die => {
    if (die.consumed) return null
    const selected = selectedIds.includes(die.id)
    const viable = viableIds.includes(die.id)
    return <group key={die.id} ref={node => { refs.current[die.id] = node }} onPointerDown={event => beginDrag(event, die, selected)} onPointerMove={event => moveDrag(event, die)} onPointerUp={event => endDrag(event, die)} onPointerCancel={() => { const current = drag.current; if (current?.pickupTimer) clearTimeout(current.pickupTimer); const motion = motions.current[die.id]; if (motion) { motion.held = false; motion.position.y = FLOOR_Y + HALF }; drag.current = null }}>
      {viable && !selected && <><RoundedBox args={[DIE_SIZE * 1.16, DIE_SIZE * 1.16, DIE_SIZE * 1.16]} radius={0.06} smoothness={3}><meshBasicMaterial color="#ebc620" transparent opacity={0.16} depthWrite={false} /></RoundedBox><pointLight position={[0, 0.18, 0]} color="#cfbd46" intensity={1.25} distance={1.15} decay={2} /></>}
      <RoundedBox args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} radius={0.035} smoothness={2} castShadow receiveShadow><meshStandardMaterial color={selected ? '#f0c879' : viable ? '#db9d33' : '#d8cfc0'} emissive={selected ? '#79521e' : viable ? '#3b8753' : '#000000'} emissiveIntensity={selected ? 0.16 : viable ? 0.48 : 0} roughness={0.88} metalness={0} /></RoundedBox>
      {transforms.map((transform, face) => <Text key={face} position={transform.position} rotation={transform.rotation} fontSize={0.19} color="#171615" anchorX="center" anchorY="middle">{die.faces[face]}</Text>)}
    </group>
  })}</>
}

function TrayGeometry() { return <group><RoundedBox args={[6.65, 0.38, 4.25]} radius={0.26} smoothness={4} position={[0, FLOOR_Y - 0.18, 0]} receiveShadow><meshStandardMaterial color="#121820" roughness={0.94} /></RoundedBox><mesh position={[0, -0.17, BACK - 0.13]}><boxGeometry args={[6.55, 0.86, 0.28]} /><meshStandardMaterial color="#222933" /></mesh><mesh position={[0, -0.17, FRONT + 0.13]}><boxGeometry args={[6.55, 0.86, 0.28]} /><meshStandardMaterial color="#222933" /></mesh><mesh position={[LEFT - 0.13, -0.17, 0]}><boxGeometry args={[0.28, 0.86, 3.95]} /><meshStandardMaterial color="#222933" /></mesh><mesh position={[RIGHT + 0.13, -0.17, 0]}><boxGeometry args={[0.28, 0.86, 3.95]} /><meshStandardMaterial color="#222933" /></mesh></group> }
function DiceTray(props: Parameters<typeof LooseDice>[0]) { return <Canvas fallback={<div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#aeb7c4', fontFamily: 'monospace' }}>3D dice are unavailable on this device.</div>} shadows camera={{ position: [0, 9.4, 1.15], fov: 34 }} onCreated={({ camera }) => camera.lookAt(0, -0.35, 0)}><color attach="background" args={['#11161d']} /><ambientLight intensity={1.15} /><directionalLight position={[4, 8, 4]} intensity={3.1} castShadow /><pointLight position={[-3.5, 1.6, -1.5]} color="#846ff0" intensity={6.5} distance={8} /><TrayGeometry /><LooseDice {...props} /></Canvas> }

export default function App() {
  const [mode, setMode] = useState<GameMode>('pack')
  const [diceLanguage, setDiceLanguage] = useState<Language>('he')
  const [gameLanguage, setGameLanguage] = useState<Language>('en')
  const initialPackWords = PACK.entries.map(entry => entry.forms.he.spelling)
  const [dice, setDice] = useState<DieState[]>(() => createDice('he', 1, 'pack', initialPackWords))
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [rerolls, setRerolls] = useState(3)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [discoveries, setDiscoveries] = useState<Record<Language, Record<string, number>>>({ en: {}, he: {} })
  const [freeFound, setFreeFound] = useState<Record<Language, Record<string, number>>>({ en: {}, he: {} })
  const [freeWordsByLanguage, setFreeWordsByLanguage] = useState<Partial<Record<Language, string[]>>>({})
  const freeWordsCache = useRef<Partial<Record<Language, string[]>>>({})
  const [freeLoading, setFreeLoading] = useState(false)
  const [cards, setCards] = useState<CardState[]>([])
  const [repoOpen, setRepoOpen] = useState(true)
  const [deckOpen, setDeckOpen] = useState(true)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [reward, setReward] = useState<Reward | null>(null)
  const [message, setMessage] = useState('Explore the hidden pack. Click a die to begin a path.')

  const t = UI[gameLanguage]
  const direction = diceLanguage === 'he' ? 'rtl' : 'ltr'
  const currentDiscoveries = discoveries[diceLanguage]
  const currentFreeFound = freeFound[diceLanguage]
  const activeForms = useMemo(() => PACK.entries.map(entry => ({ entry, form: entry.forms[diceLanguage] })), [diceLanguage])
  const packLookup = useMemo(() => Object.fromEntries(activeForms.map(item => [item.form.spelling, item.entry])), [activeForms])
  const freeWords = freeWordsByLanguage[diceLanguage] ?? []
  const freeVocabulary = useMemo(() => mode === 'free' && freeWords.length ? createVocabulary(freeWords) : null, [freeWords, mode])
  const currentWord = useMemo(() => selectedIds.map(id => dice.find(die => die.id === id)?.letter ?? '').join(''), [selectedIds, dice])
  const entry = packLookup[currentWord]
  const valid = mode === 'pack' ? Boolean(entry) : currentWord.length >= 2 && Boolean(freeVocabulary?.isWord(currentWord))
  const availableEntries = useMemo(() => { const hidden = activeForms.filter(({ entry: word }) => !currentDiscoveries[word.id]); return hidden.length ? hidden : activeForms }, [activeForms, currentDiscoveries])
  const candidateWords = useMemo(() => mode === 'pack' ? availableEntries.map(({ form }) => form.spelling) : freeWords, [availableEntries, freeWords, mode])
  const activeLetters = useMemo(() => dice.filter(die => !die.consumed).map(die => die.letter), [dice])
  const playableWords = useMemo(() => candidateWords.filter(word => word.length >= 2 && word.length <= activeLetters.length && canBuildWord(word, activeLetters)), [activeLetters, candidateWords])

  const viableIds = useMemo(() => {
    const selected = new Set(selectedIds)
    return dice.filter(die => !die.consumed && !selected.has(die.id)).filter(candidate => {
      const prefix = currentWord + candidate.letter
      const remainingLetters = dice.filter(die => !die.consumed && !selected.has(die.id) && die.id !== candidate.id).map(die => die.letter)
      return playableWords.some(word => canCompleteFromTray(word, prefix, remainingLetters))
    }).map(die => die.id)
  }, [currentWord, dice, playableWords, selectedIds])

  const rollMetrics = useMemo(() => scoreRoll(playableWords, activeLetters), [activeLetters, playableWords])
  const pathMessage = freeLoading
    ? t.loadingFree
    : !selectedIds.length
      ? `${rollMetrics.completable.length} playable words · ${rollMetrics.starters.size} starts · ${t.clickExplore} · ${t.holdMove} · ${t.flickReroll}`
      : viableIds.length ? `${viableIds.length} ${t.possible}${viableIds.length === 1 ? '' : 's'}` : valid ? t.complete : t.deadEnd

  const freshDice = (language: Language, nextMode: GameMode, words: string[]) => createDice(language, Date.now(), nextMode, words)
  const resetThrow = (nextMode = mode, language = diceLanguage, words = candidateWords) => { setSelectedIds([]); setRerolls(3); setDice(freshDice(language, nextMode, words)) }
  const ensureFreeWords = async (language: Language) => {
    const cached = freeWordsCache.current[language]
    if (cached) return cached
    const words = await loadFreeWords(language)
    freeWordsCache.current[language] = words
    setFreeWordsByLanguage(current => ({ ...current, [language]: words }))
    return words
  }
  const switchMode = async (next: GameMode) => {
    if (next === mode || freeLoading) return
    if (next === 'free') {
      setFreeLoading(true)
      setMessage(t.loadingFree)
      try {
        const words = await ensureFreeWords(diceLanguage)
        setMode('free')
        resetThrow('free', diceLanguage, words)
        setReward(null)
        setSelectedCard(null)
        setMessage(t.emptyFree)
      } catch (error) {
        console.error('Unable to load Free dictionary', error)
        setMessage(t.freeLoadFailed)
      } finally {
        setFreeLoading(false)
      }
      return
    }
    const words = activeForms.map(({ form }) => form.spelling)
    setMode('pack')
    resetThrow('pack', diceLanguage, words)
    setReward(null)
    setSelectedCard(null)
    setMessage(PACK.description[gameLanguage])
  }
  const switchDiceLanguage = async (language: Language) => {
    if (language === diceLanguage || freeLoading) return
    if (mode === 'free') {
      setFreeLoading(true)
      setMessage(t.loadingFree)
      try {
        const words = await ensureFreeWords(language)
        setDiceLanguage(language)
        setDice(freshDice(language, 'free', words))
        setSelectedIds([])
        setRerolls(3)
        setRound(value => value + 1)
        setSelectedCard(null)
        setReward(null)
        setMessage(UI[gameLanguage].fresh)
      } catch (error) {
        console.error('Unable to load Free dictionary', error)
        setMessage(t.freeLoadFailed)
      } finally {
        setFreeLoading(false)
      }
      return
    }
    const words = PACK.entries.map(item => item.forms[language].spelling)
    setDiceLanguage(language)
    setDice(freshDice(language, 'pack', words))
    setSelectedIds([])
    setRerolls(3)
    setRound(value => value + 1)
    setSelectedCard(null)
    setReward(null)
    setMessage(UI[gameLanguage].fresh)
  }
  const selectNow = (id: number) => setSelectedIds(ids => ids.includes(id) ? ids : [...ids, id])
  const deselectClick = (id: number) => setSelectedIds(ids => ids.filter(item => item !== id))
  const landed = (id: number, letter: string) => setDice(items => items.map(die => die.id === id ? { ...die, letter } : die))
  const throwDie = (id: number): boolean => { if (freeLoading) return false; if (!rerolls) { setMessage(t.noRerolls); return false }; const targetFace = chooseCuratedRerollFace(diceLanguage, mode, candidateWords, dice, id); setDice(items => items.map(die => die.id === id ? { ...die, targetFace, letter: die.faces[targetFace], rollKey: die.rollKey + Date.now() } : die)); setSelectedIds(ids => ids.filter(item => item !== id)); setRerolls(value => value - 1); setMessage(t.thrown); return true }
  const rerollSelected = () => { if (freeLoading) return; if (!rerolls) { setMessage(t.noRerolls); return }; if (!selectedIds.length) { setMessage(t.selectFirst); return }; const ids = new Set(selectedIds); setDice(items => items.map(die => { if (!ids.has(die.id)) return die; const targetFace = chooseCuratedRerollFace(diceLanguage, mode, candidateWords, items, die.id); return { ...die, targetFace, letter: die.faces[targetFace], rollKey: die.rollKey + Date.now() } })); setSelectedIds([]); setRerolls(value => value - 1) }
  const shakeRemaining = () => { if (freeLoading) return; setDice(items => curateRemainingDice(items, diceLanguage, mode, candidateWords, Date.now())); setSelectedIds([]) }
  const nextRound = () => { if (freeLoading) return; setRound(value => value + 1); resetThrow(); setMessage(t.fresh) }

  const submit = () => {
    if (!valid || freeLoading) return
    setDice(items => items.map(die => selectedIds.includes(die.id) ? { ...die, consumed: true } : die))
    if (mode === 'pack' && entry) {
      setDiscoveries(all => ({ ...all, [diceLanguage]: { ...all[diceLanguage], [entry.id]: (all[diceLanguage][entry.id] ?? 0) + 1 } }))
      setCards(deck => [...deck, { cardId: Date.now(), conceptId: entry.id, diceLanguage }])
      setReward({ mode: 'pack', word: currentWord, entry })
    } else {
      setFreeFound(all => ({ ...all, [diceLanguage]: { ...all[diceLanguage], [currentWord]: (all[diceLanguage][currentWord] ?? 0) + 1 } }))
      setReward({ mode: 'free', word: currentWord })
      setMessage(`${currentWord} · ${t.freeFound}`)
    }
    setScore(value => value + currentWord.length * 10)
    setSelectedIds([])
  }

  const matchConcept = (conceptId: string) => { const card = cards.find(item => item.cardId === selectedCard); if (!card || card.conceptId !== conceptId || card.diceLanguage !== diceLanguage) return; setCards(deck => deck.filter(item => item.cardId !== card.cardId)); setSelectedCard(null); setScore(value => value + 50) }
  const freeRewardInfo = reward?.mode === 'free' ? getFreeWordInfo(reward.word, diceLanguage) : null

  return <main className="game-shell" dir={gameLanguage === 'he' ? 'rtl' : 'ltr'}>
    <div className="language-controls" aria-label="Language settings"><label><span>🎲 {t.diceLanguage}</span><select disabled={freeLoading} value={diceLanguage} onChange={event => void switchDiceLanguage(event.target.value as Language)}><option value="he">א עברית</option><option value="en">A English</option></select></label><label><span>🌐 {t.gameLanguage}</span><select value={gameLanguage} onChange={event => setGameLanguage(event.target.value as Language)}><option value="en">EN English</option><option value="he">עב עברית</option></select></label></div>
    <div className="mode-toggle" role="group" aria-label="Game mode"><button disabled={freeLoading} className={mode === 'pack' ? 'active' : ''} onClick={() => void switchMode('pack')}>📦 {t.pack}</button><button disabled={freeLoading} className={mode === 'free' ? 'active' : ''} onClick={() => void switchMode('free')}>{freeLoading ? '…' : `✦ ${t.free}`}</button></div>
    <header className="topbar"><div className="stat"><span>{t.round}</span><strong>{round}</strong></div><div className="stat"><span>{t.score}</span><strong>{score.toLocaleString()}</strong></div><div className="word-display"><span>{mode === 'pack' ? PACK.title[gameLanguage].toUpperCase() : t.free}</span><strong dir={direction}>{currentWord || '—'}</strong><small>{valid ? t.discoverable : pathMessage.toUpperCase()}</small></div><div className="stat"><span>{t.rerolls}</span><strong>{rerolls}</strong></div></header>
    <section className={`repository panel ${repoOpen ? 'open' : 'closed'}`}><button className="panel-tab" onClick={() => setRepoOpen(open => !open)} aria-label="Toggle discovered words">{repoOpen ? '‹' : '›'}</button><div className="panel-content"><h2>{mode === 'pack' ? t.discoveredWords : t.freeWords}</h2><p>{mode === 'pack' ? `${Object.keys(currentDiscoveries).length} / ${PACK.entries.length} · ${PACK.description[gameLanguage]}` : `${Object.keys(currentFreeFound).length} unique words`}</p><div className="stack-list">
      {mode === 'pack' ? <>{!Object.keys(currentDiscoveries).length && <div className="empty">{t.emptyRepo}</div>}{PACK.entries.filter(item => currentDiscoveries[item.id]).map(item => { const form = item.forms[diceLanguage]; return <details key={item.id} className="word-discovery"><summary><b dir={direction}>{form.spelling}</b><span>×{currentDiscoveries[item.id]}</span></summary><button className="discovery-detail" onClick={() => matchConcept(item.id)}><span className="discovery-icon">{item.image}</span><span><strong dir={direction}>{form.display}</strong><small>{item.meanings[gameLanguage]} · {form.pronunciation}</small></span></button></details> })}</> : <>{!Object.keys(currentFreeFound).length && <div className="empty">{t.emptyFree}</div>}{Object.entries(currentFreeFound).sort(([a], [b]) => a.localeCompare(b)).map(([word, count]) => { const info = getFreeWordInfo(word, diceLanguage); return <button className="word-discovery free-word free-word-button" key={word} onClick={() => setReward({ mode: 'free', word })}><span><strong dir={direction}>{word}</strong><small>{info.translation} · {info.transliteration}</small></span><span>×{count}</span></button> })}</>}
    </div></div></section>
    <section className="tray-wrap"><div className="path-guide" aria-live="polite">{pathMessage}</div><DiceTray dice={dice} selectedIds={selectedIds} viableIds={viableIds} onSelectNow={selectNow} onDeselectClick={deselectClick} onLanded={landed} onThrow={throwDie} onPlaced={() => setMessage(t.moved)} /><div className="tray-actions"><button disabled={freeLoading} className="secondary" onClick={shakeRemaining}>{t.shake}</button><button disabled={freeLoading} className="secondary" onClick={rerollSelected}>{t.rerollSelected}</button><button disabled={freeLoading} className="secondary" onClick={nextRound}>{t.nextRound}</button><button className="primary" disabled={!valid || freeLoading} onClick={submit}>{mode === 'pack' ? t.discover : t.submit}</button></div></section>
    <section className={`deck-drawer ${deckOpen ? 'open' : 'closed'}`}><button className="drawer-tab" onClick={() => setDeckOpen(open => !open)} aria-expanded={deckOpen}>{deckOpen ? '›' : '‹'} {t.decipher} · {mode === 'pack' ? cards.length : 0}</button><div className="cards-row" aria-hidden={!deckOpen}>{mode === 'free' ? <div className="empty deck-empty">Free mode uses the word list directly.</div> : <>{!cards.length && <div className="empty deck-empty">{t.emptyDeck}</div>}{cards.map(card => { const item = PACK.entries.find(packEntry => packEntry.id === card.conceptId); if (!item) return null; return <button key={card.cardId} className={`meaning-card ${selectedCard === card.cardId ? 'selected' : ''}`} onClick={() => setSelectedCard(card.cardId)}><span className="card-image">{item.image}</span><b>{item.meanings[gameLanguage]}</b><small>{t.match}</small></button> })}</>}</div></section>
    {reward && <div className="discovery-overlay" role="dialog" aria-modal="true"><div className="discovery-card"><span className="reveal-kicker">{reward.mode === 'pack' ? t.packFound : t.freeReward}</span><span className="reveal-image">{reward.mode === 'pack' ? reward.entry?.image : '✦'}</span><h1 dir={direction}>{reward.mode === 'pack' ? reward.entry?.forms[diceLanguage].display : reward.word}</h1><strong>{reward.mode === 'pack' ? reward.entry?.meanings[gameLanguage] : freeRewardInfo?.translation}</strong><small>{reward.mode === 'pack' ? reward.entry?.forms[diceLanguage].pronunciation : freeRewardInfo?.transliteration}</small><p>{reward.mode === 'pack' ? `${Object.keys(currentDiscoveries).length} / ${PACK.entries.length}` : `${reward.word.length * 10} points`}</p><button onClick={() => setReward(null)}>{t.continue}</button></div></div>}
    <footer className="status-line">{message}</footer>
  </main>
}
