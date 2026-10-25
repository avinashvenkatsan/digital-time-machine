
import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  ExternalLink,
  Globe2,
  History,
  LoaderCircle,
  Search,
  Sparkles,
  Waypoints,
} from 'lucide-react'
import './App.css'

type Snapshot = {
  timestamp: string
  status: string
  original: string
}

type Website = {
  name: string
  url: string
  description: string
  category: string
  color: string
}

const websites: Website[] = [
  {
    name: 'Google',
    url: 'https://www.google.com',
    description: 'The search engine that changed how the world finds information.',
    category: 'Technology',
    color: '#4285f4',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com',
    description: 'Explore the evolution of online video and creator culture.',
    category: 'Entertainment',
    color: '#ff4545',
  },
  {
    name: 'Wikipedia',
    url: 'https://www.wikipedia.org',
    description: 'Discover the history of the internet’s global encyclopedia.',
    category: 'Education',
    color: '#b8c5d9',
  },
  {
    name: 'Amazon',
    url: 'https://www.amazon.com',
    description: 'See how a bookstore grew into a global marketplace.',
    category: 'Shopping',
    color: '#f4a340',
  },
  {
    name: 'Apple',
    url: 'https://www.apple.com',
    description: 'Trace the design history of one of technology’s best-known brands.',
    category: 'Technology',
    color: '#a8b3c7',
  },
  {
    name: 'NASA',
    url: 'https://www.nasa.gov',
    description: 'Explore the changing digital face of space exploration.',
    category: 'Science',
    color: '#8ba8ff',
  },
]

const categories = ['All', ...new Set(websites.map((site) => site.category))]

function formatDate(timestamp: string) {
  const year = timestamp.slice(0, 4)
  const month = timestamp.slice(4, 6)
  const day = timestamp.slice(6, 8)

  return `${year}-${month}-${day}`
}

