import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpToLine, CalendarDays, ExternalLink } from 'lucide-react'
import type { Snapshot } from '../types'
import { archiveUrl } from '../services/waybackService'
import { formatTimestamp, yearFromTimestamp } from '../utils/url'

interface Props {
  url: string
  snapshots: Snapshot[]
  selected: Snapshot | null
  onSelect: (snapshot: Snapshot) => void
}
export default function Timeline({ url, snapshots, selected, onSelect }: Props) {
  const years = [...new Set(snapshots.map(s => yearFromTimestamp(s.timestamp)))]
  const [first, last] = [snapshots[0], snapshots[snapshots.length - 1]]
  const index = selected ? snapshots.findIndex(s => s.timestamp === selected.timestamp) : -1
  const jumpYear = (year: string) => {
    const match = snapshots.find(s => yearFromTimestamp(s.timestamp) === year)
    if (match) onSelect(match)
  }
  if (!snapshots.length) return (
    <div className="empty-state">
      <div className="empty-icon"><CalendarDays size={25} /></div>
      <h3>No archived snapshots found</h3>
      <p>The Internet Archive did not return snapshots for this URL. Try the domain homepage or another website.</p>
    </div>
  )
  return (
    <section className="timeline-panel">
      <div className="timeline-summary">
        <div><span className="eyebrow">ARCHIVE TIMELINE</span><h2>{snapshots.length.toLocaleString()} <span>available snapshots</span></h2></div>
        <a className="text-link" href="https://web.archive.org/" target="_blank" rel="noreferrer">Wayback Machine <ExternalLink size={14} /></a>
      </div>
      <div className="year-strip" aria-label="Available years">
        {years.map(year => <button key={year} onClick={() => jumpYear(year)} className={`year-chip ${selected && yearFromTimestamp(selected.timestamp) === year ? 'selected' : ''}`}>{year}</button>)}
      </div>
      <div className="timeline-track-wrap">
        <div className="timeline-track">
          {years.map((year, i) => (
            <button key={year} className={`timeline-point ${selected && yearFromTimestamp(selected.timestamp) === year ? 'selected' : ''}`} style={{ left: `${years.length === 1 ? 50 : (i / (years.length - 1)) * 100}%` }} onClick={() => jumpYear(year)} aria-label={`Select year ${year}`}>
              <span className="point-dot" /><span className="point-year">{year}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="snapshot-nav">
        <button className="outline-button" onClick={() => onSelect(first)}><ArrowUpToLine size={15} /> Earliest</button>
        <button className="outline-button" disabled={index <= 0} onClick={() => onSelect(snapshots[index - 1])}><ArrowLeft size={15} /> Previous</button>
        <button className="outline-button" disabled={index < 0 || index >= snapshots.length - 1} onClick={() => onSelect(snapshots[index + 1])}>Next <ArrowRight size={15} /></button>
        <button className="outline-button" onClick={() => onSelect(last)}><ArrowDownToLine size={15} /> Latest</button>
      </div>
      <div className="snapshot-list-heading"><h3>Snapshots</h3><span>Oldest to newest</span></div>
      <div className="snapshot-list">
        {snapshots.slice(-100).reverse().map(snapshot => (
          <article className={`snapshot-row ${selected?.timestamp === snapshot.timestamp ? 'snapshot-active' : ''}`} key={snapshot.timestamp}>
            <button className="snapshot-select" onClick={() => onSelect(snapshot)}>
              <span className="snapshot-dot" />
              <span><strong>{formatTimestamp(snapshot.timestamp)}</strong><small>{snapshot.timestamp}</small></span>
            </button>
            <a className="row-open" href={archiveUrl(snapshot, url)} target="_blank" rel="noreferrer" aria-label={`Open snapshot from ${snapshot.timestamp}`}><ExternalLink size={16} /></a>
          </article>
        ))}
      </div>
      {snapshots.length > 100 && <p className="subtle-note">Showing the 100 most recent snapshots in this list. The timeline and year selectors use all returned results.</p>}
    </section>
  )
}
