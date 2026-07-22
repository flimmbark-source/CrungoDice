import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, RoundedBox, Text } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { Euler, Quaternion, Vector3 } from 'three'

type Language = 'en' | 'he'
type LocalizedText = Record<Language, string>
type WordForm = { spelling: string; display: string; pronunciation: string }
type PackEntry = { id: string; image: string; forms: Record<Language, WordForm>; meanings: LocalizedText }
type WordPack = {
  id: string
  title: LocalizedText
  description: LocalizedText
  entries: PackEntry[]
  diceFaces: Record<Language, [string, string, string, string, string, string][]>
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
    packFound: 'PACK WORD DISCOVERED', clickExplore: 'click to explore', dragReroll: 'drag to reroll', possible: 'possible continuation',
    complete: 'A word is complete. Discover it or continue freely.', deadEnd: 'This path does not reach an available hidden pack word.',
    noRerolls: 'No rerolls remain this round.', selectFirst: 'Select one or more dice first.', thrown: 'Die thrown again.', fresh: 'A fresh roll from the hidden pack.',
  },
  he: {
    diceLanguage: 'שפת הקוביות', gameLanguage: 'שפת המשחק', round: 'סיבוב', score: 'ניקוד', rerolls: 'הטלות חוזרות',
    discoverable: 'מילה ניתנת לגילוי', discoveredWords: 'מילים שהתגלו', hiddenWords: 'מילים נסתרות התגלו',
    emptyRepo: 'החבילה מכילה מילים נסתרות מהבית. עקבו אחרי מסלול זוהר כדי לגלות את הראשונה.',
    shake: 'נער', rerollSelected: 'הטל נבחרות', nextRound: 'סיבוב הבא', discover: 'גלה', decipher: 'פענוח',
    emptyDeck: 'מילים שהתגלו יוצרות כאן קלפי זיכרון.', match: 'התאם לאיות שלה', continue: 'המשך',
    packFound: 'מילה מהחבילה התגלתה', clickExplore: 'לחצו כדי לחקור', dragReroll: 'גררו להטלה חוזרת', possible: 'המשך אפשרי',
    complete: 'המילה הושלמה. אפשר לגלות אותה או להמשיך לחקור.', deadEnd: 'המסלול הזה לא מוביל למילה נסתרת זמינה.',
    noRerolls: 'לא נשארו הטלות חוזרות בסיבוב הזה.', selectFirst: 'בחרו קובייה אחת או יותר.', thrown: 'הקובייה הוטלה שוב.', fresh: 'הטלה חדשה מהחבילה הנסתרת.',
  },
}

type DieState = { id: number; faces: [string, string, string, string, string, string]; letter: string; consumed: boolean; rollKey: number }
type CardState = { cardId: number; conceptId: string; diceLanguage: Language }
type Motion = { position: Vector3; velocity: Vector3; quaternion: Quaternion; angularVelocity: Vector3; targetQuaternion: Quaternion; targetFace: number; lastRollKey: number; groundedTime: number; settling: boolean; landedReported: boolean }
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
  const rotations = [new Euler(0, 0, 0), new Euler(Math.PI, 0, 0), new Euler(-Math.PI / 2, 0, 0), new Euler(Math.PI / 2, 0, 0), new Euler(0, 0, Math.PI / 2), new Euler(0, 0, -Math.PI / 2)]
  const uprightYaw = [0, 0, 0, Math.PI, -Math.PI / 2, Math.PI / 2][face]
  return new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), uprightYaw).multiply(new Quaternion().setFromEuler(rotations[face]))
}

