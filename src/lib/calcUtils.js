/**
 * Evaluasi ekspresi matematika sederhana secara aman (+, -, ×, ÷)
 */
export function evaluateMathExpression(expr) {
  if (!expr || typeof expr !== 'string') return 0

  // Ganti operator visual dengan operator standar
  const clean = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.')
    .replace(/\s+/g, '')

  // Hapus operator yang belum selesai di ujung (e.g. "50000+" -> "50000")
  const sanitized = clean.replace(/[+\-*/]+$/, '')
  if (!sanitized) return 0

  // Validasi karakter aman
  if (!/^[-+/*0-9.]+$/.test(sanitized)) return 0

  try {
    // Tokenizer
    const tokens = []
    let currentNumber = ''
    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i]
      if ('+-*/'.includes(char)) {
        if (currentNumber !== '') {
          tokens.push(parseFloat(currentNumber))
          currentNumber = ''
        } else if (
          char === '-' &&
          (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string')
        ) {
          currentNumber = '-'
          continue
        }
        tokens.push(char)
      } else {
        currentNumber += char
      }
    }
    if (currentNumber !== '') {
      tokens.push(parseFloat(currentNumber))
    }

    if (tokens.length === 0) return 0
    if (tokens.length === 1 && typeof tokens[0] === 'number') return tokens[0]

    // Precedence 1: Perkalian & Pembagian (* & /)
    const intermediate = []
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token === '*' || token === '/') {
        const prev = intermediate.pop()
        const next = tokens[++i]
        if (typeof prev !== 'number' || typeof next !== 'number') return 0
        const res = token === '*' ? prev * next : (next !== 0 ? prev / next : 0)
        intermediate.push(res)
      } else {
        intermediate.push(token)
      }
    }

    // Precedence 2: Penjumlahan & Pengurangan (+ & -)
    let result = typeof intermediate[0] === 'number' ? intermediate[0] : 0
    for (let i = 1; i < intermediate.length; i += 2) {
      const op = intermediate[i]
      const next = intermediate[i + 1]
      if (typeof next !== 'number') break
      if (op === '+') result += next
      else if (op === '-') result -= next
    }

    return isNaN(result) ? 0 : Math.round(result * 100) / 100
  } catch (err) {
    return 0
  }
}

/**
 * Format string ekspresi dengan separator ribuan untuk kenyamanan visual
 */
export function formatExpressionPreview(expr) {
  if (!expr) return '0'
  return expr.replace(/(\d+)/g, (match) => {
    return Number(match).toLocaleString('id-ID')
  })
}