function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [searchedUrl, setSearchedUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSnapshot, setSelectedSnapshot] = useState('')

  const displayedWebsites = websites.filter((site) => {
    const matchesCategory = category === 'All' || site.category === category
    const search = query.trim().toLowerCase()
    const matchesSearch =
      !search ||
      site.name.toLowerCase().includes(search) ||
      site.url.toLowerCase().includes(search) ||
      site.description.toLowerCase().includes(search)

    return matchesCategory && matchesSearch
  })

  async function searchWebsite(input: string) {
    const value = input.trim()

    if (!value) {
      setError('Enter a website URL to explore its history.')
      return
    }

    let url = value
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`
    }

    let parsedUrl: URL

    try {
      parsedUrl = new URL(url)
    } catch {
      setError('That URL does not look valid. Please check it and try again.')
      return
    }

    if (!parsedUrl.hostname.includes('.')) {
      setError('Enter a full domain, such as example.com.')
      return
    }

    const domain = parsedUrl.hostname
    const normalizedUrl = `https://${domain}`

    setLoading(true)
    setError('')
    setSnapshots([])
    setSelectedSnapshot('')
    setSearchedUrl(normalizedUrl)

    try {
      const endpoint =
        'https://web.archive.org/cdx/search/cdx' +
        `?url=${encodeURIComponent(domain)}` +
        '&output=json&fl=timestamp,original,statuscode' +
        '&filter=statuscode:200' +
        '&collapse=timestamp:4' +
        '&filter=timestamp:1990|1991|1992|1993|1994|1995|1996|1997|1998|1999|200[0-9]|201[0-9]|202[0-9]' +
        '&from=1990&to=2026'

      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error('The Internet Archive could not be reached. Try again shortly.')
      }

      const data: string[][] = await response.json()

      const results: Snapshot[] = data
        .slice(1)
        .filter((row) => row.length >= 3)
        .map((row) => ({
          timestamp: row[0],
          original: row[1],
          status: row[2],
        }))
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

      setSnapshots(results)

      if (results.length === 0) {
        setError(
          'No matching archived snapshots were found. Try the domain without a page path.',
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} If this persists, the archive may be temporarily unavailable.`
          : 'Something went wrong while searching the archive.',
      )
    } finally {
      setLoading(false)
    }
  }

  function openSnapshot(snapshot: Snapshot) {
    const archiveUrl = `https://web.archive.org/web/${snapshot.timestamp}/${snapshot.original}`
    window.open(archiveUrl, '_blank', 'noopener,noreferrer')
  }

  function openSelectedSnapshot() {
    if (!selectedSnapshot) return

    const snapshot = snapshots.find(
      (item) => item.timestamp === selectedSnapshot,
    )

    if (snapshot) openSnapshot(snapshot)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Digital Time Machine home">
          <span className="brand-icon">
            <History size={22} />
          </span>
          <span>
            <strong>Digital Time Machine</strong>
            <small>WEBSITE EVOLUTION EXPLORER</small>
          </span>
        </a>

        <span className="archive-status">
          <span className="status-dot" />
          INTERNET ARCHIVE EXPLORER
        </span>
      </header>

      <section className="hero">
        <div className="eyebrow">
          <Sparkles size={15} />
          THE INTERNET, THROUGH TIME
        </div>

        <h1>
          Every website has
          <br />
          <span>a story to tell.</span>
        </h1>

        <p className="hero-copy">
          Travel back through the history of the web. Discover how your
          favourite websites looked years ago and explore the moments that
          shaped the digital world.
        </p>

        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault()
            void searchWebsite(query)
          }}
        >
          <Globe2 size={21} className="search-globe" />
          <input
            aria-label="Website URL"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Enter a website URL — e.g. google.com"
          />
          <button type="submit" disabled={loading}>
            {loading ? (
              <LoaderCircle size={18} className="spin" />
            ) : (
              <Search size={18} />
            )}
            {loading ? 'Searching' : 'Explore history'}
          </button>
        </form>

        <div className="search-hint">
          <Clock3 size={14} />
          Explore archived snapshots from the early web to today
        </div>
      </section>

      {error && (
        <div className="message error-message" role="status">
          {error}
        </div>
      )}

      {searchedUrl && (
        <section className="results-section">
          <div className="section-heading">
            <div>
              <div className="section-kicker">ARCHIVE SEARCH</div>
              <h2>Website timeline</h2>
              <p className="muted">{searchedUrl}</p>
            </div>
            <span className="result-count">
              {loading
                ? 'Searching archive…'
                : `${snapshots.length} snapshots`}
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <LoaderCircle size={28} className="spin" />
              <p>Searching the Internet Archive…</p>
            </div>
          ) : snapshots.length > 0 ? (
            <>
              <div className="timeline">
                {snapshots.map((snapshot, index) => (
                  <button
                    className="timeline-item"
                    key={`${snapshot.timestamp}-${index}`}
                    onClick={() => openSnapshot(snapshot)}
                    type="button"
                  >
                    <span className="timeline-marker">
                      <History size={16} />
                    </span>
                    <span className="timeline-date">
                      {formatDate(snapshot.timestamp)}
                    </span>
                    <span className="timeline-url">
                      {snapshot.original}
                    </span>
                    <ExternalLink size={16} className="external-icon" />
                  </button>
                ))}
              </div>

              <div className="snapshot-picker">
                <label htmlFor="snapshot-select">Jump to a snapshot</label>
                <select
                  id="snapshot-select"
                  value={selectedSnapshot}
                  onChange={(event) => setSelectedSnapshot(event.target.value)}
                >
                  <option value="">Choose an archived date</option>
                  {snapshots.map((snapshot, index) => (
                    <option
                      key={`${snapshot.timestamp}-option-${index}`}
                      value={snapshot.timestamp}
                    >
                      {formatDate(snapshot.timestamp)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openSelectedSnapshot}
                  disabled={!selectedSnapshot}
                >
                  Open snapshot <ExternalLink size={15} />
                </button>
              </div>
            </>
          ) : null}
        </section>
      )}

      <section className="discovery-section">
        <div className="section-heading">
          <div>
            <div className="section-kicker">START EXPLORING</div>
            <h2>Discover the web</h2>
            <p className="muted">
              Pick a familiar website and see how its digital journey unfolded.
            </p>
          </div>
          <Waypoints size={27} className="heading-icon" />
        </div>

        <div className="category-row" aria-label="Website categories">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={`category-chip ${category === item ? 'active' : ''}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="website-grid">
          {displayedWebsites.map((site) => (
            <article className="website-card" key={site.name}>
              <div className="website-card-top">
                <span
                  className="website-mark"
                  style={{ '--site-color': site.color } as React.CSSProperties}
                >
                  {site.name.charAt(0)}
                </span>
                <span className="website-category">{site.category}</span>
              </div>

              <h3>{site.name}</h3>
              <p>{site.description}</p>

              <button
                className="card-link"
                type="button"
                onClick={() => {
                  setQuery(site.url)
                  void searchWebsite(site.url)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                Explore timeline
                {indexArrow(site.name)}
              </button>
            </article>
          ))}

          {displayedWebsites.length === 0 && (
            <div className="empty-state">
              No websites match that search. Try another name or category.
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <History size={18} />
          Digital Time Machine
        </div>
        <p>
          Historical snapshots are provided by the Internet Archive’s Wayback
          Machine. Archived pages may not display exactly as they originally
          appeared.
        </p>
        <a
          href="https://web.archive.org/"
          target="_blank"
          rel="noreferrer"
        >
          Visit the Internet Archive <ArrowUpRight size={14} />
        </a>
        <span className="footer-bottom">
          Made to explore the evolution of the web.
          <ArrowDownRight size={14} />
        </span>
      </footer>
    </main>
  )
}

function indexArrow(_name: string) {
  return <ArrowUpRight size={16} />
}

export default App
