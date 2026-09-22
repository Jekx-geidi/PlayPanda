import './MarqueeStrip.css'

const DEFAULT_ITEMS = ['Team Registration', 'Live Scoring', 'Real-Time Brackets']

interface MarqueeStripProps {
  items?: string[]
  compact?: boolean
}

export default function MarqueeStrip({ items = DEFAULT_ITEMS, compact = false }: MarqueeStripProps) {
  return (
    <div className={`MarqueeStrip${compact ? ' MarqueeStrip--compact' : ''}`}>
      <div className="MarqueeStrip-row">
        {items.map((item, i) => (
          <span className="MarqueeStrip-item" key={item}>
            {item}
            {i < items.length - 1 && <span className="MarqueeStrip-sparkle">✦</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
