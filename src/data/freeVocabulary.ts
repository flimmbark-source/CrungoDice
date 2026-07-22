export type FreeLanguage = 'en' | 'he'

export const FREE_WORDS: Record<FreeLanguage, string[]> = {
  en: [
    'ABLE','ABOUT','ABOVE','ACT','AFTER','AGAIN','AIR','ALL','ALONE','AM','AMONG','AN','AND','ANGLE','ANIMAL','ANSWER','APPLE','ARE','ARM','AROUND','ART','ASK','AT','AWAY',
    'BACK','BAD','BALL','BANK','BAR','BASE','BE','BEAR','BEAT','BED','BEE','BEEN','BEFORE','BEGIN','BELL','BEST','BIG','BIRD','BLACK','BLUE','BOAT','BODY','BOOK','BORN','BOTH','BOX','BOY','BREAD','BREAK','BRING','BROWN','BUILD','BUS','BUT','BUY','BY',
    'CALL','CAN','CAR','CARD','CARE','CAT','CHAIR','CHANGE','CHILD','CITY','CLASS','CLEAN','CLEAR','CLOCK','CLOSE','CLOUD','COLD','COME','COOK','COOL','CUP','CUT',
    'DARK','DAY','DEAR','DEEP','DID','DOG','DO','DOOR','DOWN','DRAW','DREAM','DRINK','DRIVE','DRY',
    'EACH','EAR','EARLY','EARTH','EAT','END','ENOUGH','EVEN','EVER','EYE',
    'FACE','FALL','FAR','FAST','FEEL','FEW','FIND','FIRE','FIRST','FISH','FIVE','FLOOR','FLY','FOOD','FOOT','FOR','FORM','FOUND','FOUR','FREE','FRIEND','FROM','FULL',
    'GAME','GARDEN','GAVE','GET','GIRL','GIVE','GLASS','GO','GOLD','GOOD','GOT','GREEN','GROUND','GROUP','GROW',
    'HAIR','HAND','HARD','HAS','HAT','HAVE','HE','HEAD','HEAR','HEART','HELP','HER','HERE','HIGH','HIM','HIS','HOME','HORSE','HOT','HOUSE','HOW',
    'I','IDEA','IF','IN','INTO','IS','IT',
    'JUST','KEEP','KIND','KING','KNEW','KNOW',
    'LAND','LARGE','LAST','LATE','LEARN','LEFT','LEG','LESS','LET','LETTER','LIFE','LIGHT','LIKE','LINE','LITTLE','LIVE','LONG','LOOK','LOVE','LOW',
    'MAKE','MAN','MANY','MAP','MAY','ME','MEAN','MEN','MIGHT','MIND','MISS','MONEY','MOON','MORE','MORNING','MOST','MOVE','MUCH','MUST','MY',
    'NAME','NEAR','NEED','NEVER','NEW','NEXT','NIGHT','NO','NORTH','NOT','NOW',
    'OF','OFF','OLD','ON','ONCE','ONE','ONLY','OPEN','OR','OTHER','OUR','OUT','OVER','OWN',
    'PAGE','PAPER','PART','PEOPLE','PLACE','PLANT','PLAY','POINT','PUT',
    'RAIN','READ','RED','REST','RIGHT','RIVER','ROAD','ROOM','ROUND','RUN',
    'SAID','SAME','SAY','SEA','SEE','SET','SHE','SHIP','SHORT','SHOW','SIDE','SIT','SIX','SKY','SLEEP','SMALL','SNOW','SO','SOME','SON','SONG','SOON','SOUND','STAR','START','STAY','STILL','STOP','STORY','STREET','SUN','SWIM',
    'TABLE','TAKE','TALK','TELL','TEN','THAN','THAT','THE','THEIR','THEM','THEN','THERE','THESE','THEY','THING','THINK','THIS','THREE','TIME','TO','TODAY','TOGETHER','TOOK','TOP','TREE','TRY','TWO',
    'UNDER','UP','US','USE','VERY','WAIT','WALK','WALL','WANT','WARM','WAS','WATCH','WATER','WAY','WE','WELL','WENT','WERE','WEST','WHAT','WHEN','WHERE','WHITE','WHO','WHY','WILL','WIND','WINDOW','WITH','WOMAN','WORD','WORK','WORLD','WOULD','WRITE','YEAR','YES','YOU','YOUNG','YOUR'
  ],
  he: [
    'אב','אבא','אביב','אבל','אגם','אדום','אדם','אוכל','אור','אות','אח','אחד','אחות','אחר','אחרי','אי','איך','איפה','איש','אין','אלה','אל','אם','אמא','אני','אנחנו','אף','ארבע','ארץ','אש','את','אתה','אתם',
    'בא','באה','בבית','בוקר','בחוץ','ביחד','בית','בין','בלי','בן','בנה','בני','בערב','בעיר','בר','ברחוב','בריא','בת','בתוך',
    'גג','גדול','גוף','גיל','גם','גן','גר','גרה','גשם',
    'דבר','דג','דלת','דרך','הוא','היא','היה','היום','הכל','הלך','הם','הן','הר','הרבה','ואז','ובית','וגם','זה','זמן','זאת',
    'חבר','חברה','חדש','חדר','חול','חום','חוץ','חי','חיים','חלב','חלון','חם','חמש','חתול',
    'טוב','טיול','יד','יודע','יום','ילד','ילדה','ים','יפה','יקר','יצא','יש','ישן',
    'כאן','כדור','כוס','כי','כל','כלב','כמו','כן','כסא','כיסא','כף','כבר','כתב',
    'לא','לאכול','לב','לבן','לבד','לילה','ליד','למה','ללכת','למד','לפני','לקח','לראות','לשתות',
    'מאוד','מאיפה','מבחוץ','מחר','מי','מים','מילה','מיטה','מכאן','מלך','מן','מעט','מקום','מרגיש','משחק','משהו','מתחת',
    'נגד','נהר','נולד','נעים','נסע','נר','נתן','סביב','סוף','ספר','עבד','עבר','עד','עולם','עומד','עיר','עכשיו','על','עם','עץ','ערב','פה','פעם','פנים','פתח','קטן','קיר','קם','קר','קרא','ראש','ראשון','ראה','רגל','רוצה','רחוב','רוח','רץ','שאל','שבוע','שחור','שולחן','שום','שומע','שמח','שמש','שם','שנה','שני','שעה','של','שלום','שלוש','שמים','שמע','שש','שותה','תחת','תמונה','תמיד','תן','תפוח'
  ]
}

