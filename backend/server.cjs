```javascript
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = path.join(__dirname, '..', 'dist');

app.disable('x-powered-by');

// Cache settings
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
const REQUEST_TIMEOUT = 60000;

// API health check
app.get('/api/health', function (_req, res) {
  res.json({
    status: 'ok',
    service: 'Digital Time Machine API',
  });
});

// Search Internet Archive snapshots
app.get('/api/snapshots', async function (req, res) {
  const rawUrl = String(req.query.url || '').trim();

  if (!rawUrl || rawUrl.length > 2048) {
    return res.status(400).json({
      error: 'Enter a website, such as google.com.',
    });
  }

  let hostname;

  // Validate the submitted website
  try {
    const normalizedUrl = /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : 'https://' + rawUrl;

    const parsed = new URL(normalizedUrl);

    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    ) {
      throw new Error('Invalid URL');
    }

    hostname = parsed.hostname.toLowerCase();

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
  } catch (_error) {
    return res.status(400).json({
      error: 'Enter a valid public website, such as google.com.',
    });
  }

  // Check cache
  const cached = cache.get(hostname);

  if (cached && Date.now() - cached.time < CACHE_TTL) {
    res.set('Cache-Control', 'public, max-age=300');
    return res.json(cached.data);
  }

  const startedAt = Date.now();

  try {
    // Build the Internet Archive CDX API URL
    const params = new URLSearchParams();

    params.set('url', hostname);
    params.set('output', 'json');
    params.set('fl', 'timestamp,original,statuscode');
    params.set('filter', 'statuscode:200');
    params.set('collapse', 'timestamp:4');
    params.set('from', '1990');
    params.set('to', String(new Date().getUTCFullYear()));
    params.set('limit', '50');

    const archiveUrl =
      'https://web.archive.org/cdx/search/cdx?' +
      params.toString();

    console.log('[Snapshots] Searching: ' + hostname);

    const response = await fetch(archiveUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DigitalTimeMachine/1.0',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    console.log(
      '[Snapshots] HTTP ' +
        response.status +
        '; elapsed ' +
        (Date.now() - startedAt) +
        'ms'
    );

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(503).json({
          error:
            'The Internet Archive is rate-limiting requests. Please try again later.',
        });
      }

      return res.status(502).json({
        error:
          'Internet Archive returned HTTP ' + response.status + '.',
      });
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(502).json({
        error: 'Internet Archive returned an unexpected response.',
      });
    }

    // CDX JSON contains a header row followed by snapshot rows
    if (data.length <= 1) {
      return res.status(404).json({
        error: 'No archived snapshots were found for this website.',
      });
    }

    // Save successful response in cache
    cache.set(hostname, {
      time: Date.now(),
      data: data,
    });

    // Keep the cache bounded
    if (cache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value;

      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    res.set('Cache-Control', 'public, max-age=300');
    return res.json(data);
  } catch (error) {
    console.error('[Snapshots] Request failed:', {
      hostname: hostname,
      name: error.name,
      message: error.message,
      elapsedMs: Date.now() - startedAt,
    });

    if (
      error.name === 'TimeoutError' ||
      error.name === 'AbortError'
    ) {
      return res.status(504).json({
        error:
          'Internet Archive took too long to respond. Please try again.',
      });
    }

    return res.status(502).json({
      error:
        'Could not connect to the Internet Archive. Check server logs for details.',
    });
  }
});

// Serve the frontend build
app.use(express.static(distPath));

// Handle frontend routes and unknown API routes
app.use(function (req, res, next) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found.',
    });
  }

  res.sendFile(
    path.join(distPath, 'index.html'),
    function (error) {
      if (error) {
        next(error);
      }
    }
  );
});

// Global error handler
app.use(function (error, _req, res, _next) {
  console.error('[Server] Error:', error);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    error: 'An unexpected server error occurred.',
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', function () {
  console.log(
    'Digital Time Machine running on port ' + PORT
  );
});
```
