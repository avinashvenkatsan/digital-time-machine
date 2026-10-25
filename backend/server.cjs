
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Digital Time Machine API' });
});

app.get('/api/snapshots', async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();

  let hostname;

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
    );

    hostname = parsed.hostname.toLowerCase();
  } catch {
    return res.status(400).json({
      error: 'Enter a valid website, such as google.com.',
    });
  }

  if (
    !hostname.includes('.') ||
    !/^[a-z0-9.-]+$/.test(hostname) ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost')
  ) {
    return res.status(400).json({ error: 'Invalid website domain.' });
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
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      console.error('Internet Archive HTTP status:', response.status);

      return res.status(response.status === 429 ? 503 : 502).json({
        error:
          response.status === 429
            ? 'The Internet Archive is temporarily rate-limiting requests. Wait a little and try again.'
            : `The Internet Archive returned HTTP ${response.status}.`,
      });
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(502).json({
        error: 'The Internet Archive returned an unexpected response.',
      });
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

// Serve the built React website from the same service.
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(distPath, 'index.html'), (error) => {
    if (error) next(error);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Digital Time Machine running on port ${PORT}`);
});
