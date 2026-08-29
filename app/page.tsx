"use client"

import { useEffect, useRef, useState } from "react"
import type { FormEvent, Ref } from "react"
import {
  Calculator,
  CheckCircle2,
  History,
  Layers3,
  RefreshCcw,
  RotateCcw,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CalculationResult {
  id: string
  side1: number
  side2: number
  layers: number
  add: number
  subtract: number
  totalFruits: number
  totalBoxes: number
  moduloBoxes: number
  timestamp: number
}

type FieldName = "side1" | "side2" | "layers" | "add" | "subtract"
type FieldErrors = Partial<Record<FieldName, string>>

const HISTORY_KEY = "calculationHistory"
const numberFormatter = new Intl.NumberFormat("vi-VN")

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value))
}

function NumberField({
  id,
  label,
  shortLabel,
  helper,
  placeholder,
  value,
  error,
  required = false,
  inputRef,
  enterKeyHint,
  onEnter,
  onChange,
  onBlur,
}: {
  id: FieldName
  label: string
  shortLabel?: string
  helper: string
  placeholder: string
  value: string
  error?: string
  required?: boolean
  inputRef?: Ref<HTMLInputElement>
  enterKeyHint?: "next" | "done"
  onEnter?: () => void
  onChange: (value: string) => void
  onBlur: () => void
}) {
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`

  return (
    <div className="min-w-0 space-y-1 sm:space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="min-w-0 text-base font-bold text-slate-900 sm:text-[1.05rem]">
          <span className="sm:hidden">{shortLabel ?? label}</span>
          <span className="hidden sm:inline">{label}</span>
        </Label>
        <span className="hidden shrink-0 text-sm font-medium text-slate-500 sm:inline">
          {required ? "Bắt buộc" : "Không bắt buộc"}
        </span>
      </div>
      <Input
        ref={inputRef}
        id={id}
        name={id}
        type="number"
        inputMode="numeric"
        enterKeyHint={enterKeyHint}
        min={required ? 1 : 0}
        max={9999}
        step={1}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onEnter) {
            event.preventDefault()
            onEnter()
          }
        }}
        className="h-12 rounded-lg border-2 border-slate-300 bg-white px-3 text-xl font-bold tabular-nums text-slate-950 shadow-none placeholder:text-base placeholder:font-normal placeholder:text-slate-400 hover:border-sky-500 focus-visible:border-sky-700 focus-visible:ring-4 focus-visible:ring-sky-200 sm:h-16 sm:rounded-xl sm:px-4 sm:text-2xl sm:placeholder:text-lg md:text-2xl"
      />
      <p id={descriptionId} className="sr-only text-[0.95rem] leading-6 text-slate-600 sm:not-sr-only">
        {helper}
      </p>
      {error && (
        <p id={errorId} className="flex items-center gap-2 text-base font-bold text-red-700" role="alert">
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-red-600" />
          {error}
        </p>
      )}
    </div>
  )
}

export default function CalculatorPage() {
  const [side1, setSide1] = useState("")
  const [side2, setSide2] = useState("")
  const [layers, setLayers] = useState("")
  const [add, setAdd] = useState("")
  const [subtract, setSubtract] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [history, setHistory] = useState<CalculationResult[]>([])
  const firstInputRef = useRef<HTMLInputElement>(null)
  const secondInputRef = useRef<HTMLInputElement>(null)
  const layersInputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch {
      localStorage.removeItem(HISTORY_KEY)
    }
  }, [])

  const values: Record<FieldName, string> = { side1, side2, layers, add, subtract }

  const validateField = (name: FieldName, value: string) => {
    const required = name === "side1" || name === "side2" || name === "layers"

    if (!value.trim()) return required ? "Vui lòng nhập số lớn hơn 0." : undefined

    const number = Number(value)
    if (!Number.isInteger(number)) return "Vui lòng nhập số nguyên."
    if (required && number < 1) return "Số này phải lớn hơn 0."
    if (!required && number < 0) return "Số này không được nhỏ hơn 0."
    if (number > 9999) return "Vui lòng nhập số không quá 9.999."
    return undefined
  }

  const validateAll = () => {
    const nextErrors: FieldErrors = {}
    ;(Object.keys(values) as FieldName[]).forEach((name) => {
      const error = validateField(name, values[name])
      if (error) nextErrors[name] = error
    })
    return nextErrors
  }

  const updateFieldError = (name: FieldName, error?: string) => {
    setErrors((current) => {
      const next = { ...current }
      if (error) next[name] = error
      else delete next[name]
      return next
    })
  }

  const handleFieldChange = (name: FieldName, value: string) => {
    const setters: Record<FieldName, (nextValue: string) => void> = {
      side1: setSide1,
      side2: setSide2,
      layers: setLayers,
      add: setAdd,
      subtract: setSubtract,
    }
    setters[name](value)
    if (errors[name]) updateFieldError(name)
    if (result) setResult(null)
  }

  const handleBlur = (name: FieldName) => {
    updateFieldError(name, validateField(name, values[name]))
  }

  const handleCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateAll()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      const firstError = Object.keys(nextErrors)[0]
      window.setTimeout(() => document.getElementById(firstError)?.focus(), 0)
      return
    }

    const num1 = Number(side1)
    const num2 = Number(side2)
    const numLayers = Number(layers)
    const numAdd = Number(add) || 0
    const numSubtract = Number(subtract) || 0

    const layerSteps = (numLayers * (numLayers - 1)) / 2
    const squaredSteps = (numLayers * (numLayers - 1) * (2 * numLayers - 1)) / 6
    const pyramidFruits = numLayers * num1 * num2 + (num1 + num2) * layerSteps + squaredSteps
    const totalFruits = pyramidFruits + numAdd - numSubtract

    if (totalFruits < 0) {
      setErrors({ subtract: "Số bớt đang lớn hơn tổng số trái." })
      document.getElementById("subtract")?.focus()
      return
    }

    const calculation: CalculationResult = {
      id: Date.now().toString(),
      side1: num1,
      side2: num2,
      layers: numLayers,
      add: numAdd,
      subtract: numSubtract,
      totalFruits,
      totalBoxes: Math.floor(totalFruits / 12),
      moduloBoxes: totalFruits % 12,
      timestamp: Date.now(),
    }

    setResult(calculation)
    setHistory((current) => {
      const nextHistory = [calculation, ...current].slice(0, 30)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory))
      return nextHistory
    })

    window.setTimeout(() => {
      resultRef.current?.focus()
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 0)
  }

  const handleReset = () => {
    setSide1("")
    setSide2("")
    setLayers("")
    setAdd("")
    setSubtract("")
    setErrors({})
    setResult(null)
    firstInputRef.current?.focus()
  }

  const handleClearHistory = () => {
    if (!window.confirm("Xóa toàn bộ lịch sử tính toán?")) return
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  const handleDeleteItem = (id: string) => {
    setHistory((current) => {
      const nextHistory = current.filter((item) => item.id !== id)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory))
      return nextHistory
    })
  }

  const handleReuse = (item: CalculationResult) => {
    setSide1(String(item.side1))
    setSide2(String(item.side2))
    setLayers(String(item.layers))
    setAdd(item.add ? String(item.add) : "")
    setSubtract(item.subtract ? String(item.subtract) : "")
    setErrors({})
    setResult(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
    window.setTimeout(() => firstInputRef.current?.focus(), 0)
  }

  return (
    <>
      <a
        href="#calculator-form"
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-slate-950 px-4 py-3 font-bold text-white focus:not-sr-only focus:ring-4 focus:ring-sky-300"
      >
        Đi thẳng đến phần nhập số
      </a>
      <main className="min-h-svh bg-[linear-gradient(180deg,#f0f9ff_0%,#f8fafc_38%,#eef6f1_100%)] px-3 py-3 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-3 flex items-center gap-3 sm:mb-8 sm:gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-800 text-white shadow-[0_8px_22px_rgba(3,105,161,0.2)] sm:size-16 sm:rounded-2xl">
            <Calculator className="size-7 sm:size-9" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-800 sm:mb-1 sm:text-sm">Tính nhanh</p>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">Tháp bưởi</h1>
          </div>
        </header>

        <div className="grid min-w-0 items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
          <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-0 py-0 shadow-[0_20px_60px_rgba(15,23,42,0.10)] ring-1 ring-slate-200 sm:rounded-3xl">
            <CardHeader className="gap-2 border-b border-sky-100 bg-sky-50/80 px-4 py-3 sm:gap-3 sm:px-8 sm:py-6">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-sky-800 shadow-sm ring-1 ring-sky-100 sm:mt-0.5 sm:size-11 sm:rounded-xl">
                  <Layers3 className="size-5 sm:size-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-10 text-slate-950 sm:text-2xl sm:leading-normal">Nhập số liệu</h2>
                  <p className="mt-1 hidden text-base leading-7 text-slate-600 sm:block">Chỉ cần nhập 3 số chính. Phần thêm và bớt có thể để trống.</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="min-w-0 px-4 py-3 sm:px-8 sm:py-8">
              <form id="calculator-form" className="min-w-0" onSubmit={handleCalculate} noValidate>
                <fieldset className="min-w-0">
                  <legend className="mb-2 text-base font-bold text-sky-900 sm:mb-5 sm:text-lg">3 số chính</legend>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-6">
                    <NumberField
                      id="side1"
                      label="Cạnh ngang"
                      helper="Số trái nằm trên cạnh ngang của tầng trên cùng."
                      placeholder="Ví dụ: 5"
                      value={side1}
                      error={errors.side1}
                      required
                      inputRef={firstInputRef}
                      enterKeyHint="next"
                      onEnter={() => secondInputRef.current?.focus()}
                      onChange={(value) => handleFieldChange("side1", value)}
                      onBlur={() => handleBlur("side1")}
                    />
                    <NumberField
                      id="side2"
                      label="Cạnh dọc"
                      helper="Số trái nằm trên cạnh dọc của tầng trên cùng."
                      placeholder="Ví dụ: 6"
                      value={side2}
                      error={errors.side2}
                      required
                      inputRef={secondInputRef}
                      enterKeyHint="next"
                      onEnter={() => layersInputRef.current?.focus()}
                      onChange={(value) => handleFieldChange("side2", value)}
                      onBlur={() => handleBlur("side2")}
                    />
                    <div className="col-span-2 sm:max-w-[calc(50%-0.75rem)]">
                      <NumberField
                        id="layers"
                        label="Số tầng"
                        helper="Tổng số tầng bưởi xếp từ trên xuống dưới."
                        placeholder="Ví dụ: 4"
                        value={layers}
                        error={errors.layers}
                        required
                        inputRef={layersInputRef}
                        enterKeyHint="done"
                        onChange={(value) => handleFieldChange("layers", value)}
                        onBlur={() => handleBlur("layers")}
                      />
                    </div>
                  </div>
                </fieldset>

                <fieldset className="mt-3 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:mt-8 sm:rounded-2xl sm:p-6">
                  <legend className="px-1 text-base font-bold text-slate-800 sm:px-2 sm:text-lg">Thêm / bớt (nếu có)</legend>
                  <div className="grid grid-cols-2 gap-3 sm:gap-6">
                    <NumberField
                      id="add"
                      label="Số trái thêm vào"
                      shortLabel="Thêm"
                      helper="Nhập 0 hoặc để trống nếu không thêm."
                      placeholder="0"
                      value={add}
                      error={errors.add}
                      onChange={(value) => handleFieldChange("add", value)}
                      onBlur={() => handleBlur("add")}
                    />
                    <NumberField
                      id="subtract"
                      label="Số trái bớt ra"
                      shortLabel="Bớt"
                      helper="Nhập 0 hoặc để trống nếu không bớt."
                      placeholder="0"
                      value={subtract}
                      error={errors.subtract}
                      onChange={(value) => handleFieldChange("subtract", value)}
                      onBlur={() => handleBlur("subtract")}
                    />
                  </div>
                </fieldset>

                <div className="mt-3 grid grid-cols-[1.65fr_1fr] gap-2 sm:mt-7 sm:gap-3">
                  <Button
                    type="submit"
                    className="h-13 cursor-pointer rounded-xl bg-green-700 px-3 text-lg font-bold text-white shadow-[0_8px_18px_rgba(21,128,61,0.22)] hover:bg-green-800 focus-visible:ring-4 focus-visible:ring-green-200 sm:h-16 sm:px-6 sm:text-xl"
                  >
                    <Calculator className="size-5 sm:size-6" aria-hidden="true" />
                    <span className="sm:hidden">Tính ngay</span>
                    <span className="hidden sm:inline">Tính kết quả</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="h-13 cursor-pointer rounded-xl border-2 border-slate-300 bg-white px-2 text-base font-bold text-slate-800 hover:border-sky-700 hover:bg-sky-50 sm:h-16 sm:px-5 sm:text-lg"
                  >
                    <RotateCcw className="size-5" aria-hidden="true" />
                    <span className="sm:hidden">Làm lại</span>
                    <span className="hidden sm:inline">Nhập lại</span>
                  </Button>
                </div>
              </form>

              {result && (
                <div
                  ref={resultRef}
                  tabIndex={-1}
                  role="status"
                  aria-live="polite"
                  className="mt-7 scroll-mt-4 rounded-2xl border-2 border-green-700 bg-green-50 p-5 outline-none focus-visible:ring-4 focus-visible:ring-green-200 sm:p-7"
                >
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="size-6" aria-hidden="true" />
                    <h2 className="text-lg font-bold">Kết quả tính</h2>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-700">Tổng số bưởi</p>
                  <p className="mt-1 break-words text-4xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-5xl">
                    {formatNumber(result.totalFruits)} <span className="text-2xl text-slate-700">trái</span>
                  </p>
                  <div className="mt-5 rounded-xl bg-white p-4 text-lg leading-8 text-slate-800 ring-1 ring-green-200">
                    Đóng được <strong className="text-2xl text-green-800">{formatNumber(result.totalBoxes)} chục</strong>
                    {result.moduloBoxes > 0 ? (
                      <>, còn dư <strong className="text-2xl text-green-800">{result.moduloBoxes} trái</strong>.</>
                    ) : (
                      <>, không còn trái lẻ.</>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <aside className="min-w-0" aria-labelledby="history-title">
            <Card className="gap-0 overflow-hidden rounded-3xl border-0 py-0 shadow-[0_16px_44px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 lg:sticky lg:top-6">
              <CardHeader className="border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                      <History className="size-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 id="history-title" className="text-xl font-bold text-slate-950">Lịch sử</h2>
                      <p className="text-sm font-medium text-slate-500">Lưu trên thiết bị này</p>
                    </div>
                  </div>
                  {history.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleClearHistory}
                      className="h-11 cursor-pointer rounded-xl px-3 text-base font-bold text-red-700 hover:bg-red-50 hover:text-red-800"
                    >
                      <Trash2 className="size-5" aria-hidden="true" />
                      Xóa hết
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="max-h-[720px] overflow-y-auto px-4 py-4 sm:px-5">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-12 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <History className="size-8" aria-hidden="true" />
                    </div>
                    <p className="mt-4 text-lg font-bold text-slate-800">Chưa có phép tính</p>
                    <p className="mt-1 max-w-64 text-base leading-6 text-slate-600">Kết quả mới sẽ tự động được lưu tại đây.</p>
                  </div>
                ) : (
                  <ol className="space-y-4">
                    {history.map((item) => (
                      <li key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-500">
                              {new Date(item.timestamp).toLocaleString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-950">
                              {formatNumber(item.totalFruits)} trái
                            </p>
                            <p className="mt-1 text-base font-semibold text-green-800">
                              {formatNumber(item.totalBoxes)} chục
                              {item.moduloBoxes > 0 && `, dư ${item.moduloBoxes} trái`}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item.id)}
                            aria-label={`Xóa kết quả ${formatNumber(item.totalFruits)} trái`}
                            title="Xóa kết quả này"
                            className="size-11 shrink-0 cursor-pointer rounded-xl text-slate-500 hover:bg-red-100 hover:text-red-700"
                          >
                            <Trash2 className="size-5" aria-hidden="true" />
                          </Button>
                        </div>

                        <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-200 py-3 text-center">
                          <div>
                            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Cạnh ngang</dt>
                            <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900">{item.side1}</dd>
                          </div>
                          <div className="border-x border-slate-200">
                            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Cạnh dọc</dt>
                            <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900">{item.side2}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Số tầng</dt>
                            <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900">{item.layers}</dd>
                          </div>
                        </dl>

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleReuse(item)}
                          className="mt-2 h-12 w-full cursor-pointer justify-start rounded-xl px-3 text-base font-bold text-sky-800 hover:bg-sky-100 hover:text-sky-900"
                        >
                          <RefreshCcw className="size-5" aria-hidden="true" />
                          Dùng lại số liệu này
                        </Button>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>

        <footer className="mt-8 flex items-center justify-center gap-2 text-center text-sm font-medium text-slate-600">
          <CheckCircle2 className="size-4 text-green-700" aria-hidden="true" />
          Dữ liệu chỉ được lưu trên thiết bị của bạn.
        </footer>
        </div>
      </main>
    </>
  )
}
