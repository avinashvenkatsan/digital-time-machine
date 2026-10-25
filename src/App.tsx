
import { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Calendar,
  Clock3,
  ExternalLink,
  Globe2,
  History,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import './App.css';

type Snapshot = {
  timestamp: string;
  original: string;
  statuscode: string;
};

const popularSites = [
  { name: 'Google', url: 'google.com', symbol: 'G' },
  { name: 'YouTube', url: 'youtube.com', symbol: '▶' },
  { name: 'Wikipedia', url: 'wikipedia.org', symbol: 'W' },
  { name: 'Apple', url: 'apple.com', symbol: '●' },
  { name: 'NASA', url: 'nasa.gov', symbol: 'N' },
  { name: 'Amazon', url: 'amazon.com', symbol: 'a' },
];

function normalizeDomain(value: string): string {
  const input = value.trim();

  if (!input) {
    throw new Error('Enter a website address to get started.');
  }

  let parsed: URL;

  try {
    parsed = new URL(
      /^https?:\/\//i.test(input) ? input : `https://${input}`
    );
  } catch {
    throw new Error('Enter a valid address, such as google.com.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Use a valid HTTP or HTTPS website.');
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    !hostname.includes('.') ||
    !/^[a-z0-9.-]+$/.test(hostname) ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  ) {
    throw new Error('Enter a public website, such as wikipedia.org.');
  }

  return hostname;
}

function getYear(timestamp: string): string {
  return timestamp.slice(0, 4);
}

function formatDate(timestamp: string): string {
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

function getArchivedUrl(snapshot: Snapshot): string {
  return `https://web.archive.org/web/${snapshot.timestamp}/${snapshot.original}`;
}

export default function App() {
  const [website, setWebsite] = useState('');
  const [searchedDomain, setSearchedDomain] = useState('');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selected, setSelected] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function searchWebsite(value = website) {
    setError('');
    setSuccess('');
    setSnapshots([]);
    setSelected(null);

    let domain: string;

    try {
      domain = normalizeDomain(value);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Invalid website address.'
      );
      return;
    }

    setWebsite(value);
    setLoading(true);
    setSearchedDomain(domain);

    try {
      const response = await fetch(
        `/api/snapshots?url=${encodeURIComponent(domain)}`
      );

      if (!response.ok) {
        let message = `Request failed (HTTP ${response.status}).`;

        try {
          const body: { error?: string } = await response.json();
          if (typeof body.error === 'string') {
            message = body.error;
          }
        } catch {
          // Use the fallback message if the response isn't JSON.
        }

        throw new Error(message);
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data) || data.length < 2) {
        throw new Error(
          'No historical snapshots were found for this website.'
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
          'The Archive returned no usable historical snapshots.'
        );
      }

      setSnapshots(results);
      setSelected(results[results.length - 1]);
      setSuccess(
        `Found ${results.length} archived snapshots for ${domain}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const firstYear = snapshots.length
    ? getYear(snapshots[0].timestamp)
    : '—';

  const lastYear = snapshots.length
    ? getYear(snapshots[snapshots.length - 1].timestamp)
    : '—';

  const years = Array.from(
    new Set(snapshots.map((snapshot) => getYear(snapshot.timestamp)))
  );

  return (
    <main>
      <nav className="navbar">
        <a className="brand" href="#top" aria-label="Digital Time Machine home">
          <span className="brand-icon">
            <History size={22} />
          </span>
          <span>
            Digital<span className="brand-accent">Time</span>
            <small>MACHINE</small>
          </span>
        </a>

        <div className="nav-links">
          <a href="#explore">Explore</a>
          <a href="#how-it-works">How it works</a>
          <a
            className="archive-link"
            href="https://web.archive.org/"
            target="_blank"
            rel="noreferrer"
          >
            Internet Archive <ExternalLink size={13} />
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-glow glow-one" />
        <div className="hero-glow glow-two" />

        <div className="hero-content">
          <div className="eyebrow">
            <Sparkles size={14} />
            THE INTERNET, THROUGH TIME
          </div>

          <h1>
            Every website
            <br />
            has a <span>story to tell.</span>
          </h1>

          <p className="hero-description">
            Travel through the history of the web. Discover how websites
            looked years ago and explore their digital evolution.
          </p>

          <form
            className="search-form"
            onSubmit={(event) => {
              event.preventDefault();
              void searchWebsite();
            }}
          >
            <Globe2 className="search-globe" size={20} />
            <input
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="Enter a website, e.g. google.com"
              aria-label="Website address"
              autoComplete="url"
            />
            <button type="submit" disabled={loading}>
              {loading ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Search size={18} />
              )}
              <span>{loading ? 'Exploring...' : 'Explore history'}</span>
            </button>
          </form>

          <div className="search-note">
            <ShieldCheck size={14} />
            Powered by the Internet Archive's public snapshot index
          </div>

          {error && (
            <div className="message error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="message success-message" role="status">
              {success}
            </div>
          )}

          <div className="popular">
            <span>TRY A WEBSITE</span>
            <div className="popular-list">
              {popularSites.map((site) => (
                <button
                  key={site.name}
                  className="popular-chip"
                  type="button"
                  onClick={() => {
                    setWebsite(site.url);
                    void searchWebsite(site.url);
                  }}
                  disabled={loading}
                >
                  <span className="chip-symbol">{site.symbol}</span>
                  {site.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <a className="scroll-hint" href="#explore">
          <span>SCROLL TO EXPLORE</span>
          <ArrowDown size={15} />
        </a>
      </section>

      <section className="explore-section" id="explore">
        <div className="section-heading">
          <div>
            <div className="eyebrow muted-eyebrow">
              <Clock3 size={14} />
              HISTORY EXPLORER
            </div>
            <h2>
              The web, <span>rewound.</span>
            </h2>
            <p>
              {snapshots.length
                ? `Historical records for ${searchedDomain}`
                : 'Search for a website to reveal its archived history.'}
            </p>
          </div>

          {snapshots.length > 0 && (
            <div className="result-pill">
              <span className="status-dot" />
              {snapshots.length} snapshots
            </div>
          )}
        </div>

        <div className="stats-grid">
          <article className="stat-card">
            <span className="stat-icon">
              <History size={19} />
            </span>
            <span className="stat-label">SNAPSHOTS FOUND</span>
            <strong>{snapshots.length || '—'}</strong>
            <span className="stat-foot">Archived records</span>
          </article>

          <article className="stat-card">
            <span className="stat-icon">
              <Calendar size={19} />
            </span>
            <span className="stat-label">FIRST YEAR</span>
            <strong>{firstYear}</strong>
            <span className="stat-foot">Earliest result returned</span>
          </article>

          <article className="stat-card">
            <span className="stat-icon">
              <Sparkles size={19} />
            </span>
            <span className="stat-label">LATEST YEAR</span>
            <strong>{lastYear}</strong>
            <span className="stat-foot">Latest result returned</span>
          </article>
        </div>

        <div className="timeline-panel">
          <div className="panel-heading">
            <div>
              <h3>Timeline of the web</h3>
              <p>Select a year to explore a saved version.</p>
            </div>
            <span className="timeline-tag">CHRONOLOGY</span>
          </div>

          {snapshots.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <History size={28} />
              </div>
              <h3>Your journey starts here</h3>
              <p>
                Enter a website above to discover when its pages were
                archived and open a historical version.
              </p>
              <button
                className="text-button"
                onClick={() => {
                  document.querySelector('#top')?.scrollIntoView({
                    behavior: 'smooth',
                  });
                }}
                type="button"
              >
                Search a website <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <>
              <div className="year-strip">
                {years.map((year) => (
                  <button
                    type="button"
                    key={year}
                    className={
                      selected && getYear(selected.timestamp) === year
                        ? 'year-chip selected-year'
                        : 'year-chip'
                    }
                    onClick={() => {
                      const match = snapshots.find(
                        (snapshot) => getYear(snapshot.timestamp) === year
                      );
                      if (match) setSelected(match);
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>

              <div className="timeline-list">
                {snapshots.map((snapshot, index) => (
                  <button
                    className={
                      selected?.timestamp === snapshot.timestamp &&
                      selected?.original === snapshot.original
                        ? 'timeline-item active-timeline-item'
                        : 'timeline-item'
                    }
                    key={`${snapshot.timestamp}-${snapshot.original}-${index}`}
                    type="button"
                    onClick={() => setSelected(snapshot)}
                  >
                    <span className="timeline-marker" />
                    <span className="timeline-date">
                      {formatDate(snapshot.timestamp)}
                    </span>
                    <span className="timeline-url">
                      {snapshot.original}
                    </span>
                    <ArrowRight className="timeline-arrow" size={16} />
                  </button>
                ))}
              </div>

              {selected && (
                <div className="selected-preview">
                  <div className="preview-copy">
                    <span className="preview-label">SELECTED SNAPSHOT</span>
                    <h3>{formatDate(selected.timestamp)}</h3>
                    <p>
                      {selected.original}
                    </p>
                  </div>

                  <a
                    className="open-snapshot"
                    href={getArchivedUrl(selected)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open archived page <ExternalLink size={16} />
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="eyebrow muted-eyebrow">
          <Sparkles size={14} />
          BEHIND THE JOURNEY
        </div>
        <h2>
          History at your <span>fingertips.</span>
        </h2>
        <p className="how-intro">
          Explore preserved web pages through the public Internet Archive
          index. Not every page or year will have a saved copy.
        </p>

        <div className="how-grid">
          <article className="how-card">
            <span>01</span>
            <Globe2 size={23} />
            <h3>Choose a website</h3>
            <p>Enter a public domain to look for its historical records.</p>
          </article>

          <article className="how-card">
            <span>02</span>
            <History size={23} />
            <h3>Find its history</h3>
            <p>Browse the snapshot dates returned by the Archive.</p>
          </article>

          <article className="how-card">
            <span>03</span>
            <ExternalLink size={23} />
            <h3>Travel back in time</h3>
            <p>Open an archived page on the Internet Archive website.</p>
          </article>
        </div>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#top">
          <span className="brand-icon">
            <History size={20} />
          </span>
          <span>
            Digital<span className="brand-accent">Time</span>
            <small>MACHINE</small>
          </span>
        </a>

        <p>
          An independent web-history explorer. Historical records are
          provided by the Internet Archive.
        </p>

        <a
          href="https://web.archive.org/"
          target="_blank"
          rel="noreferrer"
        >
          Visit the Internet Archive <ExternalLink size={13} />
        </a>

        <span className="copyright">
          © {new Date().getFullYear()} Digital Time Machine
        </span>
      </footer>
    </main>
  );
}
