import { useRef, type FocusEvent, type PointerEvent, type MouseEvent } from 'react'
import type { MascotHandle } from './PlayPandaMascot'

/** Scope event delegation to a form/card; focused fields take priority over the pointer. */
export function useMascotTargets() {
  const mascot = useRef<MascotHandle>(null)
  const focused = useRef<HTMLElement | null>(null)
  const hovered = useRef<HTMLElement | null>(null)
  const sync = () => mascot.current?.lookAt(focused.current ?? hovered.current)
  const target = (element: EventTarget | null) => element instanceof HTMLElement ? element.closest<HTMLElement>('input, button, select, textarea') : null
  return { mascot, targetEvents: {
    onFocusCapture: (event: FocusEvent<HTMLElement>) => { focused.current = target(event.target); sync() },
    onBlurCapture: () => { focused.current = null; sync() },
    onPointerOver: (event: PointerEvent<HTMLElement>) => { if (event.pointerType !== 'touch') { hovered.current = target(event.target); sync() } },
    onPointerOut: (event: PointerEvent<HTMLElement>) => { hovered.current = target(event.relatedTarget); sync() },
    onClickCapture: (event: MouseEvent<HTMLElement>) => { if (target(event.target)?.tagName === 'BUTTON') mascot.current?.react() },
  } }
}
