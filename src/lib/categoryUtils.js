// Regex matching any unicode emoji or pictograph at the start of a string
const EMOJI_PREFIX_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|…|⋯)\s*/u

export function extractCategoryEmojiAndName(categoryOrName, type = 'expense') {
  const nameStr = typeof categoryOrName === 'string'
    ? categoryOrName
    : (categoryOrName?.name || '')

  if (!nameStr) {
    return {
      emoji: type === 'income' ? '💰' : '🏷️',
      name: '',
    }
  }

  const match = nameStr.match(EMOJI_PREFIX_REGEX)
  if (match) {
    return {
      emoji: match[1],
      name: nameStr.slice(match[0].length).trim(),
    }
  }

  // Fallback emoji based on name if no emoji prefix
  const lower = nameStr.toLowerCase()
  let fallbackEmoji = type === 'income' ? '💰' : '🏷️'
  if (lower.includes('food') || lower.includes('dining') || lower.includes('makan') || lower.includes('coffee') || lower.includes('kopi')) {
    fallbackEmoji = '🍔'
  } else if (lower.includes('transport') || lower.includes('grab') || lower.includes('gojek') || lower.includes('bensin') || lower.includes('travel')) {
    fallbackEmoji = '🚗'
  } else if (lower.includes('house') || lower.includes('housing') || lower.includes('utilit') || lower.includes('listrik') || lower.includes('internet')) {
    fallbackEmoji = '⚡'
  } else if (lower.includes('entertain') || lower.includes('cinema') || lower.includes('game') || lower.includes('film') || lower.includes('hiburan') || lower.includes('leisure')) {
    fallbackEmoji = '🎬'
  } else if (lower.includes('shop') || lower.includes('grocer') || lower.includes('belanja')) {
    fallbackEmoji = '🛍️'
  } else if (lower.includes('salary') || lower.includes('gaji') || lower.includes('income')) {
    fallbackEmoji = '💵'
  } else if (lower.includes('interest') || lower.includes('bunga') || lower.includes('invest')) {
    fallbackEmoji = '📈'
  } else if (lower.includes('health') || lower.includes('obat') || lower.includes('sehat') || lower.includes('gym')) {
    fallbackEmoji = '🏥'
  } else if (lower.includes('edu') || lower.includes('sekolah') || lower.includes('kuliah') || lower.includes('kursus')) {
    fallbackEmoji = '📚'
  } else if (lower.includes('lain') || lower.includes('other') || lower.includes('adjust') || lower.includes('sesuai')) {
    fallbackEmoji = '⋯'
  }

  return {
    emoji: fallbackEmoji,
    name: nameStr.trim(),
  }
}
