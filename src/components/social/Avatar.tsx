import { useState } from 'react'
import { initialsOf } from '../../lib/players'
import '../../pages/PlayersPage.css'

/** Player avatar: the https image when it loads, otherwise initials. */
export default function Avatar({ name, url, size = 'md' }: { name: string; url: string | null; size?: 'md' | 'lg' }) {
  const [broken, setBroken] = useState(false)
  return (
    <span className={`Avatar Avatar--${size}`} aria-hidden="true">
      {url && !broken ? <img src={url} alt="" onError={() => setBroken(true)} /> : initialsOf(name)}
    </span>
  )
}
