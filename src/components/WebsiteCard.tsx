import { ArrowUpRight, Globe2 } from 'lucide-react'
import type { WebsiteItem } from '../types'
interface Props { website: WebsiteItem; onExplore: (domain: string) => void }
export default function WebsiteCard({ website, onExplore }: Props) {
  return (
    <article className="website-card">
      <div className="site-card-top"><span className="site-icon"><Globe2 size={20} /></span><span className="category-tag">{website.category}</span></div>
      <h3>{website.name}</h3><p className="site-domain">{website.domain}</p><p className="site-description">{website.description}</p>
      <button className="card-action" onClick={() => onExplore(website.domain)}>Explore history <ArrowUpRight size={16} /></button>
    </article>
  )
}