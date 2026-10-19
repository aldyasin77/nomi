import { useState, useEffect, useMemo, useRef } from 'react'
import { Delete, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/useIsMobile'

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

/**
 * CustomNumpad Component
 * Keyboard & kalkulator terintegrasi khusus perangkat mobile (< md)
 */
export default function CustomNumpad({
  value,
  onChange,
  onClose,
  onSubmit,
  isOpen = true,
  className = '',
}) {
  const isMobile = useIsMobile()
  const [expression, setExpression] = useState(() => {
    if (value === 0 || value === '0') return '0'
    return value ? String(value) : '0'
  })

  // Sinkronisasi ekspresi saat prop value berubah dari luar
  useEffect(() => {
    if (value === 0 || value === '0') {
      setExpression('0')
    } else if (value) {
      setExpression(String(value))
    } else {
      setExpression('0')
    }
  }, [value])

  // Jangan render di desktop atau saat isOpen false
  if (!isMobile || !isOpen) return null

  // Haptic feedback ringan jika didukung browser mobile
  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10)
      }
    } catch (e) {}
  }

  // Handle penekanan tombol angka
  const handleDigit = (digit) => {
    triggerHaptic()
    let nextExpr
    if (expression === '0') {
      nextExpr = digit
    } else {
      nextExpr = expression + digit
    }
    setExpression(nextExpr)

    // Evaluasi parsial secara live ke parent jika ekspresi berakhir angka
    const evaluated = evaluateMathExpression(nextExpr)
    if (onChange && !isNaN(evaluated)) {
      onChange(evaluated)
    }
  }

  // Handle penekanan operator (+, -, ×, ÷)
  const handleOperator = (op) => {
    triggerHaptic()
    if (!expression || expression === '0') {
      if (op === '-') {
        setExpression('-')
      }
      return
    }

    const lastChar = expression.trim().slice(-1)
    if (['+', '-', '×', '÷'].includes(lastChar)) {
      // Ganti operator terakhir jika ditekan lagi
      setExpression(expression.trim().slice(0, -1) + op)
    } else {
      // Evaluasi dulu sebelum menambahkan operator jika sudah ada operasi majemuk
      setExpression(expression + op)
    }
  }

  // Handle Clear All ('C')
  const handleClear = () => {
    triggerHaptic()
    setExpression('0')
    if (onChange) onChange(0)
  }

  // Handle Backspace (Hapus 1 karakter)
  const handleBackspace = () => {
    triggerHaptic()
    if (expression.length <= 1 || expression === '0') {
      setExpression('0')
      if (onChange) onChange(0)
      return
    }

    const nextExpr = expression.slice(0, -1)
    setExpression(nextExpr)
    const evaluated = evaluateMathExpression(nextExpr)
    if (onChange && !isNaN(evaluated)) {
      onChange(evaluated)
    }
  }

  // Handle Evaluasi '='
  const handleEvaluate = () => {
    triggerHaptic()
    const result = evaluateMathExpression(expression)
    const resultStr = String(result)
    setExpression(resultStr)
    if (onChange) onChange(result)
  }

  // Handle Submit / OK
  const handleOk = () => {
    triggerHaptic()
    const finalResult = evaluateMathExpression(expression)
    if (onChange) onChange(finalResult)
    if (onSubmit) onSubmit(finalResult)
    if (onClose) onClose()
  }

  const hasCalculation = /[+×÷-]/.test(expression) && expression !== '-'

  return (
    <>
      {/* Semi-transparent Backdrop for outside dismiss */}
      <div
        className="fixed inset-0 bg-black/20 z-50 md:hidden animate-fade-in"
        onClick={() => {
          handleEvaluate()
          if (onClose) onClose()
        }}
      />

      {/* Numpad Container fixed at bottom */}
      <div
        className={`fixed bottom-0 left-0 w-full z-50 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl shadow-2xl p-3 pb-6 md:hidden animate-in slide-in-from-bottom-5 duration-200 select-none ${className}`}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Top Header & Live Preview Bar */}
        <div className="flex items-center justify-between px-2 pb-2.5 pt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400">
              Kalkulator
            </span>
            {hasCalculation && (
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full truncate">
                {formatExpressionPreview(expression)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              handleEvaluate()
              if (onClose) onClose()
            }}
            className="p-1 -mr-1 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup keyboard"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Columns x 5 Rows Grid */}
        <div className="grid grid-cols-4 gap-2">
          {/* ================= BARIS 1 ================= */}
          {/* 'C' (tombol putih) */}
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="h-14 text-xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            C
          </Button>

          {/* '÷' (biru muda) */}
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOperator('÷')}
            className="h-14 text-2xl font-bold rounded-2xl bg-blue-100/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border-transparent shadow-xs active:scale-95 transition-transform"
          >
            ÷
          </Button>

          {/* '×' (biru muda) */}
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOperator('×')}
            className="h-14 text-2xl font-bold rounded-2xl bg-blue-100/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border-transparent shadow-xs active:scale-95 transition-transform"
          >
            ×
          </Button>

          {/* 'Backspace' (tombol putih dengan ikon hapus) */}
          <Button
            type="button"
            variant="outline"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform flex items-center justify-center"
            aria-label="Hapus karakter terakhir"
          >
            <Delete className="w-6 h-6 stroke-[1.8]" />
          </Button>

          {/* ================= BARIS 2 ================= */}
          {/* Angka 7 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('7')}
            className="h-14 text-2xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            7
          </Button>

          {/* Angka 8 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('8')}
            className="h-14 text-2xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            8
          </Button>

          {/* Angka 9 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('9')}
            className="h-14 text-2xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            9
          </Button>

          {/* '-' (biru muda) */}
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOperator('-')}
            className="h-14 text-2xl font-bold rounded-2xl bg-blue-100/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border-transparent shadow-xs active:scale-95 transition-transform"
          >
            -
          </Button>

          {/* ================= BARIS 3 ================= */}
          {/* Angka 4 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('4')}
            className="h-14 text-2xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            4
          </Button>

          {/* Angka 5 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('5')}
            className="h-14 text-2xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            5
          </Button>

          {/* Angka 6 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('6')}
            className="h-14 text-2xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            6
          </Button>

          {/* '+' (biru muda) */}
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOperator('+')}
            className="h-14 text-2xl font-bold rounded-2xl bg-blue-100/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border-transparent shadow-xs active:scale-95 transition-transform"
          >
            +
          </Button>

          {/* ================= BARIS 4 ================= */}
          {/* Angka 1 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('1')}
            className="h-14 text-2xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            1
          </Button>

          {/* Angka 2 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('2')}
            className="h-14 text-2xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            2
          </Button>

          {/* Angka 3 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('3')}
            className="h-14 text-2xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            3
          </Button>

          {/* '=' (biru muda) */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleEvaluate}
            className="h-14 text-2xl font-bold rounded-2xl bg-blue-100/80 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border-transparent shadow-xs active:scale-95 transition-transform"
          >
            =
          </Button>

          {/* ================= BARIS 5 ================= */}
          {/* '0' (tombol putih) */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('0')}
            className="h-14 text-2xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            0
          </Button>

          {/* '00' (tombol putih) */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('00')}
            className="h-14 text-xl font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            00
          </Button>

          {/* '000' (tombol putih) */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit('000')}
            className="h-14 text-lg font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-700 shadow-xs active:scale-95 transition-transform"
          >
            000
          </Button>

          {/* 'OK' (tombol biru tua bg-blue-600 text-white di pojok kanan bawah) */}
          <Button
            type="button"
            onClick={handleOk}
            className="h-14 text-xl font-bold rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 transition-transform"
          >
            OK
          </Button>
        </div>
      </div>
    </>
  )
}
