'use client'

import { useEffect, useRef } from 'react'

interface QuestionItemProps {
  index: number
  text: string
  value: number | null
  active: boolean
  answered: boolean
  onChange: (v: number) => void
  leftLabel?: string
  rightLabel?: string
}

const DOT_SIZES = [28, 32, 36, 40, 44]
const ACTIVE_COLORS = ['#f5edeb', '#e3c4be', '#d4a89e', '#b8847a', '#7a5048']
const INACTIVE_COLORS = ['#faf4f3', '#f5edeb', '#edd8d4', '#e3c4be', '#d9b0a8']
const BORDER_COLORS = ['#d9b0a8', '#ce9c90', '#b8847a', '#9a6a60', '#7a5048']

export default function QuestionItem({
  index,
  text,
  value,
  active,
  answered,
  onChange,
  leftLabel = '同意',
  rightLabel = '不同意',
}: QuestionItemProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [active])

  const opacity = active ? 1 : answered ? 0.55 : 0.3
  const scale = active ? 1 : 0.97
  const interactive = active || answered

  return (
    <div
      ref={ref}
      className="py-8 px-4 transition-all duration-500 border-b border-gray-100 last:border-0"
      style={{ opacity, transform: `scale(${scale})`, transformOrigin: 'center' }}
    >
      <p
        className="text-center text-lg mb-6 font-medium transition-colors duration-300"
        style={{ color: active ? '#1f2937' : '#6b7280' }}
      >
        <span className="text-sm mr-2" style={{ color: active ? '#9ca3af' : '#d1d5db' }}>
          {index + 1}.
        </span>
        {text}
      </p>

      <div className="flex justify-center">
        <div className="flex items-center gap-3 select-none">
          <span
            className="text-sm font-medium w-16 text-right shrink-0 transition-colors duration-300"
            style={{ color: active ? '#cc9999' : '#9ca3af' }}
          >
            {leftLabel}
          </span>

          <div className="flex items-center gap-4">
            {DOT_SIZES.map((size, i) => {
              const pos = i + 1
              const selected = value === pos
              const fillColor = active ? ACTIVE_COLORS[i] : INACTIVE_COLORS[i]
              const borderColor = selected ? BORDER_COLORS[i] : 'transparent'
              return (
                <button
                  key={pos}
                  type="button"
                  disabled={!interactive}
                  onClick={() => onChange(pos)}
                  className="rounded-full transition-all duration-200 focus:outline-none"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: selected ? fillColor : active ? 'transparent' : INACTIVE_COLORS[i],
                    border: `3px solid ${selected ? borderColor : active ? ACTIVE_COLORS[i] : INACTIVE_COLORS[i]}`,
                    boxShadow: selected ? `0 0 0 3px ${ACTIVE_COLORS[i]}40` : 'none',
                    transform: selected ? 'scale(1.15)' : 'scale(1)',
                    cursor: interactive ? 'pointer' : 'default',
                  }}
                  aria-label={`${pos}`}
                />
              )
            })}
          </div>

          <span
            className="text-sm font-medium w-16 shrink-0 transition-colors duration-300"
            style={{ color: active ? '#7a5e82' : '#9ca3af' }}
          >
            {rightLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
