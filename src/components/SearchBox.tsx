import { ArrowRight, Globe2, Shuffle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { featuredWebsites } from '../data/websites'

interface Props {
  initialValue?: string
  loading?: boolean
  onSearch: (url: string) => void
  compact?: boolean
}
export default function SearchBox({ initialValue = '', loading = false, onSearch, compact = false }: Props) {
  const [value, setValue] = useState(initialValue)
  const submit = (event: FormEvent) => { event.preventDefault(); onSearch(value) }
  const surprise = () => {
    const site = featuredWebsites[Math.floor(Math.random() * featuredWebsites.length)]
    setValue(site.domain)
    onSearch(site.domain)
  }
  return (
    <form className={`search-box ${compact ? 'search-compact' : ''}`} onSubmit={submit}>
      <Globe2 className="search-globe" size={21} />
      <input
        value={value}
        onChange={event => setValue(event.target.value)}
        placeholder="Enter a website URL, e.g. google.com"
        aria-label="Website URL"
        inputMode="url"
      />
      <button className="search-submit" type="submit" disabled={loading || !value.trim()}>
        {loading ? <span className="spinner" /> : <>Explore history <ArrowRight size={17} /></>}
      </button>
      {!compact && <button type="button" className="surprise-button" onClick={surprise} disabled={loading}><Shuffle size={15} /> Surprise me</button>}
    </form>
  )
}