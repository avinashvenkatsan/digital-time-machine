/**
 * Normalize a user-entered website URL. Only HTTP(S) schemes are accepted.
 * Domains entered without a scheme are interpreted as HTTPS.
 */
export function normalizeWebsiteUrl(input: string): string {
  const value = input.trim()
  if (!value) throw new Error('Enter a website URL to begin exploring.')

  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value) ? value : `https://${value}`
  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    throw new Error('That URL does not look valid. Try a domain such as example.com.')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS website URLs are supported.')
  }
  if (!parsed.hostname || !parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
    throw new Error('Enter a valid domain name, such as example.com.')
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs containing usernames or passwords are not supported.')
  }

  parsed.hash = ''
  return parsed.toString().replace(/\/$/, '') || parsed.origin
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function formatTimestamp(timestamp: string): string {
  if (!/^\d{14}$/.test(timestamp)) return timestamp
  const date = new Date(
    Number(timestamp.slice(0, 4)),
    Number(timestamp.slice(4, 6)) - 1,
    Number(timestamp.slice(6, 8)),
    Number(timestamp.slice(8, 10)),
    Number(timestamp.slice(10, 12)),
    Number(timestamp.slice(12, 14)),
  )
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function yearFromTimestamp(timestamp: string): string {
  return timestamp.slice(0, 4)
}