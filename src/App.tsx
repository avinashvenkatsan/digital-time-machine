
import { useState } from 'react';
import {
  ArrowUpRight,
  Clock3,
  Globe,
  History,
  Search,
  ExternalLink,
  CalendarDays,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import './App.css';

type Snapshot = {
  timestamp: string;
  original: string;
  statuscode: string;
};

type Website = {
  name: string;
  url: string;
  category: string;
  description: string;
  year: string;
};

const websites: Website[] = [
  {
    name: 'Google',
    url: 'https://www.google.com',
    category: 'Technology',
    description: 'Explore the evolution of the world’s most popular search engine.',
    year: '1998',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com',
    category: 'Entertainment',
    description: 'Travel back through the history of online video.',
    year: '2005',
  },
  {
    name: 'Wikipedia',
    url: 'https://www.wikipedia.org',
    category: 'Education',
    description: 'Discover how the free encyclopedia has changed over time.',
    year: '2001',
  },
  {
    name: 'Amazon',
    url: 'https://www.amazon.com',
    category: 'Shopping',
    description: 'See the transformation from online bookstore to global marketplace.',
    year: '1995',
  },
  {
    name: 'Apple',
    url: 'https://www.apple.com',
    category: 'Technology',
    description: 'Explore decades of Apple product launches and design.',
    year: '1996',
  },
  {
    name: 'NASA',
    url: 'https://www.nasa.gov',
    category: 'Science',
    description: 'Journey through the online history of space exploration.',
    year: '1994',
  },
];

const categories = [
  'All',
  'Technology',
  'Entertainment',
  'Education',
  'Shopping',
  'Science',
];

function normalizeWebsiteUrl(input: string): string {
  let value = input.trim();

  if (!value) {
    throw new Error('Enter a website URL or domain to begin.');
  }

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Enter a valid website, such as google.com.');
  }

  if (!parsed.hostname.includes('.')) {
    throw new Error('Enter a complete domain, such as example.com.');
  }

  return parsed.hostname.replace(/^www\./i, '');
}

