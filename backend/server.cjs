
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// server.cjs is inside /backend, while dist is in the project root.
const distPath = path.join(__dirname, '..', 'dist');

app.disable('x-powered-by');

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Digital Time Machine API',
  });
});

// Find archived website snapshots
app.get('/api/snapshots', async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();

  if (!rawUrl || rawUrl.length > 2048) {
    return res.status(400).json({
      error: 'Enter a website, such as google.com.',
    });
  }

  let hostname;

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(rawUrl)
        ? rawUrl
        : `https://${rawUrl}`
    );

    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    ) {
      throw new Error('Invalid URL');
    }

    hostname = parsed.hostname.toLowerCase();

    // Accept public DNS hostnames only.
    if (
      !hostname.includes('.') ||
      !/^[a-z0-9.-]+$/.test(hostname) ||
      hostname.startsWith('.') ||
      hostname.endsWith('.') ||
      hostname.includes('..') ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
    ) {
      throw new Error('Invalid public domain');
    }
  } catch {
    return res.status(400).json({
      error: 'Enter a valid public website, such as google.com.',
    });
  }

  // Return cached results when available.
  const cached = cache.get(hostname);

  if (cached && Date.now() - cached.time < CACHE_TTL) {
    res.set('Cache-Control', 'public, max-age=300');
    return res.json(cached.data);
  }

  try {
    const params = new URLSearchParams({
      url: `${hostname}/*`,
      output: 'json',
      fl: 'timestamp,original,statuscode',
      filter: 'statuscode:200',
      collapse: 'timestamp:4',
      from: '1990',
      to: String(new Date().getUTCFullYear()),
      limit: '100',
    });

    const archiveUrl =
      `https://web.archive.org/cdx/search/cdx?${params.toString()}`;

    const response = await fetch(archiveUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DigitalTimeMachine/1.0',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      console.error(
        'Internet Archive HTTP status:',
        response.status
      );

      if (response.status === 429) {
        return res.status(503).json({
          error:
            'The Internet Archive is temporarily limiting requests. Please wait and try again.',
        });
      }

      return res.status(502).json({
        error:
          `The Internet Archive returned HTTP ${response.status}. Please try again later.`,
      });
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(502).json({
        error:
          'The Internet Archive returned an unexpected response.',
      });
    }

    // CDX JSON normally contains a header row followed by records.
    if (data.length <= 1) {
      return res.status(404).json({
        error:
          'No archived snapshots were found for this website.',
      });
    }

    cache.set(hostname, {
      time: Date.now(),
      data,
    });

    // Keep the in-memory cache bounded.
    if (cache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value;

      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    res.set('Cache-Control', 'public, max-age=300');
    return res.json(data);
  } catch (error) {
    console.error('Snapshot request failed:', error);

    return res.status(502).json({
      error:
        'Could not contact the Internet Archive. Please try again later.',
    });
  }
});

// Serve the built React frontend.
app.use(express.static(distPath));

// Express 5-compatible fallback for frontend routes.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found.',
    });
  }

  res.sendFile(
    path.join(distPath, 'index.html'),
    (error) => {
      if (error) next(error);
    }
  );
});

// Final error handler.
app.use((error, _req, res, _next) => {
  console.error('Server error:', error);

  if (res.headersSent) return;

  res.status(500).json({
    error: 'An unexpected server error occurred.',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Digital Time Machine running on port ${PORT}`
  );
});
