import './MarqueeStrip.css'

const ITEMS = ['Team Registration', 'Live Scoring', 'Real-Time Brackets']

export default function MarqueeStrip() {
  return (
    <div className="MarqueeStrip">
      <div className="MarqueeStrip-row">
        {ITEMS.map((item, i) => (
          <span className="MarqueeStrip-item" key={item}>
            {item}
            {i < ITEMS.length - 1 && <span className="MarqueeStrip-sparkle">✦</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
