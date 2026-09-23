import { useEffect, useRef } from 'react'

export function useMascotTracking(tracking: boolean, intensity: number) {
  const frame = useRef<HTMLDivElement>(null)
  const face = useRef<HTMLDivElement>(null)
  const target = useRef<HTMLElement | null>(null)
  const update = useRef<() => void>(() => {})

  useEffect(() => {
    const host = frame.current
    const artwork = face.current
    if (!host || !artwork || !window.matchMedia) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(any-pointer: fine)')
    let bounds = host.getBoundingClientRect()
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0
    let idle: ReturnType<typeof setTimeout> | undefined
    const strength = Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 1
    const animate = () => {
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      const settled = Math.abs(tx - x) + Math.abs(ty - y) < 0.001
      if (settled) { x = tx; y = ty }
      artwork.style.transform = `translate3d(${x * 4}px, ${y * 3}px, 0) rotateX(${-y * 3}deg) rotateY(${x * 4}deg) rotateZ(${x * 2}deg)`
      raf = settled ? 0 : requestAnimationFrame(animate)
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(animate) }
    const aim = (px: number, py: number) => {
      if (!tracking || reduced.matches || document.hidden) return
      tx = Math.max(-1, Math.min(1, (px - bounds.left - bounds.width / 2) / Math.max(160, window.innerWidth / 2))) * strength
      ty = Math.max(-1, Math.min(1, (py - bounds.top - bounds.height * 0.45) / Math.max(160, window.innerHeight / 2))) * strength
      schedule()
    }
    const neutral = () => { clearTimeout(idle); tx = 0; ty = 0; schedule() }
    const look = () => {
      if (target.current?.isConnected) {
        const rect = target.current.getBoundingClientRect()
        aim(rect.left + rect.width / 2, rect.top + rect.height / 2)
      } else neutral()
    }
    update.current = look
    const pointer = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType === 'touch') return
      if (target.current) return
      aim(event.clientX, event.clientY)
      clearTimeout(idle)
      idle = setTimeout(neutral, 1800)
    }
    const measure = () => { bounds = host.getBoundingClientRect(); look() }
    const reset = () => {
      window.removeEventListener('pointermove', pointer)
      if (fine.matches && tracking && !reduced.matches && !document.hidden) {
        window.addEventListener('pointermove', pointer, { passive: true })
      }
      clearTimeout(idle)
      cancelAnimationFrame(raf)
      raf = 0
      x = y = tx = ty = 0
      artwork.style.transform = ''
      if (!reduced.matches && !document.hidden) look()
    }
    const exit = (event: PointerEvent) => { if (!event.relatedTarget) neutral() }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(host)
    document.addEventListener('pointerout', exit)
    window.addEventListener('blur', neutral)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true, capture: true })
    document.addEventListener('visibilitychange', reset)
    reduced.addEventListener('change', reset)
    fine.addEventListener('change', reset)
    reset()
    return () => {
      clearTimeout(idle)
      cancelAnimationFrame(raf)
      observer?.disconnect()
      update.current = () => {}
      artwork.style.transform = ''
      window.removeEventListener('pointermove', pointer)
      document.removeEventListener('pointerout', exit)
      window.removeEventListener('blur', neutral)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      document.removeEventListener('visibilitychange', reset)
      reduced.removeEventListener('change', reset)
      fine.removeEventListener('change', reset)
    }
  }, [tracking, intensity])

  return { frame, face, lookAt: (element: HTMLElement | null) => { target.current = element; update.current() } }
}
