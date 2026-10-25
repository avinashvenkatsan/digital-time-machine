import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Archive, Bookmark, CheckCircle2, Clock3, Compass, ExternalLink, Heart, Layers3, Search, ShieldCheck, Sparkles, Waypoints } from 'lucide-react'
import Navbar from './components/Navbar'
import SearchBox from './components/SearchBox'
import Timeline from './components/Timeline'
import ArchiveViewer from './components/ArchiveViewer'
import WebsiteCard from './components/WebsiteCard'
import { categories, featuredWebsites } from './data/websites'
import { archiveUrl, searchSnapshots } from './services/waybackService'
import type { Snapshot, WebsiteItem } from './types'
import { formatTimestamp, getDomain, normalizeWebsiteUrl, yearFromTimestamp } from './utils/url'

type RecentItem = { url: string; timestamp?: string; visitedAt: number }
const FAVORITES_KEY = 'dtm:favorites:v1'
const RECENTS_KEY = 'dtm:recents:v1'

function readStorage<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}

export default function App() {
  const [page, setPage] = useState('home')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ url: string; normalizedUrl: string; snapshots: Snapshot[] } | null>(null)
  const [selected, setSelected] = useState<Snapshot | null>(null)
  const [favorites, setFavorites] = useState<string[]>(() => readStorage(FAVORITES_KEY, []))
  const [recents, setRecents] = useState<RecentItem[]>(() => readStorage(RECENTS_KEY, []))
  const [category, setCategory] = useState('All websites')
  const [compareEarlier, setCompareEarlier] = useState('')
  const [compareLater, setCompareLater] = useState('')
  const [compareUrl, setCompareUrl] = useState('')
  const [compareResult, setCompareResult] = useState<{ url: string; normalizedUrl: string; snapshots: Snapshot[] } | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState('')
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'overlay'>('side-by-side')

  useEffect(() => localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)), [favorites])
  useEffect(() => localStorage.setItem(RECENTS_KEY, JSON.stringify(recents)), [recents])

  const runSearch = async (input: string, forceRefresh = false) => {
    setSearchInput(input); setError(''); setLoading(true); setPage('explore')
    try {
      const found = await searchSnapshots(input, forceRefresh)
      setResult(found); setSelected(found.snapshots[found.snapshots.length - 1] ?? null)
      const entry: RecentItem = { url: found.normalizedUrl, timestamp: found.snapshots[found.snapshots.length - 1]?.timestamp, visitedAt: Date.now() }
      setRecents(previous => [entry, ...previous.filter(item => item.url !== entry.url)].slice(0, 20))
    } catch (caught) {
      setResult(null); setSelected(null)
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const runCompareSearch = async (input: string) => {
    setCompareError(''); setCompareLoading(true)
    try {
      const found = await searchSnapshots(input)
      setCompareResult(found); setCompareUrl(found.normalizedUrl)
      setCompareEarlier(found.snapshots[0]?.timestamp ?? '')
      setCompareLater(found.snapshots[found.snapshots.length - 1]?.timestamp ?? '')
      if (!found.snapshots.length) setCompareError('No archived snapshots were found for this URL.')
    } catch (caught) { setCompareResult(null); setCompareError(caught instanceof Error ? caught.message : 'Could not load archive snapshots.') }
    finally { setCompareLoading(false) }
  }

  const toggleFavorite = (url: string) => setFavorites(previous => previous.includes(url) ? previous.filter(item => item !== url) : [url, ...previous])
  const explore = (url: string) => { setSearchInput(url); void runSearch(url) }
  const go = (nextPage: string) => { setPage(nextPage); setError('') }
  const displayedWebsites = useMemo(() => featuredWebsites.filter(site => category === 'All websites' || site.category === category), [category])
  const earlierSnapshot = compareResult?.snapshots.find(s => s.timestamp === compareEarlier)
  const laterSnapshot = compareResult?.snapshots.find(s => s.timestamp === compareLater)

  return (
    <div className="app-shell">
      <Navbar page={page} onNavigate={go} />
      <main>
        {page === 'home' && (
          <>
            <section className="hero section-wrap">
              <div className="hero-copy">
                <div className="pill-label"><span className="pulse-dot" /> THE INTERNET, THROUGH TIME</div>
                <h1>Travel through the <span>history</span> of the internet.</h1>
                <p className="hero-lead">Explore how websites looked in the past. Discover archived pages, compare designs across decades, and experience the evolution of the digital world.</p>
                <SearchBox onSearch={runSearch} loading={loading} />
                <div className="hero-proof"><span><ShieldCheck size={15} /> Real archive data</span><span><CheckCircle2 size={15} /> Free to explore</span><span><Clock3 size={15} /> Decades of history</span></div>
              </div>
              <div className="hero-art" aria-label="Illustration of an internet history timeline">
                <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
                <div className="time-core"><Clock3 size={53} strokeWidth={1.2} /><span>TIME<br/>TRAVEL</span></div>
                <div className="float-card float-card-top"><span className="mini-year">1998</span><strong>First steps</strong><small>The early web</small></div>
                <div className="float-card float-card-bottom"><span className="mini-year cyan">2025</span><strong>Modern web</strong><small>Always evolving</small></div>
                <div className="orbit-label label-left">1990s</div><div className="orbit-label label-right">TODAY</div>
              </div>
            </section>
            <section className="stats-strip section-wrap">
              <div><span className="stat-icon"><Archive size={18} /></span><span><strong>Real snapshots</strong><small>Powered by the Internet Archive</small></span></div>
              <div><span className="stat-icon violet"><Waypoints size={18} /></span><span><strong>Explore by year</strong><small>Find specific moments in time</small></span></div>
              <div><span className="stat-icon cyan"><Layers3 size={18} /></span><span><strong>Compare eras</strong><small>See how websites changed</small></span></div>
            </section>
            <section className="section-wrap section-block">
              <div className="section-heading"><div><span className="eyebrow">START YOUR JOURNEY</span><h2>Every website has a story.</h2><p>Pick a familiar corner of the web and see how it used to look.</p></div><button className="text-link" onClick={() => go('explore')}>Explore all sites <ArrowRight size={16} /></button></div>
              <div className="website-grid">{featuredWebsites.slice(0, 6).map(site => <WebsiteCard key={site.domain} website={site} onExplore={explore} />)}</div>
            </section>
            <section className="era-section"><div className="section-wrap era-inner"><div><span className="eyebrow">A JOURNEY THROUGH ERAS</span><h2>The web never stands still.</h2><p>From text-first homepages to immersive experiences, browse the design shifts that shaped the digital world.</p><button className="primary-button" onClick={() => go('explore')}>Start your journey <ArrowRight size={16} /></button></div><div className="era-list"><div><span>01</span><strong>The early web</strong><small>1990–1999</small><i /></div><div><span>02</span><strong>The social web</strong><small>2000–2009</small><i /></div><div><span>03</span><strong>Mobile-first</strong><small>2010–2019</small><i /></div><div><span>04</span><strong>The modern web</strong><small>2020–today</small><i /></div></div></div></section>
            <section className="section-wrap how-section"><div className="center-heading"><span className="eyebrow">SIMPLE BY DESIGN</span><h2>Three steps. A whole internet.</h2></div><div className="steps-grid"><article><span className="step-number">01</span><Search size={24}/><h3>Find a website</h3><p>Enter a public URL or choose a featured website to begin.</p></article><article><span className="step-number">02</span><Clock3 size={24}/><h3>Choose a moment</h3><p>Use real archived timestamps to navigate the website’s past.</p></article><article><span className="step-number">03</span><Compass size={24}/><h3>Explore its history</h3><p>Open an archived page or compare snapshots from different years.</p></article></div></section>
          </>
        )}

        {page === 'explore' && (
          <section className="section-wrap inner-page">
            <div className="page-intro"><span className="eyebrow">ARCHIVE EXPLORER</span><h1>Find a website in <span>time.</span></h1><p>Search the Internet Archive for real snapshots, then select a moment to open.</p></div>
            <SearchBox initialValue={searchInput} onSearch={runSearch} loading={loading} />
            {error && <div className="error-banner"><AlertTriangleIcon /> <div><strong>Search failed</strong><p>{error}</p></div><button className="outline-button" onClick={() => void runSearch(searchInput, true)}>Retry</button></div>}
            {loading && <div className="loading-state"><span className="spinner large" /><h3>Searching the archive…</h3><p>Checking available snapshots for your website.</p></div>}
            {result && !loading && <>
              <div className="result-header"><div><span className="eyebrow">SEARCH RESULTS</span><h2>{getDomain(result.normalizedUrl)}</h2><p>{result.normalizedUrl}</p></div><button className={`outline-button ${favorites.includes(result.normalizedUrl) ? 'favorite-on' : ''}`} onClick={() => toggleFavorite(result.normalizedUrl)}><Heart size={16} fill={favorites.includes(result.normalizedUrl) ? 'currentColor' : 'none'} /> {favorites.includes(result.normalizedUrl) ? 'Saved' : 'Add to favorites'}</button></div>
              {result.snapshots.length > 0 && <div className="range-cards"><div><small>EARLIEST SNAPSHOT</small><strong>{yearFromTimestamp(result.snapshots[0].timestamp)}</strong><span>{formatTimestamp(result.snapshots[0].timestamp)}</span></div><div><small>LATEST SNAPSHOT</small><strong>{yearFromTimestamp(result.snapshots.at(-1)!.timestamp)}</strong><span>{formatTimestamp(result.snapshots.at(-1)!.timestamp)}</span></div><div><small>YEARS COVERED</small><strong>{new Set(result.snapshots.map(s => yearFromTimestamp(s.timestamp))).size}</strong><span>Years with snapshots</span></div></div>}
              <div className="explorer-grid"><Timeline url={result.normalizedUrl} snapshots={result.snapshots} selected={selected} onSelect={setSelected}/><ArchiveViewer url={result.normalizedUrl} snapshot={selected}/></div>
            </>}
            {!result && !loading && !error && <div className="explore-welcome"><div className="empty-icon"><Search size={25}/></div><h3>Your next discovery is one search away.</h3><p>Start with a URL above, or choose a featured website below.</p><div className="mini-site-list">{featuredWebsites.slice(0, 4).map(site => <button key={site.domain} onClick={() => explore(site.domain)}>{site.name}<span>{site.domain}</span><ArrowRight size={15}/></button>)}</div></div>}
          </section>
        )}

        {page === 'compare' && (
          <section className="section-wrap inner-page">
            <div className="page-intro"><span className="eyebrow">COMPARISON STUDIO</span><h1>Then vs. <span>now.</span></h1><p>Choose two real archived snapshots and open them side by side.</p></div>
            <div className="compare-search"><SearchBox onSearch={runCompareSearch} loading={compareLoading} compact/><p>Search a site to load its available snapshot dates.</p></div>
            {compareError && <div className="error-banner"><AlertTriangleIcon/><div><strong>Could not prepare comparison</strong><p>{compareError}</p></div></div>}
            {compareLoading && <div className="loading-state"><span className="spinner large"/><h3>Finding snapshots…</h3></div>}
            {compareResult && compareResult.snapshots.length > 0 && <>
              <div className="compare-controls"><div><label htmlFor="earlier">Earlier snapshot</label><select id="earlier" value={compareEarlier} onChange={e => setCompareEarlier(e.target.value)}>{compareResult.snapshots.map(s => <option key={s.timestamp} value={s.timestamp}>{formatTimestamp(s.timestamp)}</option>)}</select></div><div><label htmlFor="later">Later snapshot</label><select id="later" value={compareLater} onChange={e => setCompareLater(e.target.value)}>{compareResult.snapshots.map(s => <option key={s.timestamp} value={s.timestamp}>{formatTimestamp(s.timestamp)}</option>)}</select></div><div className="compare-mode"><button className={compareMode === 'side-by-side' ? 'mode-active' : ''} onClick={() => setCompareMode('side-by-side')}>Side by side</button><button className={compareMode === 'overlay' ? 'mode-active' : ''} onClick={() => setCompareMode('overlay')}>Overlay</button></div></div>
              <div className={`compare-grid ${compareMode === 'overlay' ? 'compare-overlay' : ''}`}>
                {[{label:'EARLIER VERSION',snap:earlierSnapshot},{label:'LATER VERSION',snap:laterSnapshot}].map(({label,snap}) => <article className="compare-card" key={label}><div className="compare-card-head"><span className="eyebrow">{label}</span><strong>{snap ? formatTimestamp(snap.timestamp) : 'Choose a date'}</strong></div>{snap ? <><div className="compare-preview"><div className="browser-chrome"><span/><span/><span/><div className="browser-address">{archiveUrl(snap, compareUrl)}</div></div><div className="compare-placeholder"><Clock3 size={28}/><strong>{yearFromTimestamp(snap.timestamp)}</strong><span>Historical website snapshot</span></div></div><a className="primary-button full-button" href={archiveUrl(snap, compareUrl)} target="_blank" rel="noreferrer">Open this version <ExternalLink size={15}/></a></> : <p>No snapshot selected.</p>}</article>)}
              </div>
              <p className="subtle-note">This studio compares archive dates and provides independent links to each version. It does not calculate visual difference percentages or capture screenshots.</p>
            </>}
          </section>
        )}

        {page === 'favorites' && (
          <section className="section-wrap inner-page">
            <div className="page-intro"><span className="eyebrow">YOUR COLLECTION</span><h1>Saved for <span>later.</span></h1><p>Your favorites stay in this browser. No account required.</p></div>
            {favorites.length ? <div className="website-grid">{favorites.map(url => { const site = featuredWebsites.find(item => item.domain === getDomain(url)); const item: WebsiteItem = site ?? { name: getDomain(url), domain: getDomain(url), category: 'Saved website', description: url }; return <article className="website-card" key={url}><div className="site-card-top"><span className="site-icon"><Bookmark size={20}/></span><button className="remove-fav" onClick={() => toggleFavorite(url)} aria-label={`Remove ${url} from favorites`}><Heart size={17} fill="currentColor"/></button></div><h3>{item.name}</h3><p className="site-domain">{url}</p><p className="site-description">Saved website. Search the archive to discover its available history.</p><button className="card-action" onClick={() => explore(url)}>Explore history <ArrowRight size={16}/></button></article>})}</div> : <div className="empty-state"><div className="empty-icon"><Heart size={25}/></div><h3>No favorites yet</h3><p>Search for a website and select “Add to favorites” to save it here.</p><button className="primary-button" onClick={() => go('explore')}>Explore websites <ArrowRight size={16}/></button></div>}
            <div className="section-subheading"><h2>Recently explored</h2><button className="text-link" onClick={() => { setRecents([]); localStorage.removeItem(RECENTS_KEY) }}>Clear history</button></div>
            {recents.length ? <div className="recent-list">{recents.map(item => <button key={item.url} onClick={() => explore(item.url)}><span className="recent-icon"><Clock3 size={17}/></span><span><strong>{getDomain(item.url)}</strong><small>{item.timestamp ? `Last selected: ${formatTimestamp(item.timestamp)}` : 'No snapshot selected'}</small></span><ArrowRight size={16}/></button>)}</div> : <p className="muted-paragraph">Your recent searches will appear here.</p>}
          </section>
        )}

        {page === 'about' && (
          <section className="section-wrap inner-page about-page">
            <div className="page-intro"><span className="eyebrow">ABOUT THE PROJECT</span><h1>Remembering the <span>web.</span></h1><p>Digital Time Machine makes the history of websites easier to explore, one archived snapshot at a time.</p></div>
            <div className="about-hero"><div className="about-symbol"><Clock3 size={42}/></div><div><h2>The internet is always changing.</h2><p>Pages disappear, designs evolve, and digital culture moves forward. This project helps people discover what public websites looked like at different points in time.</p></div></div>
            <div className="about-grid"><article><Archive size={23}/><h3>Historical data</h3><p>Snapshot information comes from the Internet Archive’s CDX index API. Results are displayed only when returned by the service.</p><a className="text-link" href="https://web.archive.org/" target="_blank" rel="noreferrer">Visit Wayback Machine <ExternalLink size={14}/></a></article><article><ShieldCheck size={23}/><h3>Respectful isolation</h3><p>Archived pages open on the Internet Archive in a separate tab. They are external, untrusted content and may be incomplete.</p></article><article><Sparkles size={23}/><h3>Built for discovery</h3><p>Search websites, navigate years, save favorites locally, and choose two snapshots for a time-based comparison.</p></article></div>
            <div className="about-note"><h3>Important limitations</h3><ul><li>Not every website or date has an archived snapshot.</li><li>Archived pages may have missing images, scripts, media, or interactions.</li><li>Snapshot availability and CDX API access depend on the Internet Archive.</li><li>Favorites and recent searches are stored only in this browser and do not sync across devices.</li><li>Comparison provides date selection and archive links; automated screenshot-difference analysis is not included.</li></ul></div>
          </section>
        )}
      </main>
      <footer className="footer"><div className="section-wrap footer-inner"><div><div className="footer-brand"><Clock3 size={19}/> Digital Time Machine</div><p>Explore the past. Understand the web. Discover how the internet evolved.</p></div><div className="footer-links"><button onClick={() => go('about')}>About</button><a href="https://web.archive.org/" target="_blank" rel="noreferrer">Internet Archive <ExternalLink size={12}/></a><a href="https://github.com/" target="_blank" rel="noreferrer">GitHub <ExternalLink size={12}/></a></div></div><div className="section-wrap footer-bottom"><span>Independent educational project</span><span>Historical data provided by the Internet Archive</span></div></footer>
    </div>
  )
}

function AlertTriangleIcon() {
  return <span className="error-icon">!</span>
}