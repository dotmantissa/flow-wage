import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

type AnimatedCounterProps = {
  value: number
  decimals?: number
  suffix?: string
  className?: string
}

export function AnimatedCounter({ value, decimals = 0, suffix = '', className }: AnimatedCounterProps) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }

    const start = display
    const duration = 650
    const from = performance.now()
    let frame = 0

    const tick = (time: number) => {
      const p = Math.min((time - from) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(start + (value - start) * eased)
      if (p < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, reduce])

  return <span className={className}>{display.toFixed(decimals)}{suffix}</span>
}
