# Digital Time Machine — Website Evolution Explorer

Explore the past. Understand the web. Discover how the internet evolved.

Digital Time Machine is a responsive React application for searching real archived website snapshots from the Internet Archive's Wayback Machine. Search a public URL, inspect returned timestamps, open a historical version, compare dates, and save favorites locally.

## Features

- Search a website by URL or domain; HTTP and HTTPS are supported.
- Retrieve actual snapshot metadata from the Internet Archive CDX API.
- Navigate snapshots by year and timestamp, including earliest/latest and previous/next controls.
- Open archived snapshots in a separate tab, isolated from the app.
- Compare two archived dates with independent Wayback links.
- Save favorites and recent searches in browser local storage.
- Browse a curated website discovery gallery. Gallery entries are suggestions, not claims of archive availability.
- Responsive layout, keyboard focus indicators, loading/error/empty states, and reduced-motion support.

## Technology stack

- React 18, TypeScript, Vite
- Tailwind CSS v4 (Vite plugin)
- Lucide React
- Internet Archive CDX API
- Local Storage
- Vitest and jsdom

## Requirements

- Node.js 20 or later recommended
- npm
- Internet access to query the Internet Archive

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Build and preview

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

The tests focus on URL normalization and timestamp formatting. Live archive availability should be tested separately because results and API availability change over time.

## Data source and attribution

Snapshot metadata is requested from the Internet Archive's CDX API at `https://web.archive.org/cdx/search/cdx`. Archived pages open using Wayback Machine URLs at `https://web.archive.org/web/<timestamp>/<original-url>`.

The Internet Archive is an independent third-party service. This project is not affiliated with or endorsed by the Internet Archive. API availability, access rules, and archived content are controlled by the archive.

## Architecture

```text
src/
├── components/      # Navigation, search, timeline, viewer, cards
├── data/            # Curated discovery websites
├── services/        # CDX API requests and archive URL generation
├── types/           # Snapshot and website models
├── utils/           # URL normalization and date formatting
├── App.tsx          # Pages and application state
├── main.tsx         # React entry point
└── styles.css       # Responsive visual system
```

## Known limitations

- A website may have no snapshots, or only a limited set of archived pages.
- The CDX API may be unavailable, rate-limited, or restricted by browser/network policy.
- This client-side version calls the public CDX endpoint directly. If your deployment environment blocks cross-origin requests, a carefully restricted server-side proxy may be needed. Do not create an unrestricted URL-fetching proxy.
- The viewer opens archive content in a separate tab instead of embedding untrusted archived pages in the app.
- Archived images, scripts, forms, video, and interactive features may be incomplete or non-functional.
- Comparison currently offers date selection and separate archive links. It does not take screenshots, compute visual difference percentages, or generate automated design summaries.
- Favorites and recent searches are stored in the current browser only; they do not sync across devices.
- No login, database, paid service, AI integration, or cloud infrastructure is required.

## Screenshots

Add screenshots of your running application here before publishing, for example:

```text
docs/screenshots/home.png
docs/screenshots/explorer.png
docs/screenshots/compare.png
```

## License

MIT. See `LICENSE`.
