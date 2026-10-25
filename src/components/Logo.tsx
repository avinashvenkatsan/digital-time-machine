import { Clock3 } from 'lucide-react'

export default function Logo() {
  return (
    <a className="brand" href="#home" aria-label="Digital Time Machine home">
      <span className="brand-mark"><Clock3 size={21} strokeWidth={2.2} /></span>
      <span>digital<span className="brand-accent">time</span>machine</span>
    </a>
  )
}