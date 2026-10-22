import '../styles/fun.css'
import { useSpring, type MotionValue } from 'motion/react'
import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'

/* Subtle 3D tilt plus a soft spotlight that follows the pointer.
   Off for reduced motion and for touch / coarse pointers.

   On a motion element (e.g. ProfileCard's motion.article):
     const tilt = useTilt<HTMLElement>()
     <motion.article ref={tilt.ref} style={tilt.style} {...tilt.handlers} className={`pcard ${tilt.className}`}>

   On a plain element, skip `style` and add the `tilt-css` class so the CSS variables drive the transform:
     <div ref={tilt.ref} {...tilt.handlers} className={`card ${tilt.className} tilt-css`}>
*/

const QUERY_FINE = '(hover: hover) and (pointer: fine)'
const QUERY_REDUCE = '(prefers-reduced-motion: reduce)'

function tiltAllowed(): boolean {
  try {
    return window.matchMedia(QUERY_FINE).matches && !window.matchMedia(QUERY_REDUCE).matches
  } catch {
    return false
  }
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export interface TiltStyle {
  rotateX: MotionValue<number>
  rotateY: MotionValue<number>
  transformPerspective: number
}

export interface TiltHandlers<T extends HTMLElement> {
  onPointerMove: (e: ReactPointerEvent<T>) => void
  onPointerLeave: (e: ReactPointerEvent<T>) => void
}

export interface Tilt<T extends HTMLElement> {
  ref: RefObject<T | null>
  /** Motion style (springs back smoothly). Only for motion.* elements. */
  style: TiltStyle
  handlers: TiltHandlers<T>
  /** Adds the spotlight layer. */
  className: string
}

/** @param max Maximum tilt in degrees (default 6). */
export function useTilt<T extends HTMLElement = HTMLElement>(max = 6): Tilt<T> {
  const ref = useRef<T>(null)
  const enabled = useRef(false)
  const frame = useRef(0)
  const rotateX = useSpring(0, { stiffness: 260, damping: 24, mass: 0.6 })
  const rotateY = useSpring(0, { stiffness: 260, damping: 24, mass: 0.6 })

  const reset = useCallback(
    (el: HTMLElement | null) => {
      cancelAnimationFrame(frame.current)
      rotateX.set(0)
      rotateY.set(0)
      if (!el) return
      el.style.setProperty('--tilt-x', '0deg')
      el.style.setProperty('--tilt-y', '0deg')
      delete el.dataset.tilting
    },
    [rotateX, rotateY],
  )

  useEffect(() => {
    const update = () => {
      enabled.current = tiltAllowed()
      if (!enabled.current) reset(ref.current)
    }
    update()
    let lists: MediaQueryList[] = []
    try {
      lists = [window.matchMedia(QUERY_FINE), window.matchMedia(QUERY_REDUCE)]
    } catch {
      lists = []
    }
    lists.forEach((l) => l.addEventListener('change', update))
    return () => {
      lists.forEach((l) => l.removeEventListener('change', update))
      cancelAnimationFrame(frame.current)
    }
  }, [reset])

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<T>) => {
      if (!enabled.current || e.pointerType === 'touch') return
      const el = ref.current ?? e.currentTarget
      const { clientX, clientY } = e
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) return
        const px = clamp01((clientX - r.left) / r.width)
        const py = clamp01((clientY - r.top) / r.height)
        const ry = (px - 0.5) * 2 * max
        const rx = -(py - 0.5) * 2 * max
        rotateX.set(rx)
        rotateY.set(ry)
        el.style.setProperty('--tilt-x', `${rx.toFixed(2)}deg`)
        el.style.setProperty('--tilt-y', `${ry.toFixed(2)}deg`)
        el.style.setProperty('--spot-x', `${(px * 100).toFixed(1)}%`)
        el.style.setProperty('--spot-y', `${(py * 100).toFixed(1)}%`)
        el.dataset.tilting = ''
      })
    },
    [max, rotateX, rotateY],
  )

  const onPointerLeave = useCallback((e: ReactPointerEvent<T>) => reset(ref.current ?? e.currentTarget), [reset])

  return {
    ref,
    style: { rotateX, rotateY, transformPerspective: 900 },
    handlers: { onPointerMove, onPointerLeave },
    className: 'tilt-surface',
  }
}
