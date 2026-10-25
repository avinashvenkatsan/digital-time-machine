```javascript
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Frontend production build directory
const distPath = path.join(__dirname, '..', 'dist');

app.disable('x-powered-by');

// In-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
const REQUEST_TIMEOUT = 60000;

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Digital Time Machine API',
  });
});

// Search archived website snapshots
app.get('/api/snapshots', async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();

  if (!rawUrl || rawUrl.length > 2048) {
    return res.status(400).json({
      error: 'Enter a website, such as google.com.',
    });
  }

  let hostname;

  // Validate the requested website
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

  // Return cached results when available
  const cached = cache.get(hostname);

  if (cached && Date.now() - cached.time < CACHE_TTL) {
    res.set('Cache-Control', 'public, max-age=300');
    return res.json(cached.data);
  }

  const startedAt = Date.now();

  try {
    // Build Internet Archive CDX API request
    const params = new URLSearchParams({
      url: hostname,
      output: 'json',
      fl: 'timestamp,original,statuscode',
      filter: 'statuscode:200',
      collapse: 'timestamp:4',
      from: '1990',
      to: String(new Date().getUTCFullYear()),
      limit: '50',
    });

    const archiveUrl =
      `https://web.archive.org/cdx/search/cdx?${params.toString()}`;

    console.log(`[Snapshots] Searching: ${hostname}`);

    // Contact Internet Archive
    const response = await fetch(archiveUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DigitalTimeMachine/1.0',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    console.log(
      `[Snapshots] HTTP ${response.status}; elapsed ${
        Date.now() - startedAt
      }ms`
    );

    // Handle unsuccessful HTTP responses
    if (!response.ok) {
      if (response.status === 429) {
        return res.status(503).json({
          error:
            'The Internet Archive is rate-limiting requests. Please try again later.',
        });
      }

      return res.status(502).json({
        error:
          `Internet Archive returned HTTP ${response.status}.`,
      });
    }

    // Parse the API response
    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(502).json({
        error: 'Internet Archive returned an unexpected response.',
      });
    }

    // CDX JSON normally starts with a header row
    if (data.length <= 1) {
      return res.status(404).json({
        error:
          'No archived snapshots were found for this website.',
      });
    }

    // Cache successful results
    cache.set(hostname, {
      time: Date.now(),
      data,
    });

    // Keep cache size bounded
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
      hostname,
      name: error.name,
      message: error.message,
      elapsedMs: Date.now() - startedAt,
    });

    if (
      error.name === 'TimeoutError' ||
      error.name === 'AbortError'
    ) {
      return