function freshMotion(rollKey: number): Motion {
  const targetFace = Math.floor(Math.random() * 6)
  return {
    position: new Vector3(randomBetween(-2.25, 2.25), randomBetween(1.8, 3.8), randomBetween(-1.2, 1.2)),
    velocity: new Vector3(randomBetween(-2.4, 2.4), randomBetween(0.2, 2.6), randomBetween(-2.2, 2.2)),
    quaternion: new Quaternion().setFromEuler(new Euler(randomBetween(0, Math.PI * 2), randomBetween(0, Math.PI * 2), randomBetween(0, Math.PI * 2))),
    angularVelocity: new Vector3(randomBetween(-11, 11), randomBetween(-11, 11), randomBetween(-11, 11)),
    targetQuaternion: landingQuaternion(targetFace), targetFace, lastRollKey: rollKey, groundedTime: 0, settling: false, landedReported: false,
  }
}

function LooseDice({ dice, selectedIds, viableIds, onSelect, onLanded, onDragReroll }: { dice: DieState[]; selectedIds: number[]; viableIds: number[]; onSelect: (id: number) => void; onLanded: (id: number, letter: string) => void; onDragReroll: (id: number) => void }) {
  const refs = useRef<Record<number, Group | null>>({})
  const motions = useRef<Record<number, Motion>>({})
  const drag = useRef<DragState>(null)

  useEffect(() => { for (const die of dice) motions.current[die.id] ??= freshMotion(die.rollKey) }, [dice])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30)
    const active = dice.filter(die => !die.consumed)
    for (const die of active) {
      let motion = motions.current[die.id] ?? freshMotion(die.rollKey)
      motions.current[die.id] = motion
      if (motion.lastRollKey !== die.rollKey) { motion = freshMotion(die.rollKey); motions.current[die.id] = motion }
      if (!motion.settling) {
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
        if (motion.position.x < LEFT + HALF) { motion.position.x = LEFT + HALF; motion.velocity.x = Math.abs(motion.velocity.x) * 0.45 }
        if (motion.position.x > RIGHT - HALF) { motion.position.x = RIGHT - HALF; motion.velocity.x = -Math.abs(motion.velocity.x) * 0.45 }
        if (motion.position.z < BACK + HALF) { motion.position.z = BACK + HALF; motion.velocity.z = Math.abs(motion.velocity.z) * 0.45 }
        if (motion.position.z > FRONT - HALF) { motion.position.z = FRONT - HALF; motion.velocity.z = -Math.abs(motion.velocity.z) * 0.45 }
      } else {
        motion.position.y = FLOOR_Y + HALF
        motion.quaternion.slerp(motion.targetQuaternion, Math.min(1, delta * 9))
        if (!motion.landedReported && motion.quaternion.angleTo(motion.targetQuaternion) < 0.025) { motion.quaternion.copy(motion.targetQuaternion); motion.landedReported = true; onLanded(die.id, die.faces[motion.targetFace]) }
      }
    }
    const minDistance = DIE_SIZE * 0.96
    for (let i = 0; i < active.length; i += 1) for (let j = i + 1; j < active.length; j += 1) {
      const a = motions.current[active[i].id]; const b = motions.current[active[j].id]
      if (!a || !b || a.settling || b.settling) continue
      const separation = b.position.clone().sub(a.position); const distance = separation.length()
      if (distance <= 0 || distance >= minDistance) continue
      const normal = separation.multiplyScalar(1 / distance); const overlap = minDistance - distance
      a.position.addScaledVector(normal, -overlap * 0.5); b.position.addScaledVector(normal, overlap * 0.5)
    }
    for (const die of active) { const group = refs.current[die.id]; const motion = motions.current[die.id]; if (group && motion) { group.position.copy(motion.position); group.quaternion.copy(motion.quaternion) } }
  })

  const transforms: Array<{ position: [number, number, number]; rotation: [number, number, number] }> = [
    { position: [0, HALF + 0.008, 0], rotation: [-Math.PI / 2, 0, 0] }, { position: [0, -HALF - 0.008, 0], rotation: [Math.PI / 2, 0, Math.PI] },
    { position: [0, 0, HALF + 0.008], rotation: [0, 0, 0] }, { position: [0, 0, -HALF - 0.008], rotation: [0, Math.PI, 0] },
    { position: [HALF + 0.008, 0, 0], rotation: [0, Math.PI / 2, 0] }, { position: [-HALF - 0.008, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  ]

  return <>{dice.map(die => {
    if (die.consumed) return null
    const selected = selectedIds.includes(die.id); const viable = viableIds.includes(die.id)
    return <group key={die.id} ref={node => { refs.current[die.id] = node }}
      onPointerDown={event => { event.stopPropagation(); drag.current = { id: die.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false }; (event.target as unknown as { setPointerCapture?: (id: number) => void }).setPointerCapture?.(event.pointerId) }}
      onPointerMove={event => { const current = drag.current; if (current?.id === die.id && current.pointerId === event.pointerId && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) >= DRAG_THRESHOLD) current.moved = true }}
      onPointerUp={event => { event.stopPropagation(); const current = drag.current; if (!current || current.id !== die.id || current.pointerId !== event.pointerId) return; (event.target as unknown as { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(event.pointerId); drag.current = null; current.moved ? onDragReroll(die.id) : onSelect(die.id) }}
      onPointerCancel={() => { drag.current = null }}>
      <RoundedBox args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} radius={0.035} smoothness={2} castShadow receiveShadow><meshStandardMaterial color={selected ? '#f0c879' : viable ? '#b9d9bd' : '#d8cfc0'} emissive={selected ? '#79521e' : viable ? '#315d3c' : '#000000'} emissiveIntensity={selected ? 0.16 : viable ? 0.28 : 0} roughness={0.88} metalness={0} /></RoundedBox>
      {transforms.map((transform, face) => <Text key={face} position={transform.position} rotation={transform.rotation} fontSize={0.19} color="#171615" anchorX="center" anchorY="middle">{die.faces[face]}</Text>)}
    </group>
  })}</>
}

function TrayGeometry() { return <group><RoundedBox args={[6.65, 0.38, 4.25]} radius={0.26} smoothness={4} position={[0, FLOOR_Y - 0.18, 0]} receiveShadow><meshStandardMaterial color="#121820" roughness={0.94} /></RoundedBox><mesh position={[0, -0.17, BACK - 0.13]}><boxGeometry args={[6.55, 0.86, 0.28]} /><meshStandardMaterial color="#222933" /></mesh><mesh position={[0, -0.17, FRONT + 0.13]}><boxGeometry args={[6.55, 0.86, 0.28]} /><meshStandardMaterial color="#222933" /></mesh><mesh position={[LEFT - 0.13, -0.17, 0]}><boxGeometry args={[0.28, 0.86, 3.95]} /><meshStandardMaterial color="#222933" /></mesh><mesh position={[RIGHT + 0.13, -0.17, 0]}><boxGeometry args={[0.28, 0.86, 3.95]} /><meshStandardMaterial color="#222933" /></mesh></group> }
function DiceTray(props: Parameters<typeof LooseDice>[0]) { return <Canvas shadows camera={{ position: [0, 9.4, 1.15], fov: 34 }} onCreated={({ camera }) => camera.lookAt(0, -0.35, 0)}><color attach="background" args={['#11161d']} /><ambientLight intensity={1.15} /><directionalLight position={[4, 8, 4]} intensity={3.1} castShadow /><pointLight position={[-3.5, 1.6, -1.5]} color="#846ff0" intensity={6.5} distance={8} /><TrayGeometry /><LooseDice {...props} /><Environment preset="warehouse" /></Canvas> }

function createDice(language: Language, seed: number): DieState[] { return PACK.diceFaces[language].map((faces, id) => ({ id, faces, letter: faces[0], consumed: false, rollKey: seed + id })) }
function canFinishWord(word: string, prefix: string, letters: string[]): boolean { if (!word.startsWith(prefix)) return false; const available = [...letters]; for (const needed of [...word.slice(prefix.length)]) { const index = available.indexOf(needed); if (index < 0) return false; available.splice(index, 1) } return true }

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
  const activeDice = dice.filter(die => !die.consumed)
  const availableEntries = useMemo(() => { const hidden = activeForms.filter(({ entry: word }) => !currentDiscoveries[word.id]); return hidden.length ? hidden : activeForms }, [activeForms, currentDiscoveries])
  const viableIds = useMemo(() => {
    if (!selectedIds.length) return []
    const selected = new Set(selectedIds)
    return dice.filter(die => !die.consumed && !selected.has(die.id)).filter(candidate => {
      const prefix = currentWord + candidate.letter
      const remaining = dice.filter(die => !die.consumed && !selected.has(die.id) && die.id !== candidate.id).map(die => die.letter)
      return availableEntries.some(({ form }) => canFinishWord(form.spelling, prefix, remaining))
    }).map(die => die.id)
  }, [availableEntries, currentWord, dice, selectedIds])

  const pathMessage = !selectedIds.length ? `${Object.keys(currentDiscoveries).length}/${PACK.entries.length} ${t.hiddenWords} · ${t.clickExplore} · ${t.dragReroll}` : viableIds.length ? `${viableIds.length} ${t.possible}${viableIds.length === 1 ? '' : 's'}` : valid ? t.complete : t.deadEnd
  const switchDiceLanguage = (language: Language) => { if (language === diceLanguage) return; setDiceLanguage(language); setDice(createDice(language, Date.now())); setSelectedIds([]); setRerolls(3); setRound(value => value + 1); setSelectedCard(null); setMessage(UI[gameLanguage].fresh) }
  const selectDie = (id: number) => setSelectedIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id])
  const landed = (id: number, letter: string) => setDice(items => items.map(die => die.id === id ? { ...die, letter } : die))
  const rerollDie = (id: number) => { if (!rerolls) { setMessage(t.noRerolls); return } setDice(items => items.map(die => die.id === id ? { ...die, rollKey: die.rollKey + Date.now() } : die)); setSelectedIds(ids => ids.filter(item => item !== id)); setRerolls(value => value - 1); setMessage(t.thrown) }
  const rerollSelected = () => { if (!rerolls) { setMessage(t.noRerolls); return } if (!selectedIds.length) { setMessage(t.selectFirst); return } const ids = new Set(selectedIds); setDice(items => items.map(die => ids.has(die.id) ? { ...die, rollKey: die.rollKey + Date.now() } : die)); setSelectedIds([]); setRerolls(value => value - 1) }
  const shakeRemaining = () => { setDice(items => items.map(die => die.consumed ? die : { ...die, rollKey: die.rollKey + Date.now() })); setSelectedIds([]) }
  const nextRound = () => { setRound(value => value + 1); setRerolls(3); setSelectedIds([]); setDice(createDice(diceLanguage, Date.now())); setMessage(t.fresh) }
  const submit = () => { if (!entry) return; setDice(items => items.map(die => selectedIds.includes(die.id) ? { ...die, consumed: true } : die)); setDiscoveries(all => ({ ...all, [diceLanguage]: { ...all[diceLanguage], [entry.id]: (all[diceLanguage][entry.id] ?? 0) + 1 } })); setCards(deck => [...deck, { cardId: Date.now(), conceptId: entry.id, diceLanguage }]); setScore(value => value + currentWord.length * 10); setRevealId(entry.id); setSelectedIds([]) }
  const matchConcept = (conceptId: string) => { const card = cards.find(item => item.cardId === selectedCard); if (!card || card.conceptId !== conceptId || card.diceLanguage !== diceLanguage) return; setCards(deck => deck.filter(item => item.cardId !== card.cardId)); setSelectedCard(null); setScore(value => value + 50) }
  const reveal = PACK.entries.find(item => item.id === revealId)

  return <main className="game-shell" dir={gameLanguage === 'he' ? 'rtl' : 'ltr'}>
    <div className="language-controls" aria-label="Language settings">
      <label><span>🎲 {t.diceLanguage}</span><select value={diceLanguage} onChange={event => switchDiceLanguage(event.target.value as Language)}><option value="he">א עברית</option><option value="en">A English</option></select></label>
      <label><span>🌐 {t.gameLanguage}</span><select value={gameLanguage} onChange={event => setGameLanguage(event.target.value as Language)}><option value="en">EN English</option><option value="he">עב עברית</option></select></label>
    </div>
    <header className="topbar"><div className="stat"><span>{t.round}</span><strong>{round}</strong></div><div className="stat"><span>{t.score}</span><strong>{score.toLocaleString()}</strong></div><div className="word-display"><span>{PACK.title[gameLanguage].toUpperCase()}</span><strong dir={direction}>{currentWord || '—'}</strong><small>{valid ? t.discoverable : pathMessage.toUpperCase()}</small></div><div className="stat"><span>{t.rerolls}</span><strong>{rerolls}</strong></div></header>
    <section className={`repository panel ${repoOpen ? 'open' : 'closed'}`}><button className="panel-tab" onClick={() => setRepoOpen(open => !open)}>{repoOpen ? '‹' : '›'}</button><div className="panel-content"><h2>{t.discoveredWords}</h2><p>{PACK.description[gameLanguage]} · {Object.keys(currentDiscoveries).length}/{PACK.entries.length}</p><div className="stack-list">{!Object.keys(currentDiscoveries).length && <div className="empty">{t.emptyRepo}</div>}{Object.entries(currentDiscoveries).map(([conceptId, count]) => { const word = PACK.entries.find(item => item.id === conceptId)!; const form = word.forms[diceLanguage]; return <details key={conceptId} className="word-discovery"><summary><b dir={direction}>{form.spelling}</b><span>×{count}</span></summary><button className="discovery-detail" onClick={() => matchConcept(conceptId)}><span className="discovery-icon">{word.image}</span><span><strong dir={direction}>{form.display}</strong><small>{word.meanings[gameLanguage]} · {form.pronunciation}</small></span></button></details> })}</div></div></section>
    <section className="tray-wrap"><div className="path-guide">{pathMessage}</div><DiceTray dice={dice} selectedIds={selectedIds} viableIds={viableIds} onSelect={selectDie} onLanded={landed} onDragReroll={rerollDie} /><div className="tray-actions"><button className="secondary" onClick={shakeRemaining}>{t.shake}</button><button className="secondary" onClick={rerollSelected}>{t.rerollSelected}</button><button className="secondary" onClick={nextRound}>{t.nextRound}</button><button className="primary" disabled={!valid} onClick={submit}>{t.discover}</button></div></section>
    <section className={`deck-drawer ${deckOpen ? 'open' : 'closed'}`}><button className="drawer-tab" onClick={() => setDeckOpen(open => !open)}>{deckOpen ? '›' : '‹'} {t.decipher} · {cards.length}</button><div className="cards-row">{!cards.length && <div className="empty deck-empty">{t.emptyDeck}</div>}{cards.map(card => { const word = PACK.entries.find(item => item.id === card.conceptId)!; return <button key={card.cardId} className={`meaning-card ${selectedCard === card.cardId ? 'selected' : ''}`} onClick={() => setSelectedCard(card.cardId)}><span className="card-image">{word.image}</span><b>{word.meanings[gameLanguage]}</b><small>{t.match}</small></button> })}</div></section>
    {reveal && <div className="discovery-overlay"><div className="discovery-card"><span className="reveal-kicker">{t.packFound}</span><span className="reveal-image">{reveal.image}</span><h1 dir={direction}>{reveal.forms[diceLanguage].display}</h1><strong>{reveal.meanings[gameLanguage]}</strong><small>{reveal.forms[diceLanguage].pronunciation}</small><p>{Object.keys(currentDiscoveries).length}/{PACK.entries.length} · {PACK.title[gameLanguage]}</p><button onClick={() => setRevealId(null)}>{t.continue}</button></div></div>}
    <footer className="status-line">{message}</footer>
  </main>
}
