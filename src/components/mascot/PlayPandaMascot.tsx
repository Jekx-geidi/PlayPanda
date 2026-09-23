import { useImperativeHandle, useRef, type CSSProperties, type ReactNode, type Ref } from 'react'
import { useMascotTracking } from './useMascotTracking'
import './playpanda-mascot.css'

export interface MascotHandle {
  lookAt: (element: HTMLElement | null) => void
  react: () => void
}

interface Props {
  ref?: Ref<MascotHandle>
  size?: 'small' | 'medium' | 'large' | number
  className?: string
  layout?: 'block' | 'inline'
  tracking?: boolean
  intensity?: number
  expression?: 'normal' | 'happy' | 'surprised'
  clickReaction?: boolean
  /** Future layered artwork can replace the flattened sheet without changing tracking. */
  children?: ReactNode
}

export function PlayPandaMascot({ ref, size = 'large', className = '', layout = 'block', tracking = true, intensity = 1, expression = 'normal', clickReaction = true, children }: Props) {
  const { frame, face, lookAt } = useMascotTracking(tracking, intensity)
  const reaction = useRef<HTMLSpanElement>(null)
  const react = () => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const element = reaction.current
    if (!element) return
    element.getAnimations?.().forEach(animation => animation.cancel())
    element.animate?.([
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(-4px) scale(1.025)', offset: 0.4 },
      { transform: 'translateY(0) scale(1)' },
    ], { duration: 420, easing: 'ease-out' })
  }
  useImperativeHandle(ref, () => ({ lookAt, react }))
  const style = { '--mascot-size': typeof size === 'number' ? `${Math.max(48, size)}px` : { small: '120px', medium: '200px', large: '320px' }[size] } as CSSProperties
  const art = <span ref={reaction} className="PlayPandaMascot-reaction"><span className={`PlayPandaMascot-crop PlayPandaMascot-crop--${expression}`}>
    {children ?? <img src="/images/playpanda-expression-sheet.png" alt="" draggable={false} width="1774" height="887" />}
  </span></span>
  return <div ref={frame} className={`PlayPandaMascot PlayPandaMascot--${layout} ${className}`} style={style}>
    <div ref={face} className="PlayPandaMascot-face">
      {clickReaction ? <button type="button" className="PlayPandaMascot-poke" aria-label="Give PlayPanda a playful poke" onClick={react}>{art}</button> : <span aria-hidden="true">{art}</span>}
    </div>
  </div>
}
