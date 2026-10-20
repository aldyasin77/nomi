/**
 * Evaluasi ekspresi matematika sederhana secara aman (+, -, ×, ÷)
 */
export function evaluateMathExpression(expr) {
  if (expr === null || expr === undefined || expr === '') return 0

  // Konversi ke string dan ganti operator visual dengan operator matematika standar
  const clean = String(expr)
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.')
    .replace(/\s+/g, '')

  // Hapus operator yang belum selesai di ujung (e.g. "50000+" -> "50000")
  const trimmed = clean.replace(/[+\-*/]+$/, '')
  if (!trimmed) return 0

  // Hapus karakter non-matematika untuk keamanan
  const sanitizedExpression = trimmed.replace(/[^-()\d/*+.]/g, '')
  if (!sanitizedExpression) return 0

  try {
    // Evaluasi hasil matematika
    const calculatedResult = Function('"use strict";return (' + sanitizedExpression + ')')()
    const num = Number(calculatedResult)
    return isNaN(num) || !isFinite(num) ? 0 : Math.round(num * 100) / 100
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
