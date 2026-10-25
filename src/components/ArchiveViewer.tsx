import { AlertTriangle, ExternalLink, Globe, ShieldCheck } from 'lucide-react'
import type { Snapshot } from '../types'
import { archiveUrl } from '../services/waybackService'
import { formatTimestamp } from '../utils/url'

interface Props { url: string; snapshot: Snapshot | null }
export default function ArchiveViewer({ url, snapshot }: Props) {
  if (!snapshot) return (
    <div className="viewer-placeholder">
      <div className="viewer-orbit"><Globe size={35} /></div>
      <h3>Your time-travel window</h3>
      <p>Select an available snapshot from the timeline to open its archived version.</p>
    </div>
  )
  const archived = archiveUrl(snapshot, url)
  return (
    <section className="viewer-panel">
      <div className="viewer-topline"><span className="live-dot" /> ARCHIVED SNAPSHOT <span className="archive-source"><ShieldCheck size={13} /> Internet Archive</span></div>
      <div className="viewer-date"><span className="eyebrow">SELECTED MOMENT</span><h2>{formatTimestamp(snapshot.timestamp)}</h2><p>{url}</p></div>
      <div className="viewer-preview">
        <div className="browser-chrome"><span /><span /><span /><div className="browser-address">{archived}</div></div>
        <div className="preview-content">
          <div className="preview-icon"><Globe size={27} /></div>
          <h3>Ready to step back in time?</h3>
          <p>Open this verified archive URL in a separate tab. Archived content stays isolated from this app.</p>
          <a className="primary-button" href={archived} target="_blank" rel="noreferrer">Open archived website <ExternalLink size={16} /></a>
        </div>
      </div>
      <div className="viewer-actions">
        <a className="outline-button" href={archived} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open archived page</a>
        <a className="outline-button" href={url} target="_blank" rel="noreferrer"><Globe size={15} /> Open original</a>
      </div>
      <div className="notice"><AlertTriangle size={17} /><p><strong>Archive note</strong> Some images, scripts, videos, forms, or interactive features may be missing or no longer work in historical snapshots.</p></div>
    </section>
  )
}