const HEBREW_INFO: Record<string, [string, string]> = {
  'אב':['father','av'],'אבא':['dad','aba'],'אביב':['spring','aviv'],'אבל':['but','aval'],'אגם':['lake','agam'],'אדום':['red','adom'],'אדם':['person','adam'],'אוכל':['food / eats','ochel'],'אור':['light','or'],'אות':['letter / sign','ot'],'אח':['brother','ach'],'אחד':['one','echad'],'אחות':['sister','achot'],'אחר':['other / after','acher'],'אחרי':['after','acharei'],'אי':['island','i'],'איך':['how','eich'],'איפה':['where','eifo'],'איש':['man','ish'],'אין':['there is no','ein'],'אלה':['these','ele'],'אל':['to','el'],'אם':['if / mother','im'],'אמא':['mom','ima'],'אני':['I','ani'],'אנחנו':['we','anachnu'],'אף':['nose / even','af'],'ארבע':['four','arba'],'ארץ':['country / land','eretz'],'אש':['fire','esh'],'את':['you / object marker','at'],'אתה':['you','ata'],'אתם':['you all','atem'],
  'בא':['comes','ba'],'באה':['comes','ba-a'],'בבית':['at home','babayit'],'בוקר':['morning','boker'],'בחוץ':['outside','bachutz'],'ביחד':['together','beyachad'],'בית':['house','bayit'],'בין':['between','bein'],'בלי':['without','bli'],'בן':['son','ben'],'בנה':['built','bana'],'בני':['my son / sons of','bni'],'בערב':['in the evening','baerev'],'בעיר':['in the city','bair'],'בר':['bar / grain','bar'],'ברחוב':['in the street','barechov'],'בריא':['healthy','bari'],'בת':['daughter','bat'],'בתוך':['inside','betoch'],
  'גג':['roof','gag'],'גדול':['big','gadol'],'גוף':['body','guf'],'גיל':['age','gil'],'גם':['also','gam'],'גן':['garden','gan'],'גר':['lives','gar'],'גרה':['lives','gara'],'גשם':['rain','geshem'],
  'דבר':['thing / speak','davar'],'דג':['fish','dag'],'דלת':['door','delet'],'דרך':['way','derech'],'הוא':['he','hu'],'היא':['she','hi'],'היה':['was','haya'],'היום':['today','hayom'],'הכל':['everything','hakol'],'הלך':['went','halach'],'הם':['they','hem'],'הן':['they','hen'],'הר':['mountain','har'],'הרבה':['many','harbe'],'ואז':['and then','veaz'],'ובית':['and house','uvayit'],'וגם':['and also','vegam'],'זה':['this','ze'],'זמן':['time','zman'],'זאת':['this','zot'],
  'חבר':['friend','chaver'],'חברה':['friend / company','chavera'],'חדש':['new','chadash'],'חדר':['room','cheder'],'חול':['sand / weekday','chol'],'חום':['heat','chom'],'חוץ':['outside','chutz'],'חי':['alive','chai'],'חיים':['life','chayim'],'חלב':['milk','chalav'],'חלון':['window','chalon'],'חם':['hot','cham'],'חמש':['five','chamesh'],'חתול':['cat','chatul'],
  'טוב':['good','tov'],'טיול':['trip','tiyul'],'יד':['hand','yad'],'יודע':['knows','yodea'],'יום':['day','yom'],'ילד':['boy','yeled'],'ילדה':['girl','yalda'],'ים':['sea','yam'],'יפה':['beautiful','yafe'],'יקר':['dear / expensive','yakar'],'יצא':['went out','yatza'],'יש':['there is','yesh'],'ישן':['old / sleeps','yashan'],
  'כאן':['here','kan'],'כדור':['ball','kadur'],'כוס':['cup','kos'],'כי':['because','ki'],'כל':['all','kol'],'כלב':['dog','kelev'],'כמו':['like / as','kmo'],'כן':['yes','ken'],'כסא':['chair','kise'],'כיסא':['chair','kise'],'כף':['spoon / palm','kaf'],'כבר':['already','kvar'],'כתב':['wrote','katav'],
  'לא':['no / not','lo'],'לאכול':['to eat','leechol'],'לב':['heart','lev'],'לבן':['white','lavan'],'לבד':['alone','levad'],'לילה':['night','layla'],'ליד':['near','leyad'],'למה':['why','lama'],'ללכת':['to go','lalechet'],'למד':['learned','lamad'],'לפני':['before','lifnei'],'לקח':['took','lakach'],'לראות':['to see','lirot'],'לשתות':['to drink','lishtot'],
  'מאוד':['very','meod'],'מאיפה':['from where','meeifo'],'מבחוץ':['from outside','mibachutz'],'מחר':['tomorrow','machar'],'מי':['who','mi'],'מים':['water','mayim'],'מילה':['word','mila'],'מיטה':['bed','mita'],'מכאן':['from here','mikan'],'מלך':['king','melech'],'מן':['from','min'],'מעט':['few','meat'],'מקום':['place','makom'],'מרגיש':['feels','margish'],'משחק':['game','mis-chak'],'משהו':['something','mashehu'],'מתחת':['under','mitachat'],
  'נגד':['against','neged'],'נהר':['river','nahar'],'נולד':['was born','nolad'],'נעים':['pleasant','naim'],'נסע':['traveled','nasa'],'נר':['candle','ner'],'נתן':['gave','natan'],'סביב':['around','saviv'],'סוף':['end','sof'],'ספר':['book / counted','sefer'],'עבד':['worked','avad'],'עבר':['passed','avar'],'עד':['until','ad'],'עולם':['world','olam'],'עומד':['stands','omed'],'עיר':['city','ir'],'עכשיו':['now','achshav'],'על':['on','al'],'עם':['with / people','im'],'עץ':['tree','etz'],'ערב':['evening','erev'],'פה':['here / mouth','po'],'פעם':['once / time','paam'],'פנים':['face / inside','panim'],'פתח':['opened','patach'],'קטן':['small','katan'],'קיר':['wall','kir'],'קם':['got up','kam'],'קר':['cold','kar'],'קרא':['read / called','kara'],'ראש':['head','rosh'],'ראשון':['first','rishon'],'ראה':['saw','raa'],'רגל':['leg','regel'],'רוצה':['wants','rotze'],'רחוב':['street','rechov'],'רוח':['wind / spirit','ruach'],'רץ':['runs','ratz'],
  'שאל':['asked','shaal'],'שבוע':['week','shavua'],'שחור':['black','shachor'],'שולחן':['table','shulchan'],'שום':['nothing / garlic','shum'],'שומע':['hears','shomea'],'שמח':['happy','sameach'],'שמש':['sun','shemesh'],'שם':['there / name','sham'],'שנה':['year','shana'],'שני':['second / two','sheni'],'שעה':['hour','shaa'],'של':['of','shel'],'שלום':['hello / peace','shalom'],'שלוש':['three','shalosh'],'שמים':['sky','shamayim'],'שמע':['heard','shama'],'שש':['six','shesh'],'שותה':['drinks','shote'],'תחת':['under','tachat'],'תמונה':['picture','tmuna'],'תמיד':['always','tamid'],'תן':['give','ten'],'תפוח':['apple','tapuach']
}

const ENGLISH_TO_HEBREW = Object.fromEntries(Object.entries(HEBREW_INFO).map(([he, [en]]) => [en.toUpperCase().split(' / ')[0], he])) as Record<string, string>

export function createVocabulary(words: string[]) {
  const normalized = [...new Set(words.map(word => word.trim().toUpperCase()).filter(Boolean))]
  const wordSet = new Set(normalized)
  const prefixSet = new Set<string>()
  for (const word of normalized) for (let index = 1; index <= word.length; index += 1) prefixSet.add(word.slice(0, index))
  return { words: normalized, isWord: (value: string) => wordSet.has(value.toUpperCase()), isPrefix: (value: string) => prefixSet.has(value.toUpperCase()) }
}

export function getFreeWordInfo(word: string, language: FreeLanguage) {
  const normalized = word.toUpperCase()
  if (language === 'he') {
    const [translation, transliteration] = HEBREW_INFO[word] ?? ['Translation pending', word]
    return { word, translation, transliteration }
  }
  return { word: normalized, translation: ENGLISH_TO_HEBREW[normalized] ?? 'תרגום בהכנה', transliteration: normalized.toLowerCase() }
}