function formatTimestamp(timestamp: string): string {
  if (!/^\d{14}$/.test(timestamp)) {
    return timestamp;
  }

  const date = new Date(
    `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}T${timestamp.slice(8, 10)}:${timestamp.slice(10, 12)}:${timestamp.slice(12, 14)}Z`
  );

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function getYear(timestamp: string): string {
  return timestamp.slice(0, 4);
}

function getArchivedUrl(snapshot: Snapshot): string {
  return `https://web.archive.org/web/${snapshot.timestamp}/${snapshot.original}`;
}

function App() {
  const [input, setInput] = useState('');
  const [searchedDomain, setSearchedDomain] = useState('');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<Snapshot | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const filteredWebsites =
    activeCategory === 'All'
      ? websites
      : websites.filter(
          (website) => website.category === activeCategory
        );

  async function searchWebsite(value: string = input) {
    setError('');
    setSuccessMessage('');
    setSnapshots([]);
    setSelectedSnapshot(null);

    let domain: string;

    try {
      domain = normalizeWebsiteUrl(value);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Please enter a valid website URL.'
      );
      return;
    }

    setInput(value);
    setSearchedDomain(domain);
    setLoading(true);

    try {
      const query = new URLSearchParams({
        url: `${domain}/*`,
        output: 'json',
        fl: 'timestamp,original,statuscode',
        filter: 'statuscode:200',
        collapse: 'timestamp:4',
        from: '1990',
        to: '2026',
        limit: '100',
      });

      // The Wayback CDX endpoint does not reliably permit
      // direct browser requests because of CORS restrictions.
      const endpoint =
        'https://proxy.cors.dev/https://web.archive.org/cdx/search/cdx?' +
        query.toString();

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Archive request failed (HTTP ${response.status}). Please try again.`
        );
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data) || data.length < 2) {
        throw new Error(
          'No archived snapshots were found for this website. Try another domain.'
        );
      }

      const rows = data.slice(1) as unknown[][];

      const results: Snapshot[] = rows
        .filter(
          (row) =>
            Array.isArray(row) &&
            typeof row[0] === 'string' &&
            typeof row[1] === 'string'
        )
        .map((row) => ({
          timestamp: String(row[0]),
          original: String(row[1]),
          statuscode: String(row[2] ?? '200'),
        }))
        .filter((snapshot) => /^\d{14}$/.test(snapshot.timestamp))
        .sort((a, b) =>
          a.timestamp.localeCompare(b.timestamp)
        );

      if (results.length === 0) {
        throw new Error(
          'The archive did not return usable snapshots. Try another website.'
        );
      }

      setSnapshots(results);
      setSelectedSnapshot(results[results.length - 1]);
      setSuccessMessage(
        `Found ${results.length} archived snapshots for ${domain}.`
      );
    } catch (err) {
      console.error('Digital Time Machine search error:', err);

      setError(
        err instanceof Error
          ? `${err.message} The public archive proxy may be unavailable or rate-limited.`
          : 'Unable to retrieve historical snapshots. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchWebsite(input);
  }

  function resetSearch() {
    setInput('');
    setSearchedDomain('');
    setSnapshots([]);
    setSelectedSnapshot(null);
    setError('');
    setSuccessMessage('');
  }

  const firstYear =
    snapshots.length > 0 ? getYear(snapshots[0].timestamp) : '';

  const lastYear =
    snapshots.length > 0
      ? getYear(snapshots[snapshots.length - 1].timestamp)
      : '';

  const uniqueYears = Array.from(
    new Set(snapshots.map((snapshot) => getYear(snapshot.timestamp)))
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#home"
          onClick={resetSearch}
          aria-label="Digital Time Machine home"
        >
          <span className="brand-icon">
            <History size={23} />
          </span>
          <span>
            <strong>Digital Time Machine</strong>
            <small>Website Evolution Explorer</small>
          </span>
        </a>

        <nav className="topbar-links">
          <a href="#explore">Explore</a>
          <a href="#how-it-works">How it works</a>
          <a
            className="archive-link"
            href="https://web.archive.org/"
            target="_blank"
            rel="noreferrer"
          >
            Internet Archive <ExternalLink size={14} />
          </a>
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-badge">
            <Sparkles size={14} />
            THE INTERNET, THROUGH TIME
          </div>

          <h1>
            Every website has
            <br />
            <span>a story to tell.</span>
          </h1>

          <p className="hero-description">
            Travel through the history of the web. Discover how your
            favorite websites looked years ago, one snapshot at a time.
          </p>

          <form className="search-form" onSubmit={handleSearchSubmit}>
            <Globe className="search-globe" size={21} />

            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Enter a website URL, e.g. google.com"
              aria-label="Website URL"
              disabled={loading}
            />

            {input && !loading && (
              <button
                type="button"
                className="clear-button"
                onClick={() => setInput('')}
                aria-label="Clear website URL"
              >
                ×
              </button>
            )}

            <button
              type="submit"
              className="search-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle className="spin" size={17} />
                  Searching
                </>
              ) : (
                <>
                  <Search size={17} />
                  Explore history
                </>
              )}
            </button>
          </form>

          <div className="search-hint">
            <ShieldCheck size={15} />
            Powered by historical captures from the Internet Archive
          </div>

          {error && (
            <div className="message message-error" role="alert">
              <span className="message-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          {successMessage && !error && (
            <div className="message message-success" role="status">
              <ShieldCheck size={18} />
              <span>{successMessage}</span>
            </div>
          )}
        </section>

        {loading && (
          <section className="loading-panel" aria-live="polite">
            <LoaderCircle size={30} className="spin" />
            <h2>Travelling back in time...</h2>
            <p>Searching historical website captures. This may take a moment.</p>
          </section>
        )}

        {snapshots.length > 0 && !loading && (
          <section className="results-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">YOUR JOURNEY THROUGH TIME</span>
                <h2>Website history</h2>
                <p className="section-subtitle">
                  Historical captures of <strong>{searchedDomain}</strong>
                </p>
              </div>

              <button className="secondary-button" onClick={resetSearch}>
                <RotateCcw size={15} />
                New search
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">
                  <History size={20} />
                </span>
                <div>
                  <span className="stat-label">SNAPSHOTS FOUND</span>
                  <strong>{snapshots.length}</strong>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">
                  <CalendarDays size={20} />
                </span>
                <div>
                  <span className="stat-label">FIRST CAPTURE</span>
                  <strong>{firstYear || '—'}</strong>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">
                  <Clock3 size={20} />
                </span>
                <div>
                  <span className="stat-label">LATEST CAPTURE</span>
                  <strong>{lastYear || '—'}</strong>
                </div>
              </div>
            </div>

            <div className="history-layout">
              <div className="timeline-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Timeline</h3>
                    <p>Select a snapshot to travel to that date.</p>
                  </div>
                  <span className="count-pill">
                    {uniqueYears.length} years
                  </span>
                </div>

                <div className="timeline">
                  {uniqueYears.map((year) => {
                    const yearSnapshots = snapshots.filter(
                      (snapshot) => getYear(snapshot.timestamp) === year
                    );

                    return (
                      <div className="timeline-year" key={year}>
                        <div className="year-marker">
                          <span className="timeline-dot" />
                          <strong>{year}</strong>
                          <span className="year-count">
                            {yearSnapshots.length}
                          </span>
                        </div>

                        <div className="snapshot-list">
                          {yearSnapshots.map((snapshot) => {
                            const selected =
                              selectedSnapshot?.timestamp ===
                                snapshot.timestamp &&
                              selectedSnapshot?.original ===
                                snapshot.original;

                            return (
                              <button
                                className={`snapshot-item ${
                                  selected ? 'snapshot-selected' : ''
                                }`}
                                key={`${snapshot.timestamp}-${snapshot.original}`}
                                onClick={() =>
                                  setSelectedSnapshot(snapshot)
                                }
                              >
                                <span className="snapshot-date">
                                  {formatTimestamp(snapshot.timestamp)}
                                </span>
                                <span className="snapshot-status">
                                  {snapshot.statuscode}
                                </span>
                                <ArrowUpRight size={16} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <aside className="preview-panel">
                <div className="preview-top">
                  <span className="preview-label">
                    <span className="live-dot" />
                    SELECTED SNAPSHOT
                  </span>
                  <span className="preview-icon">
                    <Globe size={22} />
                  </span>
                </div>

                {selectedSnapshot ? (
                  <>
                    <div className="preview-date">
                      {formatTimestamp(selectedSnapshot.timestamp)}
                    </div>

                    <h3>{searchedDomain}</h3>

                    <p className="preview-description">
                      View the archived version of this website as it
                      appeared on the selected date.
                    </p>

                    <div className="preview-details">
                      <div>
                        <span>Capture date</span>
                        <strong>
                          {formatTimestamp(selectedSnapshot.timestamp)}
                        </strong>
                      </div>
                      <div>
                        <span>Archive status</span>
                        <strong>
                          HTTP {selectedSnapshot.statuscode}
                        </strong>
                      </div>
                    </div>

                    <a
                      className="open-snapshot-button"
                      href={getArchivedUrl(selectedSnapshot)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <History size={17} />
                      Open this moment
                      <ArrowUpRight size={17} />
                    </a>

                    <p className="preview-note">
                      Opens the archived website in a new tab.
                    </p>
                  </>
                ) : (
                  <div className="empty-preview">
                    <History size={34} />
                    <p>Select a date on the timeline.</p>
                  </div>
                )}
              </aside>
            </div>
          </section>
        )}

        <section id="explore" className="discover-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A TRIP DOWN MEMORY LANE</span>
              <h2>Start with an icon</h2>
              <p className="section-subtitle">
                Explore the websites that shaped the digital world.
              </p>
            </div>
          </div>

          <div className="category-list" aria-label="Filter websites">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-button ${
                  activeCategory === category ? 'category-active' : ''
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="website-grid">
            {filteredWebsites.map((website) => (
              <article className="website-card" key={website.name}>
                <div className="website-card-top">
                  <span className="website-initial">
                    {website.name.charAt(0)}
                  </span>
                  <span className="website-year">
                    Since {website.year}
                  </span>
                </div>

                <span className="website-category">
                  {website.category}
                </span>

                <h3>{website.name}</h3>
                <p>{website.description}</p>

                <button
                  className="website-explore-button"
                  onClick={() => {
                    setActiveCategory('All');
                    setInput(website.url);
                    void searchWebsite(website.url);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={loading}
                >
                  Explore history
                  <ArrowUpRight size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="how-section">
          <span className="eyebrow">BEHIND THE TIME MACHINE</span>
          <h2>The past is still out there.</h2>
          <p>
            The Internet Archive's Wayback Machine preserves snapshots of
            websites over time. Search a domain, choose an archived date,
            and open the preserved page to see how the web has evolved.
          </p>

          <a
            href="https://web.archive.org/"
            target="_blank"
            rel="noreferrer"
            className="learn-link"
          >
            Learn about the Wayback Machine
            <ExternalLink size={15} />
          </a>
        </section>
      </main>

      <footer className="footer">
        <a className="footer-brand" href="#home">
          <History size={18} />
          Digital Time Machine
        </a>
        <p>
          An independent website exploration project. Historical captures
          are provided by the Internet Archive.
        </p>
        <span>© {new Date().getFullYear()} Digital Time Machine</span>
      </footer>
    </div>
  );
}

export default App;
