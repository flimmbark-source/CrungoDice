export type FreeLanguage = 'en' | 'he'

// Prototype vocabulary. This module is intentionally data-only so it can be
// replaced by a generated wordfreq/Hspell export without changing game logic.
export const FREE_WORDS: Record<FreeLanguage, string[]> = {
  en: [
    'ABLE','ABOUT','ABOVE','ACT','AFTER','AGAIN','AIR','ALL','ALONE','AM','AMONG','AN','AND','ANGLE','ANIMAL','ANSWER','APPLE','ARE','ARM','AROUND','ART','ASK','AT','AWAY',
    'BACK','BAD','BALL','BANK','BAR','BASE','BE','BEAR','BEAT','BED','BEE','BEEN','BEFORE','BEGIN','BELL','BEST','BIG','BIRD','BLACK','BLUE','BOAT','BODY','BOOK','BORN','BOTH','BOX','BOY','BREAD','BREAK','BRING','BROWN','BUILD','BUS','BUT','BUY','BY',
    'CALL','CAN','CAR','CARD','CARE','CAT','CHAIR','CHANGE','CHILD','CITY','CLASS','CLEAN','CLEAR','CLOCK','CLOSE','CLOUD','COLD','COME','COOK','COOL','CUP','CUT',
    'DARK','DAY','DEEP','DID','DOG','DO','DOOR','DOWN','DRAW','DREAM','DRINK','DRIVE','DRY',
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
    'טוב','טיול','יד','יודע','יום','ילד','ילדה','ים','יפה','יצא','יש','ישן',
    'כאן','כדור','כוס','כי','כל','כלב','כמו','כן','כסא','כיסא','כף','כבר','כתב',
    'לא','לאכול','לב','לבן','לבד','לילה','ליד','למה','ללכת','למד','לפני','לקח','לראות','לשתות',
    'מאוד','מאיפה','מבחוץ','מחר','מי','מים','מילה','מיטה','מכאן','מלך','מן','מעט','מקום','מרגיש','משחק','משהו','מתחת',
    'נגד','נהר','נולד','נעים','נסע','נר','נתן','סביב','סוף','ספר','עבד','עבר','עד','עולם','עומד','עיר','עכשיו','על','עם','עץ','ערב','פה','פעם','פנים','פתח','קטן','קיר','קם','קר','קרא','ראש','ראשון','ראה','רגל','רוצה','רחוב','רוח','רץ','שאל','שבוע','שחור','שולחן','שום','שומע','שמח','שמש','שם','שנה','שני','שעה','של','שלום','שלוש','שמים','שמע','שש','שותה','תחת','תמונה','תמיד','תן','תפוח'
  ]
}

export function createVocabulary(words: string[]) {
  const normalized = [...new Set(words.map(word => word.trim().toUpperCase()).filter(Boolean))]
  const wordSet = new Set(normalized)
  const prefixSet = new Set<string>()
  for (const word of normalized) {
    for (let index = 1; index <= word.length; index += 1) prefixSet.add(word.slice(0, index))
  }
  return {
    words: normalized,
    isWord: (value: string) => wordSet.has(value.toUpperCase()),
    isPrefix: (value: string) => prefixSet.has(value.toUpperCase()),
  }
}
