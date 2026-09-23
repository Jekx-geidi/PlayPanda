import { act, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlayPandaMascot, type MascotHandle } from './PlayPandaMascot'

let reduced = false
let fine = true
beforeEach(() => {
  reduced = false
  fine = true
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduced-motion') ? reduced : fine,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 16))
  vi.stubGlobal('cancelAnimationFrame', clearTimeout)
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('PlayPandaMascot', () => {
  it('smoothly looks at a target and returns to neutral without moving its layout wrapper', () => {
    const ref = createRef<MascotHandle>()
    const { container } = render(<PlayPandaMascot ref={ref} />)
    const element = document.createElement('input')
    document.body.append(element)
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ left: 800, top: 500, width: 100, height: 40 } as DOMRect)
    act(() => { ref.current?.lookAt(element); vi.advanceTimersByTime(1500) })
    const face = container.querySelector<HTMLElement>('.PlayPandaMascot-face')!
    expect(face.style.transform).toContain('translate3d(4px, 3px')
    expect(container.firstElementChild?.getAttribute('style')).not.toContain('transform')
    act(() => { ref.current?.lookAt(null); vi.advanceTimersByTime(2000) })
    expect(face.style.transform).toContain('translate3d(0px, 0px')
    element.remove()
  })

  it('stays static with reduced motion and does not animate a poke', () => {
    reduced = true
    const animate = vi.fn()
    const { container } = render(<PlayPandaMascot />)
    const reaction = container.querySelector<HTMLElement>('.PlayPandaMascot-reaction')!
    reaction.animate = animate
    fireEvent.click(screen.getByRole('button', { name: /playful poke/i }))
    act(() => vi.advanceTimersByTime(2000))
    expect(animate).not.toHaveBeenCalled()
    expect(container.querySelector<HTMLElement>('.PlayPandaMascot-face')!.style.transform).toBe('')
  })

  it('does not subscribe to pointer movement on touch devices, but still supports target looking', () => {
    fine = false
    const listener = vi.spyOn(window, 'addEventListener')
    const ref = createRef<MascotHandle>()
    const { unmount } = render(<PlayPandaMascot ref={ref} />)
    expect(listener.mock.calls.some(([event]) => event === 'pointermove')).toBe(false)
    expect(ref.current?.lookAt).toBeTypeOf('function')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cleans pending frames and idle timers when unmounted', () => {
    const { unmount } = render(<PlayPandaMascot />)
    fireEvent.pointerMove(window, { clientX: 1000, clientY: 500, pointerType: 'mouse' })
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
