export type FreeLanguage = 'en' | 'he'

export async function loadFreeWords(language: FreeLanguage): Promise<string[]> {
  const module = language === 'he'
    ? await import('./freeWords.he')
    : await import('./freeWords.en')
  return module.default
}

export function createVocabulary(words: string[]) {
  let wordSet: Set<string> | null = null
  let prefixSet: Set<string> | null = null
  const getWordSet = () => wordSet ??= new Set(words)
  const getPrefixSet = () => {
    if (prefixSet) return prefixSet
    prefixSet = new Set<string>()
    for (const word of words) {
      for (let index = 1; index <= word.length; index += 1) prefixSet.add(word.slice(0, index))
    }
    return prefixSet
  }
  return {
    words,
    isWord: (value: string) => getWordSet().has(value.toUpperCase()),
    isPrefix: (value: string) => getPrefixSet().has(value.toUpperCase()),
  }
}

const CORE_INFO: Record<string, [string, string]> = {
  'בית':['house','bayit'],'ספר':['book','sefer'],'מים':['water','mayim'],'אור':['light','or'],'דלת':['door','delet'],'חלון':['window','chalon'],'מיטה':['bed','mita'],'כוס':['cup','kos'],'כיסא':['chair','kise'],'שולחן':['table','shulchan'],'יקר':['dear','yakar']
}

export function getFreeWordInfo(word: string, language: FreeLanguage) {
  const normalized = word.toUpperCase()
  if (language === 'he') {
    const [translation, transliteration] = CORE_INFO[word] ?? ['Translation unavailable', 'Transliteration unavailable']
    return { word, translation, transliteration }
  }
  const reverse = Object.entries(CORE_INFO).find(([, [translation]]) => translation.toUpperCase() === normalized)
  return { word: normalized, translation: reverse?.[0] ?? 'תרגום לא זמין', transliteration: normalized.toLowerCase() }
}
