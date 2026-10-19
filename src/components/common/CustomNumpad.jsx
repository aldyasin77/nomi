import { useState, useEffect, useMemo, useRef } from 'react'
import { Delete, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useIsMobile } from '@/hooks/useIsMobile'

import { evaluateMathExpression, formatExpressionPreview } from '@/lib/calcUtils'
export { evaluateMathExpression, formatExpressionPreview }

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
  position = 'absolute', // 'absolute' (default) | 'fixed' | 'inline'
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

  const positionClass =
    position === 'inline'
      ? 'w-full'
      : position === 'fixed'
      ? 'fixed bottom-0 left-0 w-full z-50 animate-in slide-in-from-bottom-5 duration-200'
      : 'absolute bottom-0 left-0 w-full z-50 animate-in slide-in-from-bottom-5 duration-200'

  return (
    <div
      className={`${positionClass} bg-slate-100 dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] select-none ${className}`}
      style={
        position === 'fixed'
          ? { paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }
          : undefined
      }
    >
      {/* Header Numpad (Tombol Tutup) */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            KALKULATOR
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
          className="p-1 -mr-1 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Tutup keyboard"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 pb-4">

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
    </div>
  )
}
